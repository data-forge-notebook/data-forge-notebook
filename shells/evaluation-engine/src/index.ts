import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";
import { NOTEBOOK_TIMEOUT_MS } from "./config";
import * as fs from "fs-extra";

const cluster = require("cluster");

//
// Remove previously evaluated notebooks.
//
fs.removeSync("./tmp");

// https://nodejs.org/docs/latest-v14.x/api/cluster.html#cluster_cluster_settings
cluster.setupPrimary({
    exec: path.join(__dirname, "worker"),
});

// 
// Look up table for workers.
//
const workers: { [index: string]: any} = {};

//
// Look up table for messages.
//
const messages: any = {};

//
// Work a worker to do an evaluation.
//
function forkEvalWorker(msg: any): void {

    const notebookId = msg.notebookId;

    const worker = cluster.fork({
        "ID": notebookId,
        "INIT": JSON.stringify(msg),
    });

    console.log(`Starting worker ${notebookId} (Node.js id ${worker.id})`);

    workers[notebookId] = worker;
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
        worker.kill();

        notebookTimeout = undefined;
        
    }, NOTEBOOK_TIMEOUT_MS);

    worker.on("error", (err: any) => {
        console.error(`Error from worker:`);
        console.error(err);
    });

    worker.on("exit", () => {
        console.log(`Worker exited.`);

        if (workers[notebookId]) {
            if (notebookTimeout) {
                // Cancel the timeout.
                clearTimeout(notebookTimeout);
                notebookTimeout = undefined;
            }

            //
            // As far as we know the worker should still be running.
            //
            onUnexpectedWorkerCompletion(notebookId);
        }
    });

    worker.on("message", (message: any) => {
        console.log("Worker message:");
        console.log(message);

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

            //
            // Evaluation finished normally.
            //
            onWorkerCompletion(message.workerId);
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
        
        worker.kill();
    }
}

//
// Event raised on worker completion.
//
function onWorkerCompletion(workerId: string): void {
    console.log(`Worker ${workerId} completed.`);
    delete workers[workerId];
    setTimeout(() => { // Give the client 1 minute to retreive messages before cleaning them up.
        delete messages[workerId];
        console.log(`Cleaned up messages for worker ${workerId}`);
    }, 1 * 60 * 1000);
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
    const notebookId = event.notebookId;

    if (messages[notebookId]) {
        messages[notebookId].push({
            name: event.name,
            args: event.args,
            notebookId: notebookId,
        });
    }
}

const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

//
// Gets stats about the server.
//
app.get("/stats", (req, res) => {
    res.json({
        numWorkers: Object.keys(workers).length,
    });
});

//
// Get pending messages.
//
app.post("/messages", (req, res) => {

    const body = req.body;
    const notebookId = body.notebookId;

    res.json({
        messages: messages[notebookId],
    }); 
});

//
// Tests that the process can surive the death of the evaluator.
//
app.post("/test-death", (req, res) => {
    console.log("Starting notebook eval with simulated death.");
    
    forkEvalWorker({
        cmd: "test-death",
    });

    res.status(200).end();
});

//
// Tests that the process can survive an exception in the worker.
//
app.post("/test-exception", (req, res) => {
    console.log("Starting notebook eval that throws an exception.");

    forkEvalWorker({
        cmd: "test-exception",
    });

    res.status(200).end();
});

//
// Tests that the process can terminate a long running notebook.
//
app.post("/test-long", (req, res) => {
    console.log("Staring a long running notebook.");

    forkEvalWorker({
        cmd: "test-long",
    });

    res.status(200).end();
});

//
// Evaluates a notebook.
//
app.post("/evaluate", (req, res) => {
    console.log(`Eval notebook:`);
    console.log(req.body);

    const body = req.body;

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
app.post("/stop-evaluation", (req, res) => {
    console.log("Request to stop evaluation!");

    const body = req.body;
    killWorkers(body.notebookId);

    res.status(200).end();
});

app.listen(port, () => {
    console.log(`Evaluation engine listening on port ${port}`)
});
