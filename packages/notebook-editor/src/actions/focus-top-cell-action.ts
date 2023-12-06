import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "focus-top-cell", 
    label: "Focus top",
    desc: "Focus the top cell", 
    notebookCommand: true,
    accelerator: "CmdOrCtrl+Alt+Up",
    icon: "step-backward",
})
export class FocusTopCellAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        const cells = notebook.cells;
        if (cells.length > 0) {
            const cell =  cells[0];

            // Select the cell.
            await notebook.select(cell);

            document.documentElement.scrollTop = 0;
        }
    }
}
