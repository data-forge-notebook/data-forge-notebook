import { JavaScriptCodeGenerator } from "evaluation-engine/build/lib/javascript-code-generator";

async function main() {
    const notebook: any = {
        "version": 4,
        "cells": [
            {
                "instanceId": "4cb8affa-34eb-4c7f-9db0-c3019a165051",
                "cellType": "code",
                "code": "const x = (1 + 2;"
            }
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