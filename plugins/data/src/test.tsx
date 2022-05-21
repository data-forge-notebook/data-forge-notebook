import React from "react";
import ReactDOM from "react-dom";
import { StructuredData } from "./structured-data";
import { IVizConfig } from "host-bridge";

interface IAppState {
    //
    // Plugin configuration.
    //
    config?: IVizConfig;
}

class App extends React.Component<{}, IAppState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            config: {
                data: {
                    hello: "world",
                    a: [1, 2, 3],
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