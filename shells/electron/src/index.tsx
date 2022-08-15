import * as React from "react";
import * as ReactDOM from "react-dom";
import { NotebookEditor, NotebookViewModel, NotebookEditorViewModel, ICommander, ICommanderId } from "notebook-editor";
import { ipcRenderer } from "electron";
import { testNotebook } from "./test-notebook";
import { ConsoleLog, handleAsyncErrors, ILogId } from "utils";
import { instantiateSingleton, registerSingleton } from "@codecapers/fusion";

import "./services/file";
import "./services/confirmation-dialog";
import "./services/dialogs";
import "./services/notebook-repository";

registerSingleton(ILogId, new ConsoleLog());

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

ipcRenderer.on("invoke-command", (event: any, args: any) => {
    handleAsyncErrors(async () => {
        const commander = instantiateSingleton<ICommander>(ICommanderId);
        await commander.invokeNamedCommand(args.commandId);
    });
});
