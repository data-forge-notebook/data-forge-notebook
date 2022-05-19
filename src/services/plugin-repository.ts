//
// Interface to find plugins.
//

export const IPluginRepo_ID = "IPluginRepo";

export interface IPluginConfig {

    //
    // Identifies the data or the plugin used to render it.
    //
    displayType?: string;

    //
    // Data to be rendered by the plugin.
    //
    data: any;
}

export interface IPluginRepo {

    //
    // Inspect the data and retreive a plugin.
    //
    getPlugin(config: IPluginConfig): Promise<string>;
}