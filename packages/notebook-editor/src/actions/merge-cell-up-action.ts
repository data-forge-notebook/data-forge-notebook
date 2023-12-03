import { InjectProperty } from "@codecapers/fusion";
import { DeclareCommand } from "../services/command";
import { IAction, IActionContext } from "../services/action";
import { INotification, INotificationId } from "../services/notification";
import { IChange } from "../services/undoredo";
import { DeleteCellChange } from "../changes/delete-cell-change";
import { AddCellChange } from "../changes/add-cell-change";

@DeclareCommand({
    id: "merge-cell-up", 
    desc: "Merges the selected cell with the cell above it.",
    cellCommand: true,
    label: "Merge cell up",
    icon: "double-chevron-up",
})
export class MergeCellUpAction implements IAction {

    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<IChange[] | void> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        const cellIndex = notebook.getCellIndex(cell);
        if (cellIndex < 1) {
            this.notification.error("There is no cell below to merge to!");
            return;
        }

        const cellAbove = notebook.getCellByIndex(cellIndex-1);
        if (!cellAbove) {
            throw new Error("Failed to previous cell when there should be one!");
        }
        
        if (cellAbove.cellType !== cell.cellType) {
            this.notification.error("Can only merge cells with the same type.");
            return;
        }

        return [
            new DeleteCellChange(notebook, cellAbove, false),
            new DeleteCellChange(notebook, cell, false),
            new AddCellChange(notebook, cellIndex-1, cellAbove.text + "\r\n" + cell.text, cell.cellType, true),
        ];
    }
}
 