import { CodeEvaluator } from "../lib/code-evaluator";
import { dedent } from "utils";

describe('code evaluator', () => {

    test("can install notebook", async () => {

        const code = "const axios = require('axios');";
        const projectPath = "/project/path";
        const mockProcess: any = {};
        const notebook: any = {
            cells: [
                {
                    cellType: "code",
                    code,
                }
            ],
        };
        const mockNpm: any = {
            ensureRequiredModules: jest.fn(),
        };
        const mockLog: any = {
            info: () => { },
        };
        const codeEvaluator = new CodeEvaluator(mockProcess, notebook, notebook.cells, "file.notebook", projectPath, mockNpm, mockLog);

        await codeEvaluator.installNotebook();

        expect(mockNpm.ensureRequiredModules).toHaveBeenCalledWith(code, projectPath, false);
    });

    test("can evaluate notebook", async () => {
        const code = dedent`
            const axios = require('axios');
            console.log("Hello world!");
        `;
        const projectPath = ".";
        const notebook: any = {
            cells: [
                {
                    instanceId: "1234",
                    cellType: "code",
                    code,
                }
            ],
        };
        const mockNpm: any = {
            ensureRequiredModules: jest.fn(),
        };
        const mockLog: any = {
            error: (msg: any) => { console.log(msg); },
            info: () => { },
        };

        const outputs: any = [];

        const codeEvaluator = new CodeEvaluator(process, notebook, notebook.cells, "file.notebook", projectPath, mockNpm, mockLog);
        codeEvaluator.onDisplay = (cellId, output) => {
            outputs.push({
                cellId,
                output,
            });
        };

        function evaluate() {
            return new Promise<void>((resolve, reject) => {
                codeEvaluator.onEvaluationCompleted = resolve;
                codeEvaluator.evalCode();
            });
        }

        await evaluate();

        expect(mockNpm.ensureRequiredModules).toHaveBeenCalledWith(code, projectPath, false);

        expect(outputs).toEqual([
            {
                cellId: '1234',
                output: { 
                    displayType: 'text', 
                    data: 'Hello world!\n' ,
                },
            }
        ]);
    });
});