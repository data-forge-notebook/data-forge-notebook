import React from "react";
import ReactDOM from "react-dom";
import { Html } from "./html";
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
                data: `<strong>Hello world</strong>`,
            },
        };
    }

    render() {
        return (
            <Html html={this.state.config?.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));