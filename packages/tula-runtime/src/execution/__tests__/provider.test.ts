import { describe, it, expect, vi, beforeEach } from "vitest";
import { DockerExecutor } from "../modes/docker";
import { SshExecutor } from "../modes/ssh";
import { KubernetesExecutor } from "../modes/kubernetes";
import { ExecutionProviderImpl } from "../provider";
import type { DockerExecutionConfig, SshExecutionConfig, KubernetesExecutionConfig } from "../types";
import type { Executor } from "../modes/local";

// ---------------------------------------------------------------------------
// DockerExecutor — command construction
// ---------------------------------------------------------------------------

describe("DockerExecutor", () => {
  it("builds correct docker run args with volumes, network, and env", () => {
    const executor = new DockerExecutor();

    const config: DockerExecutionConfig = {
      mode: "docker",
      image: "node:20-slim",
      volumes: ["/host/path:/container/path"],
      network: "bridge",
      env: { NODE_ENV: "production" },
    };

    // _buildDockerArgs is exposed (not private) for testability
    const args = executor._buildDockerArgs("abc12345-uuid", "node", ["index.js"], config);

    expect(args[0]).toBe("run");
    expect(args).toContain("--rm");
    expect(args).toContain("--name");
    // Container name derived from id
    expect(args).toContain("babysitter-abc12345");
    // Volume
    expect(args).toContain("-v");
    expect(args).toContain("/host/path:/container/path");
    // Network
    expect(args).toContain("--network");
    expect(args).toContain("bridge");
    // Env
    expect(args).toContain("-e");
    expect(args).toContain("NODE_ENV=production");
    // Image comes before command
    const imageIdx = args.indexOf("node:20-slim");
    const cmdIdx = args.indexOf("node", imageIdx + 1);
    expect(imageIdx).toBeGreaterThan(0);
    expect(cmdIdx).toBe(imageIdx + 1);
    expect(args[cmdIdx + 1]).toBe("index.js");
  });

  it("builds minimal args when no optional config is provided", () => {
    const executor = new DockerExecutor();

    const config: DockerExecutionConfig = {
      mode: "docker",
      image: "alpine:latest",
    };

    const args = executor._buildDockerArgs("dead-beef-id", "echo", ["hello"], config);

    expect(args).toContain("run");
    expect(args).toContain("--rm");
    expect(args).toContain("--read-only");
    expect(args).toContain("--cap-drop");
    expect(args).toContain("ALL");
    expect(args).toContain("--security-opt");
    expect(args).toContain("no-new-privileges");
    expect(args).toContain("--user");
    expect(args).toContain("65532:65532");
    expect(args).toContain("--network");
    expect(args).toContain("none");
    expect(args).not.toContain("-v");
    expect(args).not.toContain("-e");
    expect(args).toContain("alpine:latest");
    expect(args).toContain("echo");
    expect(args).toContain("hello");
  });

  it("maps resource and DNS policy into docker run args", () => {
    const executor = new DockerExecutor();

    const config: DockerExecutionConfig = {
      mode: "docker",
      image: "node:20-slim",
      policy: {
        network: { mode: "bridge", dns: ["1.1.1.1"] },
        resources: { cpuCount: 1.5, memoryBytes: 268_435_456, pidsLimit: 128 },
      },
    };

    const args = executor._buildDockerArgs("abc12345-uuid", "node", ["index.js"], config);

    expect(args).toContain("--cpus");
    expect(args).toContain("1.5");
    expect(args).toContain("--memory");
    expect(args).toContain("268435456");
    expect(args).toContain("--pids-limit");
    expect(args).toContain("128");
    expect(args).toContain("--dns");
    expect(args).toContain("1.1.1.1");
    expect(args).toContain("--network");
    expect(args).toContain("bridge");
  });

  it("rejects policy mounts outside allowed roots", () => {
    const executor = new DockerExecutor();

    const config: DockerExecutionConfig = {
      mode: "docker",
      image: "node:20-slim",
      policy: {
        filesystem: {
          allowedRoots: ["/workspace"],
          mounts: [{ hostPath: "/etc", containerPath: "/host-etc" }],
        },
      },
    };

    expect(() =>
      executor._buildDockerArgs("abc12345-uuid", "node", ["index.js"], config),
    ).toThrow(/outside the configured filesystem allowed roots/);
  });
});

// ---------------------------------------------------------------------------
// SshExecutor — command construction
// ---------------------------------------------------------------------------

describe("SshExecutor", () => {
  it("builds correct ssh args with key, port, user@host, and remote command", () => {
    const executor = new SshExecutor();

    const config: SshExecutionConfig = {
      mode: "ssh",
      host: "remote.example.com",
      port: 2222,
      user: "deploy",
      keyPath: "/home/user/.ssh/id_rsa",
      env: { APP_ENV: "staging" },
    };

    const args = executor._buildSshArgs("ls", ["-la", "/tmp"], config);

    // Key
    expect(args).toContain("-i");
    expect(args).toContain("/home/user/.ssh/id_rsa");
    // Port
    expect(args).toContain("-p");
    expect(args).toContain("2222");
    // Strict host key checking is secure by default.
    expect(args).toContain("-o");
    expect(args).toContain("StrictHostKeyChecking=yes");
    expect(args).not.toContain("StrictHostKeyChecking=no");
    expect(args).toContain("BatchMode=yes");
    // Target
    expect(args).toContain("deploy@remote.example.com");
    // Separator and remote command
    expect(args).toContain("--");
    // The remote command should contain env prefix and the actual command
    const remoteCmd = args[args.length - 1];
    expect(remoteCmd).toContain("APP_ENV=staging");
    expect(remoteCmd).toContain("ls");
    expect(remoteCmd).toContain("-la");
    expect(remoteCmd).toContain("/tmp");
  });

  it("omits key and port args when not provided", () => {
    const executor = new SshExecutor();

    const config: SshExecutionConfig = {
      mode: "ssh",
      host: "10.0.0.1",
      user: "root",
    };

    const args = executor._buildSshArgs("whoami", [], config);

    expect(args).not.toContain("-i");
    expect(args).not.toContain("-p");
    expect(args).toContain("root@10.0.0.1");
  });

  it("emits StrictHostKeyChecking=no only with explicit insecure opt-in", () => {
    const executor = new SshExecutor();

    const config: SshExecutionConfig = {
      mode: "ssh",
      host: "10.0.0.1",
      user: "root",
      policy: {
        ssh: { insecureSkipHostKeyChecking: true },
      },
    };

    const args = executor._buildSshArgs("whoami", [], config);

    expect(args).toContain("StrictHostKeyChecking=no");
  });
});

// ---------------------------------------------------------------------------
// KubernetesExecutor — manifest generation
// ---------------------------------------------------------------------------

describe("KubernetesExecutor", () => {
  function createMockKubectl(results: Array<{ stdout?: string; stderr?: string } | Error> = []) {
    const calls: Array<{ args: string[]; input?: string }> = [];
    return {
      calls,
      invoker: vi.fn(async (args: string[], options?: { input?: string }) => {
        calls.push({ args, input: options?.input });
        const result = results.shift();
        if (result instanceof Error) throw result;
        return result ?? { stdout: "", stderr: "" };
      }),
    };
  }

  it("generates a valid manifest with namespace, image, and command", async () => {
    const kubectl = createMockKubectl([{ stdout: "job.batch/babysitter created" }]);
    const executor = new KubernetesExecutor({ kubectl: kubectl.invoker });

    const config: KubernetesExecutionConfig = {
      mode: "kubernetes",
      namespace: "ci-jobs",
      image: "node:20-slim",
      serviceAccount: "job-runner",
    };

    const handle = await executor.spawn("node", ["script.js"], config);

    expect(handle.mode).toBe("kubernetes");
    expect(handle.status).toBe("running");
    expect(handle.manifest).toBeDefined();

    const manifest = handle.manifest;
    expect(manifest).toContain("kind: Job");
    expect(manifest).toContain("namespace: ci-jobs");
    expect(manifest).toContain("image: node:20-slim");
    expect(manifest).toContain("serviceAccountName: job-runner");
    expect(manifest).toContain("babysitter");
    expect(manifest).toContain("restartPolicy: Never");
    // Command includes both the executable and args
    expect(manifest).toContain('"node"');
    expect(manifest).toContain('"script.js"');
    expect(kubectl.calls[0].args).toEqual(["apply", "-f", "-"]);
    expect(kubectl.calls[0].input).toContain("kind: Job");
  });

  it("generates manifest without serviceAccount when not provided", async () => {
    const executor = new KubernetesExecutor({ kubectl: createMockKubectl().invoker });

    const config: KubernetesExecutionConfig = {
      mode: "kubernetes",
      namespace: "default",
      image: "alpine:latest",
    };

    const handle = await executor.spawn("echo", ["hello"], config);

    expect(handle.manifest).not.toContain("serviceAccountName");
    expect(handle.manifest).toContain("namespace: default");
    expect(handle.manifest).toContain("image: alpine:latest");
  });

  it("maps execution policy to security context and resources", async () => {
    const executor = new KubernetesExecutor({ kubectl: createMockKubectl().invoker });

    const config: KubernetesExecutionConfig = {
      mode: "kubernetes",
      namespace: "ci-jobs",
      image: "node:20-slim",
      policy: {
        environment: { values: { NODE_ENV: "test" } },
        resources: { cpuCount: 1, memoryBytes: 134_217_728 },
      },
    };

    const handle = await executor.spawn("node", ["script.js"], config);

    expect(handle.manifest).toContain("runAsNonRoot: true");
    expect(handle.manifest).toContain("readOnlyRootFilesystem: true");
    expect(handle.manifest).toContain("allowPrivilegeEscalation: false");
    expect(handle.manifest).toContain("name: NODE_ENV");
    expect(handle.manifest).toContain("value: \"test\"");
    expect(handle.manifest).toContain("cpu: \"1\"");
    expect(handle.manifest).toContain("memory: \"134217728\"");
  });

  it("maps filesystem mounts into Kubernetes volume mounts", async () => {
    const executor = new KubernetesExecutor({ kubectl: createMockKubectl().invoker });

    const config: KubernetesExecutionConfig = {
      mode: "kubernetes",
      namespace: "ci-jobs",
      image: "node:20-slim",
      policy: {
        filesystem: {
          allowedRoots: ["/workspace"],
          mounts: [
            {
              hostPath: "/workspace/cache",
              containerPath: "/cache",
              readOnly: true,
            },
          ],
        },
      },
    };

    const handle = await executor.spawn("node", ["script.js"], config);

    expect(handle.manifest).toContain("volumeMounts:");
    expect(handle.manifest).toContain("mountPath: /cache");
    expect(handle.manifest).toContain("volumes:");
    expect(handle.manifest).toContain("path: /workspace/cache");
  });

  it("polls Kubernetes job status to stopped on completion", async () => {
    const kubectl = createMockKubectl([
      { stdout: "created" },
      { stdout: JSON.stringify({ status: { active: 1 } }) },
      { stdout: JSON.stringify({ status: { succeeded: 1 } }) },
    ]);
    const executor = new KubernetesExecutor({ kubectl: kubectl.invoker, pollIntervalMs: 1 });

    const handle = await executor.spawn("node", ["script.js"], {
      mode: "kubernetes",
      namespace: "ci-jobs",
      image: "node:20-slim",
    });

    await executor.waitForCompletion(handle.id);

    expect(handle.status).toBe("stopped");
    expect(kubectl.calls.some((call) => call.args.includes("get") && call.args.includes("-o") && call.args.includes("json"))).toBe(true);
  });

  it("streams logs through attach and deletes the job on destroy", async () => {
    const kubectl = createMockKubectl([
      { stdout: "created" },
      { stdout: "hello logs\n" },
      { stdout: "deleted" },
    ]);
    const executor = new KubernetesExecutor({ kubectl: kubectl.invoker });
    const handle = await executor.spawn("echo", ["hello"], {
      mode: "kubernetes",
      namespace: "default",
      image: "alpine:latest",
    });

    const attached = await executor.attach(handle.id);
    await attached?.attach();
    await executor.destroy(handle.id);

    expect(kubectl.calls.some((call) => call.args[0] === "logs")).toBe(true);
    expect(kubectl.calls.some((call) => call.args[0] === "delete" && call.args[1] === "job")).toBe(true);
  });

  it("marks jobs failed on timeout", async () => {
    const kubectl = createMockKubectl([
      { stdout: "created" },
      { stdout: JSON.stringify({ status: { active: 1 } }) },
      { stdout: "deleted" },
    ]);
    const executor = new KubernetesExecutor({ kubectl: kubectl.invoker, pollIntervalMs: 1 });

    const handle = await executor.spawn("sleep", ["10"], {
      mode: "kubernetes",
      namespace: "default",
      image: "alpine:latest",
      timeoutMs: 1,
      cleanupAfterCompletion: true,
    });

    await expect(executor.waitForCompletion(handle.id)).rejects.toThrow("timed out");
    expect(handle.status).toBe("failed");
    expect(kubectl.calls.some((call) => call.args[0] === "delete")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ExecutionProviderImpl
// ---------------------------------------------------------------------------

describe("ExecutionProviderImpl", () => {
  function createMockExecutor(): Executor<unknown> {
    const handles: Array<{ id: string; mode: string; status: string }> = [];
    return {
      async spawn(_cmd: string, _args: string[], _config: unknown) {
        const handle = {
          id: `mock-${handles.length}`,
          mode: "local" as const,
          status: "running" as const,
          async attach() {},
          async destroy() {},
        };
        handles.push(handle);
        return handle;
      },
      async attach(id: string) {
        return handles.find((h) => h.id === id) as any;
      },
      list() {
        return handles as any[];
      },
      async destroy(id: string) {
        const idx = handles.findIndex((h) => h.id === id);
        if (idx !== -1) handles.splice(idx, 1);
      },
    };
  }

  it("list returns empty initially", async () => {
    const mockLocal = createMockExecutor();
    const provider = new ExecutionProviderImpl(
      new Map([["local", mockLocal]]) as any,
    );

    const handles = await provider.list();
    expect(handles).toHaveLength(0);
  });

  it("spawn dispatches to the correct mode executor", async () => {
    const mockLocal = createMockExecutor();
    const spawnSpy = vi.spyOn(mockLocal, "spawn");

    const provider = new ExecutionProviderImpl(
      new Map([["local", mockLocal]]) as any,
    );

    const handle = await provider.spawn({ mode: "local", cwd: "/tmp" });

    expect(spawnSpy).toHaveBeenCalledTimes(1);
    expect(handle).toBeDefined();
    expect(handle.id).toBe("mock-0");
  });

  it("throws when spawning with an unregistered mode", async () => {
    const provider = new ExecutionProviderImpl(new Map() as any);

    await expect(
      provider.spawn({ mode: "docker", image: "node:20" } as any),
    ).rejects.toThrow('No executor registered for execution mode "docker"');
  });
});
