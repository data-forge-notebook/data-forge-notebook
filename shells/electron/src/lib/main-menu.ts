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
import { IWindowManager, IWindowManagerId } from "./window-manager";
import { getNodejsInstallPath } from "../evaluation-engine";
import { ISettings, ISettings_ID } from "notebook-editor/build/services/settings";
import { RECENT_FILES_SETTINGS_KEY } from "notebook-editor/build/services/recent-files";

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
            throw new Error("Failed to find command " + commandId);
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
                    this.createOpenRecentMenu(),

                    this.createSeparator(),

                    this.createMenu("reload-notebook"),

                    this.createSeparator(),

                    this.createMenu("save-notebook"),
                    this.createMenu("save-notebook-as"),

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
                ],
            },

            {
                label: "&View",
                submenu: [
                    this.createMenu("toggle-command-palette"),
                ],
            },

            {
                label: "&Run",
                submenu: [
                    this.createMenu("eval-notebook"),
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
                        let fileName = editorWindow.getFileName() || "untitled";
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

