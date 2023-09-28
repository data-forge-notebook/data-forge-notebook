import * as React from "react";
import * as ReactDOM from "react-dom";
import { NotebookEditor, NotebookViewModel, NotebookEditorViewModel, ICommander, ICommanderId, INotebookRepositoryId } from "notebook-editor";
import { ipcRenderer } from "electron";
import { testNotebook } from "./test-notebook";
import { handleAsyncErrors, ILogId } from "utils";
import { instantiateSingleton, registerSingleton } from "@codecapers/fusion";
import { ElectronWindowLog } from "./services/electron-renderer-log";

import "./services/file";
import "./services/confirmation-dialog";
import "./services/dialogs.impl";
import "./services/notebook-repository";
import "./services/platform";
import { NotebookRepository, NotebookStorageId } from "./services/notebook-repository";

export let editorWindowId = "";

const idArgPrefix = "--id=";
for (const arg of process.argv) {
    if (arg.startsWith(idArgPrefix)) {
        editorWindowId = arg.substring(idArgPrefix.length);
        break;
    }
}

if (!editorWindowId || editorWindowId.length <= 0) {
    throw new Error("No editor window id was provided!");
}

const log = new ElectronWindowLog(`editor-window/${editorWindowId.substring(0, 5)}`);
registerSingleton(ILogId, log);

const notebookRepository = instantiateSingleton<NotebookRepository>(INotebookRepositoryId);
const storageId = notebookRepository.makeUntitledNotebookId();
const notebookViewModel = NotebookViewModel.deserialize(storageId, true, false, "v16", testNotebook);
const notebookEditorViewModel = new NotebookEditorViewModel(notebookViewModel);

async function onNotebookSet() {
    const notebook = notebookEditorViewModel.getOpenNotebook();
    const notebookId = notebook.getStorageId() as NotebookStorageId;
    const fileName = notebookId.getFileName();
    const isModified = notebook.isModified();
    ipcRenderer.send("notebook-editor-event", {
        editorWindowId: editorWindowId,
        eventName: "onNotebookSet",
        payload: {
            fileName: fileName,
            isModified: isModified,
        },
    });
}

async function onNotebookModified() {
    const notebook = notebookEditorViewModel.getOpenNotebook();
    const isModified = notebook.isModified();
    ipcRenderer.send("notebook-editor-event", {
        editorWindowId: editorWindowId,
        eventName: "onModified",
        payload: {
            isModified: isModified,
        },
    });
}

notebookEditorViewModel.onOpenNotebookChanged.attach(onNotebookSet);
notebookEditorViewModel.onModified.attach(onNotebookModified);

class App extends React.Component {

    async componentDidMount() {
        await onNotebookSet();
    }

    render() {
        return (
            <NotebookEditor model={notebookEditorViewModel} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));

const commander = instantiateSingleton<ICommander>(ICommanderId);

ipcRenderer.on("invoke-command", (event: any, args: any) => {
    handleAsyncErrors(async () => {
        await commander.invokeNamedCommand(args.commandId);
    });
});
