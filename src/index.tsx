import * as React from "react";
import { NotebookUI } from "./view/notebook/notebook";
import { NotebookViewModel } from "./view-model/notebook";
import { testNotebook } from "./test-notebook";
import "./testbed/services/plugin-repository";

const notebookViewModel = NotebookViewModel.deserialize("test.notebook", false, false, "/a/path", "v16", testNotebook);

export function NotebookEditor() {
    return (
        <div>
            <NotebookUI
                model={notebookViewModel}
                />
        </div>
    );
}
