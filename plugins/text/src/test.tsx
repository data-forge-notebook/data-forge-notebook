import React from "react";
import ReactDOM from "react-dom";
import { IVizConfig } from "./host-communication-bridge";
import { Text } from "./text";

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
                // data: undefined,
                // data: { foo: "bar" } as any,
                data: `Some text\n   Preformatted!`,
            },
        };
    }

    render() {
        return (
            <Text text={this.state.config?.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));