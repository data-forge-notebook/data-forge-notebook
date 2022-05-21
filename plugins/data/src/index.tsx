import React from "react";
import ReactDOM from "react-dom";
import { StructuredData } from "./structured-data";
import { IVizConfig, connect } from "host-bridge";

interface IAppState {
    //
    // Plugin configuration.
    //
    config?: IVizConfig;
}

class App extends React.Component<{}, IAppState> {

    constructor(props: {}) {
        super(props);

        this.state = {};
    }

    async componentDidMount() {
        // Connects to the visualization host.
        await connect({
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