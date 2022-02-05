/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { equals } from './arrays.js';
import { escapeCodicons } from './codicons.js';
export class MarkdownString {
    constructor(_value = '', isTrustedOrOptions = false) {
        var _a, _b;
        this._value = _value;
        if (typeof isTrustedOrOptions === 'boolean') {
            this._isTrusted = isTrustedOrOptions;
            this._supportThemeIcons = false;
        }
        else {
            this._isTrusted = (_a = isTrustedOrOptions.isTrusted) !== null && _a !== void 0 ? _a : false;
            this._supportThemeIcons = (_b = isTrustedOrOptions.supportThemeIcons) !== null && _b !== void 0 ? _b : false;
        }
    }
    get value() { return this._value; }
    get isTrusted() { return this._isTrusted; }
    get supportThemeIcons() { return this._supportThemeIcons; }
    appendText(value) {
        // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
        this._value += (this._supportThemeIcons ? escapeCodicons(value) : value)
            .replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&')
            .replace('\n', '\n\n');
        return this;
    }
    appendMarkdown(value) {
        this._value += value;
        return this;
    }
    appendCodeblock(langId, code) {
        this._value += '\n```';
        this._value += langId;
        this._value += '\n';
        this._value += code;
        this._value += '\n```\n';
        return this;
    }
}
export function isEmptyMarkdownString(oneOrMany) {
    if (isMarkdownString(oneOrMany)) {
        return !oneOrMany.value;
    }
    else if (Array.isArray(oneOrMany)) {
        return oneOrMany.every(isEmptyMarkdownString);
    }
    else {
        return true;
    }
}
export function isMarkdownString(thing) {
    if (thing instanceof MarkdownString) {
        return true;
    }
    else if (thing && typeof thing === 'object') {
        return typeof thing.value === 'string'
            && (typeof thing.isTrusted === 'boolean' || thing.isTrusted === undefined)
            && (typeof thing.supportThemeIcons === 'boolean' || thing.supportThemeIcons === undefined);
    }
    return false;
}
export function markedStringsEquals(a, b) {
    if (!a && !b) {
        return true;
    }
    else if (!a || !b) {
        return false;
    }
    else if (Array.isArray(a) && Array.isArray(b)) {
        return equals(a, b, markdownStringEqual);
    }
    else if (isMarkdownString(a) && isMarkdownString(b)) {
        return markdownStringEqual(a, b);
    }
    else {
        return false;
    }
}
function markdownStringEqual(a, b) {
    if (a === b) {
        return true;
    }
    else if (!a || !b) {
        return false;
    }
    else {
        return a.value === b.value && a.isTrusted === b.isTrusted && a.supportThemeIcons === b.supportThemeIcons;
    }
}
export function removeMarkdownEscapes(text) {
    if (!text) {
        return text;
    }
    return text.replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1');
}
export function parseHrefAndDimensions(href) {
    const dimensions = [];
    const splitted = href.split('|').map(s => s.trim());
    href = splitted[0];
    const parameters = splitted[1];
    if (parameters) {
        const heightFromParams = /height=(\d+)/.exec(parameters);
        const widthFromParams = /width=(\d+)/.exec(parameters);
        const height = heightFromParams ? heightFromParams[1] : '';
        const width = widthFromParams ? widthFromParams[1] : '';
        const widthIsFinite = isFinite(parseInt(width));
        const heightIsFinite = isFinite(parseInt(height));
        if (widthIsFinite) {
            dimensions.push(`width="${width}"`);
        }
        if (heightIsFinite) {
            dimensions.push(`height="${height}"`);
        }
    }
    return { href, dimensions };
}
