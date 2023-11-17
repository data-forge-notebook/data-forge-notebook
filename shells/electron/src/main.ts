//
// The main file for the Electron entry point.
//

import { registerSingleton } from "@codecapers/fusion";
import { app, ipcMain } from "electron";
import minimist from "minimist";
import { EditorWindow, IEditorWindow, formatTitle } from "./lib/editor-window";
import { IMainMenu, MainMenu } from "./lib/main-menu";
import { IWindowManagerId, WindowManager } from "./lib/window-manager";
import * as os from "os";
import { killEvaluationEngine, startEvaluationEngine } from "./evaluation-engine";

import "./services/platform";
import { log } from "./electron-log";
import { MainSettings } from "./services/electron-main-settings";
import { RECENT_FILES_SETTINGS_KEY } from "notebook-editor/build/services/recent-files";

console.log(`Started ${formatTitle()}`);
console.log(`home path: ${app.getPath("home")}`);   
console.log(`appData path: ${app.getPath("appData")}`);
console.log(`userData path: ${app.getPath("userData")}`);
console.log(`temp path: ${app.getPath("temp")}`);
console.log(`documents path: ${app.getPath("documents")}`);
console.log(`downloads path: ${app.getPath("downloads")}`);
console.log(`exe path: ${app.getPath("exe")}`);
console.log(`logs path: ${app.getPath("logs")}`);

const settings = new MainSettings();
registerSingleton("ISettings", settings);

settings.loadSettings();

const windowManager = new WindowManager();
registerSingleton(IWindowManagerId, windowManager);

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

console.log(`Requesting single instance lock.`);

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    log.info("Didn't get the single instance lock, have passed control to first instance, quitting now.");
    immediateExit(0);
}

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

let openFilePath = argv._.length > 0 ? argv._[0] : undefined;
if (openFilePath) {
    log.info(`Command line request to open file: ${openFilePath}.`);
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
function createEditorWindow(openFilePath?: string): IEditorWindow {
    
    const editorWindow = new EditorWindow(openFilePath);
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

    settings.onSettingsChanged.attach(async (key) => {
        if (key === RECENT_FILES_SETTINGS_KEY) {
            // Rebuild the menu when recent files have been added.
            mainMenu.buildEditorMenu();
        }
    });

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
    const newEditorWindow = createEditorWindow(openFilePath);
    openFilePath = undefined;
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
// Handle links starting with notebook:// and notebooks://
//
app.setAsDefaultProtocolClient('notebook');
app.setAsDefaultProtocolClient('notebooks');

//
// File handler for osx
//
app.on('open-file', (event, filePath) => {
    log.info("== Handled open-file event, requesting to open file: " + filePath);
    event.preventDefault();

    const editorWindow = createEditorWindow(filePath);
    editorWindow.show();
});

//
// Protocol handler for osx
//
app.on('open-url', (event, url) => {
    log.info("== Handled open-url event, requesting to open url: " + url);
    event.preventDefault();

    const editorWindow = createEditorWindow(url);
    editorWindow.show();
});

//
// Find the most recently used editor window.
//
function findMostRecentEditorWindow(): IEditorWindow | undefined {
    const lastFocusedEditorWindow = windowManager.getLastFocusedEditorWindow();
    if (lastFocusedEditorWindow) {
        return lastFocusedEditorWindow; // Return the last focused window.
    }

    // Pick the latest window that was created.
    const orderedWindows = windowManager.getEditorWindows();
    if (orderedWindows.length > 0) {
        return orderedWindows[orderedWindows.length - 1];
    }

    return undefined; // No windows available.
}

app.on("second-instance", (event, commandLine, workingDirectory) => {
    log.info("== Another instance was started with the following details...");
    log.info("Command line:");
    log.info(JSON.stringify(commandLine, null, 4));
    log.info("Working directory:");
    log.info(JSON.stringify(workingDirectory, null, 4));

    const argv = minimist(commandLine.slice(1))
    log.info("Parsed command line: \r\n" + JSON.stringify(argv, null, 4));
    
    const filePath = argv._.length > 0 ? argv._[0] : undefined;
    if (filePath) {
        log.info(`Opening file requested by second-instance in new window: ${filePath}.`);
        const editorWindow = createEditorWindow(filePath);
        editorWindow.show();
        return;
    }

    const mostRecentEditorWindow = findMostRecentEditorWindow();
    if (mostRecentEditorWindow) {
        log.info("Focusing most recent window in response to 'second-instance'.");
        mostRecentEditorWindow.focus();
    }
    else {
        log.info("Creating a new window in response to 'second-instance'.");
        const editorWindow = createEditorWindow();
        editorWindow.show();
    }
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
