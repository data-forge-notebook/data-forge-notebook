import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "toggle-command-palette",
    desc: "Shows or hides the command palette",
    label: "Show command palette",
    icon: "more",
    accelerator:  "CmdOrCtrl+Shift+P",
})
export class ToggleCommandPalette implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().toggleCommandPalette();
    }
}
