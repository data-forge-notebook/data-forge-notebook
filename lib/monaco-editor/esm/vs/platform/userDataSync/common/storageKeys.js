<<<<<<< HEAD
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Emitter } from '../../../base/common/event.js';
import { values } from '../../../base/common/map.js';
import { Disposable, toDisposable } from '../../../base/common/lifecycle.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';
export const IStorageKeysSyncRegistryService = createDecorator('IStorageKeysSyncRegistryService');
export class StorageKeysSyncRegistryService extends Disposable {
    constructor() {
        super();
        this._storageKeys = new Map();
        this._onDidChangeStorageKeys = this._register(new Emitter());
        this._register(toDisposable(() => this._storageKeys.clear()));
    }
    get storageKeys() { return values(this._storageKeys); }
    registerStorageKey(storageKey) {
        if (!this._storageKeys.has(storageKey.key)) {
            this._storageKeys.set(storageKey.key, storageKey);
            this._onDidChangeStorageKeys.fire(this.storageKeys);
        }
    }
}
=======
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Emitter } from '../../../base/common/event.js';
import { values } from '../../../base/common/map.js';
import { Disposable, toDisposable } from '../../../base/common/lifecycle.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';
export const IStorageKeysSyncRegistryService = createDecorator('IStorageKeysSyncRegistryService');
export class StorageKeysSyncRegistryService extends Disposable {
    constructor() {
        super();
        this._storageKeys = new Map();
        this._onDidChangeStorageKeys = this._register(new Emitter());
        this._register(toDisposable(() => this._storageKeys.clear()));
    }
    get storageKeys() { return values(this._storageKeys); }
    registerStorageKey(storageKey) {
        if (!this._storageKeys.has(storageKey.key)) {
            this._storageKeys.set(storageKey.key, storageKey);
            this._onDidChangeStorageKeys.fire(this.storageKeys);
        }
    }
}
>>>>>>> master
