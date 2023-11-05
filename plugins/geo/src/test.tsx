import React from "react";
import ReactDOM from "react-dom";
import { Geo } from "./geo";
import { IPluginRequest } from "host-bridge";

interface IAppState {
    //
    // Plugin configuration.
    //
    config?: IPluginRequest;
}

class App extends React.Component<{}, IAppState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            config: {
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
        };
    }

    render() {
        return (
            <Geo data={this.state.config?.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));