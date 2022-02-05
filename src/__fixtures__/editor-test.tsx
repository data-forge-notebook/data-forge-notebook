import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoEditor } from "../components/monaco-editor";
import { loadMonaco } from "./load-monaco";

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
            <MonacoEditor />            
        </div>
    );
}

function render() {
    ReactDOM.render(<App />, document.getElementById("root"));
}
