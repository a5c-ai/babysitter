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
  'dist/browser.js',
  'dist/browser.d.ts',
  'dist/kanban.js',
  'dist/kanban.d.ts',
  'dist/automation.js',
  'dist/automation.d.ts',
];

const REQUIRED_PACKED_PATHS = [
  'package.json',
  'README.md',
  'LICENSE',
  ...REQUIRED_BUILD_PATHS,
];

const REQUIRED_README_EXPORTS = [
  '@a5c-ai/agent-mux-comm',
  '@a5c-ai/agent-mux-comm/browser',
  '@a5c-ai/agent-mux-comm/kanban',
  '@a5c-ai/agent-mux-comm/automation',
];

const REQUIRED_README_COMMANDS = [
  'npm run build --workspace=@a5c-ai/agent-mux-comm',
  'npm run test --workspace=@a5c-ai/agent-mux-comm',
  'npm run verify:release --workspace=@a5c-ai/agent-mux-comm',
  'npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-comm',
];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePackPath(value) {
  return typeof value === 'string' ? value.replace(/^package\//, '') : '';
}

function expectExport(exportsMap, subpath, typesPath, defaultPath) {
  const exportEntry = exportsMap[subpath] ?? {};
  const importEntry = exportEntry.import ?? {};
  const requireEntry = exportEntry.require ?? {};

  expect(
    importEntry.types === typesPath && importEntry.default === defaultPath,
    `packages/agent-mux/core/package.json must keep exporting ${subpath} from ${defaultPath} and ${typesPath}`
  );
  expect(
    requireEntry.types === typesPath && requireEntry.default === defaultPath,
    `packages/agent-mux/core/package.json must keep require parity for ${subpath}`
  );
  expect(
    exportEntry.default === defaultPath,
    `packages/agent-mux/core/package.json must keep the default condition for ${subpath}`
  );
}

export function verifyAgentMuxCoreRelease({ packageRoot, manifest, packEntries }) {
  const scripts = manifest.scripts ?? {};
  const exportsMap = manifest.exports ?? {};
  const packedPaths = new Set(packEntries.map((entry) => normalizePackPath(entry.path)));
  const readme = fs.readFileSync(path.join(packageRoot, 'README.md'), 'utf8');

  expect(
    manifest.name === '@a5c-ai/agent-mux-comm',
    'packages/agent-mux/core/package.json name must stay @a5c-ai/agent-mux-comm'
  );
  expect(
    manifest.publishConfig?.access === 'public',
    'packages/agent-mux/core/package.json publishConfig.access must stay public'
  );
  expect(
    Array.isArray(manifest.files) &&
      manifest.files.includes('dist') &&
      manifest.files.includes('README.md') &&
      manifest.files.includes('LICENSE'),
    'packages/agent-mux/core/package.json files must keep dist, README.md, and LICENSE'
  );
  expect(
    manifest.main === './dist/index.js' &&
      manifest.module === './dist/index.js' &&
      manifest.types === './dist/index.d.ts',
    'packages/agent-mux/core/package.json main/module/types must keep pointing at dist/index.*'
  );
  expect(
    scripts.build === 'tsc --build && tsc --emitDeclarationOnly --declarationMap false -p tsconfig.json',
    'packages/agent-mux/core/package.json build must stay on the package-local TypeScript compile path'
  );
  expect(
    scripts.test === 'vitest run --root ../../.. --config vitest.config.ts packages/agent-mux/core',
    'packages/agent-mux/core/package.json test must stay on the package-local Vitest command'
  );
  expect(
    scripts['verify:release'] === 'node ./scripts/verify-release.mjs',
    'packages/agent-mux/core/package.json verify:release must point at the package-local release verifier'
  );
  expect(
    scripts.prepublishOnly === 'npm run build && npm run test && npm run verify:release',
    'packages/agent-mux/core/package.json prepublishOnly must build, test, and verify the release surface'
  );

  expectExport(exportsMap, '.', './dist/index.d.ts', './dist/index.js');
  expectExport(exportsMap, './browser', './dist/browser.d.ts', './dist/browser.js');
  expectExport(exportsMap, './kanban', './dist/kanban.d.ts', './dist/kanban.js');
  expectExport(exportsMap, './automation', './dist/automation.d.ts', './dist/automation.js');

  for (const relativePath of REQUIRED_BUILD_PATHS) {
    expect(
      fs.existsSync(path.join(packageRoot, relativePath)),
      `required build artifact is missing: ${relativePath}`
    );
  }

  for (const packedPath of REQUIRED_PACKED_PATHS) {
    expect(packedPaths.has(packedPath), `npm pack output is missing ${packedPath}`);
  }

  for (const exportedSurface of REQUIRED_README_EXPORTS) {
    expect(
      readme.includes(exportedSurface),
      `packages/agent-mux/core/README.md must keep documenting ${exportedSurface}`
    );
  }

  for (const command of REQUIRED_README_COMMANDS) {
    expect(
      readme.includes(command),
      `packages/agent-mux/core/README.md must keep documenting ${command}`
    );
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

  verifyAgentMuxCoreRelease({
    packageRoot,
    manifest,
    packEntries,
  });

  console.log('agent-comm-mux release verification passed');
}

if (process.argv[1] === __filename) {
  main();
}
