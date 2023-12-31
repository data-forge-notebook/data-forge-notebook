import { CodeEvaluator } from "evaluation-engine";
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

    const mockNpm: any = {
        ensureRequiredModules() {

        },
    };

    const mockLog: any = {
        error(message: string, ...args: any[]) {
            console.error(message, ...args);
        },

        info(message: string, ...args: any[]) {
            console.log(message, ...args);
        },
        
    };

    // const codeGenerator = new JavaScriptCodeGenerator(notebook, "test-path", mockLog);
    // const code = await codeGenerator.genCode(notebook.cells);

    // console.log(JSON.stringify(code, null, 4));

    // for (const diagnostic of code.diagnostics) {
    //     this.reportError(ErrorSource.Compiler, this.getCurCellId(), diagnostic.message, diagnostic.location, undefined);
    // }

    const codeEvaluator = new CodeEvaluator(process, notebook, notebook.cells, "test-notebook", "c://temp", mockNpm, mockLog);
    await codeEvaluator.evalCode();
}

main()
    .catch(err => {
        console.error(err);
    });