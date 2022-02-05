/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import './codicon/codicon.css';
import './codicon/codicon-modifications.css';
import './codicon/codicon-animations.css';
import { Codicon, iconRegistry } from '../../../common/codicons.js';
import { createStyleSheet } from '../../dom.js';
import { RunOnceScheduler } from '../../../common/async.js';
function initialize() {
    let codiconStyleSheet = createStyleSheet();
    codiconStyleSheet.id = 'codiconStyles';
    function updateAll() {
        const rules = [];
        for (let c of iconRegistry.all) {
            rules.push(formatRule(c));
        }
        codiconStyleSheet.innerHTML = rules.join('\n');
    }
    const delayer = new RunOnceScheduler(updateAll, 0);
    iconRegistry.onDidRegister(() => delayer.schedule());
    delayer.schedule();
}
function formatRule(c) {
    let def = c.definition;
    while (def instanceof Codicon) {
        def = def.definition;
    }
    return `.codicon-${c.id}:before { content: '${def.character}'; }`;
}
initialize();
