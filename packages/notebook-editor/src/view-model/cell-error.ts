import { ICellError, ISerializedCellError1 } from "model";
import { v4 as uuid } from "uuid";

//
// View-model for an error from a cell.
//

export interface ICellErrorViewModel {

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string;

    //
    // Get the message from the error.
    //
    getMsg(): string;

    //
    // Returns true if this is fresh output.
    //
    isFresh(): boolean;

    //
    // Mark the output as out of data.
    //
    markStale(): void;
}

export class CellErrorViewModel implements ICellErrorViewModel {

    //
    // Instance ID of the model.
    // Not serialized.
    //
    private instanceId: string;

    //
    // The error message.
    //
    private msg: string;

    //
    // The output is fresh when true, out of date when false.
    //
    private fresh: boolean = true;

    constructor (msg: string) {
        this.instanceId = uuid();
        this.msg = msg;
    }

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string {
        return this.instanceId;
    }

    //
    // Get the message from the error.
    //
    getMsg(): string {
        return this.msg;
    }
    
    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellError1 {
        return {
            msg: this.msg
        };
    }    

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCellError1): ICellErrorViewModel {
        return new CellErrorViewModel(input.msg);
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
}