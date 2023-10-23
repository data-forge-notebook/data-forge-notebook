import { InjectProperty } from "@codecapers/fusion";
import { ILog, ILogId } from "utils";
import { IRecentFiles, IRecentFiles_ID } from "../services/recent-files";
import { IAction, IActionContext } from "../services/action";
import { DeclareCommand } from "../services/command";

@DeclareCommand({
    id: "clear-recent-files", 
    label: "Clear recent files",
    desc: "Clears the recent files list", 
})
export class ClearRecentFilesAction implements IAction {

    @InjectProperty(IRecentFiles_ID)
    recentFiles!: IRecentFiles;

    async invoke(context: IActionContext): Promise<void> {
        this.recentFiles.clearRecentFiles();
    }
}
