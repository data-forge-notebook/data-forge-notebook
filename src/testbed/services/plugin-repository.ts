//
// Interface to find plugins.
//

import { InjectableSingleton } from "@codecapers/fusion";
import { IPluginRepo, IPluginRepo_ID, IPluginConfig } from "../../services/plugin-repository";
import * as path from "path";
import { IPluginRequest } from "host-bridge";

//
// A lookup table of plugins.
//
interface IPluginMap {
    [index: string]: IPluginConfig;
}

//
// Defines a plugin override from a local web server.
//
interface IPluginOverride {
    //
    // The port number the plugin is available on.
    //
    portNo: number;
}

//
// A look up table of plugin overrides.
//
interface IPluginOverrideMap {
    [index: string]: IPluginOverride;
}

//
// Loads embedded plugins.
//
function loadEmbeddedPlugins(): IPluginMap {
    let pluginManifest: IPluginOverrideMap = {};
    const plugins: IPluginMap = {};

    // https://webpack.js.org/configuration/module/#module-contexts
    const jsonContext = require.context("plugins/data", true, /\.\/.*\.json$/);
    for (const key of jsonContext.keys()) {
        const pluginName = path.basename(key, ".json");
        if (pluginName === "plugins") {
            // This is the plugin manifest.
            pluginManifest = jsonContext(key);
        }
        else {
            plugins[pluginName] = jsonContext(key);
            plugins[pluginName].name = pluginName;
        }
    }

    const textContext = require.context("plugins/data", true, /\.\/.*\.txt$/);
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

    for (const [ pluginName, pluginConfig ] of Object.entries(pluginManifest)) {
        const plugin = plugins[pluginName];
        plugin.url = `http://localhost:${pluginConfig.portNo}`;
    }

    for (const plugin of Object.values(plugins)) {
        if (plugin.url)  {
            console.log(`Serving plugin ${plugin.name} from ${plugin.url}`);
        }
        else if (plugin.content === undefined) {
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
    // Inspect the data and retreive the configuration for a plugin.
    //
    private matchPlugin(pluginRequest: IPluginRequest): IPluginConfig | undefined {

        if (pluginRequest.displayType) {
            for (const plugin of plugins) {
                if (typeof(plugin.displayType) === "string") {
                    if (pluginRequest.displayType === plugin.displayType) {
                        return plugin;
                    }
                }
                else {
                    for (const pluginDisplayType of plugin.displayType) {
                        if (pluginRequest.displayType === pluginDisplayType) {
                            return plugin;
                        }
                    }
                }
            }
        }

        return undefined;
    }

    //
    // Inspect the data and retreive a plugin.
    //
    async getPlugin(pluginRequest: IPluginRequest): Promise<IPluginConfig> {

        console.log(`Requesting plugin content:`);
        console.log(pluginRequest);

        let matchedPlugin = this.matchPlugin(pluginRequest);
        if (!matchedPlugin) {
            console.log(`Didn't match any plugin, returning default plugin:`);
            console.log(defaultPlugin);

            matchedPlugin = defaultPlugin;
        }
        else {
            console.log(`Matched plugin request against plugin ${matchedPlugin.name}:`);
            console.log(matchedPlugin);
        }
        
        if (pluginRequest.plugin) {
            if (pluginRequest.plugin.startsWith("http://")) {
                console.log(`Plugin is overriden and delegated to ${pluginRequest.plugin}`);
                //
                // Delegate plugin loading to a web server.
                // You can load local plugins this way.
                //
                matchedPlugin = Object.assign({}, matchedPlugin); // Don't overwrite underlying plugin.
                matchedPlugin.url = pluginRequest.plugin;
            }
        }
        
        return matchedPlugin;
    }
}