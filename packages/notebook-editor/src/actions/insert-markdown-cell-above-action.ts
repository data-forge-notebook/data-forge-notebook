import { CellType } from "model";
import { AddCellChange } from "../changes/add-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "insert-markdown-cell-above", 
    label: "Insert markdown cell above",
    desc: "Insert a new markdown cell above the selected cell or at the top of the notebook", 
    notebookCommand: true,
    icon: "paragraph",
})
export class InsertMarkdownCellAboveAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange> {
        const notebook = context.getNotebook();
        const selectedCell = context.getSelectedCell();
        if (selectedCell) {
            // Insert above selected cell.
            const selectedCellIndex = notebook.cells.indexOf(selectedCell);
            return new AddCellChange(notebook, selectedCellIndex, "", CellType.Markdown, true);
        }
        else {
            // Insert at start of notebook.
            return new AddCellChange(notebook, 0, "", CellType.Markdown, true);
        }
    }
}
