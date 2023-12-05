import { ICellOutputValueViewModel, CellOutputValueViewModel } from "./cell-output-value";
import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { ISerializedCellOutput1 } from "model";
import { v4 as uuid } from "uuid";
import { makeAutoObservable, reaction } from "mobx";

//
// View-model for output from a cell.
//

export interface ICellOutputViewModel {

    //
    // Instance ID of the model.
    //
    readonly instanceId: string;

    //
    // Actual value of the output.
    //
    readonly value: ICellOutputValueViewModel;

    //
    // Height of the output, if set.
    //
    height?: number;

    //
    // The output is fresh when true, out of date when false.
    //
    fresh: boolean;

    //
    // Set to true when modified.
    //
    modified: boolean;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutput1;

    //
    // Mark the output as out of data.
    //
    markStale(): void;
}

export class CellOutputViewModel implements ICellOutputViewModel {

    //
    // Instance ID of the model.
    //
    readonly instanceId: string;

    //
    // Actual value of the output.
    //
    readonly value: ICellOutputValueViewModel;

    //
    // Height of the output, if set.
    //
    height?: number;

    //
    // The output is fresh when true, out of date when false.
    //
    fresh: boolean = true;

    //
    // Set to true when modified.
    //
    modified: boolean = false;

    constructor(value: ICellOutputValueViewModel, height?: number) {
        this.instanceId = uuid();
        this.value = value;
        this.height = height;

        makeAutoObservable(this);        
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
    markStale(): void {
        this.fresh = false;
    }
}