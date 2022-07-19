import { translateStackTrace, translateLocation, translateStackFrame } from "./parse-stack-trace";
import { ISourceMap } from "./source-map";
import { IFileLocation } from "./language-code-generator";

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
export async function formatErrorMessage(
    fileName: string,
    errorSource: ErrorSource,
    curCellId?: string, 
    errorMessage?: string, 
    errorLocation?: IFileLocation,
    errorStack?: string, 
    sourceMap?: ISourceMap): Promise<IFormattedErrorMessage> {

    let message = errorMessage;
    let location: string | undefined;
    let stack: string | undefined;

    if (errorLocation) {
        location = await translateStackFrame(
            { 
                filePath: errorLocation.fileName, 
                lineNumber: errorLocation.lineNumber, 
                column: errorLocation.columnNumber, 
            }, 
            true, 
            sourceMap
        );
    }

    if (errorStack) {
        if (!message) {
            // If there is no explicit message, try and pull the message from the stack trace.
            const firstAtIndex = errorStack.indexOf("\n    at");
            message = errorStack.substring(0, firstAtIndex).trim();
        }

        if (!location) {
            // If there is no location, see if the first line of the stack trace is a location.
            if (errorStack.startsWith(fileName + ":")) {
                location = await translateLocation(chompLine(errorStack), false, sourceMap);
            }
        }

        stack = await translateStackTrace(errorStack, fileName, sourceMap);
    }

    if (!message) {
        message = "An error occurred."
    }

    let formattedMsg = `${message}`;
    if (location) {
        formattedMsg += `\r\n${location}`;
    }
    else if (stack) {
        formattedMsg += `\r\n${stack}`;
    }

    let origCellId: string | undefined = curCellId;
    if (sourceMap) {
        if (errorStack) {
            // Look up cell from first line of error stack.
            const fileLineRegex = /^(.*):(.*)$/m;
            const match = fileLineRegex.exec(errorStack);
            if (match) {
                const lineNumber = parseInt(match[2]);
                const columnNumber = parseInt(match[3]);
                const cellLine = await sourceMap.mapLine(lineNumber, columnNumber, false);
                if (cellLine) {
                    origCellId = cellLine.cellId;
                }
            }
        }
    
        if (errorLocation) {
            // Look up cell from error location if there is one.
            const cellLine = await sourceMap.mapLine(errorLocation.lineNumber, errorLocation.columnNumber, true);
            if (cellLine) {
                origCellId = cellLine.cellId;
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