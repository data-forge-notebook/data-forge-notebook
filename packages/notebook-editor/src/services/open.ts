export const IOpen_ID = "IOpen";

//
// Service for opening folders and files.
//
export interface IOpen {

    //
    // Show an item in its folder.
    //
    showItemInFolder(path: string): void;

    //
    // Open a folder or file in the operating system.
    //
    openItem(path: string): Promise<void>;

    //
    // Open a URL in the operating system.
    //
    openUrl(path: string): Promise<void>;
}
