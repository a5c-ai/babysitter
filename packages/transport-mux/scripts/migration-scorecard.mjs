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

function exists(relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

function countFiles(relativeDir, suffix) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!existsSync(absoluteDir)) return 0;
  return readdirSync(absoluteDir).filter((entry) => entry.endsWith(suffix)).length;
}

const migrationDoc = read('packages/transport-mux/migration.md');
const readmeDoc = read('packages/transport-mux/README.md');
const packageJson = JSON.parse(read('packages/transport-mux/package.json'));
const launchCommand = read('packages/agent-mux/cli/src/commands/launch.ts');
const releaseWorkflow = read('.github/workflows/release.yml');
const stagingWorkflow = read('.github/workflows/staging-publish.yml');
const legacyPublishWorkflow = read('packages/agent-mux/meta/github/workflows/publish.yml');
const legacyProxyCiWorkflow = read('packages/agent-mux/meta/github/workflows/amux-proxy-ci.yml');

const legacyPythonTests = countFiles('packages/agent-mux/amux-proxy/tests', '.py');
const jsContractTests =
  countFiles('packages/transport-mux/tests', '.ts') +
  countFiles('packages/transport-mux/tests/transports', '.ts') +
  countFiles('packages/transport-mux/tests/e2e', '.ts');

const scorecard = [
  {
    gate: 'Legacy Python contract truth is tracked explicitly',
    status: legacyPythonTests > 0 ? 'yellow' : 'green',
    evidence: legacyPythonTests > 0
      ? `${legacyPythonTests} Python tests remain under packages/agent-mux/amux-proxy/tests`
      : 'No legacy Python contract tests remain under packages/agent-mux/amux-proxy/tests',
    retireWhen: 'Legacy tests are removed or archived only after launcher, JS runtime, docs, CI, and packaging gates are all green.',
  },
  {
    gate: 'JS transport-mux validation surface is explicit',
    status: packageJson.scripts['scorecard:migration'] && jsContractTests > 0 ? 'green' : 'red',
    evidence: packageJson.scripts['scorecard:migration']
      ? `scorecard:migration script is present and ${jsContractTests} JS test files exist under packages/transport-mux/tests`
      : 'scorecard:migration script is missing from packages/transport-mux/package.json',
    retireWhen: 'The package keeps publishing its own build/test/scorecard entrypoints while the seam is still a placeholder.',
  },
  {
    gate: 'Launcher/runtime cutover is complete',
    status: launchCommand.includes('@a5c-ai/transport-mux') ? 'green' : 'red',
    evidence: launchCommand.includes('@a5c-ai/transport-mux')
      ? 'launch.ts imports transport-mux directly'
      : 'launch.ts still resolves provider config and proxy env without importing the transport-mux runtime surface',
    retireWhen: 'launch.ts resolves into the runtime exported by packages/transport-mux instead of an independent proxy path.',
  },
  {
    gate: 'Docs describe the migration seam honestly',
    status:
      migrationDoc.includes('Migration scorecard') &&
      migrationDoc.includes('Retire legacy truth only when every row below is green.') &&
      readmeDoc.includes('internal placeholder workspace')
        ? 'green'
        : 'red',
    evidence: 'migration.md and README.md both describe transport-mux as a placeholder seam and record the scorecard/cutover criteria.',
    retireWhen: 'Docs can switch from placeholder language only after the runtime, launcher, CI, and packaging surfaces converge.',
  },
  {
    gate: 'Publish and CI surfaces are converged',
    status:
      !releaseWorkflow.includes('@a5c-ai/transport-mux') &&
      !stagingWorkflow.includes('@a5c-ai/transport-mux') &&
      legacyPublishWorkflow.includes('Publish amux-proxy to PyPI')
        ? 'red'
        : 'green',
    evidence:
      'root release/staging workflows do not publish @a5c-ai/transport-mux, while the legacy publish workflow still ships amux-proxy artifacts.',
    retireWhen: 'transport-mux has explicit publish/CI ownership and the legacy publish path is removed or archived.',
  },
  {
    gate: 'Legacy binary/container ownership is retired or archived',
    status: legacyProxyCiWorkflow.includes('packages/amux-proxy') ? 'red' : 'green',
    evidence: legacyProxyCiWorkflow.includes('packages/amux-proxy')
      ? 'legacy amux-proxy CI still exists under packages/agent-mux/meta/github/workflows/amux-proxy-ci.yml'
      : 'legacy amux-proxy CI surface is absent',
    retireWhen: 'The amux-proxy binary/container path is owned by transport-mux or explicitly documented as historical only.',
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
console.log(`overallCutoverReady=${allGreen ? 'true' : 'false'}`);
