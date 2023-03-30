import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { ILog, ILogId } from "utils";
import { IEditorWindow } from "./editor-window";

export const IWindowManagerId = "IWindowManager";

//
// Manages the collection of all open windows.
//
export interface IWindowManager {

    //
    // Get the number of editor windows.
    //
    getNumEditorWindows(): number;

    // 
    // Gets all open editor windows.
    //
    getEditorWindows(): IEditorWindow[];

    //
    // Adds an editor window.
    //
    addEditorWindow(windowId: string, window: IEditorWindow): void;

    //
    // Removes an editor window.
    //
    removeEditorWindow(windowId: string): void;

    //
    // Gets a particular editor window by id.
    //
    getEditorWindow(windowId: string): IEditorWindow | undefined;

    //
    // Get the editor window that was most recently focused.
    //
    getLastFocusedEditorWindow(): IEditorWindow | undefined;
}

//
// Manages the collection of all open windows.
//
@InjectableClass()
export class WindowManager implements IWindowManager {

    @InjectProperty(ILogId)
    log!: ILog;

    //
    // Collections of editor windows.
    //
    private editorWindows = new Map<string, IEditorWindow>();

    //
    // The editor window that was most recently focused.
    //
    private lastFocusedEditorWindow: IEditorWindow | undefined = undefined;

    //
    // Get the number of editor windows.
    //
    getNumEditorWindows(): number {
        return this.editorWindows.size;
    }

    // 
    // Gets all open editor windows.
    //
    getEditorWindows(): IEditorWindow[] {
        return Array.from(this.editorWindows.values());
    }

    //
    // Adds an editor window.
    //
    addEditorWindow(windowId: string, window: IEditorWindow): void {
        this.editorWindows.set(windowId, window);

        window.onFocused.attach(this.onEditorWindowFocused);
        this.lastFocusedEditorWindow = window;
    }

    //
    // Removes an editor window.
    //
    removeEditorWindow(windowId: string): void {

        if (this.lastFocusedEditorWindow && this.lastFocusedEditorWindow.getId() === windowId) {
            this.lastFocusedEditorWindow = undefined;
        }

        const window = this.editorWindows.get(windowId);
        if (window) {
            window.onFocused.detach(this.onEditorWindowFocused);
        }

        this.editorWindows.delete(windowId);
    }

    //
    // Gets a particular editor window by id.
    //
    getEditorWindow(windowId: string): IEditorWindow | undefined {
        return this.editorWindows.get(windowId);
    }

    //
    // Invoke when an editor window is focused.
    //
    private onEditorWindowFocused = async (window: IEditorWindow) => {

        this.log.info(`Editor window was focused: ${window.getId()}`);

        this.lastFocusedEditorWindow = window;
    }

    //
    // Get the editor window that was most recently focused.
    //
    getLastFocusedEditorWindow(): IEditorWindow | undefined {
        return this.lastFocusedEditorWindow;
    }
}