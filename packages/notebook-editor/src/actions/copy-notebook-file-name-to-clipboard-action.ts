import { InjectProperty } from "@codecapers/fusion";
import { DeclareCommand } from "../services/command";
import { IAction, IActionContext } from "../services/action";
import { IClipboard, IClipboardId } from "../services/clipboard";
import { INotification, INotificationId } from "../services/notification";
import * as path from "path";

@DeclareCommand({
    id: "copy-file-name-to-clipboard", 
    desc: "Copy the name of the current notebook to the clipboard.",
    notebookCommand: true,
    label: "Copy file name to clipboard",
})
export class CopyNotebookFileNameToClipboard implements IAction {

    @InjectProperty(IClipboardId)
    clipboard!: IClipboard;

    @InjectProperty(INotificationId)
    notification!: INotification;

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        if (notebook.isUnsaved()) {
            this.notification.warn("This notebook has not been saved into the file system, please save it first.");
            return;
        }

        const filePath = notebook.getStorageId().toString()!
        const fileName = path.basename(filePath);
        this.clipboard.write(fileName);

        this.notification.info(`Copied file name "${fileName}" to clipboard.`);
    }
}
