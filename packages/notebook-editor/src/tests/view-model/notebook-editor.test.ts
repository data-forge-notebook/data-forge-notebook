import { disableInjector } from "@codecapers/fusion";
import { EventSource, BasicEventHandler } from "utils";
import { INotebookStorageId } from "storage";
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
            error: () => {},
        };
        notebookEditor.log = mockLog;

        const mockNotebookId: any = { 
            a: "notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
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
            installNotebook: () => {},
            stopEvaluation: () => {},
            onEvaluationEvent: new EventSource<BasicEventHandler>(),
        };
        notebookEditor.evaluator = mockEvaluator;

        const mockCommander: any = {
            setNotebookEditor: () => {},
        };
        notebookEditor.commander = mockCommander;

        const mockRecentFiles: any = {
            addRecentFile: () => {},
        };
        notebookEditor.recentFiles = mockRecentFiles;

        const mockZoom: any = {
            init: () => {},
        };
        notebookEditor.zoom = mockZoom;

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

        expect(notebookEditor.notebook).toBeUndefined();
    });

    test("can create a new notebook", async () => {

        const { notebookEditor, notebook, mockNotebookId } = await createNotebookEditorWithNotebook();

        expect(notebook).toBeDefined();
        expect(notebookEditor.notebook).toBe(notebook);
        expect(notebook.storageId).toBe(mockNotebookId);
    });

    test("creating a new notebook over a modified notebook prompts the user to save", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();
        
        notebook.setModified(true);

        notebookEditor.promptSave = jest.fn(async () => true);

        const newNotebook = await notebookEditor.newNotebook("javascript");
        expect(newNotebook).toBeDefined();

        expect(await notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can prompt save and user can choose to abort", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();
        
        notebook.setModified(true);

        // User cancels creation of the new notebook.
        mockConfirmationDialog.show = async () => SaveChoice.Cancel;

        expect(await notebookEditor.promptSave("A message")).toBe(false);
    });

    test("can prompt save and user can choose to save", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();
        
        notebook.setModified(true);

        notebookEditor.saveNotebook = jest.fn();

        // User chooses to save the notebook.
        mockConfirmationDialog.show = async () => SaveChoice.Save;

        expect(await notebookEditor.promptSave("A message")).toBe(true);
        expect(notebookEditor.saveNotebook).toHaveBeenCalledTimes(1);
    });

    test("can prompt save and user can choose not to save", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();
        
        notebook.setModified(true);

        notebookEditor.saveNotebook = jest.fn();

        // User chooses to save the notebook.
        mockConfirmationDialog.show = async () => SaveChoice.DontSave;

        expect(await notebookEditor.promptSave("A message")).toBe(true);
        expect(notebookEditor.saveNotebook).not.toHaveBeenCalled();
    });

    test("user can open a notebook via the open file dialog", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditor();

        let notebookWasLoaded = false;

        const notebookToOpenId: any = { 
            a: "another notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
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
        expect(notebookEditor.notebook).toBe(notebook);
        expect(notebook!.storageId).toBe(notebookToOpenId);
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

        const notebookToOpenId: any = { 
            a: "another notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
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
        expect(notebookEditor.notebook).toBe(notebook);
        expect(notebook?.storageId).toBe(notebookToOpenId);
        expect(notebookWasLoaded).toBe(true);
    });

    test("opening a specific notebook prompts the user to save the current notebook", async () => {

        const { notebookEditor, notebook, mockConfirmationDialog } = await createNotebookEditorWithNotebook();

        notebookEditor.promptSave = jest.fn(async () => true);

        const notebookToOpenId: any = { 
            a: "another notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
        await notebookEditor.openSpecificNotebook(notebookToOpenId);

        expect(notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can save a previously saved notebook", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();


        notebook.save = jest.fn();

        //
        // TODO: Forcing these vars is a bit of a hack. There must be a better way to test this.
        //
        (notebook as any).unsaved = false;
        (notebook as any).readOnly = false;
        
        await notebookEditor.saveNotebook();

        expect(notebook.save).toHaveBeenCalledTimes(1);
    });

    test("save defaults to 'save as' for an unsaved notebook", async () => {

        const { notebookEditor, notebook } = await createNotebookEditorWithNotebook();

        // Force the code path that defaults to "save as".
        notebook.setModified(true);

        notebookEditor.saveNotebookAs = jest.fn();

        await notebookEditor.saveNotebook();

        expect(notebookEditor.saveNotebookAs).toHaveBeenCalledTimes(1);
    });

    test("can save a notebook as a new file", async () => {

        const { notebookEditor, notebook, mockRepository } = await createNotebookEditorWithNotebook();

        const notebookToSaveId: any = { 
            a: "another notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
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

    test("constructing the view model with a notebook clears the undo stack", () => {

        const mockNotebook: any = {
            storageId: {
                getContainingPath: () => "/a/path",
            },
        };

        const { notebookEditor, mockUndoRedo } = createNotebookEditor(mockNotebook);

        notebookEditor.mount();

        expect(mockUndoRedo.clearStack).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.clearStack).toHaveBeenCalledWith(notebookEditor.notebook);
    });

    test("opening a new notebook clears the undo stack", async () => {

        const { notebook, mockUndoRedo } = await createNotebookEditorWithNotebook();

        expect(mockUndoRedo.clearStack).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.clearStack).toHaveBeenCalledWith(notebook);
    });

});
