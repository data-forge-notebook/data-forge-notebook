import { DeclareCommand } from "../services/command";
import { IAction, IActionContext } from "../services/action";

@DeclareCommand({
    id: "toggle-recent-file-picker", 
    label: "Show the recent file picker",
    desc: "Shows or hides the recent files picker", 
    icon: "list",
    accelerator:  "CmdOrCtrl+P",
})
export class ToggleRecentFilePicker implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().toggleRecentFilePicker();
    }
}
