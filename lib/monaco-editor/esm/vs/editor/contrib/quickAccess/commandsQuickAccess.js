<<<<<<< HEAD
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AbstractCommandsQuickAccessProvider } from '../../../platform/quickinput/browser/commandsQuickAccess.js';
import { stripCodicons } from '../../../base/common/codicons.js';
export class AbstractEditorCommandsQuickAccessProvider extends AbstractCommandsQuickAccessProvider {
    constructor(options, instantiationService, keybindingService, commandService, telemetryService, notificationService) {
        super(options, instantiationService, keybindingService, commandService, telemetryService, notificationService);
    }
    getCodeEditorCommandPicks() {
        const activeTextEditorControl = this.activeTextEditorControl;
        if (!activeTextEditorControl) {
            return [];
        }
        const editorCommandPicks = [];
        for (const editorAction of activeTextEditorControl.getSupportedActions()) {
            editorCommandPicks.push({
                commandId: editorAction.id,
                commandAlias: editorAction.alias,
                label: stripCodicons(editorAction.label) || editorAction.id,
            });
        }
        return editorCommandPicks;
    }
}
=======
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AbstractCommandsQuickAccessProvider } from '../../../platform/quickinput/browser/commandsQuickAccess.js';
import { stripCodicons } from '../../../base/common/codicons.js';
export class AbstractEditorCommandsQuickAccessProvider extends AbstractCommandsQuickAccessProvider {
    constructor(options, instantiationService, keybindingService, commandService, telemetryService, notificationService) {
        super(options, instantiationService, keybindingService, commandService, telemetryService, notificationService);
    }
    getCodeEditorCommandPicks() {
        const activeTextEditorControl = this.activeTextEditorControl;
        if (!activeTextEditorControl) {
            return [];
        }
        const editorCommandPicks = [];
        for (const editorAction of activeTextEditorControl.getSupportedActions()) {
            editorCommandPicks.push({
                commandId: editorAction.id,
                commandAlias: editorAction.alias,
                label: stripCodicons(editorAction.label) || editorAction.id,
            });
        }
        return editorCommandPicks;
    }
}
>>>>>>> master
