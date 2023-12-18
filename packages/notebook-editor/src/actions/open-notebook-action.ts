import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import * as path from "path";
import { INotebookRepositoryId, INotebookRepository } from "../services/notebook-repository";

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
                const notebook = context.getNotebookEditor().notebook;
                if (notebook) {
                    // The path to open is relative to the currently open notebok.
                    const currentPath = notebook.storageId.getContainingPath();
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
