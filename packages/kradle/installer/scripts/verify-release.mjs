import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const REQUIRED_BUILD_PATHS = [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/cli.js",
  "dist/cli.d.ts",
];

const REQUIRED_PACKED_PATHS = [
  "package.json",
  "README.md",
  "SPEC.md",
  "LICENSE",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/cli.js",
  "dist/cli.d.ts",
];

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePackPath(value) {
  return typeof value === "string" ? value.replace(/^package\//, "") : "";
}

export function verifyCloudRelease({ packageRoot, manifest, packEntries }) {
  const scripts = manifest.scripts ?? {};
  const exportsMap = manifest.exports ?? {};
  const rootExport = exportsMap["."]?.import ?? {};
  const cliExport = exportsMap["./cli"]?.import ?? {};
  const packedPaths = new Set(packEntries.map((entry) => normalizePackPath(entry.path)));
  const readme = fs.readFileSync(path.join(packageRoot, "README.md"), "utf8");

  expect(
    manifest.name === "@a5c-ai/cloud",
    "packages/cloud/package.json name must stay @a5c-ai/cloud",
  );
  expect(
    manifest.publishConfig?.access === "public",
    "packages/cloud/package.json publishConfig.access must stay public",
  );
  expect(
    Array.isArray(manifest.files) &&
      manifest.files.includes("dist") &&
      manifest.files.includes("README.md") &&
      manifest.files.includes("SPEC.md") &&
      manifest.files.includes("LICENSE"),
    "packages/cloud/package.json files must keep dist, README.md, SPEC.md, and LICENSE",
  );
  expect(
    scripts.build === "npm exec --yes --package=typescript --package=@types/node -- tsc --build && npm exec --yes --package=typescript --package=@types/node -- tsc --emitDeclarationOnly --declarationMap false -p tsconfig.json",
    "packages/cloud/package.json build must stay on the local TypeScript compile path",
  );
  expect(
    scripts.test === "npm exec --yes --package=vitest -- vitest run --config vitest.config.ts",
    "packages/cloud/package.json test must stay on the package-local Vitest command",
  );
  expect(
    scripts["test:coverage"] === "npm exec --yes --package=vitest -- vitest run --config vitest.config.ts --coverage",
    "packages/cloud/package.json test:coverage must run the package-local coverage command",
  );
  expect(
    scripts["verify:release"] === "node ./scripts/verify-release.mjs",
    "packages/cloud/package.json verify:release must point at the package-local release verifier",
  );
  expect(
    scripts.prepublishOnly === "npm run build && npm run test && npm run verify:release",
    "packages/cloud/package.json prepublishOnly must build, test, and verify the release surface",
  );
  expect(
    manifest.bin?.cloud === "./dist/cli.js",
    "packages/cloud/package.json bin.cloud must point to ./dist/cli.js",
  );
  expect(
    rootExport.types === "./dist/index.d.ts" && rootExport.default === "./dist/index.js",
    "packages/cloud/package.json root export must keep dist/index.*",
  );
  expect(
    cliExport.types === "./dist/cli.d.ts" && cliExport.default === "./dist/cli.js",
    "packages/cloud/package.json ./cli export must keep dist/cli.*",
  );
  expect(
    readme.includes("(./SPEC.md)"),
    "packages/cloud/README.md must keep linking ./SPEC.md",
  );

  for (const relativePath of REQUIRED_BUILD_PATHS) {
    expect(
      fs.existsSync(path.join(packageRoot, relativePath)),
      `required build artifact is missing: ${relativePath}`,
    );
  }

  for (const packedPath of REQUIRED_PACKED_PATHS) {
    expect(packedPaths.has(packedPath), `npm pack output is missing ${packedPath}`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  const packOutput = execFileSync("npm", ["pack", "--json", "--dry-run"], {
    cwd: packageRoot,
    encoding: "utf8",
  });
  const [packResult] = JSON.parse(packOutput);
  const packEntries = Array.isArray(packResult?.files) ? packResult.files : [];

  verifyCloudRelease({
    packageRoot,
    manifest,
    packEntries,
  });

  console.log("cloud release verification passed");
}

if (process.argv[1] === __filename) {
  main();
}
