<<<<<<< HEAD
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
import { URI } from '../../../base/common/uri.js';
import { Range } from '../../common/core/range.js';
import { IModelService } from '../../common/services/modelService.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { ITextModelService } from '../../common/services/resolverService.js';
import { OutlineModel, OutlineElement } from '../documentSymbols/outlineModel.js';
import { CommandsRegistry } from '../../../platform/commands/common/commands.js';
import { assertType } from '../../../base/common/types.js';
import { Iterable } from '../../../base/common/iterator.js';
export function getDocumentSymbols(document, flat, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield OutlineModel.create(document, token);
        const roots = [];
        for (const child of model.children.values()) {
            if (child instanceof OutlineElement) {
                roots.push(child.symbol);
            }
            else {
                roots.push(...Iterable.map(child.children.values(), child => child.symbol));
            }
        }
        let flatEntries = [];
        if (token.isCancellationRequested) {
            return flatEntries;
        }
        if (flat) {
            flatten(flatEntries, roots, '');
        }
        else {
            flatEntries = roots;
        }
        return flatEntries.sort(compareEntriesUsingStart);
    });
}
function compareEntriesUsingStart(a, b) {
    return Range.compareRangesUsingStarts(a.range, b.range);
}
function flatten(bucket, entries, overrideContainerLabel) {
    for (let entry of entries) {
        bucket.push({
            kind: entry.kind,
            tags: entry.tags,
            name: entry.name,
            detail: entry.detail,
            containerName: entry.containerName || overrideContainerLabel,
            range: entry.range,
            selectionRange: entry.selectionRange,
            children: undefined,
        });
        if (entry.children) {
            flatten(bucket, entry.children, entry.name);
        }
    }
}
CommandsRegistry.registerCommand('_executeDocumentSymbolProvider', function (accessor, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        const [resource] = args;
        assertType(URI.isUri(resource));
        const model = accessor.get(IModelService).getModel(resource);
        if (model) {
            return getDocumentSymbols(model, false, CancellationToken.None);
        }
        const reference = yield accessor.get(ITextModelService).createModelReference(resource);
        try {
            return yield getDocumentSymbols(reference.object.textEditorModel, false, CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
});
=======
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
import { URI } from '../../../base/common/uri.js';
import { Range } from '../../common/core/range.js';
import { IModelService } from '../../common/services/modelService.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { ITextModelService } from '../../common/services/resolverService.js';
import { OutlineModel, OutlineElement } from '../documentSymbols/outlineModel.js';
import { CommandsRegistry } from '../../../platform/commands/common/commands.js';
import { assertType } from '../../../base/common/types.js';
import { Iterable } from '../../../base/common/iterator.js';
export function getDocumentSymbols(document, flat, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield OutlineModel.create(document, token);
        const roots = [];
        for (const child of model.children.values()) {
            if (child instanceof OutlineElement) {
                roots.push(child.symbol);
            }
            else {
                roots.push(...Iterable.map(child.children.values(), child => child.symbol));
            }
        }
        let flatEntries = [];
        if (token.isCancellationRequested) {
            return flatEntries;
        }
        if (flat) {
            flatten(flatEntries, roots, '');
        }
        else {
            flatEntries = roots;
        }
        return flatEntries.sort(compareEntriesUsingStart);
    });
}
function compareEntriesUsingStart(a, b) {
    return Range.compareRangesUsingStarts(a.range, b.range);
}
function flatten(bucket, entries, overrideContainerLabel) {
    for (let entry of entries) {
        bucket.push({
            kind: entry.kind,
            tags: entry.tags,
            name: entry.name,
            detail: entry.detail,
            containerName: entry.containerName || overrideContainerLabel,
            range: entry.range,
            selectionRange: entry.selectionRange,
            children: undefined,
        });
        if (entry.children) {
            flatten(bucket, entry.children, entry.name);
        }
    }
}
CommandsRegistry.registerCommand('_executeDocumentSymbolProvider', function (accessor, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        const [resource] = args;
        assertType(URI.isUri(resource));
        const model = accessor.get(IModelService).getModel(resource);
        if (model) {
            return getDocumentSymbols(model, false, CancellationToken.None);
        }
        const reference = yield accessor.get(ITextModelService).createModelReference(resource);
        try {
            return yield getDocumentSymbols(reference.object.textEditorModel, false, CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
});
>>>>>>> master
