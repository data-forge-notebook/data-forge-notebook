import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "save-notebook", 
    desc: "Save notebook", 
    notebookCommand: true,
    label: "&Save notebook",
    accelerator: "CmdOrCtrl+S",
    icon: "floppy-disk",
})
export class SaveNotebookAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().saveNotebook();
    }
}
