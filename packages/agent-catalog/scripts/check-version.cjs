const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(message);
  process.exit(1);
}

const packageJsonPath = path.resolve(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

if (!packageJson.version || typeof packageJson.version !== "string") {
  fail("package.json must declare a version string.");
}

if (!packageJson.files.includes("evidence")) {
  fail("package.json must publish the evidence directory.");
}

const requiredScripts = [
  "generate:evidence",
  "build",
  "test",
  "validate:evidence:freshness",
  "ci:evidence",
  "policy:check",
  "ci:test",
  "version:check",
];
const missingScripts = requiredScripts.filter((name) => !packageJson.scripts || !packageJson.scripts[name]);
if (missingScripts.length > 0) {
  fail(`Missing required scripts: ${missingScripts.join(", ")}`);
}

console.log(
  JSON.stringify(
    {
      packageVersion: packageJson.version,
      requiredScripts,
    },
    null,
    2,
  ),
);
