import { makeAutoObservable } from "mobx";
import { ISerializedCellOutputValue1 } from "model";

//
// View-model for output from a cell.
//

export interface ICellOutputValueViewModel {

    //
    // Type of the value for display formatting.
    //
    displayType: string | undefined;

    //
    // The id of the plugin to use to render this output.
    //
    plugin: string | undefined;

    //
    // The actual value.
    //
    data: any;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutputValue1;
}

export class CellOutputValueViewModel implements ICellOutputValueViewModel {

    //
    // Type of the value for display formatting.
    //
    displayType: string | undefined;

    //
    // The id of the plugin to use to render this output.
    //
    plugin: string | undefined;

    //
    // The actual value.
    //
    data: any;

    constructor(displayType: string | undefined, plugin: string | undefined, data: any) {
        this.displayType = displayType;
        this.plugin = plugin;
        this.data = data;

        makeAutoObservable(this);
    }
    
    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCellOutputValue1 {
        return {
            displayType: this.displayType,
            plugin: this.plugin,
            data: this.data,
        };
    }    

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCellOutputValue1): ICellOutputValueViewModel {
        return new CellOutputValueViewModel(input.displayType, input.plugin, input.data);
    }
}