import { Button, IconName, Intent, Position, Tooltip } from '@blueprintjs/core';
import * as React from 'react';
import { asyncHandler } from 'utils';
import { IActionContextInitializer } from '../services/action';
import { commandTable, formatTooltip } from '../services/command';
import { ICommander } from '../services/commander';

export const BUTTON_TOOLTIP_DELAY = 1200;

export enum ButtonSize {
    Small = "small",
    Large = "large",
}

export interface IButtonSetup {
    size?: ButtonSize;
    pos?: Position;
    minimal?: boolean;
    icon?: JSX.Element;
    intent?: Intent;
    onClick?: () => Promise<void>;
}

//
// Make a toolbar button for a command id.
//
export function makeButton(
        commander: ICommander, 
        commandId: string, 
        setup: IButtonSetup,
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
    let iconName: string | undefined = undefined;
    if (setup.icon === undefined) {
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
    }
    return (
        <Tooltip
            content={formatTooltip(commandDef, state)}
            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
            position={setup.pos || Position.RIGHT}
            usePortal={false}
            >
            <Button
                large={setup.size !== undefined && setup.size === ButtonSize.Large}
                small={setup.size === undefined || setup.size === ButtonSize.Small}
                minimal={setup.minimal === undefined || setup.minimal}
                onClick={asyncHandler(null, async (event: React.SyntheticEvent) => {
                    event.stopPropagation();
                    await commander.invokeNamedCommand(commandId, contextInitializer);
                    if (setup.onClick) {
                        await setup.onClick();
                    }
                })}
                icon={iconName !== undefined ? iconName as IconName : false}
                intent={setup.intent}
                >
                {setup.icon}
            </Button>
        </Tooltip>
    );
}
