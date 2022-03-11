import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoEditor } from "./components/monaco-editor";
import { PluggableVisualization } from "./notebook/cell/output/pluggable-visualization";
import "./__fixtures__/services/plugin-repository";
import { Button } from "@blueprintjs/core";

function App() {
    return (
        <div>
            <h1>Monaco Editor test:</h1>
            <MonacoEditor />       
            <hr />
            <h1>Pluggable visualization test run:</h1>     
            <PluggableVisualization
                config={{
                    data: {
                        some: "data",
                        array: [1, 2, 3],
                    },
                }}
                />
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
