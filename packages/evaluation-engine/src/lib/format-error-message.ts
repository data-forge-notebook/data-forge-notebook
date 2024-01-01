import { translateStackTrace, translateLocation, translateStackFrame } from "./parse-stack-trace";
import { ISourceMap } from "source-map-lib";
import { mapNotebookLocation } from "./source-map";
import { IFileLocation } from "./babel-compile";

export enum ErrorSource {
    ModuleInstall = "Module installation",
    Compiler = "Compiler",
    CodeSetup = "Code setup",
    CodeEvaluation = "Code evaluation",
}

//
// Bite out the first line of input.
//
function chompLine(input: string): string {
    const newlineIndex = input.indexOf("\n");
    if (newlineIndex >= 0) {
        return input.substring(0, newlineIndex).trim();
    }
    else {
        return input;
    }
}

export interface IFormattedErrorMessage {

    //
    // Formatted message for display.
    //
    display: string;

    //
    // Id of the code cell that orginated the error message.
    //
    cellId?: string;

    //
    // Location (if known).
    //
    location?: string;

    //
    // Stack (if known).
    //
    stack?: string;
}

//
// Format an error for display to the user.
//
export function formatErrorMessage(
    fileName: string,
    errorSource: ErrorSource,
    curCellId?: string, 
    errorMessage?: string, 
    errorLocation?: IFileLocation,
    errorStack?: string, 
    origSourceMap?: ISourceMap,
    finalSourceMap?: ISourceMap): IFormattedErrorMessage {

    let location: string | undefined;
    let stack: string | undefined;

    if (errorMessage) {
        const fileNamePrefix = "in-memory-file.ts:";
        const fileNameIndex = errorMessage.indexOf(fileNamePrefix);
        if (fileNameIndex >= 0) {
            errorMessage = errorMessage.substring(fileNameIndex + fileNamePrefix.length).trim();
        }
    }

    if (errorLocation) {
        location = translateStackFrame(
            { 
                filePath: errorLocation.fileName, 
                line: errorLocation.line, 
                column: errorLocation.column, 
            }, 
            origSourceMap // Always use the original source map.
        );
}

    if (errorStack) {
        if (!errorMessage) {
            // If there is no explicit message, try and pull the message from the stack trace.
            const firstAtIndex = errorStack.indexOf("\n    at");
            errorMessage = errorStack.substring(0, firstAtIndex).trim();
        }

        if (!location) {
            // If there is no location, see if the first line of the stack trace is a location.
            if (errorStack.startsWith(fileName + ":")) {
                location = translateLocation(chompLine(errorStack), finalSourceMap);
            }
        }

        stack = translateStackTrace(errorStack, fileName, finalSourceMap);
    }

    if (!errorMessage) {
        errorMessage = "An error occurred."
    }

    let formattedMsg = errorMessage;
    if (location) {
        formattedMsg += `\r\n${location}`;
    }
    else if (stack) {
        formattedMsg += `\r\n${stack}`;
    }

    let origCellId: string | undefined = curCellId;
    if (finalSourceMap) {
        if (errorStack) {
            // Look up cell from first line of error stack.
            const fileLineRegex = /^(.*):(.*)$/m;
            const match = fileLineRegex.exec(errorStack);
            if (match) {
                const line = parseInt(match[2]);
                const column = match[3] !== undefined && parseInt(match[3]) || 1;
                const notebookLocation = mapNotebookLocation({ line, column }, finalSourceMap);
                if (notebookLocation) {
                    origCellId = notebookLocation.cellId;
                }
            }
        }
    }

    if (origSourceMap) {
         if (errorLocation) {
            // Look up cell from error location if there is one.
            const { line, column } = errorLocation;
            const notebookLocation = mapNotebookLocation({ line, column }, origSourceMap);
            if (notebookLocation) {
                origCellId = notebookLocation.cellId;
            }
        }
    }

    return { 
        display: formattedMsg,
        cellId: origCellId,
        location,
        stack,
    };
}    