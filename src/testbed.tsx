import * as React from "react";
import * as ReactDOM from "react-dom";
import "./__fixtures__/services/plugin-repository";
import { NotebookEditor } from ".";

function App() {
    return (
        <div>
            <h1>Data-Forge Noteook testbed</h1>
            <NotebookEditor />
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
