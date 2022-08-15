//
// The main file for the Electron entry point.
//

import { app, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from "electron";

const remote = require("@electron/remote/main");
remote.initialize();

const ENTRY = process.env.ENTRY;
if (!ENTRY) {
    throw new Error(`Env var ENTRY is not defined. This should specify the entry point for the Electron browser process.`);
}

const createWindow = () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true, // Enabled this to prevent errors in Monaco Editor workers.
            contextIsolation: false,
            webviewTag: true,
        },
    });

    window.webContents.openDevTools();

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

    createApplicationMenu();

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

//
// Creates the application menu.
//
function createApplicationMenu() {
    const menus: MenuItemConstructorOptions[] = [
        {
            label: "&File",
            submenu: [
                {
                    label: "New notebook",
                    click: () => {
                        BrowserWindow.getFocusedWindow()!.webContents.send("new-notebook");
                    },
                },
                {
                    label: "Open notebook",
                    click: () => {
                        BrowserWindow.getFocusedWindow()!.webContents.send("open-notebook");
                    },
                },
                {
                    label: "Reload notebook",
                    click: () => {
                        BrowserWindow.getFocusedWindow()!.webContents.send("reload-notebook");
                    },
                },
                {
                    label: "Save notebook",
                    click: () => {
                        BrowserWindow.getFocusedWindow()!.webContents.send("save-notebook");
                    },
                },
                {
                    label: "Save notebook as",
                    click: () => {
                        BrowserWindow.getFocusedWindow()!.webContents.send("save-notebook-as");
                    },
                },
                {
                    label: "Evaluate notebook",
                    click: () => {
                        BrowserWindow.getFocusedWindow()!.webContents.send("evaluate-notebook");
                    },
                },
            ],
        },
    ];

    const devMenu = {
        label: "Development",
        submenu: [
            {
                label: "Reload",
                accelerator: "F5",
                click: () => {
                    BrowserWindow.getFocusedWindow()!.webContents.reloadIgnoringCache();
                }
            },
            {
                label: "Toggle DevTools",
                accelerator: "Alt+CmdOrCtrl+I",
                click: () => {
                    BrowserWindow.getFocusedWindow()!.webContents.toggleDevTools();
                }
            },
        ]
    };
    menus.push(devMenu);

    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
}
