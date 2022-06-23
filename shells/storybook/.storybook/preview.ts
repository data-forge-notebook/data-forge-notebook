import "../node_modules/normalize.css/normalize.css";
import "../src/testbed/styles/base.css";
import "../node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css";
import "../node_modules/@blueprintjs/core/lib/css/blueprint.css";
import "../src/testbed/styles/index.css";

import { registerSingleton } from "@codecapers/fusion";
import { INotebookRepositoryId, IConfirmationDialogId } from "notebook-editor";

import "notebook-editor/ts-build/services/impl/plugin-repository";

registerSingleton(INotebookRepositoryId, {
    // Mock repository for now.
});

registerSingleton(IConfirmationDialogId, {
    // Mock confirmation dialog service.
});

