import { DeleteCellChange } from "../changes/delete-cell-change";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IChange } from "../services/undoredo";
import { serializeCell } from "../view-model/serialize";

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
        const cellClipboard = serializeCell(cell);
        context.getNotebookEditor().setCellClipboard(cellClipboard);
        return new DeleteCellChange(notebook, cell, true);
    }
}
