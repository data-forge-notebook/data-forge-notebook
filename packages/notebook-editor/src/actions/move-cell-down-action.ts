import { MoveCellChange } from "../changes/move-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "move-cell-down", 
    label: "Move cell down",
    desc: "Moves the cell down one place", 
    cellCommand: true, 
    icon: "chevron-down",
    accelerator: "CmdOrCtrl+Shift+Down",
})
export class MoveCellDownAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange | void> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        const cells = notebook.getCells();
        const cellIndex = cells.indexOf(cell);
        if (cellIndex >= cells.length-1) {
            // That's as far it will go!
        }
        else {
            return new MoveCellChange(notebook, cellIndex, cellIndex+1);
        }
    }
}
