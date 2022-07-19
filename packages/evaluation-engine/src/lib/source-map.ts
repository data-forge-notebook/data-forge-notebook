const createSourceMapGenerator = require('inline-source-map');
const sourceMap = require("./lib/source-map/source-map");
const merge = require('merge-source-map');

//
// Generates a source map.
//
export class SourceMapGenerator {

    //
    // Initialises the source map library prior to use.
    //
    public static init(mappingsWasmFilePath: string): void {
        //
        // It's really annoying that this code must be loaded in from a wasm file!
        // 
        // Info here about this wasm file:
        // - https://github.com/mozilla/source-map/issues/387
        // - https://hacks.mozilla.org/2018/01/oxidizing-source-maps-with-rust-and-webassembly/
        //
        sourceMap.SourceMapConsumer.initialize({
            "lib/mappings.wasm": mappingsWasmFilePath,
        });
    }

    private sourceMapGenerator = createSourceMapGenerator({ charset: 'utf-8' });

    //
    // Add mappings to the source map.
    //
    addMappings(cellId: string, cellStartLine: number, code: string): void {
        const cellName = "cell-" + cellId;
        this.sourceMapGenerator.addGeneratedMappings(cellName, code, { line: cellStartLine, column: 0 });
    }

    makeInlineMapping(): string { 
        return this.sourceMapGenerator.inlineMappingUrl();
    }

    //
    // Create the source map.
    //
    async makeSourceMap(): Promise<ISourceMap> {
        const rawSourceMap = this.sourceMapGenerator.generator.toJSON();
        const sourceMap = new SourceMap();
        await sourceMap.addSourceMap(rawSourceMap);
        return sourceMap;
    }
}

//
// Identifies a line in a cell.
//
export interface ICellLine {
    //
    // The Id for the cell.
    //
    cellId: string;

    //
    // The line number within the cell.
    //
    lineNumber: number;

    //
    // The column number within the cell.
    //
    columnNumber: number;
}

//
// Maps line numbers in generated code to line numbers in a notebook.
//
export interface ISourceMap {

    destroy(): void;

    getSourceMap(): any;

    addSourceMap(sourceMap: any): Promise<void>;

    //
    // Map a line in generated code to a line in the notebook.
    //
    mapLine(lineNumber: number, columnNumber: number, onlyOriginal: boolean): Promise<ICellLine | undefined>;
}

//
// Maps line numbers in generated code to line numbers in a notebook.
//
export class SourceMap implements ISourceMap {

    origRawSourceMap?: any;
    rawSourceMap?: any;
    origConsumer?: any;
    consumer?: any;

    constructor(sourceMap?: any) {
        this.rawSourceMap = sourceMap;
    }

    destroy(): void {
        if (this.origConsumer) {
            this.origConsumer.destroy();
            delete this.origConsumer;
        }

        if (this.consumer) {
            this.consumer.destroy();
            delete this.consumer;
        }
    }

    async addSourceMap(sourceMap: any): Promise<void> {
        if (this.rawSourceMap) {
            this.rawSourceMap = merge(this.rawSourceMap, sourceMap);
        }
        else {
            this.origRawSourceMap = this.rawSourceMap = sourceMap;
        }
    }

    getSourceMap(): any {
        return this.rawSourceMap;
    }

    private async getConsumer() {
        if (!this.consumer) {
            this.consumer = await new sourceMap.SourceMapConsumer(this.rawSourceMap);
        }

        return this.consumer;
    }

    private async getOrigConsumer() {
        if (!this.origConsumer) {
            this.origConsumer = await new sourceMap.SourceMapConsumer(this.origRawSourceMap);
        }

        return this.origConsumer;
    }

    //
    // Map a line in generated code to a line in the notebook.
    //
    async mapLine(lineNumber: number, columnNumber: number, onlyOriginal: boolean): Promise<ICellLine | undefined> {

        const consumer = onlyOriginal ? await this.getOrigConsumer() : await this.getConsumer();
        const sourcePosition = consumer.originalPositionFor({ line: lineNumber, column: columnNumber });
        if (sourcePosition && sourcePosition.line !== null) {
            if (sourcePosition.source) {
                if (sourcePosition.source.startsWith("cell-")) {
                    return { 
                        cellId: sourcePosition.source.substring(5), 
                        lineNumber: sourcePosition.line!,
                        columnNumber: sourcePosition.column,
                    };
                }
            }
        }

        return undefined;
    }
}
