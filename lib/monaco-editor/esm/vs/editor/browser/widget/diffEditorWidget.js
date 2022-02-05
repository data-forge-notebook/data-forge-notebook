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
import './media/diffEditor.css';
import * as nls from '../../../nls.js';
import * as dom from '../../../base/browser/dom.js';
import { createFastDomNode } from '../../../base/browser/fastDomNode.js';
import { Sash } from '../../../base/browser/ui/sash/sash.js';
import { RunOnceScheduler } from '../../../base/common/async.js';
import { Emitter } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import * as objects from '../../../base/common/objects.js';
import { Configuration } from '../config/configuration.js';
import { StableEditorScrollState } from '../core/editorState.js';
import { ICodeEditorService } from '../services/codeEditorService.js';
import { CodeEditorWidget } from './codeEditorWidget.js';
import { DiffReview } from './diffReview.js';
import { EditorOptions, EditorFontLigatures } from '../../common/config/editorOptions.js';
import { Range } from '../../common/core/range.js';
import { createStringBuilder } from '../../common/core/stringBuilder.js';
import * as editorCommon from '../../common/editorCommon.js';
import { ModelDecorationOptions } from '../../common/model/textModel.js';
import { IEditorWorkerService } from '../../common/services/editorWorkerService.js';
import { OverviewRulerZone } from '../../common/view/overviewZoneManager.js';
import { LineDecoration } from '../../common/viewLayout/lineDecorations.js';
import { RenderLineInput, renderViewLine } from '../../common/viewLayout/viewLineRenderer.js';
import { InlineDecoration, ViewLineRenderingData } from '../../common/viewModel/viewModel.js';
import { IContextKeyService } from '../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../platform/instantiation/common/instantiation.js';
import { ServiceCollection } from '../../../platform/instantiation/common/serviceCollection.js';
import { INotificationService } from '../../../platform/notification/common/notification.js';
import { defaultInsertColor, defaultRemoveColor, diffBorder, diffInserted, diffInsertedOutline, diffRemoved, diffRemovedOutline, scrollbarShadow, scrollbarSliderBackground, scrollbarSliderHoverBackground, scrollbarSliderActiveBackground, diffDiagonalFill } from '../../../platform/theme/common/colorRegistry.js';
import { IThemeService, getThemeTypeSelector, registerThemingParticipant } from '../../../platform/theme/common/themeService.js';
import { IContextMenuService } from '../../../platform/contextview/browser/contextView.js';
import { InlineDiffMargin } from './inlineDiffMargin.js';
import { IClipboardService } from '../../../platform/clipboard/common/clipboardService.js';
import { EditorExtensionsRegistry } from '../editorExtensions.js';
import { onUnexpectedError } from '../../../base/common/errors.js';
import { IEditorProgressService } from '../../../platform/progress/common/progress.js';
import { ElementSizeObserver } from '../config/elementSizeObserver.js';
import { Codicon, registerIcon } from '../../../base/common/codicons.js';
import { MOUSE_CURSOR_TEXT_CSS_CLASS_NAME } from '../../../base/browser/ui/mouseCursor/mouseCursor.js';
class VisualEditorState {
    constructor(_contextMenuService, _clipboardService) {
        this._contextMenuService = _contextMenuService;
        this._clipboardService = _clipboardService;
        this._zones = [];
        this.inlineDiffMargins = [];
        this._zonesMap = {};
        this._decorations = [];
    }
    getForeignViewZones(allViewZones) {
        return allViewZones.filter((z) => !this._zonesMap[String(z.id)]);
    }
    clean(editor) {
        // (1) View zones
        if (this._zones.length > 0) {
            editor.changeViewZones((viewChangeAccessor) => {
                for (let i = 0, length = this._zones.length; i < length; i++) {
                    viewChangeAccessor.removeZone(this._zones[i]);
                }
            });
        }
        this._zones = [];
        this._zonesMap = {};
        // (2) Model decorations
        this._decorations = editor.deltaDecorations(this._decorations, []);
    }
    apply(editor, overviewRuler, newDecorations, restoreScrollState) {
        const scrollState = restoreScrollState ? StableEditorScrollState.capture(editor) : null;
        // view zones
        editor.changeViewZones((viewChangeAccessor) => {
            for (let i = 0, length = this._zones.length; i < length; i++) {
                viewChangeAccessor.removeZone(this._zones[i]);
            }
            for (let i = 0, length = this.inlineDiffMargins.length; i < length; i++) {
                this.inlineDiffMargins[i].dispose();
            }
            this._zones = [];
            this._zonesMap = {};
            this.inlineDiffMargins = [];
            for (let i = 0, length = newDecorations.zones.length; i < length; i++) {
                const viewZone = newDecorations.zones[i];
                viewZone.suppressMouseDown = true;
                let zoneId = viewChangeAccessor.addZone(viewZone);
                this._zones.push(zoneId);
                this._zonesMap[String(zoneId)] = true;
                if (newDecorations.zones[i].diff && viewZone.marginDomNode) {
                    viewZone.suppressMouseDown = false;
                    this.inlineDiffMargins.push(new InlineDiffMargin(zoneId, viewZone.marginDomNode, editor, newDecorations.zones[i].diff, this._contextMenuService, this._clipboardService));
                }
            }
        });
        if (scrollState) {
            scrollState.restore(editor);
        }
        // decorations
        this._decorations = editor.deltaDecorations(this._decorations, newDecorations.decorations);
        // overview ruler
        if (overviewRuler) {
            overviewRuler.setZones(newDecorations.overviewZones);
        }
    }
}
let DIFF_EDITOR_ID = 0;
const diffInsertIcon = registerIcon('diff-insert', Codicon.add);
const diffRemoveIcon = registerIcon('diff-remove', Codicon.remove);
let DiffEditorWidget = class DiffEditorWidget extends Disposable {
    constructor(domElement, options, clipboardService, editorWorkerService, contextKeyService, instantiationService, codeEditorService, themeService, notificationService, contextMenuService, _editorProgressService) {
        super();
        this._editorProgressService = _editorProgressService;
        this._onDidDispose = this._register(new Emitter());
        this.onDidDispose = this._onDidDispose.event;
        this._onDidUpdateDiff = this._register(new Emitter());
        this.onDidUpdateDiff = this._onDidUpdateDiff.event;
        this._lastOriginalWarning = null;
        this._lastModifiedWarning = null;
        this._editorWorkerService = editorWorkerService;
        this._codeEditorService = codeEditorService;
        this._contextKeyService = this._register(contextKeyService.createScoped(domElement));
        this._contextKeyService.createKey('isInDiffEditor', true);
        this._themeService = themeService;
        this._notificationService = notificationService;
        this.id = (++DIFF_EDITOR_ID);
        this._state = 0 /* Idle */;
        this._updatingDiffProgress = null;
        this._domElement = domElement;
        options = options || {};
        // renderSideBySide
        this._renderSideBySide = true;
        if (typeof options.renderSideBySide !== 'undefined') {
            this._renderSideBySide = options.renderSideBySide;
        }
        // maxComputationTime
        this._maxComputationTime = 5000;
        if (typeof options.maxComputationTime !== 'undefined') {
            this._maxComputationTime = options.maxComputationTime;
        }
        // ignoreTrimWhitespace
        this._ignoreTrimWhitespace = true;
        if (typeof options.ignoreTrimWhitespace !== 'undefined') {
            this._ignoreTrimWhitespace = options.ignoreTrimWhitespace;
        }
        // renderIndicators
        this._renderIndicators = true;
        if (typeof options.renderIndicators !== 'undefined') {
            this._renderIndicators = options.renderIndicators;
        }
        this._originalIsEditable = false;
        if (typeof options.originalEditable !== 'undefined') {
            this._originalIsEditable = Boolean(options.originalEditable);
        }
        this._updateDecorationsRunner = this._register(new RunOnceScheduler(() => this._updateDecorations(), 0));
        this._containerDomElement = document.createElement('div');
        this._containerDomElement.className = DiffEditorWidget._getClassName(this._themeService.getColorTheme(), this._renderSideBySide);
        this._containerDomElement.style.position = 'relative';
        this._containerDomElement.style.height = '100%';
        this._domElement.appendChild(this._containerDomElement);
        this._overviewViewportDomElement = createFastDomNode(document.createElement('div'));
        this._overviewViewportDomElement.setClassName('diffViewport');
        this._overviewViewportDomElement.setPosition('absolute');
        this._overviewDomElement = document.createElement('div');
        this._overviewDomElement.className = 'diffOverview';
        this._overviewDomElement.style.position = 'absolute';
        this._overviewDomElement.appendChild(this._overviewViewportDomElement.domNode);
        this._register(dom.addStandardDisposableListener(this._overviewDomElement, 'mousedown', (e) => {
            this.modifiedEditor.delegateVerticalScrollbarMouseDown(e);
        }));
        this._containerDomElement.appendChild(this._overviewDomElement);
        // Create left side
        this._originalDomNode = document.createElement('div');
        this._originalDomNode.className = 'editor original';
        this._originalDomNode.style.position = 'absolute';
        this._originalDomNode.style.height = '100%';
        this._containerDomElement.appendChild(this._originalDomNode);
        // Create right side
        this._modifiedDomNode = document.createElement('div');
        this._modifiedDomNode.className = 'editor modified';
        this._modifiedDomNode.style.position = 'absolute';
        this._modifiedDomNode.style.height = '100%';
        this._containerDomElement.appendChild(this._modifiedDomNode);
        this._beginUpdateDecorationsTimeout = -1;
        this._currentlyChangingViewZones = false;
        this._diffComputationToken = 0;
        this._originalEditorState = new VisualEditorState(contextMenuService, clipboardService);
        this._modifiedEditorState = new VisualEditorState(contextMenuService, clipboardService);
        this._isVisible = true;
        this._isHandlingScrollEvent = false;
        this._elementSizeObserver = this._register(new ElementSizeObserver(this._containerDomElement, undefined, () => this._onDidContainerSizeChanged()));
        if (options.automaticLayout) {
            this._elementSizeObserver.startObserving();
        }
        this._diffComputationResult = null;
        const leftContextKeyService = this._contextKeyService.createScoped();
        leftContextKeyService.createKey('isInDiffLeftEditor', true);
        const leftServices = new ServiceCollection();
        leftServices.set(IContextKeyService, leftContextKeyService);
        const leftScopedInstantiationService = instantiationService.createChild(leftServices);
        const rightContextKeyService = this._contextKeyService.createScoped();
        rightContextKeyService.createKey('isInDiffRightEditor', true);
        const rightServices = new ServiceCollection();
        rightServices.set(IContextKeyService, rightContextKeyService);
        const rightScopedInstantiationService = instantiationService.createChild(rightServices);
        this.originalEditor = this._createLeftHandSideEditor(options, leftScopedInstantiationService);
        this.modifiedEditor = this._createRightHandSideEditor(options, rightScopedInstantiationService);
        this._originalOverviewRuler = null;
        this._modifiedOverviewRuler = null;
        this._reviewPane = new DiffReview(this);
        this._containerDomElement.appendChild(this._reviewPane.domNode.domNode);
        this._containerDomElement.appendChild(this._reviewPane.shadow.domNode);
        this._containerDomElement.appendChild(this._reviewPane.actionBarContainer.domNode);
        // enableSplitViewResizing
        this._enableSplitViewResizing = true;
        if (typeof options.enableSplitViewResizing !== 'undefined') {
            this._enableSplitViewResizing = options.enableSplitViewResizing;
        }
        if (this._renderSideBySide) {
            this._setStrategy(new DiffEditorWidgetSideBySide(this._createDataSource(), this._enableSplitViewResizing));
        }
        else {
            this._setStrategy(new DiffEditorWidgetInline(this._createDataSource(), this._enableSplitViewResizing));
        }
        this._register(themeService.onDidColorThemeChange(t => {
            if (this._strategy && this._strategy.applyColors(t)) {
                this._updateDecorationsRunner.schedule();
            }
            this._containerDomElement.className = DiffEditorWidget._getClassName(this._themeService.getColorTheme(), this._renderSideBySide);
        }));
        const contributions = EditorExtensionsRegistry.getDiffEditorContributions();
        for (const desc of contributions) {
            try {
                this._register(instantiationService.createInstance(desc.ctor, this));
            }
            catch (err) {
                onUnexpectedError(err);
            }
        }
        this._codeEditorService.addDiffEditor(this);
    }
    _setState(newState) {
        if (this._state === newState) {
            return;
        }
        this._state = newState;
        if (this._updatingDiffProgress) {
            this._updatingDiffProgress.done();
            this._updatingDiffProgress = null;
        }
        if (this._state === 1 /* ComputingDiff */) {
            this._updatingDiffProgress = this._editorProgressService.show(true, 1000);
        }
    }
    diffReviewNext() {
        this._reviewPane.next();
    }
    diffReviewPrev() {
        this._reviewPane.prev();
    }
    static _getClassName(theme, renderSideBySide) {
        let result = 'monaco-diff-editor monaco-editor-background ';
        if (renderSideBySide) {
            result += 'side-by-side ';
        }
        result += getThemeTypeSelector(theme.type);
        return result;
    }
    _recreateOverviewRulers() {
        if (this._originalOverviewRuler) {
            this._overviewDomElement.removeChild(this._originalOverviewRuler.getDomNode());
            this._originalOverviewRuler.dispose();
        }
        if (this.originalEditor.hasModel()) {
            this._originalOverviewRuler = this.originalEditor.createOverviewRuler('original diffOverviewRuler');
            this._overviewDomElement.appendChild(this._originalOverviewRuler.getDomNode());
        }
        if (this._modifiedOverviewRuler) {
            this._overviewDomElement.removeChild(this._modifiedOverviewRuler.getDomNode());
            this._modifiedOverviewRuler.dispose();
        }
        if (this.modifiedEditor.hasModel()) {
            this._modifiedOverviewRuler = this.modifiedEditor.createOverviewRuler('modified diffOverviewRuler');
            this._overviewDomElement.appendChild(this._modifiedOverviewRuler.getDomNode());
        }
        this._layoutOverviewRulers();
    }
    _createLeftHandSideEditor(options, instantiationService) {
        const editor = this._createInnerEditor(instantiationService, this._originalDomNode, this._adjustOptionsForLeftHandSide(options, this._originalIsEditable));
        this._register(editor.onDidScrollChange((e) => {
            if (this._isHandlingScrollEvent) {
                return;
            }
            if (!e.scrollTopChanged && !e.scrollLeftChanged && !e.scrollHeightChanged) {
                return;
            }
            this._isHandlingScrollEvent = true;
            this.modifiedEditor.setScrollPosition({
                scrollLeft: e.scrollLeft,
                scrollTop: e.scrollTop
            });
            this._isHandlingScrollEvent = false;
            this._layoutOverviewViewport();
        }));
        this._register(editor.onDidChangeViewZones(() => {
            this._onViewZonesChanged();
        }));
        this._register(editor.onDidChangeModelContent(() => {
            if (this._isVisible) {
                this._beginUpdateDecorationsSoon();
            }
        }));
        return editor;
    }
    _createRightHandSideEditor(options, instantiationService) {
        const editor = this._createInnerEditor(instantiationService, this._modifiedDomNode, this._adjustOptionsForRightHandSide(options));
        this._register(editor.onDidScrollChange((e) => {
            if (this._isHandlingScrollEvent) {
                return;
            }
            if (!e.scrollTopChanged && !e.scrollLeftChanged && !e.scrollHeightChanged) {
                return;
            }
            this._isHandlingScrollEvent = true;
            this.originalEditor.setScrollPosition({
                scrollLeft: e.scrollLeft,
                scrollTop: e.scrollTop
            });
            this._isHandlingScrollEvent = false;
            this._layoutOverviewViewport();
        }));
        this._register(editor.onDidChangeViewZones(() => {
            this._onViewZonesChanged();
        }));
        this._register(editor.onDidChangeConfiguration((e) => {
            if (e.hasChanged(36 /* fontInfo */) && editor.getModel()) {
                this._onViewZonesChanged();
            }
        }));
        this._register(editor.onDidChangeModelContent(() => {
            if (this._isVisible) {
                this._beginUpdateDecorationsSoon();
            }
        }));
        this._register(editor.onDidChangeModelOptions((e) => {
            if (e.tabSize) {
                this._updateDecorationsRunner.schedule();
            }
        }));
        return editor;
    }
    _createInnerEditor(instantiationService, container, options) {
        return instantiationService.createInstance(CodeEditorWidget, container, options, {});
    }
    dispose() {
        this._codeEditorService.removeDiffEditor(this);
        if (this._beginUpdateDecorationsTimeout !== -1) {
            window.clearTimeout(this._beginUpdateDecorationsTimeout);
            this._beginUpdateDecorationsTimeout = -1;
        }
        this._cleanViewZonesAndDecorations();
        if (this._originalOverviewRuler) {
            this._overviewDomElement.removeChild(this._originalOverviewRuler.getDomNode());
            this._originalOverviewRuler.dispose();
        }
        if (this._modifiedOverviewRuler) {
            this._overviewDomElement.removeChild(this._modifiedOverviewRuler.getDomNode());
            this._modifiedOverviewRuler.dispose();
        }
        this._overviewDomElement.removeChild(this._overviewViewportDomElement.domNode);
        this._containerDomElement.removeChild(this._overviewDomElement);
        this._containerDomElement.removeChild(this._originalDomNode);
        this.originalEditor.dispose();
        this._containerDomElement.removeChild(this._modifiedDomNode);
        this.modifiedEditor.dispose();
        this._strategy.dispose();
        this._containerDomElement.removeChild(this._reviewPane.domNode.domNode);
        this._containerDomElement.removeChild(this._reviewPane.shadow.domNode);
        this._containerDomElement.removeChild(this._reviewPane.actionBarContainer.domNode);
        this._reviewPane.dispose();
        this._domElement.removeChild(this._containerDomElement);
        this._onDidDispose.fire();
        super.dispose();
    }
    //------------ begin IDiffEditor methods
    getId() {
        return this.getEditorType() + ':' + this.id;
    }
    getEditorType() {
        return editorCommon.EditorType.IDiffEditor;
    }
    getLineChanges() {
        if (!this._diffComputationResult) {
            return null;
        }
        return this._diffComputationResult.changes;
    }
    getOriginalEditor() {
        return this.originalEditor;
    }
    getModifiedEditor() {
        return this.modifiedEditor;
    }
    updateOptions(newOptions) {
        // Handle side by side
        let renderSideBySideChanged = false;
        if (typeof newOptions.renderSideBySide !== 'undefined') {
            if (this._renderSideBySide !== newOptions.renderSideBySide) {
                this._renderSideBySide = newOptions.renderSideBySide;
                renderSideBySideChanged = true;
            }
        }
        if (typeof newOptions.maxComputationTime !== 'undefined') {
            this._maxComputationTime = newOptions.maxComputationTime;
            if (this._isVisible) {
                this._beginUpdateDecorationsSoon();
            }
        }
        let beginUpdateDecorations = false;
        if (typeof newOptions.ignoreTrimWhitespace !== 'undefined') {
            if (this._ignoreTrimWhitespace !== newOptions.ignoreTrimWhitespace) {
                this._ignoreTrimWhitespace = newOptions.ignoreTrimWhitespace;
                // Begin comparing
                beginUpdateDecorations = true;
            }
        }
        if (typeof newOptions.renderIndicators !== 'undefined') {
            if (this._renderIndicators !== newOptions.renderIndicators) {
                this._renderIndicators = newOptions.renderIndicators;
                beginUpdateDecorations = true;
            }
        }
        if (beginUpdateDecorations) {
            this._beginUpdateDecorations();
        }
        if (typeof newOptions.originalEditable !== 'undefined') {
            this._originalIsEditable = Boolean(newOptions.originalEditable);
        }
        this.modifiedEditor.updateOptions(this._adjustOptionsForRightHandSide(newOptions));
        this.originalEditor.updateOptions(this._adjustOptionsForLeftHandSide(newOptions, this._originalIsEditable));
        // enableSplitViewResizing
        if (typeof newOptions.enableSplitViewResizing !== 'undefined') {
            this._enableSplitViewResizing = newOptions.enableSplitViewResizing;
        }
        this._strategy.setEnableSplitViewResizing(this._enableSplitViewResizing);
        // renderSideBySide
        if (renderSideBySideChanged) {
            if (this._renderSideBySide) {
                this._setStrategy(new DiffEditorWidgetSideBySide(this._createDataSource(), this._enableSplitViewResizing));
            }
            else {
                this._setStrategy(new DiffEditorWidgetInline(this._createDataSource(), this._enableSplitViewResizing));
            }
            // Update class name
            this._containerDomElement.className = DiffEditorWidget._getClassName(this._themeService.getColorTheme(), this._renderSideBySide);
        }
    }
    getModel() {
        return {
            original: this.originalEditor.getModel(),
            modified: this.modifiedEditor.getModel()
        };
    }
    setModel(model) {
        // Guard us against partial null model
        if (model && (!model.original || !model.modified)) {
            throw new Error(!model.original ? 'DiffEditorWidget.setModel: Original model is null' : 'DiffEditorWidget.setModel: Modified model is null');
        }
        // Remove all view zones & decorations
        this._cleanViewZonesAndDecorations();
        // Update code editor models
        this.originalEditor.setModel(model ? model.original : null);
        this.modifiedEditor.setModel(model ? model.modified : null);
        this._updateDecorationsRunner.cancel();
        // this.originalEditor.onDidChangeModelOptions
        if (model) {
            this.originalEditor.setScrollTop(0);
            this.modifiedEditor.setScrollTop(0);
        }
        // Disable any diff computations that will come in
        this._diffComputationResult = null;
        this._diffComputationToken++;
        this._setState(0 /* Idle */);
        if (model) {
            this._recreateOverviewRulers();
            // Begin comparing
            this._beginUpdateDecorations();
        }
        this._layoutOverviewViewport();
    }
    getDomNode() {
        return this._domElement;
    }
    getVisibleColumnFromPosition(position) {
        return this.modifiedEditor.getVisibleColumnFromPosition(position);
    }
    getPosition() {
        return this.modifiedEditor.getPosition();
    }
    setPosition(position) {
        this.modifiedEditor.setPosition(position);
    }
    revealLine(lineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLine(lineNumber, scrollType);
    }
    revealLineInCenter(lineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLineInCenter(lineNumber, scrollType);
    }
    revealLineInCenterIfOutsideViewport(lineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLineInCenterIfOutsideViewport(lineNumber, scrollType);
    }
    revealLineNearTop(lineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLineNearTop(lineNumber, scrollType);
    }
    revealPosition(position, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealPosition(position, scrollType);
    }
    revealPositionInCenter(position, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealPositionInCenter(position, scrollType);
    }
    revealPositionInCenterIfOutsideViewport(position, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealPositionInCenterIfOutsideViewport(position, scrollType);
    }
    revealPositionNearTop(position, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealPositionNearTop(position, scrollType);
    }
    getSelection() {
        return this.modifiedEditor.getSelection();
    }
    getSelections() {
        return this.modifiedEditor.getSelections();
    }
    setSelection(something) {
        this.modifiedEditor.setSelection(something);
    }
    setSelections(ranges) {
        this.modifiedEditor.setSelections(ranges);
    }
    revealLines(startLineNumber, endLineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLines(startLineNumber, endLineNumber, scrollType);
    }
    revealLinesInCenter(startLineNumber, endLineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLinesInCenter(startLineNumber, endLineNumber, scrollType);
    }
    revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType);
    }
    revealLinesNearTop(startLineNumber, endLineNumber, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealLinesNearTop(startLineNumber, endLineNumber, scrollType);
    }
    revealRange(range, scrollType = 0 /* Smooth */, revealVerticalInCenter = false, revealHorizontal = true) {
        this.modifiedEditor.revealRange(range, scrollType, revealVerticalInCenter, revealHorizontal);
    }
    revealRangeInCenter(range, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealRangeInCenter(range, scrollType);
    }
    revealRangeInCenterIfOutsideViewport(range, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealRangeInCenterIfOutsideViewport(range, scrollType);
    }
    revealRangeNearTop(range, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealRangeNearTop(range, scrollType);
    }
    revealRangeNearTopIfOutsideViewport(range, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealRangeNearTopIfOutsideViewport(range, scrollType);
    }
    revealRangeAtTop(range, scrollType = 0 /* Smooth */) {
        this.modifiedEditor.revealRangeAtTop(range, scrollType);
    }
    getSupportedActions() {
        return this.modifiedEditor.getSupportedActions();
    }
    saveViewState() {
        let originalViewState = this.originalEditor.saveViewState();
        let modifiedViewState = this.modifiedEditor.saveViewState();
        return {
            original: originalViewState,
            modified: modifiedViewState
        };
    }
    restoreViewState(s) {
        if (s.original && s.modified) {
            let diffEditorState = s;
            this.originalEditor.restoreViewState(diffEditorState.original);
            this.modifiedEditor.restoreViewState(diffEditorState.modified);
        }
    }
    layout(dimension) {
        this._elementSizeObserver.observe(dimension);
    }
    focus() {
        this.modifiedEditor.focus();
    }
    hasTextFocus() {
        return this.originalEditor.hasTextFocus() || this.modifiedEditor.hasTextFocus();
    }
    trigger(source, handlerId, payload) {
        this.modifiedEditor.trigger(source, handlerId, payload);
    }
    changeDecorations(callback) {
        return this.modifiedEditor.changeDecorations(callback);
    }
    //------------ end IDiffEditor methods
    //------------ begin layouting methods
    _onDidContainerSizeChanged() {
        this._doLayout();
    }
    _getReviewHeight() {
        return this._reviewPane.isVisible() ? this._elementSizeObserver.getHeight() : 0;
    }
    _layoutOverviewRulers() {
        if (!this._originalOverviewRuler || !this._modifiedOverviewRuler) {
            return;
        }
        const height = this._elementSizeObserver.getHeight();
        const reviewHeight = this._getReviewHeight();
        let freeSpace = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH - 2 * DiffEditorWidget.ONE_OVERVIEW_WIDTH;
        let layoutInfo = this.modifiedEditor.getLayoutInfo();
        if (layoutInfo) {
            this._originalOverviewRuler.setLayout({
                top: 0,
                width: DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                right: freeSpace + DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                height: (height - reviewHeight)
            });
            this._modifiedOverviewRuler.setLayout({
                top: 0,
                right: 0,
                width: DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                height: (height - reviewHeight)
            });
        }
    }
    //------------ end layouting methods
    _onViewZonesChanged() {
        if (this._currentlyChangingViewZones) {
            return;
        }
        this._updateDecorationsRunner.schedule();
    }
    _beginUpdateDecorationsSoon() {
        // Clear previous timeout if necessary
        if (this._beginUpdateDecorationsTimeout !== -1) {
            window.clearTimeout(this._beginUpdateDecorationsTimeout);
            this._beginUpdateDecorationsTimeout = -1;
        }
        this._beginUpdateDecorationsTimeout = window.setTimeout(() => this._beginUpdateDecorations(), DiffEditorWidget.UPDATE_DIFF_DECORATIONS_DELAY);
    }
    static _equals(a, b) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return (a.toString() === b.toString());
    }
    _beginUpdateDecorations() {
        this._beginUpdateDecorationsTimeout = -1;
        const currentOriginalModel = this.originalEditor.getModel();
        const currentModifiedModel = this.modifiedEditor.getModel();
        if (!currentOriginalModel || !currentModifiedModel) {
            return;
        }
        // Prevent old diff requests to come if a new request has been initiated
        // The best method would be to call cancel on the Promise, but this is not
        // yet supported, so using tokens for now.
        this._diffComputationToken++;
        let currentToken = this._diffComputationToken;
        this._setState(1 /* ComputingDiff */);
        if (!this._editorWorkerService.canComputeDiff(currentOriginalModel.uri, currentModifiedModel.uri)) {
            if (!DiffEditorWidget._equals(currentOriginalModel.uri, this._lastOriginalWarning)
                || !DiffEditorWidget._equals(currentModifiedModel.uri, this._lastModifiedWarning)) {
                this._lastOriginalWarning = currentOriginalModel.uri;
                this._lastModifiedWarning = currentModifiedModel.uri;
                this._notificationService.warn(nls.localize("diff.tooLarge", "Cannot compare files because one file is too large."));
            }
            return;
        }
        this._editorWorkerService.computeDiff(currentOriginalModel.uri, currentModifiedModel.uri, this._ignoreTrimWhitespace, this._maxComputationTime).then((result) => {
            if (currentToken === this._diffComputationToken
                && currentOriginalModel === this.originalEditor.getModel()
                && currentModifiedModel === this.modifiedEditor.getModel()) {
                this._setState(2 /* DiffComputed */);
                this._diffComputationResult = result;
                this._updateDecorationsRunner.schedule();
                this._onDidUpdateDiff.fire();
            }
        }, (error) => {
            if (currentToken === this._diffComputationToken
                && currentOriginalModel === this.originalEditor.getModel()
                && currentModifiedModel === this.modifiedEditor.getModel()) {
                this._setState(2 /* DiffComputed */);
                this._diffComputationResult = null;
                this._updateDecorationsRunner.schedule();
            }
        });
    }
    _cleanViewZonesAndDecorations() {
        this._originalEditorState.clean(this.originalEditor);
        this._modifiedEditorState.clean(this.modifiedEditor);
    }
    _updateDecorations() {
        if (!this.originalEditor.getModel() || !this.modifiedEditor.getModel() || !this._originalOverviewRuler || !this._modifiedOverviewRuler) {
            return;
        }
        const lineChanges = (this._diffComputationResult ? this._diffComputationResult.changes : []);
        let foreignOriginal = this._originalEditorState.getForeignViewZones(this.originalEditor.getWhitespaces());
        let foreignModified = this._modifiedEditorState.getForeignViewZones(this.modifiedEditor.getWhitespaces());
        let diffDecorations = this._strategy.getEditorsDiffDecorations(lineChanges, this._ignoreTrimWhitespace, this._renderIndicators, foreignOriginal, foreignModified, this.originalEditor, this.modifiedEditor);
        try {
            this._currentlyChangingViewZones = true;
            this._originalEditorState.apply(this.originalEditor, this._originalOverviewRuler, diffDecorations.original, false);
            this._modifiedEditorState.apply(this.modifiedEditor, this._modifiedOverviewRuler, diffDecorations.modified, true);
        }
        finally {
            this._currentlyChangingViewZones = false;
        }
    }
    _adjustOptionsForSubEditor(options) {
        let clonedOptions = objects.deepClone(options || {});
        clonedOptions.inDiffEditor = true;
        clonedOptions.wordWrap = 'off';
        clonedOptions.wordWrapMinified = false;
        clonedOptions.automaticLayout = false;
        clonedOptions.scrollbar = clonedOptions.scrollbar || {};
        clonedOptions.scrollbar.vertical = 'visible';
        clonedOptions.folding = false;
        clonedOptions.codeLens = false;
        clonedOptions.fixedOverflowWidgets = true;
        // clonedOptions.lineDecorationsWidth = '2ch';
        if (!clonedOptions.minimap) {
            clonedOptions.minimap = {};
        }
        clonedOptions.minimap.enabled = false;
        return clonedOptions;
    }
    _adjustOptionsForLeftHandSide(options, isEditable) {
        let result = this._adjustOptionsForSubEditor(options);
        result.readOnly = !isEditable;
        result.extraEditorClassName = 'original-in-monaco-diff-editor';
        return result;
    }
    _adjustOptionsForRightHandSide(options) {
        let result = this._adjustOptionsForSubEditor(options);
        result.revealHorizontalRightPadding = EditorOptions.revealHorizontalRightPadding.defaultValue + DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
        result.scrollbar.verticalHasArrows = false;
        result.extraEditorClassName = 'modified-in-monaco-diff-editor';
        return result;
    }
    doLayout() {
        this._elementSizeObserver.observe();
        this._doLayout();
    }
    _doLayout() {
        const width = this._elementSizeObserver.getWidth();
        const height = this._elementSizeObserver.getHeight();
        const reviewHeight = this._getReviewHeight();
        let splitPoint = this._strategy.layout();
        this._originalDomNode.style.width = splitPoint + 'px';
        this._originalDomNode.style.left = '0px';
        this._modifiedDomNode.style.width = (width - splitPoint) + 'px';
        this._modifiedDomNode.style.left = splitPoint + 'px';
        this._overviewDomElement.style.top = '0px';
        this._overviewDomElement.style.height = (height - reviewHeight) + 'px';
        this._overviewDomElement.style.width = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH + 'px';
        this._overviewDomElement.style.left = (width - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH) + 'px';
        this._overviewViewportDomElement.setWidth(DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH);
        this._overviewViewportDomElement.setHeight(30);
        this.originalEditor.layout({ width: splitPoint, height: (height - reviewHeight) });
        this.modifiedEditor.layout({ width: width - splitPoint - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH, height: (height - reviewHeight) });
        if (this._originalOverviewRuler || this._modifiedOverviewRuler) {
            this._layoutOverviewRulers();
        }
        this._reviewPane.layout(height - reviewHeight, width, reviewHeight);
        this._layoutOverviewViewport();
    }
    _layoutOverviewViewport() {
        let layout = this._computeOverviewViewport();
        if (!layout) {
            this._overviewViewportDomElement.setTop(0);
            this._overviewViewportDomElement.setHeight(0);
        }
        else {
            this._overviewViewportDomElement.setTop(layout.top);
            this._overviewViewportDomElement.setHeight(layout.height);
        }
    }
    _computeOverviewViewport() {
        let layoutInfo = this.modifiedEditor.getLayoutInfo();
        if (!layoutInfo) {
            return null;
        }
        let scrollTop = this.modifiedEditor.getScrollTop();
        let scrollHeight = this.modifiedEditor.getScrollHeight();
        let computedAvailableSize = Math.max(0, layoutInfo.height);
        let computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * 0);
        let computedRatio = scrollHeight > 0 ? (computedRepresentableSize / scrollHeight) : 0;
        let computedSliderSize = Math.max(0, Math.floor(layoutInfo.height * computedRatio));
        let computedSliderPosition = Math.floor(scrollTop * computedRatio);
        return {
            height: computedSliderSize,
            top: computedSliderPosition
        };
    }
    _createDataSource() {
        return {
            getWidth: () => {
                return this._elementSizeObserver.getWidth();
            },
            getHeight: () => {
                return (this._elementSizeObserver.getHeight() - this._getReviewHeight());
            },
            getContainerDomNode: () => {
                return this._containerDomElement;
            },
            relayoutEditors: () => {
                this._doLayout();
            },
            getOriginalEditor: () => {
                return this.originalEditor;
            },
            getModifiedEditor: () => {
                return this.modifiedEditor;
            }
        };
    }
    _setStrategy(newStrategy) {
        if (this._strategy) {
            this._strategy.dispose();
        }
        this._strategy = newStrategy;
        newStrategy.applyColors(this._themeService.getColorTheme());
        if (this._diffComputationResult) {
            this._updateDecorations();
        }
        // Just do a layout, the strategy might need it
        this._doLayout();
    }
    _getLineChangeAtOrBeforeLineNumber(lineNumber, startLineNumberExtractor) {
        const lineChanges = (this._diffComputationResult ? this._diffComputationResult.changes : []);
        if (lineChanges.length === 0 || lineNumber < startLineNumberExtractor(lineChanges[0])) {
            // There are no changes or `lineNumber` is before the first change
            return null;
        }
        let min = 0, max = lineChanges.length - 1;
        while (min < max) {
            let mid = Math.floor((min + max) / 2);
            let midStart = startLineNumberExtractor(lineChanges[mid]);
            let midEnd = (mid + 1 <= max ? startLineNumberExtractor(lineChanges[mid + 1]) : 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
            if (lineNumber < midStart) {
                max = mid - 1;
            }
            else if (lineNumber >= midEnd) {
                min = mid + 1;
            }
            else {
                // HIT!
                min = mid;
                max = mid;
            }
        }
        return lineChanges[min];
    }
    _getEquivalentLineForOriginalLineNumber(lineNumber) {
        let lineChange = this._getLineChangeAtOrBeforeLineNumber(lineNumber, (lineChange) => lineChange.originalStartLineNumber);
        if (!lineChange) {
            return lineNumber;
        }
        let originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
        let modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
        let lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
        let lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
        let delta = lineNumber - originalEquivalentLineNumber;
        if (delta <= lineChangeOriginalLength) {
            return modifiedEquivalentLineNumber + Math.min(delta, lineChangeModifiedLength);
        }
        return modifiedEquivalentLineNumber + lineChangeModifiedLength - lineChangeOriginalLength + delta;
    }
    _getEquivalentLineForModifiedLineNumber(lineNumber) {
        let lineChange = this._getLineChangeAtOrBeforeLineNumber(lineNumber, (lineChange) => lineChange.modifiedStartLineNumber);
        if (!lineChange) {
            return lineNumber;
        }
        let originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
        let modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
        let lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
        let lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
        let delta = lineNumber - modifiedEquivalentLineNumber;
        if (delta <= lineChangeModifiedLength) {
            return originalEquivalentLineNumber + Math.min(delta, lineChangeOriginalLength);
        }
        return originalEquivalentLineNumber + lineChangeOriginalLength - lineChangeModifiedLength + delta;
    }
    getDiffLineInformationForOriginal(lineNumber) {
        if (!this._diffComputationResult) {
            // Cannot answer that which I don't know
            return null;
        }
        return {
            equivalentLineNumber: this._getEquivalentLineForOriginalLineNumber(lineNumber)
        };
    }
    getDiffLineInformationForModified(lineNumber) {
        if (!this._diffComputationResult) {
            // Cannot answer that which I don't know
            return null;
        }
        return {
            equivalentLineNumber: this._getEquivalentLineForModifiedLineNumber(lineNumber)
        };
    }
};
DiffEditorWidget.ONE_OVERVIEW_WIDTH = 15;
DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH = 30;
DiffEditorWidget.UPDATE_DIFF_DECORATIONS_DELAY = 200; // ms
DiffEditorWidget = __decorate([
    __param(2, IClipboardService),
    __param(3, IEditorWorkerService),
    __param(4, IContextKeyService),
    __param(5, IInstantiationService),
    __param(6, ICodeEditorService),
    __param(7, IThemeService),
    __param(8, INotificationService),
    __param(9, IContextMenuService),
    __param(10, IEditorProgressService)
], DiffEditorWidget);
export { DiffEditorWidget };
class DiffEditorWidgetStyle extends Disposable {
    constructor(dataSource) {
        super();
        this._dataSource = dataSource;
        this._insertColor = null;
        this._removeColor = null;
    }
    applyColors(theme) {
        let newInsertColor = (theme.getColor(diffInserted) || defaultInsertColor).transparent(2);
        let newRemoveColor = (theme.getColor(diffRemoved) || defaultRemoveColor).transparent(2);
        let hasChanges = !newInsertColor.equals(this._insertColor) || !newRemoveColor.equals(this._removeColor);
        this._insertColor = newInsertColor;
        this._removeColor = newRemoveColor;
        return hasChanges;
    }
    getEditorsDiffDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalWhitespaces, modifiedWhitespaces, originalEditor, modifiedEditor) {
        // Get view zones
        modifiedWhitespaces = modifiedWhitespaces.sort((a, b) => {
            return a.afterLineNumber - b.afterLineNumber;
        });
        originalWhitespaces = originalWhitespaces.sort((a, b) => {
            return a.afterLineNumber - b.afterLineNumber;
        });
        let zones = this._getViewZones(lineChanges, originalWhitespaces, modifiedWhitespaces, originalEditor, modifiedEditor, renderIndicators);
        // Get decorations & overview ruler zones
        let originalDecorations = this._getOriginalEditorDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalEditor, modifiedEditor);
        let modifiedDecorations = this._getModifiedEditorDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalEditor, modifiedEditor);
        return {
            original: {
                decorations: originalDecorations.decorations,
                overviewZones: originalDecorations.overviewZones,
                zones: zones.original
            },
            modified: {
                decorations: modifiedDecorations.decorations,
                overviewZones: modifiedDecorations.overviewZones,
                zones: zones.modified
            }
        };
    }
}
class ForeignViewZonesIterator {
    constructor(source) {
        this._source = source;
        this._index = -1;
        this.current = null;
        this.advance();
    }
    advance() {
        this._index++;
        if (this._index < this._source.length) {
            this.current = this._source[this._index];
        }
        else {
            this.current = null;
        }
    }
}
class ViewZonesComputer {
    constructor(lineChanges, originalForeignVZ, originalLineHeight, modifiedForeignVZ, modifiedLineHeight) {
        this.lineChanges = lineChanges;
        this.originalForeignVZ = originalForeignVZ;
        this.originalLineHeight = originalLineHeight;
        this.modifiedForeignVZ = modifiedForeignVZ;
        this.modifiedLineHeight = modifiedLineHeight;
    }
    getViewZones() {
        let result = {
            original: [],
            modified: []
        };
        let lineChangeModifiedLength = 0;
        let lineChangeOriginalLength = 0;
        let originalEquivalentLineNumber = 0;
        let modifiedEquivalentLineNumber = 0;
        let originalEndEquivalentLineNumber = 0;
        let modifiedEndEquivalentLineNumber = 0;
        let sortMyViewZones = (a, b) => {
            return a.afterLineNumber - b.afterLineNumber;
        };
        let addAndCombineIfPossible = (destination, item) => {
            if (item.domNode === null && destination.length > 0) {
                let lastItem = destination[destination.length - 1];
                if (lastItem.afterLineNumber === item.afterLineNumber && lastItem.domNode === null) {
                    lastItem.heightInLines += item.heightInLines;
                    return;
                }
            }
            destination.push(item);
        };
        let modifiedForeignVZ = new ForeignViewZonesIterator(this.modifiedForeignVZ);
        let originalForeignVZ = new ForeignViewZonesIterator(this.originalForeignVZ);
        // In order to include foreign view zones after the last line change, the for loop will iterate once more after the end of the `lineChanges` array
        for (let i = 0, length = this.lineChanges.length; i <= length; i++) {
            let lineChange = (i < length ? this.lineChanges[i] : null);
            if (lineChange !== null) {
                originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
                modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
                lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
                lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
                originalEndEquivalentLineNumber = Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber);
                modifiedEndEquivalentLineNumber = Math.max(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber);
            }
            else {
                // Increase to very large value to get the producing tests of foreign view zones running
                originalEquivalentLineNumber += 10000000 + lineChangeOriginalLength;
                modifiedEquivalentLineNumber += 10000000 + lineChangeModifiedLength;
                originalEndEquivalentLineNumber = originalEquivalentLineNumber;
                modifiedEndEquivalentLineNumber = modifiedEquivalentLineNumber;
            }
            // Each step produces view zones, and after producing them, we try to cancel them out, to avoid empty-empty view zone cases
            let stepOriginal = [];
            let stepModified = [];
            // ---------------------------- PRODUCE VIEW ZONES
            // [PRODUCE] View zone(s) in original-side due to foreign view zone(s) in modified-side
            while (modifiedForeignVZ.current && modifiedForeignVZ.current.afterLineNumber <= modifiedEndEquivalentLineNumber) {
                let viewZoneLineNumber;
                if (modifiedForeignVZ.current.afterLineNumber <= modifiedEquivalentLineNumber) {
                    viewZoneLineNumber = originalEquivalentLineNumber - modifiedEquivalentLineNumber + modifiedForeignVZ.current.afterLineNumber;
                }
                else {
                    viewZoneLineNumber = originalEndEquivalentLineNumber;
                }
                let marginDomNode = null;
                if (lineChange && lineChange.modifiedStartLineNumber <= modifiedForeignVZ.current.afterLineNumber && modifiedForeignVZ.current.afterLineNumber <= lineChange.modifiedEndLineNumber) {
                    marginDomNode = this._createOriginalMarginDomNodeForModifiedForeignViewZoneInAddedRegion();
                }
                stepOriginal.push({
                    afterLineNumber: viewZoneLineNumber,
                    heightInLines: modifiedForeignVZ.current.height / this.modifiedLineHeight,
                    domNode: null,
                    marginDomNode: marginDomNode
                });
                modifiedForeignVZ.advance();
            }
            // [PRODUCE] View zone(s) in modified-side due to foreign view zone(s) in original-side
            while (originalForeignVZ.current && originalForeignVZ.current.afterLineNumber <= originalEndEquivalentLineNumber) {
                let viewZoneLineNumber;
                if (originalForeignVZ.current.afterLineNumber <= originalEquivalentLineNumber) {
                    viewZoneLineNumber = modifiedEquivalentLineNumber - originalEquivalentLineNumber + originalForeignVZ.current.afterLineNumber;
                }
                else {
                    viewZoneLineNumber = modifiedEndEquivalentLineNumber;
                }
                stepModified.push({
                    afterLineNumber: viewZoneLineNumber,
                    heightInLines: originalForeignVZ.current.height / this.originalLineHeight,
                    domNode: null
                });
                originalForeignVZ.advance();
            }
            if (lineChange !== null && isChangeOrInsert(lineChange)) {
                let r = this._produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength);
                if (r) {
                    stepOriginal.push(r);
                }
            }
            if (lineChange !== null && isChangeOrDelete(lineChange)) {
                let r = this._produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength);
                if (r) {
                    stepModified.push(r);
                }
            }
            // ---------------------------- END PRODUCE VIEW ZONES
            // ---------------------------- EMIT MINIMAL VIEW ZONES
            // [CANCEL & EMIT] Try to cancel view zones out
            let stepOriginalIndex = 0;
            let stepModifiedIndex = 0;
            stepOriginal = stepOriginal.sort(sortMyViewZones);
            stepModified = stepModified.sort(sortMyViewZones);
            while (stepOriginalIndex < stepOriginal.length && stepModifiedIndex < stepModified.length) {
                let original = stepOriginal[stepOriginalIndex];
                let modified = stepModified[stepModifiedIndex];
                let originalDelta = original.afterLineNumber - originalEquivalentLineNumber;
                let modifiedDelta = modified.afterLineNumber - modifiedEquivalentLineNumber;
                if (originalDelta < modifiedDelta) {
                    addAndCombineIfPossible(result.original, original);
                    stepOriginalIndex++;
                }
                else if (modifiedDelta < originalDelta) {
                    addAndCombineIfPossible(result.modified, modified);
                    stepModifiedIndex++;
                }
                else if (original.shouldNotShrink) {
                    addAndCombineIfPossible(result.original, original);
                    stepOriginalIndex++;
                }
                else if (modified.shouldNotShrink) {
                    addAndCombineIfPossible(result.modified, modified);
                    stepModifiedIndex++;
                }
                else {
                    if (original.heightInLines >= modified.heightInLines) {
                        // modified view zone gets removed
                        original.heightInLines -= modified.heightInLines;
                        stepModifiedIndex++;
                    }
                    else {
                        // original view zone gets removed
                        modified.heightInLines -= original.heightInLines;
                        stepOriginalIndex++;
                    }
                }
            }
            // [EMIT] Remaining original view zones
            while (stepOriginalIndex < stepOriginal.length) {
                addAndCombineIfPossible(result.original, stepOriginal[stepOriginalIndex]);
                stepOriginalIndex++;
            }
            // [EMIT] Remaining modified view zones
            while (stepModifiedIndex < stepModified.length) {
                addAndCombineIfPossible(result.modified, stepModified[stepModifiedIndex]);
                stepModifiedIndex++;
            }
            // ---------------------------- END EMIT MINIMAL VIEW ZONES
        }
        return {
            original: ViewZonesComputer._ensureDomNodes(result.original),
            modified: ViewZonesComputer._ensureDomNodes(result.modified),
        };
    }
    static _ensureDomNodes(zones) {
        return zones.map((z) => {
            if (!z.domNode) {
                z.domNode = createFakeLinesDiv();
            }
            return z;
        });
    }
}
function createDecoration(startLineNumber, startColumn, endLineNumber, endColumn, options) {
    return {
        range: new Range(startLineNumber, startColumn, endLineNumber, endColumn),
        options: options
    };
}
const DECORATIONS = {
    charDelete: ModelDecorationOptions.register({
        className: 'char-delete'
    }),
    charDeleteWholeLine: ModelDecorationOptions.register({
        className: 'char-delete',
        isWholeLine: true
    }),
    charInsert: ModelDecorationOptions.register({
        className: 'char-insert'
    }),
    charInsertWholeLine: ModelDecorationOptions.register({
        className: 'char-insert',
        isWholeLine: true
    }),
    lineInsert: ModelDecorationOptions.register({
        className: 'line-insert',
        marginClassName: 'line-insert',
        isWholeLine: true
    }),
    lineInsertWithSign: ModelDecorationOptions.register({
        className: 'line-insert',
        linesDecorationsClassName: 'insert-sign ' + diffInsertIcon.classNames,
        marginClassName: 'line-insert',
        isWholeLine: true
    }),
    lineDelete: ModelDecorationOptions.register({
        className: 'line-delete',
        marginClassName: 'line-delete',
        isWholeLine: true
    }),
    lineDeleteWithSign: ModelDecorationOptions.register({
        className: 'line-delete',
        linesDecorationsClassName: 'delete-sign ' + diffRemoveIcon.classNames,
        marginClassName: 'line-delete',
        isWholeLine: true
    }),
    lineDeleteMargin: ModelDecorationOptions.register({
        marginClassName: 'line-delete',
    })
};
class DiffEditorWidgetSideBySide extends DiffEditorWidgetStyle {
    constructor(dataSource, enableSplitViewResizing) {
        super(dataSource);
        this._disableSash = (enableSplitViewResizing === false);
        this._sashRatio = null;
        this._sashPosition = null;
        this._startSashPosition = null;
        this._sash = this._register(new Sash(this._dataSource.getContainerDomNode(), this, { orientation: 0 /* VERTICAL */ }));
        if (this._disableSash) {
            this._sash.state = 0 /* Disabled */;
        }
        this._sash.onDidStart(() => this.onSashDragStart());
        this._sash.onDidChange((e) => this.onSashDrag(e));
        this._sash.onDidEnd(() => this.onSashDragEnd());
        this._sash.onDidReset(() => this.onSashReset());
    }
    setEnableSplitViewResizing(enableSplitViewResizing) {
        let newDisableSash = (enableSplitViewResizing === false);
        if (this._disableSash !== newDisableSash) {
            this._disableSash = newDisableSash;
            this._sash.state = this._disableSash ? 0 /* Disabled */ : 3 /* Enabled */;
        }
    }
    layout(sashRatio = this._sashRatio) {
        let w = this._dataSource.getWidth();
        let contentWidth = w - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
        let sashPosition = Math.floor((sashRatio || 0.5) * contentWidth);
        let midPoint = Math.floor(0.5 * contentWidth);
        sashPosition = this._disableSash ? midPoint : sashPosition || midPoint;
        if (contentWidth > DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH * 2) {
            if (sashPosition < DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH) {
                sashPosition = DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH;
            }
            if (sashPosition > contentWidth - DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH) {
                sashPosition = contentWidth - DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH;
            }
        }
        else {
            sashPosition = midPoint;
        }
        if (this._sashPosition !== sashPosition) {
            this._sashPosition = sashPosition;
            this._sash.layout();
        }
        return this._sashPosition;
    }
    onSashDragStart() {
        this._startSashPosition = this._sashPosition;
    }
    onSashDrag(e) {
        let w = this._dataSource.getWidth();
        let contentWidth = w - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
        let sashPosition = this.layout((this._startSashPosition + (e.currentX - e.startX)) / contentWidth);
        this._sashRatio = sashPosition / contentWidth;
        this._dataSource.relayoutEditors();
    }
    onSashDragEnd() {
        this._sash.layout();
    }
    onSashReset() {
        this._sashRatio = 0.5;
        this._dataSource.relayoutEditors();
        this._sash.layout();
    }
    getVerticalSashTop(sash) {
        return 0;
    }
    getVerticalSashLeft(sash) {
        return this._sashPosition;
    }
    getVerticalSashHeight(sash) {
        return this._dataSource.getHeight();
    }
    _getViewZones(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor) {
        let c = new SideBySideViewZonesComputer(lineChanges, originalForeignVZ, originalEditor.getOption(51 /* lineHeight */), modifiedForeignVZ, modifiedEditor.getOption(51 /* lineHeight */));
        return c.getViewZones();
    }
    _getOriginalEditorDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalEditor, modifiedEditor) {
        const overviewZoneColor = String(this._removeColor);
        let result = {
            decorations: [],
            overviewZones: []
        };
        let originalModel = originalEditor.getModel();
        for (let i = 0, length = lineChanges.length; i < length; i++) {
            let lineChange = lineChanges[i];
            if (isChangeOrDelete(lineChange)) {
                result.decorations.push({
                    range: new Range(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */),
                    options: (renderIndicators ? DECORATIONS.lineDeleteWithSign : DECORATIONS.lineDelete)
                });
                if (!isChangeOrInsert(lineChange) || !lineChange.charChanges) {
                    result.decorations.push(createDecoration(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, DECORATIONS.charDeleteWholeLine));
                }
                result.overviewZones.push(new OverviewRulerZone(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber, overviewZoneColor));
                if (lineChange.charChanges) {
                    for (let j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                        let charChange = lineChange.charChanges[j];
                        if (isChangeOrDelete(charChange)) {
                            if (ignoreTrimWhitespace) {
                                for (let lineNumber = charChange.originalStartLineNumber; lineNumber <= charChange.originalEndLineNumber; lineNumber++) {
                                    let startColumn;
                                    let endColumn;
                                    if (lineNumber === charChange.originalStartLineNumber) {
                                        startColumn = charChange.originalStartColumn;
                                    }
                                    else {
                                        startColumn = originalModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                    }
                                    if (lineNumber === charChange.originalEndLineNumber) {
                                        endColumn = charChange.originalEndColumn;
                                    }
                                    else {
                                        endColumn = originalModel.getLineLastNonWhitespaceColumn(lineNumber);
                                    }
                                    result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, DECORATIONS.charDelete));
                                }
                            }
                            else {
                                result.decorations.push(createDecoration(charChange.originalStartLineNumber, charChange.originalStartColumn, charChange.originalEndLineNumber, charChange.originalEndColumn, DECORATIONS.charDelete));
                            }
                        }
                    }
                }
            }
        }
        return result;
    }
    _getModifiedEditorDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalEditor, modifiedEditor) {
        const overviewZoneColor = String(this._insertColor);
        let result = {
            decorations: [],
            overviewZones: []
        };
        let modifiedModel = modifiedEditor.getModel();
        for (let i = 0, length = lineChanges.length; i < length; i++) {
            let lineChange = lineChanges[i];
            if (isChangeOrInsert(lineChange)) {
                result.decorations.push({
                    range: new Range(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */),
                    options: (renderIndicators ? DECORATIONS.lineInsertWithSign : DECORATIONS.lineInsert)
                });
                if (!isChangeOrDelete(lineChange) || !lineChange.charChanges) {
                    result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, DECORATIONS.charInsertWholeLine));
                }
                result.overviewZones.push(new OverviewRulerZone(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber, overviewZoneColor));
                if (lineChange.charChanges) {
                    for (let j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                        let charChange = lineChange.charChanges[j];
                        if (isChangeOrInsert(charChange)) {
                            if (ignoreTrimWhitespace) {
                                for (let lineNumber = charChange.modifiedStartLineNumber; lineNumber <= charChange.modifiedEndLineNumber; lineNumber++) {
                                    let startColumn;
                                    let endColumn;
                                    if (lineNumber === charChange.modifiedStartLineNumber) {
                                        startColumn = charChange.modifiedStartColumn;
                                    }
                                    else {
                                        startColumn = modifiedModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                    }
                                    if (lineNumber === charChange.modifiedEndLineNumber) {
                                        endColumn = charChange.modifiedEndColumn;
                                    }
                                    else {
                                        endColumn = modifiedModel.getLineLastNonWhitespaceColumn(lineNumber);
                                    }
                                    result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, DECORATIONS.charInsert));
                                }
                            }
                            else {
                                result.decorations.push(createDecoration(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn, DECORATIONS.charInsert));
                            }
                        }
                    }
                }
            }
        }
        return result;
    }
}
DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH = 100;
class SideBySideViewZonesComputer extends ViewZonesComputer {
    constructor(lineChanges, originalForeignVZ, originalLineHeight, modifiedForeignVZ, modifiedLineHeight) {
        super(lineChanges, originalForeignVZ, originalLineHeight, modifiedForeignVZ, modifiedLineHeight);
    }
    _createOriginalMarginDomNodeForModifiedForeignViewZoneInAddedRegion() {
        return null;
    }
    _produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
        if (lineChangeModifiedLength > lineChangeOriginalLength) {
            return {
                afterLineNumber: Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
                heightInLines: (lineChangeModifiedLength - lineChangeOriginalLength),
                domNode: null
            };
        }
        return null;
    }
    _produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
        if (lineChangeOriginalLength > lineChangeModifiedLength) {
            return {
                afterLineNumber: Math.max(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber),
                heightInLines: (lineChangeOriginalLength - lineChangeModifiedLength),
                domNode: null
            };
        }
        return null;
    }
}
class DiffEditorWidgetInline extends DiffEditorWidgetStyle {
    constructor(dataSource, enableSplitViewResizing) {
        super(dataSource);
        this.decorationsLeft = dataSource.getOriginalEditor().getLayoutInfo().decorationsLeft;
        this._register(dataSource.getOriginalEditor().onDidLayoutChange((layoutInfo) => {
            if (this.decorationsLeft !== layoutInfo.decorationsLeft) {
                this.decorationsLeft = layoutInfo.decorationsLeft;
                dataSource.relayoutEditors();
            }
        }));
    }
    setEnableSplitViewResizing(enableSplitViewResizing) {
        // Nothing to do..
    }
    _getViewZones(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor, renderIndicators) {
        let computer = new InlineViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor, renderIndicators);
        return computer.getViewZones();
    }
    _getOriginalEditorDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalEditor, modifiedEditor) {
        const overviewZoneColor = String(this._removeColor);
        let result = {
            decorations: [],
            overviewZones: []
        };
        for (let i = 0, length = lineChanges.length; i < length; i++) {
            let lineChange = lineChanges[i];
            // Add overview zones in the overview ruler
            if (isChangeOrDelete(lineChange)) {
                result.decorations.push({
                    range: new Range(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */),
                    options: DECORATIONS.lineDeleteMargin
                });
                result.overviewZones.push(new OverviewRulerZone(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber, overviewZoneColor));
            }
        }
        return result;
    }
    _getModifiedEditorDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalEditor, modifiedEditor) {
        const overviewZoneColor = String(this._insertColor);
        let result = {
            decorations: [],
            overviewZones: []
        };
        let modifiedModel = modifiedEditor.getModel();
        for (let i = 0, length = lineChanges.length; i < length; i++) {
            let lineChange = lineChanges[i];
            // Add decorations & overview zones
            if (isChangeOrInsert(lineChange)) {
                result.decorations.push({
                    range: new Range(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */),
                    options: (renderIndicators ? DECORATIONS.lineInsertWithSign : DECORATIONS.lineInsert)
                });
                result.overviewZones.push(new OverviewRulerZone(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber, overviewZoneColor));
                if (lineChange.charChanges) {
                    for (let j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                        let charChange = lineChange.charChanges[j];
                        if (isChangeOrInsert(charChange)) {
                            if (ignoreTrimWhitespace) {
                                for (let lineNumber = charChange.modifiedStartLineNumber; lineNumber <= charChange.modifiedEndLineNumber; lineNumber++) {
                                    let startColumn;
                                    let endColumn;
                                    if (lineNumber === charChange.modifiedStartLineNumber) {
                                        startColumn = charChange.modifiedStartColumn;
                                    }
                                    else {
                                        startColumn = modifiedModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                    }
                                    if (lineNumber === charChange.modifiedEndLineNumber) {
                                        endColumn = charChange.modifiedEndColumn;
                                    }
                                    else {
                                        endColumn = modifiedModel.getLineLastNonWhitespaceColumn(lineNumber);
                                    }
                                    result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, DECORATIONS.charInsert));
                                }
                            }
                            else {
                                result.decorations.push(createDecoration(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn, DECORATIONS.charInsert));
                            }
                        }
                    }
                }
                else {
                    result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */, DECORATIONS.charInsertWholeLine));
                }
            }
        }
        return result;
    }
    layout() {
        // An editor should not be smaller than 5px
        return Math.max(5, this.decorationsLeft);
    }
}
class InlineViewZonesComputer extends ViewZonesComputer {
    constructor(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor, renderIndicators) {
        super(lineChanges, originalForeignVZ, originalEditor.getOption(51 /* lineHeight */), modifiedForeignVZ, modifiedEditor.getOption(51 /* lineHeight */));
        this.originalModel = originalEditor.getModel();
        this.modifiedEditorOptions = modifiedEditor.getOptions();
        this.modifiedEditorTabSize = modifiedEditor.getModel().getOptions().tabSize;
        this.renderIndicators = renderIndicators;
    }
    _createOriginalMarginDomNodeForModifiedForeignViewZoneInAddedRegion() {
        let result = document.createElement('div');
        result.className = 'inline-added-margin-view-zone';
        return result;
    }
    _produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
        let marginDomNode = document.createElement('div');
        marginDomNode.className = 'inline-added-margin-view-zone';
        return {
            afterLineNumber: Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
            heightInLines: lineChangeModifiedLength,
            domNode: document.createElement('div'),
            marginDomNode: marginDomNode
        };
    }
    _produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
        let decorations = [];
        if (lineChange.charChanges) {
            for (let j = 0, lengthJ = lineChange.charChanges.length; j < lengthJ; j++) {
                let charChange = lineChange.charChanges[j];
                if (isChangeOrDelete(charChange)) {
                    decorations.push(new InlineDecoration(new Range(charChange.originalStartLineNumber, charChange.originalStartColumn, charChange.originalEndLineNumber, charChange.originalEndColumn), 'char-delete', 0 /* Regular */));
                }
            }
        }
        let sb = createStringBuilder(10000);
        let marginHTML = [];
        const layoutInfo = this.modifiedEditorOptions.get(116 /* layoutInfo */);
        const fontInfo = this.modifiedEditorOptions.get(36 /* fontInfo */);
        const lineDecorationsWidth = layoutInfo.decorationsWidth;
        let lineHeight = this.modifiedEditorOptions.get(51 /* lineHeight */);
        const typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
        let maxCharsPerLine = 0;
        const originalContent = [];
        for (let lineNumber = lineChange.originalStartLineNumber; lineNumber <= lineChange.originalEndLineNumber; lineNumber++) {
            maxCharsPerLine = Math.max(maxCharsPerLine, this._renderOriginalLine(lineNumber - lineChange.originalStartLineNumber, this.originalModel, this.modifiedEditorOptions, this.modifiedEditorTabSize, lineNumber, decorations, sb));
            originalContent.push(this.originalModel.getLineContent(lineNumber));
            if (this.renderIndicators) {
                let index = lineNumber - lineChange.originalStartLineNumber;
                marginHTML = marginHTML.concat([
                    `<div class="delete-sign ${diffRemoveIcon.classNames}" style="position:absolute;top:${index * lineHeight}px;width:${lineDecorationsWidth}px;height:${lineHeight}px;right:0;"></div>`
                ]);
            }
        }
        maxCharsPerLine += this.modifiedEditorOptions.get(85 /* scrollBeyondLastColumn */);
        let domNode = document.createElement('div');
        domNode.className = `view-lines line-delete ${MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`;
        domNode.innerHTML = sb.build();
        Configuration.applyFontInfoSlow(domNode, fontInfo);
        let marginDomNode = document.createElement('div');
        marginDomNode.className = 'inline-deleted-margin-view-zone';
        marginDomNode.innerHTML = marginHTML.join('');
        Configuration.applyFontInfoSlow(marginDomNode, fontInfo);
        return {
            shouldNotShrink: true,
            afterLineNumber: (lineChange.modifiedEndLineNumber === 0 ? lineChange.modifiedStartLineNumber : lineChange.modifiedStartLineNumber - 1),
            heightInLines: lineChangeOriginalLength,
            minWidthInPx: (maxCharsPerLine * typicalHalfwidthCharacterWidth),
            domNode: domNode,
            marginDomNode: marginDomNode,
            diff: {
                originalStartLineNumber: lineChange.originalStartLineNumber,
                originalEndLineNumber: lineChange.originalEndLineNumber,
                modifiedStartLineNumber: lineChange.modifiedStartLineNumber,
                modifiedEndLineNumber: lineChange.modifiedEndLineNumber,
                originalContent: originalContent
            }
        };
    }
    _renderOriginalLine(count, originalModel, options, tabSize, lineNumber, decorations, sb) {
        const lineTokens = originalModel.getLineTokens(lineNumber);
        const lineContent = lineTokens.getLineContent();
        const fontInfo = options.get(36 /* fontInfo */);
        const actualDecorations = LineDecoration.filter(decorations, lineNumber, 1, lineContent.length + 1);
        sb.appendASCIIString('<div class="view-line');
        if (decorations.length === 0) {
            // No char changes
            sb.appendASCIIString(' char-delete');
        }
        sb.appendASCIIString('" style="top:');
        sb.appendASCIIString(String(count * options.get(51 /* lineHeight */)));
        sb.appendASCIIString('px;width:1000000px;">');
        const isBasicASCII = ViewLineRenderingData.isBasicASCII(lineContent, originalModel.mightContainNonBasicASCII());
        const containsRTL = ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, originalModel.mightContainRTL());
        const output = renderViewLine(new RenderLineInput((fontInfo.isMonospace && !options.get(24 /* disableMonospaceOptimizations */)), fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, actualDecorations, tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, options.get(95 /* stopRenderingLineAfter */), options.get(80 /* renderWhitespace */), options.get(74 /* renderControlCharacters */), options.get(37 /* fontLigatures */) !== EditorFontLigatures.OFF, null // Send no selections, original line cannot be selected
        ), sb);
        sb.appendASCIIString('</div>');
        const absoluteOffsets = output.characterMapping.getAbsoluteOffsets();
        return absoluteOffsets.length > 0 ? absoluteOffsets[absoluteOffsets.length - 1] : 0;
    }
}
function isChangeOrInsert(lineChange) {
    return lineChange.modifiedEndLineNumber > 0;
}
function isChangeOrDelete(lineChange) {
    return lineChange.originalEndLineNumber > 0;
}
function createFakeLinesDiv() {
    let r = document.createElement('div');
    r.className = 'diagonal-fill';
    return r;
}
registerThemingParticipant((theme, collector) => {
    const added = theme.getColor(diffInserted);
    if (added) {
        collector.addRule(`.monaco-editor .line-insert, .monaco-editor .char-insert { background-color: ${added}; }`);
        collector.addRule(`.monaco-diff-editor .line-insert, .monaco-diff-editor .char-insert { background-color: ${added}; }`);
        collector.addRule(`.monaco-editor .inline-added-margin-view-zone { background-color: ${added}; }`);
    }
    const removed = theme.getColor(diffRemoved);
    if (removed) {
        collector.addRule(`.monaco-editor .line-delete, .monaco-editor .char-delete { background-color: ${removed}; }`);
        collector.addRule(`.monaco-diff-editor .line-delete, .monaco-diff-editor .char-delete { background-color: ${removed}; }`);
        collector.addRule(`.monaco-editor .inline-deleted-margin-view-zone { background-color: ${removed}; }`);
    }
    const addedOutline = theme.getColor(diffInsertedOutline);
    if (addedOutline) {
        collector.addRule(`.monaco-editor .line-insert, .monaco-editor .char-insert { border: 1px ${theme.type === 'hc' ? 'dashed' : 'solid'} ${addedOutline}; }`);
    }
    const removedOutline = theme.getColor(diffRemovedOutline);
    if (removedOutline) {
        collector.addRule(`.monaco-editor .line-delete, .monaco-editor .char-delete { border: 1px ${theme.type === 'hc' ? 'dashed' : 'solid'} ${removedOutline}; }`);
    }
    const shadow = theme.getColor(scrollbarShadow);
    if (shadow) {
        collector.addRule(`.monaco-diff-editor.side-by-side .editor.modified { box-shadow: -6px 0 5px -5px ${shadow}; }`);
    }
    const border = theme.getColor(diffBorder);
    if (border) {
        collector.addRule(`.monaco-diff-editor.side-by-side .editor.modified { border-left: 1px solid ${border}; }`);
    }
    const scrollbarSliderBackgroundColor = theme.getColor(scrollbarSliderBackground);
    if (scrollbarSliderBackgroundColor) {
        collector.addRule(`
			.monaco-diff-editor .diffViewport {
				background: ${scrollbarSliderBackgroundColor};
			}
		`);
    }
    const scrollbarSliderHoverBackgroundColor = theme.getColor(scrollbarSliderHoverBackground);
    if (scrollbarSliderHoverBackgroundColor) {
        collector.addRule(`
			.monaco-diff-editor .diffViewport:hover {
				background: ${scrollbarSliderHoverBackgroundColor};
			}
		`);
    }
    const scrollbarSliderActiveBackgroundColor = theme.getColor(scrollbarSliderActiveBackground);
    if (scrollbarSliderActiveBackgroundColor) {
        collector.addRule(`
			.monaco-diff-editor .diffViewport:active {
				background: ${scrollbarSliderActiveBackgroundColor};
			}
		`);
    }
    const diffDiagonalFillColor = theme.getColor(diffDiagonalFill);
    collector.addRule(`
	.monaco-editor .diagonal-fill {
		background-image: linear-gradient(
			-45deg,
			${diffDiagonalFillColor} 12.5%,
			#0000 12.5%, #0000 50%,
			${diffDiagonalFillColor} 50%, ${diffDiagonalFillColor} 62.5%,
			#0000 62.5%, #0000 100%
		);
		background-size: 8px 8px;
	}
	`);
});
