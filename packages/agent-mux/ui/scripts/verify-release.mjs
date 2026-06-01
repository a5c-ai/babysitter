import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

const REQUIRED_BUILD_PATHS = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/session-flow.js',
  'dist/session-flow.d.ts',
];

const REQUIRED_PACKED_PATHS = [
  'package.json',
  'README.md',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/session-flow.js',
  'dist/session-flow.d.ts',
];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePackPath(value) {
  return typeof value === 'string' ? value.replace(/^package\//, '') : '';
}

export function verifyAgentMuxUiRelease({ packageRoot, manifest, packEntries }) {
  const scripts = manifest.scripts ?? {};
  const exportsMap = manifest.exports ?? {};
  const sessionFlowExport = exportsMap['./session-flow']?.import ?? {};
  const packedPaths = new Set(packEntries.map((entry) => normalizePackPath(entry.path)));
  const readme = fs.readFileSync(path.join(packageRoot, 'README.md'), 'utf8');

  expect(manifest.name === '@a5c-ai/agent-mux-ui', 'packages/agent-mux/ui/package.json name must stay @a5c-ai/agent-mux-ui');
  expect(
    manifest.publishConfig?.access === 'public',
    'packages/agent-mux/ui/package.json publishConfig.access must stay public'
  );
  expect(
    scripts['build:realtime'] === 'npm run build --workspace=@a5c-ai/atlas && npm run build --workspace=@a5c-ai/agent-comm-mux && npm run build',
    'packages/agent-mux/ui/package.json build:realtime must remain a package-local realtime build entrypoint'
  );
  expect(
    scripts.test === 'vitest run --root ../../.. --config vitest.config.ts packages/agent-mux/ui',
    'packages/agent-mux/ui/package.json test must keep the package-local Vitest filter stable'
  );
  expect(
    typeof scripts['test:realtime'] === 'string' &&
      scripts['test:realtime'].includes('packages/agent-mux/ui/src/session-flow*.test.ts') &&
      scripts['test:realtime'].includes('packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx') &&
      scripts['test:realtime'].includes('packages/agent-mux/ui/src/release-verification.test.ts'),
    'packages/agent-mux/ui/package.json test:realtime must keep the projector, screen, and release assertions together'
  );
  expect(
    scripts['verify:release'] === 'node ./scripts/verify-release.mjs',
    'packages/agent-mux/ui/package.json verify:release must point at the package-local release verifier'
  );
  expect(
    scripts.prepublishOnly === 'npm run build:realtime && npm run test:realtime && npm run verify:release',
    'packages/agent-mux/ui/package.json prepublishOnly must exercise the realtime package seam directly'
  );
  expect(
    sessionFlowExport.types === './dist/session-flow.d.ts' &&
      sessionFlowExport.default === './dist/session-flow.js',
    'packages/agent-mux/ui/package.json must keep exporting ./session-flow from dist/session-flow.*'
  );
  expect(
    readme.includes('@a5c-ai/agent-mux-ui/session-flow'),
    'packages/agent-mux/ui/README.md must keep documenting the public session-flow export'
  );

  for (const relativePath of REQUIRED_BUILD_PATHS) {
    expect(fs.existsSync(path.join(packageRoot, relativePath)), `required build artifact is missing: ${relativePath}`);
  }

  for (const packedPath of REQUIRED_PACKED_PATHS) {
    expect(packedPaths.has(packedPath), `npm pack output is missing ${packedPath}`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const packOutput = execFileSync('npm', ['pack', '--json', '--dry-run'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  const [packResult] = JSON.parse(packOutput);
  const packEntries = Array.isArray(packResult?.files) ? packResult.files : [];

  verifyAgentMuxUiRelease({
    packageRoot,
    manifest,
    packEntries,
  });

  console.log('agent-mux-ui release verification passed');
}

if (process.argv[1] === __filename) {
  main();
}
