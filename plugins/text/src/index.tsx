import React from "react";
import ReactDOM from "react-dom";
import { Text } from "./text";
import { IConfigEventData, connectHost } from "host-bridge";

interface IAppState {
    //
    // Plugin configuration.
    //
    config?: IConfigEventData;
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
            <Text text={this.state.config?.pluginRequest.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));