import * as vlq from "vlq";
const merge = require('merge-source-map');

//
// Maps a position in the generated file to to a position in the source file.
//
export interface IMapping {
    //
    // The line in the generated file (1-based).
    //
    genLine: number;

    //
    // The column in the generated file (0-based).
    //
    genColumn: number;

    //
    // The index of the source file.
    //
    sourceFileIndex: number; 

    //
    // The line in the source file (1-based).
    //
    sourceLine: number;

    //
    // The column in the source file (0-based).
    //
    sourceColumn: number;

    //
    // The name that is mapped to.
    //
    nameIndex: number | undefined;
}

//
// Parse a source mappings string and return the expanded result.
//
export function parseMappings(mappings: string): IMapping[] {
    const parsedMappings: IMapping[] = [];
    let genLine = 1;
    let sourceFile = 0;
    let sourceLine = 1;
    let sourceColumn = 0;
    let namesIndex = 0;
    for (const line of mappings.split(";")) {
        let genColumn = 0;
        for (const segment of line.split(",")) {
            if (segment.length > 0) {
                const decoded = vlq.decode(segment);
                if (decoded[0] !== undefined) {
                    genColumn += decoded[0]; // I guess this is an index into the "sources" field of the source map.
                }
                if (decoded[1] !== undefined) {
                    sourceFile += decoded[1];                
                }
                if (decoded[2] !== undefined) {
                    sourceLine += decoded[2]; // A source line of 0 means just use the previous source line.                
                }
                if (decoded[3] !== undefined) {
                    sourceColumn += decoded[3];                
                }
                const hasName = decoded[4] !== undefined;
                if (hasName) {
                    namesIndex += decoded[4];                
                }
                parsedMappings.push({
                    genLine: genLine,
                    genColumn: genColumn, // This is 0-based.
                    sourceFileIndex: sourceFile, 
                    sourceLine: sourceLine, // This is 1-based.
                    sourceColumn: sourceColumn, // This is 0-based.
                    nameIndex: hasName ? namesIndex : undefined,
                });
            }
        }
        genLine += 1;
    }

    return parsedMappings;
}
  
//
// Determines if two mappings are the same.
//
// Returns true if they are the same, otherwise false.
//
function mappingsAreSame(curMapping: IMapping, prevMapping: IMapping): boolean {
    if (curMapping.genLine !== prevMapping.genLine) {
        return false;
    }

    if (curMapping.genColumn !== prevMapping.genColumn) {
        return false;
    }

    if (curMapping.sourceFileIndex !== prevMapping.sourceFileIndex) {
        return false;
    }

    if (curMapping.sourceLine !== prevMapping.sourceLine) {
        return false;
    }

    if (curMapping.sourceColumn !== prevMapping.sourceColumn) {
        return false;
    }

    if (curMapping.nameIndex !== prevMapping.nameIndex) {
        return false;
    }

    return true;
}

//
// Serialize source mappings to a string.
//
export function serializeMappings(mappings: IMapping[]): string {
    let output = "";
    let previousGeneratedLine = 1;
    let previousGeneratedColumn = 0;
    let previousOriginalColumn = 0;
    let previousOriginalLine = 0;
    let previousNamesIndex = 0;
    let previousSource = 0;

    for (let mappingIndex = 0; mappingIndex < mappings.length; ++mappingIndex) {
        const mapping = mappings[mappingIndex];

        if (mapping.genLine !== previousGeneratedLine) {
            previousGeneratedColumn = 0;
            while (mapping.genLine !== previousGeneratedLine) {
                output += ";";
                previousGeneratedLine++;
            }
        } 
        else if (mappingIndex > 0) {
            const prevMapping = mappings[mappingIndex - 1];
            if (mappingsAreSame(mapping, prevMapping)) {
                continue;
            }
            output += ",";
        }

        const toEncode: number[] = [];
        const outputGenColumn = mapping.genColumn - previousGeneratedColumn;
        toEncode.push(outputGenColumn);

        previousGeneratedColumn = mapping.genColumn;

        const outputSourceFile = mapping.sourceFileIndex - previousSource;
        toEncode.push(outputSourceFile);
        previousSource = mapping.sourceFileIndex;

        // Lines are stored 0-based in SourceMap spec version 3
        const outputSourceLine = mapping.sourceLine - 1 - previousOriginalLine;
        toEncode.push(outputSourceLine);
        previousOriginalLine = mapping.sourceLine - 1;

        const outputSourceColumn = mapping.sourceColumn - previousOriginalColumn;
        toEncode.push(outputSourceColumn);
        previousOriginalColumn = mapping.sourceColumn;

        if (mapping.nameIndex !== undefined) {
            const outputNamesIndex = mapping.nameIndex - previousNamesIndex;
            toEncode.push(outputNamesIndex);
            previousNamesIndex = mapping.nameIndex;
        }

        if (toEncode.length > 0) {
            output += vlq.encode(toEncode);
        }
    }

    return output;
}

//
// Represents a position in a file.
//
export interface IFilePosition {

    //
    // The line in the file.
    //
    line: number;

    //
    // The column in the file.
    //
    column: number;
}

//
// Represents a location in a source file.
//
export interface ISourceLocation {
    // 
    // The source file that is referenced.
    //
    source: string;

    //
    // A name, if present.
    //
    name?: string; 

    //
    // The position in the file.
    //
    position: IFilePosition;
}

//
// Interface for interacting with a sourcemap.
//
export interface ISourceMap {

    //
    // Retrieves the source map data.
    //
    getData(): any;

    //
    // Gets the mappings that have been parsed from the source map data.
    //
    getMappings(): IMapping[];

    //
    // Maps a generated file location to a source file location.
    // Returns undefined when no corresponding source location exists.
    //
    map(position: IFilePosition): ISourceLocation | undefined;
}

//
// Class for interacting with a sourcemap.
//

export class SourceMap implements ISourceMap {
    
    //
    // The sourcemap data wrapped by this instance.
    //
    private sourceMapData: any;

    //
    // Parsed mappings from generated file to source file.
    //
    mappings: IMapping[];

    constructor(sourceMapData: any) { 
        this.sourceMapData = sourceMapData;
        this.mappings = parseMappings(sourceMapData.mappings || "");
    }

    //
    // Retrieves the source map data.
    //
    getData(): any {
        return this.sourceMapData;
    }

    //
    // Gets the mappings that have been parsed from the source map data.
    //
    getMappings(): IMapping[] {
        return this.mappings;
    }

    //
    // Maps a generated file location to a source file location.
    // Returns undefined when no corresponding source location exists.
    //
    map(position: IFilePosition): ISourceLocation | undefined {

        const mapping = this.findMatchingMapping(position);
        if (mapping) {
            return this.computeMappingDetails(mapping);
        }

        return undefined;
    }

    /**
     * Return 0 <= i <= array.length such that !pred(array[i - 1]) && pred(array[i]).
     * 
     * https://stackoverflow.com/a/41956372/25868
     */
    private binarySearch<T>(array: T[], pred: (el: T) => boolean): number {
        let lo = -1, hi = array.length;
        while (1 + lo < hi) {
            const mi = lo + ((hi - lo) >> 1);
            if (pred(array[mi])) {
                hi = mi;
            } 
            else {
                lo = mi;
            }
        }
        return hi;
    }

    //
    //
    // Find a source mapping that matches the position in the generated file.
    // Original implementation: https://github.com/go-sourcemap/sourcemap/blob/180fcef48034918dd59a8920b0d1f5f12e4830de/consumer.go#L184
    //
    private findMatchingMapping(position: IFilePosition): IMapping | undefined {

        let matchIndex = this.binarySearch(this.mappings, mapping => {
            if (mapping.genLine === position.line) {
                if (mapping.genColumn >= position.column) {
                    return true;
                }
            }
            else if (mapping.genLine >= position.line) {
                return true;
            }

            return false;
        });

        let match: IMapping | undefined;

        if (matchIndex >= this.mappings.length) {
            match = this.mappings[this.mappings.length-1];
            if (match.genLine !== position.line) {
                return undefined;
            }
        }
        else {
            match = this.mappings[matchIndex];
            
            // Fuzzy match.
            if (match.genLine > position.line 
                || match.genColumn > position.column) {
                if (matchIndex === 0) {
                    return undefined;
                }

                match = this.mappings[matchIndex - 1];
            }
        }

        return match;
    }

    //
    // Computes mapping details returned to the caller.
    //
    private computeMappingDetails(mapping: IMapping): ISourceLocation {
        const sourceFile = this.sourceMapData.sources[mapping.sourceFileIndex];
        const sourceFilePath = this.sourceMapData.sourceRoot 
            ? this.sourceMapData.sourceRoot + "/" + sourceFile
            : sourceFile;

        return {
            source: sourceFilePath,
            name: mapping.nameIndex !== undefined ? this.sourceMapData.names[mapping.nameIndex] : undefined,
            position: {
                line: mapping.sourceLine,
                column: mapping.sourceColumn,
            },
        };
    }
}

//
// Interface for generating a source map.
//
export interface ISourceMapGenerator {

    //
    // Get source files added to the source map.
    //
    getSources(): string[];

    //
    // Get mappings already generated.
    //
    getMappings(): IMapping[];

    //
    // Adds source mappings for a snippet of code to the source map.
    //
    addMappings(sourceFile: string, sourceCode: string, position: IFilePosition): void;

    //
    // Adds a single mapping to the source map.
    //
    addMapping(genPosition: IFilePosition, sourceLocation: ISourceLocation): void;

    //
    // Serializes the source map.
    //
    serialize(): any;
}

//
// Computes the number of new lines in the code.
//
function determineNumNewLines(sourceCode: string): number {
    const newLines = sourceCode.match(/\n/g);  
    return newLines ? newLines.length : 0;
}

//
// Class for generating a source map.
//
export class SourceMapGenerator implements ISourceMapGenerator {

    //
    // Default fields for the the exported source map.
    //
    private sourceMapDefaults: any;

    //
    // Generated source mappings.
    //
    private mappings: IMapping[] = [];

    //
    // Source files that have been added.
    //
    private sources = new Map<string, number>();

    //
    // The index of the next source file to be added to the source map.
    //
    private nextSourceFileIndex = 0;
    
    //
    // Names that have been added.
    //
    private names = new Map<string, number>();
    
    //
    // The index of the next name to be added to the source map.
    //
    private nextNameIndex = 0;

    constructor(sourceMapDefaults?: any) {
        this.sourceMapDefaults = Object.assign({}, sourceMapDefaults);
    }

    //
    // Get source files added to the source map.
    //
    getSources(): string[] {
        return Array.from(this.sources.keys());
    }

    //
    // Get mappings already generated.
    //
    getMappings(): IMapping[] {
        return this.mappings;
    }
 
    //
    // Adds source mappings for a snippet of code to the source map.
    //
    addMappings(sourceFile: string, sourceCode: string, position: IFilePosition): void {
        const numSourceLines = determineNumNewLines(sourceCode) + 1;
        for (let sourceLine = 1; sourceLine <= numSourceLines; sourceLine++) {
            this.addMapping(
                { 
                    line: position.line + sourceLine, 
                    column: position.column,
                }, 
                { 
                    position: {
                        line: sourceLine, 
                        column: 0,
                    }, 
                    source: sourceFile,
                }
            );
        }
    }

    //
    // Adds a single mapping to the source map.
    //
    addMapping(genPosition: IFilePosition, sourceLocation: ISourceLocation): void {
        let sourceFileIndex = this.sources.get(sourceLocation.source);
        if (sourceFileIndex === undefined) {
            sourceFileIndex = this.nextSourceFileIndex++
            this.sources.set(sourceLocation.source, sourceFileIndex);
        }

        let namesIndex: number | undefined;
        if (sourceLocation.name) {
            namesIndex = this.names.get(sourceLocation.name);
            if (namesIndex === undefined) {
                namesIndex = this.nextNameIndex++
                this.names.set(sourceLocation.name, namesIndex);
            }
        }

        this.mappings.push({
            genLine: genPosition.line,
            genColumn: genPosition.column,
            sourceFileIndex: sourceFileIndex,
            sourceLine: sourceLocation.position.line,
            sourceColumn: sourceLocation.position.column,
            nameIndex: namesIndex,
        });
    }

    //
    // Serializes the source map.
    //
    serialize(): any {
        return Object.assign(
            {},
            this.sourceMapDefaults,
            {
                version: 3,
                names: Array.from(this.names.keys()),
                sources: Array.from(this.sources.keys()),
                mappings: serializeMappings(this.mappings),
            }
        );
    };

}

//
// Merges two source maps.
//
export function mergeSourceMaps(sourceMapData1: any, sourceMapData2: any) {
    return merge(sourceMapData1, sourceMapData2);
}

