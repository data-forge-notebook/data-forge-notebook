//
// Interface to find plugins.
//

import axios from "axios";
import { InjectableSingleton } from "@codecapers/fusion";
import { IPluginConfig, IPluginRepo_ID } from "../../services/plugin-repository";

@InjectableSingleton(IPluginRepo_ID)
export class IPluginRepo implements IPluginRepo {

    //
    // TODO: I'm going to need some kind of plugin repository.
    //
    private pluginUrl = "https://raw.githubusercontent.com/data-forge-notebook/output-plugin-structured-data/main/out/index.html";

    //
    // Inspect the data and retreive a plugin.
    //
    async getPlugin(config: IPluginConfig): Promise<string> {

        //
        // TODO: Should inspect data to determine which plugin to use.
        //

        const response = await axios.get(config.url || this.pluginUrl);
        return response.data;
    }
}