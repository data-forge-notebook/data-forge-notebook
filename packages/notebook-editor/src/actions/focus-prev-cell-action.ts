import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { ICellViewModel } from "../view-model/cell";

@DeclareCommand({
    id: "focus-prev-cell", 
    label: "Focus prev",
    desc: "Focus the previous cell", 
    notebookCommand: true,
    accelerator: "CmdOrCtrl+Up",
    icon: "fast-backward",   
})
export class FocusPrevCellAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook(); 
        const selectedCell = notebook.selectedCell;
        const cells = notebook.cells;
        let cell: ICellViewModel | undefined;
        
        if (!selectedCell) {
            if (cells.length > 0) {
                cell = cells[0];
            }
            else {
                // The sheet contains 0 cells.
                return;
            }
        }
        else {
            const cellIndex = cells.indexOf(selectedCell);
            if (cellIndex <= 0) {
                // Already at the last cell.
                return;
            }
            else {
                // Select the prev cell.
                cell = cells[cellIndex-1];
            }
        }

        // Select the cell.
        await cell.select();

        // Make sure we can see the cell.
        await cell.scrollIntoView("prev cell was focused");
    }
}
