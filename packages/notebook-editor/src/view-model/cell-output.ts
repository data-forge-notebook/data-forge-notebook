import { ICellOutputValueViewModel, CellOutputValueViewModel } from "./cell-output-value";
import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { ISerializedCellOutput1 } from "model";
import { v4 as uuid } from "uuid";
import { action, observable } from "mobx";

//
// View-model for output from a cell.
//

export interface ICellOutputViewModel {

    //
    // Instance ID of the model.
    //
    instanceId: string;

    //
    // Actual value of the output.
    //
    value: ICellOutputValueViewModel;

    //
    // Height of the output, if set.
    //
    height?: number;

    //
    // The output is fresh when true, out of date when false.
    //
    fresh: boolean;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutput1;

    //
    // Mark the output as out of data.
    //
    markStale(): void;

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
    @observable
    instanceId: string;

    //
    // Actual value of the output.
    //
    @observable
    value: ICellOutputValueViewModel;

    //
    // Height of the output, if set.
    //
    @observable
    height?: number;

    //
    // The output is fresh when true, out of date when false.
    //
    @observable
    fresh: boolean = true;

    constructor(value: ICellOutputValueViewModel, height?: number) {
        this.instanceId = uuid();
        this.value = value;
        this.height = height;
    }

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutput1 {
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
    // Mark the output as out of data.
    //
    @action
    markStale(): void {
        this.fresh = false;
    }

    //
    // Set the height of the output.
    //
    @action
    async setHeight(height: number): Promise<void> {
        this.height = height;
        await this.onModified.raise();
    }

    //
    // Event raised when the model has been modified.
    //
    onModified: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
}