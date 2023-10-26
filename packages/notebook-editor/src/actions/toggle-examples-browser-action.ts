import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "toggle-examples-browser",
    desc: "Shows or hides the example notebooks browser",
    label: "Show the example notebooks browser",
    icon: "box",
    accelerator:  "CmdOrCtrl+E",
})
export class ToggleExamplesBrowser implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().toggleExamplesBrowser();
    }
}
