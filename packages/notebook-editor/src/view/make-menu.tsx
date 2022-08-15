import { IconName, MenuItem, Position, Tooltip } from '@blueprintjs/core';
import * as React from 'react';
import { asyncHandler } from 'utils';
import { IActionContextInitializer } from '../services/action';
import { commandTable, formatTooltip } from '../services/command';
import { ICommander } from '../services/commander';

export const MENU_TOOLTIP_DELAY = 1000;

export enum ButtonSize {
    Small = "small",
    Large = "large",
}

//
// Format the text for a toolbar menu item.
//
function formatToolbarMenuText(text: string): string {
    return text.replace("&", "");
}

//
// Make a menu item for a command id.
//
export function makeMenuItem(
        commander: ICommander, 
        commandId: string, 
        contextInitializer?: IActionContextInitializer,
        state?: string
    ): JSX.Element | undefined {
    const command = commandTable[commandId];
    if (!command) {
        //TODO:
        // throw new Error("Failed to find command " + commandId);
        console.error("Failed to find command " + commandId);
        return undefined;
    }
    const commandDef = command.getDef();
    let iconName: string;
    if (state) {
        if (!commandDef.stateIcon) {
            throw new Error("Command " + commandId + " must have an icon to be added to the toolbar!");
        }
        iconName = commandDef.stateIcon[state];
    }
    else {
        if (!commandDef.icon) {
            throw new Error("Command " + commandId + " must have an icon to be added to the toolbar!");
        }
        iconName = commandDef.icon!;
    }
    
    let text = formatToolbarMenuText(commandDef.label);
    if (commandDef.accelerator) {
        text += " (" + commandDef.accelerator + ")";
    }

    return (
        <Tooltip
            position={Position.RIGHT}    
            content={formatTooltip(commandDef, state)}
            hoverOpenDelay={MENU_TOOLTIP_DELAY}
            usePortal={false}
            >
            <MenuItem
                icon={iconName as IconName}
                text={text}
                onClick={asyncHandler(null, async (event: React.SyntheticEvent) => {
                    await commander.invokeNamedCommand(commandId, contextInitializer);
                })}
                />
        </Tooltip>
    );
}