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
  'dist/plugin.js',
  'dist/plugin.d.ts',
  'dist/bin/agent-mux-tui.js',
  'dist/bin/amux-tui.js',
];

const REQUIRED_PACKED_PATHS = [
  'package.json',
  'README.md',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/plugin.js',
  'dist/plugin.d.ts',
  'dist/bin/agent-mux-tui.js',
  'dist/bin/amux-tui.js',
  'specs/kanban-workspaces-spec.md',
  'specs/kanban-workspaces-subtasks.md',
];

const REQUIRED_README_SPEC_LINKS = [
  '(specs/kanban-workspaces-spec.md)',
  '(specs/kanban-workspaces-subtasks.md)',
];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePackPath(value) {
  return typeof value === 'string' ? value.replace(/^package\//, '') : '';
}

export function verifyAgentMuxTuiRelease({ packageRoot, manifest, packEntries }) {
  const scripts = manifest.scripts ?? {};
  const exportsMap = manifest.exports ?? {};
  const pluginExport = exportsMap['./plugin']?.import ?? {};
  const packedPaths = new Set(packEntries.map((entry) => normalizePackPath(entry.path)));
  const readme = fs.readFileSync(path.join(packageRoot, 'README.md'), 'utf8');

  expect(
    manifest.name === '@a5c-ai/agent-mux-tui',
    'packages/agent-mux/tui/package.json name must stay @a5c-ai/agent-mux-tui'
  );
  expect(
    manifest.publishConfig?.access === 'public',
    'packages/agent-mux/tui/package.json publishConfig.access must stay public'
  );
  expect(
    Array.isArray(manifest.files) && manifest.files.includes('specs'),
    'packages/agent-mux/tui/package.json files must keep shipping specs/'
  );
  expect(
    scripts.build === 'cd ../../.. && node scripts/agent-mux-build.cjs build packages/agent-mux/tui',
    'packages/agent-mux/tui/package.json build must stay routed through scripts/agent-mux-build.cjs'
  );
  expect(
    scripts.test === 'cd ../../.. && node scripts/agent-mux-build.cjs test packages/agent-mux/tui',
    'packages/agent-mux/tui/package.json test must stay routed through scripts/agent-mux-build.cjs'
  );
  expect(
    scripts['verify:release'] === 'node ./scripts/verify-release.mjs',
    'packages/agent-mux/tui/package.json verify:release must point at the package-local release verifier'
  );
  expect(
    scripts.prepublishOnly === 'npm run build && npm run verify:release',
    'packages/agent-mux/tui/package.json prepublishOnly must build the package and run verify:release'
  );
  expect(
    manifest.bin?.['agent-mux-tui'] === './dist/bin/agent-mux-tui.js',
    'packages/agent-mux/tui/package.json bin.agent-mux-tui must point to ./dist/bin/agent-mux-tui.js'
  );
  expect(
    manifest.bin?.['amux-tui'] === './dist/bin/amux-tui.js',
    'packages/agent-mux/tui/package.json bin.amux-tui must point to ./dist/bin/amux-tui.js'
  );
  expect(
    pluginExport.types === './dist/plugin.d.ts' &&
      pluginExport.default === './dist/plugin.js',
    'packages/agent-mux/tui/package.json must keep exporting ./plugin from dist/plugin.*'
  );

  for (const relativePath of REQUIRED_BUILD_PATHS) {
    expect(
      fs.existsSync(path.join(packageRoot, relativePath)),
      `required build artifact is missing: ${relativePath}`
    );
  }

  for (const packedPath of REQUIRED_PACKED_PATHS) {
    expect(packedPaths.has(packedPath), `npm pack output is missing ${packedPath}`);
  }

  for (const readmeLink of REQUIRED_README_SPEC_LINKS) {
    expect(
      readme.includes(readmeLink),
      `packages/agent-mux/tui/README.md must keep linking ${readmeLink}`
    );
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const packArgs = ['pack', '--json', '--dry-run'];
  const npmExecPath = process.env.npm_execpath;
  const packOutput = npmExecPath
    ? execFileSync(process.execPath, [npmExecPath, ...packArgs], {
        cwd: packageRoot,
        encoding: 'utf8',
      })
    : execFileSync('npm', packArgs, {
        cwd: packageRoot,
        encoding: 'utf8',
        shell: process.platform === 'win32',
      });
  const [packResult] = JSON.parse(packOutput);
  const packEntries = Array.isArray(packResult?.files) ? packResult.files : [];

  verifyAgentMuxTuiRelease({
    packageRoot,
    manifest,
    packEntries,
  });

  console.log('agent-mux-tui release verification passed');
}

if (process.argv[1] === __filename) {
  main();
}
