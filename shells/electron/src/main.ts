//
// The main file for the Electron entry point.
//

import { registerSingleton } from "@codecapers/fusion";
import { app, BrowserWindow } from "electron";
import { ConsoleLog, ILogId } from "utils";
import { IMainMenu, MainMenu } from "./main-menu";

import "./services/platform";

registerSingleton(ILogId, new ConsoleLog());

const remote = require("@electron/remote/main");
remote.initialize();

const ENTRY = process.env.ENTRY;
if (!ENTRY) {
    throw new Error(`Env var ENTRY is not defined. This should specify the entry point for the Electron browser process.`);
}
import "./services/platform";

registerSingleton(ILogId, new ConsoleLog());

//
// Represents the application's main menu.
//
const mainMenu: IMainMenu = new MainMenu();

const createWindow = () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true, // Enabled this to prevent errors in Monaco Editor workers.
            contextIsolation: false,
            webviewTag: true,
        },
    });

    window.once('ready-to-show', () => {
        window.webContents.openDevTools();    
        mainMenu.buildEditorMenu();
        window.show();
    });

    if (ENTRY.startsWith("http://")) {
        //
        // Wait a short amount of time before loading
        // so the webpack dev server has started.
        //
        setTimeout(() => {
            console.log(`Loading URL ${ENTRY}`);
            window.loadURL(ENTRY);
        }, 100);
    }
    else {
        console.log(`Loading file ${ENTRY}`);
        window.loadFile(ENTRY);
    }

    remote.enable(window.webContents);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});