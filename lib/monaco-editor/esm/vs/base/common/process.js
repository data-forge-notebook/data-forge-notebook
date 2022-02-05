/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { isWindows, isMacintosh, setImmediate } from './platform.js';
const safeProcess = (typeof process === 'undefined') ? {
    cwd() { return '/'; },
    env: Object.create(null),
    get platform() { return isWindows ? 'win32' : isMacintosh ? 'darwin' : 'linux'; },
    nextTick(callback) { return setImmediate(callback); }
} : process;
export const cwd = safeProcess.cwd;
export const env = safeProcess.env;
export const platform = safeProcess.platform;
