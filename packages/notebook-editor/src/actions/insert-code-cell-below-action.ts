import { CellType } from "model";
import { AddCellChange } from "../changes/add-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "insert-code-cell-below", 
    label: "Insert code cell below",
    desc: "Insert a new code cell below selected cell", 
    notebookCommand: true,
    icon: "code",
    accelerator: "CmdOrCtrl+Alt+Enter",
})
export class InsertCodeCellBelowAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange> {
        const notebook = context.getNotebook();
        const selectedCell = context.getSelectedCell();
        if (selectedCell) {
            const selectedCellIndex = notebook.cells.indexOf(selectedCell);
            if (selectedCellIndex < 0) {
                throw new Error("Couldn't find index of selected cell.");
            }
            return new AddCellChange(notebook, selectedCellIndex+1, "", CellType.Code, true);
        }
        else {
            const cells = notebook.cells;
            return new AddCellChange(notebook, cells.length, "", CellType.Code, true);
        }
    }
}
