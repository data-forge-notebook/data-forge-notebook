import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { IOpen, IOpen_ID } from "notebook-editor";
import { ILog, ILogId } from "utils";

const remote = require("@electron/remote");
const shell = remote.shell;
const opn = require('open');

//
// Service for getting various paths.
//
@InjectableSingleton(IOpen_ID)
export class Open implements IOpen {

    @InjectProperty(ILogId)
    log!: ILog;

    //
    // Show an item in its folder.
    //
    showItemInFolder(path: string): void {
        this.log.info("Showing in folder: " + path);
        shell.showItemInFolder(path);
    }
    
    //
    // Open a folder or file in the operating system.
    //
    async openItem(path: string): Promise<void> {
        this.log.info("Opening " + path);
       
        await opn(path);
    }

    //
    // Open a URL in the operating system.
    //
    async openUrl(path: string): Promise<void> {
        this.log.info("Opening " + path);
        
        await opn(path);
    }
}
