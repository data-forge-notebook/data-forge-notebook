import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand( {
    id: "save-notebook-as", 
    desc: "Save notebook as a new file", 
    notebookCommand: true,
    label: "Save notebook &As",
})
export class SaveNotebookAsAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().saveNotebookAs();
    }
}
