/**
 * FIX-007 — exit-code propagation gate for the @a5c-ai/babysitter metapackage shim.
 *
 * Verifies the CONSUMER ARTIFACT, not the workspace file: every scenario below
 * runs `npm pack --ignore-scripts` (the exact tarball the publish helper ships),
 * extracts it into a fresh temporary consumer outside the repository, links the
 * bin the way npm does (`node_modules/.bin/babysitter` -> the packed shim), and
 * spawns that bin as a subprocess.
 *
 * The SDK CLI the shim delegates to is replaced by a deterministic stub
 * (`@a5c-ai/babysitter-sdk/dist/cli/main.js`) whose `run()` resolves `0`,
 * resolves `7`, or rejects on demand. That is deliberate: this gate asserts the
 * SHIM CONTRACT (does the metapackage propagate whatever the SDK CLI returns?),
 * not SDK behavior, so it must be able to drive results the real CLI cannot be
 * forced to produce. The real SDK's own executable
 * (packages/babysitter-sdk/src/cli/main.ts) is the reference implementation the
 * shim is kept consistent with.
 *
 * History: against the pre-FIX-007 shim (`void createBabysitterCli().run()`)
 * the resolve-7 case exited 0 (the nonzero code was discarded) and the
 * rejection case crashed with an unhandled rejection instead of emitting one
 * handled, actionable error.
 *
 * Never publishes and never mutates the npm registry; `npm pack` is local and
 * the temporary consumer installs nothing from the network.
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { after, before, describe, it } = require("node:test");

const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
const SOURCE_SHIM = path.join(PACKAGE_ROOT, "bin", "babysitter.js");
const PACK_TIMEOUT_MS = 5 * 60 * 1000;
const RUN_TIMEOUT_MS = 60 * 1000;
const REJECTION_MARKER = "BABYSITTER_SHIM_TEST_REJECTION";

const tempDirs = [];
/** @type {string | null} Extracted tarball root (the tarball's `package/` dir). */
let packedRoot = null;

function makeTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix));
  tempDirs.push(dir);
  return dir;
}

function packMetapackage() {
  const packDir = makeTempDir("babysitter-shim-pack-");
  const result = spawnSync(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", packDir],
    {
      cwd: PACKAGE_ROOT,
      encoding: "utf8",
      timeout: PACK_TIMEOUT_MS,
      shell: process.platform === "win32",
    },
  );
  assert.equal(
    result.status,
    0,
    `npm pack failed (status ${result.status}):\n${result.stdout}\n${result.stderr}`,
  );
  const tarballs = fs.readdirSync(packDir).filter((name) => name.endsWith(".tgz"));
  assert.equal(
    tarballs.length,
    1,
    `expected exactly one packed tarball in ${packDir}, found: ${tarballs.join(", ") || "none"}`,
  );

  const extractDir = makeTempDir("babysitter-shim-tarball-");
  const untar = spawnSync("tar", ["-xzf", path.join(packDir, tarballs[0]), "-C", extractDir], {
    encoding: "utf8",
    timeout: PACK_TIMEOUT_MS,
  });
  assert.equal(
    untar.status,
    0,
    `extracting ${tarballs[0]} failed (status ${untar.status}):\n${untar.stderr}`,
  );
  const root = path.join(extractDir, "package");
  assert.ok(fs.existsSync(root), `packed tarball did not contain a package/ root at ${root}`);
  return root;
}

const STUB_SDK_CLI = `"use strict";
// Deterministic @a5c-ai/babysitter-sdk CLI stand-in. Mirrors the real
// createBabysitterCli() contract: run() returns Promise<number>.
const mode = process.env.BABYSITTER_SHIM_TEST_MODE;

function createBabysitterCli() {
  return {
    async run(argv = process.argv.slice(2)) {
      process.stdout.write("stub-sdk:argv:" + JSON.stringify(argv) + "\\n");
      if (mode === "resolve-0") return 0;
      if (mode === "resolve-7") return 7;
      if (mode === "reject") throw new Error("stub SDK CLI exploded: ${REJECTION_MARKER}");
      throw new Error("unsupported BABYSITTER_SHIM_TEST_MODE: " + String(mode));
    },
  };
}

module.exports = { createBabysitterCli };
`;

/**
 * Builds a clean temporary consumer holding the PACKED metapackage.
 *
 * @param {{ sdk: "stub" | "cli-missing" }} options
 * @returns {{ dir: string, bin: string }}
 */
function createConsumer(options) {
  const dir = makeTempDir("babysitter-shim-consumer-");
  fs.writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "babysitter-shim-consumer",
        version: "0.0.0",
        private: true,
        type: "commonjs",
      },
      null,
      2,
    )}\n`,
  );

  const packageDir = path.join(dir, "node_modules", "@a5c-ai", "babysitter");
  fs.mkdirSync(path.dirname(packageDir), { recursive: true });
  fs.cpSync(packedRoot, packageDir, { recursive: true });

  const packedShim = path.join(packageDir, "bin", "babysitter.js");
  assert.ok(fs.existsSync(packedShim), `packed tarball is missing bin/babysitter.js (${packedShim})`);

  const binDir = path.join(dir, "node_modules", ".bin");
  fs.mkdirSync(binDir, { recursive: true });
  const bin = path.join(binDir, "babysitter");
  fs.symlinkSync(path.relative(binDir, packedShim), bin);

  const sdkDir = path.join(dir, "node_modules", "@a5c-ai", "babysitter-sdk");
  fs.mkdirSync(sdkDir, { recursive: true });
  fs.writeFileSync(
    path.join(sdkDir, "package.json"),
    `${JSON.stringify(
      { name: "@a5c-ai/babysitter-sdk", version: "0.0.0-stub", main: "dist/index.js" },
      null,
      2,
    )}\n`,
  );
  if (options.sdk === "stub") {
    fs.mkdirSync(path.join(sdkDir, "dist", "cli"), { recursive: true });
    fs.writeFileSync(path.join(sdkDir, "dist", "cli", "main.js"), STUB_SDK_CLI);
  }

  return { dir, bin };
}

/**
 * @param {{ sdk: "stub" | "cli-missing", mode?: string, argv?: string[] }} options
 */
function runPackedBin(options) {
  const consumer = createConsumer({ sdk: options.sdk });
  const env = { ...process.env };
  delete env.BABYSITTER_SHIM_TEST_MODE;
  // Keep stderr assertions deterministic: an inherited NODE_OPTIONS/NODE_DEBUG
  // can make node itself write warnings the shim never emitted.
  delete env.NODE_OPTIONS;
  delete env.NODE_DEBUG;
  if (options.mode) env.BABYSITTER_SHIM_TEST_MODE = options.mode;

  return spawnSync(consumer.bin, options.argv ?? [], {
    cwd: consumer.dir,
    encoding: "utf8",
    env,
    timeout: RUN_TIMEOUT_MS,
  });
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

before(() => {
  packedRoot = packMetapackage();
});

after(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("@a5c-ai/babysitter packed metapackage shim exit codes", () => {
  it("ships the workspace shim byte-for-byte in the tarball", () => {
    const packedShim = fs.readFileSync(path.join(packedRoot, "bin", "babysitter.js"), "utf8");
    assert.equal(
      packedShim,
      fs.readFileSync(SOURCE_SHIM, "utf8"),
      "the packed bin/babysitter.js differs from the workspace shim under test",
    );
  });

  it("exits 0 when the SDK CLI resolves 0", () => {
    const result = runPackedBin({ sdk: "stub", mode: "resolve-0", argv: ["run", "--json"] });
    assert.equal(
      result.status,
      0,
      `expected exit 0, got ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stdout, /stub-sdk:argv:\["run","--json"\]/);
    assert.equal(result.stderr, "");
  });

  it("exits 7 when the SDK CLI resolves 7", () => {
    const result = runPackedBin({ sdk: "stub", mode: "resolve-7", argv: ["status"] });
    assert.equal(
      result.status,
      7,
      `expected the SDK CLI result 7 to become the process exit code, got ${result.status}\n` +
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stdout, /stub-sdk:argv:\["status"\]/);
    assert.equal(result.stderr, "");
  });

  it("exits 1 with exactly one handled, actionable error when the SDK CLI rejects", () => {
    const result = runPackedBin({ sdk: "stub", mode: "reject", argv: ["run"] });
    assert.equal(
      result.status,
      1,
      `expected exit 1 on rejection, got ${result.status}\nstderr:\n${result.stderr}`,
    );
    assert.equal(
      countOccurrences(result.stderr, REJECTION_MARKER),
      1,
      `expected the rejection to be reported exactly once, stderr was:\n${result.stderr}`,
    );
    assert.match(
      result.stderr,
      /@a5c-ai\/babysitter-sdk CLI failed/,
      `expected an actionable error naming the failing SDK CLI, stderr was:\n${result.stderr}`,
    );
    // An unhandled rejection crashes the process: node prints the offending
    // source line with a caret before the stack and a `Node.js v<version>`
    // footer after it. A handled rejection emits neither, and stderr starts
    // with the shim's own message.
    assert.ok(
      result.stderr.startsWith("The @a5c-ai/babysitter-sdk CLI failed:"),
      `the rejection crashed the process instead of being handled by the shim:\n${result.stderr}`,
    );
    assert.doesNotMatch(
      result.stderr,
      /^Node\.js v\d/m,
      `the rejection crashed the process instead of being handled:\n${result.stderr}`,
    );
    assert.doesNotMatch(
      result.stderr,
      /node:internal\/process\/promises/,
      `stderr reported an unhandled rejection instead of a handled error:\n${result.stderr}`,
    );
  });

  it("keeps printing missing-SDK repair guidance from the packed shim", () => {
    const result = runPackedBin({ sdk: "cli-missing", argv: ["--version"] });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unable to load @a5c-ai\/babysitter-sdk CLI/);
    assert.match(result.stderr, /npm i -g @a5c-ai\/babysitter-sdk/);
    assert.match(
      result.stderr,
      /npm exec --yes --package @a5c-ai\/babysitter-sdk@latest -- babysitter --version/,
    );
    assert.doesNotMatch(result.stderr, /node:internal\/modules\/cjs\/loader/);
  });
});
