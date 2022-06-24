export { NotebookViewModel } from "./view-model/notebook";
export { NotebookEditorViewModel } from "./view-model/notebook-editor";
export { NotebookEditor } from "./view/notebook/notebook-editor";

export { INotebookRepositoryId, INotebookStorageId, INotebookRepository } from "./services/notebook-repository";
export { IIdGenerator, IIdGeneratorId } from "./services/id-generator";
export { IConfirmationDialogId, IConfirmationDialog, IConfirmOptions } from "./services/confirmation-dialog";

import "./services/impl/plugin-repository";