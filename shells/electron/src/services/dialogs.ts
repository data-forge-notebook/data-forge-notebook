//
// Service for showing various file related dialogs.
//

export const IDialogsId = "IDialogs";

export type FileEventHandler = (filePath: string) => void;

export interface IDialogs {

    //
    // Show the open file dialog.
    //
    showFileOpenDialog(defaultPath?: string): Promise<string | null>;

    //
    // Show the save as dialog.
    //
    showFileSaveAsDialog(title: string, defaultFileName: string, defaultDirPath: string | undefined, fileType: string, ext: string): Promise<string | undefined>;
}
