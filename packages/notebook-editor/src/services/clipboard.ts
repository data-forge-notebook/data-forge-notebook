//
// Service for interacting with the operating system clipboard.
//

export const IClipboardId = "IClipboard";

export interface IClipboard {

    //
    // Write text to the clipboard.
    //
    write(text: string): void;

    //
    // Read text from the clipboard.
    //
    read(): string;
}
