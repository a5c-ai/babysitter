const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

const packageJson = JSON.parse(readText(path.join(packageRoot, "package.json")));
const readme = readText(path.join(packageRoot, "README.md"));
const ciWorkflow = readText(path.join(repoRoot, ".github", "workflows", "ci.yml"));
const releaseWorkflow = readText(path.join(repoRoot, ".github", "workflows", "publish.yml"));
const stagingWorkflow = readText(path.join(repoRoot, ".github", "workflows", "publish-packages-from-tag.yml"));
const workspaceValidationDoc = readText(path.join(repoRoot, "docs", "workspace-validation.md"));
const packageMapDoc = readText(path.join(repoRoot, "docs", "package-and-plugin-map.md"));
const releasePipelineDoc = readText(path.join(repoRoot, "docs", "release-pipeline.md"));
const packageMapAgentCatalogLine = packageMapDoc
  .split(/\r?\n/)
  .find((line) => line.includes("`packages/agent-catalog`"));
const releasePipelineAgentCatalogLine = releasePipelineDoc
  .split(/\r?\n/)
  .find((line) => line.includes("@a5c-ai/agent-catalog"));

if (packageJson.private === true) {
  fail("@a5c-ai/agent-catalog must stay publishable and must not be marked private.");
}

if (packageJson.publishConfig?.access !== "public") {
  fail("@a5c-ai/agent-catalog must declare publishConfig.access=\"public\".");
}

if (packageJson.license === "UNLICENSED") {
  fail("@a5c-ai/agent-catalog must declare a public license before npm publishing.");
}

if (!packageJson.scripts?.["policy:check"]) {
  fail("@a5c-ai/agent-catalog must declare policy:check to encode lifecycle policy in CI.");
}

if (!Array.isArray(packageJson.files) || !packageJson.files.includes("README.md")) {
  fail("@a5c-ai/agent-catalog must ship README.md in files so pack/install consumers see the lifecycle policy.");
}

const requiredReadmeSnippets = [
  "public package",
  "published through the central `publish.yml` and `publish-packages-from-tag.yml` workflows",
  "`npm run ci:test --workspace=@a5c-ai/agent-catalog` is the release-equivalent contract",
  "Breaking changes to exported APIs, graph documents, evidence layout, or generated discovery data require a semver-major release",
];

for (const snippet of requiredReadmeSnippets) {
  if (!readme.includes(snippet)) {
    fail(`packages/agent-catalog/README.md must document: ${snippet}`);
  }
}

if (!ciWorkflow.includes("npm run ci:test --workspace=@a5c-ai/agent-catalog")) {
  fail("CI workflow must validate @a5c-ai/agent-catalog through npm run ci:test --workspace=@a5c-ai/agent-catalog.");
}

if (!workspaceValidationDoc.includes("packages/agent-catalog") || !workspaceValidationDoc.includes("publish.yml") || !workspaceValidationDoc.includes("publish-packages-from-tag.yml")) {
  fail("docs/workspace-validation.md must describe @a5c-ai/agent-catalog as a public package validated by CI plus release/staging workflows.");
}

if (!packageMapAgentCatalogLine || !packageMapAgentCatalogLine.includes("Public advanced/runtime package")) {
  fail("docs/package-and-plugin-map.md must classify @a5c-ai/agent-catalog as a public package.");
}

if (!releasePipelineAgentCatalogLine || releasePipelineAgentCatalogLine.includes("intentionally excluded")) {
  fail("docs/release-pipeline.md must describe @a5c-ai/agent-catalog as part of the central publish workflows.");
}

if (!releaseWorkflow.includes("npm publish --workspace=@a5c-ai/agent-catalog --access public")) {
  fail("publish.yml must publish @a5c-ai/agent-catalog as a public package.");
}

if (!stagingWorkflow.includes("@a5c-ai/agent-catalog")) {
  fail("publish-packages-from-tag.yml must include @a5c-ai/agent-catalog in the publish list.");
}

console.log(
  JSON.stringify(
    {
      package: packageJson.name,
      private: packageJson.private ?? false,
      publishStrategy: "public-central-publish",
      validationCommand: "npm run ci:test --workspace=@a5c-ai/agent-catalog",
    },
    null,
    2,
  ),
);
