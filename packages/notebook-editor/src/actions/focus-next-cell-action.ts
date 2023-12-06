import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { ICellViewModel } from "../view-model/cell";

@DeclareCommand({
    id: "focus-next-cell", 
    label: "Focus next",
    desc: "Focus the next cell", 
    notebookCommand: true,
    accelerator: "CmdOrCtrl+Down",
    icon: "fast-forward",
})
export class FocusNextCellAction implements IAction {

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
            if (cellIndex === cells.length-1) {
                // Already at the last cell.
                return;
            }
            else {
                // Select the next cell.
                cell = cells[cellIndex+1];
            }
        }

        // Select the cell.
        await notebook.select(cell);

        // Make sure we can see the cell.
        await cell.scrollIntoView("next cell was focused");
    }
}
