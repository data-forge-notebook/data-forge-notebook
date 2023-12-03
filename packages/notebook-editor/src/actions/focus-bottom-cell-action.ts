import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "focus-bottom-cell", 
    label: "Focus bottom",
    desc: "Focus the bottom cell", 
    notebookCommand: true,
    accelerator: "CmdOrCtrl+Alt+Down",
    icon: "step-forward",
})
export class FocusBottomCellAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        const cells = notebook.cells;
        if (cells.length > 0) {
            const cell = cells[cells.length-1];
            
            // Select the cell.
            await cell.select();

            // Make sure we can see the cell.
            await cell.scrollIntoView("bottom cell was focused");
        }
    }
}
