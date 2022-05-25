import React from "react";
import ReactDOM from "react-dom";
import { StructuredData } from "./structured-data";
import { connectHost, IPluginRequest } from "host-bridge";

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
        await connectHost({
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
            <StructuredData
                data={this.state.config?.data}
                />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));