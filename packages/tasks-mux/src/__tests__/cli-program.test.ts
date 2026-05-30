import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, vi } from "vitest";

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

    it("registers issue #597 breakpoint lifecycle commands", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const breakpointsCommand = program.commands.find((c) => c.name() === "breakpoints");

      expect(breakpointsCommand).toBeDefined();
      expect(breakpointsCommand!.commands.map((c) => c.name())).toEqual(
        expect.arrayContaining([
          "list",
          "search",
          "assign",
          "reassign",
          "close",
          "approve",
          "pending",
          "answer",
          "status",
          "poll",
        ]),
      );
    });

    it("registers issue #597 responders search and stats commands", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const respondersCommand = program.commands.find((c) => c.name() === "responders");

      expect(respondersCommand).toBeDefined();
      expect(respondersCommand!.commands.map((c) => c.name())).toEqual(
        expect.arrayContaining(["list", "show", "search", "stats"]),
      );
    });

    it("registers templates and rules command groups", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toEqual(expect.arrayContaining(["templates", "rules"]));

      const templatesCommand = program.commands.find((c) => c.name() === "templates");
      expect(templatesCommand!.commands.map((c) => c.name())).toEqual(
        expect.arrayContaining(["list", "show", "create"]),
      );

      const rulesCommand = program.commands.find((c) => c.name() === "rules");
      expect(rulesCommand!.commands.map((c) => c.name())).toEqual(
        expect.arrayContaining(["list", "add", "remove"]),
      );
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

    it("has 8 registered subcommands", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();

      expect(program.commands).toHaveLength(8);
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

  describe("issue #597 local config commands", () => {
    it("persists templates across program instances", async () => {
      const { createProgram } = await importProgram();
      const configRoot = await mkdtemp(join(tmpdir(), "tasks-mux-templates-"));
      const log = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await createProgram()
          .exitOverride()
          .parseAsync([
            "node",
            "tasks-mux",
            "--config-root",
            configRoot,
            "--json",
            "templates",
            "create",
            "handoff",
            "--title",
            "Handoff",
          ]);

        await createProgram()
          .exitOverride()
          .parseAsync([
            "node",
            "tasks-mux",
            "--config-root",
            configRoot,
            "--json",
            "templates",
            "show",
            "handoff",
          ]);

        expect(JSON.parse(log.mock.calls.at(-1)?.[0] as string)).toMatchObject({
          id: "handoff",
          title: "Handoff",
          kind: "task",
        });
      } finally {
        log.mockRestore();
        await rm(configRoot, { recursive: true, force: true });
      }
    });

    it("persists and removes rules across program instances", async () => {
      const { createProgram } = await importProgram();
      const configRoot = await mkdtemp(join(tmpdir(), "tasks-mux-rules-"));
      const log = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await createProgram()
          .exitOverride()
          .parseAsync([
            "node",
            "tasks-mux",
            "--config-root",
            configRoot,
            "--json",
            "rules",
            "add",
            "frontend",
            "--responder",
            "frontend-responder",
            "--domain",
            "frontend",
          ]);

        expect(JSON.parse(await readFile(join(configRoot, "task-rules.json"), "utf-8"))).toEqual([
          expect.objectContaining({
            id: "frontend",
            responderId: "frontend-responder",
            domain: "frontend",
          }),
        ]);

        await createProgram()
          .exitOverride()
          .parseAsync([
            "node",
            "tasks-mux",
            "--config-root",
            configRoot,
            "--json",
            "rules",
            "remove",
            "frontend",
          ]);

        expect(JSON.parse(log.mock.calls.at(-1)?.[0] as string)).toEqual({
          id: "frontend",
          removed: true,
        });
        expect(JSON.parse(await readFile(join(configRoot, "task-rules.json"), "utf-8"))).toEqual([]);
      } finally {
        log.mockRestore();
        await rm(configRoot, { recursive: true, force: true });
      }
    });
  });
});
