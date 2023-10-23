import { InjectProperty, InjectableClass } from "@codecapers/fusion";
import { app, ipcMain, BrowserWindow } from "electron";
import { IEventSource, EventSource, ILog, ILogId, handleAsyncErrors } from "utils";
import * as path from "path";
import { existsSync, readJSONSync, writeJSON } from "fs-extra";
import { ISettings, SettingsChangedEventHandler } from "notebook-editor";
import * as _ from "lodash";

@InjectableClass()
export class MainSettings implements ISettings {

    @InjectProperty(ILogId)
    log!: ILog;

    //
    // Store of settings.
    //
    private store: any = {};

    //
    // Path of the settings file.
    //
    settingsFilePath = path.join(app.getPath("userData"), "settings.json");

    constructor() {
        this.writeSettings = _.debounce(this.writeSettings.bind(this), 1000);
        
        ipcMain.on("settings-set-value", (event: any, setting: any) => {
            this.updateValue(setting);
        });

        ipcMain.on("settings-delete-value", (event: any, key: string) => {
            this.deleteValue(key);
        });
    }

    //
    // Load settings from disk.
    //
    loadSettings(): void {
        this.log.info(`// [MAIN] Loading settings from ${this.settingsFilePath}`);
        
        const settingsFileExists = existsSync(this.settingsFilePath);
        if (!settingsFileExists) {
            return; // Nothing to load.
        }

        try {
            this.store = readJSONSync(this.settingsFilePath);
        }
        catch (err) {
            this.log.error("Failed to load settings.");
            this.log.error(err && err.stack || err);
            this.store = {};
        }
    }

    //
    // Invoke any watchers.
    //
    private invokeWatchers(key: string) {
        this.onSettingsChanged.raise(key)
            .catch((err: any) => {
                this.log.error(`Failed raising event onSettingsChanged.`);
                this.log.error(err && err.stack || err);
            });
    }

    //
    // Update a setting value and broadcast to all renderers.
    //
    private updateValue(setting: any) {

        this.store[setting.key] = setting.value;
        this.writeSettings();

        // Broadcast to all renderers.
        const browserWindows = BrowserWindow.getAllWindows();
        this.log.info(`// [MAIN] Updating settings value ${setting.key} to ${setting.value}, broadcasting to ${browserWindows.length} renderers.`);

        for (const browserWindow of browserWindows) {
            browserWindow.webContents.send("settings-set-value", setting);
        }

        this.invokeWatchers(setting.key);
    }

    //
    // Write the settings file.
    //
    private writeSettings(): void {
        handleAsyncErrors(() => this.flushSettings());
    }

    //
    // Synchronously write settings.
    //
    async flushSettings(): Promise<void> {
        this.log.info(`// [MAIN] Writing settings to ${this.settingsFilePath}`);
        await writeJSON(this.settingsFilePath, this.store);
    }

    //
    // Set a value.
    //
    set<T>(key: string, value: T): void {
        this.store[key] = value;
        this.updateValue({
            key,
            value,
        });
    }

    //
    // Get a value.
    //
    get<T>(key: string): T | undefined {
        return this.store[key] as T;
    }

    //
    // Delete a setting and broadcast to all renderers.
    //
    private deleteValue(key: string) {
        delete this.store[key];
        this.writeSettings();

        // Broadcast to all renderers.
        for (const browserWindow of BrowserWindow.getAllWindows()) {
            browserWindow.webContents.send("settings-delete-value", key);
        }

        this.invokeWatchers(key);
    }

    //
    // Delete a setting.
    //
    delete(key: string): void {
        this.deleteValue(key);
    }

   //
    // Event raised when a setting has changed.
    //
    onSettingsChanged: IEventSource<SettingsChangedEventHandler> = new EventSource<SettingsChangedEventHandler>();
}