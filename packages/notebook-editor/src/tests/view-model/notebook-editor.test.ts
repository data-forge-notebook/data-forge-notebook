import { disableInjector } from "@codecapers/fusion";
import { EventSource, BasicEventHandler } from "utils";
import { NotebookEditorViewModel, SaveChoice } from "../../view-model/notebook-editor";
import { INotebookStorageId } from "../../services/notebook-repository";

describe('view-model / notebook-editor', () => {

    beforeAll(() => {
        disableInjector();
    });

    function createNotebookEditor() {
        const notebookEditor = new NotebookEditorViewModel();

        const mockLog: any = {
            info: () => {},
            error: () => {},
        };
        notebookEditor.log = mockLog;

        const mockUntitledNotebookId: any = { 
            a: "untitled notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
        const mockRepository: any = {
            makeUntitledNotebookId: () => mockUntitledNotebookId,
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
            mockUntitledNotebookId,
            mockUndoRedo,
        };
    }

    function createNotebookEditorWithNotebook(notebookFields?: any) {

        const mockNotebookId: any = { 
            a: "notebook id 2", 
            displayName: () => "/another/path",
            getContainingPath: () => "/another/path",
        };

        const mockNotebook: any = {
            serializeForEval() { 
                return {};
            },
            storageId: mockNotebookId,
            save: jest.fn(),
            saveAs: jest.fn(),
            unsaved: notebookFields?.unsaved || false,
            readOnly: notebookFields?.readNotebook || false,
            isModified: notebookFields?.isModified || false,
        };

        const result = createNotebookEditor();

        result.notebookEditor.notebook = mockNotebook;

        return {
            ...result,
            mockNotebook,
            mockNotebookId,
        };
    }

    test("starts with no notebook", ()  => {

        const { notebookEditor } = createNotebookEditor();

        expect(notebookEditor.notebook).toBeUndefined();
    });

    test("can create a new notebook", async () => {

        const { notebookEditor } = createNotebookEditor();

        const notebook = await notebookEditor.newNotebook();

        expect(notebookEditor.notebook).toBeDefined();
        expect(notebookEditor.notebook).toBe(notebook);
    });

    test("creating a new notebook over a modified notebook prompts the user to save", async () => {

        const { notebookEditor, mockNotebook } = createNotebookEditorWithNotebook();
        
        mockNotebook.isModified = true;

        notebookEditor.promptSave = jest.fn(async () => true);

        const newNotebook = await notebookEditor.newNotebook();
        expect(newNotebook).toBeDefined();

        expect(await notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can prompt save and user can choose to abort", async () => {

        const { notebookEditor, mockNotebook, mockConfirmationDialog } = createNotebookEditorWithNotebook({ isModified: true });

        // User cancels creation of the new notebook.
        mockConfirmationDialog.show = async () => SaveChoice.Cancel;

        expect(await notebookEditor.promptSave("A message")).toBe(false);
    });

    test("can prompt save and user can choose to save", async () => {

        const { notebookEditor, mockNotebook, mockConfirmationDialog } = createNotebookEditorWithNotebook({ isModified: true });
        
        notebookEditor.saveNotebook = jest.fn();

        // User chooses to save the notebook.
        mockConfirmationDialog.show = async () => SaveChoice.Save;

        expect(await notebookEditor.promptSave("A message")).toBe(true);
        expect(notebookEditor.saveNotebook).toHaveBeenCalledTimes(1);
    });

    test("can prompt save and user can choose not to save", async () => {

        const { notebookEditor, mockNotebook, mockConfirmationDialog } = createNotebookEditorWithNotebook({ isModified: true });
        
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

        const mockNotebook: any = {
            serializeForEval() {
                return {};
            },
            storageId: notebookToOpenId,
        };
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            expect(notebookId).toBe(notebookToOpenId);

            notebookWasLoaded = true;

            return mockNotebook;
        };

        const notebook = await notebookEditor.openNotebook();

        expect(notebook).toBeDefined();
        expect(notebookEditor.notebook).toBe(notebook);
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

        const mockNotebook: any = {
            serializeForEval() {
                return {};
            },
        };
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            return mockNotebook;
        };

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
        const mockNotebook: any = {
            serializeForEval() {
                return {};
            },
            storageId: notebookToOpenId,
        };
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            expect(notebookId).toBe(notebookToOpenId);

            notebookWasLoaded = true;

            return mockNotebook;
        };

        const notebook = await notebookEditor.openSpecificNotebook(notebookToOpenId);

        expect(notebook).toBeDefined();
        expect(notebookEditor.notebook).toBe(notebook);
        expect(notebookWasLoaded).toBe(true);
    });

    test("opening a specific notebook prompts the user to save the current notebook", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditorWithNotebook();

        notebookEditor.promptSave = jest.fn(async () => true);

        const mockNotebook: any = {
            serializeForEval() {
                return {};
            },
            storageId: {
                getContainingPath: () => "/a/path",
            },
        };
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            return mockNotebook;
        };

        const notebookToOpenId: any = { 
            a: "another notebook id", 
            displayName: () => "/a/path",
            getContainingPath: () => "/a/path",
        };
        await notebookEditor.openSpecificNotebook(notebookToOpenId);

        expect(notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("can save a previously saved notebook", async () => {

        const { notebookEditor, mockNotebook } = createNotebookEditorWithNotebook();

        await notebookEditor.saveNotebook();

        expect(mockNotebook.save).toHaveBeenCalledTimes(1);
    });

    test("save defaults to 'save as' for an unsaved notebook", async () => {

        const { notebookEditor } = createNotebookEditorWithNotebook({
            unsaved: true, // Force the code path that defaults to "save as".
            readOnly: true,
        });

        notebookEditor.saveNotebookAs = jest.fn();

        await notebookEditor.saveNotebook();

        expect(notebookEditor.saveNotebookAs).toHaveBeenCalledTimes(1);
    });

    test("can save a notebook as", async () => {

        const { notebookEditor, mockNotebook, mockRepository } = createNotebookEditorWithNotebook();

        const notebookToSaveId: any = { 
            a: "save as notebook id", 
            displayName: () => "/a/different/path",
            getContainingPath: () => "/a/different/path",
        };
        mockRepository.showNotebookSaveAsDialog = async () => notebookToSaveId;

        await notebookEditor.saveNotebookAs();

        expect(mockNotebook.saveAs).toHaveBeenCalledTimes(1);
        expect(mockNotebook.saveAs).toHaveBeenCalledWith(notebookToSaveId);
    });

    test("can reload notebook", async () => {

        const { notebookEditor, mockRepository, mockNotebookId } = createNotebookEditorWithNotebook();

        let notebookWasLoaded = false;

        const mockNotebookReloaded: any = {
            serializeForEval() { 
                return {};
            },
            storageId: mockNotebookId,
        };
        
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            expect(notebookId.getContainingPath()).toEqual(mockNotebookId.getContainingPath());

            notebookWasLoaded = true;

            return mockNotebookReloaded;
        };

        await notebookEditor.reloadNotebook();

        expect(notebookWasLoaded).toBe(true);
        expect(notebookEditor.notebook).toBeDefined();
    });

    test("reloading a notebook prompts the user to save the current notebook", async () => {

        const { notebookEditor, mockRepository } = createNotebookEditorWithNotebook();

        notebookEditor.promptSave = jest.fn(async () => true);

        const mockNotebook: any = {
            serializeForEval() {
                return {};
            },
            storageId: {
                getContainingPath: () => "/a/path",
            },
        };
        mockRepository.readNotebook = async (notebookId: INotebookStorageId) => {
            return mockNotebook;
        };

        await notebookEditor.reloadNotebook();

        expect(notebookEditor.promptSave).toHaveBeenCalledTimes(1);
    });

    test("constructing the view model with a notebook clears the undo stack", () => {

        const { notebookEditor, mockUndoRedo } = createNotebookEditorWithNotebook();

        notebookEditor.mount();

        expect(mockUndoRedo.clearStack).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.clearStack).toHaveBeenCalledWith(notebookEditor.notebook);
    });

    test("opening a new notebook clears the undo stack", async () => {

        const { notebookEditor, mockUndoRedo } = createNotebookEditor();

        const notebook = await notebookEditor.newNotebook();

        expect(mockUndoRedo.clearStack).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.clearStack).toHaveBeenCalledWith(notebook);
    });

});
