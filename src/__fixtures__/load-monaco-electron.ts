
const path = require('path');
const amdLoader = require('../../lib/monaco-editor/min/vs/loader.js');
const amdRequire = amdLoader.require;
amdRequire.config({
    baseUrl: "file:///" + path.join(__dirname, '../../lib/monaco-editor/min').replace(/\\/g, "/"),
});

export function loadMonaco(): Promise<void> {
    return new Promise<void>(resolve => {
        console.log("Loading monaco.");
    
        amdRequire(['vs/editor/editor.main'], () => {
            console.log("Monaco loaded!");
            resolve();
        }); 
    });    
}
