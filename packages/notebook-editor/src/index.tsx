import * as React from "react";
import { NotebookUI } from "./view/notebook/notebook";
import { NotebookViewModel } from "./view-model/notebook";
import { testNotebook } from "./test-notebook";
export { INotebookRepositoryId, INotebookStorageId, INotebookRepository } from "./services/notebook-repository";

import "./services/impl/plugin-repository";

export function NotebookEditor() {
    const mockId: any = {};
    const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, "v16", testNotebook);
    return (
        <div>
            <NotebookUI
                model={notebookViewModel}
                />
        </div>
    );
}
