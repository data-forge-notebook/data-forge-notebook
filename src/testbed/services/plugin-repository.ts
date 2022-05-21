//
// Interface to find plugins.
//

import { InjectableSingleton } from "@codecapers/fusion";
import { IPluginConfig, IPluginContent, IPluginRepo, IPluginRepo_ID } from "../../services/plugin-repository";

const structureDataPlugin = require("./plugins/data.txt");
const textDataPlugin = require("./plugins/text.txt");

@InjectableSingleton(IPluginRepo_ID)
export class PluginRepo implements IPluginRepo {

    //
    // Inspect the data and retreive a plugin.
    //
    async getPlugin(config: IPluginConfig): Promise<IPluginContent> {

        if (config.plugin) {
            if (config.plugin.startsWith("http://")) {

                //
                // Delegate plugin loading to a web server.
                // You can load local plugins this way.
                //
                return {
                    url: config.plugin,
                };
            }
        }

        if (config.displayType) {
            if (config.displayType === "string" || config.displayType === "text") { //TODO: Can I delegate these rules to the plugin? A plugin registry would be handy ;)
                if (process.env.DISPLAY_TEXT) {
                    // Overrides the text plugin to reference a locally hosted plugin.
                    console.log(`Using "text" plugin override: ${process.env.DISPLAY_TEXT}`);
                    return {
                        url: process.env.DISPLAY_TEXT, 
                    };
                }

                return {
                    inline: textDataPlugin,
                };
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
            inline: structureDataPlugin,
        };
    }
}