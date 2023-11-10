import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { IClipboard, IClipboardId } from "../services/clipboard";
import { DeclareCommand } from "../services/command";
import { INotification, INotificationId } from "../services/notification";

@DeclareCommand({
    id: "copy-file-path-to-clipboard", 
    desc: "Copy the path of the current notebook to the clipboard.",
    notebookCommand: true,
    label: "Copy file path to clipboard",
})
export class CopyNotebookFilePathToClipboard implements IAction {

    @InjectProperty(IClipboardId)
    clipboard!: IClipboard;

    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        if (context.getNotebook().isUnsaved()) {
            this.notification.warn("This notebook has not been saved into the file system, please save it first.");
            return;
        }

        this.clipboard.write(notebook.getStorageId().toString()!);
    }
}
