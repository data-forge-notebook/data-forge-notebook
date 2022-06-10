import * as React from "react";
import * as ReactDOM from "react-dom";
import { NotebookEditor } from "..";

function App() {
    return (
        <div>
            <h1>Data-Forge Notebook: Electron testing environment</h1>
            <p>
                The code for DFN is incremently being open sourced and 
                there isn't much here yet.
            </p>
            <p>
                Watch this code repository grow week by week!
            </p>
            <NotebookEditor />
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));