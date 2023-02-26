import { InjectableSingleton } from "@codecapers/fusion";
import axios from "axios";
import { ISerializedNotebook1 } from "model";
import { IEventSource, EventSource } from "utils";
import { EvaluationEventHandler, IEvaluatorClient, IEvaluatorId } from "../evaluator-client";

const baseUrl = process.env.EVALUATION_ENGINE_URL as string;

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
                    if (event.args.event === "notebook-eval-completed") {
                        console.log(`Evaluation completed!`);

                        this.notebookId = undefined;

                        //
                        // Wait a moment then stop the message pump.
                        //
                        setTimeout(() => {
                            if (this.notebookId === undefined) {
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
    // Evaluate up to a particular cell.
    //
    evalToCell(notebookId: string, notebook: ISerializedNotebook1, cellId: string): void {
        console.log(`Eval to cell ${cellId}`); 

        this.startEvaluation(notebookId, notebook, cellId, false);
    }

    //
    // Evaluate up a single cell.
    //
    evalSingleCell(notebookId: string, notebook: ISerializedNotebook1, cellId: string): void {
        console.log(`Eval single cell ${cellId}`); 

        this.startEvaluation(notebookId, notebook, cellId, true);
    }

    //
    // Evaluates the entire notebook.
    //
    evalNotebook(notebookId: string, notebook: ISerializedNotebook1): void {
        console.log(`Eval notebook`); 

        this.startEvaluation(notebookId, notebook);
    }

    //
    // Starts notebook evaluation in the backend.
    //
    private startEvaluation(notebookId: string, notebook: ISerializedNotebook1, cellId?: string, singleCell?: boolean) {
        this.notebookId = notebookId;
        this.startMessagePump();

        axios.post(`${baseUrl}/evaluate`, {
                notebookId: notebookId,
                notebook: notebook,
                cellId: cellId,
                singleCell: singleCell,
            })
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
