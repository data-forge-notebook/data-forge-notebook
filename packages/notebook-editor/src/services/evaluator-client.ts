import { IEventSource } from "utils";
import { ISerializedNotebook1 } from "model";

export type EvaluationEventHandler = (args: any) => Promise<void>;
export type MessageEventHandler = (message: string) => Promise<void>;

export const IEvaluatorId = "IEvaluator";

//
// App-side client to the code evaluator.
//
export interface IEvaluatorClient {

    //
    // Evaluate up to a particular cell.
    //
    evalToCell(notebookId: string, notebook: ISerializedNotebook1, cellId: string): void;

    //
    // Evaluate up a single cell.
    //
    evalSingleCell(notebookId: string, notebook: ISerializedNotebook1, cellId: string): void;

    //
    // Evaluates the entire notebook.
    //
    evalNotebook(notebookId: string, notebook: ISerializedNotebook1, ): void;

    //
    // Event raised on a message from the evaluation engin.
    //
    onEvaluationEvent: IEventSource<EvaluationEventHandler>;

}
