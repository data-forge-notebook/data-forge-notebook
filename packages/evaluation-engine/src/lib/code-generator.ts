import { INotebook } from "model";
import { ICell } from "model";
import { ILog } from "utils";
import { ILanguageCodeGenerator, IGeneratedCode } from "./language-code-generator";
import { JavaScriptCodeGenerator } from "./javascript-code-generator";
import { InjectableClass } from "@codecapers/fusion";

//
// Model used for code generation.
//
export interface ICodeGenerator {

    //
    // Generate code for evaluation.
    //
    genCode(cells: ICell[]): Promise<IGeneratedCode>;

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
    
    languageCodeGenerator: ILanguageCodeGenerator;
    notebook: INotebook;

    log: ILog;

    constructor(notebook: INotebook, projectPath: string, log: ILog) {
        this.notebook = notebook;
        this.log = log;

        const language = notebook.getLanguage();
        if (language === "javascript") {
            this.languageCodeGenerator = new JavaScriptCodeGenerator(notebook, projectPath, log);
        }
        else {
            throw new Error(`Code generator doesn't support language ${language}.`);
        }
    }

    //
    // Determine the file name based on the language.
    //
    formatFileName(baseFileName: string): string {
        return this.languageCodeGenerator.formatFileName(baseFileName);
    }


    //
    // Generate code for evaluation.
    //
    async genCode(cells: ICell[]): Promise<IGeneratedCode> {

        const generatedCode = await this.languageCodeGenerator.genCode(cells);

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
        return await this.languageCodeGenerator.exportCode();
    }
}
