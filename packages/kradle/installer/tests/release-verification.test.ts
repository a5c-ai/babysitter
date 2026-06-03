import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { verifyCloudRelease } from "../scripts/verify-release.mjs";

const baseManifest = {
  name: "@a5c-ai/cloud",
  publishConfig: {
    access: "public",
  },
  files: ["dist", "README.md", "SPEC.md", "LICENSE"],
  bin: {
    cloud: "./dist/cli.js",
  },
  exports: {
    ".": {
      import: {
        types: "./dist/index.d.ts",
        default: "./dist/index.js",
      },
    },
    "./cli": {
      import: {
        types: "./dist/cli.d.ts",
        default: "./dist/cli.js",
      },
    },
    "./package.json": "./package.json",
  },
  scripts: {
    build: "npm exec --yes --package=typescript --package=@types/node -- tsc --build && npm exec --yes --package=typescript --package=@types/node -- tsc --emitDeclarationOnly --declarationMap false -p tsconfig.json",
    test: "npm exec --yes --package=vitest -- vitest run --config vitest.config.ts",
    "test:coverage": "npm exec --yes --package=vitest -- vitest run --config vitest.config.ts --coverage",
    "verify:release": "node ./scripts/verify-release.mjs",
    prepublishOnly: "npm run build && npm run test && npm run verify:release",
  },
};

const basePackEntries = [
  { path: "package.json" },
  { path: "README.md" },
  { path: "SPEC.md" },
  { path: "LICENSE" },
  { path: "dist/index.js" },
  { path: "dist/index.d.ts" },
  { path: "dist/cli.js" },
  { path: "dist/cli.d.ts" },
];

function withPackageRoot(run: (packageRoot: string) => void): void {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cloud-release-"));
  fs.mkdirSync(path.join(packageRoot, "dist"), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "dist", "index.js"), "export {};");
  fs.writeFileSync(path.join(packageRoot, "dist", "index.d.ts"), "export {};");
  fs.writeFileSync(path.join(packageRoot, "dist", "cli.js"), "export {};");
  fs.writeFileSync(path.join(packageRoot, "dist", "cli.d.ts"), "export {};");
  fs.writeFileSync(
    path.join(packageRoot, "README.md"),
    "# @a5c-ai/cloud\n\nSee the [package spec](./SPEC.md).\n",
  );
  fs.writeFileSync(path.join(packageRoot, "SPEC.md"), "# Spec\n");
  fs.writeFileSync(path.join(packageRoot, "LICENSE"), "MIT License\n");

  try {
    run(packageRoot);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
}

describe("verifyCloudRelease", () => {
  it("accepts the expected cloud release contract", () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyCloudRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        }),
      ).not.toThrow();
    });
  });

  it("fails when prepublishOnly stops enforcing verify:release", () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyCloudRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              prepublishOnly: "npm run build && npm run test",
            },
          },
          packEntries: basePackEntries,
        }),
      ).toThrow(/prepublishOnly/);
    });
  });

  it("fails when the CLI export is removed", () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyCloudRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            exports: {
              ".": baseManifest.exports["."],
              "./package.json": "./package.json",
            },
          },
          packEntries: basePackEntries,
        }),
      ).toThrow(/\.\/cli/);
    });
  });

  it("fails when SPEC.md falls out of the tarball", () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyCloudRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter((entry) => entry.path !== "SPEC.md"),
        }),
      ).toThrow(/SPEC\.md/);
    });
  });

  it("fails when README stops linking the local package spec", () => {
    withPackageRoot((packageRoot) => {
      fs.writeFileSync(path.join(packageRoot, "README.md"), "# @a5c-ai/cloud\n\nNo spec link.\n");

      expect(() =>
        verifyCloudRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        }),
      ).toThrow(/SPEC\.md/);
    });
  });
});
