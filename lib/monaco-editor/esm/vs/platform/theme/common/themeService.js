/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createDecorator } from '../../instantiation/common/instantiation.js';
import { toDisposable, Disposable } from '../../../base/common/lifecycle.js';
import * as platform from '../../registry/common/platform.js';
import { Emitter } from '../../../base/common/event.js';
export const IThemeService = createDecorator('themeService');
export function themeColorFromId(id) {
    return { id };
}
export var ThemeIcon;
(function (ThemeIcon) {
    function isThemeIcon(obj) {
        return obj && typeof obj === 'object' && typeof obj.id === 'string';
    }
    ThemeIcon.isThemeIcon = isThemeIcon;
    const _regexFromString = /^\$\(([a-z.]+\/)?([a-z-~]+)\)$/i;
    function fromString(str) {
        const match = _regexFromString.exec(str);
        if (!match) {
            return undefined;
        }
        let [, owner, name] = match;
        if (!owner) {
            owner = `codicon/`;
        }
        return { id: owner + name };
    }
    ThemeIcon.fromString = fromString;
    const _regexAsClassName = /^(codicon\/)?([a-z-]+)(~[a-z]+)?$/i;
    function asClassName(icon) {
        // todo@martin,joh -> this should go into the ThemeService
        const match = _regexAsClassName.exec(icon.id);
        if (!match) {
            return undefined;
        }
        let [, , name, modifier] = match;
        let className = `codicon codicon-${name}`;
        if (modifier) {
            className += ` ${modifier.substr(1)}`;
        }
        return className;
    }
    ThemeIcon.asClassName = asClassName;
})(ThemeIcon || (ThemeIcon = {}));
// base themes
export const DARK = 'dark';
export const HIGH_CONTRAST = 'hc';
export function getThemeTypeSelector(type) {
    switch (type) {
        case DARK: return 'vs-dark';
        case HIGH_CONTRAST: return 'hc-black';
        default: return 'vs';
    }
}
// static theming participant
export const Extensions = {
    ThemingContribution: 'base.contributions.theming'
};
class ThemingRegistry {
    constructor() {
        this.themingParticipants = [];
        this.themingParticipants = [];
        this.onThemingParticipantAddedEmitter = new Emitter();
    }
    onColorThemeChange(participant) {
        this.themingParticipants.push(participant);
        this.onThemingParticipantAddedEmitter.fire(participant);
        return toDisposable(() => {
            const idx = this.themingParticipants.indexOf(participant);
            this.themingParticipants.splice(idx, 1);
        });
    }
    getThemingParticipants() {
        return this.themingParticipants;
    }
}
let themingRegistry = new ThemingRegistry();
platform.Registry.add(Extensions.ThemingContribution, themingRegistry);
export function registerThemingParticipant(participant) {
    return themingRegistry.onColorThemeChange(participant);
}
/**
 * Utility base class for all themable components.
 */
export class Themable extends Disposable {
    constructor(themeService) {
        super();
        this.themeService = themeService;
        this.theme = themeService.getColorTheme();
        // Hook up to theme changes
        this._register(this.themeService.onDidColorThemeChange(theme => this.onThemeChange(theme)));
    }
    onThemeChange(theme) {
        this.theme = theme;
        this.updateStyles();
    }
    updateStyles() {
        // Subclasses to override
    }
}
