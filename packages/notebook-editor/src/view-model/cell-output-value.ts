//
// View-model for output from a cell.
//

export interface ICellOutputValueViewModel {

    //
    // Type of the value for display formatting.
    //
    readonly displayType: string | undefined;

    //
    // The id of the plugin to use to render this output.
    //
    readonly plugin: string | undefined;

    //
    // The actual value.
    //
    readonly data: any;
}

export class CellOutputValueViewModel implements ICellOutputValueViewModel {

    //
    // Type of the value for display formatting.
    //
    readonly displayType: string | undefined;

    //
    // The id of the plugin to use to render this output.
    //
    readonly plugin: string | undefined;

    //
    // The actual value.
    //
    readonly data: any;

    constructor(displayType: string | undefined, plugin: string | undefined, data: any) {
        this.displayType = displayType;
        this.plugin = plugin;
        this.data = data;
    }
}