import React from "react";
import ReactDOM from "react-dom";
import { Geo } from "./geo";
import { IPluginRequest, connectHost } from "host-bridge";

interface IAppState {
    //
    // Plugin configuration.
    //
    config?: IPluginRequest;
}

class App extends React.Component<{}, IAppState> {

    constructor(props: {}) {
        super(props);

        this.state = {};
    }

    async componentDidMount() {
        // Connects to the visualization host.
        const host = await connectHost({
            // Configures the plugin.
            configure: async (config) => {
                this.setState({
                    config: config,
                });
            },
        });
    }

    render() {
        return (
            <Geo 
                data={this.state.config?.data} 
                aux={this.state.config?.aux}
                />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));