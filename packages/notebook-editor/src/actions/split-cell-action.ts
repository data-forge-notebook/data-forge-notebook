import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { INotification, INotificationId } from "../services/notification";
import { IChange } from "../services/undoredo";
import { DeleteCellChange } from "../changes/delete-cell-change";
import { AddCellChange } from "../changes/add-cell-change";

@DeclareCommand({
    id: "split-cell", 
    desc: "Splits a cell at the cursor location.",
    cellCommand: true,
    label: "Split cell",
    icon: "fork",
})
export class SplitCellAction implements IAction {

    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<IChange[] | void> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        const cellIndex = notebook.getCellIndex(cell);
        const caretOffset = cell.getCaretOffset();
        if (caretOffset === undefined) {
            this.notification.error("Please put the caret in the cell at the location where you would like to split the cell.");
            return;
        }

        return [
            new DeleteCellChange(notebook, cell, false),
            new AddCellChange(notebook, cellIndex, cell.getText().substring(0, caretOffset), cell.getCellType(), false),
            new AddCellChange(notebook, cellIndex + 1, cell.getText().substring(caretOffset), cell.getCellType(), true),
        ];
    }
}
