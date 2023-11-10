import { MoveCellChange } from "../changes/move-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "move-cell-up", 
    label: "Move cell up",
    desc: "Moves the cell up one place", 
    cellCommand: true, 
    icon: "chevron-up",
    accelerator: "CmdOrCtrl+Shift+Up",
})
export class MoveCellUpAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange | void> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        const cellIndex = notebook.getCells().indexOf(cell);
        if (cellIndex < 1) {
            // That's as far it will go!
        }
        else {
            return new MoveCellChange(notebook, cellIndex, cellIndex-1);
        }
    }
}
