import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { INotebookRepository, INotebookRepositoryId } from "storage";

@DeclareCommand({
    id: "open-notebook", 
    desc: "Open a notebook from file", 
    label: "&Open notebook",
    accelerator: "CmdOrCtrl+O",
    icon: "document-open",
})
export class OpenNotebookAction implements IAction {

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    async invoke(context: IActionContext): Promise<void> {
        const params = context.getParams();
        if (params.file) {
            await context.getNotebookEditor().openSpecificNotebook(this.notebookRepository.idFromString(params.file));
        }
        else {
            await context.getNotebookEditor().openNotebook();
        }
    }
}
