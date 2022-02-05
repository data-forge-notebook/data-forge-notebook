/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mergeSort } from '../../../base/common/arrays.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { illegalArgument, onUnexpectedExternalError } from '../../../base/common/errors.js';
import { URI } from '../../../base/common/uri.js';
import { registerLanguageCommand } from '../../browser/editorExtensions.js';
import { CodeLensProviderRegistry } from '../../common/modes.js';
import { IModelService } from '../../common/services/modelService.js';
import { DisposableStore } from '../../../base/common/lifecycle.js';
export class CodeLensModel {
    constructor() {
        this.lenses = [];
        this._disposables = new DisposableStore();
    }
    dispose() {
        this._disposables.dispose();
    }
    add(list, provider) {
        this._disposables.add(list);
        for (const symbol of list.lenses) {
            this.lenses.push({ symbol, provider });
        }
    }
}
export function getCodeLensData(model, token) {
    const provider = CodeLensProviderRegistry.ordered(model);
    const providerRanks = new Map();
    const result = new CodeLensModel();
    const promises = provider.map((provider, i) => {
        providerRanks.set(provider, i);
        return Promise.resolve(provider.provideCodeLenses(model, token))
            .then(list => list && result.add(list, provider))
            .catch(onUnexpectedExternalError);
    });
    return Promise.all(promises).then(() => {
        result.lenses = mergeSort(result.lenses, (a, b) => {
            // sort by lineNumber, provider-rank, and column
            if (a.symbol.range.startLineNumber < b.symbol.range.startLineNumber) {
                return -1;
            }
            else if (a.symbol.range.startLineNumber > b.symbol.range.startLineNumber) {
                return 1;
            }
            else if (providerRanks.get(a.provider) < providerRanks.get(b.provider)) {
                return -1;
            }
            else if (providerRanks.get(a.provider) > providerRanks.get(b.provider)) {
                return 1;
            }
            else if (a.symbol.range.startColumn < b.symbol.range.startColumn) {
                return -1;
            }
            else if (a.symbol.range.startColumn > b.symbol.range.startColumn) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return result;
    });
}
registerLanguageCommand('_executeCodeLensProvider', function (accessor, args) {
    let { resource, itemResolveCount } = args;
    if (!(resource instanceof URI)) {
        throw illegalArgument();
    }
    const model = accessor.get(IModelService).getModel(resource);
    if (!model) {
        throw illegalArgument();
    }
    const result = [];
    const disposables = new DisposableStore();
    return getCodeLensData(model, CancellationToken.None).then(value => {
        disposables.add(value);
        let resolve = [];
        for (const item of value.lenses) {
            if (typeof itemResolveCount === 'undefined' || Boolean(item.symbol.command)) {
                result.push(item.symbol);
            }
            else if (itemResolveCount-- > 0 && item.provider.resolveCodeLens) {
                resolve.push(Promise.resolve(item.provider.resolveCodeLens(model, item.symbol, CancellationToken.None)).then(symbol => result.push(symbol || item.symbol)));
            }
        }
        return Promise.all(resolve);
    }).then(() => {
        return result;
    }).finally(() => {
        // make sure to return results, then (on next tick)
        // dispose the results
        setTimeout(() => disposables.dispose(), 100);
    });
});
