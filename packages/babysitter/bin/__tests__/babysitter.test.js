const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { afterEach, describe, it } = require("node:test");

const tmpDirs = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("@a5c-ai/babysitter metapackage shim", () => {
  it("prints actionable repair guidance when the SDK CLI module is missing", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "babysitter-shim-test-"));
    tmpDirs.push(tmpDir);
    const shimPath = path.join(tmpDir, "babysitter.js");
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ type: "commonjs" }),
    );
    fs.copyFileSync(path.resolve(__dirname, "..", "babysitter.js"), shimPath);

    fs.mkdirSync(
      path.join(tmpDir, "node_modules", "@a5c-ai", "babysitter-sdk"),
      { recursive: true },
    );
    fs.writeFileSync(
      path.join(tmpDir, "node_modules", "@a5c-ai", "babysitter-sdk", "package.json"),
      JSON.stringify({ name: "@a5c-ai/babysitter-sdk", version: "0.0.0" }),
    );

    const result = spawnSync(process.execPath, [shimPath, "--version"], {
      cwd: tmpDir,
      encoding: "utf8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unable to load @a5c-ai\/babysitter-sdk CLI/);
    assert.match(result.stderr, /npm i -g @a5c-ai\/babysitter-sdk/);
    assert.match(
      result.stderr,
      /npm exec --yes --package @a5c-ai\/babysitter-sdk@latest -- babysitter --version/,
    );
    assert.doesNotMatch(
      result.stderr,
      /node:internal\/modules\/cjs\/loader/,
    );
  });
});
