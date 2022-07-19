import "jest";
import { SourceMapGenerator } from "../../lib/source-map";
import { formatErrorMessage, ErrorSource } from "../../lib/format-error-message";
import { SourceMap } from "../../lib/source-map";
import * as path from "path";

SourceMapGenerator.init(path.join(__dirname, "../../../lib/source-map/lib/mappings.wasm"));

describe.skip("format error message", () => {

    it("format error message - syntax errror", async () => {

        const input = {
            "fileName": "error - syntax error.notebook",
            "errorSource": "Code setup",
            "errorMessage": "Unexpected token ;",
            "errorStack": "error - syntax error.notebook:4\n    const x = (1 + 2;\n                    ^\n\nSyntaxError: Unexpected token ;\n    at new Script (vm.js:80:7)\n    at createScript (vm.js:274:10)\n    at Object.runInThisContext (vm.js:326:10)\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:310:29)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-2a0bc263-84de-11e8-bd48-252399c91c27"
                ],
                "names": [],
                "mappings": ";;;CAAA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeSetup,
            undefined,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "Unexpected token ;\r\nat <anonymous> (1)",
            "cellId": "2a0bc263-84de-11e8-bd48-252399c91c27",
            "location": "at <anonymous> (1)",
            "stack": ""
        });
    });

    it("format error message - typescript error", async () => {

        const input = {
            "fileName": "error - typescript type error.notebook",
            "errorSource": "Compiler",
            "errorMessage": "Argument of type '\"Hello TypeScript!\"' is not assignable to parameter of type 'number'.",
            "errorLocation": {
                "fileName": "C:/projects/data-forge-notebook/data-forge-notebook-dev/test/in-memory-file.ts",
                "lineNumber": 7,
                "columnNumber": 1,
            },
            "sourceMap": [
                {
                    "version": 3,
                    "sources": [
                        "cell-f3c08f51-24e3-11e9-a63a-c97fe03898f5"
                    ],
                    "names": [],
                    "mappings": ";;CAAA;CACA;CACA;CACA;CACA",
                    "file": "",
                    "sourceRoot": ""
                },
                {
                    "version": 3,
                    "file": "in-memory-file.js",
                    "sourceRoot": "",
                    "sources": [
                        "in-memory-file.ts"
                    ],
                    "names": [],
                    "mappings": ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAAA,CAAC,UAAgB,OAAiB,EAAE,UAAkB,EAAE,SAAiB,EAAE,OAAiB,EAAE,mBAA6B,EAAE,iBAA2B;;QAEpJ,SAAS,eAAe,CAAC,IAAY;YACjC,OAAO,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC;QACtB,CAAC;;YAHL,mBAAmB,CAAC,sCAAsC,CAAC,CAAC;YAKxD,eAAe,CAAC,mBAAmB,CAAC,CAAC;YACzC,iBAAiB,CAAC,sCAAsC,CAAC,CAAC;;;;CAEzD,CAAC,CAAA"
                }
            ]
        };

        const sourceMap = new SourceMap(input.sourceMap[0]);
        sourceMap.addSourceMap(input.sourceMap[1])

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeSetup,
            undefined,
            input.errorMessage,
            input.errorLocation,
            undefined,
            await sourceMap
        );

        expect(msg).toEqual({
            "display": "Argument of type '\"Hello TypeScript!\"' is not assignable to parameter of type 'number'.\r\nat <anonymous> (5)",
            "cellId": "f3c08f51-24e3-11e9-a63a-c97fe03898f5",
            "location": "at <anonymous> (5)"
        });
    });

    it("format error message - a long error message", async () => {

        const input =     {
            "fileName": "error - a long error message.notebook",
            "errorSource": "Code evaluation",
            "curCellId": "2a0bc263-84de-11e8-bd48-252399c91c27",
            "errorMessage": "foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey ",
            "errorStack": "Error: foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey \n    at error - a long error message.notebook:4:11\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:323:27)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-2a0bc263-84de-11e8-bd48-252399c91c27"
                ],
                "names": [],
                "mappings": ";;;CAAA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeEvaluation,
            input.curCellId,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey foobar donkey \r\nat <anonymous> (1:11)",
            "cellId": "2a0bc263-84de-11e8-bd48-252399c91c27",
            "stack": "at <anonymous> (1:11)"
        });
    });

    it("format error message - a deep stack error", async () => {

        const input = {
            "fileName": "error - deep stack error.notebook",
            "errorSource": "Code evaluation",
            "curCellId": "7c5e7c60-1917-11e9-83a8-474ce3a39435",
            "errorMessage": "my error!",
            "errorStack": "Error: my error!\n    at inner (error - deep stack error.notebook:10:15)\n    at outer (error - deep stack error.notebook:14:9)\n    at error - deep stack error.notebook:17:5\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:323:27)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-18f52840-1962-11e9-adfb-476805eddcf7",
                    "cell-7c5e7c60-1917-11e9-83a8-474ce3a39435"
                ],
                "names": [],
                "mappings": ";;;CAAA;CACA;CACA;;;CCFA;CACA;CACA;CACA;CACA;CACA;CACA;CACA;CACA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeEvaluation,
            input.curCellId,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "my error!\r\nat inner (2:15)\nat outer (6:9)\nat <anonymous> (9:5)",
            "cellId": "7c5e7c60-1917-11e9-83a8-474ce3a39435",
            "stack": "at inner (2:15)\nat outer (6:9)\nat <anonymous> (9:5)"
        });
    });

    it("format error message - a module error", async () => {

        const input = {
            "fileName": "error - no module.notebook",
            "errorSource": "Code evaluation",
            "curCellId": "fff1e850-84de-11e8-bd48-252399c91c27",
            "errorMessage": "Cannot find module 'woburt'",
            "errorStack": "Error: Cannot find module 'woburt'\n    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:582:15)\n    at resolveFileName (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\node_modules\\resolve-from\\index.js:17:39)\n    at resolveFrom (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\node_modules\\resolve-from\\index.js:31:9)\n    at module.exports (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\node_modules\\resolve-from\\index.js:34:41)\n    at module.exports.moduleId (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\node_modules\\resolve-cwd\\index.js:4:30)\n    at proxyRequire (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:298:44)\n    at error - no module.notebook:4:20\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:323:27)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-fff1e850-84de-11e8-bd48-252399c91c27"
                ],
                "names": [],
                "mappings": ";;;CAAA;CACA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeEvaluation,
            input.curCellId,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "Cannot find module 'woburt'\r\nat <anonymous> (1:20)",
            "cellId": "fff1e850-84de-11e8-bd48-252399c91c27",
            "stack": "at <anonymous> (1:20)"
        });
    });

    it("format error message - throwing an error object", async () => {

        const input = {
            "fileName": "error - throwing a error object.notebook",
            "errorSource": "Code evaluation",
            "curCellId": "2a0bc263-84de-11e8-bd48-252399c91c27",
            "errorMessage": "foobar",
            "errorStack": "Error: foobar\n    at error - throwing a error object.notebook:4:11\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:323:27)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-2a0bc263-84de-11e8-bd48-252399c91c27"
                ],
                "names": [],
                "mappings": ";;;CAAA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeEvaluation,
            input.curCellId,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "foobar\r\nat <anonymous> (1:11)",
            "cellId": "2a0bc263-84de-11e8-bd48-252399c91c27",
            "stack": "at <anonymous> (1:11)"
        });
    });

    it("format error message - throwing an error string", async () => {

        const input = {
            "fileName": "error - throwing a string.notebook",
            "errorSource": "Code evaluation",
            "curCellId": "2a0bc263-84de-11e8-bd48-252399c91c27",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-2a0bc263-84de-11e8-bd48-252399c91c27"
                ],
                "names": [],
                "mappings": ";;;CAAA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeEvaluation,
            input.curCellId,
            undefined,
            undefined,
            undefined,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "An error occurred.",
            "cellId": "2a0bc263-84de-11e8-bd48-252399c91c27"
        });
    });
    
    it("format error message - undefined variable", async () => {

        const input = {
            "fileName": "error - undefined variable.notebook",
            "errorSource": "Code evaluation",
            "curCellId": "2a0bc262-84de-11e8-bd48-252399c91c27",
            "errorMessage": "x is not defined",
            "errorStack": "ReferenceError: x is not defined\n    at error - undefined variable.notebook:5:5\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:323:27)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-2a0bc262-84de-11e8-bd48-252399c91c27"
                ],
                "names": [],
                "mappings": ";;;CAAA;CACA",
                "file": "",
                "sourceRoot": ""
            }
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeEvaluation,
            input.curCellId,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "x is not defined\r\nat <anonymous> (2:5)",
            "cellId": "2a0bc262-84de-11e8-bd48-252399c91c27",
            "stack": "at <anonymous> (2:5)"
        });
    });

    it("format error message - unexpected identifier", async () => {

        const input = {
            "fileName": "error - unexpected identifier.notebook",
            "errorSource": "Code setup",
            "errorMessage": "Unexpected identifier",
            "errorStack": "error - unexpected identifier.notebook:4\n    cosnt x = 3;\n          ^\n\nSyntaxError: Unexpected identifier\n    at new Script (vm.js:80:7)\n    at createScript (vm.js:274:10)\n    at Object.runInThisContext (vm.js:326:10)\n    at CodeEvaluator.<anonymous> (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\src\\code-evaluator\\code-evaluator.ts:310:29)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\projects\\data-forge-notebook\\data-forge-notebook-dev\\ts-build\\code-evaluator\\code-evaluator.js:4:58)",
            "sourceMap": {
                "version": 3,
                "sources": [
                    "cell-1ea43181-7ae4-11e9-9e03-9bc4336b9353"
                ],
                "names": [],
                "mappings": ";;;CAAA",
                "file": "",
                "sourceRoot": ""
            },
        };

        const msg = await formatErrorMessage(
            input.fileName,
            ErrorSource.CodeSetup,
            undefined,
            input.errorMessage,
            undefined,
            input.errorStack,
            await new SourceMap(input.sourceMap)
        );

        expect(msg).toEqual({
            "display": "Unexpected identifier\r\nat <anonymous> (1)",
            "cellId": "1ea43181-7ae4-11e9-9e03-9bc4336b9353",
            "location": "at <anonymous> (1)",
            "stack": ""
        });
    });
    
});