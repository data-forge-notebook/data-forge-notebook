import * as os from "os";
import * as path from "path";

const timeoutMins = 5;
export const NOTEBOOK_TIMEOUT_MS = timeoutMins * 60 * 1000;

const tmpDir = os.tmpdir();
export const NOTEBOOK_TMP_PATH = path.join(tmpDir, "dfn-notebook-eval");
export const NPM_CACHE_PATH = path.join(tmpDir, "dfn-npm-cache");

console.log(`Tmp dir = ${tmpDir}`);
console.log(`Notebook tmp path = ${NOTEBOOK_TMP_PATH}`);
console.log(`Npm cache path = ${NPM_CACHE_PATH}`);
