import { BrowserWindow, dialog, shell, screen } from "electron";
import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { EventSource, IEventSource, IIdGenerator, IIdGeneratorId, ILog, ILogId, SenderEventHandler } from "utils";
import { IWindowManager, IWindowManagerId } from "./window-manager";
import { version, sha } from "../version";
import { getInstallPath } from "../services/path-main";
import * as path from "path";

const remote = require("@electron/remote/main");
remote.initialize();

let EDITOR_HTML = process.env.EDITOR_HTML as string;
if (!EDITOR_HTML) {
    EDITOR_HTML = "dist/index.html";
}

let LOADING_HTML = process.env.LOADING_HTML as string;
if (!LOADING_HTML) {
    LOADING_HTML = "dist/loading.html";
}

//
// Creates the title for the applications.
//
export function formatTitle(): string {
    let title = `Data-Forge Notebook ${version}`;
    if (sha) {
        title += ` (${sha})`;
    }
    return title;
}

//
// Defines the size and position of a window.
//
export interface IWindowCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

//
// Implements the editor window.
//
export interface IEditorWindow {

    //
    // Get the unique id of the editor window.
    //
    getId(): string;

    //
    // Returns true if a notebook has been opened in this editor window.
    //
    isNotebookSet(): boolean;

    //
    // Get the name of the file open in this editor.
    //
    getFileName(): string | undefined;

    //
    // Initialise the editor window.
    //
    init(): void;

    //
    // Show the editor window.
    //
    show(): void;
    
    //
    // Close the editor window.
    //
    forceClose(): void;

    //
    // Focus the editor window.
    //
    focus(): void;

    //
    // Query if the user really wants to close this window.
    // Returns true to close it.
    //
    queryClose(): boolean;

    //
    // Recieve an event from the renderer process.
    //
    onEditorEvent(eventName: string, args: any): Promise<void>;

    //
    // Send an event to the editor window.
    //
    sendEvent(eventName: string, args: any): void;

    //
    // Event raised when the window is ready and shown.
    //
    onShow: IEventSource<SenderEventHandler<IEditorWindow>>;

    //
    // Event raised when the window has been focused.
    //
    onFocused: IEventSource<SenderEventHandler<IEditorWindow>>;

    //
    // Event raised when the window has been closed.
    //
    onClosed: IEventSource<SenderEventHandler<IEditorWindow>>;
}

@InjectableClass()
export class EditorWindow implements IEditorWindow {

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    @InjectProperty(IWindowManagerId)
    windowManager!: IWindowManager;

    //
    // Loading screen to hide the slow loading of the main window.
    //
    private loadingWindow: BrowserWindow | undefined = undefined;

    //
    // The Electron window.
    //
    private browserWindow: BrowserWindow | undefined = undefined;

    //
    // Coordinates for the most recently created window.
    //
    public static nextWindowCoords?: IWindowCoordinates;
    
    //
    // Set true when the current open notebook is modified.
    //
    private isModified = false;

    //
    // Unique ID for the editor window.
    //
    private editorWindowId!: string;

    //
    // Set to true when the window should be shown to the user.
    //
    private showCalled: boolean = false;

    //
    // Set to true when the notebook editor is ready.
    //
    private editorReady: boolean = false;

    //
    // Set to true when a notebook has been set.
    //
    private notebookSet: boolean = false;

    //
    // Get the name of the file open in this editor.
    //
    private fileName?: string;

    //
    // Set to true to close without querying the user.
    //
    private forcingClose: boolean = false;

    //
    // File to open in this window, if set.
    //
    private openFilePath?: string;

    constructor(openFilePath?: string) {
        this.openFilePath = openFilePath; // File to open in this window, if set.
    }

    //
    // Get the unique id of the editor window.
    //
    getId(): string {
        return this.editorWindowId;
    }

    //
    // Returns true if a notebook has been opened in this editor window.
    //
    isNotebookSet(): boolean {
        return this.notebookSet;
    }

    //
    // Get the name of the file open in this editor.
    //
    getFileName(): string | undefined {
        return this.fileName;
    }

    //
    // Prepare the editor window.
    //
    init(): void {
        this.editorWindowId = this.idGenerator.genId();
        this.windowManager.addEditorWindow(this.editorWindowId, this); 

        let newWindowCoords: IWindowCoordinates;

        if (EditorWindow.nextWindowCoords) {
            newWindowCoords = EditorWindow.nextWindowCoords;
        }
        else {
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            newWindowCoords = {
                x: width / 8,
                y: height / 8,
                width: width - (width / 4),
                height: height - (height / 4),
             };
        }

        const cascadeOffset = 20;
        EditorWindow.nextWindowCoords = { // Setup the next window to cascade from the first.
            x: newWindowCoords.x + cascadeOffset,
            y: newWindowCoords.y + cascadeOffset,
            width: newWindowCoords.width,
            height: newWindowCoords.height,
        };

        const args = [
            "--id=" + this.editorWindowId,
        ];

        
        const iconPath = path.join(getInstallPath(), "assets/icon.png");
        this.log.info(`^^^^ Loading icon from ${iconPath}`);

        this.browserWindow = new BrowserWindow({
            title: formatTitle(),
            x: newWindowCoords.x,
            y: newWindowCoords.y,
            width: newWindowCoords.width,
            height: newWindowCoords.height,
            show: false,
            icon: iconPath,
            webPreferences: {
                nodeIntegration: true,
                nodeIntegrationInWorker: true, // Enabled this to prevent errors in Monaco Editor workers.
                contextIsolation: false,
                webviewTag: true,
                additionalArguments: args,
                webSecurity: false, // Disabled this to allow plugins to load local files (e.g. marker images in the maps plugin).
            },
        });

        this.loadingWindow = new BrowserWindow({
            parent: this.browserWindow,
            modal: true,
            frame: false,
            resizable: false,
            title: formatTitle(),
            x: newWindowCoords.x,
            y: newWindowCoords.y,
            width: newWindowCoords.width,
            height: newWindowCoords.height,
            show: true,
            icon: iconPath,
        });

        if (LOADING_HTML.startsWith("http://")) {
            this.loadingWindow.loadURL(LOADING_HTML);
        }
        else {
            this.loadingWindow.loadFile(LOADING_HTML);
        }
        
        //
        // Emitted when the loading window is closed.
        //
        this.loadingWindow.on("closed", async () => {
            this.loadingWindow = undefined;
        });        

        this.loadingWindow.once('ready-to-show', () => {
            if (EDITOR_HTML.startsWith("http://")) {
                console.log(`Loading URL ${EDITOR_HTML}`);
                this.browserWindow!.loadURL(EDITOR_HTML);
            }
            else {
                console.log(`Loading file ${EDITOR_HTML}`);
                this.browserWindow!.loadFile(EDITOR_HTML);
            }

            remote.enable(this.browserWindow!.webContents);
        });

        //
        // Dev tools disabled by default:
        //
        // this.browserWindow.webContents.openDevTools();
        //
        
        // Handle link clicks in OS browser.
        this.browserWindow.webContents.on('new-window', (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });

        this.browserWindow.on("unresponsive", () => {
            this.log.error(`++ Editor window ${this.getId()} has become unresponsive.`);
        });

        this.browserWindow.webContents.on("did-fail-load", (event: Event, errorCode: number, errorDescription: string, validatedURL: string, isMainFrame: boolean) => {
            this.log.error(`++ Editor window ${this.getId()} failed to load.`);
            this.log.error("Error code: " + errorCode);
            this.log.error("Error description: " + errorDescription);
            this.log.error("Validated URL: " + validatedURL);
            this.log.error("Is main frame: " + isMainFrame);
        });

        //
        // Called when the editor window is focused.
        //
        this.browserWindow.on("focus", async () => {  //todo: these that async exceptions are handled!
            this.log.info(`++ Editor window ${this.getId()} was focused.`);

            await this.onFocused.raise(this);
        });
        
        //
        // Called when the window is about to close.
        //
        this.browserWindow.on("close", evt => {
            this.log.info(`++ Editor window ${this.getId()} is closing.`);
            if (!this.forcingClose) {
                if (!this.queryClose()) {
                    evt.preventDefault(); // Don't close it.
                }
            }
        });

        //
        // Emitted when the window is closed.
        //
        this.browserWindow.on("closed", async () => {
            this.log.info(`++ Editor window ${this.getId()} was closed.`);
            this.browserWindow = undefined;

            this.windowManager.removeEditorWindow(this.getId());

            await this.onClosed.raise(this);
        });

        // this.browserWindow.once('ready-to-show', () => {
            // Used to be code here.
            // This event could be useful again some day.
        // });
    }

    //
    // Returns true if this editor window is ready to show.
    //
    private isReadyToShow(): boolean {
        if (!this.showCalled) {
            this.log.info(`++ Won't show window yet, 'show' hasn't been called ${this.getId()}.`);
            return false;
        }

        if (this.editorReady) {
            this.log.info(`++ Ready to show window, the editor ready event has been received for window ${this.getId()}.`);
            return true; // The editor is ready for use, even if a notebook is not loaded.
        }

        if (this.notebookSet) {
            this.log.info(`++ Ready to show window, a notebook has been set for window ${this.getId()}.`);
            return true; // A notebook has been set, we are definitely ready to show the window.
        }

        this.log.info(`++ Net yet ready to show window ${this.getId()}.`);
        return false; // Not ready to show yet.
    }

    //
    // Modifies the interpllation factor t.
    // Accelerates the change in t as t approaches 1.
    //
    private easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }
    
    //
    //  Interpolate between starting and ending values.
    //
    private interpolate(start: number, end: number, t: number): number {
        return (1 - this.easeOutCubic(t)) * start + this.easeOutCubic(t) * end;
    }

    //
    // Fades out the window over a specific duration.
    //
    private async fadeOutWindow(win: BrowserWindow, duration: number): Promise<void> {
        return new Promise(resolve => {
            const startTime = performance.now();
            const intervalTime = 10; // Interval in milliseconds
            const interval = setInterval(() => {
                const timeNow = performance.now();
                const elapsed = timeNow - startTime;
                const opacity = this.interpolate(1.0, 0.0, elapsed / duration);
                win.setOpacity(opacity);
                if (opacity <= 0.0) {
                    clearInterval(interval);
                    resolve();
                }
            }, intervalTime);
        });
    }

    //
    // Show the window, when ready.
    //
    private async showIfReady(): Promise<void> {
        if (this.isReadyToShow()) {
            await this.onShow.raise(this);

            if (this.browserWindow!.isVisible()) {
                this.log.info(`++ Editor window already visible ${this.getId()}.`);
            }
            else {
                this.log.info(`++ Actually showing window ${this.getId()}.`);
            }

            // Show the main window if not running headless.
            this.browserWindow!.show();

            this.browserWindow!.webContents.send("shown"); //todo: is this used in the old version?

            if (this.loadingWindow) {
                await this.fadeOutWindow(this.loadingWindow, 1000);
                this.loadingWindow!.close()                
                this.loadingWindow = undefined;
                this.browserWindow!.focus();
            }
        }
        else {
            this.log.info(`++ Not ready to show window yet: ${this.getId()}.`);
        }
    }

    //
    // Show the editor window.
    //
    show(): void {
        this.log.info(`++ Requesting window be shown ${this.getId()}.`);
        this.showCalled = true;
        this.showIfReady();
    }

    //
    // Closes the editor window.
    //
    forceClose(): void {
        if (this.browserWindow) {
            this.forcingClose = true;
            this.browserWindow.close();
        }
    }

    //
    // Focus the editor window.
    //
    focus(): void {
        if (this.browserWindow) {
            if (this.browserWindow.isMinimized()) {
                this.browserWindow.restore();
            }

            this.browserWindow.focus();
        }
    }

    //
    // Query if the user really wants to close this window.
    // Returns true to close it.
    //
    queryClose(): boolean {
        this.log.info(`++ Query close for window ${this.getId()}.`);

        if (this.isModified) {
            this.browserWindow!.focus();
            var choice = dialog.showMessageBoxSync(
                this.browserWindow!,
                {
                type: "question",
                buttons: [ "Yes", "No" ],
                title: "Confirm quit",
                message: 
                    "Your notebook is modified but not saved." +
                    "\r\nAre you sure you want to close this window?",
            }
            );

            if (choice == 1) {
                this.log.info(`++ User decided not to close due to unsaved notebook.`);
                return false;
            }
        }

        this.log.info(`++ Window is allowing close: ${this.getId()}.`);
        return true;
    }

    //
    // Updates the title of the window.
    //
    private updateTitle() {
      
        let windowTitle = "";

        if (this.fileName === undefined) {
            windowTitle += "untitled ";
        }
        else {
            windowTitle += `${this.fileName} `;
        }
        
        if (this.isModified) {
            windowTitle += "* ";
        }

        windowTitle += `- ${formatTitle()}`;

        this.browserWindow!.setTitle(windowTitle);
    }

    //
    // Handlers for events received from the notebook editor.
    //
    private editorEvents: any = {

        //
        // The notebook editor is ready to use.
        //
        onEditorReady: () => {
            this.log.info(`++ The notebook editor is ready ${this.getId()}`);

            this.editorReady = true;

            if (this.openFilePath) {
                this.log.info(`++ Opening requested file ${this.openFilePath}`);
                this.sendEvent("invoke-command", { commandId: "open-notebook", params: { file: this.openFilePath } });
                this.openFilePath = undefined;  
            }
            else {
                setTimeout(() => {
                    //
                    // Add a small timeout trying to reduce the flash in the transition to the welcome screen.
                    //
                    this.showIfReady();
                }, 1500);        
            }

        },

        //
        // A notebook has been set in this editor window.
        //
        onNotebookSet: ({ fileName, isModified }: { fileName: string, isModified: boolean }) => {
            
            this.log.info(`++ Notebook set in editor ${this.getId()} to ${fileName}, isModified = ${isModified}`);

            this.notebookSet = true;
            this.fileName = fileName;
            this.isModified = isModified;
        
            this.updateTitle();
        },

        //
        // A notebook has been set and rendered.
        //
        onNotebookRendered: () => {
            this.log.info(`++ Notebook rendered in editor ${this.getId()}`);

            setTimeout(() => {
                //
                // Add a small timeout trying to reduce the flash in the transition to showing the notebook.
                //
                this.showIfReady();
            }, 1500);
        },

        //
        // The modified flag has changed.
        //
        onModified: ({ isModified }: { isModified: boolean }) => {

            this.log.info(`++ Modified flag for editor ${this.getId()} has changed to ${isModified}`);

            this.isModified = isModified;

            this.updateTitle();
        },
    }

    //
    // Receives an event from the notebook editor.
    //
    async onEditorEvent(eventName: string, args: any): Promise<void> {
        const eventHandler = this.editorEvents[eventName];
        if (!eventHandler) {
            this.log.error(`Failed to find editor window handler for window event ${eventName}.`);
            return;
        }

        await eventHandler(args);
    }

    //
    // Send an event to the editor window.
    //
    sendEvent(eventName: string, args: any): void {
        if (this.browserWindow) {
            this.browserWindow.webContents.send(eventName, args);
        }
        else {
            console.error(`Sending event ${eventName} to unallocated browser window for notebook editor ${this.getId()}.`);
        }
    }

    //
    // Event raised when the window is ready.
    //
    onShow: IEventSource<SenderEventHandler<IEditorWindow>> = new EventSource<SenderEventHandler<IEditorWindow>>();

    //
    // Event raised when the window has been focused.
    //
    onFocused: IEventSource<SenderEventHandler<IEditorWindow>> = new EventSource<SenderEventHandler<IEditorWindow>>();

    //
    // Event raised when the window has been closed.
    //
    onClosed: IEventSource<SenderEventHandler<IEditorWindow>> = new EventSource<SenderEventHandler<IEditorWindow>>();
 }