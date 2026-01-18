const fs = require("node:fs");
const path = require("node:path");
const { File } = require("node:buffer");

if (typeof globalThis.File === "undefined" && File) {
  globalThis.File = File;
}

const pkgDir = path.dirname(require.resolve("@vscode/vsce/package.json"));
const vsceBin = path.join(pkgDir, "vsce");
const args = process.argv.slice(2);

const extensionRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(extensionRoot, "..", "..");
const gitDir = path.join(repoRoot, ".git");
const gitBackup = path.join(repoRoot, ".git.vsce-backup");

const outFlagIndex = args.findIndex((arg) => arg === "--out" || arg === "-o");
if (outFlagIndex !== -1 && args[outFlagIndex + 1]) {
  const outPath = args[outFlagIndex + 1];
  if (!path.isAbsolute(outPath)) {
    args[outFlagIndex + 1] = path.resolve(extensionRoot, outPath);
  }
}

const restoreGit = () => {
  if (fs.existsSync(gitBackup) && !fs.existsSync(gitDir)) {
    fs.renameSync(gitBackup, gitDir);
  }
};

if (fs.existsSync(gitDir) && !fs.existsSync(gitBackup)) {
  fs.renameSync(gitDir, gitBackup);
}

process.on("exit", restoreGit);
process.on("SIGINT", () => {
  restoreGit();
  process.exit(1);
});
process.on("SIGTERM", () => {
  restoreGit();
  process.exit(1);
});

process.chdir(extensionRoot);
process.argv = [process.execPath, vsceBin, ...args];

require(vsceBin);
