import { AddCellChange } from "../changes/add-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "duplicate-cell", 
    desc: "Duplicates the selected cell",
    cellCommand: true,
    label: "Duplicate cell",
    icon: "duplicate",
    accelerator: "CmdOrCtrl+Shift+D",
})
export class DuplicateCellAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        return new AddCellChange(notebook, notebook.getCellIndex(cell) + 1, cell.text, cell.cellType, true);
    }
}
