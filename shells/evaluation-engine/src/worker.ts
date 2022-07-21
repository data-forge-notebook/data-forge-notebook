//
// A worker process for evaluating code.
//

import { Notebook } from "model";
import { evaluateNotebook } from "./evaluation-engine";
import * as fs from "fs-extra";
import { sleep } from "utils";

const workerId = process.env.ID;
if (!workerId) {
    console.error(`Worker ID not supplied.`);
    process.exit(1);
}

const msg = JSON.parse(process.env.INIT as string);

console.log(`Started worker ${workerId}`);
console.log(`With msg:`);
console.log(msg);

const oldProcess = process;

//
// Wipe out these so that user code can't access.
//
global.process = Object.assign({}, global.process);
global.process.env = {};
global.process.send = () => true;

async function main(): Promise<void> {
    
    if (msg.cmd === "eval-notebook") {
    
        const notebookId = msg.notebookId;
        const projectPath = `./tmp/notebooks/${notebookId}`;
        await fs.ensureDir(projectPath); 

        const notebook = Notebook.deserialize(msg.notebook);

        let cells;
        if (msg.cellId) {
            if (msg.singleCell) {
                const cell = notebook.findCell(msg.cellId);
                if (cell) {
                    cells = [ cell ];
                }
                else {
                    throw new Error(`Failed to find cell ${msg.cellId}`);
                }
            }
            else {
                let foundCell = false;
                cells = [];
                for (const cell of notebook.getCells()) {
                    cells.push(cell);
                    if (cell.getId() === msg.cellId) {
                        foundCell = true;
                        break;
                    }
                }
            
                if (!foundCell) {
                    throw new Error(`Failed to find cell ${msg.cellId}`);
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


