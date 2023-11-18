import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { INotification } from "../services/notification";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "eval-to-cell", 
    label: "Evaluate to &cell",
    desc: "Evaluates code to this cell",
    stateDesc: {
        executing: "Stops code evaluation",
        notExecuting: "Evaluates code to this cell",
    },
    notebookCommand: true,
    stateIcon: {
        executing: "stop",
        notExecuting: "arrow-right",
    },
    accelerator: "CmdOrCtrl+R",
})
export class EvalToCellAction implements IAction {

    @InjectProperty("INotification")
    notification!: INotification;
   
    async invoke(context: IActionContext): Promise<void> {
        const selectedCell = context.getSelectedCell();
        if (!selectedCell) {
            this.notification.warn("Please select a code cell first.");
            return;
        }
        await context.getNotebookEditor().evaluateToCell(selectedCell);
    }
}
