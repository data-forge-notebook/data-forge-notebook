import { disableInjector } from "@codecapers/fusion";
import { NotebookRepository, NotebookStorageId } from "../services/notebook-repository";
import * as path from "path";

describe("electron / notebook-repository", () => {

    beforeAll(() => {
        disableInjector();
    });

    test("can get details for untitled notebook id", () => {

        const containingPath = "a/path";
        const id = new NotebookStorageId(undefined, containingPath);
        expect(id.displayName()).toEqual("untitled");
        expect(id.getFileName()).toBeUndefined();
        expect(id.getContainingPath()).toBe(containingPath);
    });

    test("can get details for existing notebook id", () => {

        const fileName = "some-notebook.notebook";
        const containingPath = "a/path";
        const id = new NotebookStorageId(fileName, containingPath);
        expect(id.displayName()).toEqual(path.join(containingPath, fileName));
        expect(id.getFileName()).toBe(fileName);
        expect(id.getContainingPath()).toBe(containingPath);
    });

    test("can set details for notebook id", () => {

        const id = new NotebookStorageId(undefined, "previous/path");

        const fileName = "some-notebook.notebook";
        const containingPath = "a/path";
        id.setFileName(fileName);
        id.setContainingPath(containingPath);

        expect(id.displayName()).toEqual(path.join(containingPath, fileName));
        expect(id.getFileName()).toBe(fileName);
        expect(id.getContainingPath()).toBe(containingPath);
    });


    test("can write notebook", async () => {

        const fileName = "some-notebook.notebook";
        const containingPath = "some/path";
        const fullPath = path.join(containingPath, fileName);

        const mockNotebook: any = {};
        const mockId: any = {
            getFileName() {
                return fileName;
            },

            getContainingPath() {
                return containingPath;
            }
        };


        const mockFile: any = {
            writeJsonFile: jest.fn(),
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.file = mockFile;
        await notebookRepository.writeNotebook(mockNotebook, mockId);

        expect(mockFile.writeJsonFile).toBeCalledTimes(1);
        expect(mockFile.writeJsonFile).toHaveBeenCalledWith(fullPath, mockNotebook);
    });

    test("can't write untitled notebook", async () => {

        const mockNotebook: any = {};
        const mockId: any = {
            getFileName() {
                return undefined;
            },
        };

        const notebookRepository = new NotebookRepository();
        expect(() => notebookRepository.writeNotebook(mockNotebook, mockId))
            .rejects
            .toThrow();
    });

    test("can read notebook", async () => {

        const fileName = "some-notebook.notebook";
        const containingPath = "some/path";
        const fullPath = path.join(containingPath, fileName);

        const mockId: any = {
            getFileName() {
                return fileName;
            },

            getContainingPath() {
                return containingPath;
            }
        };

        const mockNotebook = { a: "notebook" };
        const mockFile: any = {
            async readJsonFile(path: string) {
                expect(path).toBe(fullPath);
                return mockNotebook;
            },
            async isReadOnly() { 
                return true;
            },
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.file = mockFile;

        const notebook = await notebookRepository.readNotebook(mockId);        
        expect(notebook).toBe(mockNotebook);
    });

    test("can't read untitled notebook", async () => {

        const fileName = "some-notebook.notebook";
        const containingPath = "some/path";
        const fullPath = path.join(containingPath, fileName);

        const mockId: any = {
            getFileName() {
                return undefined;
            },
        };

        const mockNotebook = {};

        const notebookRepository = new NotebookRepository();
        expect(() => notebookRepository.readNotebook(mockId))
            .rejects
            .toThrow();
    });

    test("can cancel open dialog", async () => {
        const mockDialogs: any = {
            async showFileOpenDialog() {
                return undefined;
            },
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.dialogs = mockDialogs;
        
        const notebookId = await notebookRepository.showNotebookOpenDialog();
        expect(notebookId).toBeUndefined();
    });

    test("can choose notebook to open", async () => {
        const fileName = "some-notebook.notebook";
        const containingPath = "a/path";
        const fullPath = path.join(containingPath, fileName);

        const mockDialogs: any = {
            async showFileOpenDialog() {
                return fullPath;
            },
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.dialogs = mockDialogs;
        
        const notebookId = await notebookRepository.showNotebookOpenDialog();

        expect(notebookId).toEqual({
            fileName: fileName,
            containingPath: containingPath,
        });
    });

    test("can cancel save as dialog", async () => {
        const mockDialogs: any = {
            async showFileSaveAsDialog() {
                return undefined;
            },
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.dialogs = mockDialogs;
        
        const mockExistingId: any = {
            getFileName() { 
                return "some-notebook.notebook";
            },
            getContainingPath() {
                return "a/path";
            },
        };
        const notebookId = await notebookRepository.showNotebookSaveAsDialog(mockExistingId);
        expect(notebookId).toBeUndefined();
    });

    test("can save as for untitled notebook", async () => {
        const fileName = "some-notebook.notebook";
        const containingPath = "a/path";
        const fullPath = path.join(containingPath, fileName);

        const mockDialogs: any = {
            async showFileSaveAsDialog() {
                return fullPath;
            },
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.dialogs = mockDialogs;
        
        const mockExistingId: any = {
            getFileName() { 
                return undefined; // Untitled.
            },
        };

        const notebookId = await notebookRepository.showNotebookSaveAsDialog(mockExistingId);

        expect(notebookId).toEqual({
            fileName: fileName,
            containingPath: containingPath,
        });
    });

    test("can save as for existing notebook", async () => {
        const fileName = "some-notebook.notebook";
        const containingPath = "a/path";
        const fullPath = path.join(containingPath, fileName);

        const mockDialogs: any = {
            async showFileSaveAsDialog() {
                return fullPath;
            },
        };

        const notebookRepository = new NotebookRepository();
        notebookRepository.dialogs = mockDialogs;
        
        const mockExistingId: any = {
            getFileName() { 
                return "existing-notebook.notebook";
            },
            getContainingPath() {
                return "some/existing/path";
            },
        };

        const notebookId = await notebookRepository.showNotebookSaveAsDialog(mockExistingId);

        expect(notebookId).toEqual({
            fileName: fileName,
            containingPath: containingPath,
        });
    });
});
