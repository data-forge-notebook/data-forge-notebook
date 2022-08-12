import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "eval-notebook", 
    label: "Evaluate &notebook",
    desc: "Evaluate all code", 
    stateDesc: {
        executing: "Stops code evaluation",
        notExecuting: "Evaluates all the code in the notebook",
    },
    notebookCommand: true,
    stateIcon: {
        executing: "stop",
        notExecuting: "play",
    },
    accelerator: "CmdOrCtrl+Alt+R",
})
export class EvalNotebookAction implements IAction {
    
    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().evaluateNotebook();
    }
}
