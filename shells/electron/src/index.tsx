import * as React from "react";
import * as ReactDOM from "react-dom";
import { NotebookEditor, NotebookEditorViewModel, ICommander, ICommanderId } from "notebook-editor";
import { ipcRenderer } from "electron";
import { handleAsyncErrors, ILogId } from "utils";
import { instantiateSingleton, registerSingleton } from "@codecapers/fusion";
import { ElectronWindowLog } from "./services/electron-renderer-log";
import mixpanel from "mixpanel-browser";
import { reaction, spy } from "mobx";

import "./services/file";
import "./services/confirmation-dialog";
import "./services/dialogs.impl";
import "./services/notebook-repository";
import "./services/platform";
import "./services/recent-files";
import "./services/electron-renderer-open";
import "./services/paths-renderer";
import "./services/zoom";
import "./services/clipboard";
import { NotebookStorageId } from "./services/notebook-repository";
import { RendererSettings } from "./services/electron-renderer-settings";

mixpanel.init("ab53b6b694ea458274e3b8ab66481c78");
mixpanel.track_pageview();

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

const settings = new RendererSettings();
registerSingleton("ISettings", settings);

settings.loadSettings();

const notebookEditorViewModel = new NotebookEditorViewModel();

//
// Raises the event in the main process that the notebook editor is ready.
//
async function onEditorReady() {
    ipcRenderer.send("notebook-editor-event", {
        editorWindowId: editorWindowId,
        eventName: "onEditorReady",
        payload: {},
    });
}

//
// Raises the event in the main process that a new notebook has been set.
//
async function onNotebookSet() {
    const notebook = notebookEditorViewModel.notebook;
    if (!notebook) {
        return;
    }
    const notebookId = notebook.storageId as NotebookStorageId;
    const fileName = notebookId.getFileName();
    const isModified = notebook.modified;
    ipcRenderer.send("notebook-editor-event", {
        editorWindowId: editorWindowId,
        eventName: "onNotebookSet",
        payload: {
            fileName: fileName,
            isModified: isModified,
        },
    });
}

//
// Raises the event in the main process to show the window after the notebook has been rendered.
//
async function onNotebookRendered() {
    const notebook = notebookEditorViewModel.notebook;
    if (!notebook) {
        return;
    }
    ipcRenderer.send("notebook-editor-event", {
        editorWindowId: editorWindowId,
        eventName: "onNotebookRendered",
        payload: {},
    });
}

//
// Raises the event in the main process that the notebook has been modified.
//
async function onNotebookModified() {
    console.log("onNotebookModified"); //fio:
    const notebook = notebookEditorViewModel.notebook;
    if (!notebook) {
        return;
    }
    ipcRenderer.send("notebook-editor-event", {
        editorWindowId: editorWindowId,
        eventName: "onModified",
        payload: {
            isModified: notebook.modified,
        },
    });
}

notebookEditorViewModel.onEditorReady.attach(onEditorReady);
notebookEditorViewModel.onOpenNotebookChanged.attach(onNotebookSet);
notebookEditorViewModel.onNotebookRendered.attach(onNotebookRendered);

spy(event => {
    console.log(`@@ mobx event: ${event.type}`);
    console.log(event);
});

reaction(() => notebookEditorViewModel.notebook?.isModified, onNotebookModified);

class App extends React.Component {

    render() {
        return (
            <NotebookEditor model={notebookEditorViewModel} />
        );
    }
}

ReactDOM.render(<App />, document.getElementById("root"));

const commander = instantiateSingleton<ICommander>(ICommanderId);

ipcRenderer.on("invoke-command", (event, args) => {
    handleAsyncErrors(async () => {
        await commander.invokeNamedCommand(args.commandId, undefined, args.params);
    });
});
