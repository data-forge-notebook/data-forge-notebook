import { clipboard } from "electron";
import { InjectableSingleton } from "@codecapers/fusion";
import { IClipboard, IClipboardId } from "notebook-editor";

//
// Service for interacting with the operating system clipboard.
//
@InjectableSingleton(IClipboardId)
export class Clipboard implements IClipboard {

    //
    // Write text to the clipboard.
    //
    write(text: string): void {
        clipboard.writeText(text, "clipboard");
    }

    //
    // Read text from the clipboard.
    //
    read(): string {
        return clipboard.readText("clipboard");
    }
}
