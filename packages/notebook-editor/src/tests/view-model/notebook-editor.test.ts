import { disableInjector } from "@codecapers/fusion";
import { EventSource, BasicEventHandler } from "utils";
import { INotebookStorageId } from "../../services/notebook-repository";
import { NotebookEditorViewModel, SaveChoice } from "../../view-model/notebook-editor";
import { expectEventRaised } from "../lib/utils";

describe('view-model / notebook-editor', () => {

    beforeAll(() => {
        disableInjector();
    });

    function createNotebookEditor(mockNotebook?: any) {
        const notebookEditor = new NotebookEditorViewModel(mockNotebook);

        const mockLog: any = {
            info: () => {},
        };
        notebookEditor.log = mockLog;

        const mockNotebookId: any = { a: "notebook id", displayName: () => "/a/path" };
        const mockRepository: any = {
            makeUntitledNotebookId: () => mockNotebookId,
            readNotebook: async (notebookId: INotebookStorageId) => {
                return {
                    data: {
                        cells: [],
                    },
                    readOnly: false,
                };
            },
        };
        notebookEditor.notebookRepository = mockRepository;

        const mockIdGenerator: any = {
            genId: () => "1234",
        };
        notebookEditor.idGenerator = mockIdGenerator;

        const mockConfirmationDialog: any = {};
        notebookEditor.confirmationDialog = mockConfirmationDialog;

        const mockUndoRedo: any = {
            clearStack: jest.fn(),
        };
        notebookEditor.undoRedo = mockUndoRedo;

        const mockEvaluator: any = {
            onEvaluationEvent: new EventSource<BasicEventHandler>(),
        };
        notebookEditor.evaluator = mockEvaluator;

        const mockCommander: any = {
            setNotebookEditor: () => {},
        };
        notebookEditor.commander = mockCommander;

        return { 
            notebookEditor, 
            mockRepository,
            mockIdGenerator,
            mockConfirmationDialog,
            mockNotebookId,
            mockUndoRedo,
        };
    }

    async function createNotebookEditorWithNotebook() {

        const result = createNotebookEditor();

        const notebook = (await result.notebookEditor.newNotebook("javascript"))!;

        return {
            ...result,
            notebook,
        };
    }

    test("starts with no notebook", ()  => {

        const { notebookEditor } = createNotebookEditor();

        expect(notebookEditor.isNotebookOpen()).toBe(false);
        expect(() => notebookEditor.getOpenNotebook()).toThrow();
    });

    test("can create a new notebook", async () => {

        const { notebookEditor, notebook, mockNotebookId } = await createNotebookEditorWithNotebook();

        expect(notebook).toBeDefined();
        expect(notebookEditor.isNotebookOpen()).toBe(true);
        expect(notebookEditor.getOpenNotebook()).toBe(notebook);
        expect(notebook?.getStorageId()).toBe(mockNotebookId);
    });

    test("creating a new notebook over a modified notebook prompts the user to save", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();
        await notebook!.notifyModified(); // Make the current notebook modified.

        notebookEditor.promptSave = jest.fn(async () => true);

        const newNotebook = await notebookEditor.newNotebook("javascript");
        expect(newNotebook).toBeDefined();

        expect(await notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can prompt save and user can choose to abort", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();
        await notebook!.notifyModified(); // Make the current notebook modified.

        // User cancels creation of the new notebook.
        mockConfirmationDialog.show = async () => SaveChoice.Cancel;

        expect(await notebookEditor.promptSave("A message")).toBe(false);
    });

    test("can prompt save and user can choose to save", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();
        await notebook!.notifyModified(); // Make the current notebook modified.

        notebookEditor.saveNotebook = jest.fn();

        // User chooses to save the notebook.
        mockConfirmationDialog.show = async () => SaveChoice.Save;

        expect(await notebookEditor.promptSave("A message")).toBe(true);
        expect(notebookEditor.saveNotebook).toHaveBeenCalledTimes(1);
    });

    test("can prompt save and user can choose not to save", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();
        await notebook!.notifyModified(); // Make the current notebook modified.

        notebookEditor.saveNotebook = jest.fn();

        // User chooses to save the notebook.
        mockConfirmationDialog.show = async () => SaveChoice.DontSave;

        expect(await notebookEditor.promptSave("A message")).toBe(true);
        expect(notebookEditor.saveNotebook).not.toHaveBeenCalled();
    });

    test("user can open a notebook via the open file dialog", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditor();

        let notebookWasLoaded = false;

        const notebookToOpenId: any = { a: "another notebook id", displayName: () => "/a/path" };
        mockRepository.showNotebookOpenDialog = async () => notebookToOpenId;
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            expect(notebookId).toBe(notebookToOpenId);

            notebookWasLoaded = true;

            return {
                data: {
                    cells: [],
                },
                readOnly: false,
            };
        };

        const notebook = await notebookEditor.openNotebook();

        expect(notebook).toBeDefined();
        expect(notebookEditor.isNotebookOpen()).toBe(true);
        expect(notebookEditor.getOpenNotebook()).toBe(notebook);
        expect(notebook?.getStorageId()).toBe(notebookToOpenId);
        expect(notebookWasLoaded).toBe(true);
    });

    test("user can cancel the open file dialog", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditor();

        mockRepository.showNotebookOpenDialog = async () => undefined;

        const notebook = await notebookEditor.openNotebook();

        expect(notebook).toBeUndefined();
    });

    test("opening a file prompts the user to save the current file", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditor();

        mockRepository.showNotebookOpenDialog = async () => undefined;

        notebookEditor.promptSave = jest.fn(async () => true);

        await notebookEditor.openNotebook();

        expect(notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can open a specific notebook", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditor();

        let notebookWasLoaded = false;

        const notebookToOpenId: any = { a: "another notebook id", displayName: () => "/a/path" };
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            expect(notebookId).toBe(notebookToOpenId);

            notebookWasLoaded = true;

            return {
                data: {
                    cells: [],
                },
                readOnly: false,
            };
        };

        const notebook = await notebookEditor.openSpecificNotebook(notebookToOpenId);

        expect(notebook).toBeDefined();
        expect(notebookEditor.isNotebookOpen()).toBe(true);
        expect(notebookEditor.getOpenNotebook()).toBe(notebook);
        expect(notebook?.getStorageId()).toBe(notebookToOpenId);
        expect(notebookWasLoaded).toBe(true);
    });

    test("opening a specific notebook prompts the user to save the current notebook", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();

        notebookEditor.promptSave = jest.fn(async () => true);

        const notebookToOpenId: any = { a: "another notebook id", displayName: () => "/a/path" };
        await notebookEditor.openSpecificNotebook(notebookToOpenId);

        expect(notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can save a previously saved notebook", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();

        // Force the code path that saves the "already saved" notebook.
        notebook.isUnsaved = () => false;

        notebook.save = jest.fn();

        await notebookEditor.saveNotebook();

        expect(notebook.save).toHaveBeenCalledTimes(1);
    });

    test("save defaults to 'save as' for an unsaved notebook", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();

        // Force the code path that defaults to "save as".
        notebook.isUnsaved = () => true;

        notebookEditor.saveNotebookAs = jest.fn();

        await notebookEditor.saveNotebook();

        expect(notebookEditor.saveNotebookAs).toHaveBeenCalledTimes(1);
    });

    test("can save a notebook as a new file", async () => {

        const { notebookEditor, notebook, mockRepository } = await createNotebookEditorWithNotebook();

        const notebookToSaveId: any = { a: "another notebook id", displayName: () => "/a/path" };
        mockRepository.showNotebookSaveAsDialog = async () => notebookToSaveId;

        notebook.saveAs = jest.fn();

        await notebookEditor.saveNotebookAs();

        expect(notebook.saveAs).toHaveBeenCalledTimes(1);
        expect(notebook.saveAs).toHaveBeenCalledWith(notebookToSaveId);
    });

    test("can reload notebook", async () => {

        const { notebookEditor, mockRepository, mockNotebookId } = await createNotebookEditorWithNotebook();

        let notebookWasLoaded = false;
        
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            expect(notebookId).toBe(mockNotebookId);

            notebookWasLoaded = true;

            return {
                data: {
                    cells: [],
                },
                readOnly: false,
            };
        };

        await notebookEditor.reloadNotebook();

        expect(notebookWasLoaded).toBe(true);
    });


    test("reloading a notebook prompts the user to save the current notebook", async () => {

        const { notebookEditor } = await createNotebookEditorWithNotebook();

        notebookEditor.promptSave = jest.fn(async () => true);

        await notebookEditor.reloadNotebook();

        expect(notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can raise onModified", async () => {

        const { notebookEditor } = createNotebookEditor();
        
        await expectEventRaised(notebookEditor, "onModified", async () => {
            await notebookEditor.notifyModified();
        });
    });

    test("onModified is bubbled up from the notebook", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();

        await expectEventRaised(notebookEditor, "onModified", async () => {
            await notebook.notifyModified();
        });
    });

    test("constructing the view model with a notebook clears the undo stack", () => {

        const mockNotebook: any = {
            onModified: new EventSource<BasicEventHandler>(),
        };

        const { notebookEditor, mockUndoRedo } = createNotebookEditor(mockNotebook);

        notebookEditor.mount();

        expect(mockUndoRedo.clearStack).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.clearStack).toHaveBeenCalledWith(mockNotebook);
    });

    test("opening a new notebook clears the undo stack", async () => {

        const { notebook, mockUndoRedo } = await createNotebookEditorWithNotebook();

        expect(mockUndoRedo.clearStack).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.clearStack).toHaveBeenCalledWith(notebook);
    });

});
