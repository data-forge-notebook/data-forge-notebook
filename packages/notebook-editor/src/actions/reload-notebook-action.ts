import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "reload-notebook", 
    desc: "Reloads the currently open notebook", 
    label: "&Reload notebook",
    icon: "reset",
})
export class ReloadNotebookAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().reloadNotebook();
    }
}
