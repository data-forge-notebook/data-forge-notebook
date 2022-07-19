import "jest";
import { enableInjector, disableInjector } from "@codecapers/fusion";
import { JavaScriptCodeGenerator } from "../../lib/javascript-code-generator";
import { Notebook } from "model";

function trim(input: string): string {
    const lines = input.split("\n")
        .map(line => line.trim()) // Trim white space.
        .filter(line => line.length > 0) // Filter blank lines.
    return lines.join("\r\n");
}

describe("javascript code generation", () => {

    let mockLog: any;
    mockLog = {
        info: () => {},
    };

    let  mockPerformanceStatsCollection: any;
    mockPerformanceStatsCollection = {
        submitMeasurement: () => {},
    };

    beforeAll(() => {
        disableInjector();
    });

    afterAll(() => {
        enableInjector();
    });

    it("can compile empty notebook", async () => {
        const emptyNotebook = {
            "version": 1,
            "language": "javascript",
            "cells": []
        };

        const codeGenerator = new JavaScriptCodeGenerator(Notebook.deserialize(emptyNotebook), "test-path", mockLog);
        const code = await codeGenerator.genCode([]);
        const expected = trim(`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
            __end();
            }; await wrapperFn(); })
        `);

        expect(trim(code.code!)).toEqual(expected);
        expect(code.sourceMap).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    it("can compile notebook with a single code cell", async () => {
        const serializedNotebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "id": "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "console.log(\"Hello JavaScript!\");",
                    "lastEvaluationDate": "2019-06-06T20:12:41.602+10:00",
                    "output": [
                        {
                            "values": [
                                {
                                    "data": "Hello JavaScript!\n",
                                    "displayType": "string"
                                }
                            ]
                        }
                    ],
                    "errors": []
                },
            ]
        };

        const notebook = Notebook.deserialize(serializedNotebook);
        const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.getCells());
        const expected = trim(`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
            __cell(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                console.log("Hello JavaScript!");
    
                __capture_locals(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
    
                __end();
            });
            }; await wrapperFn(); })
        `);

        expect(trim(code.code!)).toEqual(expected);
        expect(code.sourceMap).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    it("can compile notebook with multiple code cells", async () => {
        const serializedNotebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "id": "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "console.log(\"Cell 1!\");",
                },
                {
                    "id": "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "console.log(\"Cell 2!\");",
                },
            ]
        };

        const notebook = Notebook.deserialize(serializedNotebook);
        const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.getCells());
        const expected = trim(`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
            __cell(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                console.log("Cell 1!");
    
                __capture_locals(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
    
                __cell(1, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                console.log("Cell 2!");
    
                __capture_locals(1, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
    
                __end();
                });
            });
            }; await wrapperFn(); })
        `);

        expect(trim(code.code!)).toEqual(expected);
        expect(code.sourceMap).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    it("markdown cells are stripped", async () => {
        const serializedNotebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "id": "e9fe6a21-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "markdown",
                    "code": "# This is markdown!",
                },
            ]
        };

        const notebook = Notebook.deserialize(serializedNotebook);
        const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.getCells());
        const expected = trim(`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
            __end();
            }; await wrapperFn(); })
        `);

        expect(trim(code.code!)).toEqual(expected);
        expect(code.sourceMap).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    it("require statement", async () => {
        const serializedNotebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "id": "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "const foo = require('foo');",
                },
            ]
        };

        const notebook = Notebook.deserialize(serializedNotebook);
        const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.getCells());
        const expected = trim(`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
            __cell(0, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                const foo = require('foo');
    
                __capture_locals(0, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({
                foo: foo
                }));
    
                __end();
            });
            }; await wrapperFn(); })
        `);

        expect(trim(code.code!)).toEqual(expected);
        expect(code.sourceMap).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    it("import statement", async () => {
        const serializedNotebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "id": "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "import foo from 'foo';",
                },
            ]
        };

        const notebook = Notebook.deserialize(serializedNotebook);
        const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.getCells());
        const expected = trim(`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            var _foo = _interopRequireDefault(require("foo"));
    
            function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
            const wrapperFn = async function () {
            __cell(0, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                __capture_locals(0, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
    
                __end();
            });
            }; await wrapperFn(); })
        `);

        expect(trim(code.code!)).toEqual(expected);
        expect(code.sourceMap).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    it("can export notebook", async () => {
        const serializedNotebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "id": "e9fe6a21-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "markdown",
                    "code": "# Markdown!",
                },
                {
                    "id": "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "import foo from 'foo';",
                },
            ]
        };

        const notebook = Notebook.deserialize(serializedNotebook);
        const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
        const exported = trim(await codeGenerator.exportCode());
        const expected = trim(`
            import foo from 'foo';
            function display() {
                for (const arg of arguments) {
                    console.log(arg);
                }
            }
            display.text = display.html = display.plot = display.markdown = display.json = display.geo = display;
            display.table = function () {
                for (const arg of arguments) {
                    console.table(arg);
                }
            }
    
            async function main() {
    
    
            }
    
            main()
                .then(() => console.log("Done"))
                .catch(err => console.error(err && err.stack || err));
        `);

        expect(exported).toEqual(expected);
    });

});