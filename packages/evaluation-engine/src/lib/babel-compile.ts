import { IDiagnostic } from "./language-code-generator";
import { ILog } from "utils";
import { isArray } from "util";
import { transform, TransformOptions } from "@babel/core";
import { customPlugin } from "./babel-plugin";

//
// Result of compiling TypeScript code.
//
export interface ICompilationResult {
    code?: string;
    diagnostics: IDiagnostic[];
    sourceMapData?: any;
};

//
// Compiler JavaScript code using babel.
//
function internalBabelCompile(log: ILog, code: string, babelConfig: TransformOptions): Promise<ICompilationResult> {
    return new Promise((resolve) => {
        transform(code, babelConfig, function(err: any, result: any) {

            // log.info("Babel compilation:");
            // if (err) {
            //     log.info("Error:\n" + JSON.stringify(err, null, 4) + "\nMessage:\n" + err.message);
            // }
            // else {
            //     log.info("No error");
            // }

            // if (result) {
            //     log.info("========= Babel result =========");
            //     log.info(JSON.stringify(result, null, 4));
            // }
            // else {
            //     log.info("Babel result: nothing.");
            // }

            if (err) {
                //
                // Remove the code from the error message.
                // This is a bit dodgey. I had hoped that Babel options could omit this but it didn't work.
                // Be good to revist later.
                //
                const errLines = [];
                for (const errLine of err.message.split("\n")) {
                    if (errLine.length === 0) {
                        break;
                    }
                    
                    errLines.push(errLine);
                }

                let message = errLines.join("\n");

                // Strip line/column.
                const fileLineRegex = /(.*)\(\d*:\d*\)/m;
                const match = fileLineRegex.exec(message);
                if (match) {
                    message = match[1];
                }
                
                resolve({
                    diagnostics: [
                        {
                            message,
                            location: {
                                fileName: "in-memory-file.ts",
                                line: err && err.loc && err.loc.line,
                                column: err && err.loc && err.loc.column,
                            },
                            source: "Babel",
                        },
                    ],
                });
                return;
            }

            resolve({
                code: result!.code!,
                diagnostics: [],
                sourceMapData: result!.map!,
            });
        });
    });
}

//
// Compiler JavaScript code using babel.
//
export async function babelCompile(log: ILog, code: string, projectPath: string): Promise<ICompilationResult> {
    const babelConfig: TransformOptions = {
        filename: "in-memory-file.ts",
        presets: [
            [
                require("@babel/preset-env"),
                {
                    "targets": {
                        "node": "20",
                    },
                },
            ],
            [
                require("@babel/preset-typescript"),
                {
                    "targets": {
                        "node": "20",
                    },
                },
            ],
        ],
    };
    
    if (babelConfig.plugins) {
        if (isArray(babelConfig.plugins)) {
            babelConfig.plugins.unshift(customPlugin);
        }
    }
    else {
        babelConfig.plugins = [
            customPlugin,
        ];
    }
    babelConfig.ast = false;
    babelConfig.cwd = projectPath;
    babelConfig.sourceMaps = true;
    babelConfig.highlightCode = false;
    return await internalBabelCompile(log, code, babelConfig);
}
