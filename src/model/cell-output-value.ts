import { ISerializedCellOutputValue1 } from "./serialization/serialized1";

//
// Model for output from a cell.
//

export interface ICellOutputValue {

    //
    // Get the display type of the value.
    //
    getDisplayType(): string | undefined;

    //
    // Get the data for the value.
    //
    getData(): any;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutputValue1;

}

export class CellOutputValue implements ICellOutputValue {

    //
    // Type of the value for display formatting.
    //
    displayType: string | undefined;

    //
    // The actual value.
    //
    data: any;

    constructor(displayType: string | undefined, data: any) {
        this.displayType = displayType;
        this.data = data;
    }

    //
    // Get the display type of the value.
    //
    getDisplayType(): string | undefined {
        return this.displayType;
    }

    //
    // Get the data for the value.
    //
    getData(): any {
        return this.data;
    }

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutputValue1 {
        return {
            displayType: this.displayType,
            data: this.data,
        };
    }    

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCellOutputValue1): ICellOutputValue {
        return new CellOutputValue(input.displayType, input.data);
    }
}