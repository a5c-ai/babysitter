#!/usr/bin/env node
/**
 * Integration tests for babysitter-opencode plugin.
 *
 * Validates:
 * - Plugin manifest (plugin.json) structure and required fields
 * - Hook files existence and JS syntax validity
 * - hooks.json event-name-to-script mapping
 * - All command files in commands/
 * - Skills directory (babysit/SKILL.md)
 * - versions.json with sdkVersion
 * - package.json name, bin, scripts fields
 * - bin/install.js exists and is requireable
 * - bin/uninstall.js exists and is requireable
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PLUGIN_ROOT = path.resolve(__dirname, "..");
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL: ${name} -- ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function pluginPath(...segments) {
  return path.join(PLUGIN_ROOT, ...segments);
}

console.log("babysitter-opencode integration tests\n");

// ---------------------------------------------------------------------------
// 1. Plugin manifest (plugin.json) is valid JSON with required fields
// ---------------------------------------------------------------------------

console.log("1. Plugin manifest (plugin.json):");

test("plugin.json exists", () => {
  assert(fs.existsSync(pluginPath("plugin.json")), "plugin.json must exist");
});

test("plugin.json is valid JSON", () => {
  const raw = fs.readFileSync(pluginPath("plugin.json"), "utf8");
  JSON.parse(raw); // throws on invalid JSON
});

test("plugin.json has required fields", () => {
  const manifest = JSON.parse(fs.readFileSync(pluginPath("plugin.json"), "utf8"));
  assert(manifest.name === "babysitter", `Expected name "babysitter", got "${manifest.name}"`);
  assert(manifest.harness === "opencode", `Expected harness "opencode", got "${manifest.harness}"`);
  assert(typeof manifest.version === "string", "version must be a string");
  assert(typeof manifest.description === "string", "description must be a string");
  assert(manifest.hooks, "hooks field required");
  assert(manifest.commands, "commands field required");
  assert(manifest.skills, "skills field required");
  assert(typeof manifest.author === "string", "author field required");
  assert(typeof manifest.license === "string", "license field required");
});

// ---------------------------------------------------------------------------
// 2. Hook files exist and are valid JS (can be parsed without errors)
// ---------------------------------------------------------------------------

console.log("\n2. Hook files existence and JS validity:");

const hookJsFiles = [
  "hooks/session-created.js",
  "hooks/session-idle.js",
  "hooks/shell-env.js",
  "hooks/tool-execute-before.js",
  "hooks/tool-execute-after.js",
];

for (const hookFile of hookJsFiles) {
  test(`${hookFile} exists`, () => {
    assert(fs.existsSync(pluginPath(hookFile)), `Missing: ${hookFile}`);
  });

  test(`${hookFile} has valid JS syntax`, () => {
    execSync(`node --check "${pluginPath(hookFile)}"`, { stdio: "pipe" });
  });
}

// ---------------------------------------------------------------------------
// 3. hooks.json maps correct event names to hook scripts
// ---------------------------------------------------------------------------

console.log("\n3. hooks.json event mapping:");

test("hooks/hooks.json exists", () => {
  assert(fs.existsSync(pluginPath("hooks", "hooks.json")), "hooks.json must exist");
});

test("hooks.json is valid JSON", () => {
  const raw = fs.readFileSync(pluginPath("hooks", "hooks.json"), "utf8");
  JSON.parse(raw);
});

test("hooks.json has version and hooks fields", () => {
  const hooksJson = JSON.parse(fs.readFileSync(pluginPath("hooks", "hooks.json"), "utf8"));
  assert(typeof hooksJson.version === "number", "version must be a number");
  assert(hooksJson.hooks && typeof hooksJson.hooks === "object", "hooks field required");
});

const expectedEventNames = [
  "session.created",
  "session.idle",
  "shell.env",
  "tool.execute.before",
  "tool.execute.after",
];

test("hooks.json maps all expected event names", () => {
  const hooksJson = JSON.parse(fs.readFileSync(pluginPath("hooks", "hooks.json"), "utf8"));
  for (const eventName of expectedEventNames) {
    assert(hooksJson.hooks[eventName], `Missing hook event: ${eventName}`);
    assert(Array.isArray(hooksJson.hooks[eventName]), `${eventName} must map to an array`);
    assert(hooksJson.hooks[eventName].length > 0, `${eventName} must have at least one handler`);
  }
});

test("hooks.json script paths point to existing files", () => {
  const hooksJson = JSON.parse(fs.readFileSync(pluginPath("hooks", "hooks.json"), "utf8"));
  for (const [eventName, handlers] of Object.entries(hooksJson.hooks)) {
    for (const handler of handlers) {
      assert(handler.script, `${eventName} handler missing script field`);
      assert(
        fs.existsSync(pluginPath(handler.script)),
        `Script not found: ${handler.script} (event: ${eventName})`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 4. All command files exist in commands/
// ---------------------------------------------------------------------------

console.log("\n4. Command files:");

const expectedCommands = [
  "assimilate.md",
  "call.md",
  "cleanup.md",
  "contrib.md",
  "doctor.md",
  "forever.md",
  "help.md",
  "observe.md",
  "plan.md",
  "plugins.md",
  "project-install.md",
  "resume.md",
  "retrospect.md",
  "status.md",
  "user-install.md",
  "yolo.md",
];

test("commands/ directory exists", () => {
  assert(fs.existsSync(pluginPath("commands")), "commands/ directory must exist");
});

test(`all ${expectedCommands.length} command files exist`, () => {
  const missing = [];
  for (const cmd of expectedCommands) {
    if (!fs.existsSync(pluginPath("commands", cmd))) {
      missing.push(cmd);
    }
  }
  assert(missing.length === 0, `Missing command files: ${missing.join(", ")}`);
});

for (const cmd of expectedCommands) {
  test(`commands/${cmd} exists and is non-empty`, () => {
    const fullPath = pluginPath("commands", cmd);
    assert(fs.existsSync(fullPath), `Missing: commands/${cmd}`);
    const content = fs.readFileSync(fullPath, "utf8");
    assert(content.trim().length > 0, `commands/${cmd} is empty`);
  });
}

test("command files have YAML frontmatter", () => {
  for (const cmd of expectedCommands) {
    const content = fs.readFileSync(pluginPath("commands", cmd), "utf8");
    assert(content.startsWith("---"), `${cmd} missing YAML frontmatter (must start with ---)`);
  }
});

// ---------------------------------------------------------------------------
// 5. Skills directory has babysit/SKILL.md
// ---------------------------------------------------------------------------

console.log("\n5. Skills directory:");

test("skills/ directory exists", () => {
  assert(fs.existsSync(pluginPath("skills")), "skills/ directory must exist");
});

test("skills/babysit/ directory exists", () => {
  assert(fs.existsSync(pluginPath("skills", "babysit")), "skills/babysit/ directory must exist");
});

test("skills/babysit/SKILL.md exists and is non-empty", () => {
  const skillPath = pluginPath("skills", "babysit", "SKILL.md");
  assert(fs.existsSync(skillPath), "SKILL.md must exist");
  const content = fs.readFileSync(skillPath, "utf8");
  assert(content.trim().length > 0, "SKILL.md must not be empty");
});

test("SKILL.md references opencode harness", () => {
  const content = fs.readFileSync(pluginPath("skills", "babysit", "SKILL.md"), "utf8");
  assert(content.includes("opencode"), "SKILL.md should reference opencode");
  assert(content.includes("--harness opencode"), "SKILL.md should use --harness opencode");
});

// ---------------------------------------------------------------------------
// 6. versions.json exists and has sdkVersion field
// ---------------------------------------------------------------------------

console.log("\n6. versions.json:");

test("versions.json exists", () => {
  assert(fs.existsSync(pluginPath("versions.json")), "versions.json must exist");
});

test("versions.json is valid JSON", () => {
  const raw = fs.readFileSync(pluginPath("versions.json"), "utf8");
  JSON.parse(raw);
});

test("versions.json has sdkVersion field", () => {
  const versions = JSON.parse(fs.readFileSync(pluginPath("versions.json"), "utf8"));
  assert(typeof versions.sdkVersion === "string", "sdkVersion must be a string");
  assert(versions.sdkVersion.length > 0, "sdkVersion must not be empty");
});

// ---------------------------------------------------------------------------
// 7. package.json has correct name, bin, scripts fields
// ---------------------------------------------------------------------------

console.log("\n7. package.json:");

test("package.json exists", () => {
  assert(fs.existsSync(pluginPath("package.json")), "package.json must exist");
});

test("package.json is valid JSON", () => {
  const raw = fs.readFileSync(pluginPath("package.json"), "utf8");
  JSON.parse(raw);
});

const pkg = JSON.parse(fs.readFileSync(pluginPath("package.json"), "utf8"));

test("package.json has correct name", () => {
  assert(pkg.name === "@a5c-ai/babysitter-opencode", `Expected name "@a5c-ai/babysitter-opencode", got "${pkg.name}"`);
});

test("package.json has bin field", () => {
  assert(pkg.bin && typeof pkg.bin === "object", "bin field must be an object");
  assert(typeof pkg.bin["babysitter-opencode"] === "string", 'bin must have "babysitter-opencode" entry');
});

test("package.json bin target exists", () => {
  const binTarget = pkg.bin["babysitter-opencode"];
  assert(fs.existsSync(pluginPath(binTarget)), `bin target not found: ${binTarget}`);
});

test("package.json has scripts field", () => {
  assert(pkg.scripts && typeof pkg.scripts === "object", "scripts field must be an object");
});

test("package.json has test script", () => {
  assert(typeof pkg.scripts.test === "string", "test script must be defined");
});

test("package.json has postinstall script", () => {
  assert(typeof pkg.scripts.postinstall === "string", "postinstall script must be defined");
});

test("package.json has preuninstall script", () => {
  assert(typeof pkg.scripts.preuninstall === "string", "preuninstall script must be defined");
});

test("package.json has version field", () => {
  assert(typeof pkg.version === "string", "version must be a string");
});

// ---------------------------------------------------------------------------
// 8. bin/install.js exists and is requireable
// ---------------------------------------------------------------------------

console.log("\n8. bin/install.js:");

test("bin/install.js exists", () => {
  assert(fs.existsSync(pluginPath("bin", "install.js")), "bin/install.js must exist");
});

test("bin/install.js has valid JS syntax", () => {
  execSync(`node --check "${pluginPath("bin", "install.js")}"`, { stdio: "pipe" });
});

test("bin/install.cjs exists", () => {
  assert(fs.existsSync(pluginPath("bin", "install.cjs")), "bin/install.cjs must exist");
});

test("bin/install.cjs has valid JS syntax", () => {
  execSync(`node --check "${pluginPath("bin", "install.cjs")}"`, { stdio: "pipe" });
});

// ---------------------------------------------------------------------------
// 9. bin/uninstall.js exists and is requireable
// ---------------------------------------------------------------------------

console.log("\n9. bin/uninstall.js:");

test("bin/uninstall.js exists", () => {
  assert(fs.existsSync(pluginPath("bin", "uninstall.js")), "bin/uninstall.js must exist");
});

test("bin/uninstall.js has valid JS syntax", () => {
  execSync(`node --check "${pluginPath("bin", "uninstall.js")}"`, { stdio: "pipe" });
});

test("bin/uninstall.cjs exists", () => {
  assert(fs.existsSync(pluginPath("bin", "uninstall.cjs")), "bin/uninstall.cjs must exist");
});

test("bin/uninstall.cjs has valid JS syntax", () => {
  execSync(`node --check "${pluginPath("bin", "uninstall.cjs")}"`, { stdio: "pipe" });
});

// ---------------------------------------------------------------------------
// Bonus: bin/cli.cjs and cli.js
// ---------------------------------------------------------------------------

console.log("\n10. bin/cli scripts:");

test("bin/cli.js exists and has valid syntax", () => {
  assert(fs.existsSync(pluginPath("bin", "cli.js")), "bin/cli.js must exist");
  execSync(`node --check "${pluginPath("bin", "cli.js")}"`, { stdio: "pipe" });
});

test("bin/cli.cjs exists and has valid syntax", () => {
  assert(fs.existsSync(pluginPath("bin", "cli.cjs")), "bin/cli.cjs must exist");
  execSync(`node --check "${pluginPath("bin", "cli.cjs")}"`, { stdio: "pipe" });
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"=".repeat(60)}`);
console.log(`Total: ${passed + failed} tests, ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error}`);
  }
}
console.log(`${"=".repeat(60)}`);
process.exit(failed > 0 ? 1 : 0);
