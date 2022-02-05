/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { URI } from '../../../base/common/uri.js';
import * as resources from '../../../base/common/resources.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';
import { TernarySearchTree } from '../../../base/common/map.js';
export const IWorkspaceContextService = createDecorator('contextService');
export var IWorkspace;
(function (IWorkspace) {
    function isIWorkspace(thing) {
        return thing && typeof thing === 'object'
            && typeof thing.id === 'string'
            && Array.isArray(thing.folders);
    }
    IWorkspace.isIWorkspace = isIWorkspace;
})(IWorkspace || (IWorkspace = {}));
export var IWorkspaceFolder;
(function (IWorkspaceFolder) {
    function isIWorkspaceFolder(thing) {
        return thing && typeof thing === 'object'
            && URI.isUri(thing.uri)
            && typeof thing.name === 'string'
            && typeof thing.toResource === 'function';
    }
    IWorkspaceFolder.isIWorkspaceFolder = isIWorkspaceFolder;
})(IWorkspaceFolder || (IWorkspaceFolder = {}));
export class Workspace {
    constructor(_id, folders = [], _configuration = null) {
        this._id = _id;
        this._configuration = _configuration;
        this._foldersMap = TernarySearchTree.forUris();
        this.folders = folders;
    }
    get folders() {
        return this._folders;
    }
    set folders(folders) {
        this._folders = folders;
        this.updateFoldersMap();
    }
    get id() {
        return this._id;
    }
    get configuration() {
        return this._configuration;
    }
    set configuration(configuration) {
        this._configuration = configuration;
    }
    getFolder(resource) {
        if (!resource) {
            return null;
        }
        return this._foldersMap.findSubstr(resource.with({
            scheme: resource.scheme,
            authority: resource.authority,
            path: resource.path
        })) || null;
    }
    updateFoldersMap() {
        this._foldersMap = TernarySearchTree.forUris();
        for (const folder of this.folders) {
            this._foldersMap.set(folder.uri, folder);
        }
    }
    toJSON() {
        return { id: this.id, folders: this.folders, configuration: this.configuration };
    }
}
export class WorkspaceFolder {
    constructor(data, raw) {
        this.raw = raw;
        this.uri = data.uri;
        this.index = data.index;
        this.name = data.name;
    }
    toResource(relativePath) {
        return resources.joinPath(this.uri, relativePath);
    }
    toJSON() {
        return { uri: this.uri, name: this.name, index: this.index };
    }
}
