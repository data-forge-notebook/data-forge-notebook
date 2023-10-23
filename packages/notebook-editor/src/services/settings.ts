import { IEventSource } from "utils";

export type SettingsChangedEventHandler = (key: string) => Promise<void>;

export const ISettings_ID = "ISettings";

export interface ISettings {
    //
    // Set a value.
    //
    set<T = string>(key: string, value: T): void;

    //
    // Get a value.
    //
    get<T = string>(key: string): T | undefined;

    //
    // Delete a setting.
    //
    delete(key: string): void;

    //
    // Event raised when a setting has changed.
    //
    onSettingsChanged: IEventSource<SettingsChangedEventHandler>;
}

