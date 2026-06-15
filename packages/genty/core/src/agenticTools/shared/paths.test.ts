import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveReadable, resolveSafe } from "./paths";

const workspace = path.resolve("/tmp/ws");
const refRoot = path.resolve("/home/u/.a5c/process-library/repo");

describe("resolveReadable", () => {
  it("resolves a workspace-relative path inside the workspace", () => {
    expect(resolveReadable(workspace, "sub/file.md")).toBe(path.resolve(workspace, "sub/file.md"));
  });

  it("rejects an out-of-workspace absolute path when no read-only roots are granted", () => {
    expect(() => resolveReadable(workspace, path.join(refRoot, "a.md"))).toThrow(/outside the workspace boundary/);
  });

  it("allows an absolute path inside a granted read-only root (the #936 boundary fix)", () => {
    const target = path.join(refRoot, "methodologies", "x.md");
    expect(resolveReadable(workspace, target, [refRoot])).toBe(path.resolve(target));
  });

  it("allows the read-only root directory itself", () => {
    expect(resolveReadable(workspace, refRoot, [refRoot])).toBe(path.resolve(refRoot));
  });

  it("still rejects paths outside both the workspace and the granted roots", () => {
    expect(() => resolveReadable(workspace, path.resolve("/etc/passwd"), [refRoot])).toThrow(
      /outside the workspace boundary/,
    );
  });

  it("does not treat a sibling-prefixed path as inside the root", () => {
    // `${refRoot}-evil` shares a string prefix but is not inside refRoot.
    expect(() => resolveReadable(workspace, `${refRoot}-evil/x.md`, [refRoot])).toThrow(
      /outside the workspace boundary/,
    );
  });
});

describe("resolveSafe (write path stays workspace-bounded)", () => {
  it("still rejects out-of-workspace writes regardless of read-only roots", () => {
    expect(() => resolveSafe(workspace, path.join(refRoot, "a.md"))).toThrow(/outside the workspace boundary/);
  });
});
