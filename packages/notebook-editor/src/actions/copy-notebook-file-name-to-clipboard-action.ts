import { InjectProperty } from "@codecapers/fusion";
import { DeclareCommand } from "../services/command";
import { IAction, IActionContext } from "../services/action";
import { IClipboard, IClipboardId } from "../services/clipboard";

@DeclareCommand({
    id: "copy-file-name-to-clipboard", 
    desc: "Copy the name of the current notebook to the clipboard.",
    notebookCommand: true,
    label: "Copy file name to clipboard",
})
export class CopyNotebookFileNameToClipboard implements IAction {

    @InjectProperty(IClipboardId)
    clipboard!: IClipboard;

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        this.clipboard.write(notebook.getStorageId().toString()!);
    }
}
