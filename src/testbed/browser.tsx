import * as React from "react";
import * as ReactDOM from "react-dom";
import "./services/plugin-repository";
import { NotebookEditor } from "..";

function App() {
    return (
        <>
            <div className="centered-container mb-30">
                <h1>Data-Forge Notebook: Browser testing environment</h1>
                <p>
                    The code for DFN is incremently being open sourced and 
                    there isn't much here yet.
                </p>
                <p>
                    Watch this code repository grow week by week!
                </p>
            </div>
            <NotebookEditor />
        </>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
