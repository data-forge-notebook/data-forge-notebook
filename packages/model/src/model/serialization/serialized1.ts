//
// Interfaces for a serialized notebook version 1.
//

export enum CellType {
    Code = "code",
    Markdown = "markdown",
}

//
// Serialized format for a value of a cell output.
//
export interface ISerializedCellOutputValue1 {
    //
    // Type of the value for display formatting.
    //
    displayType?: string;

    //
    // The id of the plugin to use to render this output.
    //
    plugin?: string;

    //
    // The actual value.
    //
    data: any;
}

//
// Serialized format for a cell output.
//
export interface ISerializedCellOutput1 {

    //
    // Serialized value of the output.
    //
    value: ISerializedCellOutputValue1;

    //
    // Height of the output, if set.
    //
    height?: number;

    //
    // Old format multi-outputs.
    // This can be deserialized, but is no longer serialized.
    //
    values?: ISerializedCellOutputValue1[];
}

//
// Serialized format for a cell error.
//
export interface ISerializedCellError1 {
    //
    // The error message.
    //
    msg: string;
}

//
// Serialized format for a cell.
//
export interface ISerializedCell1 {
    //
    // Instance id of the cell.
    //
    instanceId?: string;

    //
    // The type of the cell.
    //
    cellType?: CellType;

    //
    // Code for the cell.
    //
    code?: string;

    //
    // The date that the cell was last evaluated.
    //
    lastEvaluationDate?: string;

    //
    // Serialized output from the cell.
    //
    output?: ISerializedCellOutput1[];

    //
    // Serialized errors from the cell.
    //
    errors?: ISerializedCellError1[];
}

//
// This is preserved for backward compatibility and loading old notebooks.
//
export interface ISerializedSheet1 {
    //
    // id of the sheet.
    //
    id: string;

    //
    // Serialized cells.
    //
    cells: ISerializedCell1[];
}

//
// Serialized format for a notebook.
//
export interface ISerializedNotebook1 {
    //
    // Used for notebook versioning.
    // Notebooks with no version number are pre-versioning.
    //
    version: number;

    //
    // Description of the notebook, if any.
    //
    description?: string;

    //
    // Serialized cells.
    //
    cells: ISerializedCell1[];

    //
    // The serialized sheet.
    // This is preserved for backward compatibility and loading old notebooks.
    //
    sheet?: ISerializedSheet1;
}