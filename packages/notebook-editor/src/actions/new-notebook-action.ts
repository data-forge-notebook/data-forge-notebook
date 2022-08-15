import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "new-notebook",
    desc: "Create a new JavaScript notebook", 
    label: "New &JavaScript notebook",
    accelerator: "CmdOrCtrl+N",
    icon: "document",
})
export class NewNotebookAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().newNotebook("javascript");
    }
}
