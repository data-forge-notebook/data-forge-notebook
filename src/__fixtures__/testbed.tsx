import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoEditor } from "../components/monaco-editor";
import { PluggableVisualization } from "../notebook/cell/output/pluggable-visualization";
import { loadMonaco } from "./load-monaco";
import "./services/plugin-repository";

console.log("Loading Monaco...");
loadMonaco()
    .then(() => {
        console.log("Monaco loaded!");

        render();
    })
    .catch(err => {
        console.error("Failed to load Monaco!");
        console.error(err && err.stack || err);
    });


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

function render() {
    ReactDOM.render(<App />, document.getElementById("root"));
}
