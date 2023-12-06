import { DeleteCellChange } from "../changes/delete-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";

@DeclareCommand({
    id: "cut-cell", 
    desc: "Cut the selected cell",
    notebookCommand: true,
    label: "Cut cell",
    icon: "cut",
    accelerator: "CmdOrCtrl+Shift+X",
})
export class CutCellAction implements IAction {

    async invoke(context: IActionContext): Promise<IChange | void> {
        const notebook = context.getNotebook();
        const cell = context.getCell();
        const cellClipboard = cell.serialize();
        context.getNotebookEditor().setCellClipboard(cellClipboard);
        return new DeleteCellChange(notebook, cell, true);
    }
}
