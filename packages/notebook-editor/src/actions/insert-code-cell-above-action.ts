import { CellType } from "model";
import { AddCellChange } from "../changes/add-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "insert-code-cell-above", 
    label: "Insert code cell above",
    desc: "Insert a new code cell above the selected cell or at the top of the notebook", 
    notebookCommand: true,
    icon: "code",
})
export class InsertCodeCellAboveAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange> {
        const notebook = context.getNotebook();
        const selectedCell = context.getSelectedCell();
        if (selectedCell) {
            // Insert above selected cell.
            const selectedCellIndex = notebook.getCells().indexOf(selectedCell);
            return new AddCellChange(notebook, selectedCellIndex, "", CellType.Code, true);
        }
        else {
            // Insert at start of notebook.
            return new AddCellChange(notebook, 0, "", CellType.Code, true);
        }
    }
}
