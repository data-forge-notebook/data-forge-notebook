import { babelCompile } from "../lib/babel-compile";
import { dedent } from "./lib/dedent";

describe("babel-compile", () => {

    test("javascript constant", async () => {
        const mockLog: any = {};
        const code = "const x = 1;";
        const projectPath = "/tmp";

        const result = await babelCompile(mockLog, code, projectPath);

        expect(result).toEqual({
            "code": "\"use strict\";\n\nconst x = 1;",
            "diagnostics": [],
            "sourceMapData": {
                "version": 3,
                "names": [
                    "x"
                ],
                "sources": [
                    "in-memory-file.ts"
                ],
                "sourcesContent": [
                    "const x = 1;"
                ],
                "mappings": ";;AAAA,MAAMA,CAAC,GAAG,CAAC"
            }
        });
    });

    test("javascript error", async () => {
        const mockLog: any = {};
        const code = "1 = x;";
        const projectPath = "c:\\tmp";

        const result = await babelCompile(mockLog, code, projectPath);

        expect(result).toEqual( {
            "diagnostics": [
                {
                    "message": "c:\\tmp\\in-memory-file.ts: Invalid left-hand side in assignment expression. ",
                    "location": {
                        "fileName": "in-memory-file.ts",
                        "line": 1,
                        "column": 0
                    },
                    "source": "Babel"
                }
            ]
        });
    });

    test("typescript constant", async () => {
        const mockLog: any = {};
        const code = "const x: int = 1;";
        const projectPath = "/tmp";

        const result = await babelCompile(mockLog, code, projectPath);

        expect(result).toEqual({
            "code": "\"use strict\";\n\nconst x = 1;",
            "diagnostics": [],
            "sourceMapData": {
                "version": 3,
                "names": [
                    "x"
                ],
                "sources": [
                    "in-memory-file.ts"
                ],
                "sourcesContent": [
                    "const x: int = 1;"
                ],
                "mappings": ";;AAAA,MAAMA,CAAM,GAAG,CAAC"
            }
        });
    });

    test("typescript error doesn't fail the compile", async () => {
        const mockLog: any = {};
        const code = "const x: int = 'fooey';";
        const projectPath = "/tmp";

        const result = await babelCompile(mockLog, code, projectPath);

        expect(result).toEqual({
            "code": "\"use strict\";\n\nconst x = 'fooey';",
            "diagnostics": [],
            "sourceMapData": {
                "version": 3,
                "names": [
                    "x"
                ],
                "sources": [
                    "in-memory-file.ts"
                ],
                "sourcesContent": [
                    "const x: int = 'fooey';"
                ],
                "mappings": ";;AAAA,MAAMA,CAAM,GAAG,OAAO"
            }
        });
    });
});