const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const stagedDocPrefixes = [
  "docs/cli-examples.md",
  "docs/github-actions-setup-babysitter.md",
  "docs/github-actions-setup-claude-code.md",
  "docs/github-actions-setup-codex.md",
  "docs/github-actions-setup-gemini-cli.md",
  "docs/release-pipeline.md",
  "docs/v6-spec-and-roadmap/testing-framework.md",
  "docs/v6-spec-and-roadmap/v6-implementation-roadmap.md",
];

const repoCommandValidationPrefixes = [
  ...stagedDocPrefixes,
];

const publishedDocsExcludePatterns = [
  "assets/**",
  "generated/**",
  "reference-repos/**",
  "retrospectives/**",
  "harness-features-backlog/**",
  "user-guide/generated/**",
  "user-guide/01-discovery-analysis.md",
  "user-guide/02-audience-personas.md",
  "user-guide/03-information-architecture.md",
  "user-guide/BEST-PRACTICES.md",
  "user-guide/SUMMARY.md",
  "agent-mux/research/**",
  "agent-mux/superpowers/plans/**",
  "reference/COMMANDS_AND_HOOKS_VERIFICATION_2026-01-20.md",
  "reference/GENERALIZED_HOOK_SYSTEM_IMPLEMENTATION.md",
  "reference/HOOK_DRIVEN_ORCHESTRATION.md",
  "reference/HOOK_ORCHESTRATION_EXAMPLES.md",
  "reference/HOOK_ORCHESTRATION_SUMMARY.md",
  "reference/IN_SESSION_LOOP_MECHANISM.md",
  "reference/LEGACY_AUTO_RUN_REMOVAL_2026-01-19.md",
  "reference/NATIVE_HOOKS_INTEGRATION_2026-01-19.md",
  "reference/PACKAGING_PROCESSES_WITH_SKILLS.md",
  "reference/PROCESS_EXAMPLES_WITH_AGENT_SKILL_INVOCATION.md",
  "reference/PROCESS_PACKAGING_IMPLEMENTATION_2026-01-20.md",
  "reference/PROCESS_SELECTION.md",
  "reference/STANDARD_PROCESS_LIBRARY_2026-01-20.md",
];

const historicalDocPrefixes = [
  "docs/reference-repos/",
  "docs/retrospectives/",
  "docs/harness-features-backlog/",
  "docs/agent-mux/research/",
  "docs/agent-mux/superpowers/plans/",
];

const historicalDocFiles = [
  "docs/reference/COMMANDS_AND_HOOKS_VERIFICATION_2026-01-20.md",
  "docs/reference/GENERALIZED_HOOK_SYSTEM_IMPLEMENTATION.md",
  "docs/reference/HOOK_DRIVEN_ORCHESTRATION.md",
  "docs/reference/HOOK_ORCHESTRATION_EXAMPLES.md",
  "docs/reference/HOOK_ORCHESTRATION_SUMMARY.md",
  "docs/reference/IN_SESSION_LOOP_MECHANISM.md",
  "docs/reference/LEGACY_AUTO_RUN_REMOVAL_2026-01-19.md",
  "docs/reference/NATIVE_HOOKS_INTEGRATION_2026-01-19.md",
  "docs/reference/PACKAGING_PROCESSES_WITH_SKILLS.md",
  "docs/reference/PROCESS_EXAMPLES_WITH_AGENT_SKILL_INVOCATION.md",
  "docs/reference/PROCESS_PACKAGING_IMPLEMENTATION_2026-01-20.md",
  "docs/reference/PROCESS_SELECTION.md",
  "docs/reference/STANDARD_PROCESS_LIBRARY_2026-01-20.md",
];

const publishedLandingPages = [
  "docs/user-guide/index.md",
  "docs/user-guide/getting-started/README.md",
  "docs/user-guide/tutorials/index.md",
  "docs/user-guide/features/index.md",
  "docs/user-guide/reference/index.md",
  "docs/agent-mux/README.md",
  "docs/agent-mux/tutorials/README.md",
  "docs/agent-mux/reference/README.md",
  "docs/agent-mux/archive/README.md",
  "docs/assimilation/index.md",
  "docs/assimilation/harness/index.md",
  "docs/plugins.md",
  "docs/reference/index.md",
  "docs/agent-reference/README.md",
  "docs/v6-spec-and-roadmap/README.md",
  "docs/v6-spec-and-roadmap/implementation/index.md",
  "docs/v6-spec-and-roadmap/decisions/index.md",
  "docs/articles/index.md",
];

const requiredPublishedFrontmatterDocs = [
  ...publishedLandingPages,
  ...stagedDocPrefixes.map((value) => `docs/${value.split("/").slice(1).join("/")}`),
  "docs/workspace-validation.md",
];

const futurePackageReferencePrefixes = [
  "docs/v6-spec-and-roadmap/",
];

function normalizeSlashes(value) {
  return value.split(path.sep).join("/");
}

function isWithinPrefixes(relativePath, prefixes) {
  return prefixes.some((prefix) => relativePath === prefix || relativePath.startsWith(prefix));
}

function isStagedDoc(relativePath) {
  return isWithinPrefixes(relativePath, stagedDocPrefixes);
}

function isRepoCommandSurface(relativePath) {
  return isWithinPrefixes(relativePath, repoCommandValidationPrefixes);
}

function isHistoricalDoc(relativePath) {
  return historicalDocPrefixes.some((prefix) => relativePath.startsWith(prefix)) || historicalDocFiles.includes(relativePath);
}

function isPublishedDoc(relativePath) {
  return !isHistoricalDoc(relativePath);
}

module.exports = {
  repoRoot,
  docsRoot: path.join(repoRoot, "docs"),
  docsSiteRoot: path.join(repoRoot, "docs-site"),
  stagedDocPrefixes,
  repoCommandValidationPrefixes,
  generatedDocMaxAgeDays: 45,
  humanDocReportAgeDays: 120,
  externalLinkTimeoutMs: 15000,
  externalLinkRetries: 2,
  normalizeSlashes,
  isStagedDoc,
  isRepoCommandSurface,
  isHistoricalDoc,
  isPublishedDoc,
  historicalDocPrefixes,
  historicalDocFiles,
  publishedDocsExcludePatterns,
  publishedLandingPages,
  requiredPublishedFrontmatterDocs,
  futurePackageReferencePrefixes,
};
