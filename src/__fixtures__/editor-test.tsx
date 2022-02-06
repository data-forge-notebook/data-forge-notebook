import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoEditor } from "../components/monaco-editor";
import { PluggableCellOutput } from "../notebook/cell/output/pluggable-cell-output";
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
            <h1>Cell output test:</h1>     
            <PluggableCellOutput
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
