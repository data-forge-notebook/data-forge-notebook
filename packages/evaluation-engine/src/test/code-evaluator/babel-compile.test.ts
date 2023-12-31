import { babelCompile } from "../../lib/babel-compile";
import { dedent } from "../lib/dedent";

describe("babel-compile", () => {

    test("javascript constant", async () => {
        const mockLog: any = {};
        const code = "const x = 1;";
        const projectPath = "/tmp";

        const result = await babelCompile(mockLog, code, projectPath);

        expect(result.code).toBe(
            dedent`
                "use strict";

                const x = 1;
            `
        );
        expect(result.diagnostics).toEqual([]);
        expect(result.sourceMapData).toEqual({
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
        });
    });

    test("typescript constant", async () => {
        const mockLog: any = {};
        const code = "const x: int = 1;";
        const projectPath = "/tmp";

        const result = await babelCompile(mockLog, code, projectPath);

        expect(result.code).toBe(
            dedent`
                "use strict";

                const x = 1;
            `
        );
        expect(result.diagnostics).toEqual([]);
        expect(result.sourceMapData).toEqual({
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
        });
    });
});