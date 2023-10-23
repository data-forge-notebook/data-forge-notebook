export const RECENT_FILES_SETTINGS_KEY = "recent-files";

export const IRecentFiles_ID = "IRecentFiles";

//
// Interface for getting registering and retreiving the recent file list..
//
export interface IRecentFiles {

    //
    // Add a file to the recent files list.
    //
    addRecentFile(filePath: string): void;

    //
    // Get the list of recent files recorded.
    //
    getRecentFileList(): string[];

    //
    // Clear the recent files list.
    //
    clearRecentFiles(): void;
}
