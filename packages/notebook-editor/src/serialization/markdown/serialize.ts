import { CellType } from "model";
import { ICodeCellViewModel } from "../../view-model/code-cell";
import { IMarkdownCellViewModel } from "../../view-model/markdown-cell";
import { ICellOutputViewModel } from "../../view-model/cell-output";
import { ICellErrorViewModel } from "../../view-model/cell-error";
import { INotebookViewModel } from "../../view-model/notebook";
import { ICellViewModel } from "../../view-model/cell";
import { ICellOutputValueViewModel } from "../../view-model/cell-output-value";

export const notebookVersion = 4;

//
// Serialize to a data structure suitable for serialization.
//
export function serializeCodeCell(cell: ICodeCellViewModel): string {
    const startCode = "```typecript";
    const endCode = "```";
    return (
        `${startCode}\n` +
        `${cell.text}\n` +
        `${endCode}\n` +
        `${cell.errors.map(error => serializeError(error)).join("\n")}\n` +
        `${cell.output.map(output => serializeCellOutput(output)).join("\n")}\n`
    );
}    

//
// Serialize to a data structure suitable for serialization.
//
export function serializeCellOutput(output: ICellOutputViewModel): string {
    const startOutput = "```json - output";
    const endOutput = "```";
    return (
        `${startOutput}\n` +
        `${JSON.stringify({
            value: serializeCellOutputValue(output.value),
            height: output.height,
        }, null, 4)}\n` +
        `${endOutput}\n`
    );
}    

//
// Serialize to a data structure suitable for serialization.
//
export function serializeCellOutputValue(value: ICellOutputValueViewModel): any {
    return {
        displayType: value.displayType,
        plugin: value.plugin,
        data: value.data,
    };
}    

//
// Serialize to a data structure suitable for serialization.
//
export function serializeError(error: ICellErrorViewModel): string {
    const startError = "```json - error";
    const endError = "```";
    return (
        `${startError}\n` +
        `${error.msg}\n` +
        `${endError}\n`
    );
} 

//
// Serialize to a data structure suitable for serialization.
//
export function serializeMarkdownCell(cell: IMarkdownCellViewModel): string {
    return cell.text;
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
export function serializeNotebook(notebook: INotebookViewModel): string {
    return (
        `---\n` +
        `description: ${notebook.description}\n` +
        `version: ${notebookVersion}\n` +
        `---\n` +
        `${notebook.cells.map(serializeCell).join("\n")}\n`
    );
}
