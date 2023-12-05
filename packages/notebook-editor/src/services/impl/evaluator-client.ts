import { InjectableSingleton } from "@codecapers/fusion";
import axios from "axios";
import { ISerializedNotebook1 } from "model";
import { IEventSource, EventSource, BasicEventHandler } from "utils";
import { EvaluationEventHandler, IEvaluatorClient, IEvaluatorId } from "../evaluator-client";

const baseUrl = process.env.EVALUATION_ENGINE_URL as string || "http://127.0.0.1:9000";

console.log(`Connecting to evaluation engine via ${baseUrl}`);

//
// Payload to the /install endpoint in the evaluation engine that evaluates a notebook.
//
interface IInstallNotebookPayload {

    //
    // The ID of the notebook to be installed.
    //
    notebookId: string;

    //
    // The notebook to install.
    //
    notebook: ISerializedNotebook1;

    //
    // The containing path of the notebook (if known).
    //
    containingPath?: string;
}

//
// Payload to the /stop-evaluation endpoint in the evaluation engine that stops evaluation of a notebook.
//
interface IStopEvaluationNotebookPayload {

    //
    // The ID of the notebook to be stopped.
    //
    notebookId: string;
}

//
// Payload to the /evaluate endpoint in the evaluation engine that evaluates a notebook.
//
interface IEvaluateNotebookPayload {

    //
    // The ID of the notebook to be evaluated.
    //
    notebookId: string;

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

    //
    // The containing path of the notebook (if known).
    //
    containingPath?: string;
}

//
// App-side client to the code evaluator.
//
@InjectableSingleton(IEvaluatorId)
export class EvaluatorClient implements IEvaluatorClient {

    //
    // Id of the notebook currently being evaluated, if any.
    //
    private notebookId?: string;

    //
    // The timer that runs the message pump during evaluation.
    //
    private intervalTimer?: NodeJS.Timer;

    //
    // The number of jobs running.
    //
    private numJobs: number = 0;

    //
    // Starts the message pump.
    //
    private startMessagePump() {
        if (this.intervalTimer) {
            // Message pump already running.
            return;
        }

        this.intervalTimer = setInterval(() => {
            this.messagePump()
                .catch((err: any) => {
                    console.error(`Error in message pump:`);
                    console.error(err && err.stack || err);
                });
        }, 1000);
        console.log(`Started the message pump.`);
    }

    //
    // Stops the message pump.
    //
    private stopMessagePump() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = undefined;
            console.log(`Stopped the message pump.`);
        }
    }

    //
    // Pump messages from the server.
    //
    private async messagePump(): Promise<void> {
        const { data } = await axios.post(`${baseUrl}/messages`, { notebookId: this.notebookId });

        // console.log(`Message pump:`);
        // console.log(data);

        if (data && data.messages && data.messages.length > 0) {

            for (const event of data.messages) {
                if (event.name === "evaluation-event") {
                    if (event.args.event === "notebook-install-completed") {
                        console.log(`Install completed!`);

                        this.numJobs = Math.max(0, this.numJobs - 1);

                        //
                        // Wait a moment then stop the message pump.
                        //
                        setTimeout(() => {
                            if (this.numJobs === 0) {
                                //
                                // If no new evaluation has started, stop the message pump.
                                //
                                this.stopMessagePump();
                            }
                        }, 5000);
                    }
                    else if (event.args.event === "notebook-eval-completed") {
                        console.log(`Evaluation completed!`);

                        this.numJobs = Math.max(0, this.numJobs - 1);

                        //
                        // Wait a moment then stop the message pump.
                        //
                        setTimeout(() => {
                            if (this.numJobs === 0) {
                                //
                                // If no new evaluation has started, stop the message pump.
                                //
                                this.stopMessagePump();
                            }
                        }, 5000);
                    }

                    this.onEvaluationEvent.raise(event.args);
                }
            }
        }
    }

    //
    // Installs the notebook.
    //
    installNotebook(notebookId: string, notebook: ISerializedNotebook1, containingPath?: string): void {
        this.notebookId = notebookId;
        this.numJobs += 1;
        this.startMessagePump();

        const installNotebookPayload: IInstallNotebookPayload = {
            notebookId: notebookId,
            notebook: notebook,
            containingPath: containingPath,
        };

        axios.post(`${baseUrl}/install`, installNotebookPayload)
            .catch((err: any) => {
                console.error(`API failed:`);
                console.error(err && err.stack || err);
            });
    }

    //
    // Stops evaluation of the notebook.
    //
    stopEvaluation(notebookId: string): void {

        this.numJobs = 0;
        this.stopMessagePump();

        const stopNotebookPayload: IStopEvaluationNotebookPayload = {
            notebookId: notebookId,
        };
        axios.post(`${baseUrl}/stop-evaluation`, stopNotebookPayload)
            .catch((err: any) => {
                console.error(`API failed:`);
                console.error(err && err.stack || err);
            });
    }

    //
    // Evaluate up to a particular cell.
    //
    evalToCell(notebookId: string, notebook: ISerializedNotebook1, cellId: string, containingPath?: string): void {
        this.startEvaluation(notebookId, notebook, cellId, false, containingPath);
    }

    //
    // Evaluate up a single cell.
    //
    evalSingleCell(notebookId: string, notebook: ISerializedNotebook1, cellId: string, containingPath?: string): void {
        this.startEvaluation(notebookId, notebook, cellId, true, containingPath);
    }

    //
    // Evaluates the entire notebook.
    //
    evalNotebook(notebookId: string, notebook: ISerializedNotebook1, containingPath?: string): void {
        this.startEvaluation(notebookId, notebook, undefined, undefined, containingPath);
    }

    //
    // Starts notebook evaluation in the backend.
    //
    private startEvaluation(notebookId: string, notebook: ISerializedNotebook1, cellId?: string, singleCell?: boolean, containingPath?: string) {
        this.notebookId = notebookId;
        this.numJobs += 1;
        this.startMessagePump();

        const evaluateNotebookPayload: IEvaluateNotebookPayload = {
            notebookId: notebookId,
            notebook: notebook,
            cellId: cellId,
            singleCell: singleCell,
            containingPath: containingPath,
        };

        axios.post(`${baseUrl}/evaluate`, evaluateNotebookPayload)
            .catch((err: any) => {
                console.error(`API failed:`);
                console.error(err && err.stack || err);
            });
    }

    //
    // Event raised on a message from the evaluation engine.
    //
    onEvaluationEvent: IEventSource<EvaluationEventHandler> = new EventSource<EvaluationEventHandler>();    
}
