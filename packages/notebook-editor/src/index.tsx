import * as React from "react";
import { NotebookUI } from "./view/notebook/notebook";
import { NotebookViewModel } from "./view-model/notebook";
import { testNotebook } from "./test-notebook";
import "./services/impl/plugin-repository";
import { registerSingleton } from "@codecapers/fusion";
import { INotebookRepositoryId } from "./services/notebook-repository";

registerSingleton(INotebookRepositoryId, {

});

const mockId: any = {};
const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, "v16", testNotebook);

export function NotebookEditor() {
    return (
        <div>
            <NotebookUI
                model={notebookViewModel}
                />
        </div>
    );
}
