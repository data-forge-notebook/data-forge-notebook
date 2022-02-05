/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { matchesFuzzy } from './filters.js';
import { ltrim } from './strings.js';
export const codiconStartMarker = '$(';
export function parseCodicons(text) {
    const firstCodiconIndex = text.indexOf(codiconStartMarker);
    if (firstCodiconIndex === -1) {
        return { text }; // return early if the word does not include an codicon
    }
    return doParseCodicons(text, firstCodiconIndex);
}
function doParseCodicons(text, firstCodiconIndex) {
    const codiconOffsets = [];
    let textWithoutCodicons = '';
    function appendChars(chars) {
        if (chars) {
            textWithoutCodicons += chars;
            for (const _ of chars) {
                codiconOffsets.push(codiconsOffset); // make sure to fill in codicon offsets
            }
        }
    }
    let currentCodiconStart = -1;
    let currentCodiconValue = '';
    let codiconsOffset = 0;
    let char;
    let nextChar;
    let offset = firstCodiconIndex;
    const length = text.length;
    // Append all characters until the first codicon
    appendChars(text.substr(0, firstCodiconIndex));
    // example: $(file-symlink-file) my cool $(other-codicon) entry
    while (offset < length) {
        char = text[offset];
        nextChar = text[offset + 1];
        // beginning of codicon: some value $( <--
        if (char === codiconStartMarker[0] && nextChar === codiconStartMarker[1]) {
            currentCodiconStart = offset;
            // if we had a previous potential codicon value without
            // the closing ')', it was actually not an codicon and
            // so we have to add it to the actual value
            appendChars(currentCodiconValue);
            currentCodiconValue = codiconStartMarker;
            offset++; // jump over '('
        }
        // end of codicon: some value $(some-codicon) <--
        else if (char === ')' && currentCodiconStart !== -1) {
            const currentCodiconLength = offset - currentCodiconStart + 1; // +1 to include the closing ')'
            codiconsOffset += currentCodiconLength;
            currentCodiconStart = -1;
            currentCodiconValue = '';
        }
        // within codicon
        else if (currentCodiconStart !== -1) {
            // Make sure this is a real codicon name
            if (/^[a-z0-9\-]$/i.test(char)) {
                currentCodiconValue += char;
            }
            else {
                // This is not a real codicon, treat it as text
                appendChars(currentCodiconValue);
                currentCodiconStart = -1;
                currentCodiconValue = '';
            }
        }
        // any value outside of codicons
        else {
            appendChars(char);
        }
        offset++;
    }
    // if we had a previous potential codicon value without
    // the closing ')', it was actually not an codicon and
    // so we have to add it to the actual value
    appendChars(currentCodiconValue);
    return { text: textWithoutCodicons, codiconOffsets };
}
export function matchesFuzzyCodiconAware(query, target, enableSeparateSubstringMatching = false) {
    const { text, codiconOffsets } = target;
    // Return early if there are no codicon markers in the word to match against
    if (!codiconOffsets || codiconOffsets.length === 0) {
        return matchesFuzzy(query, text, enableSeparateSubstringMatching);
    }
    // Trim the word to match against because it could have leading
    // whitespace now if the word started with an codicon
    const wordToMatchAgainstWithoutCodiconsTrimmed = ltrim(text, ' ');
    const leadingWhitespaceOffset = text.length - wordToMatchAgainstWithoutCodiconsTrimmed.length;
    // match on value without codicons
    const matches = matchesFuzzy(query, wordToMatchAgainstWithoutCodiconsTrimmed, enableSeparateSubstringMatching);
    // Map matches back to offsets with codicons and trimming
    if (matches) {
        for (const match of matches) {
            const codiconOffset = codiconOffsets[match.start + leadingWhitespaceOffset] /* codicon offsets at index */ + leadingWhitespaceOffset /* overall leading whitespace offset */;
            match.start += codiconOffset;
            match.end += codiconOffset;
        }
    }
    return matches;
}
