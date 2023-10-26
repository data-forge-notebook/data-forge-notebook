import { InjectProperty } from "@codecapers/fusion";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";
import { IPaths, IPaths_ID } from "../services/paths";

@DeclareCommand({
    id: "open-example-notebook",
    desc: "Open an example notebook",
    label: "Open example notebook",
})
export class OpenExampleNotebookAction implements IAction {

    @InjectProperty(IPaths_ID)
    paths!: IPaths;

    async invoke(context: IActionContext): Promise<void> {
        await context.getNotebookEditor().openNotebook(this.paths.getExamplesPath());
    }
}
