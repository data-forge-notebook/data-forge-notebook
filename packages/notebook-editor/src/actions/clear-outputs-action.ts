import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "clear-outputs", 
    desc: "Clear all the outputs from the notebook.",
    notebookCommand: true,
    label: "Clear outputs",
    icon: "clean",
})
export class ClearOutputs implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        const notebook = context.getNotebook();
        await notebook.clearOutputs();
        await notebook.clearErrors();
    }
}
