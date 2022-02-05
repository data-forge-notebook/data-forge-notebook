/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { first } from '../../../base/common/async.js';
import { onUnexpectedExternalError } from '../../../base/common/errors.js';
import { registerDefaultLanguageCommand } from '../../browser/editorExtensions.js';
import * as modes from '../../common/modes.js';
import { RawContextKey } from '../../../platform/contextkey/common/contextkey.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
export const Context = {
    Visible: new RawContextKey('parameterHintsVisible', false),
    MultipleSignatures: new RawContextKey('parameterHintsMultipleSignatures', false),
};
export function provideSignatureHelp(model, position, context, token) {
    const supports = modes.SignatureHelpProviderRegistry.ordered(model);
    return first(supports.map(support => () => {
        return Promise.resolve(support.provideSignatureHelp(model, position, token, context))
            .catch(e => onUnexpectedExternalError(e));
    }));
}
registerDefaultLanguageCommand('_executeSignatureHelpProvider', (model, position, args) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield provideSignatureHelp(model, position, {
        triggerKind: modes.SignatureHelpTriggerKind.Invoke,
        isRetrigger: false,
        triggerCharacter: args['triggerCharacter']
    }, CancellationToken.None);
    if (!result) {
        return undefined;
    }
    setTimeout(() => result.dispose(), 0);
    return result.value;
}));
