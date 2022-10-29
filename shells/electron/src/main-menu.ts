import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from "electron";
import { commandTable, expandAccelerator } from "notebook-editor/build/services/command";
import { IPlatform, IPlatformId } from "notebook-editor/build/services/platform";
import { ILog, ILogId } from "utils";

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

export interface IMainMenu {
    //
    // Switch to the main editor menu.
    //
    buildEditorMenu(): void;
}

@InjectableClass()
export class MainMenu implements IMainMenu {

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    private createSeparator(): MenuItemConstructorOptions {
        return {
            type: "separator",
        };
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
                BrowserWindow.getFocusedWindow()!.webContents.send("invoke-command", { commandId });
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
                    this.createMenu("open-notebook"),

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
}

