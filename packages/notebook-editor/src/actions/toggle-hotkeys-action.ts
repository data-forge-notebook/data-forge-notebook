import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "toggle-hotkeys", 
    desc: "Shows or hides the hotkeys overlay",
    label: "Toggle hotkeys overlay",
    icon: "help",
    accelerator: "Ctrl+Shift+/",
})
export class ToggleHotkeysAction implements IAction {
    
    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().toggleHotkeysOverlay();
    }
}
