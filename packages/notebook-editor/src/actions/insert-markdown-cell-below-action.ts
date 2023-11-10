import { CellType } from "model";
import { AddCellChange } from "../changes/add-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "insert-markdown-cell-below",
    label: "Insert markdown cell below",
    desc: "Insert a new markdown cell below selected cell", 
    notebookCommand: true,
    icon: "paragraph",
    accelerator: "CmdOrCtrl+Shift+Enter",
})
export class InsertMarkdownCellBelowAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange> {
        const notebook = context.getNotebook();
        const selectedCell = context.getSelectedCell();
        if (selectedCell) {
            const selectedCellIndex = notebook.getCells().indexOf(selectedCell);
            if (selectedCellIndex < 0) {
                throw new Error("Couldn't find index of selected cell.");
            }
            return new AddCellChange(notebook, selectedCellIndex+1, "", CellType.Markdown, true);
        }
        else {
            const cells = notebook.getCells();
            return new AddCellChange(notebook, cells.length, "", CellType.Markdown, true);
        }
        
    }
}
