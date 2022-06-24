import * as React from "react";
import * as ReactDOM from "react-dom";
import { NotebookEditor, NotebookViewModel, NotebookEditorViewModel } from "notebook-editor";
import { ipcRenderer } from "electron";
import { testNotebook } from "./test-notebook";
import { handleAsyncErrors } from "notebook-editor/build/lib/async-handler"; //TODO: MOVE

import "../services/file";
import "../services/confirmation-dialog";
import "../services/dialogs";
import "../services/notebook-repository";

const mockId: any = {};
const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, "v16", testNotebook);
const notebookEditorViewModel = new NotebookEditorViewModel(notebookViewModel);

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

            <NotebookEditor model={notebookEditorViewModel} />
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));

ipcRenderer.on("new-notebook", () => {
    handleAsyncErrors(async () => {
        await notebookEditorViewModel.newNotebook("javascript")
    });
});

ipcRenderer.on("open-notebook", () => {
    handleAsyncErrors(async () => {
        await notebookEditorViewModel.openNotebook();
    });
});

ipcRenderer.on("reload-notebook", () => {
    handleAsyncErrors(async () => {
        await notebookEditorViewModel.reloadNotebook();
    });
});

ipcRenderer.on("save-notebook", () => {
    handleAsyncErrors(async () => {
        await notebookEditorViewModel.saveNotebook();
    });
});


ipcRenderer.on("save-notebook-as", () => {
    handleAsyncErrors(async () => {
        await notebookEditorViewModel.saveNotebookAs();
    });
});

