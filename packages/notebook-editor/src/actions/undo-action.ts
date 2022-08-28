import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IUndoRedo } from "../services/undoredo";

@DeclareCommand({
    id: "undo", 
    label: "&Undo",
    desc: "Undo the previous change", 
    notebookCommand: true,
    accelerator: "CmdOrCtrl+Z",
    icon: "undo",
})
export class UndoAction implements IAction {

    @InjectProperty("IUndoRedo")
    undoRedo!: IUndoRedo;

    async invoke(context: IActionContext): Promise<void> {
        if (this.undoRedo.atStart()) {
            return;
        }

        await this.undoRedo.movePrevious();
    }
}
