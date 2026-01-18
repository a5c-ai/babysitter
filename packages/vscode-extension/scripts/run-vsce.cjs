const { File } = require("node:buffer");

if (typeof globalThis.File === "undefined" && File) {
  globalThis.File = File;
}

const vscePath = require.resolve("@vscode/vsce/out/main.js");
const args = process.argv.slice(2);
process.argv = [process.execPath, vscePath, ...args];

require(vscePath);
