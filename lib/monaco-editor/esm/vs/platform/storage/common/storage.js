/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createDecorator } from '../../instantiation/common/instantiation.js';
import { Emitter } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { isUndefinedOrNull } from '../../../base/common/types.js';
export const IStorageService = createDecorator('storageService');
export var WillSaveStateReason;
(function (WillSaveStateReason) {
    WillSaveStateReason[WillSaveStateReason["NONE"] = 0] = "NONE";
    WillSaveStateReason[WillSaveStateReason["SHUTDOWN"] = 1] = "SHUTDOWN";
})(WillSaveStateReason || (WillSaveStateReason = {}));
export class InMemoryStorageService extends Disposable {
    constructor() {
        super(...arguments);
        this._onDidChangeStorage = this._register(new Emitter());
        this._onWillSaveState = this._register(new Emitter());
        this.onWillSaveState = this._onWillSaveState.event;
        this.globalCache = new Map();
        this.workspaceCache = new Map();
    }
    getCache(scope) {
        return scope === 0 /* GLOBAL */ ? this.globalCache : this.workspaceCache;
    }
    get(key, scope, fallbackValue) {
        const value = this.getCache(scope).get(key);
        if (isUndefinedOrNull(value)) {
            return fallbackValue;
        }
        return value;
    }
    getBoolean(key, scope, fallbackValue) {
        const value = this.getCache(scope).get(key);
        if (isUndefinedOrNull(value)) {
            return fallbackValue;
        }
        return value === 'true';
    }
    getNumber(key, scope, fallbackValue) {
        const value = this.getCache(scope).get(key);
        if (isUndefinedOrNull(value)) {
            return fallbackValue;
        }
        return parseInt(value, 10);
    }
    store(key, value, scope) {
        // We remove the key for undefined/null values
        if (isUndefinedOrNull(value)) {
            return this.remove(key, scope);
        }
        // Otherwise, convert to String and store
        const valueStr = String(value);
        // Return early if value already set
        const currentValue = this.getCache(scope).get(key);
        if (currentValue === valueStr) {
            return Promise.resolve();
        }
        // Update in cache
        this.getCache(scope).set(key, valueStr);
        // Events
        this._onDidChangeStorage.fire({ scope, key });
        return Promise.resolve();
    }
    remove(key, scope) {
        const wasDeleted = this.getCache(scope).delete(key);
        if (!wasDeleted) {
            return Promise.resolve(); // Return early if value already deleted
        }
        // Events
        this._onDidChangeStorage.fire({ scope, key });
        return Promise.resolve();
    }
}
