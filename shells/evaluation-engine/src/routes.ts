import * as express from "express";
import { NOTEBOOK_TIMEOUT_MS } from "./config";
import * as path from "path";
import { PerformanceObserverCallback } from "perf_hooks";
const cluster = require("cluster");

const api: express.Router = express.Router();

const workerPath = path.join(__dirname, "worker");
console.log(`Loading worker from ${workerPath}`);

if (process.env.NODE_ENV === "test") {
    console.log(`Running in test mode.`);

    // When running under Jest need to explictily invoke ts-node when forking workers.
    const tsNodePath = require.resolve("ts-node/dist/bin.js");
    cluster.setupPrimary({
        execArgv: [
            tsNodePath,
        ],
        exec: workerPath,
    });
}
else {
    cluster.setupPrimary({
        exec: workerPath,
    });
}

interface IWorker {
    //
    // Handle for the worker process.
    //
    handle: any;

    //
    // Set to true when the worker has completed successfully.
    //
    success: boolean;
}

// 
// Look up table for workers.
// Workers are indexed by notebook id.
//
const workers: { [index: string]: IWorker } = {};

//
// Look up table for messages indexed by notebook id.
//
const messages: any = {};

//
// Gets stats about the server.
//
api.get("/status", (req, res) => {
    const notebookIds = Object.keys(workers);
    res.json({
        numEvaluations: notebookIds.length,
        notebookIds: notebookIds,
    });
});

//
// Get pending messages.
//
api.post("/messages", (req, res) => {

    const body = req.body;
    const notebookId = body.notebookId;

    res.json({
        messages: messages[notebookId] || [],
    }); 

    //
    // Remove pending messages that have been retreived by the client.
    //
    messages[notebookId] = [];
});

//
// Tests that the process can surive the death of the evaluator.
//
api.post("/test-death", (req, res) => {
    console.log("Starting notebook eval with simulated death.");
    
    forkEvalWorker({
        cmd: "test-death",
    });

    res.status(200).end();
});

//
// Tests that the process can survive an exception in the worker.
//
api.post("/test-exception", (req, res) => {
    console.log("Starting notebook eval that throws an exception.");

    forkEvalWorker({
        cmd: "test-exception",
    });

    res.status(200).end();
});

//
// Tests that the process can terminate a long running notebook.
//
api.post("/test-long", (req, res) => {
    console.log("Staring a long running notebook.");

    forkEvalWorker({
        cmd: "test-long",
    });

    res.status(200).end();
});

//
// Evaluates a notebook.
//
api.post("/evaluate", (req, res) => {
    console.log(`Eval notebook:`);
    console.log(JSON.stringify(req.body, null, 4));

    const body = req.body;

    // Kill any existing workers before starting a new evaluation.
    killWorkers(body.notebookId);

    forkEvalWorker({
        cmd: "eval-notebook",
        notebookId: body.notebookId,
        notebook: body.notebook,
        cellId: body.cellId,
        singleCell: body.singleCell || false,
    });

    res.status(200).end();
});

//
// Kills all evaluation for a particular notebook.
//
api.post("/stop-evaluation", (req, res) => {
    console.log("Request to stop evaluation!");

    const body = req.body;
    killWorkers(body.notebookId);

    res.status(200).end();
});


//
// Work a worker to do an evaluation.
//
function forkEvalWorker(msg: any): void {

    const notebookId = msg.notebookId;

    const workerHandle = cluster.fork({
        "ID": notebookId,
        "INIT": JSON.stringify(msg),
    });

    console.log(`Starting worker ${notebookId} (Node.js id ${workerHandle.id})`);

    workers[notebookId] = {
        handle: workerHandle,
        success: false,
    };
    messages[notebookId] = [];

    let notebookTimeout: NodeJS.Timeout | undefined = setTimeout(() => {
        //
        // When the timeout expires abort the notebooks process.
        //
        console.log(`Notebook timed out.`);

        onNotebookTimeout(notebookId);

        //
        // Kill the worker.
        //
        workerHandle.kill();

        notebookTimeout = undefined;
        
    }, NOTEBOOK_TIMEOUT_MS);

    workerHandle.on("error", (err: any) => {
        console.error(`Error from worker:`);
        console.error(err);
    });

    workerHandle.on("exit", () => {
        console.log(`Worker exited.`);

        const worker = workers[notebookId];
        if (worker) {
            if (notebookTimeout) {
                // Cancel the timeout.
                clearTimeout(notebookTimeout);
                notebookTimeout = undefined;
            }

            if (worker.success) {
                //
                // The work has already completed successfully.
                //
                onWorkerCompletion(notebookId);
            }
            else {
                //
                // As far as we know the worker should still be running.
                //
                onUnexpectedWorkerCompletion(notebookId);
            }
        }
    });

    workerHandle.on("message", (message: any) => {
        // console.log("Worker message:");
        // console.log(message);

        if (message.workerId === undefined) {
            //
            // Ignore messages that don't declare their ID.
            //
            return;
        }
        
        if (workers[notebookId] === undefined) {
            //
            // Ignore messages from workers that have completed.
            //
            return;
        }

        if (message.event === "notebook-event") {
            onNotebookEvent(message.args);
        }
        else if (message.event === "completed") {
            if (notebookTimeout) {
                // Cancel the timeout.
                clearTimeout(notebookTimeout);
                notebookTimeout = undefined;
            }

            const worker = workers[message.workerId];
            if (worker) {
                //
                // Note that notebook evaluation has completed successfully.
                //
                worker.success = true;
            }
        }
    });
}

//
// Kill the worker for a particular notebook.
//
function killWorkers(notebookId: string): void {
    
    const worker = workers[notebookId];
    if (worker) {
        console.log(`Killing worker for notebook ${notebookId}.`);

        onWorkerCompletion(notebookId);
        
        worker.handle.kill();
    }
}

//
// Event raised on worker completion.
//
function onWorkerCompletion(notebookId: string): void {

    // the worker process has exited... there are no more messages coming
    // if there are no messages remaining we are dont.

    console.log(`Worker ${notebookId} completed.`);
    delete workers[notebookId];

    if (messages[notebookId] === undefined || messages[notebookId].length === 0) {
        // No messages remaining.
        // The worker has exited, so there is no possibility of new messages.
        delete messages[notebookId];
    }
    else {
        // Give the client 1 minute to retreive messages before cleaning them up.
        setTimeout(() => { 
            delete messages[notebookId];
            console.log(`Cleaned up messages for worker ${notebookId}`);
        }, 1 * 60 * 1000);
    }
}

//
// Event raised when a worker has completed unexpectedly.
//
function onUnexpectedWorkerCompletion(notebookId: string): void {
    console.log(`Worker ${notebookId} completed unexpectedly.`);
    onWorkerCompletion(notebookId);

    if (messages[notebookId]) {
        messages[notebookId].push({
            name: "evaluation-event",
            args: {
                event: "receive-error",
                error: "Notebook evaluation terminated unexpectedly.",
            },
            notebookId: notebookId,
        });

        messages[notebookId].push({
            name: "evaluation-event",
            args: {
                event: "notebook-eval-completed",
            },
            notebookId: notebookId,
        });
    }
};

//
// Event raised when a notebook has timed out.
//
function onNotebookTimeout(notebookId: string): void {
    console.log(`Worker ${notebookId} exceeded its time limit.`);
    onWorkerCompletion(notebookId);

    if (messages[notebookId]) {
        messages[notebookId].push({
            name: "evaluation-event",
            args: {
                event: "receive-error",
                error: "Notebook evaluation terminated unexpectedly.",
            },
            notebookId: notebookId,
        });

        messages[notebookId].push({
            name: "evaluation-event",
            args: {
                event: "notebook-eval-completed",
            },
            notebookId: notebookId,
        });
    }
}

//
// Event raised from the worker for a notebook event.
//
function onNotebookEvent(event: any): void {

    if (event.name === "debug-log") {
        // Just ignore debug logs for now.
        return;
    }

    const notebookId = event.notebookId;

    if (messages[notebookId]) {
        messages[notebookId].push({
            name: event.name,
            args: event.args,
            notebookId: notebookId,
        });
    }
}

export { api as api };