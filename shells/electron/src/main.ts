//
// The main file for the Electron entry point.
//

import { registerSingleton } from "@codecapers/fusion";
import { app, ipcMain } from "electron";
import minimist from "minimist";
import { ILogId } from "utils";
import { EditorWindow, IEditorWindow } from "./lib/editor-window";
import { IMainMenu, MainMenu } from "./lib/main-menu";
import { IWindowManagerId, WindowManager } from "./lib/window-manager";
import * as os from "os";
import { spawn, SpawnOptions }  from "child_process";
import * as path from "path";
import { ElectronMainLog } from "./services/electron-main-log";

import "./services/platform";

const log = new ElectronMainLog();
registerSingleton(ILogId, log);

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
// If we detect these strings in stderr, report a fatal error.
//
const FATAL_ERROR_STRINGS = [
    "FATAL ERROR: ",
    "- JavaScript heap out of memory",
];

//
// Detect a fatal error message in the specified string.
//
function detectFatalErrorMsg(line: string): boolean {
    for (const fatalErrorString of FATAL_ERROR_STRINGS) {
        if (!line.includes(fatalErrorString)) {
            return false;
        }
    }

    return true;
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

    //
    // Start the evaluation engine.
    //

    const appDataPath = process.env.APP_DATA_PATH || path.dirname(app.getPath("exe"));
    console.log(`Using app data dir = ${appDataPath}`);
    const relEvalEnginePath = `evaluation-engine/`;
    const evalEnginePath = process.env.DEV_EVAL_ENGINE_DIR || path.join(appDataPath, relEvalEnginePath);
    console.log(`Running eval engine from ${evalEnginePath}`);
    const evalEngineScriptFile = `build/index.js`;
    const evalEngineScriptFilePath = path.join(evalEnginePath, evalEngineScriptFile);
    const nodeJsPath = `${appDataPath}/nodejs`;
    const platform = os.platform();
    const isWindows = platform === "win32";
    const nodeExePath =  path.join(nodeJsPath, isWindows ? "node" : "bin/node");
    const args = [
        "--expose-gc", // Expose garbage collection so that we can wind up async operations promptly.
        "--max-old-space-size=10000", // Enable large heap size.
        "--inspect", // Enable debugging for the evaluation engine.
        evalEngineScriptFilePath,
    ];

    console.log(`Starting evaluation engine with command:`);
    console.log(`${nodeExePath} ${args.join(" ")}`);
    console.log(process.cwd());

    const options: SpawnOptions = { 
        env: { // Send env vars to the evaluation engine.
            PORT: "9000",
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: evalEnginePath,
    };

    //
    // Enable these to show the shell for the process.
    //
    // options.shell = true;
    // options.detached = true;

    const evaluatorEngineProcess = spawn(nodeExePath, args, options);

    evaluatorEngineProcess.stdout!.on('data', (buf: any) => {
        log.info("** evaluation-engine: " + buf.toString());
    });

    let partialStderrLine = ""; // Collects a partial line recevied from stderr.

    evaluatorEngineProcess.stderr!.on('data', (buf: any) => {
        const message = buf.toString();
        log.error("** evaluation-engine [stderr]: " + message);

        const lines = message.split("\n");
        if (lines.length > 0) {
            if (lines.length === 1) {
                // Keep collecting the line.
                partialStderrLine += lines[0];
            }
            else {
                // Process the first line combined with the partial line.
                const firstLine = lines.shift();
                if (detectFatalErrorMsg(partialStderrLine + firstLine)) {
                    log.error("** Detected fatal error.");
                    log.error(partialStderrLine + firstLine);
                }

                for (let i = 0; i < lines.length-1; i++) {
                    if (detectFatalErrorMsg(lines[i])) {
                        // Intermediate lines that contain a fatal error.
                        log.error("** Detected fatal error.");
                        log.error(lines[i]);
                    }
                }

                partialStderrLine = lines[lines.length-1]; // Collection partial line.
            }
        }
    });

    evaluatorEngineProcess.on('error', (...args: any[]) => {
        log.error('** evaluation-engine [error-event]: ' + args.join(', '));
    });

    evaluatorEngineProcess!.on('exit', (code: any, signal: any) => {
        log.warn("** Evaluation engine exited with code " + code + " and signal " + signal + ".");

        if (partialStderrLine.length > 0 && detectFatalErrorMsg(partialStderrLine)) {
            log.error("** Detected fatal error on exit.");
            log.error(partialStderrLine);
        }
    });

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
