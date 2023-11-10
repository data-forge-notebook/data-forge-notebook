import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "exit", 
    desc: "Exit Data-Forge Notebook without waiting for confirmation",
    label: "Exit",
})
export class ExitAction implements IAction {

    async invoke(context: IActionContext): Promise<void> {
        //todo:
    }
}
