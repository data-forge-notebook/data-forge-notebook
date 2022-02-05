/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as nls from '../../../nls.js';
import * as dom from '../../../base/browser/dom.js';
import { CancellationToken } from '../../../base/common/cancellation.js';
import { Color, RGBA } from '../../../base/common/color.js';
import { MarkdownString, isEmptyMarkdownString, markedStringsEquals } from '../../../base/common/htmlContent.js';
import { toDisposable, DisposableStore, combinedDisposable, MutableDisposable } from '../../../base/common/lifecycle.js';
import { Position } from '../../common/core/position.js';
import { Range } from '../../common/core/range.js';
import { ModelDecorationOptions } from '../../common/model/textModel.js';
import { HoverProviderRegistry, TokenizationRegistry } from '../../common/modes.js';
import { getColorPresentations } from '../colorPicker/color.js';
import { ColorDetector } from '../colorPicker/colorDetector.js';
import { ColorPickerModel } from '../colorPicker/colorPickerModel.js';
import { ColorPickerWidget } from '../colorPicker/colorPickerWidget.js';
import { getHover } from './getHover.js';
import { HoverOperation } from './hoverOperation.js';
import { ContentHoverWidget } from './hoverWidgets.js';
import { MarkdownRenderer } from '../markdown/markdownRenderer.js';
import { registerThemingParticipant } from '../../../platform/theme/common/themeService.js';
import { coalesce, isNonEmptyArray, asArray } from '../../../base/common/arrays.js';
import { IMarkerData, MarkerSeverity } from '../../../platform/markers/common/markers.js';
import { basename } from '../../../base/common/resources.js';
import { onUnexpectedError } from '../../../base/common/errors.js';
import { NullOpenerService } from '../../../platform/opener/common/opener.js';
import { MarkerController, NextMarkerAction } from '../gotoError/gotoError.js';
import { createCancelablePromise } from '../../../base/common/async.js';
import { getCodeActions } from '../codeAction/codeAction.js';
import { QuickFixAction, QuickFixController } from '../codeAction/codeActionCommands.js';
import { CodeActionKind } from '../codeAction/types.js';
import { textLinkForeground } from '../../../platform/theme/common/colorRegistry.js';
import { Progress } from '../../../platform/progress/common/progress.js';
const $ = dom.$;
class ColorHover {
    constructor(range, color, provider) {
        this.range = range;
        this.color = color;
        this.provider = provider;
    }
}
class MarkerHover {
    constructor(range, marker) {
        this.range = range;
        this.marker = marker;
    }
}
class ModesContentComputer {
    constructor(editor, _markerDecorationsService) {
        this._markerDecorationsService = _markerDecorationsService;
        this._editor = editor;
        this._result = [];
    }
    setRange(range) {
        this._range = range;
        this._result = [];
    }
    clearResult() {
        this._result = [];
    }
    computeAsync(token) {
        if (!this._editor.hasModel() || !this._range) {
            return Promise.resolve([]);
        }
        const model = this._editor.getModel();
        if (!HoverProviderRegistry.has(model)) {
            return Promise.resolve([]);
        }
        return getHover(model, new Position(this._range.startLineNumber, this._range.startColumn), token);
    }
    computeSync() {
        if (!this._editor.hasModel() || !this._range) {
            return [];
        }
        const model = this._editor.getModel();
        const lineNumber = this._range.startLineNumber;
        if (lineNumber > this._editor.getModel().getLineCount()) {
            // Illegal line number => no results
            return [];
        }
        const colorDetector = ColorDetector.get(this._editor);
        const maxColumn = model.getLineMaxColumn(lineNumber);
        const lineDecorations = this._editor.getLineDecorations(lineNumber);
        let didFindColor = false;
        const hoverRange = this._range;
        const result = lineDecorations.map((d) => {
            const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
            const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
            if (startColumn > hoverRange.startColumn || hoverRange.endColumn > endColumn) {
                return null;
            }
            const range = new Range(hoverRange.startLineNumber, startColumn, hoverRange.startLineNumber, endColumn);
            const marker = this._markerDecorationsService.getMarker(model, d);
            if (marker) {
                return new MarkerHover(range, marker);
            }
            const colorData = colorDetector.getColorData(d.range.getStartPosition());
            if (!didFindColor && colorData) {
                didFindColor = true;
                const { color, range } = colorData.colorInfo;
                return new ColorHover(range, color, colorData.provider);
            }
            else {
                if (isEmptyMarkdownString(d.options.hoverMessage)) {
                    return null;
                }
                const contents = d.options.hoverMessage ? asArray(d.options.hoverMessage) : [];
                return { contents, range };
            }
        });
        return coalesce(result);
    }
    onResult(result, isFromSynchronousComputation) {
        // Always put synchronous messages before asynchronous ones
        if (isFromSynchronousComputation) {
            this._result = result.concat(this._result.sort((a, b) => {
                if (a instanceof ColorHover) { // sort picker messages at to the top
                    return -1;
                }
                else if (b instanceof ColorHover) {
                    return 1;
                }
                return 0;
            }));
        }
        else {
            this._result = this._result.concat(result);
        }
    }
    getResult() {
        return this._result.slice(0);
    }
    getResultWithLoadingMessage() {
        return this._result.slice(0).concat([this._getLoadingMessage()]);
    }
    _getLoadingMessage() {
        return {
            range: this._range,
            contents: [new MarkdownString().appendText(nls.localize('modesContentHover.loading', "Loading..."))]
        };
    }
}
const markerCodeActionTrigger = {
    type: 2 /* Manual */,
    filter: { include: CodeActionKind.QuickFix }
};
export class ModesContentHoverWidget extends ContentHoverWidget {
    constructor(editor, _hoverVisibleKey, markerDecorationsService, keybindingService, _themeService, _modeService, _openerService = NullOpenerService) {
        super(ModesContentHoverWidget.ID, editor, _hoverVisibleKey, keybindingService);
        this._themeService = _themeService;
        this._modeService = _modeService;
        this._openerService = _openerService;
        this.renderDisposable = this._register(new MutableDisposable());
        this._messages = [];
        this._lastRange = null;
        this._computer = new ModesContentComputer(this._editor, markerDecorationsService);
        this._highlightDecorations = [];
        this._isChangingDecorations = false;
        this._shouldFocus = false;
        this._colorPicker = null;
        this._hoverOperation = new HoverOperation(this._computer, result => this._withResult(result, true), null, result => this._withResult(result, false), this._editor.getOption(46 /* hover */).delay);
        this._register(dom.addStandardDisposableListener(this.getDomNode(), dom.EventType.FOCUS, () => {
            if (this._colorPicker) {
                dom.addClass(this.getDomNode(), 'colorpicker-hover');
            }
        }));
        this._register(dom.addStandardDisposableListener(this.getDomNode(), dom.EventType.BLUR, () => {
            dom.removeClass(this.getDomNode(), 'colorpicker-hover');
        }));
        this._register(editor.onDidChangeConfiguration((e) => {
            this._hoverOperation.setHoverTime(this._editor.getOption(46 /* hover */).delay);
        }));
        this._register(TokenizationRegistry.onDidChange((e) => {
            if (this.isVisible && this._lastRange && this._messages.length > 0) {
                this._hover.contentsDomNode.textContent = '';
                this._renderMessages(this._lastRange, this._messages);
            }
        }));
    }
    dispose() {
        this._hoverOperation.cancel();
        super.dispose();
    }
    onModelDecorationsChanged() {
        if (this._isChangingDecorations) {
            return;
        }
        if (this.isVisible) {
            // The decorations have changed and the hover is visible,
            // we need to recompute the displayed text
            this._hoverOperation.cancel();
            this._computer.clearResult();
            if (!this._colorPicker) { // TODO@Michel ensure that displayed text for other decorations is computed even if color picker is in place
                this._hoverOperation.start(0 /* Delayed */);
            }
        }
    }
    startShowingAt(range, mode, focus) {
        if (this._lastRange && this._lastRange.equalsRange(range)) {
            // We have to show the widget at the exact same range as before, so no work is needed
            return;
        }
        this._hoverOperation.cancel();
        if (this.isVisible) {
            // The range might have changed, but the hover is visible
            // Instead of hiding it completely, filter out messages that are still in the new range and
            // kick off a new computation
            if (!this._showAtPosition || this._showAtPosition.lineNumber !== range.startLineNumber) {
                this.hide();
            }
            else {
                let filteredMessages = [];
                for (let i = 0, len = this._messages.length; i < len; i++) {
                    const msg = this._messages[i];
                    const rng = msg.range;
                    if (rng && rng.startColumn <= range.startColumn && rng.endColumn >= range.endColumn) {
                        filteredMessages.push(msg);
                    }
                }
                if (filteredMessages.length > 0) {
                    if (hoverContentsEquals(filteredMessages, this._messages)) {
                        return;
                    }
                    this._renderMessages(range, filteredMessages);
                }
                else {
                    this.hide();
                }
            }
        }
        this._lastRange = range;
        this._computer.setRange(range);
        this._shouldFocus = focus;
        this._hoverOperation.start(mode);
    }
    hide() {
        this._lastRange = null;
        this._hoverOperation.cancel();
        super.hide();
        this._isChangingDecorations = true;
        this._highlightDecorations = this._editor.deltaDecorations(this._highlightDecorations, []);
        this._isChangingDecorations = false;
        this.renderDisposable.clear();
        this._colorPicker = null;
    }
    isColorPickerVisible() {
        if (this._colorPicker) {
            return true;
        }
        return false;
    }
    _withResult(result, complete) {
        this._messages = result;
        if (this._lastRange && this._messages.length > 0) {
            this._renderMessages(this._lastRange, this._messages);
        }
        else if (complete) {
            this.hide();
        }
    }
    _renderMessages(renderRange, messages) {
        this.renderDisposable.dispose();
        this._colorPicker = null;
        // update column from which to show
        let renderColumn = 1073741824 /* MAX_SAFE_SMALL_INTEGER */;
        let highlightRange = messages[0].range ? Range.lift(messages[0].range) : null;
        let fragment = document.createDocumentFragment();
        let isEmptyHoverContent = true;
        let containColorPicker = false;
        const markdownDisposeables = new DisposableStore();
        const markerMessages = [];
        messages.forEach((msg) => {
            if (!msg.range) {
                return;
            }
            renderColumn = Math.min(renderColumn, msg.range.startColumn);
            highlightRange = highlightRange ? Range.plusRange(highlightRange, msg.range) : Range.lift(msg.range);
            if (msg instanceof ColorHover) {
                containColorPicker = true;
                const { red, green, blue, alpha } = msg.color;
                const rgba = new RGBA(Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), alpha);
                const color = new Color(rgba);
                if (!this._editor.hasModel()) {
                    return;
                }
                const editorModel = this._editor.getModel();
                let range = new Range(msg.range.startLineNumber, msg.range.startColumn, msg.range.endLineNumber, msg.range.endColumn);
                let colorInfo = { range: msg.range, color: msg.color };
                // create blank olor picker model and widget first to ensure it's positioned correctly.
                const model = new ColorPickerModel(color, [], 0);
                const widget = new ColorPickerWidget(fragment, model, this._editor.getOption(114 /* pixelRatio */), this._themeService);
                getColorPresentations(editorModel, colorInfo, msg.provider, CancellationToken.None).then(colorPresentations => {
                    model.colorPresentations = colorPresentations || [];
                    if (!this._editor.hasModel()) {
                        // gone...
                        return;
                    }
                    const originalText = this._editor.getModel().getValueInRange(msg.range);
                    model.guessColorPresentation(color, originalText);
                    const updateEditorModel = () => {
                        let textEdits;
                        let newRange;
                        if (model.presentation.textEdit) {
                            textEdits = [model.presentation.textEdit];
                            newRange = new Range(model.presentation.textEdit.range.startLineNumber, model.presentation.textEdit.range.startColumn, model.presentation.textEdit.range.endLineNumber, model.presentation.textEdit.range.endColumn);
                            newRange = newRange.setEndPosition(newRange.endLineNumber, newRange.startColumn + model.presentation.textEdit.text.length);
                        }
                        else {
                            textEdits = [{ identifier: null, range, text: model.presentation.label, forceMoveMarkers: false }];
                            newRange = range.setEndPosition(range.endLineNumber, range.startColumn + model.presentation.label.length);
                        }
                        this._editor.pushUndoStop();
                        this._editor.executeEdits('colorpicker', textEdits);
                        if (model.presentation.additionalTextEdits) {
                            textEdits = [...model.presentation.additionalTextEdits];
                            this._editor.executeEdits('colorpicker', textEdits);
                            this.hide();
                        }
                        this._editor.pushUndoStop();
                        range = newRange;
                    };
                    const updateColorPresentations = (color) => {
                        return getColorPresentations(editorModel, {
                            range: range,
                            color: {
                                red: color.rgba.r / 255,
                                green: color.rgba.g / 255,
                                blue: color.rgba.b / 255,
                                alpha: color.rgba.a
                            }
                        }, msg.provider, CancellationToken.None).then((colorPresentations) => {
                            model.colorPresentations = colorPresentations || [];
                        });
                    };
                    const colorListener = model.onColorFlushed((color) => {
                        updateColorPresentations(color).then(updateEditorModel);
                    });
                    const colorChangeListener = model.onDidChangeColor(updateColorPresentations);
                    this._colorPicker = widget;
                    this.showAt(range.getStartPosition(), range, this._shouldFocus);
                    this.updateContents(fragment);
                    this._colorPicker.layout();
                    this.renderDisposable.value = combinedDisposable(colorListener, colorChangeListener, widget, markdownDisposeables);
                });
            }
            else {
                if (msg instanceof MarkerHover) {
                    markerMessages.push(msg);
                    isEmptyHoverContent = false;
                }
                else {
                    msg.contents
                        .filter(contents => !isEmptyMarkdownString(contents))
                        .forEach(contents => {
                        const markdownHoverElement = $('div.hover-row.markdown-hover');
                        const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
                        const renderer = markdownDisposeables.add(new MarkdownRenderer(this._editor, this._modeService, this._openerService));
                        markdownDisposeables.add(renderer.onDidRenderCodeBlock(() => {
                            hoverContentsElement.className = 'hover-contents code-hover-contents';
                            this._hover.onContentsChanged();
                        }));
                        const renderedContents = markdownDisposeables.add(renderer.render(contents));
                        hoverContentsElement.appendChild(renderedContents.element);
                        fragment.appendChild(markdownHoverElement);
                        isEmptyHoverContent = false;
                    });
                }
            }
        });
        if (markerMessages.length) {
            markerMessages.forEach(msg => fragment.appendChild(this.renderMarkerHover(msg)));
            const markerHoverForStatusbar = markerMessages.length === 1 ? markerMessages[0] : markerMessages.sort((a, b) => MarkerSeverity.compare(a.marker.severity, b.marker.severity))[0];
            fragment.appendChild(this.renderMarkerStatusbar(markerHoverForStatusbar));
        }
        // show
        if (!containColorPicker && !isEmptyHoverContent) {
            this.showAt(new Position(renderRange.startLineNumber, renderColumn), highlightRange, this._shouldFocus);
            this.updateContents(fragment);
        }
        this._isChangingDecorations = true;
        this._highlightDecorations = this._editor.deltaDecorations(this._highlightDecorations, highlightRange ? [{
                range: highlightRange,
                options: ModesContentHoverWidget._DECORATION_OPTIONS
            }] : []);
        this._isChangingDecorations = false;
    }
    renderMarkerHover(markerHover) {
        const hoverElement = $('div.hover-row');
        const markerElement = dom.append(hoverElement, $('div.marker.hover-contents'));
        const { source, message, code, relatedInformation } = markerHover.marker;
        this._editor.applyFontInfo(markerElement);
        const messageElement = dom.append(markerElement, $('span'));
        messageElement.style.whiteSpace = 'pre-wrap';
        messageElement.innerText = message;
        if (source || code) {
            // Code has link
            if (code && typeof code !== 'string') {
                const sourceAndCodeElement = $('span');
                if (source) {
                    const sourceElement = dom.append(sourceAndCodeElement, $('span'));
                    sourceElement.innerText = source;
                }
                this._codeLink = dom.append(sourceAndCodeElement, $('a.code-link'));
                this._codeLink.setAttribute('href', code.target.toString());
                this._codeLink.onclick = (e) => {
                    this._openerService.open(code.target);
                    e.preventDefault();
                    e.stopPropagation();
                };
                const codeElement = dom.append(this._codeLink, $('span'));
                codeElement.innerText = code.value;
                const detailsElement = dom.append(markerElement, sourceAndCodeElement);
                detailsElement.style.opacity = '0.6';
                detailsElement.style.paddingLeft = '6px';
            }
            else {
                const detailsElement = dom.append(markerElement, $('span'));
                detailsElement.style.opacity = '0.6';
                detailsElement.style.paddingLeft = '6px';
                detailsElement.innerText = source && code ? `${source}(${code})` : source ? source : `(${code})`;
            }
        }
        if (isNonEmptyArray(relatedInformation)) {
            for (const { message, resource, startLineNumber, startColumn } of relatedInformation) {
                const relatedInfoContainer = dom.append(markerElement, $('div'));
                relatedInfoContainer.style.marginTop = '8px';
                const a = dom.append(relatedInfoContainer, $('a'));
                a.innerText = `${basename(resource)}(${startLineNumber}, ${startColumn}): `;
                a.style.cursor = 'pointer';
                a.onclick = e => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (this._openerService) {
                        this._openerService.open(resource.with({ fragment: `${startLineNumber},${startColumn}` }), { fromUserGesture: true }).catch(onUnexpectedError);
                    }
                };
                const messageElement = dom.append(relatedInfoContainer, $('span'));
                messageElement.innerText = message;
                this._editor.applyFontInfo(messageElement);
            }
        }
        return hoverElement;
    }
    renderMarkerStatusbar(markerHover) {
        const hoverElement = $('div.hover-row.status-bar');
        const disposables = new DisposableStore();
        const actionsElement = dom.append(hoverElement, $('div.actions'));
        if (markerHover.marker.severity === MarkerSeverity.Error || markerHover.marker.severity === MarkerSeverity.Warning || markerHover.marker.severity === MarkerSeverity.Info) {
            disposables.add(this._renderAction(actionsElement, {
                label: nls.localize('peek problem', "Peek Problem"),
                commandId: NextMarkerAction.ID,
                run: () => {
                    this.hide();
                    MarkerController.get(this._editor).showAtMarker(markerHover.marker);
                    this._editor.focus();
                }
            }));
        }
        const quickfixPlaceholderElement = dom.append(actionsElement, $('div'));
        quickfixPlaceholderElement.style.opacity = '0';
        quickfixPlaceholderElement.style.transition = 'opacity 0.2s';
        setTimeout(() => quickfixPlaceholderElement.style.opacity = '1', 200);
        quickfixPlaceholderElement.textContent = nls.localize('checkingForQuickFixes', "Checking for quick fixes...");
        disposables.add(toDisposable(() => quickfixPlaceholderElement.remove()));
        const codeActionsPromise = this.getCodeActions(markerHover.marker);
        disposables.add(toDisposable(() => codeActionsPromise.cancel()));
        codeActionsPromise.then(actions => {
            quickfixPlaceholderElement.style.transition = '';
            quickfixPlaceholderElement.style.opacity = '1';
            if (!actions.validActions.length) {
                actions.dispose();
                quickfixPlaceholderElement.textContent = nls.localize('noQuickFixes', "No quick fixes available");
                return;
            }
            quickfixPlaceholderElement.remove();
            let showing = false;
            disposables.add(toDisposable(() => {
                if (!showing) {
                    actions.dispose();
                }
            }));
            disposables.add(this._renderAction(actionsElement, {
                label: nls.localize('quick fixes', "Quick Fix..."),
                commandId: QuickFixAction.Id,
                run: (target) => {
                    showing = true;
                    const controller = QuickFixController.get(this._editor);
                    const elementPosition = dom.getDomNodePagePosition(target);
                    // Hide the hover pre-emptively, otherwise the editor can close the code actions
                    // context menu as well when using keyboard navigation
                    this.hide();
                    controller.showCodeActions(markerCodeActionTrigger, actions, {
                        x: elementPosition.left + 6,
                        y: elementPosition.top + elementPosition.height + 6
                    });
                }
            }));
        });
        this.renderDisposable.value = disposables;
        return hoverElement;
    }
    getCodeActions(marker) {
        return createCancelablePromise(cancellationToken => {
            return getCodeActions(this._editor.getModel(), new Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn), markerCodeActionTrigger, Progress.None, cancellationToken);
        });
    }
}
ModesContentHoverWidget.ID = 'editor.contrib.modesContentHoverWidget';
ModesContentHoverWidget._DECORATION_OPTIONS = ModelDecorationOptions.register({
    className: 'hoverHighlight'
});
function hoverContentsEquals(first, second) {
    if ((!first && second) || (first && !second) || first.length !== second.length) {
        return false;
    }
    for (let i = 0; i < first.length; i++) {
        const firstElement = first[i];
        const secondElement = second[i];
        if (firstElement instanceof MarkerHover && secondElement instanceof MarkerHover) {
            return IMarkerData.makeKey(firstElement.marker) === IMarkerData.makeKey(secondElement.marker);
        }
        if (firstElement instanceof ColorHover || secondElement instanceof ColorHover) {
            return false;
        }
        if (firstElement instanceof MarkerHover || secondElement instanceof MarkerHover) {
            return false;
        }
        if (!markedStringsEquals(firstElement.contents, secondElement.contents)) {
            return false;
        }
    }
    return true;
}
registerThemingParticipant((theme, collector) => {
    const linkFg = theme.getColor(textLinkForeground);
    if (linkFg) {
        collector.addRule(`.monaco-hover .hover-contents a.code-link span:hover { color: ${linkFg}; }`);
    }
});
