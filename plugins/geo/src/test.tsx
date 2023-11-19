import React from "react";
import ReactDOM from "react-dom";
import { Geo } from "./geo";
import { IConfigEventData } from "host-bridge";

interface IAppState {
    //
    // Plugin configuration.
    //
    config?: IConfigEventData;
}

class App extends React.Component<{}, IAppState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            config: {
                pluginId: "geo",

                pluginOptions: {
                    cwd: "c:\\projects\\data-forge-notebook\\data-forge-notebook\\notebooks\\examples",
                },

                pluginRequest: {
                    data: {
                        location: [51.505, -0.10],
                        zoom: 13,
                        markers: [
                            [51.505, -0.1],
                            [51.5, -0.09],
                            [51.51, -0.08]
                        ],
                    },
                },

                // "pluginRequest": {
                //     "data": {
                //         "location": [
                //             51.505,
                //             -0.1
                //         ],
                //         "zoom": 13,
                //         "markers": [
                //             {
                //                 "location": [
                //                     51.505,
                //                     -0.1
                //                 ],
                //                 "iconUrl": "./marker.png",
                //                 "iconSize": [
                //                     30,
                //                     49
                //                 ],
                //                 "tooltip": "Such a great marker!"
                //             },
                //             {
                //                 "location": [
                //                     51.5,
                //                     -0.09
                //                 ],
                //                 "iconUrl": "./marker.png",
                //                 "tooltip": "Such a great marker!"
                //             },
                //             {
                //                 "location": [
                //                     51.51,
                //                     -0.08
                //                 ],
                //                 "iconUrl": "./marker.png",
                //                 "tooltip": "Such a great marker!"
                //             }
                //         ]
                //     },
                // },
            },
        };
    }

    render() {
        return (
            <Geo 
                data={this.state.config?.pluginRequest.data} 
                cwd={this.state.config?.pluginOptions.cwd}
                />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));