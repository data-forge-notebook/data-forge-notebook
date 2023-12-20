import * as React from "react";
import * as ReactDOM from "react-dom";
import { instantiateSingleton, registerSingleton } from "@codecapers/fusion";
import { commands, jsonDeserialization, EvaluationEventHandler, expandAccelerator, humanizeAccelerator, ICommand, ICommander, ICommanderId, IConfirmationDialogId, IEvaluatorId, INotebookRepositoryId, IPlatform, IPlatformId, NotebookEditor, NotebookEditorViewModel, NotebookViewModel } from "notebook-editor";
import { testNotebook } from "./test-notebook";
import { EventSource, ILogId, ConsoleLog, handleAsyncErrors } from "utils";
const hotkeys = require("hotkeys-js").default;

import "./services/platform";
import "./services/recent-files";
import "./services/settings";
import "./services/open";
import "./services/zoom";
import "./services/clipboard";
import "./services/paths";
import { reaction, spy } from "mobx";

registerSingleton(INotebookRepositoryId, {
    // Mock repository for now.
    getExampleNotebooks() {
        return [];
    },

    idFromString(filePath: string) {
        return mockId;
    },
});

registerSingleton(IConfirmationDialogId, {
    // Mock confirmation dialog service.
});

registerSingleton(ILogId, new ConsoleLog());

const mockId: any = {
    getContainingPath() {
        return undefined; 
    },
};

// Example notebook:
const notebookViewModel = jsonDeserialization.deserializeNotebook(mockId, false, false, testNotebook);
const notebookEditorViewModel = new NotebookEditorViewModel(notebookViewModel);

// Welcome screen.
// const notebookEditorViewModel = new NotebookEditorViewModel();

spy((event: any) => {
    if (event.type === "report-end") {
        return;
    }
    // console.log(`@@ mobx event: ${event.type}`);
    // console.log(event);
    console.log(`--> ${event.type} ${event.name || ""} ${event.debugObjectName && ("/ " + event.debugObjectName) || ""} ${event.observableKind && ("/ " + event.observableKind) || ""}`);
});

reaction(() => notebookEditorViewModel.notebook?.isModified, () => {
    console.log(`Notebook was modified.`);
});

function App() {
    return (
        <NotebookEditor notebookEditor={notebookEditorViewModel} />
    );
}

ReactDOM.render(<App />, document.getElementById("root"));

const platform = instantiateSingleton<IPlatform>(IPlatformId);
const commander = instantiateSingleton<ICommander>(ICommanderId);

//
// Register the command as a hotkey in the browser.
//
function registerHotkey(command: ICommand): void {
    if (command.getAccelerator() === undefined) {
        return; // No hotkey.
    }

    const accelerator = humanizeAccelerator(command.getAccelerator(), platform);
    // console.log(`${command.getId()} = ${accelerator}`);

    hotkeys(accelerator, (event: any, handler: any) => {
        event.preventDefault() ;

        //
        // Invokes the command.
        //
        handleAsyncErrors(async () => {
            await commander.invokeNamedCommand(command.getId());
        });
    });
}

//
// Register hotkeys for commands.
//
for (const command of commands) {
    registerHotkey(command);
}
