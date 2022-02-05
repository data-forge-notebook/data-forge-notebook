<<<<<<< HEAD
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import './media/onTypeRename.css';
import * as nls from '../../../nls.js';
import { registerEditorContribution, registerModelAndPositionCommand, EditorAction, EditorCommand, registerEditorAction, registerEditorCommand } from '../../browser/editorExtensions.js';
import * as arrays from '../../../base/common/arrays.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { Position } from '../../common/core/position.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { Range } from '../../common/core/range.js';
import { OnTypeRenameProviderRegistry } from '../../common/modes.js';
import { first, createCancelablePromise, RunOnceScheduler } from '../../../base/common/async.js';
import { ModelDecorationOptions } from '../../common/model/textModel.js';
import { ContextKeyExpr, RawContextKey, IContextKeyService } from '../../../platform/contextkey/common/contextkey.js';
import { EditorContextKeys } from '../../common/editorContextKeys.js';
import { URI } from '../../../base/common/uri.js';
import { ICodeEditorService } from '../../browser/services/codeEditorService.js';
import { onUnexpectedError, onUnexpectedExternalError } from '../../../base/common/errors.js';
import * as strings from '../../../base/common/strings.js';
export const CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = new RawContextKey('onTypeRenameInputVisible', false);
let OnTypeRenameContribution = class OnTypeRenameContribution extends Disposable {
    constructor(editor, contextKeyService) {
        super();
        this._editor = editor;
        this._enabled = this._editor.getOption(73 /* renameOnType */);
        this._visibleContextKey = CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
        this._currentRequest = null;
        this._currentDecorations = [];
        this._stopPattern = /^\s/;
        this._ignoreChangeEvent = false;
        this._updateMirrors = this._register(new RunOnceScheduler(() => this._doUpdateMirrors(), 0));
        this._register(this._editor.onDidChangeModel((e) => {
            this.stopAll();
            this.run();
        }));
        this._register(this._editor.onDidChangeConfiguration((e) => {
            if (e.hasChanged(73 /* renameOnType */)) {
                this._enabled = this._editor.getOption(73 /* renameOnType */);
                this.stopAll();
                this.run();
            }
        }));
        this._register(this._editor.onDidChangeCursorPosition((e) => {
            // no regions, run
            if (this._currentDecorations.length === 0) {
                this.run(e.position);
            }
            // has cached regions, don't run
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentDecorations.length === 0) {
                return;
            }
            const model = this._editor.getModel();
            const currentRanges = this._currentDecorations.map(decId => model.getDecorationRange(decId));
            // just moving cursor around, don't run again
            if (Range.containsPosition(currentRanges[0], e.position)) {
                return;
            }
            // moving cursor out of primary region, run
            this.run(e.position);
        }));
        this._register(OnTypeRenameProviderRegistry.onDidChange(() => {
            this.run();
        }));
        this._register(this._editor.onDidChangeModelContent((e) => {
            if (this._ignoreChangeEvent) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentDecorations.length === 0) {
                // nothing to do
                return;
            }
            if (e.isUndoing || e.isRedoing) {
                return;
            }
            if (e.changes[0] && this._stopPattern.test(e.changes[0].text)) {
                this.stopAll();
                return;
            }
            this._updateMirrors.schedule();
        }));
    }
    static get(editor) {
        return editor.getContribution(OnTypeRenameContribution.ID);
    }
    _doUpdateMirrors() {
        if (!this._editor.hasModel()) {
            return;
        }
        if (this._currentDecorations.length === 0) {
            // nothing to do
            return;
        }
        const model = this._editor.getModel();
        const currentRanges = this._currentDecorations.map(decId => model.getDecorationRange(decId));
        const referenceRange = currentRanges[0];
        if (referenceRange.startLineNumber !== referenceRange.endLineNumber) {
            return this.stopAll();
        }
        const referenceValue = model.getValueInRange(referenceRange);
        if (this._stopPattern.test(referenceValue)) {
            return this.stopAll();
        }
        let edits = [];
        for (let i = 1, len = currentRanges.length; i < len; i++) {
            const mirrorRange = currentRanges[i];
            if (mirrorRange.startLineNumber !== mirrorRange.endLineNumber) {
                edits.push({
                    range: mirrorRange,
                    text: referenceValue
                });
            }
            else {
                let oldValue = model.getValueInRange(mirrorRange);
                let newValue = referenceValue;
                let rangeStartColumn = mirrorRange.startColumn;
                let rangeEndColumn = mirrorRange.endColumn;
                const commonPrefixLength = strings.commonPrefixLength(oldValue, newValue);
                rangeStartColumn += commonPrefixLength;
                oldValue = oldValue.substr(commonPrefixLength);
                newValue = newValue.substr(commonPrefixLength);
                const commonSuffixLength = strings.commonSuffixLength(oldValue, newValue);
                rangeEndColumn -= commonSuffixLength;
                oldValue = oldValue.substr(0, oldValue.length - commonSuffixLength);
                newValue = newValue.substr(0, newValue.length - commonSuffixLength);
                if (rangeStartColumn !== rangeEndColumn || newValue.length !== 0) {
                    edits.push({
                        range: new Range(mirrorRange.startLineNumber, rangeStartColumn, mirrorRange.endLineNumber, rangeEndColumn),
                        text: newValue
                    });
                }
            }
        }
        if (edits.length === 0) {
            return;
        }
        try {
            this._ignoreChangeEvent = true;
            const prevEditOperationType = this._editor._getViewModel().getPrevEditOperationType();
            this._editor.executeEdits('onTypeRename', edits);
            this._editor._getViewModel().setPrevEditOperationType(prevEditOperationType);
        }
        finally {
            this._ignoreChangeEvent = false;
        }
    }
    dispose() {
        super.dispose();
        this.stopAll();
    }
    stopAll() {
        this._visibleContextKey.set(false);
        this._currentDecorations = this._editor.deltaDecorations(this._currentDecorations, []);
    }
    run(position = this._editor.getPosition(), force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!position) {
                return;
            }
            if (!this._enabled && !force) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentRequest) {
                this._currentRequest.cancel();
                this._currentRequest = null;
            }
            const model = this._editor.getModel();
            this._currentRequest = createCancelablePromise(token => getOnTypeRenameRanges(model, position, token));
            try {
                const response = yield this._currentRequest;
                let ranges = [];
                if (response === null || response === void 0 ? void 0 : response.ranges) {
                    ranges = response.ranges;
                }
                if (response === null || response === void 0 ? void 0 : response.stopPattern) {
                    this._stopPattern = response.stopPattern;
                }
                let foundReferenceRange = false;
                for (let i = 0, len = ranges.length; i < len; i++) {
                    if (Range.containsPosition(ranges[i], position)) {
                        foundReferenceRange = true;
                        if (i !== 0) {
                            const referenceRange = ranges[i];
                            ranges.splice(i, 1);
                            ranges.unshift(referenceRange);
                        }
                        break;
                    }
                }
                if (!foundReferenceRange) {
                    // Cannot do on type rename if the ranges are not where the cursor is...
                    this.stopAll();
                    return;
                }
                const decorations = ranges.map(range => ({ range: range, options: OnTypeRenameContribution.DECORATION }));
                this._visibleContextKey.set(true);
                this._currentDecorations = this._editor.deltaDecorations(this._currentDecorations, decorations);
            }
            catch (err) {
                onUnexpectedError(err);
                this.stopAll();
            }
        });
    }
};
OnTypeRenameContribution.ID = 'editor.contrib.onTypeRename';
OnTypeRenameContribution.DECORATION = ModelDecorationOptions.register({
    stickiness: 0 /* AlwaysGrowsWhenTypingAtEdges */,
    className: 'on-type-rename-decoration'
});
OnTypeRenameContribution = __decorate([
    __param(1, IContextKeyService)
], OnTypeRenameContribution);
export { OnTypeRenameContribution };
export class OnTypeRenameAction extends EditorAction {
    constructor() {
        super({
            id: 'editor.action.onTypeRename',
            label: nls.localize('onTypeRename.label', "On Type Rename Symbol"),
            alias: 'On Type Rename Symbol',
            precondition: ContextKeyExpr.and(EditorContextKeys.writable, EditorContextKeys.hasRenameProvider),
            kbOpts: {
                kbExpr: EditorContextKeys.editorTextFocus,
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 60 /* F2 */,
                weight: 100 /* EditorContrib */
            }
        });
    }
    runCommand(accessor, args) {
        const editorService = accessor.get(ICodeEditorService);
        const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
        if (URI.isUri(uri) && Position.isIPosition(pos)) {
            return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                if (!editor) {
                    return;
                }
                editor.setPosition(pos);
                editor.invokeWithinContext(accessor => {
                    this.reportTelemetry(accessor, editor);
                    return this.run(accessor, editor);
                });
            }, onUnexpectedError);
        }
        return super.runCommand(accessor, args);
    }
    run(accessor, editor) {
        const controller = OnTypeRenameContribution.get(editor);
        if (controller) {
            return Promise.resolve(controller.run(editor.getPosition(), true));
        }
        return Promise.resolve();
    }
}
const OnTypeRenameCommand = EditorCommand.bindToContribution(OnTypeRenameContribution.get);
registerEditorCommand(new OnTypeRenameCommand({
    id: 'cancelOnTypeRenameInput',
    precondition: CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE,
    handler: x => x.stopAll(),
    kbOpts: {
        kbExpr: EditorContextKeys.editorTextFocus,
        weight: 100 /* EditorContrib */ + 99,
        primary: 9 /* Escape */,
        secondary: [1024 /* Shift */ | 9 /* Escape */]
    }
}));
export function getOnTypeRenameRanges(model, position, token) {
    const orderedByScore = OnTypeRenameProviderRegistry.ordered(model);
    // in order of score ask the occurrences provider
    // until someone response with a good result
    // (good = none empty array)
    return first(orderedByScore.map(provider => () => {
        return Promise.resolve(provider.provideOnTypeRenameRanges(model, position, token)).then((ranges) => {
            if (!ranges) {
                return undefined;
            }
            return {
                ranges,
                stopPattern: provider.stopPattern
            };
        }, (err) => {
            onUnexpectedExternalError(err);
            return undefined;
        });
    }), result => !!result && arrays.isNonEmptyArray(result === null || result === void 0 ? void 0 : result.ranges));
}
registerModelAndPositionCommand('_executeRenameOnTypeProvider', (model, position) => getOnTypeRenameRanges(model, position, CancellationToken.None));
registerEditorContribution(OnTypeRenameContribution.ID, OnTypeRenameContribution);
registerEditorAction(OnTypeRenameAction);
=======
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import './media/onTypeRename.css';
import * as nls from '../../../nls.js';
import { registerEditorContribution, registerModelAndPositionCommand, EditorAction, EditorCommand, registerEditorAction, registerEditorCommand } from '../../browser/editorExtensions.js';
import * as arrays from '../../../base/common/arrays.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { Position } from '../../common/core/position.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { Range } from '../../common/core/range.js';
import { OnTypeRenameProviderRegistry } from '../../common/modes.js';
import { first, createCancelablePromise, RunOnceScheduler } from '../../../base/common/async.js';
import { ModelDecorationOptions } from '../../common/model/textModel.js';
import { ContextKeyExpr, RawContextKey, IContextKeyService } from '../../../platform/contextkey/common/contextkey.js';
import { EditorContextKeys } from '../../common/editorContextKeys.js';
import { URI } from '../../../base/common/uri.js';
import { ICodeEditorService } from '../../browser/services/codeEditorService.js';
import { onUnexpectedError, onUnexpectedExternalError } from '../../../base/common/errors.js';
import * as strings from '../../../base/common/strings.js';
export const CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = new RawContextKey('onTypeRenameInputVisible', false);
let OnTypeRenameContribution = class OnTypeRenameContribution extends Disposable {
    constructor(editor, contextKeyService) {
        super();
        this._editor = editor;
        this._enabled = this._editor.getOption(73 /* renameOnType */);
        this._visibleContextKey = CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
        this._currentRequest = null;
        this._currentDecorations = [];
        this._stopPattern = /^\s/;
        this._ignoreChangeEvent = false;
        this._updateMirrors = this._register(new RunOnceScheduler(() => this._doUpdateMirrors(), 0));
        this._register(this._editor.onDidChangeModel((e) => {
            this.stopAll();
            this.run();
        }));
        this._register(this._editor.onDidChangeConfiguration((e) => {
            if (e.hasChanged(73 /* renameOnType */)) {
                this._enabled = this._editor.getOption(73 /* renameOnType */);
                this.stopAll();
                this.run();
            }
        }));
        this._register(this._editor.onDidChangeCursorPosition((e) => {
            // no regions, run
            if (this._currentDecorations.length === 0) {
                this.run(e.position);
            }
            // has cached regions, don't run
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentDecorations.length === 0) {
                return;
            }
            const model = this._editor.getModel();
            const currentRanges = this._currentDecorations.map(decId => model.getDecorationRange(decId));
            // just moving cursor around, don't run again
            if (Range.containsPosition(currentRanges[0], e.position)) {
                return;
            }
            // moving cursor out of primary region, run
            this.run(e.position);
        }));
        this._register(OnTypeRenameProviderRegistry.onDidChange(() => {
            this.run();
        }));
        this._register(this._editor.onDidChangeModelContent((e) => {
            if (this._ignoreChangeEvent) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentDecorations.length === 0) {
                // nothing to do
                return;
            }
            if (e.isUndoing || e.isRedoing) {
                return;
            }
            if (e.changes[0] && this._stopPattern.test(e.changes[0].text)) {
                this.stopAll();
                return;
            }
            this._updateMirrors.schedule();
        }));
    }
    static get(editor) {
        return editor.getContribution(OnTypeRenameContribution.ID);
    }
    _doUpdateMirrors() {
        if (!this._editor.hasModel()) {
            return;
        }
        if (this._currentDecorations.length === 0) {
            // nothing to do
            return;
        }
        const model = this._editor.getModel();
        const currentRanges = this._currentDecorations.map(decId => model.getDecorationRange(decId));
        const referenceRange = currentRanges[0];
        if (referenceRange.startLineNumber !== referenceRange.endLineNumber) {
            return this.stopAll();
        }
        const referenceValue = model.getValueInRange(referenceRange);
        if (this._stopPattern.test(referenceValue)) {
            return this.stopAll();
        }
        let edits = [];
        for (let i = 1, len = currentRanges.length; i < len; i++) {
            const mirrorRange = currentRanges[i];
            if (mirrorRange.startLineNumber !== mirrorRange.endLineNumber) {
                edits.push({
                    range: mirrorRange,
                    text: referenceValue
                });
            }
            else {
                let oldValue = model.getValueInRange(mirrorRange);
                let newValue = referenceValue;
                let rangeStartColumn = mirrorRange.startColumn;
                let rangeEndColumn = mirrorRange.endColumn;
                const commonPrefixLength = strings.commonPrefixLength(oldValue, newValue);
                rangeStartColumn += commonPrefixLength;
                oldValue = oldValue.substr(commonPrefixLength);
                newValue = newValue.substr(commonPrefixLength);
                const commonSuffixLength = strings.commonSuffixLength(oldValue, newValue);
                rangeEndColumn -= commonSuffixLength;
                oldValue = oldValue.substr(0, oldValue.length - commonSuffixLength);
                newValue = newValue.substr(0, newValue.length - commonSuffixLength);
                if (rangeStartColumn !== rangeEndColumn || newValue.length !== 0) {
                    edits.push({
                        range: new Range(mirrorRange.startLineNumber, rangeStartColumn, mirrorRange.endLineNumber, rangeEndColumn),
                        text: newValue
                    });
                }
            }
        }
        if (edits.length === 0) {
            return;
        }
        try {
            this._ignoreChangeEvent = true;
            const prevEditOperationType = this._editor._getViewModel().getPrevEditOperationType();
            this._editor.executeEdits('onTypeRename', edits);
            this._editor._getViewModel().setPrevEditOperationType(prevEditOperationType);
        }
        finally {
            this._ignoreChangeEvent = false;
        }
    }
    dispose() {
        super.dispose();
        this.stopAll();
    }
    stopAll() {
        this._visibleContextKey.set(false);
        this._currentDecorations = this._editor.deltaDecorations(this._currentDecorations, []);
    }
    run(position = this._editor.getPosition(), force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!position) {
                return;
            }
            if (!this._enabled && !force) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentRequest) {
                this._currentRequest.cancel();
                this._currentRequest = null;
            }
            const model = this._editor.getModel();
            this._currentRequest = createCancelablePromise(token => getOnTypeRenameRanges(model, position, token));
            try {
                const response = yield this._currentRequest;
                let ranges = [];
                if (response === null || response === void 0 ? void 0 : response.ranges) {
                    ranges = response.ranges;
                }
                if (response === null || response === void 0 ? void 0 : response.stopPattern) {
                    this._stopPattern = response.stopPattern;
                }
                let foundReferenceRange = false;
                for (let i = 0, len = ranges.length; i < len; i++) {
                    if (Range.containsPosition(ranges[i], position)) {
                        foundReferenceRange = true;
                        if (i !== 0) {
                            const referenceRange = ranges[i];
                            ranges.splice(i, 1);
                            ranges.unshift(referenceRange);
                        }
                        break;
                    }
                }
                if (!foundReferenceRange) {
                    // Cannot do on type rename if the ranges are not where the cursor is...
                    this.stopAll();
                    return;
                }
                const decorations = ranges.map(range => ({ range: range, options: OnTypeRenameContribution.DECORATION }));
                this._visibleContextKey.set(true);
                this._currentDecorations = this._editor.deltaDecorations(this._currentDecorations, decorations);
            }
            catch (err) {
                onUnexpectedError(err);
                this.stopAll();
            }
        });
    }
};
OnTypeRenameContribution.ID = 'editor.contrib.onTypeRename';
OnTypeRenameContribution.DECORATION = ModelDecorationOptions.register({
    stickiness: 0 /* AlwaysGrowsWhenTypingAtEdges */,
    className: 'on-type-rename-decoration'
});
OnTypeRenameContribution = __decorate([
    __param(1, IContextKeyService)
], OnTypeRenameContribution);
export { OnTypeRenameContribution };
export class OnTypeRenameAction extends EditorAction {
    constructor() {
        super({
            id: 'editor.action.onTypeRename',
            label: nls.localize('onTypeRename.label', "On Type Rename Symbol"),
            alias: 'On Type Rename Symbol',
            precondition: ContextKeyExpr.and(EditorContextKeys.writable, EditorContextKeys.hasRenameProvider),
            kbOpts: {
                kbExpr: EditorContextKeys.editorTextFocus,
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 60 /* F2 */,
                weight: 100 /* EditorContrib */
            }
        });
    }
    runCommand(accessor, args) {
        const editorService = accessor.get(ICodeEditorService);
        const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
        if (URI.isUri(uri) && Position.isIPosition(pos)) {
            return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                if (!editor) {
                    return;
                }
                editor.setPosition(pos);
                editor.invokeWithinContext(accessor => {
                    this.reportTelemetry(accessor, editor);
                    return this.run(accessor, editor);
                });
            }, onUnexpectedError);
        }
        return super.runCommand(accessor, args);
    }
    run(accessor, editor) {
        const controller = OnTypeRenameContribution.get(editor);
        if (controller) {
            return Promise.resolve(controller.run(editor.getPosition(), true));
        }
        return Promise.resolve();
    }
}
const OnTypeRenameCommand = EditorCommand.bindToContribution(OnTypeRenameContribution.get);
registerEditorCommand(new OnTypeRenameCommand({
    id: 'cancelOnTypeRenameInput',
    precondition: CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE,
    handler: x => x.stopAll(),
    kbOpts: {
        kbExpr: EditorContextKeys.editorTextFocus,
        weight: 100 /* EditorContrib */ + 99,
        primary: 9 /* Escape */,
        secondary: [1024 /* Shift */ | 9 /* Escape */]
    }
}));
export function getOnTypeRenameRanges(model, position, token) {
    const orderedByScore = OnTypeRenameProviderRegistry.ordered(model);
    // in order of score ask the occurrences provider
    // until someone response with a good result
    // (good = none empty array)
    return first(orderedByScore.map(provider => () => {
        return Promise.resolve(provider.provideOnTypeRenameRanges(model, position, token)).then((ranges) => {
            if (!ranges) {
                return undefined;
            }
            return {
                ranges,
                stopPattern: provider.stopPattern
            };
        }, (err) => {
            onUnexpectedExternalError(err);
            return undefined;
        });
    }), result => !!result && arrays.isNonEmptyArray(result === null || result === void 0 ? void 0 : result.ranges));
}
registerModelAndPositionCommand('_executeRenameOnTypeProvider', (model, position) => getOnTypeRenameRanges(model, position, CancellationToken.None));
registerEditorContribution(OnTypeRenameContribution.ID, OnTypeRenameContribution);
registerEditorAction(OnTypeRenameAction);
>>>>>>> master
