//
// A worker process for evaluating code.
//

import { ISerializedNotebook1, Notebook } from "model";
import { evaluateNotebook } from "./evaluation-engine";
import * as fs from "fs-extra";
import { sleep } from "utils";

const workerId = process.env.ID;
if (!workerId) {
    console.error(`Worker ID not supplied.`);
    process.exit(1);
}

export interface IWorkerMsg {
    //
    // The command to invoke in the worker.
    //
    cmd: string;

    //
    // The ID of the notebook to be evaluated.
    //
    notebookId: string;
}

export interface IEvaluateNotebookMsg extends IWorkerMsg {

    //
    // The notebook to evaluate.
    //
    notebook: ISerializedNotebook1;

    //
    // Optional ID of the cell to evaluate.
    //
    cellId?: string;

    //
    // Set to true to evaluate only the single cell and no others.
    //
    singleCell?: boolean;
}

const msg: IWorkerMsg = JSON.parse(process.env.INIT as string);

// console.log(`Started worker ${workerId} from ${__dirname}/${__filename}`);
// console.log(`With args:`);
// console.log(process.argv);
// console.log(`With msg:`);
// console.log(msg);
// console.log(`With env:`);
// console.log(process.env);

const oldProcess = process;

//
// Wipe out these so that user code can't access.
//
global.process = Object.assign({}, global.process);
global.process.env = {};
global.process.send = () => true;

async function main(): Promise<void> {
    
    if (msg.cmd === "eval-notebook") {
        const evaluateNotebookMsg = msg as IEvaluateNotebookMsg;
        const notebookId = evaluateNotebookMsg.notebookId;
        const projectPath = `./tmp/notebooks/${notebookId}`;
        await fs.ensureDir(projectPath); 

        const notebook = Notebook.deserialize(evaluateNotebookMsg.notebook);

        let cells;
        if (evaluateNotebookMsg.cellId) {
            if (evaluateNotebookMsg.singleCell) {
                const cell = notebook.findCell(evaluateNotebookMsg.cellId);
                if (cell) {
                    cells = [ cell ];
                }
                else {
                    throw new Error(`Failed to find cell ${evaluateNotebookMsg.cellId}`);
                }
            }
            else {
                let foundCell = false;
                cells = [];
                for (const cell of notebook.getCells()) {
                    cells.push(cell);
                    if (cell.getId() === evaluateNotebookMsg.cellId) {
                        foundCell = true;
                        break;
                    }
                }
            
                if (!foundCell) {
                    throw new Error(`Failed to find cell ${evaluateNotebookMsg.cellId}`);
                }
            }
        }
        else {
            cells = notebook.getCells();
        }
    
        evaluateNotebook(oldProcess, projectPath, notebook, cells,
            (name: string, args: any): void => {
                oldProcess.send!({
                    event: "notebook-event", // Raise event on primary.
                    workerId: workerId,
                    args: {
                        name: name,
                        args: args,
                        notebookId: notebookId
                    },
                });
            },
            () => {
                console.log(`!!!!!!!!!!!!! Evaluation completed.`);

                oldProcess.send!({
                    event: "completed", // Signal normal completion onNotebookEvent master.
                    workerId: workerId,
                });

                setTimeout(() => {
                    oldProcess.exit(0); // Ensure a clean exit.
                }, 100);
            }
        );
    }
    else if (msg.cmd === "test-death") {
        console.log("Simulated death of worker.");
        oldProcess.exit(1);
    }
    else if (msg.cmd === "test-exception") {
        console.log("Worker is throwing an exception.");
        throw new Error("Test exception");
    }
    else if (msg.cmd === "test-long") {
        console.log("Simulating a long running (infinite) notebook.");
        
        while (true) {
            await sleep(10 * 60 * 1000);
        }
    }
    else {
        console.error(`Unknown worker command "${msg.cmd}"`);
        oldProcess.exit(1);
    }
}

main()
    .catch(err => {
        console.error(`Worker failed with error:`);
        console.error(err && err.stack || err);
        oldProcess.exit(2);
    });


