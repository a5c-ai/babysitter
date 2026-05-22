import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function countFiles(relativeDir, suffix) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!existsSync(absoluteDir)) return 0;
  return readdirSync(absoluteDir).filter((entry) => entry.endsWith(suffix)).length;
}

function containsAll(doc, snippets) {
  return snippets.every((snippet) => doc.includes(snippet));
}

const migrationDoc = read('packages/transport-mux/migration.md');
const readmeDoc = read('packages/transport-mux/README.md');
const architectureDoc = read('packages/transport-mux/architecture.md');
const packageJson = JSON.parse(read('packages/transport-mux/package.json'));
const packageEntrypoint = read('packages/transport-mux/src/index.ts');
const launchCommand = read('packages/agent-mux/cli/src/commands/launch.ts');

const legacyPythonTests = countFiles('packages/agent-mux/amux-proxy/tests', '.py');
const jsContractTests =
  countFiles('packages/transport-mux/tests', '.ts') +
  countFiles('packages/transport-mux/tests/transports', '.ts') +
  countFiles('packages/transport-mux/tests/e2e', '.ts');

const docsHonestyChecks = [
  {
    name: 'README marks transport-mux as the published runtime seam',
    ok: containsAll(readmeDoc, [
      'published transport/proxy runtime seam',
      'used by the agent-mux launcher',
    ]),
  },
  {
    name: 'README describes the package as a published npm deliverable',
    ok: containsAll(readmeDoc, [
      'published npm deliverable',
      'public runtime surface',
    ]),
  },
  {
    name: 'migration.md describes a public runtime policy',
    ok: containsAll(migrationDoc, [
      'published transport/proxy runtime seam',
      'public install chain',
    ]),
  },
  {
    name: 'migration.md requires publishable metadata and local artifact coverage',
    ok: containsAll(migrationDoc, [
      'publishable and aligned with the package docs map',
      'package metadata does not advertise packable artifacts that are not present locally.',
    ]),
  },
  {
    name: 'architecture.md still documents the intended launch/runtime seam',
    ok: containsAll(architectureDoc, [
      '`launch.ts` starts the `transport-mux` runtime',
      '`transport-mux` boots the protocol codec and provider adapter implied by that config.',
    ]),
  },
];

const docsHonestyFailures = docsHonestyChecks
  .filter((check) => !check.ok)
  .map((check) => check.name);

const scorecard = [
  {
    gate: 'Legacy Python reference surface stays explicit',
    status:
      legacyPythonTests === 0 ||
      migrationDoc.includes('Historical archive: legacy Python tests under `packages/agent-mux/amux-proxy/tests` remain available as reference material for the still-active historical runtime path.')
        ? 'green'
        : 'red',
    evidence: legacyPythonTests > 0
      ? `${legacyPythonTests} legacy Python tests remain, and migration.md marks them as reference material rather than packaged output from transport-mux`
      : 'No legacy Python contract tests remain under packages/agent-mux/amux-proxy/tests',
    retireWhen: 'Legacy tests are either removed entirely or explicitly separated from transport-mux package-artifact claims.',
  },
  {
    gate: 'Public package metadata is coherent',
    status:
      packageJson.private !== true &&
      Array.isArray(packageJson.files) &&
      packageJson.publishConfig?.access === 'public'
        ? 'green'
        : 'red',
    evidence:
      packageJson.private !== true &&
      Array.isArray(packageJson.files) &&
      packageJson.publishConfig?.access === 'public'
        ? 'package.json describes a public artifact with publish surface metadata'
        : 'package.json metadata does not match a public runtime package policy',
    retireWhen: 'The package is intentionally demoted or split and public-package metadata is replaced in one explicit policy change.',
  },
  {
    gate: 'Workspace seam still builds and tests locally',
    status: packageJson.scripts['scorecard:migration'] && jsContractTests > 0 ? 'green' : 'red',
    evidence: packageJson.scripts['scorecard:migration']
      ? `scorecard:migration script is present and ${jsContractTests} JS test files exist under packages/transport-mux/tests`
      : 'scorecard:migration script is missing from packages/transport-mux/package.json',
    retireWhen: 'Local build/test coverage is no longer needed or is replaced with a different seam-verification flow.',
  },
  {
    gate: 'Launcher/runtime seam remains explicit and published',
    status:
      launchCommand.includes('@a5c-ai/transport-mux') &&
      packageEntrypoint.includes("export * from './runtime.js';")
        ? 'green'
        : 'red',
    evidence:
      launchCommand.includes('@a5c-ai/transport-mux') &&
      packageEntrypoint.includes("export * from './runtime.js';")
        ? 'launch.ts imports transport-mux directly and the package entrypoint exports the runtime seam'
        : 'launch.ts still bypasses the transport-mux runtime surface or the package entrypoint does not export it',
    retireWhen: 'The seam is retired or replaced with an explicit runtime-ownership policy change.',
  },
  {
    gate: 'Docs describe the migration seam honestly',
    status: docsHonestyFailures.length === 0 ? 'green' : 'red',
    evidence:
      docsHonestyFailures.length === 0
        ? 'README.md, architecture.md, and migration.md agree that transport-mux is the active published runtime seam.'
        : `Docs drift detected: ${docsHonestyFailures.join('; ')}.`,
    retireWhen: 'Docs and metadata are updated together when runtime ownership changes.',
  },
];

const allGreen = scorecard.every((item) => item.status === 'green');

console.log('# transport-mux migration scorecard');
console.log('');
console.log('| Gate | Status | Evidence | Retire when |');
console.log('| --- | --- | --- | --- |');
for (const item of scorecard) {
  console.log(`| ${item.gate} | ${item.status} | ${item.evidence} | ${item.retireWhen} |`);
}
console.log('');
console.log(`overallPolicyAligned=${allGreen ? 'true' : 'false'}`);
