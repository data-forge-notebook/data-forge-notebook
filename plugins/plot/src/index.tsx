import React from "react";
import ReactDOM from "react-dom";
import { Plot } from "./plot";
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
            <Plot data={this.state.config?.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));