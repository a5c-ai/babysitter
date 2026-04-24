import { describe, expect, it } from "vitest";

import { runCli } from "../src/cli.js";

function createIo() {
  let stdout = "";
  let stderr = "";
  return {
    io: {
      cwd: process.cwd(),
      stdout(message: string) {
        stdout += message;
      },
      stderr(message: string) {
        stderr += message;
      },
    },
    read() {
      return { stdout, stderr };
    },
  };
}

describe("cloud cli", () => {
  it("prints init config", async () => {
    const sink = createIo();
    const exitCode = await runCli(["init", "--env", "minikube"], sink.io);
    const output = sink.read();
    expect(exitCode).toBe(0);
    expect(output.stdout).toContain("\"environment\": \"minikube\"");
  });

  it("prints plan summary", async () => {
    const sink = createIo();
    const exitCode = await runCli(["plan", "--env", "minikube"], sink.io);
    const output = sink.read();
    expect(exitCode).toBe(0);
    expect(output.stdout).toContain("Environment: minikube");
  });
});

