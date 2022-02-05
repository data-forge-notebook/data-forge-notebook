/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as dom from '../../../base/browser/dom.js';
import { Widget } from '../../../base/browser/ui/widget.js';
import { renderHoverAction, HoverWidget } from '../../../base/browser/ui/hover/hoverWidget.js';
export class ContentHoverWidget extends Widget {
    constructor(id, editor, _hoverVisibleKey, _keybindingService) {
        super();
        this._hoverVisibleKey = _hoverVisibleKey;
        this._keybindingService = _keybindingService;
        // Editor.IContentWidget.allowEditorOverflow
        this.allowEditorOverflow = true;
        this._hover = this._register(new HoverWidget());
        this._id = id;
        this._editor = editor;
        this._isVisible = false;
        this._stoleFocus = false;
        this.onkeydown(this._hover.containerDomNode, (e) => {
            if (e.equals(9 /* Escape */)) {
                this.hide();
            }
        });
        this._register(this._editor.onDidChangeConfiguration((e) => {
            if (e.hasChanged(36 /* fontInfo */)) {
                this.updateFont();
            }
        }));
        this._editor.onDidLayoutChange(e => this.layout());
        this.layout();
        this._editor.addContentWidget(this);
        this._showAtPosition = null;
        this._showAtRange = null;
        this._stoleFocus = false;
    }
    get isVisible() {
        return this._isVisible;
    }
    set isVisible(value) {
        this._isVisible = value;
        dom.toggleClass(this._hover.containerDomNode, 'hidden', !this._isVisible);
    }
    getId() {
        return this._id;
    }
    getDomNode() {
        return this._hover.containerDomNode;
    }
    showAt(position, range, focus) {
        // Position has changed
        this._showAtPosition = position;
        this._showAtRange = range;
        this._hoverVisibleKey.set(true);
        this.isVisible = true;
        this._editor.layoutContentWidget(this);
        // Simply force a synchronous render on the editor
        // such that the widget does not really render with left = '0px'
        this._editor.render();
        this._stoleFocus = focus;
        if (focus) {
            this._hover.containerDomNode.focus();
        }
    }
    hide() {
        if (!this.isVisible) {
            return;
        }
        setTimeout(() => {
            // Give commands a chance to see the key
            if (!this.isVisible) {
                this._hoverVisibleKey.set(false);
            }
        }, 0);
        this.isVisible = false;
        this._editor.layoutContentWidget(this);
        if (this._stoleFocus) {
            this._editor.focus();
        }
    }
    getPosition() {
        if (this.isVisible) {
            return {
                position: this._showAtPosition,
                range: this._showAtRange,
                preference: [
                    1 /* ABOVE */,
                    2 /* BELOW */
                ]
            };
        }
        return null;
    }
    dispose() {
        this._editor.removeContentWidget(this);
        super.dispose();
    }
    updateFont() {
        const codeClasses = Array.prototype.slice.call(this._hover.contentsDomNode.getElementsByClassName('code'));
        codeClasses.forEach(node => this._editor.applyFontInfo(node));
    }
    updateContents(node) {
        this._hover.contentsDomNode.textContent = '';
        this._hover.contentsDomNode.appendChild(node);
        this.updateFont();
        this._editor.layoutContentWidget(this);
        this._hover.onContentsChanged();
    }
    _renderAction(parent, actionOptions) {
        const keybinding = this._keybindingService.lookupKeybinding(actionOptions.commandId);
        const keybindingLabel = keybinding ? keybinding.getLabel() : null;
        return renderHoverAction(parent, actionOptions, keybindingLabel);
    }
    layout() {
        const height = Math.max(this._editor.getLayoutInfo().height / 4, 250);
        const { fontSize, lineHeight } = this._editor.getOption(36 /* fontInfo */);
        this._hover.contentsDomNode.style.fontSize = `${fontSize}px`;
        this._hover.contentsDomNode.style.lineHeight = `${lineHeight}px`;
        this._hover.contentsDomNode.style.maxHeight = `${height}px`;
        this._hover.contentsDomNode.style.maxWidth = `${Math.max(this._editor.getLayoutInfo().width * 0.66, 500)}px`;
    }
}
export class GlyphHoverWidget extends Widget {
    constructor(id, editor) {
        super();
        this._id = id;
        this._editor = editor;
        this._isVisible = false;
        this._domNode = document.createElement('div');
        this._domNode.className = 'monaco-hover hidden';
        this._domNode.setAttribute('aria-hidden', 'true');
        this._domNode.setAttribute('role', 'tooltip');
        this._showAtLineNumber = -1;
        this._register(this._editor.onDidChangeConfiguration((e) => {
            if (e.hasChanged(36 /* fontInfo */)) {
                this.updateFont();
            }
        }));
        this._editor.addOverlayWidget(this);
    }
    get isVisible() {
        return this._isVisible;
    }
    set isVisible(value) {
        this._isVisible = value;
        dom.toggleClass(this._domNode, 'hidden', !this._isVisible);
    }
    getId() {
        return this._id;
    }
    getDomNode() {
        return this._domNode;
    }
    showAt(lineNumber) {
        this._showAtLineNumber = lineNumber;
        if (!this.isVisible) {
            this.isVisible = true;
        }
        const editorLayout = this._editor.getLayoutInfo();
        const topForLineNumber = this._editor.getTopForLineNumber(this._showAtLineNumber);
        const editorScrollTop = this._editor.getScrollTop();
        const lineHeight = this._editor.getOption(51 /* lineHeight */);
        const nodeHeight = this._domNode.clientHeight;
        const top = topForLineNumber - editorScrollTop - ((nodeHeight - lineHeight) / 2);
        this._domNode.style.left = `${editorLayout.glyphMarginLeft + editorLayout.glyphMarginWidth}px`;
        this._domNode.style.top = `${Math.max(Math.round(top), 0)}px`;
    }
    hide() {
        if (!this.isVisible) {
            return;
        }
        this.isVisible = false;
    }
    getPosition() {
        return null;
    }
    dispose() {
        this._editor.removeOverlayWidget(this);
        super.dispose();
    }
    updateFont() {
        const codeTags = Array.prototype.slice.call(this._domNode.getElementsByTagName('code'));
        const codeClasses = Array.prototype.slice.call(this._domNode.getElementsByClassName('code'));
        [...codeTags, ...codeClasses].forEach(node => this._editor.applyFontInfo(node));
    }
    updateContents(node) {
        this._domNode.textContent = '';
        this._domNode.appendChild(node);
        this.updateFont();
    }
}
