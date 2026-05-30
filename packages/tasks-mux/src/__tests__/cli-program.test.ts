import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { GitNativeBackend } from "../backends/git-native.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic import
// ────────────────────────────────────────────────────────────────────────────

async function importProgram() {
  return import("../cli/program.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("CLI Program", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  describe("createProgram", () => {
    it("creates a Commander program instance", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();

      expect(program).toBeDefined();
      expect(program.name()).toBe("tasks-mux");
    });

    it("sets version to 5.0.0", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();

      expect(program.version()).toBe("5.0.0");
    });

    it("has description", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();

      expect(program.description()).toContain("Breakpoints Mux");
    });

    it("registers ask subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("ask");
    });

    it("registers responders subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("responders");
    });

    it("registers breakpoints subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("breakpoints");
    });

    it("registers tasks subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("tasks");
    });

    it("registers task-management lifecycle and bulk commands", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const tasksCommand = program.commands.find((c) => c.name() === "tasks");

      expect(tasksCommand).toBeDefined();
      expect(tasksCommand!.commands.map((c) => c.name())).toEqual(expect.arrayContaining([
        "approve",
        "cancel",
        "transition",
        "bulk",
      ]));
    });

    it("does not register adjacent breakpoints claim lifecycle command", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const breakpointsCommand = program.commands.find((c) => c.name() === "breakpoints");

      expect(breakpointsCommand).toBeDefined();
      expect(breakpointsCommand!.commands.map((c) => c.name())).not.toContain("claim");
    });

    it("registers server subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("server");
    });

    it("registers responder-loop subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("responder-loop");
    });

    it("registers auth subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("auth");
    });

    it("has 7 registered subcommands", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();

      expect(program.commands).toHaveLength(7);
    });

    it("defines --server-url global option", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const opts = program.options.map((o) => o.long);

      expect(opts).toContain("--server-url");
    });

    it("defines --auth-token global option", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const opts = program.options.map((o) => o.long);

      expect(opts).toContain("--auth-token");
    });

    it("defines --json global option", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const opts = program.options.map((o) => o.long);

      expect(opts).toContain("--json");
    });

    it("defines --responder-dir global option", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const opts = program.options.map((o) => o.long);

      expect(opts).toContain("--responder-dir");
    });

    it("defines --repo-root global option", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const opts = program.options.map((o) => o.long);

      expect(opts).toContain("--repo-root");
    });

    it("defines --config-root global option", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const opts = program.options.map((o) => o.long);

      expect(opts).toContain("--config-root");
    });
  });

  describe("CLI index re-exports", () => {
    // Note: cli/index.ts has a top-level side-effect (program.parseAsync) that
    // calls process.exit, so we cannot import it directly in vitest.
    // Instead, we verify that program.ts (the real source) exports everything
    // the index re-exports.

    it("program.ts exports createProgram", async () => {
      const { createProgram } = await importProgram();
      expect(typeof createProgram).toBe("function");
    });

    it("CLI version constant is 5.0.0 (verified via program)", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      expect(program.version()).toBe("5.0.0");
    });
  });

  describe("tasks command execution", () => {
    it("applies bulk reassign operations through the git-native backend", async () => {
      const { createProgram } = await importProgram();
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tasks-mux-cli-"));
      const breakpointsDir = path.join(tmpDir, ".breakpoints");
      const backend = new GitNativeBackend({ breakpointsDir });
      const first = await backend.submitBreakpoint({
        text: "First CLI task",
        context: {
          description: "First CLI task",
          codeSnippets: [],
          fileReferences: [],
          tags: ["cli"],
        },
        routing: {
          strategy: "single",
          targetResponders: [],
          timeoutMs: 1_800_000,
          presentToUser: true,
        },
      });
      const second = await backend.submitBreakpoint({
        text: "Second CLI task",
        context: {
          description: "Second CLI task",
          codeSnippets: [],
          fileReferences: [],
          tags: ["cli"],
        },
        routing: {
          strategy: "single",
          targetResponders: [],
          timeoutMs: 1_800_000,
          presentToUser: true,
        },
      });
      const log = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        const program = createProgram();
        program.exitOverride();
        await program.parseAsync([
          "node",
          "tasks-mux",
          "--json",
          "tasks",
          "--breakpoints-dir",
          breakpointsDir,
          "bulk",
          "--ids",
          `${first.id},${second.id},missing`,
          "--action",
          "reassign",
          "--assignee",
          "codex",
          "--actor",
          "tester",
        ]);

        const result = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
        expect(result).toMatchObject({ total: 3, succeeded: 2, failed: 1 });
        expect(result.items).toEqual([
          expect.objectContaining({ id: first.id, ok: true }),
          expect.objectContaining({ id: second.id, ok: true }),
          expect.objectContaining({ id: "missing", ok: false, errorCode: "not_found" }),
        ]);
        await expect(backend.getBreakpoint(first.id)).resolves.toMatchObject({
          status: "assigned",
          assigneeId: "codex",
        });
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
