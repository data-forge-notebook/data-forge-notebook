/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import './progressbar.css';
import { Disposable } from '../../../common/lifecycle.js';
import { Color } from '../../../common/color.js';
import { mixin } from '../../../common/objects.js';
import { removeClasses, addClass, hasClass, addClasses, show } from '../../dom.js';
import { RunOnceScheduler } from '../../../common/async.js';
const css_done = 'done';
const css_active = 'active';
const css_infinite = 'infinite';
const css_discrete = 'discrete';
const css_progress_container = 'monaco-progress-container';
const css_progress_bit = 'progress-bit';
const defaultOpts = {
    progressBarBackground: Color.fromHex('#0E70C0')
};
/**
 * A progress bar with support for infinite or discrete progress.
 */
export class ProgressBar extends Disposable {
    constructor(container, options) {
        super();
        this.options = options || Object.create(null);
        mixin(this.options, defaultOpts, false);
        this.workedVal = 0;
        this.progressBarBackground = this.options.progressBarBackground;
        this._register(this.showDelayedScheduler = new RunOnceScheduler(() => show(this.element), 0));
        this.create(container);
    }
    create(container) {
        this.element = document.createElement('div');
        addClass(this.element, css_progress_container);
        container.appendChild(this.element);
        this.bit = document.createElement('div');
        addClass(this.bit, css_progress_bit);
        this.element.appendChild(this.bit);
        this.applyStyles();
    }
    off() {
        this.bit.style.width = 'inherit';
        this.bit.style.opacity = '1';
        removeClasses(this.element, css_active, css_infinite, css_discrete);
        this.workedVal = 0;
        this.totalWork = undefined;
    }
    /**
     * Stops the progressbar from showing any progress instantly without fading out.
     */
    stop() {
        return this.doDone(false);
    }
    doDone(delayed) {
        addClass(this.element, css_done);
        // let it grow to 100% width and hide afterwards
        if (!hasClass(this.element, css_infinite)) {
            this.bit.style.width = 'inherit';
            if (delayed) {
                setTimeout(() => this.off(), 200);
            }
            else {
                this.off();
            }
        }
        // let it fade out and hide afterwards
        else {
            this.bit.style.opacity = '0';
            if (delayed) {
                setTimeout(() => this.off(), 200);
            }
            else {
                this.off();
            }
        }
        return this;
    }
    /**
     * Use this mode to indicate progress that has no total number of work units.
     */
    infinite() {
        this.bit.style.width = '2%';
        this.bit.style.opacity = '1';
        removeClasses(this.element, css_discrete, css_done);
        addClasses(this.element, css_active, css_infinite);
        return this;
    }
    getContainer() {
        return this.element;
    }
    style(styles) {
        this.progressBarBackground = styles.progressBarBackground;
        this.applyStyles();
    }
    applyStyles() {
        if (this.bit) {
            const background = this.progressBarBackground ? this.progressBarBackground.toString() : '';
            this.bit.style.backgroundColor = background;
        }
    }
}
