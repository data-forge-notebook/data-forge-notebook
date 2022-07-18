import { ICellOutputValueViewModel, CellOutputValueViewModel } from "./cell-output-value";
import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { ICellOutput } from "model";
import { ISerializedCellOutput1 } from "model";

//
// View-model for output from a cell.
//

export interface ICellOutputViewModel {

    //
    // Get the model under the view model.
    //
    getModel(): ICellOutput;

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string;

    //
    // Get the value of the output.
    //
    getValue(): ICellOutputValueViewModel;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutput1;

    //
    // Returns true if this is fresh output.
    //
    isFresh(): boolean;

    //
    // Mark the output as out of data.
    //
    markStale(): void;

    //
    // Get the height of the output, if set.
    //
    getHeight(): number | undefined;

    //
    // Set the height of the output.
    //
    setHeight(height: number): Promise<void>;

    //
    // Event raised when the model has been modified.
    //
    onModified: IEventSource<BasicEventHandler>;

    //
    // Notify the output that it has been resized.
    //
    notifyResized(): Promise<void>;
}

export class CellOutputViewModel implements ICellOutputViewModel {

    //
    // The model underlying the view-model.
    //
    private readonly cellOutput: ICellOutput;

    //
    // The output is fresh when true, out of date when false.
    //
    private fresh: boolean = true;

    //
    // The model for the output's value.
    //
    private value: ICellOutputValueViewModel;

    constructor (cellOutput: ICellOutput) {
        this.cellOutput = cellOutput;
        this.value = new CellOutputValueViewModel(cellOutput.getValue());
    }

    //
    // Get the model under the view model.
    //
    getModel(): ICellOutput {
        return this.cellOutput;
    }

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string {
        return this.cellOutput.getInstanceId();
    }
    
    //
    // Get the value of the output.
    //
    getValue(): ICellOutputValueViewModel {
        return this.value;
    }
    
    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutput1 {
        return this.cellOutput.serialize();
    }    

    //
    // Returns true if this is fresh output.
    //
    isFresh(): boolean {
        return this.fresh;
    }

    //
    // Mark the output as out of data.
    //
    markStale(): void {
        this.fresh = false;
    }

    //
    // Get the height of the output, if set.
    //
    getHeight(): number | undefined {
        return this.cellOutput.getHeight();
    }

    //
    // Set the height of the output.
    //
    async setHeight(height: number): Promise<void> {
        this.cellOutput.setHeight(height);        
        await this.onModified.raise();
    }

    //
    // Event raised when the model has been modified.
    //
    onModified: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Notify the output that it has been resized.
    //
    async notifyResized(): Promise<void> {
        await this.value.notifyResized();
    }
}