import React from "react";
import ReactDOM from "react-dom";
import { Table } from "./table";
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
                    columnNames: [ "A", "B" ],

                    rows: [
                        {
                            A: 1,
                            B: 10,
                        },
                        {
                            A: 2,
                            B: 20,
                        },
                    ],
                },
            },
        };
    }

    render() {
        return (
            <Table table={this.state.config?.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));