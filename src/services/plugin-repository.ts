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
// The config for a particular plugin.
//
export interface IPluginConfig {
    //
    // The name of the plugin.
    //
    name: string;

    //
    // The display type that this plugin matches.
    //
    displayType: string | [string];

    //
    // Default height for the plugin.
    //
    defaultHeight?: number;

    //
    // Set to true if the plugin should automatically be stretched to the full height of the resizable cell output.
    //
    isFullHeight?: boolean;

    //
    // Set if the plugin is loaded directly from a web server.
    //
    url?: string;

    //
    // The content for the plugin.
    //
    content: string;
}

export interface IPluginRepo {

    //
    // Inspect the data and retreive the content for a plugin.
    //
    getPlugin(pluginRequest: IPluginRequest): Promise<IPluginConfig>;

}
