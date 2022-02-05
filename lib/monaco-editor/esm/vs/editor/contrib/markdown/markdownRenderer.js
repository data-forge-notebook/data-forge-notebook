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
import { renderMarkdown } from '../../../base/browser/markdownRenderer.js';
import { IOpenerService, NullOpenerService } from '../../../platform/opener/common/opener.js';
import { IModeService } from '../../common/services/modeService.js';
import { onUnexpectedError } from '../../../base/common/errors.js';
import { tokenizeToString } from '../../common/modes/textToHtmlTokenizer.js';
import { optional } from '../../../platform/instantiation/common/instantiation.js';
import { Emitter } from '../../../base/common/event.js';
import { DisposableStore, Disposable } from '../../../base/common/lifecycle.js';
import { TokenizationRegistry } from '../../common/modes.js';
let MarkdownRenderer = class MarkdownRenderer extends Disposable {
    constructor(_editor, _modeService, _openerService = NullOpenerService) {
        super();
        this._editor = _editor;
        this._modeService = _modeService;
        this._openerService = _openerService;
        this._onDidRenderCodeBlock = this._register(new Emitter());
        this.onDidRenderCodeBlock = this._onDidRenderCodeBlock.event;
    }
    getOptions(disposeables) {
        return {
            codeBlockRenderer: (languageAlias, value) => {
                // In markdown,
                // it is possible that we stumble upon language aliases (e.g.js instead of javascript)
                // it is possible no alias is given in which case we fall back to the current editor lang
                let modeId = null;
                if (languageAlias) {
                    modeId = this._modeService.getModeIdForLanguageName(languageAlias);
                }
                else {
                    const model = this._editor.getModel();
                    if (model) {
                        modeId = model.getLanguageIdentifier().language;
                    }
                }
                this._modeService.triggerMode(modeId || '');
                return Promise.resolve(true).then(_ => {
                    const promise = TokenizationRegistry.getPromise(modeId || '');
                    if (promise) {
                        return promise.then(support => tokenizeToString(value, support));
                    }
                    return tokenizeToString(value, undefined);
                }).then(code => {
                    return `<span style="font-family: ${this._editor.getOption(36 /* fontInfo */).fontFamily}">${code}</span>`;
                });
            },
            codeBlockRenderCallback: () => this._onDidRenderCodeBlock.fire(),
            actionHandler: {
                callback: (content) => {
                    this._openerService.open(content, { fromUserGesture: true }).catch(onUnexpectedError);
                },
                disposeables
            }
        };
    }
    render(markdown) {
        const disposeables = new DisposableStore();
        let element;
        if (!markdown) {
            element = document.createElement('span');
        }
        else {
            element = renderMarkdown(markdown, this.getOptions(disposeables));
        }
        return {
            element,
            dispose: () => disposeables.dispose()
        };
    }
};
MarkdownRenderer = __decorate([
    __param(1, IModeService),
    __param(2, optional(IOpenerService))
], MarkdownRenderer);
export { MarkdownRenderer };
