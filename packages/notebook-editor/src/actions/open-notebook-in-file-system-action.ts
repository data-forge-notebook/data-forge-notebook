import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { INotification, INotificationId } from "../services/notification";
import { IOpen, IOpen_ID } from "../services/open";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "open-notebook-in-filesystem", 
    desc: "Open the current notebook in Finder/Explorer",
    notebookCommand: true,
    label: "Open in Finder/Explorer",
})
export class OpenNotebookInFileSystem implements IAction {

    @InjectProperty(IOpen_ID)
    open!: IOpen;

    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        if (notebook.isUnsaved()) {
            this.notification.warn("This notebook has not been saved into the file system, please save it first.");
            return;
        }

        this.open.showItemInFolder(notebook.getStorageId().toString()!);
    }
}
