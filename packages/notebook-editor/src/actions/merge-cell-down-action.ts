import { InjectProperty } from "@codecapers/fusion";
import { DeclareCommand } from "../services/command";
import { INotification, INotificationId } from "../services/notification";
import { IAction, IActionContext } from "../services/action";
import { IChange } from "../services/undoredo";
import { DeleteCellChange } from "../changes/delete-cell-change";
import { AddCellChange } from "../changes/add-cell-change";

@DeclareCommand({
    id: "merge-cell-down", 
    desc: "Merges the selected cell with the cell below it.",
    cellCommand: true,
    label: "Merge cell down",
    icon: "double-chevron-down",
})
export class MergeCellDownAction implements IAction {

    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<IChange[] | void> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        const cellIndex = notebook.getCellIndex(cell);
        if (cellIndex >= notebook.getCells().length-1) {
            this.notification.error("There is no cell above to merge to!");
            return;
        }

        const cellBelow = notebook.getCellByIndex(cellIndex+1);
        if (!cellBelow) {
            throw new Error("Failed to next cell when there should be one!");
        }
        
        if (cellBelow.getCellType() !== cell.getCellType()) {
            this.notification.error("Can only merge cells with the same type.");
            return;
        }

        return [
            new DeleteCellChange(notebook, cellBelow, false),
            new DeleteCellChange(notebook, cell, false),
            new AddCellChange(notebook, cellIndex-1, cell.getText() + "\r\n" + cellBelow.getText(), cell.getCellType(), true),
        ];
    }
}
 