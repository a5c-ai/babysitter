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
    expect(output.stdout).toContain("Helm release: krate");
  });

  it("emits structured provider automation json", async () => {
    const sink = createIo();
    const exitCode = await runCli(["providers", "configure", "--env", "minikube", "--json"], sink.io);
    const output = sink.read();
    expect(exitCode).toBe(0);
    expect(output.stdout).toContain("\"automation\"");
    expect(output.stdout).toContain("\"providersFile\"");
  });

  it("emits structured agent install plan json", async () => {
    const sink = createIo();
    const exitCode = await runCli([
      "agents",
      "install",
      "--env",
      "minikube",
      "--set",
      "agents.install=true",
      "--set",
      "agents.targets[0]=copilot",
      "--set",
      "agents.installBabysitterPlugins=true",
      "--json",
    ], sink.io);
    const output = sink.read();
    expect(exitCode).toBe(0);
    expect(output.stdout).toContain("\"supportedTargets\"");
    expect(output.stdout).toContain("\"github-copilot\"");
  });
});
