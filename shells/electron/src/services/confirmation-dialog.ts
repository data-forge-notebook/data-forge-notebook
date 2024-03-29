import { InjectableSingleton } from "@codecapers/fusion";
import { IConfirmationDialogId, IConfirmationDialog, IConfirmOptions } from "notebook-editor";

const remote = require("@electron/remote");
const dialog = remote.dialog;

//
// Service that provides a confirmation dialog.
//
@InjectableSingleton(IConfirmationDialogId)
export class ConfirmationDialog implements IConfirmationDialog {
    
    //
    // Ask the user for confirmation before proceeding.
    //
    async show(confirmOptions: IConfirmOptions): Promise<string> {
        const { response } = await dialog.showMessageBox(
            remote.getCurrentWindow(),
            {
                type: 'question',
                buttons: confirmOptions.options,
                title: confirmOptions.title || 'Confirm',
                message: confirmOptions.msg,
            }
        );

        return confirmOptions.options[response];
     }
}
