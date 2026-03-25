import { describe, expect, test } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createSecureBashBackend } from "../../packages/sdk/src/harness/piSecureSandbox";

const HAS_DOCKER = (() => {
  try {
    execSync("docker version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!HAS_DOCKER || process.platform === "win32")("PI secure sandbox backend", () => {
  test("uses AgentSH in Docker when supported and otherwise degrades cleanly", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "babysitter-pi-secure-"));
    const nestedDir = path.join(workspace, "nested");
    mkdirSync(nestedDir, { recursive: true });

    const backend = await createSecureBashBackend({
      workspace,
      mode: "auto",
      image: process.env.BABYSITTER_PI_SANDBOX_IMAGE || "node:22-bookworm",
    });

    if (!backend) {
      return;
    }

    try {
      const chunks: Buffer[] = [];
      const result = await backend!.operations.exec(
        "pwd && mkdir -p nested && printf secure-ok > nested/secure.txt && cat nested/secure.txt",
        workspace,
        {
          onData: (data) => chunks.push(data),
          timeout: 180_000,
        },
      );

      expect(result.exitCode).toBe(0);
      expect(existsSync(path.join(workspace, "nested", "secure.txt"))).toBe(true);
      expect(readFileSync(path.join(workspace, "nested", "secure.txt"), "utf8")).toBe("secure-ok");

      const output = Buffer.concat(chunks).toString("utf8");
      expect(output).toContain("/workspace");
      expect(output).toContain("secure-ok");

      const nestedChunks: Buffer[] = [];
      const nestedResult = await backend!.operations.exec(
        "pwd > cwd.txt && pwd",
        nestedDir,
        {
          onData: (data) => nestedChunks.push(data),
          timeout: 180_000,
        },
      );

      expect(nestedResult.exitCode).toBe(0);
      expect(readFileSync(path.join(nestedDir, "cwd.txt"), "utf8").trim()).toBe("/workspace/nested");
      expect(Buffer.concat(nestedChunks).toString("utf8")).toContain("/workspace/nested");
    } finally {
      await backend?.dispose();
      rmSync(workspace, { recursive: true, force: true });
    }
  }, 240_000);
});
