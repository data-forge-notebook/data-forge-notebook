import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "open-notebook", 
    desc: "Open a notebook from file", 
    label: "&Open notebook",
    accelerator: "CmdOrCtrl+O",
    icon: "document-open",
})
export class OpenNotebookAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().openNotebook();
    }
}
