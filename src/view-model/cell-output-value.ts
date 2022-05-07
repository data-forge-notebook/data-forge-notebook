import { IEventSource, BasicEventHandler, EventSource } from "../lib/event-source";
import { ICellOutputValue } from "../model/cell-output-value";

//
// View-model for output from a cell.
//

export interface ICellOutputValueViewModel {

    //
    // Get the display type of the value.
    //
    getDisplayType(): string;

    //
    // Get the data for the value.
    //
    getData(): any;

    //
    // Notify the output that it has been resized.
    //
    notifyResized(): void;

    //
    // Event raised when the output was resized.
    //
    onResized: IEventSource<BasicEventHandler>;
}

export class CellOutputValueViewModel implements ICellOutputValueViewModel {

    //
    // The model underlying the view-model.
    //
    private readonly value: ICellOutputValue;

    constructor (value: ICellOutputValue) {
        this.value = value;
    }

    //
    // Get the display type of the value.
    //
    getDisplayType(): string {
        return this.value.getDisplayType();
    }

    //
    // Get the data for the value.
    //
    getData(): any {
        return this.value.getData();
    }

    //
    // Notify the output that it has been resized.
    //
    async notifyResized(): Promise<void> {
        await this.onResized.raise();
    }
     
    //
    // Event raised when the output was resized.
    //
    onResized: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
}