import { InjectProperty, InjectableClass } from "@codecapers/fusion";
import { ipcRenderer } from "electron";
import { ILog, ILogId } from "utils";
import { readJSONSync, existsSync } from "fs-extra";
import * as path from "path";
import { IEventSource, EventSource } from "utils";
import { ISettings, SettingsChangedEventHandler } from "notebook-editor";

const remote = require("@electron/remote");
const app = remote.app;

@InjectableClass()
export class RendererSettings implements ISettings {

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
        ipcRenderer.on("settings-set-value", (event: any, setting: any) => {
            this.updateValue(setting);
        });
    }

    //
    // Load settings from disk.
    //
    loadSettings(): void {
        this.log.info(`// [RENDERER] Loading settings from ${this.settingsFilePath}`);
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
    // Update a setting value.
    //
    private updateValue(setting: any) {
        this.log.info(`// [RENDERER] Received updated settings value ${setting.key} to ${setting.value}.`);
        this.store[setting.key] = setting.value;
        this.invokeWatchers(setting.key);
    }

    //
    // Set a value.
    //
    set<T>(key: string, value: T): void {
        this.log.info(`// [RENDERER] Setting value ${key} to ${value}, notifying main process.`);
        this.store[key] = value;
        ipcRenderer.send("settings-set-value", {
            key,
            value,
        });
        this.invokeWatchers(key);
    }

    //
    // Get a value.
    //
    get<T>(key: string): T | undefined {
        return this.store[key] as T;
    }

    //
    // Delete a setting.
    //
    delete(key: string): void {
        delete this.store[key];
        ipcRenderer.send("settings-delete-value", key);
    }

    //
    // Event raised when a setting has changed.
    //
    onSettingsChanged: IEventSource<SettingsChangedEventHandler> = new EventSource<SettingsChangedEventHandler>();
}