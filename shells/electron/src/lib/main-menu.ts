import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from "electron";
import { commandTable, expandAccelerator } from "notebook-editor/build/services/command";
import { IPlatform, IPlatformId } from "notebook-editor/build/services/platform";
import { BasicEventHandler, IEventSource, EventSource, ILog, ILogId } from "utils";
import * as path from "path";
import * as os from "os";
const opn = require('open');

import "notebook-editor/build/actions/new-notebook-action";
import "notebook-editor/build/actions/eval-notebook-action";
import "notebook-editor/build/actions/open-notebook-action";
import "notebook-editor/build/actions/redo-action";
import "notebook-editor/build/actions/undo-action";
import "notebook-editor/build/actions/reload-notebook-action";
import "notebook-editor/build/actions/save-notebook-action";
import "notebook-editor/build/actions/save-notebook-as-action";
import "notebook-editor/build/actions/toggle-hotkeys-action";
import "notebook-editor/build/actions/toggle-command-palette-action";
import "notebook-editor/build/actions/clear-recent-files-action";
import "notebook-editor/build/actions/toggle-recent-file-picker-action";
import "notebook-editor/build/actions/open-example-notebook-action";
import "notebook-editor/build/actions/toggle-examples-browser-action";
import "notebook-editor/build/actions/open-notebook-in-file-system-action";
import "notebook-editor/build/actions/copy-notebook-file-path-to-clipboard-action";
import "notebook-editor/build/actions/copy-notebook-file-name-to-clipboard-action";
import "notebook-editor/build/actions/focus-next-cell-action";
import "notebook-editor/build/actions/focus-prev-cell-action";
import "notebook-editor/build/actions/focus-top-cell-action";
import "notebook-editor/build/actions/focus-bottom-cell-action";
import "notebook-editor/build/actions/insert-code-cell-above-action";
import "notebook-editor/build/actions/insert-code-cell-below-action";
import "notebook-editor/build/actions/insert-markdown-cell-above-action";
import "notebook-editor/build/actions/insert-markdown-cell-below-action";
import "notebook-editor/build/actions/move-cell-up-action";
import "notebook-editor/build/actions/move-cell-down-action";
import "notebook-editor/build/actions/cut-cell-action";
import "notebook-editor/build/actions/copy-cell-action";
import "notebook-editor/build/actions/paste-cell-above-action";
import "notebook-editor/build/actions/paste-cell-below-action";
import "notebook-editor/build/actions/delete-cell-action";
import "notebook-editor/build/actions/clear-outputs-action";
import "notebook-editor/build/actions/split-cell-action";
import "notebook-editor/build/actions/merge-cell-down-action";
import "notebook-editor/build/actions/merge-cell-up-action";
import "notebook-editor/build/actions/duplicate-cell-action";

import { IWindowManager, IWindowManagerId } from "./window-manager";
import { ISettings, ISettings_ID } from "notebook-editor/build/services/settings";
import { RECENT_FILES_SETTINGS_KEY } from "notebook-editor/build/services/recent-files";
import { getNodejsInstallPath } from "../services/path-main";

const devMenuTemplate = {
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
        {
            label: "Open install path",
            click: () => {
                const platform = os.platform();
                const path = directories[platform].installPath;
                opn(path);
            }
        },
    ],
};

const appInstallDirectory = "data-forge-notebook-v2";

const directories: any = {
    linux: {
        installPath: "N/A",
        projectPath: path.join(os.tmpdir(), "dfntmp"),
        settingsPath: path.join(os.homedir(), `.config/${appInstallDirectory}`),
        logFilePath: path.join(os.homedir(), `.config/${appInstallDirectory}/log.log`),
    },
    darwin: {
        installPath: "N/A",
        projectPath: path.join(os.tmpdir(), "dfntmp"),
        settingsPath: path.join(os.homedir(), `Library/Application\ Support/${appInstallDirectory}`),
        logFilePath: path.join(os.homedir(), `Library/Logs/${appInstallDirectory}/log.log`),
    },
    win32: {
        installPath: path.join(os.homedir(), `AppData\\Local\\Programs\\${appInstallDirectory}`),
        projectPath: path.join(os.tmpdir(), "dfntmp"),
        settingsPath: path.join(os.homedir(), `AppData\\Roaming\\${appInstallDirectory}`),
        logFilePath: path.join(os.homedir(), `AppData\\Roaming\\${appInstallDirectory}\\log.log`),
    },
};

export interface IMainMenu {
    //
    // Switch to the main editor menu.
    //
    buildEditorMenu(): void;

    //
    // Event raised when there is a request to open a new editor window.
    //
    onNewEditorWindow: IEventSource<BasicEventHandler>;
}

@InjectableClass()
export class MainMenu implements IMainMenu {

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    @InjectProperty(IWindowManagerId)
    windowManager!: IWindowManager;

    @InjectProperty(ISettings_ID)
    settings!: ISettings;

    private createSeparator(): MenuItemConstructorOptions {
        return {
            type: "separator",
        };
    }

    //
    // Invokes a command in the notebook editor in the Electron renderer process.
    //
    private invokeCommand(commandId: string, params?: any): void {
        BrowserWindow.getFocusedWindow()!.webContents.send("invoke-command", { commandId, params });
    }
    
    private createMenu(commandId: string): MenuItemConstructorOptions {
        const command = commandTable[commandId];
        if (!command) {
            throw new Error("Failed to find command " + commandId + "\r\nAvailable commands: " + Object.keys(commandTable).join(", "));
        }

        const commandDef = command.getDef();
        if (!commandDef.label) {
            throw new Error("Command " + commandId + " must have a label to be added to the menu!");
        }
        return {
            label: commandDef.label,
            accelerator: expandAccelerator(commandDef.accelerator, this.platform),
            click: () => {
                this.invokeCommand(commandId);
            }
        };
    }
    
    private createOpenRecentMenu(): MenuItemConstructorOptions {
        //todo: why doesn't this use the injected recent files interface?
        const recentFilesList = this.settings.get<string[]>(RECENT_FILES_SETTINGS_KEY) || [];
        const recentFilesMenuItems: MenuItemConstructorOptions[] = recentFilesList
            .map(recentFilePath => {
                return {
                    label: path.basename(recentFilePath) + " - " + recentFilePath,
                    click: () => {
                        this.invokeCommand("open-notebook", { file: recentFilePath });
                    },
                };
            });
    
        let openRecentMenu: MenuItemConstructorOptions[];
    
        if (recentFilesMenuItems.length > 0) {
            openRecentMenu = [
                    this.createMenu("clear-recent-files"),
                    this.createMenu("toggle-recent-file-picker"),
                    this.createSeparator(),
                ]
                .concat(recentFilesMenuItems);
        }
        else {
            openRecentMenu = [
                {
                    label: "no recent files",
                    enabled: false,
                },
            ];
        }    
    
        return {
            label: "Open Recent",
            submenu: openRecentMenu,
        };
    }

    //
    // Create a menu item that links to a web page.
    //
    private createLinkMenuItem(label: string, link: string): MenuItemConstructorOptions {
        return {
            label: label,
            click: () => {
                shell.openExternal(link);
            }
        };
    }

    //
    // Switch to the main editor menu.
    //
    buildEditorMenu(): void {
        const menus: MenuItemConstructorOptions[] = [
            {
                label: "&File",
                submenu: [
                    this.createMenu("new-notebook"),

                    {
                        label: "New &window",
                        accelerator: expandAccelerator("CmdOrCtrl+Shift+N", this.platform),
                        click: async () => {
                            await this.onNewEditorWindow.raise();
                        },
                    },
                    
                    this.createSeparator(),

                    this.createMenu("open-notebook"),
                    this.createMenu("open-example-notebook"),
                    this.createOpenRecentMenu(),

                    this.createSeparator(),

                    this.createMenu("reload-notebook"),

                    this.createSeparator(),

                    this.createMenu("save-notebook"),
                    this.createMenu("save-notebook-as"),

                    this.createSeparator(),

                    this.createMenu("open-notebook-in-filesystem"),
                    this.createMenu("copy-file-path-to-clipboard"),
                    this.createMenu("copy-file-name-to-clipboard"),

                    this.createSeparator(),
                ].concat(
                    !this.platform.isMacOS()
                        ? [
                            this.createSeparator(),
                            {
                                label: "&Quit",
                                accelerator: expandAccelerator("Alt+F4", this.platform),
                                click: () => {
                                    app.quit();
                                },
                            }
                        ]
                        : []
                ),
            },

            {
                label: "&Edit",
                submenu: [
                    this.createMenu("undo"),
                    this.createMenu("redo"),

                    this.createSeparator(),

                    // Menu items with builtin roles.
                    { label: "Cu&t", accelerator: "CmdOrCtrl+X", role: "cut" },
                    { label: "&Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
                    { label: "&Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
                    { label: "Select &All", accelerator: "CmdOrCtrl+A", role: "selectAll" },

                    this.createSeparator(),
                    
                    this.createMenu("focus-next-cell"),
                    this.createMenu("focus-prev-cell"),
                    this.createMenu("focus-top-cell"),
                    this.createMenu("focus-bottom-cell"),

                    this.createSeparator(),
                    
                    this.createMenu("insert-code-cell-above"),
                    this.createMenu("insert-code-cell-below"),
                    this.createMenu("insert-markdown-cell-above"),
                    this.createMenu("insert-markdown-cell-below"),
                    this.createMenu("move-cell-up"),
                    this.createMenu("move-cell-down"),

                    this.createSeparator(),

                    this.createMenu("cut-cell"),
                    this.createMenu("copy-cell"),
                    this.createMenu("paste-cell-above"),
                    this.createMenu("paste-cell-below"),

                    this.createSeparator(),
                    
                    this.createMenu("delete-cell"),
                ],
            },

            {
                label: "&View",
                submenu: [
                    this.createMenu("toggle-recent-file-picker"),
                    this.createMenu("toggle-examples-browser"),
                    this.createMenu("toggle-command-palette"),
                ],
            },

            {
                label: "&Run",
                submenu: [
                    this.createMenu("eval-notebook"),

                    this.createSeparator(),

                    this.createMenu("clear-outputs"),
                ],
            },

            {
                label: "&Settings",
                submenu: [
                    {
                        label: "Open log file directory",
                        click: () => {
                            const platform = os.platform();
                            const isMacOS = platform === "darwin";
                            let path = directories[platform].logFilePath;
                            if (isMacOS) {
                                path = path.replace("~", os.homedir());
                            }
                            console.log("Opening log file path for " + platform + ": " + path);
                            shell.showItemInFolder(path);
                        },
                    },

                    {
                        label: "Open Node.js installs directory",
                        click: () => {
                            opn(getNodejsInstallPath());
                        },
                    },
                ],
            },

            {
                label: "&Windows",
                submenu: this.windowManager.getEditorWindows()
                    .map(editorWindow => {
                        let fileName = editorWindow.isNotebookSet()
                            ? editorWindow.getFileName() || "Untitled"
                            : "Welcome Screen";
                        return {
                            label: fileName,
                            click: () => {
                                editorWindow.focus();
                            },
                        };
                    }),
            },

            {
                label: "&Help",
                submenu: [
                    this.createMenu("toggle-hotkeys"),
                    this.createMenu("open-example-notebook"),
                    this.createSeparator(),

                    {
                        label: "Getting Started",
                        submenu: [
                            this.createLinkMenuItem("Guide", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/getting-started"),
                            this.createLinkMenuItem("Video", "https://video.data-forge-notebook.com/getting-started"),
                            this.createLinkMenuItem("How do I visualize my data?", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/visualizing-data"),
                        ],
                    },
                    this.createSeparator(),
                    {
                        label: "Data-Forge Notebook",
                        submenu: [
                            this.createLinkMenuItem("Home page", "http://www.data-forge-notebook.com/"),
                            this.createLinkMenuItem("Videos", "https://youtube.com/playlist?list=PLQrB0_KjTmHijAPAk0uUDVVFa5wqBqJPj"),
                            this.createLinkMenuItem("Wiki", "https://github.com/data-forge-notebook/data-forge-notebook/wiki"),
                            this.createLinkMenuItem("Overview", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/overview"),
                            this.createLinkMenuItem("Road map", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/road-map"),
                            //todo: this.createLinkMenuItem("Commands and hotkeys", "todo"),
                            this.createLinkMenuItem("Code evaluation", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/code-evaluation"),
                            this.createLinkMenuItem("Visualizing data", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/visualizing-data"),
                        ],
                    },
                    {
                        label: "JavaScript",
                        submenu: [
                            this.createLinkMenuItem("Tutorial", "https://javascript.info/"),
                        ],
                    },
                    {
                        label: "Node.js",
                        submenu: [
                            this.createLinkMenuItem("Tutorial", "https://www.nodebeginner.org/"),
                            this.createLinkMenuItem("Home page", "http://nodejs.org"),
                            this.createLinkMenuItem("API docs", "https://nodejs.org/dist/latest/docs/api/"),
                        ],
                    },
                    {
                        label: "Markdown",
                        submenu: [
                            this.createLinkMenuItem("Markdown in 60 seconds", "https://commonmark.org/help/"),
                            this.createLinkMenuItem("Markdown in 10 minutes", "https://commonmark.org/help/tutorial/"),
                            this.createLinkMenuItem("Markdown specification", "https://commonmark.org/"),
                            this.createLinkMenuItem("Syntax extensions", "https://github.com/jonschlinkert/remarkable#syntax-extensions"),                            
                        ],
                    },

                    {
                        label: "GeoJSON",
                        submenu: [
                            this.createLinkMenuItem("GeoJSON on Wikipedia", "https://en.wikipedia.org/wiki/GeoJSON"),
                            this.createLinkMenuItem("An introduction to GeoJSON", "https://developer.here.com/blog/an-introduction-to-geojson"),
                        ],
                    },

                    this.createLinkMenuItem("Devdocs.io", "https://devdocs.io/"),
                    
                    this.createSeparator(),

                    this.createLinkMenuItem("Terms and conditions", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/terms-and-conditions"),
                    this.createLinkMenuItem("Privacy policy", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/privacy-policy"),

                    this.createSeparator(),
                    
                    this.createLinkMenuItem("Wiki", "https://github.com/data-forge-notebook/data-forge-notebook/wiki"),
                    this.createLinkMenuItem("Release history", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/release-history"),
                    this.createLinkMenuItem("Road map", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/road-map"),

                    this.createSeparator(),

                    this.createLinkMenuItem("Report a problem", "https://github.com/data-forge-notebook/data-forge-notebook/issues/new"),

                    this.createSeparator(),

                    this.createLinkMenuItem("About Data-Forge Notebook", "https://github.com/data-forge-notebook/data-forge-notebook/wiki/quick-overview"),
                ],
            },
        ];

        if (this.platform.isMacOS()) {
            // Add the MacOS app menu.
            menus.splice(0, 0, {
                label: "App",
                submenu: [
                    {
                        label: "&Quit",
                        accelerator: "Cmd+Q",
                        click: () => {
                            app.quit();
                        },
                    }
                ],
            });
        }

        //TODO: Only for dev mode.
        menus.push(devMenuTemplate);

        Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
    }

    //
    // Event raised when there is a request to open a new editor window.
    //
    onNewEditorWindow: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
}

