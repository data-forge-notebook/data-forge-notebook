import { enableInjector, disableInjector } from "@codecapers/fusion";
import { CodeGenerator } from "../lib/code-generator";
import { dedent } from "./lib/dedent";

describe("code generator", () => {

    let mockLog: any;
    mockLog = {
        info: () => {},
    };

    beforeAll(() => {
        disableInjector();
    });

    afterAll(() => {
        enableInjector();
    });

    test("can compile empty notebook", async () => {
        const emptyNotebook = {
            "version": 1,
            "language": "javascript",
            "cells": []
        };

        const codeGenerator = new CodeGenerator(emptyNotebook, "test-path", mockLog);
        const code = await codeGenerator.genCode([]);
        const expected = dedent`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
              __end();
            }; await wrapperFn(); })
        `;

        expect(code.code!).toEqual(expected);
        expect(code.sourceMapData).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    test("can compile notebook with a single code cell", async () => {
        const notebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "instanceId": "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "console.log(\"Hello JavaScript!\");",
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

        const codeGenerator = new CodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.cells);

        const expected = dedent`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
              __cell(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                console.log("Hello JavaScript!");
                __capture_locals(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
                __end();
              });
            }; await wrapperFn(); })
        `;

        expect(code.code!).toEqual(expected);
        expect(code.sourceMapData).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    test("can compile notebook with multiple code cells", async () => {
        const notebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "instanceId": "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "console.log(\"Cell 1!\");",
                },
                {
                    "instanceId": "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "console.log(\"Cell 2!\");",
                },
            ]
        };

        const codeGenerator = new CodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.cells);

        const expected = dedent`
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
        `;

        expect(code.code!).toEqual(expected);
        expect(code.sourceMapData).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    test("markdown cells are stripped", async () => {
        const notebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "instanceId": "e9fe6a21-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "markdown",
                    "code": "# This is markdown!",
                },
            ]
        };

        const codeGenerator = new CodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.cells);

        const expected = dedent`
          (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

          const wrapperFn = async function () {
            __end();
          }; await wrapperFn(); })
        `;

        expect(code.code!).toEqual(expected);
        expect(code.sourceMapData).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    test("require statement", async () => {
        const notebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "instanceId": "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "const foo = require('foo');",
                },
            ]
        };

        const codeGenerator = new CodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.cells);

        const expected = dedent`
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
        `;

        expect(code.code!).toEqual(expected);
        expect(code.sourceMapData).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    test("import statement", async () => {
        const notebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "instanceId": "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "import foo from 'foo';",
                },
            ]
        };

        const codeGenerator = new CodeGenerator(notebook, "test-path", mockLog);
        const code = await codeGenerator.genCode(notebook.cells);

        const expected = dedent`
          (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          const wrapperFn = async function () {
            __cell(0, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
              __capture_locals(0, "a9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
              __end();
            });
          }; await wrapperFn(); })
        `;

        expect(code.code!).toEqual(expected);
        expect(code.sourceMapData).not.toBeUndefined();
        expect(code.diagnostics).toEqual([]);
    });

    test("can export notebook", async () => {
        const notebook: any = {
            "version": 1,
            "language": "javascript",
            "cells": [
                {
                    "instanceId": "e9fe6a21-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "markdown",
                    "code": "# Markdown!",
                },
                {
                    "instanceId": "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364",
                    "cellType": "code",
                    "cellScope": "global",
                    "code": "import foo from 'foo';",
                },
            ]
        };

        const codeGenerator = new CodeGenerator(notebook, "test-path", mockLog);
        const exported = (await codeGenerator.exportCode()).trim();

        const expected = dedent`
        import foo from 'foo';
        function display() {
             for (const arg of arguments) {
                  console.log(arg);
             }
        }
  
        async function main() {
  
  
        }
  
        main()
            .then(() => console.log("Done"))
            .catch(err => console.error(err && err.stack || err));            
        `;


        expect(exported).toEqual(expected);
    });

});