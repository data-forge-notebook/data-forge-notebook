//
// ID for the service.
//
export const IConfirmationDialogId = "IConfirmationDialog";

// 
// Options for the confirmation dialog.
//
export interface IConfirmOptions {
    //
    // The title to display in the dialog.
    //
    title?: string,

    //
    // Options the user can select in the dialog.
    //
    options: string[],

    //
    // A message to display in the dialog.
    //
    msg: string,
};

//
// Service that provides a confirmation dialog.
//
export interface IConfirmationDialog {
    
    //
    // Ask the user for confirmation before proceeding.
    //
    show(confirmOptions: IConfirmOptions): Promise<string>;
}
