import * as path from 'path';
import { ISourceMap } from 'source-map-lib';
import { mapNotebookLocation } from './source-map';

//
// Had to write my own stack frame parser!
// Both libraries I tried don't seem to cut it.
//

export interface IStackFrame {
    functionName?: string;
    filePath: string;
    line?: number;
    column?: number;
}

//
// Parse a file locator containing file name, line number and column.
//
export function parseFileLocator(fileLocator: string): IStackFrame {
    const fileLocatorParts = fileLocator.trim().split(":").map(part => part.trim());

    let column: number | undefined;
    let line: number | undefined;

    if (fileLocatorParts.length >= 3) {
        column = parseInt(fileLocatorParts.pop()!);
    }

    if (fileLocatorParts.length >= 2) {
        line = parseInt(fileLocatorParts.pop()!);
    }

    const filePath = fileLocatorParts.join(":");

    const stackFrame: IStackFrame ={
        filePath: filePath,
    };

    if (column !== undefined) {
        stackFrame.column = column;
    }

    if (line !== undefined) {
        stackFrame.line = line;
    }

    return stackFrame;
}

//
// Parse a single line of stack trace.
//
function parseStackTraceLine(line: string): IStackFrame {

    line = line.substring(3).trim(); // Chop the 'at '.

    if (line === "<anonymous>") {
        return {
            filePath: "<system>",
        };
    }
    else {
        const openParenIndex = line.indexOf("(");
        if (openParenIndex >= 0) {
            const closeParenIndex = line.indexOf(")", openParenIndex+1);
            if (closeParenIndex > openParenIndex) {
                const functionName = line.substring(0, openParenIndex).trim();
                const fileLocator = line.substring(openParenIndex+1, closeParenIndex).trim();
                if (fileLocator === "<anonymous>") {
                    return {
                        filePath: "<system>",
                    };
                }
                const stackFrame = parseFileLocator(fileLocator);
                stackFrame.functionName = functionName;
                return stackFrame;
            }
            else {
                throw new Error("Unrecognised component of stace trace line.");
            }
        }
        else {
            return parseFileLocator(line);
        }
    }
}

//
// Parse a multiline stack trace.
//
export function parseStackTrace(stackTrace: string): IStackFrame[] {
    if (!stackTrace) {
        return [];
    }

    return stackTrace.split("\n")
        .map(line => line.trim())
        .filter(line => line.startsWith("at "))
        .map(parseStackTraceLine);
}

//
// Determine if the function is a code cell.
//
function isCodeCell(functionName: string | undefined): boolean {
    return functionName === undefined || functionName === "__sync" || functionName === "wrapperFn";
}

//
// Determine the name of the function.
//
function getFunctionName(functionName: string | undefined): string {
    if (isCodeCell(functionName)) {
        return "Code cell";
    }

    return functionName!;
}

//
// Translate a single stack frame for display.
//
export function translateStackFrame(frame: IStackFrame, sourceMap?: ISourceMap): string | undefined {
    if (frame.line !== undefined && sourceMap !== undefined) {
        const notebookLocation = mapNotebookLocation({ line: frame.line, column: frame.column || 1 }, sourceMap);
        if (notebookLocation) {
            let displayFrame = " at " + getFunctionName(frame.functionName);
            displayFrame += ", line " + notebookLocation.line;
            return displayFrame;
        }
    }

    return undefined;
}

//
// Translate a file:line location string.
//
export function translateLocation(location: string, sourceMap?: ISourceMap): string | undefined {
    const stackFrame = parseFileLocator(location);
    return translateStackFrame(stackFrame, sourceMap);
}

//
// Translate a stack trace using a source map.
//
export function translateStackTrace(stackTrace: string, fileName: string, sourceMap?: ISourceMap): string {
    const stackFrames = parseStackTrace(stackTrace);
    const translated: string[] = [];
    for (const frame of stackFrames) {
        if (path.basename(frame.filePath) === fileName 
            || frame.filePath === "/in-memory-file.ts" 
            || frame.filePath === "/in-memory-file.js") {
            const displayFrame = translateStackFrame(frame, sourceMap);
            if (displayFrame) {
                translated.push(displayFrame);
            }
        }

        if (isCodeCell(frame.functionName)) {
            // Break out of the stack trace when we hit the code cell.
            break;
        }
    }

    return translated.filter(frame => frame).join("\n");
}