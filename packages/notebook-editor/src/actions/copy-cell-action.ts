import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "copy-cell", 
    desc: "Copy the selected cell",
    notebookCommand: true,
    label: "Copy cell",
    icon: "clipboard",
    accelerator: "CmdOrCtrl+Shift+C",
})
export class CopyCellAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange | void> {
        const cell = context.getCell();
        const cellClipboard = cell.serialize();
        context.getNotebookEditor().setCellClipboard(cellClipboard);
    }
}
