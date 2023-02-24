import { ICell } from "model";
import { ISourceMap } from "source-map-lib";

export type CodeCellEventHandler = (cell: ICell) => Promise<void>;

//
// Location in the file.
//
export interface IFileLocation {

    //
    // The particular file.
    //
    fileName: string;

    //
    // Line number.
    //
    line: number;

    // 
    // Column number.
    //
    column: number;
}

//
// A diagnostic error message to display to the user.
//
export interface IDiagnostic {

    //
    // The message to display.
    //
    message: string;

    //
    // Location of issue in the file.
    //
    location?: IFileLocation;

    //
    // Source of the diagnostic message.
    //
    source: string;
}

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
export interface ILanguageCodeGenerator {
    
    //
    // Format the file name for the particular language.
    //
    formatFileName(baseFileName: string): string;

    //
    // Generate code for evaluation.
    //
    genCode(cells: ICell[]): Promise<IGeneratedCode>;

    //
    // Generate code for export.
    //
    exportCode(): Promise<string>;
}
