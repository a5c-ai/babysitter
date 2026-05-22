const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "third_party", "webpackbar", "dist");
const targetDirs = [
  path.join(repoRoot, "node_modules", "webpackbar", "dist"),
  path.join(repoRoot, "node_modules", "@docusaurus", "bundler", "node_modules", "webpackbar", "dist"),
];

function ensureSourceDir() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing vendored webpackbar patch at ${sourceDir}`);
  }
}

function copyPatchedDist(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    fs.copyFileSync(sourcePath, targetPath);
  }
}

ensureSourceDir();
for (const targetDir of targetDirs) {
  copyPatchedDist(targetDir);
}
