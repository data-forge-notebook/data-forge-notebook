import React from "react";
import ReactDOM from "react-dom";
import { StructuredData } from "./structured-data";
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
                // data: 502,
                // data: "Hello world",
                // data: true,
                data: {
                    hello: "world",
                    a: [1, 2, 3],
                    x: 22,
                    nested: {
                        y: 33,
                    },
                    foo: false,
                },
            },
        };
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