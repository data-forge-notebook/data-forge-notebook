import * as React from "react";
import * as ReactDOM from "react-dom";
import "./services/plugin-repository";
import { NotebookEditor } from "..";

function App() {
    return (
        <>
            <div className="centered-container mb-30">
                <h1>Data-Forge Notebook v2: Browser testing environment</h1>
                <p>
                    This is the browser testing environment for DFN v2.
                    This user interface also runs on the desktop using Electron.
                    What you see here is a hard coded JavaScript notebook.
                    You can't edit this yet, but full editing and code evaluation capabiltites matching <a target="_blank" href="https://www.data-forge-notebook.com/">DFN v1</a> aren't far away!
                </p>
                <p className="mt-2">
                    <a target="_blank" href="https://github.com/data-forge-notebook/editor-core/">The code for DFN v2 is open source</a>.
                </p>
                <p>
                    <a target="_blank" href="https://twitter.com/codecapers">Follow on Twitter</a> for updates.
                </p>
                
            </div>
            <NotebookEditor />
        </>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
