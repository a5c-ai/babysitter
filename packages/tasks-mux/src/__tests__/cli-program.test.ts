import { describe, it, expect } from "vitest";

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

    it("registers tasks subcommand", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain("tasks");
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

    it("has 9 registered subcommands", async () => {
      const { createProgram } = await importProgram();
      const program = createProgram();

      expect(program.commands).toHaveLength(9);
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
});
