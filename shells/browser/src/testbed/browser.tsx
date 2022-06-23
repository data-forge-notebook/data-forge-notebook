import * as React from "react";
import * as ReactDOM from "react-dom";
import { registerSingleton } from "@codecapers/fusion";
import { IConfirmationDialogId, INotebookRepositoryId, NotebookEditor } from "notebook-editor";

registerSingleton(INotebookRepositoryId, {
    // Mock repository for now.
});

registerSingleton(IConfirmationDialogId, {
    // Mock confirmation dialog service.
});

function App() {
    return (
        <>
            <div className="centered-container pb-4">
                <h1>Data-Forge Notebook v2: Browser testing environment</h1>
                <p>
                    This is the browser testing environment for DFN v2.
                    This user interface also runs on the desktop using Electron.
                    What you see here is a hard coded JavaScript notebook.
                    You can't edit this yet, but full editing and code evaluation capabilities matching <a target="_blank" href="https://www.data-forge-notebook.com/">DFN v1</a> aren't far away!
                </p>
                <p className="mt-2">
                    <a target="_blank" href="https://github.com/data-forge-notebook/editor-core/">DFN v2 is being open sourced through 2022</a>.
                </p>
                <p>
                    <a target="_blank" href="https://twitter.com/codecapers">Follow on Twitter</a> for updates.
                </p>
                
            </div>

            <NotebookEditor />

            <div className="centered-container pb-32">
                <h2>More coming soon!</h2>

                <p>
                    <a target="_blank" href="https://www.data-forge-notebook.com/">DFN v1</a> supports more visualizations and these are coming to v2 soon!
                </p>
                
                <p>
                    <a target="_blank" href="https://twitter.com/codecapers">Follow on Twitter</a> for updates.
                </p>
            </div>
        </>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
