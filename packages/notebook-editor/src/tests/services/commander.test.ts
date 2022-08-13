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
            error: () => {},
        };
        
        const commander = new Commander();
        commander.log = mockLog;

        //
        // Create a mock command.
        //
        const mockCommand: any = {
            getId: () => mockCommandId,
        };

        commands.splice(0, commands.length); // Remove all commands that might be there.
        commands.push(mockCommand);

        return { commander, mockCommand };
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

    test("can invoke global command", async () => {

        const mockContext: any = {
        };

        const mockNotebookEditor: any = {
            isNotebookOpen: () => false,
        };

        const mockAction: any = {
            invoke: jest.fn(),
        };

        const { commander, mockCommand } = createCommander();

        commander.setNotebookEditor(mockNotebookEditor);

        mockCommand.isNotebookCommand = () => false;
        mockCommand.isCellCommand = () => false;
        mockCommand.resolveAction = () => mockAction;

        await commander.invokeNamedCommand(mockCommandId, mockContext);

        expect(mockAction.invoke).toHaveBeenCalledTimes(1);
    });
});