//@ts-nocheck
//@ts-nocheck
/* ASH: Removed the browser support which isn't the way I want this to operate under Electron.

if (typeof fetch === "function") {
  // Web version of reading a wasm file into an array buffer.

  let mappingsWasmUrl = null;

  module.exports = function readWasm() {
    if (typeof mappingsWasmUrl !== "string") {
      throw new Error("You must provide the URL of lib/mappings.wasm by calling " +
                      "SourceMapConsumer.initialize({ 'lib/mappings.wasm': ... }) " +
                      "before using SourceMapConsumer");
    }

    return fetch(mappingsWasmUrl)
      .then(response => response.arrayBuffer());
  };

  module.exports.initialize = url => mappingsWasmUrl = url;
} else {
*/
  // Node version of reading a wasm file into an array buffer.
  const fs = require("fs");
  const path = require("path");

  let wasmFilePath;

  module.exports = function readWasm() {
    return new Promise((resolve, reject) => {
      if (wasmFilePath === undefined) {
          throw new Error("Source-maps wasm file path is not set!");
      }
      const wasmPath = wasmFilePath; // OLD PATH: path.join(__dirname, "mappings.wasm");
      console.log(`Loading source-maps wasm file from ${wasmPath}`);
      fs.readFile(wasmPath, null, (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data.buffer);
      });
    });
  };

  module.exports.initialize = url => {
    wasmFilePath = url;
  };
//}
