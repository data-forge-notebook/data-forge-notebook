import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { IOpen, IOpen_ID } from "notebook-editor";

//
// Service for getting various paths.
//
@InjectableSingleton(IOpen_ID)
export class Open implements IOpen {

    //
    // Show an item in its folder.
    //
    showItemInFolder(path: string): void {
    }
    
    //
    // Open a folder or file in the operating system.
    //
    async openItem(path: string): Promise<void> {
    }

    //
    // Open a URL in the operating system.
    //
    async openUrl(path: string): Promise<void> {
    }
}
