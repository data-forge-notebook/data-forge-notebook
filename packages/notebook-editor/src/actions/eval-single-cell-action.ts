import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { INotification, INotificationId } from "../services/notification";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "eval-single-cell", 
    label: "Evaluate this c&ell",
    desc: "Evaluates only this cell",
    stateDesc: {
        executing: "Stops code evaluation",
        notExecuting: "Evaluates only this cell",
    },
    notebookCommand: true,
    stateIcon: {
        executing: "stop",
        notExecuting: "circle-arrow-right",
    },
    accelerator: "CmdOrCtrl+Shift+R",
})
export class EvalSingleCellAction implements IAction {
   
    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<void> {
        const selectedCell = context.getSelectedCell();
        if (!selectedCell) {
            this.notification.warn("Please select a code cell first.");
            return;
        }
        await context.getNotebookEditor().evaluateSingleCell(selectedCell);
    }
}
