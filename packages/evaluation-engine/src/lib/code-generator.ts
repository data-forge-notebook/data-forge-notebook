import { CellType, ISerializedCell1, ISerializedNotebook1 } from "model";
import { ILog } from "utils";
import { InjectableClass } from "@codecapers/fusion";
import { IDiagnostic, babelCompile } from "./babel-compile";
import { computeNumLines } from "./lib/text";
import { SourceMapGenerator } from "source-map-lib";
import { isModuleImportStatement } from "./npm";

//
// Structure that contains generated code and its source map.
//
export interface IGeneratedCode {
    //
    // Generated code.
    // Or undefined if failed to generate code.
    //
    code?: string;

    //
    // Maps generated code back to source code.
    // Or undefined if failed to generate code.
    //
    sourceMapData: any[];

    //
    // Array of diagnostic messages produced during compilation.
    //
    diagnostics: IDiagnostic[];
}

//
// Model used for code generation.
//
export interface ICodeGenerator {

    //
    // Generate code for evaluation.
    //
    genCode(cells: ISerializedCell1[]): Promise<IGeneratedCode>;

    //
    // Generate code for export.
    //
    exportCode(): Promise<string>;
}

//
// Model used for code generation.
//
@InjectableClass()
export class CodeGenerator implements ICodeGenerator {
    
    //
    // The notebook to be compiled.
    //
    private notebook: ISerializedNotebook1;

    //
    // The path that contains the notebook.
    //
    private projectPath: string;

    private log: ILog;

    constructor(notebook: ISerializedNotebook1, projectPath: string, log: ILog) {
        this.notebook = notebook;
        this.projectPath = projectPath;
        this.log = log;
    }

    //
    // Determine the file name based on the language.
    //
    formatFileName(baseFileName: string): string {
        return baseFileName + ".js";
    }

    //
    // Internal function for generating code.
    //
    private async internalGenCode(
        cells: ISerializedCell1[],
        forExport: boolean
    ): Promise<IGeneratedCode> {

        let generatedCodeOffset = 0; 

        generatedCodeOffset += computeNumLines(EXPORT_HEADER);
        let code = EXPORT_HEADER;

        const sourceMapGenerator = new SourceMapGenerator();

        cells = cells.filter(cell => cell.cellType === CellType.Code); // Only interested in code cells.

        //
        // Hoist module import statements to global level.
        // But only do this for global cells.
        //
        for (const cell of cells) {
            const cellCode = cell.code || "";
            const moduleImportLines = cellCode.split("\n")
                .filter(isModuleImportStatement)
                .map(line => line.trimRight());
            if (moduleImportLines.length <= 0) {
                continue;
            }
            const moduleImportCode = moduleImportLines.join("\n") + "\n";
            code += moduleImportCode; //TODO: Need to find a way to get this into the source map.
            generatedCodeOffset += computeNumLines(moduleImportCode);
        }

        if (forExport) {
            code += EXPORT_PRE_CODE;
            generatedCodeOffset += computeNumLines(EXPORT_PRE_CODE);
        }
        else {
            code += EVAL_PRE_CODE;
            generatedCodeOffset += computeNumLines(EVAL_PRE_CODE);
        }

        let cellIndex = 0;

        //
        // Generate code for cells.
        //
        for (const cell of cells) {
            if (!forExport) {
                const preCellCode = `__cell(${cellIndex}, "${cell.instanceId}", async () => {\n`;
                code += preCellCode;
                generatedCodeOffset += computeNumLines(preCellCode);
            }

            const cellId = cell.instanceId!;
            const cellStartLine = generatedCodeOffset;
                
            let cellCode = cell.code || "";
            let codeLines = cellCode.split("\n")
                .map(line => line.trimRight());

            // Hoist import statements to global level.
            //TODO: Merge duplicate import statements.
            codeLines = codeLines.map(line => {
                if (isModuleImportStatement(line))  {
                    return "";
                }
                else {
                    return line;
                }
            });
            
            cellCode = codeLines.join("\n");

            cellCode += "\n";

            code += cellCode;

            const codeCellLines = computeNumLines(cellCode);
            generatedCodeOffset += codeCellLines;

            if (!forExport) {
                // Generate code to capture local variables.
                const captureLocalsCode = `__capture_locals(${cellIndex}, "${cell.instanceId}", () => ({}));\n`;
                code += captureLocalsCode;
                generatedCodeOffset += computeNumLines(captureLocalsCode);
            }

            sourceMapGenerator.addMappings(`cell-${cellId}`, cell.code || "", { line: cellStartLine, column: 0 });
            cellIndex += 1;
        }

        if (!forExport) {
            code += `__end();\n`;
            generatedCodeOffset += 1;

            let numCells = cells.length;
            while (numCells-- > 0) {
                code += "});\n";
                generatedCodeOffset += 1;
            }
        }

        if (forExport) {
            code += EXPORT_POST_CODE;
            generatedCodeOffset += computeNumLines(EVAL_PRE_CODE);
        }
        else {
            code += EVAL_POST_CODE;
            generatedCodeOffset += computeNumLines(EVAL_PRE_CODE);
        }
        
        /* #if debug */

        // for (const cell of cells) {
        //      await writeFile("./cell-" + cell.getId() + ".js", cell.getText());
        // }

        //await writeFile("./generated.js", code + "\n" + sourceMapGenerator.makeInlineMapping());

        /* #endif */

        return {
            code,
            sourceMapData: sourceMapGenerator.serialize(),
            diagnostics: [],
        };
    }

    //
    // Generate code for evaluation.
    //
    async genCode(cells: ISerializedCell1[]): Promise<IGeneratedCode> {

        const log = this.log;
        // log.info("============= Source code by cell =============");
        // for (const cell of cells.filter(cell => cell.getCellType() === CellType.Code)) {
        //     log.info(`Cell ${cell.getId()}:`);
        //     log.info(cell.getText().split('\n').map((line, i) => (i+1).toString() + " : " + line).join('\n')); 
        // }

        let generatedCode = await this.internalGenCode(cells, false);
        if (!generatedCode.code) {
            return generatedCode;
        }

        // log.info("============= Source code before compilation =============");
        // log.info(generatedCode.code.split('\n').map((line, i) => (i+1).toString() + " : " + line).join('\n'));
        // log.info("============= Source map =================");
        // log.info(JSON.stringify(generatedCode.sourceMap.getSourceMap(), null, 4));
        // log.info("==========================================");

        const sourceMapData: any[] = [
            generatedCode.sourceMapData,
        ];

        const compilationResult = await babelCompile(this.log, generatedCode.code, this.projectPath);
        if (compilationResult.sourceMapData) {
            sourceMapData.push(compilationResult.sourceMapData);
        }

        if (compilationResult.code === undefined) {
            // Some kind of error happened.
            return {
                sourceMapData: sourceMapData,
                diagnostics: generatedCode.diagnostics
                    .concat(compilationResult.diagnostics)
            };
        }

        //await writeFile("./compiled.js", compilationResult.code);

        //await writeFile("./compiled.js.map", JSON.stringify(generatedCode.sourceMap.getSourceMap(), null, 4));

        let code: string | undefined;
        if (compilationResult.code) {
            // Wrap compiled JavaScript code in a function that can be evaluated.
            code = GLOBAL_PRE_CODE + 
                compilationResult.code +
                GLOBAL_POST_CODE;
        }

        generatedCode = {
            code,
            sourceMapData: sourceMapData,
            diagnostics: generatedCode.diagnostics
                .concat(compilationResult.diagnostics)
        };        

        // if (generatedCode.code) {
        //     const log = this.log;
        //     log.info("============= Source code =============");
        //     log.info(generatedCode.code.split('\n').map((line, i) => (i+1).toString() + " : " + line).join('\n'));
        //     // log.info("============= Source map =================");
        //     // log.info(JSON.stringify(generatedCode.sourceMap.getSourceMap(), null, 4));
        //     // log.info("==========================================");
        // }

        return generatedCode;
    }

    //
    // Generate code for export.
    //
    async exportCode(): Promise<string> {
        return (await this.internalGenCode(this.notebook.cells, true)).code!;
    }
}


const EXPORT_HEADER = 
    "";
    
const EXPORT_PRE_CODE = 
    "function display() {\n" + 
    "     for (const arg of arguments) {\n" +
    "          console.log(arg);\n" +
    "     }\n" +
    "}\n" +
    "\n" +
    "async function main() {\n";


const EXPORT_POST_CODE =
    "\n" +
    "}\n" +
    "\n" +
    "main()\n" +
    "    .then(() => console.log(\"Done\"))\n" +
    "    .catch(err => console.error(err && err.stack || err));\n"
    ;

const EVAL_PRE_CODE = 
    "const wrapperFn = (async function () {\n"
    ;


const EVAL_POST_CODE ="\n" +
    "})";

const GLOBAL_PRE_CODE =
    "(async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { ";

const GLOBAL_POST_CODE = " await wrapperFn(); })";
    