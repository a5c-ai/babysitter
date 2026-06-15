/**
 * Microagent subprocess runner.
 *
 * Spawns a microagent as an isolated Node.js subprocess, feeds it
 * JSON input via stdin, and collects structured JSON output from stdout.
 * Stderr is captured as log lines.
 */

import { spawn } from "node:child_process";
import type {
  MicroagentInvocation,
  MicroagentResult,
} from "./types";
import type { MicroagentRegistry } from "./registry";
import { validateInput, validateOutput } from "./validator";

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export class MicroagentRunner {
  constructor(private readonly registry: MicroagentRegistry) {}

  /** Execute a microagent invocation and return its structured result. */
  async run(invocation: MicroagentInvocation): Promise<MicroagentResult> {
    const manifest = this.registry.get(invocation.microagentName);
    if (!manifest) {
      throw new Error(`Microagent not found: ${invocation.microagentName}`);
    }

    // --- Validate input ---
    const inputValidation = validateInput(manifest, invocation.input);
    if (!inputValidation.valid) {
      return {
        output: null,
        exitCode: 1,
        durationMs: 0,
        error: {
          code: "INVALID_INPUT",
          message: inputValidation.errors.join("; "),
        },
      };
    }

    const startMs = Date.now();
    const timeout = invocation.timeout ?? manifest.runtime.timeout ?? 30_000;

    // --- Spawn subprocess ---
    const child = spawn("node", [manifest.runtime.entrypoint], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        ...manifest.runtime.env,
        MICROAGENT_NAME: manifest.name,
        ...(invocation.correlationId
          ? { MICROAGENT_CORRELATION_ID: invocation.correlationId }
          : {}),
        ...(invocation.parentAgentId
          ? { MICROAGENT_PARENT_AGENT_ID: invocation.parentAgentId }
          : {}),
      },
      timeout,
    });

    // Send input via stdin
    child.stdin.write(JSON.stringify(invocation.input));
    child.stdin.end();

    // Collect output streams
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (d: Buffer) => stdoutChunks.push(d));
    child.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    // Wait for process to close (or timeout / spawn error)
    const completion = await new Promise<
      | { kind: "exit"; code: number }
      | { kind: "timeout" }
      | { kind: "error"; err: Error }
    >((resolve) => {
      let settled = false;
      const settle = (v: { kind: "exit"; code: number } | { kind: "timeout" } | { kind: "error"; err: Error }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      };

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        settle({ kind: "timeout" });
      }, timeout);

      child.on("close", (code) => settle({ kind: "exit", code: code ?? 1 }));
      child.on("error", (err) => settle({ kind: "error", err }));
    });

    const durationMs = Date.now() - startMs;
    const logs = Buffer.concat(stderrChunks)
      .toString("utf-8")
      .split("\n")
      .filter(Boolean);

    // --- Timeout ---
    if (completion.kind === "timeout") {
      return {
        output: null,
        exitCode: 1,
        durationMs,
        logs,
        error: {
          code: "TIMEOUT",
          message: `Microagent "${manifest.name}" timed out after ${timeout}ms`,
        },
      };
    }

    // --- Spawn error ---
    if (completion.kind === "error") {
      return {
        output: null,
        exitCode: 1,
        durationMs,
        logs,
        error: {
          code: "SPAWN_ERROR",
          message: completion.err.message,
        },
      };
    }

    // --- Non-zero exit ---
    if (completion.code !== 0) {
      return {
        output: null,
        exitCode: completion.code,
        durationMs,
        logs,
        error: {
          code: "EXIT_NONZERO",
          message: `Exited with code ${completion.code}`,
        },
      };
    }

    // --- Parse stdout as JSON ---
    const rawOutput = Buffer.concat(stdoutChunks).toString("utf-8").trim();
    let output: unknown;
    try {
      output = JSON.parse(rawOutput);
    } catch {
      return {
        output: rawOutput,
        exitCode: 1,
        durationMs,
        logs,
        error: {
          code: "INVALID_OUTPUT",
          message: "Output is not valid JSON",
        },
      };
    }

    // --- Validate output ---
    const outputValidation = validateOutput(manifest, output);
    if (!outputValidation.valid) {
      return {
        output,
        exitCode: 1,
        durationMs,
        logs,
        error: {
          code: "SCHEMA_MISMATCH",
          message: outputValidation.errors.join("; "),
        },
      };
    }

    return { output, exitCode: 0, durationMs, logs };
  }
}
