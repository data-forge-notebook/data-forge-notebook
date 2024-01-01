import { ISerializedNotebook1, ISerializedCellOutputValue1, ISerializedCell1 } from "model";
import { BasicEventHandler } from "utils";
import { CodeGenerator } from "./code-generator";
import { ILog } from "utils";
import * as vm from 'vm';
import { formatErrorMessage, ErrorSource } from "./format-error-message";
import { ISourceMap, mergeSourceMaps, SourceMap } from "source-map-lib";
import { CellType } from "model";
import { IAsyncTracker, AsyncTracker } from "./async-tracker";
import { AsyncResource, executionAsyncId } from "async_hooks";
import * as fs from "fs";
import { EventEmitter } from "events";
import { INpm } from "./npm";
import { performance } from "perf_hooks";
import stripAnsi from 'strip-ansi';
import { IFileLocation } from "./babel-compile";

//
// Maximum number of outputs before outputs are capped.
//
const MAX_OUTPUTS = 1000;

//
// Save the original require, can't access it from within a DFN script.
//
const originalRequire = require;
const resolve = require('resolve-cwd');

//
// Event raised relating to a particular cell.
//
export type CellEventHandler = (cellId: string) => void;

//
// Event raised when a particular cell displays some output.
//
export type DisplayEventHandler = (cellId: string, output: ISerializedCellOutputValue1) => void;

//
// Event raised when a particular cell has an error.
//
export type ErrorEventHandler = (cellId: string, error: string) => void;

//
// Evaluates code for Data-Forge Notebook.
//

export interface ICodeEvaluator {

    //
    // Event raised when evaluation of a particular cell has started.
    //
    onCellEvalStarted?: CellEventHandler;
    
    //
    // Event raised when evaluation of a particular cell has ended.
    //
    onCellEvalEnded?: CellEventHandler;

    //
    // Event raised when evaluation has completed.
    //
    onEvaluationCompleted?: () => void;

    //
    // Event raised when a cell's output has been capped.
    //
    onOutputCapped?: BasicEventHandler;

    //
    // Event raised when a cells displays some ouptut.
    //
    onDisplay?: DisplayEventHandler;

    //
    // Event raised when a cells displays some ouptut.
    //
    onError?: ErrorEventHandler;

    //
    // Evaluate code for a notebook.
    //
    evalCode(): void;

    //
    // Installs the notebook.
    //
    installNotebook(): Promise<void>;
}

export class CodeEvaluator implements ICodeEvaluator {

    //
    // Event raised when evaluation of a particular cell has started.
    //
    onCellEvalStarted?: CellEventHandler;
    
    //
    // Event raised when evaluation of a particular cell has ended.
    //
    onCellEvalEnded?: CellEventHandler;

    //
    // Event raised when evaluation has completed.
    //
    onEvaluationCompleted?: () => void;

    //
    // Event raised when a cell's output has been capped.
    //
    onOutputCapped?: BasicEventHandler;

    //
    // Event raised when a cells displays some ouptut.
    //
    onDisplay?: DisplayEventHandler;

    //
    // Event raised when a cells displays some ouptut.
    //
    onError?: ErrorEventHandler;

    //
    // Logging conduit.
    //
    private log: ILog;

    //
    // For interaction with npm.
    //
    private npm: INpm;

   
    //
    // The number of cells to be evaluated.
    //
    private numCells: number;

    //
    // Number of outputs received for the current cell.
    //
    private numOutputs = 0;

    //
    // Set to true when output has been capped.
    //
    private outputsCapped = false;

    //
    // Set to true after the last cell has executed, doesn't including indirect async operations.
    //
    private notebookCompleted = false; 

    //
    // set true when notebook has completed evaluation (set either from an error or from notebook completion plus completion of indirect async coperations).
    //
    private notebookFinished = false; 
    
    //
    // Tracks async operations for the notebook.
    //
    private readonly asyncTracker: IAsyncTracker = new AsyncTracker();

    //
    // Used to save and restore std output and error.
    //
    private oldStdoutWrite: any;
    private oldStderrWrite: any;
    
    //
    // The notebook to be evaluated.
    //
    private notebook: ISerializedNotebook1;
    
    //
    // Cells in the notebook to be evaluated.
    //
    private cells: ISerializedCell1[];

    //
    // Ids of the cells.
    //
    private cellIds: string[];

    //
    // Record the cells that have completed all async operations.
    //
    private cellsCompleted: boolean[];

    //
    // Caches the functions that retrieve local variable values.
    //
    private localsFnCache: any[];

    //
    // The file name of the notebook.
    //
    private fileName: string;

    //
    // The path to the notebook project.
    //
    private projectPath: string;

    //
    // Code that was generated for this notebook.
    //
    private code?: string;

    //
    // Original source map for generated code.
    //
    private origSourceMap?: ISourceMap;

    //
    // Final source map for generated code.
    //
    private finalSourceMap?: ISourceMap;

    //
    // Records the time that evaluation took.
    //
    private startTime: number | undefined = undefined;

    //
    // The passed in process object so global access can be controlled separately.
    //
    private process: NodeJS.Process;

    constructor(process: NodeJS.Process, notebook: ISerializedNotebook1, allCells: ISerializedCell1[], fileName: string, projectPath: string, npm: INpm, log: ILog) {
        this.process = process;
        this.npm = npm;
        this.log = log;
        this.notebook = notebook;
        this.cells = allCells.filter(cell => cell.cellType === CellType.Code);
        this.cellIds = this.cells.map(cell => cell.instanceId!);

        const numCells = this.cells.length;
        this.cellsCompleted = new Array(numCells);
        for (let cellIndex = 0; cellIndex < numCells; ++cellIndex) {
            this.cellsCompleted[cellIndex] = false;
        }

        //
        // Caches the functions that retrieve local variable values.
        //
        this.localsFnCache = new Array(numCells);

        this.fileName = fileName;
        this.projectPath = projectPath;
        this.numCells = numCells;
    }

    // 
    // Returns true if output is now capped.
    //
    private isOutputCapped(): boolean {
        if (this.outputsCapped) {
            // Already capped.
            return true;
        }

        if (this.numOutputs >= MAX_OUTPUTS) {
            if (!this.outputsCapped) {
                if (this.onOutputCapped) {
                    this.onOutputCapped(); // Let the user interface know that outputs have been capped.
                }
                this.outputsCapped = true;
            }
            return true;
        }

        ++this.numOutputs;
        return false;
    }

    //
    // Get the parent cell ID for a particular async operation.
    //
    private getParentCellIndex(asyncId: number): number | undefined {
        return this.asyncTracker.findCellIndex(asyncId);
    }

    //
    // Get the ID of the currently executing code cell, otherwise get the first cell's id.
    //
    private getCurCellId(): string {
        const asyncId = executionAsyncId()
        const cellIndex = this.getParentCellIndex(asyncId) || 0;
        return this.cellIds[cellIndex];
    }

    private display = (data: any, displayType?: string): void => {

        // this.log.info(`Displaying ${args.join(',')} in async context ${executionAsyncId()} for cell ${this.getCurCellId()}.`);

        if (!this.isOutputCapped()) {
            if (this.onDisplay) {
                this.onDisplay(this.getCurCellId(), {
                    displayType: displayType,
                    data: data,
                });
            }
        }
    };

    //
    // Captures standard output while evaluating a notebook.
    //
    private stdoutWriteOverride = (...args: any[]): boolean => {

        // this.log.info(`Stdout ${args[0]} in async context ${executionAsyncId()} for cell ${this.getCurCellId()}.`);

        if (!this.isOutputCapped()) {
            if (this.onDisplay) {
                let value = args[0];
                if (typeof(value) === "string") {
                    // Strip color codes.
                    value = stripAnsi(value);
                }

                this.onDisplay(this.getCurCellId(), {
                    displayType: "text",
                    data: value,
                });
            }

            return this.oldStdoutWrite.apply(this.process.stdout, args);
        }
        else {
            return true;
        }
    };
    
    //
    // Captures standard error while evaluating a notebook.
    //
    private stderrWriteOverride = (...args: any[]): boolean =>{

        // this.log.info(`Stderr ${args[0]} in async context ${executionAsyncId()} for cell ${this.getCurCellId()}.`);

        if (!this.isOutputCapped()) {
            if (this.onError) {
                this.onError(this.getCurCellId(), args[0]);
            }

            return this.oldStderrWrite.apply(this.process.stderr, args);
        }
        else {
            return true;
        }
    };

    //
    // Override std output and error to capture it while evaluating a notebook.
    //
    private overrideOutput(): void {
        this.oldStdoutWrite = this.process.stdout.write;
        this.oldStderrWrite = this.process.stderr.write;

        this.process.stdout.write = this.stdoutWriteOverride;
        this.process.stderr.write = this.stderrWriteOverride;
    }

    //
    // Restore output to normal state.
    //
    private restoreOutput() {
        this.process.stdout.write = this.oldStdoutWrite;
        this.process.stderr.write = this.oldStderrWrite;
    }

    //
    // Map module require statements to the notebook's directory.
    //
    private proxyRequire(moduleName: string): any {
        const resolvedModuleName = resolve(moduleName);
        if (!resolvedModuleName) {
            throw new Error("Failed to resolve module: " + moduleName);
        }

        return originalRequire(resolvedModuleName);
    }

    //
    // Ensure modules required by the notebook.
    //
    private async ensureRequiredModules(notebook: ISerializedNotebook1, cells: ISerializedCell1[], projectPath: string): Promise<void> {
        //
        // Automatically install modules referenced in the code.
        //
        for (const cell of cells) {
            if (cell.cellType === CellType.Code) {
                try {
                    await this.npm.ensureRequiredModules(cell.code || "", projectPath, false);
                }
                catch (err: any) {
                    this.reportError(ErrorSource.ModuleInstall, cell.instanceId!, err.message, err.stack);
                }
            }
        }
    }

    //
    // Handle an uncaught exception in the user's notebook.
    //
    private onUncaughtException = (err: Error): void => {
        this.reportError(ErrorSource.CodeEvaluation, this.getCurCellId(), err.message, undefined, err.stack);
        this.onFinished();
    }

    //
    // Handle an unhandled rejected promise in the users' notebook.
    //
    private onUnhandledRejection = (err: any, promise: Promise<any>): void => {
        this.reportError(ErrorSource.CodeEvaluation, this.getCurCellId(), err && err.message, undefined, err && err.stack);
        this.onFinished();
    };

    //
    // Called when notebook evaluation has finished.
    //
    private onFinished(): void {
        if (this.notebookFinished) {
            // Already wound up.
            return;
        }

        // fs.writeSync(1, `%%--%% Finished evaluation, have ${this.asyncTracker.getNumAsyncOps()} async operations in progress.\n`);
        // fs.writeSync(1, this.asyncTracker.dump() + `\n`);

        this.notebookFinished = true;

        this.restoreOutput();

        this.asyncTracker.deinit();

        (this.process as EventEmitter).removeListener("uncaughtException", this.onUncaughtException);
        (this.process as EventEmitter).removeListener("unhandledRejection", this.onUnhandledRejection);

        this.log.info(">>> Evaluated code for notebook, async operations have completed.");

        if (this.onEvaluationCompleted) {
            this.onEvaluationCompleted();
        }
    }

    // remainingAsyncOps: number = 0;

    //
    // A function that starts an async checking loop to figure out when the notebook has completed.
    //
    private awaitNotebookCompleted = (): void => {
        if (this.notebookFinished) {
            // On finished has already been called.
            return;
        }

        if (global.gc) {
            global.gc();
        }

        let allCellsCompleted = true;
        
        // const curAsyncOps = this.asyncTracker.getNumAsyncOps();
        // if (this.remainingAsyncOps !== curAsyncOps) {
        //     this.remainingAsyncOps = curAsyncOps;
        //     fs.writeSync(1, `%%--%% Have ${this.asyncTracker.getNumAsyncOps()} async operations in progress.\n`);
        //     fs.writeSync(1, this.asyncTracker.dump() + `\n`);
        // }

        for (let cellIndex = 0; cellIndex < this.numCells; ++cellIndex) {
            if (this.cellsCompleted[cellIndex]) {
                // fs.writeSync(1, (`%% Cell ${cellIndex} has already completed.\n`);
                continue; // This cell has already completed.
            }

            if (this.asyncTracker.hasCellCompleted(cellIndex)) {
                // The async operations for this cell have completed, clean up.
                // fs.writeSync(1, `%% Completed async evaluation for cell ${cellIndex}.\n`);
                this.cellsCompleted[cellIndex] = true;

                const getLocals = this.localsFnCache[cellIndex];
                if (getLocals) {
                    this.captureLocals(cellIndex, getLocals); // Do a final capture of local variables after async operations have completed.
                }

                if (this.onCellEvalEnded) {
                    this.onCellEvalEnded(this.cellIds[cellIndex]); // Notify listeners that this cell just completed.
                }
            }
            else {
                // At least 1 cell hasn't yet completed.
                allCellsCompleted = false;
            }
        }

        if (this.notebookCompleted && allCellsCompleted) { 
            // All cells have completed, we are done here.
            this.onFinished();
            return;
        }

        setTimeout(this.awaitNotebookCompleted, 0);
    };

    //
    // Marks the end of execution for a notebook, excluding indirect async operations.
    //
    private __end = () => {
        if (global.gc) {
            global.gc();
        }
        this.notebookCompleted = true; // Now just wait for the timer to kick in.
    };

    //
    // Captures local variables at the end of cell execution.
    //
    private __capture_locals = (cellIndex: number, cellId: string, getLocals: () => any) => {
        this.localsFnCache[cellIndex] = getLocals; // Keep a copy of this function so we can update locals again after async code has completed.
        this.captureLocals(cellIndex, getLocals);
    }

    //
    // Does an automatic display of the last value.
    //
    private __auto_display = (value: any): void => {
        this.display(value);
    }

    //
    // Capture local variables.
    //
    private captureLocals(cellIndex: number, getLocals: () => any) {

        const locals = getLocals();
        const keys = Object.keys(locals);
        fs.writeSync(1, `%% Captured locals for cell ${cellIndex}: ${JSON.stringify(keys)}`);

        for (const key of keys) {
            (global as any)[key] = locals[key]; //TODO: It's kind of wrong to set globals here. Should raise an event and do this at a higher level.
        }
    }

    //
    // Marks the evaluation of a new cell.
    // This is called in the async context of the notebook, be careful not to create any new async operations here.
    //
    private __cell = (cellIndex: number, cellId: string, cellCode: Function): void => { 

        // fs.writeSync(1, `%% Now evaluating cell [${cellIndex}]:${cellId}, current async context is ${executionAsyncId()}.\n`);

        if (this.notebookFinished) {
            fs.writeSync(1, `%% Notebook finished already, aborting cell evaluation.\n`);
            return;
        }

        if (global.gc) {
            global.gc();
        }

        if (this.onCellEvalStarted) {
            this.onCellEvalStarted(cellId);
        }

        const cellAsyncContext = new AsyncResource("__async_context");
        cellAsyncContext.runInAsyncScope(() => { // Run the code cell in its own async scope so it can be async tracked.
            const asyncContextId = executionAsyncId();
            fs.writeSync(1, `%% Running cell ${cellIndex} in new async context ${asyncContextId}.\n`);

            this.asyncTracker.init(); // Lazy init, just in time.
            this.asyncTracker.trackCell(asyncContextId, cellIndex);

            try {
                cellCode() // Run the cell code.
                    .catch((err: any) => { // Catch any direct async errors from the cell.
                        this.reportError(ErrorSource.CodeEvaluation, cellId, err.message, undefined, err.stack);
                        this.onFinished();
                    });
            }
            catch (err: any) { // Catch any direct non-async errors from the cell.
                this.reportError(ErrorSource.CodeEvaluation, cellId, err.message, undefined, err.stack);
                this.onFinished();
            }
        });
    }
        
    //
    // Evaluate code that was generated for a notebook.
    //
    private evalGeneratedCode(): void {

        let fn: any;
        const options: vm.RunningScriptOptions = {
            filename: this.fileName,
            displayErrors: true,
        };

        try {
            fn = vm.runInThisContext(this.code!, options);
        }
        catch (err: any) {
            this.reportError(ErrorSource.CodeSetup, this.getCurCellId(), err.message, undefined, err.stack);
            return;
        }

        this.overrideOutput();

        this.startTime = performance.now();

        this.process.addListener("uncaughtException", this.onUncaughtException);
        this.process.addListener("unhandledRejection", this.onUnhandledRejection);

        try {
            fn(
                this.proxyRequire, 
                this.fileName, 
                this.projectPath, 
                this.display, 
                this.__cell, 
                this.__end,
                this.__capture_locals,
                this.__auto_display
            )
            .catch((err: any) => {
                this.reportError(ErrorSource.CodeEvaluation, this.getCurCellId(), err.message, undefined, err.stack);
                this.onFinished();
            });
        }
        catch (err: any) {
            this.reportError(ErrorSource.CodeEvaluation, this.getCurCellId(), err.message, undefined, err.stack);
            this.onFinished();
        }

        this.awaitNotebookCompleted(); // This is called outside the async context of the notebook, so async operations created here are not tracked.
    }

    //
    // Setup for evaluation.
    //
    private async evalSetup(): Promise<void> {
        //
        // Make sure the project is setup before evaluating.
        //
        await this.installNotebook();

        this.log.info("Generating code for notebook " + this.fileName);
        this.log.info("Setting working dir to " + this.projectPath);
        this.process.chdir(this.projectPath);

        const codeGenerator = new CodeGenerator(this.notebook, this.projectPath, this.log);

        const generatedCode = await codeGenerator.genCode(this.cells);
        this.code = generatedCode.code;
        if (generatedCode.sourceMapData.length > 0) {
            this.origSourceMap = new SourceMap(generatedCode.sourceMapData[0]);
            if (generatedCode.sourceMapData.length > 1) {
                let mergedSourceMap = generatedCode.sourceMapData[0];
                for (let i = 1; i < generatedCode.sourceMapData.length; ++i) {
                    mergedSourceMap = mergeSourceMaps(mergedSourceMap, generatedCode.sourceMapData[i]);                    
                }
                this.finalSourceMap = new SourceMap(mergedSourceMap);
            }
            else {
                this.finalSourceMap = this.origSourceMap;
            }
        }

        // if (this.code) {
        //     this.log.info("============= Generated code =============");
        //     this.log.info(this.code.split('\n').map((line, i) => (i+1).toString() + " : " + line).join('\n'));
        //     // this.log.info("============= Source map =================");
        //     // if (this.sourceMap) {
        //     //     this.log.info(JSON.stringify(this.sourceMap.getSourceMap(), null, 4));
        //     // }
        //     // else {
        //     //     this.log.info("No source map.");
        //     // }
        //     // this.log.info("==========================================");
        // }
        
        if (!this.code) {
            this.log.info("No code was produced, there may have been an error in the code.");
        }

        if (generatedCode.diagnostics && generatedCode.diagnostics.length > 0) {
            this.log.info("============= Diagnostics / errors =================");
            this.log.info(JSON.stringify(generatedCode.diagnostics, null, 4));
        }

        if (generatedCode.diagnostics && generatedCode.diagnostics.length) {
            for (const diagnostic of generatedCode.diagnostics) {
                this.reportError(ErrorSource.Compiler, this.getCurCellId(), diagnostic.message, diagnostic.location, undefined);
            }
        }
    }

    //
    // Installs the notebook.
    //
    async installNotebook(): Promise<void> {
        await this.ensureRequiredModules(this.notebook, this.cells, this.projectPath);
    }

    //
    // Evaluate code for a notebook.
    //
    evalCode(): void {
        this.evalSetup()
            .then(() => {
                if (this.code) {
                    this.log.info("Evaluating code for notebook " + this.fileName);

                    this.evalGeneratedCode();
                }
                else {
                    this.onFinished();
                }
            })
            .catch(err => {
                this.log.error("An error occurred during evaluation setup.");
                this.log.error(err && err.stack || err);

                this.onFinished();
            });
    }

    //
    // Report an error back to the user.
    //
    private reportError(
        errorSource: ErrorSource,
        curCellId: string, 
        errorMessage?: string, 
        errorLocation?: IFileLocation,
        errorStack?: string): void {

        const fileName = this.fileName;
        this.log.info(`!! An error occurred while evaluating notebook "${fileName}" details follow.`);
        this.log.info("== Filename ==");
        this.log.info(fileName);
        this.log.info("== Error source ==");
        this.log.info(errorSource);
        this.log.info("== Cell id ==");
        this.log.info(curCellId || "<unknown>");
        this.log.info("== Error message ==");
        this.log.info(errorMessage || "<no-message>");
        this.log.info("== Error location ==");
        this.log.info(errorLocation && JSON.stringify(errorLocation, null, 4) || "<no-location>");
        this.log.info("== Error stacktrace ==");
        this.log.info(errorStack || "<no-stack-trace>");
        // this.log.info("== Orig sourcemap ==");
        // this.log.info(this.origSourceMap && JSON.stringify(this.origSourceMap.getData(), null, 4) || "<no-source-map>");
        // this.log.info("== Final sourcemap ==");
        // this.log.info(this.finalSourceMap && JSON.stringify(this.finalSourceMap.getData(), null, 4) || "<no-source-map>");

        // this.log.info("== Exports data for testing ==");
        // const jsonTestingData = JSON.stringify({
        //     fileName,
        //     errorSource,
        //     curCellId,
        //     errorMessage,
        //     errorLocation,
        //     errorStack,
        //     origSourceMap: this.origSourceMap && this.origSourceMap.getData(),
        //     finalSourceMap: this.finalSourceMap && this.finalSourceMap.getData(),
        // }, null, 4)
        // this.log.info(jsonTestingData);
        // fs.writeFileSync("error.json", jsonTestingData);      

        const errorMsg = formatErrorMessage(fileName, errorSource, curCellId, errorMessage, errorLocation, errorStack, this.origSourceMap, this.finalSourceMap);

        this.log.info("== Translated error message and stack trace ==");
        this.log.info(JSON.stringify(errorMsg, null, 4));
        // this.log.info("== ** ==");

        if (this.onError) {
            this.onError(errorMsg.cellId!, errorMsg.display);
        }
    }    
}   