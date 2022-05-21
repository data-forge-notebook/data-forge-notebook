//
// Interface to find plugins.
//

export const IPluginRepo_ID = "IPluginRepo";

export interface IPluginRequest {

    //
    // Identifies the data or the plugin used to render it.
    //
    displayType?: string;

    //
    // Specifically identifies the plugin to use to render this data.
    //
    plugin?: string;

    //
    // Data to be rendered by the plugin.
    //
    data: any;
}

//
// Defines the content of a plugin.
//
export interface IPluginContent {
    //
    // Set if the plugin is loaded directly from a web server.
    //
    url?: string;

    //
    // Set if the plugin is loaded from inline content.
    //
    inline?: string;
}

export interface IPluginRepo {

    //
    // Inspect the data and retreive a plugin.
    //
    getPlugin(pluginRequest: IPluginRequest): Promise<IPluginContent>;
}