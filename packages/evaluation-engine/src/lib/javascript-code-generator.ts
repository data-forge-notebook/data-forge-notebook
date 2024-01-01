import { ISerializedCell1, ISerializedNotebook1 } from "model";
import { CellType } from "model";
import { ILog } from "utils";
import { SourceMapGenerator } from "source-map-lib";
import { ILanguageCodeGenerator, IGeneratedCode } from "./language-code-generator";
import { babelCompile } from "./babel-compile";
import { isModuleImportStatement } from "./npm";

//
// Model used for code generation.
//
export class JavaScriptCodeGenerator implements ILanguageCodeGenerator {

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
    // Compute the number of lines in some code.
    //
    computeNumLines(code: string): number {
        let numLines = 0;
        for (let i = 0; i < code.length; ++i) {
            if (code[i] == '\n') {
                numLines++;
            }
        }

        return numLines;
    }

    //
    // Internal function for generating code.
    //
    private async internalGenCode(
        cells: ISerializedCell1[],
        forExport: boolean
    ): Promise<IGeneratedCode> {

        let generatedCodeOffset = 0; 

        generatedCodeOffset += this.computeNumLines(EXPORT_HEADER);
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
            const moduleImportCode = moduleImportLines.join("\r\n") + "\r\n";
            code += moduleImportCode; //TODO: Need to find a way to get this into the source map.
            generatedCodeOffset += this.computeNumLines(moduleImportCode);
        }

        if (forExport) {
            code += EXPORT_PRE_CODE;
            generatedCodeOffset += this.computeNumLines(EXPORT_PRE_CODE);
        }
        else {
            code += EVAL_PRE_CODE;
            generatedCodeOffset += this.computeNumLines(EVAL_PRE_CODE);
        }

        let cellIndex = 0;

        //
        // Generate code for cells.
        //
        for (const cell of cells) {
            if (!forExport) {
                const preCellCode = `__cell(${cellIndex}, "${cell.instanceId}", async () => {\r\n`;
                code += preCellCode;
                generatedCodeOffset += this.computeNumLines(preCellCode);
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
            
            cellCode = codeLines.join("\r\n");

            cellCode += "\r\n";

            code += cellCode;

            const codeCellLines = this.computeNumLines(cellCode);
            generatedCodeOffset += codeCellLines;

            if (!forExport) {
                // Generate code to capture local variables.
                const captureLocalsCode = `__capture_locals(${cellIndex}, "${cell.instanceId}", () => ({}));\r\n`;
                code += captureLocalsCode;
                generatedCodeOffset += this.computeNumLines(captureLocalsCode);
            }

            sourceMapGenerator.addMappings(`cell-${cellId}`, cell.code || "", { line: cellStartLine, column: 0 });
            cellIndex += 1;
        }

        if (!forExport) {
            code += `__end();\r\n`;
            generatedCodeOffset += 1;

            let numCells = cells.length;
            while (numCells-- > 0) {
                code += "});\r\n";
                generatedCodeOffset += 1;
            }
        }

        if (forExport) {
            code += EXPORT_POST_CODE;
            generatedCodeOffset += this.computeNumLines(EVAL_PRE_CODE);
        }
        else {
            code += EVAL_POST_CODE;
            generatedCodeOffset += this.computeNumLines(EVAL_PRE_CODE);
        }
        
        /* #if debug */

        // for (const cell of cells) {
        //      await writeFile("./cell-" + cell.getId() + ".js", cell.getText());
        // }

        //await writeFile("./generated.js", code + "\r\n" + sourceMapGenerator.makeInlineMapping());

        /* #endif */

        return {
            code,
            sourceMapData: sourceMapGenerator.serialize(),
            diagnostics: [],
        };
    }

    //
    // Format the file name for the particular language.
    //
    formatFileName(baseFileName: string): string {
        return baseFileName + ".js";
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

        const generatedCode = await this.internalGenCode(cells, false);

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

        return {
            code,
            sourceMapData: sourceMapData,
            diagnostics: generatedCode.diagnostics
                .concat(compilationResult.diagnostics)
        };
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
    "function display() {\r\n" + 
    "     for (const arg of arguments) {\r\n" +
    "          console.log(arg);\r\n" +
    "     }\r\n" +
    "}\r\n" +
    "\r\n" +
    "async function main() {\r\n";


const EXPORT_POST_CODE =
    "\r\n" +
    "}\r\n" +
    "\r\n" +
    "main()\r\n" +
    "    .then(() => console.log(\"Done\"))\r\n" +
    "    .catch(err => console.error(err && err.stack || err));\r\n"
    ;

const EVAL_PRE_CODE = 
    "const wrapperFn = (async function () {\r\n"
    ;


const EVAL_POST_CODE ="\r\n" +
    "})";

const GLOBAL_PRE_CODE =
    "(async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { ";

const GLOBAL_POST_CODE = " await wrapperFn(); })";
    

