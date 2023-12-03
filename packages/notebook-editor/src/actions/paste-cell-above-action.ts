import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { INotification, INotificationId } from "../services/notification";
import { IChange } from "../services/undoredo";
import { PasteCellChange } from "../changes/paste-cell-change";

@DeclareCommand({
    id: "paste-cell-above", 
    desc: "Paste the copied or cut cell above the selected cell",
    notebookCommand: true,
    label: "Paste cell above",
    icon: "clipboard",
})
export class PasteCellAboveAction implements IAction {

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
            // Insert above selected cell.
            const selectedCellIndex = notebook.cells.indexOf(selectedCell);
            return new PasteCellChange(notebook, selectedCellIndex, cellClipboard);
        }
        else {
            // Insert at start of notebook.
            return new PasteCellChange(notebook, 0, cellClipboard);
        }

    }
}
