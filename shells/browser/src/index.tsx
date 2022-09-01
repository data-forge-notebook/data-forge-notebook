import * as React from "react";
import * as ReactDOM from "react-dom";
import { instantiateSingleton, registerSingleton } from "@codecapers/fusion";
import { commands, EvaluationEventHandler, expandAccelerator, humanizeAccelerator, ICommand, ICommander, ICommanderId, IConfirmationDialogId, IEvaluatorId, INotebookRepositoryId, IPlatform, IPlatformId, NotebookEditor, NotebookEditorViewModel, NotebookViewModel } from "notebook-editor";
import { testNotebook } from "./test-notebook";
import { EventSource, ILogId, ConsoleLog, handleAsyncErrors } from "utils";
const hotkeys = require("hotkeys-js").default;

import "./services/platform";

registerSingleton(INotebookRepositoryId, {
    // Mock repository for now.
});

registerSingleton(IConfirmationDialogId, {
    // Mock confirmation dialog service.
});

registerSingleton(ILogId, new ConsoleLog());

const mockId: any = {};
const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, "v16", testNotebook);
const notebookEditorViewModel = new NotebookEditorViewModel(notebookViewModel);

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

            <NotebookEditor model={notebookEditorViewModel} />

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
    console.log(`${command.getId()} = ${accelerator}`);

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
