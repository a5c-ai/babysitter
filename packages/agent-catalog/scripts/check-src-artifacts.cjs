const fs = require("fs");
const path = require("path");

const srcDir = path.resolve(__dirname, "..", "src");
const generatedArtifactPattern = /\.(?:js|js\.map|d\.ts|d\.ts\.map)$/;
const generatedArtifacts = [];

function collectGeneratedArtifacts(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectGeneratedArtifacts(entryPath);
      continue;
    }

    if (!entry.isFile() || !generatedArtifactPattern.test(entry.name)) {
      continue;
    }

    generatedArtifacts.push(path.posix.join("src", path.relative(srcDir, entryPath).split(path.sep).join(path.posix.sep)));
  }
}

collectGeneratedArtifacts(srcDir);

if (generatedArtifacts.length > 0) {
  console.error("Generated artifacts must not live in packages/agent-catalog/src. Remove:");
  for (const artifactPath of generatedArtifacts) {
    console.error(` - ${artifactPath}`);
  }
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checkedDirectory: "src" }, null, 2));
