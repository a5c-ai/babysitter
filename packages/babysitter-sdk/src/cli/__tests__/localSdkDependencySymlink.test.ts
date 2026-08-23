/**
 * Regression tests for the project-local SDK fallback link (issue #1757).
 *
 * The SDK package is symlinked into the user's workspace so process modules
 * can import it. The link target must be relative to the link's parent:
 * an absolute target makes any later archive of the workspace unextractable
 * (Python's tarfile data filter raises AbsoluteLinkError and stops there,
 * silently dropping every member after the link).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import {
  ensureProcessLocalSdkDependency,
  validateProcessEntrypoint,
} from "../main/runSupport";

describe("project-local SDK fallback link", () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-link-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  // The SDK is deliberately not resolvable from the fake project, so
  // ensureProcessLocalSdkDependency has to create the fallback link.
  function makeUnresolvableRequire() {
    const requireFn = (() => {
      throw new Error("not installed");
    }) as unknown as ReturnType<typeof createRequire>;
    requireFn.resolve = () => {
      throw new Error("not installed");
    };
    return () => requireFn;
  }

  async function writeFakeSdkPackage(packageRoot: string, marker: string): Promise<string> {
    const resolvedRoot = path.resolve(packageRoot);
    await fs.mkdir(path.join(resolvedRoot, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(resolvedRoot, "package.json"),
      JSON.stringify({
        name: "@a5c-ai/babysitter-sdk",
        type: "commonjs",
        main: "dist/index.js",
      }, null, 2),
      "utf8",
    );
    await fs.writeFile(
      path.join(resolvedRoot, "dist", "index.js"),
      `exports.__marker = ${JSON.stringify(marker)};
exports.defineTask = function defineTask() { return null; };
`,
      "utf8",
    );
    return resolvedRoot;
  }

  it("creates the fallback link with a relative target that resolves to the SDK package", async () => {
    const entryDir = path.join(tmpRoot, "work");
    const entryFile = path.join(entryDir, "process.mjs");
    const sdkPkgDir = path.join(tmpRoot, "sdk-install", "node_modules", "@a5c-ai", "babysitter-sdk");
    await fs.mkdir(entryDir, { recursive: true });
    await fs.writeFile(entryFile, "export async function process() { return 'ok'; }\n", "utf8");

    const symlinkCalls: Array<[string, string, string | undefined]> = [];
    const fsImpl = {
      access: vi.fn().mockRejectedValue({ code: "ENOENT" }),
      mkdir: vi.fn().mockResolvedValue(undefined),
      symlink: vi.fn(async (target: string, linkPath: string, type?: string) => {
        symlinkCalls.push([target, linkPath, type]);
      }),
    } as unknown as Parameters<typeof ensureProcessLocalSdkDependency>[1]["fsImpl"];

    await ensureProcessLocalSdkDependency(entryFile, {
      createRequireFn: makeUnresolvableRequire(),
      resolveSdkPackageDir: () => sdkPkgDir,
      fsImpl,
    });

    expect(symlinkCalls).toHaveLength(1);
    const [target, linkPath] = symlinkCalls[0]!;
    expect(linkPath).toBe(path.join(entryDir, "node_modules", "@a5c-ai", "babysitter-sdk"));
    expect(path.isAbsolute(target)).toBe(false);
    expect(path.resolve(path.dirname(linkPath), target)).toBe(path.normalize(sdkPkgDir));
  });

  it("writes a relative fallback link on the real filesystem and keeps the SDK resolvable", async () => {
    const entryDir = path.join(tmpRoot, "work");
    const entryFile = path.join(entryDir, "process.mjs");
    const sdkPkgDir = await writeFakeSdkPackage(path.join(tmpRoot, "sdk-install"), "fallback");
    await fs.mkdir(entryDir, { recursive: true });
    await fs.writeFile(entryFile, "export async function process() { return 'ok'; }\n", "utf8");

    await ensureProcessLocalSdkDependency(entryFile, {
      createRequireFn: makeUnresolvableRequire(),
      resolveSdkPackageDir: () => sdkPkgDir,
    });

    const linkPath = path.join(entryDir, "node_modules", "@a5c-ai", "babysitter-sdk");
    await expect(fs.realpath(linkPath)).resolves.toBe(path.normalize(sdkPkgDir));

    if (process.platform !== "win32") {
      const target = await fs.readlink(linkPath);
      expect(path.isAbsolute(target)).toBe(false);
      expect(path.resolve(path.dirname(linkPath), target)).toBe(path.normalize(sdkPkgDir));
    }
  });

  it("keeps the link resolvable through the full entrypoint validation path", async () => {
    const entryDir = path.join(tmpRoot, "work");
    const entryFile = path.join(entryDir, "process.mjs");
    const sdkPkgDir = await writeFakeSdkPackage(path.join(tmpRoot, "sdk-install"), "fallback");
    await fs.mkdir(entryDir, { recursive: true });
    await fs.writeFile(
      entryFile,
      [
        'import { __marker } from "@a5c-ai/babysitter-sdk";',
        "export const sdkMarker = __marker;",
        'export async function process() { return "ok"; }',
        "",
      ].join("\n"),
      "utf8",
    );

    await expect(
      validateProcessEntrypoint(entryFile, "process", {
        resolveSdkPackageDir: () => sdkPkgDir,
      }),
    ).resolves.toBeUndefined();

    const linkPath = path.join(entryDir, "node_modules", "@a5c-ai", "babysitter-sdk");
    await expect(fs.realpath(linkPath)).resolves.toBe(path.normalize(sdkPkgDir));
    if (process.platform !== "win32") {
      const target = await fs.readlink(linkPath);
      expect(path.isAbsolute(target)).toBe(false);
    }
  });
});
