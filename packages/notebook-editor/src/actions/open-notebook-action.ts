import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { INotebookRepository, INotebookRepositoryId } from "storage";
import * as path from "path";

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
            let filePath = params.file;
            if (filePath.startsWith("./")) {
                if (context.getNotebookEditor().isNotebookOpen()) {
                    // The path to open is relative to the currently open notebok.
                    const currentPath = context.getNotebookEditor().getOpenNotebook().getStorageId().getContainingPath();
                    if (currentPath) {
                        filePath = path.join(currentPath, filePath.substr(2));
                    }
                }
            }
            await context.getNotebookEditor().openSpecificNotebook(this.notebookRepository.idFromString(filePath));
        }
        else {
            await context.getNotebookEditor().openNotebook();
        }
    }
}
