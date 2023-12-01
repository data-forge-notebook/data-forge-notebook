import { ICellOutputValueViewModel, CellOutputValueViewModel } from "./cell-output-value";
import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { ISerializedCellOutput1 } from "model";
import { v4 as uuid } from "uuid";

//
// View-model for output from a cell.
//

export interface ICellOutputViewModel {

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
}

export class CellOutputViewModel implements ICellOutputViewModel {

    //
    // Instance ID of the model.
    //
    private instanceId: string;

    //
    // Actual value of the output.
    //
    private value: ICellOutputValueViewModel;

    //
    // Height of the output, if set.
    //
    private height?: number;

    //
    // The output is fresh when true, out of date when false.
    //
    private fresh: boolean = true;

    constructor(value: ICellOutputValueViewModel, height?: number) {
        this.instanceId = uuid();
        this.value = value;
        this.height = height;
    }

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string {
        return this.instanceId;
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
    serialize (): ISerializedCellOutput1 {
        return {
            value: this.value.serialize(),
            height: this.height,
        };
    }    

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCellOutput1): ICellOutputViewModel {
        return new CellOutputViewModel(CellOutputValueViewModel.deserialize(input.value), input.height);
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
        return this.height;
    }

    //
    // Set the height of the output.
    //
    async setHeight(height: number): Promise<void> {
        this.height = height;
        await this.onModified.raise();
    }

    //
    // Event raised when the model has been modified.
    //
    onModified: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
}