
//
// Interface for invoking commands.
//

import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { ILog, ILogId } from "utils";
import { INotebookEditorViewModel } from "../view-model/notebook-editor";
import { ActionContext, IActionContextInitializer } from "./action";
import { commands, ICommand } from "./command";
import { INotification, INotificationId } from "./notification";
import { IUndoRedo, IUndoRedoId } from "./undoredo";

export const ICommanderId = "ICommander";

export interface ICommander {
    
    //
    // Set the notebook editor we are running commands against.
    //
    setNotebookEditor(notebookEditor: INotebookEditorViewModel): void;

    //
    // Get the full list of commands.
    //
    getCommands(): ICommand[];
    
    //
    // Find a command by id.
    //
    findCommand(commandId: string): ICommand;

    //
    // Invoke a command by id on a particular cell.
    //    
    invokeNamedCommand(commandId: string, contextInitializer?: IActionContextInitializer, params?: any): Promise<void>;

    //
    // Invoke a command that operates on a cell.
    //
    invokeCommand(command: ICommand, contextInitializer?: IActionContextInitializer, params?: any): Promise<void>;
}

@InjectableSingleton(ICommanderId)
export class Commander implements ICommander {
    
    @InjectProperty(ILogId)
    log!: ILog;
    
    @InjectProperty(IUndoRedoId)
    undoRedo!: IUndoRedo;

    @InjectProperty(INotificationId)
    notification!: INotification;

    // 
    // The notebook editor we are running commands against.
    //
    private notebookEditor!: INotebookEditorViewModel;

    //
    // Set the application we are running commands against.
    //
    setNotebookEditor(notebookEditor: INotebookEditorViewModel): void {
    	this.notebookEditor = notebookEditor;
    }

    //
    // Get the full list of commands.
    //
    getCommands(): ICommand[] {
        return commands;
    }

    //
    // Find a command by id.
    //
    findCommand(commandId: string): ICommand {
        const matching = commands.filter(command => command.getId() === commandId);
        if (matching.length !== 1) {
            throw new Error("Searched for command " + commandId + ", expected only 1 match but found " + matching.length + ".");
        }

        return matching[0];
    }

    //
    // Invoke a command by id on a particular cell.
    //    
    async invokeNamedCommand(commandId: string, contextInitializer?: IActionContextInitializer, params?: any): Promise<void> {
        const command = this.findCommand(commandId);
        await this.invokeCommand(command, contextInitializer, params);
    } 

    //
    // Invoke a command that operates on a cell.
    //
    async invokeCommand(command: ICommand, contextInitializer?: IActionContextInitializer, params?: any): Promise<void> {
        try {
            // this.log.info("Resolving command with action " + command.getActionName());
    
            // this.log.info("Invoking command " + command.getId());

            const context = new ActionContext(this.notebookEditor, contextInitializer || {}, params);
            if (command.isCellCommand()) {
                if (context.getNotebookEditor().isBlocked) {
                    this.log.info("User attempted to execute command " + command.getId() + ", but notebook is still loading..");
                    this.notification.warn("Can't invoke " + command.getId() + " whlie notebook is loading, please wait a moment.");
                    return;
                }

                if (!context.hasCell()) {
                    this.log.info("User attempted to execute cell command " + command.getId() + ", but no cell is currently selected, notebook not loaded, or not finished loading..");
                    this.notification.warn("Invoking " + command.getId() + " requires you to select a cell.");
                    return;
                }
            }

            if (command.isNotebookCommand()) {
                if (context.getNotebookEditor().isBlocked) {
                    this.log.info("User attempted to execute command " + command.getId() + ", but notebook is still loading..");
                    this.notification.warn("Can't invoke " + command.getId() + " whlie notebook is loading, please wait a moment.");
                    return;
                }

                if (!context.hasNotebook()) {
                    this.log.info("User attempted to execute notebook command " + command.getId() + ", but notebook is not open.");
                    this.notification.warn("Invoking " + command.getId() + " requires a notebook.");
                    return;
                }
            }

            if (context.hasNotebook()) {
                //
                // Flush changes before running any actions against the notebook.
                //
                await context.getNotebook().flushChanges();
            }

            const action = command.resolveAction();
            const changes = await action.invoke(context);

            if (changes) {
                if (Array.isArray(changes)) {
                    await this.undoRedo.applyChanges(changes);
                }
                else {
                    //this.log.info(`Command ${command.getId()} created a change.`);
                    await this.undoRedo.applyChanges([ changes ]);
                    //this.log.info(`Change completed without error.`);
                }
            }
            else {
                //this.log.info(`Command ${command.getId()} completed without error.`);
            }
        }
        catch (err) {
            this.log.error(`Command ${command.getId()} failed with error, passing error up the chain.`);
            this.log.error(err && err.stack || err);

            throw err;
        }
    }
}