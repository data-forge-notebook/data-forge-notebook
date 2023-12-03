import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { INotification, INotificationId } from "../services/notification";
import { IChange } from "../services/undoredo";
import { PasteCellChange } from "../changes/paste-cell-change";

@DeclareCommand({
    id: "paste-cell-below", 
    desc: "Paste the copied or cut cell below the selected cell",
    notebookCommand: true,
    label: "Paste cell below",
    icon: "clipboard",
    accelerator: "CmdOrCtrl+Shift+V",
})
export class PasteCellBelowAction implements IAction {

    @InjectProperty(INotificationId)
    notification!: INotification;
    
    async invoke(context: IActionContext): Promise<IChange | void> {
        const notebookEditor = context.getNotebookEditor();
        const cellClipboard = notebookEditor.cellClipboard;
        if (!cellClipboard) {
            this.notification.warn("To paste a cell, first cut or copy it.");
            return;
        }

        const notebook = context.getNotebook();
        const selectedCell = context.getSelectedCell();
        if (selectedCell) {
            const selectedCellIndex = notebook.cells.indexOf(selectedCell);
            if (selectedCellIndex < 0) {
                throw new Error("Couldn't find index of selected cell.");
            }
            return new PasteCellChange(notebook, selectedCellIndex+1, cellClipboard);
        }
        else {
            const cells = notebook.cells;
            if (cells.length === 0) {
                return new PasteCellChange(notebook, 0, cellClipboard);
            }
            else {
                return new PasteCellChange(notebook, cells.length, cellClipboard);
            }
        }
    }
}
