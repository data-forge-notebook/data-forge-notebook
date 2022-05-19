//
// Interface to find plugins.
//

import { InjectableSingleton } from "@codecapers/fusion";
import { IPluginConfig, IPluginRepo, IPluginRepo_ID } from "../../services/plugin-repository";

const structureDataPlugin = require("./plugins/structured-data.txt");

@InjectableSingleton(IPluginRepo_ID)
export class PluginRepo implements IPluginRepo {

    //
    // Inspect the data and retreive a plugin.
    //
    async getPlugin(config: IPluginConfig): Promise<string> {

        //todo: Use config.displayType to choose an appropriate plugin.
        
        return structureDataPlugin;
    }
}