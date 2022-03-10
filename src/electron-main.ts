//
// The main file for the Electron entry point.
//

const { app, BrowserWindow } = require('electron');

const ENTRY = process.env.ENTRY;
if (!ENTRY) {
    throw new Error(`Env var ENTRY is not defined. This should specify the entry point for the Electron browser process.`);
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
        },
    });

    if (ENTRY.startsWith("http://")) {
        console.log(`Loading URL ${ENTRY}`);
        win.loadURL(ENTRY);
    }
    else {
        console.log(`Loading file ${ENTRY}`);
        win.loadFile('dist/electron/electron.html');
    }
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