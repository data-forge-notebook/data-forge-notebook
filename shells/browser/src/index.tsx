import * as React from "react";
import * as ReactDOM from "react-dom";
import { instantiateSingleton, registerSingleton } from "@codecapers/fusion";
import { commands, EvaluationEventHandler, expandAccelerator, humanizeAccelerator, ICommand, ICommander, ICommanderId, IConfirmationDialogId, IEvaluatorId, INotebookRepositoryId, IPlatform, IPlatformId, NotebookEditor, NotebookEditorViewModel, NotebookViewModel } from "notebook-editor";
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
import { reaction } from "mobx";

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
const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, testNotebook);
const notebookEditorViewModel = new NotebookEditorViewModel(notebookViewModel);

// Welcome screen.
// const notebookEditorViewModel = new NotebookEditorViewModel();

reaction(() => notebookEditorViewModel.notebook?.isModified, () => {
    console.log(`Notebook was modified.`);
});

function App() {
    return (
        <NotebookEditor model={notebookEditorViewModel} />
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
