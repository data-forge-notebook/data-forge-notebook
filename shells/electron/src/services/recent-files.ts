import { InjectProperty, InjectableSingleton } from "@codecapers/fusion";
import { IRecentFiles, IRecentFiles_ID, ISettings, ISettings_ID, RECENT_FILES_SETTINGS_KEY } from "notebook-editor";
import { ILog, ILogId } from "utils";

const remote = require("@electron/remote");
const app = remote.app;

const MAX_RECENT_FILES = 10;

//
// Service for getting registering and retreiving the recent file list..
//
@InjectableSingleton(IRecentFiles_ID)
export class RecentFiles implements IRecentFiles {

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(ISettings_ID)
    settings!: ISettings;

    //
    // Add a file to the recent files list.
    //
    addRecentFile(filePath: string): void {
        const recentFilesList = this.getRecentFileList();
        const filePathLwr = filePath.toLowerCase().replace(/\\/g, "/");
        const filteredList = recentFilesList.filter(recentFilePath => recentFilePath.toLowerCase().replace(/\\/g, "/") !== filePathLwr);
        const newRecentFileList = [filePath].concat(filteredList).slice(0, MAX_RECENT_FILES);
        this.settings.set(RECENT_FILES_SETTINGS_KEY, newRecentFileList);
        app.addRecentDocument(filePath);
    }

    //
    // Get the list of recent files recorded.
    //
    getRecentFileList(): string[] {
        return this.settings.get<string[]>(RECENT_FILES_SETTINGS_KEY) || [];
    }

    //
    // Clear the recent files list.
    //
    clearRecentFiles(): void {
        this.settings.set(RECENT_FILES_SETTINGS_KEY, []);
    }
}
