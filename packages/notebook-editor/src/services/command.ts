import { InjectableClass } from "@codecapers/fusion";
import { IAction } from "./action";
import { IPlatform } from "./platform";

//
// A keyboard acceleator can be defined a string or as a function that returns a string (based on the platform).
//
type AcceleratorT = string | ((platform: IPlatform) => string) | undefined;

//
// Defines a command.
//
export interface ICommandDef {
    id: string;
    desc: string;
    stateDesc?: any;
    notebookCommand?: boolean;
    cellCommand?: boolean;
    label: string;
    accelerator?: AcceleratorT;
    icon?: string;
    stateIcon?: any;
};

type Instantiable = {
    new(...args: any[]): any
};

//
// A TypeScript decorator that declares a new command.
//
export function DeclareCommand(commandDef: ICommandDef): Function {
    
    return (origConstructor: Instantiable): Function => {
        const actionConstructor = InjectableClass()(origConstructor);
        const command = new Command(commandDef, actionConstructor)
        if (commandTable[commandDef.id] !== undefined) {
            throw new Error(`Command ${commandDef.id} has already been defined!`);
        }
        commandTable[commandDef.id] = command;
        commands.push(command);
        return actionConstructor;
    }
}

//
// A look up table for all commands.
//
export const commandTable: { [commandId: string]: ICommand; } = {};

//
// A list of all commands.
//
export const commands: ICommand[] = []; 

//
// Interface to a command.
//
export interface ICommand {
    //
    // Gets the command definition.
    //
    getDef(): ICommandDef;

    //
    // Get the ID of the command.
    //
    getId(): string;

    //
    // Get the label of the command.
    //
    getLabel(): string;

    //
    // Get the description of the command.
    //
    getDesc(): string;

    //
    // Returns true if the command requires a notebook.
    //
    isNotebookCommand(): boolean;

    //
    // Returns true if the command is executed on a particular cell.
    //
    isCellCommand(): boolean;

    //
    // Compute the name of the comand displayed to the user.
    //
    getDisplayName(): string;

    //
    // Create an instance of the action.
    //
    resolveAction(): IAction;

    //
    // Gets the keyboard accelerator for the command.
    //
    getAccelerator(): AcceleratorT;
}

//
// Implements a command.
//
export class Command implements ICommand {

    //
    // The command definition.
    //
    private def: ICommandDef;
    
    //
    // Factory for an action.
    //
    private actionConstructor: { new(): IAction }

    constructor(commandDef: ICommandDef, actionConstructor: { new(): IAction }) {
        this.def = commandDef;
        this.actionConstructor = actionConstructor;
    }

    //
    // Gets the command definition.
    //
    getDef(): ICommandDef { //todo: should wrap this completely.
        return this.def;
    }

    //
    // Get the ID of the command.
    //
    getId(): string {
        return this.def.id;
    }

    //
    // Get the label of the command.
    //
    getLabel(): string {
        return this.def.label;
    }

    //
    // Get the description of the command.
    //
    getDesc(): string {
        return this.def.desc;
    }

    //
    // Returns true if the command requires a notebook.
    //
    isNotebookCommand(): boolean {
        return this.def.notebookCommand || false;
    }

    //
    // Returns true if the command is executed on a particular cell.
    //
    isCellCommand(): boolean {
        return this.def.cellCommand || false;
    }
    
    //
    // Compute the name of the comand displayed to the user.
    //
    getDisplayName(): string {
        let displayName = this.def.label.replace(/&/g, "") + ": " + this.def.desc;
        if (this.def.accelerator) {
            displayName += " (" + this.def.accelerator + ")";
        }
        return displayName;
    }
   
    //
    // Create an instance of the action.
    //
    resolveAction(): IAction {
        return new this.actionConstructor();
    }

    //
    // Gets the keyboard accelerator for the command.
    //
    getAccelerator(): AcceleratorT {
        return this.def.accelerator;
    }    
}

//
// Format a tooltip for a command for display to the user.
//
export function formatTooltip(commandDef: ICommandDef, state?: string) {
    let tooltip = state 
        ? commandDef.stateDesc[state]
        : commandDef.desc;
    if (commandDef.accelerator) {
        tooltip += " (" + commandDef.accelerator + ")";
    }
    return tooltip;
}
