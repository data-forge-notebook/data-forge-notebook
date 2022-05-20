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
                    This is the browser testing environment for DFN v2.
                    This interface also runs on the desktop using Electron.
                    What you see here is a hard coded JavaScript notebook.
                    You can't edit this yet, but it is starting to look like a real notebok!
                </p>
                <p className="mt-2">
                    Checkout <a target="_blank" href="https://github.com/data-forge-notebook/editor-core/">the open source code repo</a> to follow development of DFN v2.
                </p>
                <p>
                    To edit and evaluate JavaScript notebooks, use <a target="_blank" href="https://www.data-forge-notebook.com/">use Data-Forge Notebook v1</a>.
                </p>
                <p>
                    Follow <a target="_blank" href="https://twitter.com/codecapers">the developer on Twitter</a> for more frequent updates.
                </p>
                
            </div>
            <NotebookEditor />
        </>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
