/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { SubmenuAction } from './ui/menu/menu.js';
export class ContextSubMenu extends SubmenuAction {
    constructor(label, entries) {
        super(label, entries, 'contextsubmenu');
        this.entries = entries;
    }
}
