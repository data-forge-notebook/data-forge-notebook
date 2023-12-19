import { CellType, ISerializedCell1, ISerializedCellError1, ISerializedCellOutput1, ISerializedCellOutputValue1, ISerializedNotebook1 } from "model";
import { ICodeCellViewModel } from "../../view-model/code-cell";
import { IMarkdownCellViewModel } from "../../view-model/markdown-cell";
import { ICellOutputViewModel } from "../../view-model/cell-output";
import { ICellErrorViewModel } from "../../view-model/cell-error";
import { INotebookViewModel } from "../../view-model/notebook";
import { ICellViewModel } from "../../view-model/cell";
import { ICellOutputValueViewModel } from "../../view-model/cell-output-value";

export const notebookVersion = 3;

//
// Serialize to a data structure suitable for serialization.
//
export function serializeCodeCell(cell: ICodeCellViewModel): ISerializedCell1 {
    return {
        cellType: cell.cellType,
        code: cell.text,
        output: cell.output.map(output => serializeCellOutput(output)),
        errors: cell.errors.map(error => serializeError(error)),
    };
}    

//
// Serialize to a data structure suitable for serialization.
//
export function serializeCellOutput(output: ICellOutputViewModel): ISerializedCellOutput1 {
    return {
        value: serializeCellOutputValue(output.value),
        height: output.height,
    };
}    

//
// Serialize to a data structure suitable for serialization.
//
export function serializeCellOutputValue(value: ICellOutputValueViewModel): ISerializedCellOutputValue1 {
    return {
        displayType: value.displayType,
        plugin: value.plugin,
        data: value.data,
    };
}    

//
// Serialize to a data structure suitable for serialization.
//
export function serializeError(error: ICellErrorViewModel): ISerializedCellError1 {
    return {
        msg: error.msg
    };
} 

//
// Serialize to a data structure suitable for serialization.
//
export function serializeMarkdownCell(cell: IMarkdownCellViewModel): ISerializedCell1 {
    return {
        cellType: cell.cellType,
        code: cell.text,
    };
}    

//
// Serialize a cell.
//
export function serializeCell(cell: ICellViewModel) {
    switch (cell.cellType) {
        case CellType.Markdown:
            return serializeMarkdownCell(cell as IMarkdownCellViewModel);
        case CellType.Code:
            return serializeCodeCell(cell as ICodeCellViewModel);
        default:
            throw new Error(`Unknown cell type ${cell.cellType}`);
    }
}

//
// Serialize to a data structure suitable for serialization.
//
export function serializeNotebook(notebook: INotebookViewModel): ISerializedNotebook1 {
    return {
        version: notebookVersion,
        description: notebook.description,
        cells: notebook.cells.map(serializeCell),
    };
}
