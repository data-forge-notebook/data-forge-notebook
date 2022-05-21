//
// Interface to find plugins.
//

import { InjectableSingleton } from "@codecapers/fusion";
import { IPluginRequest, IPluginContent, IPluginRepo, IPluginRepo_ID } from "../../services/plugin-repository";
import * as path from "path";

//
// The config for a particular plugin.
//
interface IPluginConfig {
    //
    // The name of the plugin.
    //
    name: string;

    //
    // The display type that this plugin matches.
    //
    displayType: string | [string];

    //
    // The content for the plugin.
    //
    content: string;
}

//
// A lookup table of plugins.
//
interface IPluginMap {
    [index: string]: IPluginConfig;
}

//
// Loads embedded plugins.
//
function loadEmbeddedPlugins(): IPluginMap {
    const plugins: IPluginMap = {};

    const jsonContext = require.context("./plugins", true, /\.\/.*\.json$/);
    for (const key of jsonContext.keys()) {
        const pluginName = path.basename(key, ".json");
        plugins[pluginName] = jsonContext(key);
        plugins[pluginName].name = pluginName;
    }

    const textContext = require.context("./plugins", true, /\.\/.*\.txt$/);
    for (const key of textContext.keys()) {
        const pluginName = path.basename(key, ".txt");
        const plugin = plugins[pluginName];
        if (plugin) {
            plugin.content = textContext(key);
        } 
        else {
            console.error(`Found plugin content ${key}, but there is no plugin config file ${pluginName}.json.`);
        }
    }

    for (const plugin of Object.values(plugins)) {
        if (plugin.content === "undefined") {
            console.error(`No content found for plugin ${plugin.name}.`);
        }
    }

    return plugins;
}

const pluginMap = loadEmbeddedPlugins();
const plugins = Object.values(pluginMap);
const defaultPlugin = plugins.filter(plugin => plugin.displayType === "*")[0];
if (defaultPlugin === undefined) {
    throw new Error(`Default plugin not found, you need a plugin with displayType = "*"`);
}

@InjectableSingleton(IPluginRepo_ID)
export class PluginRepo implements IPluginRepo {

    //
    // Inspect the data and retreive a plugin.
    //
    async getPlugin(pluginRequest: IPluginRequest): Promise<IPluginContent> {

        if (pluginRequest.plugin) {
            if (pluginRequest.plugin.startsWith("http://")) {

                //
                // Delegate plugin loading to a web server.
                // You can load local plugins this way.
                //
                return {
                    url: pluginRequest.plugin,
                };
            }
        }

        if (pluginRequest.displayType) {
            if (pluginRequest.displayType === "string" || pluginRequest.displayType === "text") {
                if (process.env.DISPLAY_TEXT) {
                    // Overrides the text plugin to reference a locally hosted plugin.
                    console.log(`Using "text" plugin override: ${process.env.DISPLAY_TEXT}`);
                    return {
                        url: process.env.DISPLAY_TEXT, 
                    };
                }
            }
        }

        if (pluginRequest.displayType) {
            for (const plugin of plugins) {
                if (typeof(plugin.displayType) === "string") {
                    if (pluginRequest.displayType === plugin.displayType) {
                        return {
                            inline: plugin.content,
                        };
                    }
                }
                else {
                    for (const pluginDisplayType of plugin.displayType) {
                        if (pluginRequest.displayType === pluginDisplayType) {
                            return {
                                inline: plugin.content,
                            };
                        }
                    }
                }
            }
        }

        if (process.env.DISPLAY_DEFAULT) {
            // Overrides the default/data plugin to reference a locally hosted plugin.
            console.log(`Using default plugin override: ${process.env.DISPLAY_DEFAULT}`);
            return {
                url: process.env.DISPLAY_DEFAULT, 
            };
        }

        return {
            inline: defaultPlugin.content,
        };
    }
}