import { IUndoRedo } from "../services/undoredo";
import { InjectProperty } from "@codecapers/fusion";
import { DeclareCommand } from "../services/command";
import { IAction, IActionContext } from "../services/action";

@DeclareCommand({
    id: "redo", 
    label: "&Redo",
    desc: "Redo the change that was previously undone", 
    notebookCommand: true,
    accelerator:  platform => platform.isMacOS() ? "Shift+CmdOrCtrl+Z" : "Ctrl+Y",
    icon: "redo",
})
export class RedoAction implements IAction {

    @InjectProperty("IUndoRedo")
    undoRedo!: IUndoRedo;

    async invoke(context: IActionContext): Promise<void> {
        if (this.undoRedo.atEnd()) {
            return;
        }

        await this.undoRedo.moveNext();
    }
}
