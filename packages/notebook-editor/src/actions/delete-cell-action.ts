import { DeleteCellChange } from "../changes/delete-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "delete-cell", 
    label: "Delete cell",
    desc: "Deletes the cell", 
    cellCommand: true, 
    icon: "trash",
    accelerator: "CmdOrCtrl+Alt+Backspace",
})
export class DeleteCellAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        return new DeleteCellChange(notebook, cell, true);
    }
}
