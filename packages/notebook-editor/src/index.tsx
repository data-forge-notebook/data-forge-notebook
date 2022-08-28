import React from "react";
export { NotebookViewModel } from "./view-model/notebook";
export { NotebookEditorViewModel } from "./view-model/notebook-editor";
export { NotebookEditor } from "./view/notebook/notebook-editor";

export { INotebookRepositoryId, INotebookStorageId, INotebookRepository } from "./services/notebook-repository";
export { IIdGenerator, IIdGeneratorId } from "./services/id-generator";
export { IConfirmationDialogId, IConfirmationDialog, IConfirmOptions } from "./services/confirmation-dialog";
export * from "./services/evaluator-client";
export * from "./services/commander";
export * from "./services/platform";

import "./services/impl/plugin-repository";
import "./services/impl/date-provider";
import "./services/impl/notification";
import "./services/impl/evaluator-client";

import "./actions/eval-notebook-action";
import "./actions/new-notebook-action";
import "./actions/open-notebook-action";
import "./actions/save-notebook-action";
import "./actions/save-notebook-as-action";
import "./actions/reload-notebook-action";

import "./actions/undo-action";
import "./actions/redo-action";
    