import "jest";
import { parseFileLocator, parseStackTrace } from "../../lib/parse-stack-trace";

describe("parse stack trace", () => {

    it("can handle parsing empty file locator", () => {
        expect(parseFileLocator("")).toEqual({
            filePath: "",
        });
    });

    it("can handle parsing file locator that just contains whitespace", () => {
        expect(parseFileLocator("   ")).toEqual({
            filePath: "",
        });
    });
    
    it("can parse basic file locator", () => {
        expect(parseFileLocator("my-file:1:2")).toEqual({
            filePath: "my-file",
            lineNumber: 1,
            column: 2,
        });
    });

    it("parsing file locator trims whitespace", () => {
        expect(parseFileLocator(" my-file : 1 : 2 ")).toEqual({
            filePath: "my-file",
            lineNumber: 1,
            column: 2,
        });
    });

    it("can parse file locator with no column", () => {
        expect(parseFileLocator("my-file:1")).toEqual({
            filePath: "my-file",
            lineNumber: 1,
        });
    });

    it("can parse file locator that has colons in the file path", () => {
        expect(parseFileLocator("my:file:1:2")).toEqual({
            filePath: "my:file",
            lineNumber: 1,
            column: 2,
        });
    });
    
    it("can parse file locator with spaces in the file path", () => {
        expect(parseFileLocator("my file:1:2")).toEqual({
            filePath: "my file",
            lineNumber: 1,
            column: 2,
        });
    });

    it("can parse file locator with no line or column", () => {
        expect(parseFileLocator("my-file")).toEqual({
            filePath: "my-file",
        });
    });
    
    it("parsing empty stack trace results in no frames", () => {

        expect(parseStackTrace("")).toEqual([]);
    });

    it("lines not starting with 'at' are ignored", () => {

        expect(parseStackTrace("not a valid line")).toEqual([]);
    });

    it("can parse anonymofus line", () => {
        expect(parseStackTrace("at <anonymous>")).toEqual([
            {
                filePath: "<system>",
            }
        ]);
    });

    it("can handle whitespace at start of the line", () => {
        expect(parseStackTrace(" at <anonymous>")).toEqual([
            {
                filePath: "<system>",
            }
        ]);
    });

    it("can parse multiple anonymous lines", () => {
        expect(parseStackTrace("at <anonymous>\nat <anonymous>\nat <anonymous>")).toEqual([
            {
                filePath: "<system>",
            },
            {
                filePath: "<system>",
            },
            {
                filePath: "<system>",
            },
        ]);
    });
    
    it("can parse line with just a file", () => {

        expect(parseStackTrace("at deep stack error.notebook:17:5")).toEqual([
            {
                filePath: "deep stack error.notebook",
                lineNumber: 17,
                column: 5,
            },
        ]);
    });

    it("can parse line with a full file path", () => {

        const line = "at C:\\projects\\data-forge-notebook\\data-forge-notebook\\src\\evaluator-server.ts:363:15";
        expect(parseStackTrace(line)).toEqual([
            {
                filePath: "C:\\projects\\data-forge-notebook\\data-forge-notebook\\src\\evaluator-server.ts",
                lineNumber: 363,
                column: 15,
            },
        ]);
    });
    
    it("can parse line with function and file", () => {

        expect(parseStackTrace("at woo (deep stack error.notebook:10:15)")).toEqual([
            {
                filePath: "deep stack error.notebook",
                functionName: "woo",
                lineNumber: 10,
                column: 15,
            }
        ]);
    });

    it("can parse line with function and full file path", () => {

        const line = "at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook\\ts-build\\evaluator-server.js:4:58)";
        expect(parseStackTrace(line)).toEqual([
            {
                filePath: "C:\\projects\\data-forge-notebook\\data-forge-notebook\\ts-build\\evaluator-server.js",
                functionName: "fulfilled",
                lineNumber: 4,
                column: 58,
            }
        ]);
    });

    it("can parse line with function and anonymous file", () => {
        const line = "at Generator.next (<anonymous>)";
        expect(parseStackTrace(line)).toEqual([
            {
                filePath: "<system>",
            }
        ]);
    })

    it("deep test", () => {
        const stackTrace =
            "Error: some error\n" +
            "   at woo (deep stack error.notebook:10:15)\n" +
            "   at blah (deep stack error.notebook:14:9)\n" +
            "   at deep stack error.notebook:17:5\n" +
            "   at C:\\projects\\data-forge-notebook\\data-forge-notebook\\src\\evaluator-server.ts:363:15\n" +
            "   at Generator.next (<anonymous>)\n" +
            "   at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook\\ts-build\\evaluator-server.js:4:58)\n" +
            "   at <anonymous>\n" +
            "   at process._tickCallback (internal/process/next_tick.js:188:7)";
        const parsed = parseStackTrace(stackTrace);
        expect(parsed).toEqual([ 
            { 
                filePath: 'deep stack error.notebook',
                lineNumber: 10,
                column: 15,
                functionName: 'woo' 
            },
            { 
                filePath: 'deep stack error.notebook',
                lineNumber: 14,
                column: 9,
                functionName: 'blah' 
            },
            { 
                filePath: 'deep stack error.notebook',
                lineNumber: 17,
                column: 5 
            },
            { 
                filePath: "C:\\projects\\data-forge-notebook\\data-forge-notebook\\src\\evaluator-server.ts", 
                lineNumber: 363, 
                column: 15 
            },
            { 
                filePath: '<system>',
            },
            { 
                filePath: 'C:\\projects\\data-forge-notebook\\data-forge-notebook\\ts-build\\evaluator-server.js',
                lineNumber: 4,
                column: 58,
                functionName: 'fulfilled' 
            },
            { 
                filePath: '<system>' 
            },
            { 
                filePath: 'internal/process/next_tick.js',
                lineNumber: 188,
                column: 7,
                functionName: 'process._tickCallback' 
            } 
        ]);
    });

});