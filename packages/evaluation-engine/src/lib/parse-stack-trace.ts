import * as path from 'path';
import { ISourceMap } from './source-map';

//
// Had to write my own stack frame parser!
// Both libraries I tried don't seem to cut it.
//

export interface IStackFrame {
    functionName?: string;
    filePath: string;
    lineNumber?: number;
    column?: number;
}

//
// Parse a file locator containing file name, line number and column.
//
export function parseFileLocator(fileLocator: string): IStackFrame {
    const fileLocatorParts = fileLocator.trim().split(":").map(part => part.trim());

    let column: number | undefined;
    let lineNumber: number | undefined;

    if (fileLocatorParts.length >= 3) {
        column = parseInt(fileLocatorParts.pop()!);
    }

    if (fileLocatorParts.length >= 2) {
        lineNumber = parseInt(fileLocatorParts.pop()!);
    }

    const filePath = fileLocatorParts.join(":");

    const stackFrame: IStackFrame ={
        filePath: filePath,
    };

    if (column !== undefined) {
        stackFrame.column = column;
    }

    if (lineNumber !== undefined) {
        stackFrame.lineNumber = lineNumber;
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
// Determine the name of the function.
//
function getFunctionName(functionName: string | undefined): string {
    if (functionName === undefined || functionName === "__sync" || functionName === "wrapperFn") {
        return "Code cell";
    }

    return functionName;
}

//
// Translate a single stack frame for display.
//
export async function translateStackFrame(frame: any, onlyOriginal: boolean, sourceMap?: ISourceMap): Promise<string | undefined> {
    frame = Object.assign({}, frame);
    if (frame.lineNumber !== undefined && sourceMap !== undefined) {
        const cellLine = await sourceMap.mapLine(frame.lineNumber, frame.column, onlyOriginal);
        if (cellLine) {
            frame.lineNumber = cellLine.lineNumber;

            let displayFrame = "at " + getFunctionName(frame.functionName);
            if (frame.lineNumber !== undefined) {
                displayFrame += ", line " + frame.lineNumber;
            }
            
            return displayFrame;
        }
    }

    return undefined;
}

//
// Translate a file:line location string.
//
export async function translateLocation(location: string, onlyOriginal: boolean, sourceMap?: ISourceMap): Promise<string | undefined> {
    const stackFrame = parseFileLocator(location);
    return await translateStackFrame(stackFrame, onlyOriginal, sourceMap);
}

//
// Translate a stack trace using a source map.
//
export async function translateStackTrace(stackTrace: string, fileName: string, sourceMap?: ISourceMap): Promise<string> {
    const stackFrames = parseStackTrace(stackTrace);
    const translated = await Promise.all(
        stackFrames
            .filter((frame: any) => { //TODO: Bit of a hack here checking for the in memory file name.
                return path.basename(frame.filePath) === fileName || frame.filePath === "/in-memory-file.ts" || frame.filePath === "/in-memory-file.js";
            })
            .map(frame => translateStackFrame(frame, false, sourceMap))
    );
    return translated.filter(frame => frame).join("\n");
}