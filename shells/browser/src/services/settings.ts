import { InjectProperty, InjectableSingleton } from "@codecapers/fusion";
import { ILog, ILogId } from "utils";
import { IEventSource, EventSource } from "utils";
import { ISettings, ISettings_ID, SettingsChangedEventHandler } from "notebook-editor";

@InjectableSingleton(ISettings_ID)
export class Settings implements ISettings {

    @InjectProperty(ILogId)
    log!: ILog;

    //
    // Store of settings.
    //
    private store: any = {};

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
    // Set a value.
    //
    set<T>(key: string, value: T): void {
        this.log.info(`// Setting value ${key} to ${value}`);
        this.store[key] = value;
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
    }

    //
    // Event raised when a setting has changed.
    //
    onSettingsChanged: IEventSource<SettingsChangedEventHandler> = new EventSource<SettingsChangedEventHandler>();
}