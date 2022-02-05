/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as objects from '../../../common/objects.js';
import { renderCodicons } from '../../../common/codicons.js';
import { escape } from '../../../common/strings.js';
export class HighlightedLabel {
    constructor(container, supportCodicons) {
        this.supportCodicons = supportCodicons;
        this.text = '';
        this.title = '';
        this.highlights = [];
        this.didEverRender = false;
        this.domNode = document.createElement('span');
        this.domNode.className = 'monaco-highlighted-label';
        container.appendChild(this.domNode);
    }
    get element() {
        return this.domNode;
    }
    set(text, highlights = [], title = '', escapeNewLines) {
        if (!text) {
            text = '';
        }
        if (escapeNewLines) {
            // adjusts highlights inplace
            text = HighlightedLabel.escapeNewLines(text, highlights);
        }
        if (this.didEverRender && this.text === text && this.title === title && objects.equals(this.highlights, highlights)) {
            return;
        }
        if (!Array.isArray(highlights)) {
            highlights = [];
        }
        this.text = text;
        this.title = title;
        this.highlights = highlights;
        this.render();
    }
    render() {
        let htmlContent = '';
        let pos = 0;
        for (const highlight of this.highlights) {
            if (highlight.end === highlight.start) {
                continue;
            }
            if (pos < highlight.start) {
                htmlContent += '<span>';
                const substring = this.text.substring(pos, highlight.start);
                htmlContent += this.supportCodicons ? renderCodicons(escape(substring)) : escape(substring);
                htmlContent += '</span>';
                pos = highlight.end;
            }
            if (highlight.extraClasses) {
                htmlContent += `<span class="highlight ${highlight.extraClasses}">`;
            }
            else {
                htmlContent += `<span class="highlight">`;
            }
            const substring = this.text.substring(highlight.start, highlight.end);
            htmlContent += this.supportCodicons ? renderCodicons(escape(substring)) : escape(substring);
            htmlContent += '</span>';
            pos = highlight.end;
        }
        if (pos < this.text.length) {
            htmlContent += '<span>';
            const substring = this.text.substring(pos);
            htmlContent += this.supportCodicons ? renderCodicons(escape(substring)) : escape(substring);
            htmlContent += '</span>';
        }
        this.domNode.innerHTML = htmlContent;
        if (this.title) {
            this.domNode.title = this.title;
        }
        else {
            this.domNode.removeAttribute('title');
        }
        this.didEverRender = true;
    }
    static escapeNewLines(text, highlights) {
        let total = 0;
        let extra = 0;
        return text.replace(/\r\n|\r|\n/g, (match, offset) => {
            extra = match === '\r\n' ? -1 : 0;
            offset += total;
            for (const highlight of highlights) {
                if (highlight.end <= offset) {
                    continue;
                }
                if (highlight.start >= offset) {
                    highlight.start += extra;
                }
                if (highlight.end >= offset) {
                    highlight.end += extra;
                }
            }
            total += extra;
            return '\u23CE';
        });
    }
}
