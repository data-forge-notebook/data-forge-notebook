import { disableInjector } from "@codecapers/fusion";
import { Commander } from "../../services/commander";
import { commands } from "../../services/command";

describe("commander", () => {

    const mockCommandId = "mock-command";

    beforeEach(() => {
        disableInjector();
    });
   
    function createCommander() {
        const mockLog: any = {
            error: jest.fn(),
            info: () => {},
        };

        const mockNotification: any = {
            warn: jest.fn(),
        };

        const mockUndoRedo: any = {
            applyChanges: jest.fn(),
        };
        
        const commander = new Commander();
        commander.log = mockLog;
        commander.notification = mockNotification;
        commander.undoRedo = mockUndoRedo;

        const mockNotebookEditor: any = {
            isNotebookOpen: () => false,
            isWorking: () => false,
        };

        commander.setNotebookEditor(mockNotebookEditor);

        //
        // Create a mock command.
        //
        const mockCommand: any = {
            getId: () => mockCommandId,
            isNotebookCommand: () => false,
            isCellCommand: () => false,
        };

        commands.splice(0, commands.length); // Remove all commands that might be there.
        commands.push(mockCommand);

        return { commander, mockCommand, mockNotebookEditor, mockNotification, mockLog, mockUndoRedo };
    }

    test("can get commands", () => {

        const { commander, mockCommand } = createCommander();
        const commands = commander.getCommands();
        expect(commands.length).toBe(1); // Have 1 mock command.
        expect(commands[0]).toBe(mockCommand);
    });

    test("can find command by id", () => {

        const { commander, mockCommand } = createCommander();
        const command = commander.findCommand(mockCommandId);
        expect(command).toBe(mockCommand);
    });

    test("throws when command is not found", () => {

        const { commander, mockCommand } = createCommander();
        expect(() => commander.findCommand("non-existing-command")).toThrow();
    });

    test("can invoke global command", async () => {

        const { commander, mockCommand } = createCommander();

        const mockAction: any = {
            invoke: jest.fn(),
        };
        mockCommand.resolveAction = () => mockAction;

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).toHaveBeenCalledTimes(1);
    });

    test("error from command is logged and rethrown", async () => {

        const { commander, mockCommand, mockLog } = createCommander();

        const mockAction: any = {
            invoke: () => {
                throw new Error();
            },
        };
        mockCommand.resolveAction = () => mockAction;

        await expect(() => commander.invokeNamedCommand(mockCommandId))
            .rejects
            .toThrow();

        expect(mockLog.error).toHaveBeenCalled();
    });

    test("can invoke notebook command", async () => {

        const { commander, mockCommand } = createCommander();

        mockCommand.isNotebookCommand = () => true;

        const mockAction: any = {
            invoke: jest.fn(),
        };
        mockCommand.resolveAction = () => mockAction;

        const mockNotebook: any = {
            flushChanges: jest.fn(),
        };
        const mockContext: any = {
            notebook: mockNotebook, 
        };
        await commander.invokeNamedCommand(mockCommandId, mockContext);

        expect(mockAction.invoke).toHaveBeenCalledTimes(1);
        expect(mockNotebook.flushChanges).toHaveBeenCalledTimes(1);
    });

    test("can invoke cell command", async () => {

        const { commander, mockCommand } = createCommander();

        mockCommand.isCellCommand = () => true;

        const mockAction: any = {
            invoke: jest.fn(),
        };
        mockCommand.resolveAction = () => mockAction;

        const mockCell: any = {};
        const mockContext: any = {
            cell: mockCell,
        };
        await commander.invokeNamedCommand(mockCommandId, mockContext);

        expect(mockAction.invoke).toHaveBeenCalledTimes(1);
    });

    test("can invoke command against current notebook", async () => {

        const { commander, mockCommand, mockNotebookEditor } = createCommander();

        mockCommand.isNotebookCommand = () => true;
        
        const mockAction: any = {
            invoke: jest.fn(),
        };
        mockCommand.resolveAction = () => mockAction;

        const mockNotebook: any = {
            flushChanges: jest.fn(),
        };
        mockNotebookEditor.isNotebookOpen = () => true;
        mockNotebookEditor.getOpenNotebook = () => mockNotebook;

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).toHaveBeenCalledTimes(1);
        expect(mockNotebook.flushChanges).toHaveBeenCalledTimes(1);
    });

    test("can't invoke notebook command when there is no notebook open", async () => {

        const { commander, mockCommand, mockNotebookEditor, mockNotification } = createCommander();

        mockCommand.isNotebookCommand = () => true;
        
        const mockAction: any = {
            invoke: jest.fn(),
        };
        mockCommand.resolveAction = () => mockAction;

        // Notebook is not open.
        mockNotebookEditor.isNotebookOpen = () => false;

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).not.toHaveBeenCalled();
        expect(mockNotification.warn).toHaveBeenCalledTimes(1);
    });

    test("can invoke command against selected cell", async () => {

        const { commander, mockCommand, mockNotebookEditor } = createCommander();

        const mockCell: any = {};
        const mockNotebook: any = {
            getSelectedCell: () => mockCell,
            flushChanges: jest.fn(),
        };
        Object.assign(mockNotebookEditor, {
            isNotebookOpen: () => true,
            getOpenNotebook: () => mockNotebook,
        });

        const mockAction: any = {
            invoke: jest.fn(),
        };
        Object.assign(mockCommand, {
            isCellCommand: () => true,
            resolveAction: () => mockAction,
        });

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).toHaveBeenCalledTimes(1);
        expect(mockNotebook.flushChanges).toHaveBeenCalledTimes(1);
    });

    test("can't invoke cell command when no cell is selected", async () => {

        const { commander, mockCommand, mockNotebookEditor, mockNotification } = createCommander();

        const mockNotebook: any = {
            getSelectedCell: () => undefined, // No cell selected.
            flushChanges: jest.fn(),
        };
        Object.assign(mockNotebookEditor, {
            isNotebookOpen: () => true,
            getOpenNotebook: () => mockNotebook,
        });

        const mockAction: any = {
            invoke: jest.fn(),
        };
        Object.assign(mockCommand, {
            isCellCommand: () => true,
            resolveAction: () => mockAction,
        });

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).not.toHaveBeenCalled();
        expect(mockNotebook.flushChanges).not.toHaveBeenCalled();
        expect(mockNotification.warn).toHaveBeenCalledTimes(1);
    });

    test("won't invoke cell command when working", async () => {

        const { commander, mockCommand, mockNotebookEditor, mockNotification } = createCommander();

        const mockCell: any = {};
        const mockNotebook: any = {
            getSelectedCell: () => mockCell,
            flushChanges: jest.fn(),
        };
        Object.assign(mockNotebookEditor, {
            isNotebookOpen: () => true,
            getOpenNotebook: () => mockNotebook,
            isWorking: () => true,
        });

        const mockAction: any = {
            invoke: jest.fn(),
        };
        Object.assign(mockCommand, {
            isCellCommand: () => true,
            resolveAction: () => mockAction,
        });

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).not.toHaveBeenCalled();
        expect(mockNotebook.flushChanges).not.toHaveBeenCalled();
        expect(mockNotification.warn).toHaveBeenCalledTimes(1);
    });

    test("won't invoke notebook command when working", async () => {

        const { commander, mockCommand, mockNotebookEditor, mockNotification } = createCommander();

        const mockNotebook: any = {
            flushChanges: jest.fn(),
        };
        Object.assign(mockNotebookEditor, {
            isNotebookOpen: () => true,
            getOpenNotebook: () => mockNotebook,
            isWorking: () => true,
        });

        const mockAction: any = {
            invoke: jest.fn(),
        };
        Object.assign(mockCommand, {
            isNotebookCommand: () => true,
            resolveAction: () => mockAction,
        });

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockAction.invoke).not.toHaveBeenCalled();
        expect(mockNotebook.flushChanges).not.toHaveBeenCalled();
        expect(mockNotification.warn).toHaveBeenCalledTimes(1);
    });

    test("command can return a change and have it applied", async () => {

        const { commander, mockCommand, mockUndoRedo } = createCommander();

        const mockChange: any = {};
        const mockAction: any = {
            invoke: async () => mockChange,
        };
        mockCommand.resolveAction = () => mockAction;

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockUndoRedo.applyChanges).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.applyChanges).toHaveBeenCalledWith([ mockChange ]);
    });

    test("command can return changes and have them applied", async () => {

        const { commander, mockCommand, mockUndoRedo } = createCommander();

        const mockChange1: any = {};
        const mockChange2: any = {};
        const changes = [ mockChange1, mockChange2 ];
        const mockAction: any = {
            invoke: async () => changes,
        };
        mockCommand.resolveAction = () => mockAction;

        await commander.invokeNamedCommand(mockCommandId);

        expect(mockUndoRedo.applyChanges).toHaveBeenCalledTimes(1);
        expect(mockUndoRedo.applyChanges).toHaveBeenCalledWith(changes);
    });
});