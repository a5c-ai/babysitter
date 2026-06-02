import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const npmExecPath = process.env.npm_execpath;

const REQUIRED_BUILD_PATHS = [
  'dist/index.html',
  'dist-types/src/main.d.ts',
];

const REQUIRED_PACKED_PATHS = [
  'package.json',
  'README.md',
  'dist/index.html',
  'dist-types/src/main.d.ts',
  'public/favicon.svg',
];

const REQUIRED_PACKED_PREFIXES = ['dist/assets/'];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePackPath(value) {
  return typeof value === 'string' ? value.replace(/^package\//, '') : '';
}

export function verifyAgentMuxWebuiRelease({ packageRoot, manifest, packEntries }) {
  const scripts = manifest.scripts ?? {};
  const packedPaths = new Set(packEntries.map((entry) => normalizePackPath(entry.path)));
  const readme = fs.readFileSync(path.join(packageRoot, 'README.md'), 'utf8');

  expect(
    manifest.name === '@a5c-ai/agent-mux-webui',
    'packages/agent-mux/webui/package.json name must stay @a5c-ai/agent-mux-webui'
  );
  expect(
    manifest.publishConfig?.access === 'public',
    'packages/agent-mux/webui/package.json publishConfig.access must stay public'
  );
  expect(
    scripts['build:realtime'] === 'npm run build --workspace=@a5c-ai/atlas && npm run build --workspace=@a5c-ai/agent-mux-comm && npm run build --workspace=@a5c-ai/agent-mux-ui && npm run build',
    'packages/agent-mux/webui/package.json build:realtime must remain the package-local realtime build entrypoint'
  );
  expect(
    scripts.test === 'vitest run --config vitest.config.ts',
    'packages/agent-mux/webui/package.json test must keep the package-local Vitest config entrypoint stable'
  );
  expect(
    typeof scripts['test:realtime'] === 'string' &&
      scripts['test:realtime'].includes('packages/agent-mux/webui/src/pages/SessionDetailPage.test.ts') &&
      scripts['test:realtime'].includes('packages/agent-mux/webui/src/pages/SessionDetailPage.route.test.tsx') &&
      scripts['test:realtime'].includes('packages/agent-mux/webui/src/release-verification.test.ts'),
    'packages/agent-mux/webui/package.json test:realtime must keep the session-detail and release verification suite together'
  );
  expect(
    scripts['verify:release'] === 'node ./scripts/verify-release.mjs',
    'packages/agent-mux/webui/package.json verify:release must point at the package-local release verifier'
  );
  expect(
    scripts.prepublishOnly === 'npm run build:realtime && npm run test && npm run verify:release',
    'packages/agent-mux/webui/package.json prepublishOnly must exercise the package-local test and release seam directly'
  );
  expect(
    readme.includes('@a5c-ai/agent-mux-ui/session-flow'),
    'packages/agent-mux/webui/README.md must keep documenting the shared session-flow dependency seam'
  );

  for (const relativePath of REQUIRED_BUILD_PATHS) {
    expect(fs.existsSync(path.join(packageRoot, relativePath)), `required build artifact is missing: ${relativePath}`);
  }

  for (const packedPath of REQUIRED_PACKED_PATHS) {
    expect(packedPaths.has(packedPath), `npm pack output is missing ${packedPath}`);
  }

  for (const packedPrefix of REQUIRED_PACKED_PREFIXES) {
    const hasMatch = packEntries.some((entry) => normalizePackPath(entry.path).startsWith(packedPrefix));
    expect(hasMatch, `npm pack output is missing files under ${packedPrefix}`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const packOutput = npmExecPath
    ? execFileSync(process.execPath, [npmExecPath, 'pack', '--json', '--dry-run'], {
        cwd: packageRoot,
        encoding: 'utf8',
      })
    : execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--json', '--dry-run'], {
        cwd: packageRoot,
        encoding: 'utf8',
      });
  const [packResult] = JSON.parse(packOutput);
  const packEntries = Array.isArray(packResult?.files) ? packResult.files : [];

  verifyAgentMuxWebuiRelease({
    packageRoot,
    manifest,
    packEntries,
  });

  console.log('agent-mux-webui release verification passed');
}

if (process.argv[1] === __filename) {
  main();
}
