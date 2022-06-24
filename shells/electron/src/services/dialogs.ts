//
// Service for showing various file related dialogs.
//
import * as path from "path";
import { InjectableSingleton } from "@codecapers/fusion";

const remote = require("@electron/remote");
const app = remote.app;
const dialog = remote.dialog;

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

@InjectableSingleton(IDialogsId)
export class Dialogs implements IDialogs {

    //
    // Show the open file dialog.
    //
    async showFileOpenDialog(defaultPath?: string): Promise<string | null> {
        const result = await dialog.showOpenDialog(
            remote.getCurrentWindow(),
            { 
                defaultPath: defaultPath,
                properties: ["openFile"],
                title: "Open Notebook",
                filters: [
                    {
                        name: "Notebook file",
                        extensions: [ "notebook" ],
                    },
                    {
                        name: "All files",
                        extensions: [ "*" ],
                    },
                ],
            }
        );
        if (result.canceled || !result.filePaths || !result.filePaths.length) {
            return null;
        }

        const filenames = result.filePaths;
        const filename = filenames && filenames.length > 0 && filenames[0] || null;
        return filename;
    }

    //
    // Show the save as dialog.
    //
    async showFileSaveAsDialog(title: string, defaultFileName: string, defaultDirPath: string | undefined, fileType: string, ext: string): Promise<string | undefined> {
        if (ext.startsWith(".")) {
            throw new Error(`showFileSaveAsDialog: File ext ${ext} shouldn't start with a period!`);
        }

        const defaultPath = path.join(defaultDirPath || app.getPath("documents"), defaultFileName);
        const saveDialogResult = await dialog.showSaveDialog(
            remote.getCurrentWindow(),
            {
                title: title,
                defaultPath: defaultPath,
                filters: [
                    {
                        name: fileType,
                        extensions: [ ext ],
                    },
                    {
                        name: "All files",
                        extensions: [ "*" ],
                    },
                ],
            }
        );

        let filePath = saveDialogResult.filePath;
        if (filePath) {
            if (!filePath.endsWith(ext)) {
                filePath += `.${ext}`; // Automatically add the ext if not added.
            }
        }

        return filePath;
    }
}