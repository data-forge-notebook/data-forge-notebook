//
// The main file for the Electron entry point.
//

import { registerSingleton } from "@codecapers/fusion";
import { app, ipcMain } from "electron";
import minimist from "minimist";
import { EditorWindow, IEditorWindow } from "./lib/editor-window";
import { IMainMenu, MainMenu } from "./lib/main-menu";
import { IWindowManagerId, WindowManager } from "./lib/window-manager";
import * as os from "os";

import "./services/platform";
import { log } from "./electron-log";
import { killEvaluationEngine, startEvaluationEngine } from "./evaluation-engine";

const windowManager = new WindowManager();
registerSingleton(IWindowManagerId, windowManager);

console.log(`home path: ${app.getPath("home")}`);
console.log(`appData path: ${app.getPath("appData")}`);
console.log(`userData path: ${app.getPath("userData")}`);
console.log(`temp path: ${app.getPath("temp")}`);
console.log(`documents path: ${app.getPath("documents")}`);
console.log(`downloads path: ${app.getPath("downloads")}`);
console.log(`exe path: ${app.getPath("exe")}`);
console.log(`logs path: ${app.getPath("logs")}`);

//
// Set to true when the application is shutting down.
//
let quitting: boolean = false;

//
// Force an immediate exit.
//
function immediateExit(code: number): void {
    if (quitting) {
        return; // This is already in progress.
    }
    
    quitting = true;

    killEvaluationEngine();

    for (const editorWindow of windowManager.getEditorWindows()) {
        editorWindow.forceClose();
    }

    process.exit(code);
}

process.on("uncaughtException", (err: Error) => {
    log.error("Uncaught error in main process.");
    const message = err && err.message;
    if (message) {
        log.error(message);
    }
    const stack = err && err.stack;
    if (stack) {
        log.error(stack);
    }
    if (!message && !stack) {
        log.error(err.toString());
    }
    immediateExit(20);
});

process.on("unhandledRejection", (err: any, promise: Promise<any>) => {
    log.error("Unhandled promise in main process.");
    const message = err && err.message;
    if (message) {
        log.error(message);
    }
    const stack = err && err.stack;
    if (stack) {
        log.error(stack);
    }
    if (!message && !stack) {
        log.error(err.toString());
    }
    immediateExit(21);
});

const argv = minimist(process.argv.slice(app.isPackaged ? 1 : 2));

if (argv.geometry) {
    const geometryParts = argv.geometry.split("+");
    const geometryArgSyntax = `Invalid geometry argument, should be --geometry=<width>x<height>+<x>+y`;
    if (geometryParts.length !== 3) {
        throw new Error(geometryArgSyntax);
    }
    
    const sizeParts = geometryParts[0].split("x");
    if (sizeParts.length !== 2) {
        throw new Error(geometryArgSyntax);
    }

    try {
        EditorWindow.nextWindowCoords = {
            x: parseInt(geometryParts[1]),
            y: parseInt(geometryParts[2]),
            width: parseInt(sizeParts[0]),
            height: parseInt(sizeParts[1]),
        };
    }
    catch (err) {
        log.error(`Error parsing --geometry argument:`);
        log.error(err && err.stack || err);
        throw new Error(geometryArgSyntax);
    }
}

//
// Represents the application's main menu.
//
const mainMenu: IMainMenu = new MainMenu();
mainMenu.onNewEditorWindow.attach(async () => {
    const newEditorWindow = createEditorWindow();
    newEditorWindow.show();
});

//
// Creates a new editor window.
//
function createEditorWindow(): IEditorWindow {
    
    const editorWindow = new EditorWindow();
    editorWindow.init();
    
    log.info(`== Allocated editor window ${editorWindow.getId()}.`);
    log.info(`== Editor windows: ${windowManager.getNumEditorWindows()}`);

    editorWindow.onShow.attach(onEditorWindowShow);
    editorWindow.onClosed.attach(onEditorWindowClosed);

    return editorWindow;
}

//
// Event raised when the editor window is ready.
//
async function onEditorWindowShow(editorWindow: IEditorWindow): Promise<void> {

    log.info(`== Editor window is ready to show.`);

    //
    // Rebuild the main menu whenever a new editor window is shown.
    // To sure that the new window is added to the window menu.
    //
    mainMenu.buildEditorMenu();
}

//
// Event raised when the editor window has been closed.
//
async function onEditorWindowClosed(editorWindow: IEditorWindow): Promise<void> {
    editorWindow.onShow.detach(onEditorWindowShow);
    editorWindow.onClosed.detach(onEditorWindowClosed);

    log.info(`== Editor window closed: ${editorWindow.getId()}`);
    log.info(`== Editor windows: ${windowManager.getNumEditorWindows()}`);
    
    mainMenu.buildEditorMenu(); // Rebuild the main menu.

    if (!quitting) {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (os.platform() !== "darwin") {
            if (windowManager.getNumEditorWindows() <= 0) {
                log.info(`== No editor windows open, quitting the application.`);
                app.quit();
            }
        }
    }
}

//
// Called when the app is ready to start.
//
function appReady(): void {
    const newEditorWindow = createEditorWindow();
    newEditorWindow.show();

    if (process.env.EVALUATION_ENGINE_URL) {
        console.log(`Evaluation engine already started at ${process.env.EVALUATION_ENGINE_URL}`);
        return;
    }

    startEvaluationEngine();
}


//
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//
app.on('ready', appReady);

//
// Quits when all windows are closed.
//
app.on('window-all-closed', () => {
    log.info("== All windows have been closed.");

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (os.platform() !== "darwin") {
        app.quit();
    }
});

//
// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
//
app.on('activate', function () {
    if (windowManager.getNumEditorWindows() <= 0) {
        const newEditorWindow = createEditorWindow();
        newEditorWindow.show();
    }
});

//
// Event raised when quitting before any windows are closed.
//
app.on("before-quit", event => {
    log.info("Event: before-quit");

    quitting = true;

    //
    // This next bit of code would happen automatically, but the automatic window 
    // shutdown also tries to shutdown all the the worker windows which automatically get
    // recreated which can actually prevent shutdown!
    //
    for (const editorWindow of windowManager.getEditorWindows()) {
        if (!editorWindow.queryClose()) {
            // Don't quit.
            event.preventDefault(); 
            quitting = false;
            return;
        }
        else {
            editorWindow.forceClose();
        }
    }
});

//
// Event raised when quitting after all windows have been closed.
//
app.on("will-quit", event => { 
    log.info("Event: will-quit");

    log.info("== Exiting Data-Forge Notebook.");

    killEvaluationEngine();
});

// 
// Event raised when the application is quitting.
//
app.on("quit", event => {
    log.info("Event: quit");
});

//
// Receives events from the notebook editor.
//
ipcMain.on("notebook-editor-event", async (event: any, args: any) => {
    const editorWindowId: string = args.editorWindowId;
    const eventName: string = args.eventName;
    const editorWindow = windowManager.getEditorWindow(editorWindowId);
    if (!editorWindow) {
        log.error(`== Received message ${eventName} for editor window ${editorWindowId}, failed to find this window!`);
        return;
    }

    log.info(`== Dispatching event ${eventName} for editor window ${editorWindowId}.`);

    await editorWindow.onEditorEvent(eventName, args.payload);
});
