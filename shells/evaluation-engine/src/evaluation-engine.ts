import { INotebook } from "model";
import { ICell } from "model";
import { CodeEvaluator } from "evaluation-engine";
import { ISerializedCellOutput1 } from "model";
import * as _ from "lodash";
import { Npm } from "evaluation-engine";
import * as path from "path";
import { stringify } from "./lib/json";
import { NOTEBOOK_TIMEOUT_MS, NPM_CACHE_PATH } from "./config";

//
// Evaluate a series of cells in a notebook.
//
export function evaluateNotebook(process: NodeJS.Process, projectPath: string, notebook: INotebook, cells: ICell[], onEvent: (name: string, args: any) => void, done: (err?: any) => void): void {

    console.log(`Evaluating ${cells.length} cells in notebook ${notebook.getInstanceId()} in folder ${projectPath}.`);
    
    const log = {
        info: (msg: string): void => {
            onEvent("debug-log", { level: "info", msg });
            console.log(msg);
        },
        warn: (msg: string): void => {
            onEvent("debug-log", { level: "warn", msg });
            console.warn(msg);
        },
        error: (msg: string): void => {
            onEvent("debug-log", { level: "error", msg });
            console.error(msg);
        },
        verbose: (msg: string): void => {
            onEvent("debug-log", { level: "verbose", msg });
            console.log(msg);
        },
        debug: (msg: string): void => {
            onEvent("debug-log", { level: "debug", msg });
            console.log(msg);
        },
    };

    let cellOutputs: any[] = [];
    function queueOutput(cellId: string, outputs: ISerializedCellOutput1[]) {
        /* #if debug */
        // logBack.info(`Queuing output for cell ${cellId}:`);
        // logBack.info(JSON.stringify(outputs, null, 4));
        /* #endif */

        cellOutputs.push({
            cellId: cellId,
            outputs: stringify(outputs),
        });
        sendOutputs();
    }

    const sendOutputs = _.throttle(
        () => {
            onEvent("evaluation-event", { 
                event: "receive-display", 
                outputs: cellOutputs,
            });
            cellOutputs = [];
        }, 
        250,
    );

    console.log(`Evaluating notebook in path ${projectPath}.`);
    console.log(`Working directory: ${process.cwd()}`);

    const nodeJsPath = path.dirname(process.argv0);
    console.log(`Nodejs from path: ${nodeJsPath}`);

    const npm = new Npm(nodeJsPath, NPM_CACHE_PATH, log);
    const codeEvaluator = new CodeEvaluator(process, notebook, cells, `notebook-${notebook.getInstanceId()}`, projectPath, npm, log, NOTEBOOK_TIMEOUT_MS);
    codeEvaluator.onCellEvalStarted = cellId => {
        onEvent("evaluation-event", { event: "cell-eval-started", cellId });
    };
    codeEvaluator.onCellEvalEnded = cellId => {
        onEvent("evaluation-event", { event: "cell-eval-completed", cellId });
    };
    codeEvaluator.onEvaluationCompleted = () => {
        sendOutputs.flush();
        onEvent("evaluation-event", { event: "notebook-eval-completed" });
        done();
    }
    codeEvaluator.onOutputCapped = async () => {
        onEvent("evaluation-event", { event: "output-capped" });
    };
    codeEvaluator.onDisplay = queueOutput;
    codeEvaluator.onError = (cellId: string, error: string) => {
        onEvent("evaluation-event", { event: "receive-error", cellId, error });
    }
    codeEvaluator.evalCode();
}