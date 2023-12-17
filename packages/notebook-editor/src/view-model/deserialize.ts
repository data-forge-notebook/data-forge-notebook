import { CellType, ISerializedCell1, ISerializedCellError1, ISerializedCellOutput1, ISerializedCellOutputValue1, ISerializedNotebook1 } from "model";
import { CellErrorViewModel, ICellErrorViewModel } from "./cell-error";
import { CellOutputValueViewModel, ICellOutputValueViewModel } from "./cell-output-value";
import { CellOutputViewModel, ICellOutputViewModel } from "./cell-output";
import { CodeCellViewModel, ICodeCellViewModel } from "./code-cell";
import { IMarkdownCellViewModel, MarkdownCellViewModel } from "./markdown-cell";
import { INotebookStorageId } from "storage";
import { INotebookViewModel, NotebookViewModel } from "./notebook";
import { ICellViewModel } from "./cell";

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCodeCell(input: ISerializedCell1): ICodeCellViewModel {
    const output = [];
    if (input.output) {
        //
        // Convert multi-outputs to single outputs.
        //
        for (const cellOutput of input.output) {
            if (cellOutput.value) {
                output.push(deserializeCellOutput(cellOutput));
            }
            else if (cellOutput.values) {
                //
                // This format can be deserialized for backward compatibility,
                // but is no longer serialized.
                //
                for (const cellOutputValue of cellOutput.values) {
                    const singleOutput = Object.assign({}, cellOutput, { value: cellOutputValue });
                    delete singleOutput.values;
                    output.push(deserializeCellOutput(singleOutput));
                }
            }
        }
    }

    return new CodeCellViewModel(
        input.instanceId,
        input.cellType || CellType.Code,
        input.code || "",
        output,
        input.errors && input.errors.map(error => deserializeCellError(error)) || [],
    );
}       

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCellError(input: ISerializedCellError1): ICellErrorViewModel {
    return new CellErrorViewModel(input.msg);
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCellOutputValue(input: ISerializedCellOutputValue1): ICellOutputValueViewModel {
    return new CellOutputValueViewModel(input.displayType, input.plugin, input.data);
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCellOutput(input: ISerializedCellOutput1): ICellOutputViewModel {
    return new CellOutputViewModel(deserializeCellOutputValue(input.value), input.height);
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeMarkdownCell(input: ISerializedCell1): IMarkdownCellViewModel {
    return new MarkdownCellViewModel(
        input.instanceId,
        input.cellType || CellType.Code,
        input.code || ""
    );
}           

//
// Creates a cell view-model based on cell type.
//
export function cellViewModelFactory(cell: ISerializedCell1): ICellViewModel {

    if (!cell) {
        throw new Error("Cell model not specified.");
    }

    if (cell.cellType === CellType.Code) {
        return deserializeCodeCell(cell);
    }
    else if (cell.cellType === CellType.Markdown) {
        return deserializeMarkdownCell(cell);
    }
    else {
        throw new Error("Unexpected cell type: " + cell.cellType);
    }
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeNotebook(notebookStorageId: INotebookStorageId, unsaved: boolean, readOnly: boolean, input: ISerializedNotebook1): INotebookViewModel {
    let cells: ICellViewModel[];
    if (input.sheet) {
        // This is preserved for backward compatibility and loading old notebooks.
        cells = input.sheet.cells && input.sheet.cells.map(cell => cellViewModelFactory(cell)) || [];
    }
    else {
        cells = input.cells && input.cells.map(cell => cellViewModelFactory(cell)) || [];
    }

    return new NotebookViewModel(notebookStorageId, cells, input.description, unsaved, readOnly);
}    
