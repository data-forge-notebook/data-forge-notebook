import React from "react";
import ReactDOM from "react-dom";
import { Plot } from "./plot";
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
                    "data": {
                        "series": {
                            "y": {
                                "type": "number",
                                "values": [
                                    50,
                                    20,
                                    10,
                                    40,
                                    15,
                                    25
                                ]
                            }
                        }
                    },
                    "plotConfig": {
                        "legend": {
                            "show": false
                        },
                        "chartType": "line",
                        "width": "95%",
                        "height": "95%",
                        "y": {
                            "min": 10,
                            "max": 50
                        },
                        "y2": {}
                    },
                    "axisMap": {
                        "y": [
                            {
                                "series": "y"
                            }
                        ],
                        "y2": []
                    },
                },
            },
        };
    }

    render() {
        return (
            <Plot data={this.state.config?.data} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));