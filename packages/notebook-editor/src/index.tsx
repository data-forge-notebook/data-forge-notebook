import * as React from "react";
import { NotebookViewModel } from "./view-model/notebook";
import { testNotebook } from "./test-notebook";
import { AppViewModel } from "./view-model/notebook-editor";
import { EditorUI } from "./view/notebook/notebook-editor";

export { INotebookRepositoryId, INotebookStorageId, INotebookRepository } from "./services/notebook-repository";
export { IIdGenerator, IIdGeneratorId } from "./services/id-generator";
export { IConfirmationDialogId, IConfirmationDialog, IConfirmOptions } from "./services/confirmation-dialog";

import "./services/impl/plugin-repository";

export function NotebookEditor() {
    const mockId: any = {};
    const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, "v16", testNotebook);
    const appModel = new AppViewModel(notebookViewModel);

    return (
        <div>
            <EditorUI
                model={appModel}
                />
        </div>
    );
}

