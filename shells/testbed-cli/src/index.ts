import { JavaScriptCodeGenerator } from "evaluation-engine/build/lib/javascript-code-generator";

async function main() {
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

    const mockLog: any = {};

    const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
    const code = await codeGenerator.genCode(notebook.cells);

    console.log(JSON.stringify(code, null, 4));
}

main()
    .catch(err => {
        console.error(err);
    });