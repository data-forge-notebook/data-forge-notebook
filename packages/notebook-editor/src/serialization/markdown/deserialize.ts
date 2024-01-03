import { CellType } from "model";
import { CellErrorViewModel, ICellErrorViewModel } from "../../view-model/cell-error";
import { CellOutputValueViewModel, ICellOutputValueViewModel } from "../../view-model/cell-output-value";
import { CellOutputViewModel, ICellOutputViewModel } from "../../view-model/cell-output";
import { CodeCellViewModel, ICodeCellViewModel } from "../../view-model/code-cell";
import { IMarkdownCellViewModel, MarkdownCellViewModel } from "../../view-model/markdown-cell";
import { INotebookViewModel, NotebookViewModel } from "../../view-model/notebook";
import { ICellViewModel } from "../../view-model/cell";
import { INotebookStorageId } from "../../services/notebook-repository";
import yaml from "yaml";

//
// Removes the first line of the input.
//
function removeFirstLine(input: string): string {
    const newlineIndex = input.indexOf("\n");
    if (newlineIndex >= 0) {
        return input.substring(newlineIndex + 1);
    }
    else {
        return "";
    }
}

//
// Removes the last line of the input
//
function removeLastLine(input: string): string {
    const newlineIndex = input.lastIndexOf("\n");
    if (newlineIndex >= 0) {
        return input.substring(0, newlineIndex);
    }
    else {
        return "";
    }
}

//
// Remove the code fence around some text.
//
function removeFence(input: string): string {
    input = removeFirstLine(input);
    if (input.endsWith("```") || input.endsWith("```\n")) {
        input = removeLastLine(input);
    }
    return input;
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCodeCell(input: string): ICodeCellViewModel {

    let text = "";
    const errors: ICellErrorViewModel[] = [];
    const output: ICellOutputViewModel[] = [];
    const parts = input.split("######")
        .map(part => part.trim())
        .filter(part => part.length > 0);

    for (let part of parts) {
        if (part.startsWith("```typescript")) {
            text += removeFence(part);
        }
        else if (part.startsWith("```json - error")) {
            errors.push(deserializeCellError(part));
        }
        else if (part.startsWith("```json - output")) {
            output.push(deserializeCellOutput(part));
        }
        else {
            // Don't lose anythning, even if it doesn't quit fit the format.
            text += part;
        }
    }

    return new CodeCellViewModel(undefined, CellType.Code, text, output, errors);
}       

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCellError(input: string): ICellErrorViewModel {
    return new CellErrorViewModel(removeFence(input));
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCellOutputValue(input: any): ICellOutputValueViewModel {
    return new CellOutputValueViewModel(input.displayType, input.plugin, input.data);
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeCellOutput(input: string): ICellOutputViewModel {
    const output = JSON.parse(removeFence(input));
    return new CellOutputViewModel(deserializeCellOutputValue(output.value), output.height);
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeMarkdownCell(input: string): IMarkdownCellViewModel {
    return new MarkdownCellViewModel(undefined, CellType.Markdown, input);
}           

//
// Creates a cell view-model based on cell type.
//
export function cellViewModelFactory(cell: string): ICellViewModel {

    if (cell.startsWith("```typescript")) {
        return deserializeCodeCell(cell);
    }
    else {
        return deserializeMarkdownCell(cell);
    }
}

//
// Deserialize the model from a previously serialized data structure.
//
export function deserializeNotebook(notebookStorageId: INotebookStorageId, unsaved: boolean, readOnly: boolean, input: string): INotebookViewModel {

    let description = "";
    if (input.startsWith("---")) {
        input = removeFirstLine(input);
        const frontMatterEndIndex = input.indexOf("---");
        if (frontMatterEndIndex > 0) {
            const frontMatterStr = input.substring(0, frontMatterEndIndex).trim();
            const frontMatter = yaml.parse(frontMatterStr);
            description = frontMatter.description;
            input = input.substring(frontMatterEndIndex+3).trim();
        }
    }

    const cells = input.split("------")
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
        .map(cell => cellViewModelFactory(cell));
    return new NotebookViewModel(notebookStorageId, cells, description, unsaved, readOnly);
}    
