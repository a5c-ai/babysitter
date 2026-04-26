# Invocation Modes

**Specification v1.0** | `@a5c-ai/agent-mux`

---

## 1. Overview

An *invocation mode* selects where a harness subprocess runs. The adapter contract is mode-agnostic: `buildSpawnArgs()` returns an abstract `SpawnArgs { command, args, env, cwd, stdin?, shell? }`, and a pure transform — `buildInvocationCommand()` — rewrites it into the concrete host command for the chosen mode.

Four modes are supported:

| `mode` | Host command | Notes |
|---|---|---|
| `local` | `SpawnArgs` unchanged | Default. |
| `docker` | `docker run --rm -i ...` | Mounts `cwd` as `/workspace` by default. |
| `ssh` | `ssh [opts] host -- 'cd <cwd> && K=V ... cmd args'` | `BatchMode=yes` set to avoid prompts. |
| `k8s` | `kubectl [--context C] [-n NS] exec -i <pod> -- env ... cmd args` | Pod from `AMUX_K8S_POD` or the agent name. |

Source: `packages/core/src/invocation.ts`, `packages/core/src/spawn-invocation.ts`.

## 2. Types

```ts
export type InvocationMode =
  | LocalInvocation
  | DockerInvocation
  | SshInvocation
  | K8sInvocation;

export interface LocalInvocation { readonly mode: 'local'; }

export interface DockerInvocation {
  readonly mode: 'docker';
  readonly image?: string;           // default: HARNESS_IMAGE_CATALOG lookup
  readonly volumes?: string[];       // extra -v flags (host:container)
  readonly env?: Record<string, string>;
  readonly network?: string;
  readonly workdir?: string;         // default: '/workspace'
}

export interface SshInvocation {
  readonly mode: 'ssh';
  readonly host: string;             // user@host or host
  readonly port?: number;            // default 22
  readonly identityFile?: string;
  readonly remoteDir?: string;       // default: SpawnArgs.cwd
  readonly autoInstall?: boolean;    // default true (used by `amux remote`)
}

export interface K8sInvocation {
  readonly mode: 'k8s';
  readonly namespace?: string;
  readonly image?: string;
  readonly resources?: { cpu?: string; memory?: string };
  readonly context?: string;
  readonly serviceAccount?: string;
  readonly podStartupTimeoutMs?: number;   // default 120_000
}
```

## 3. Harness image catalog

`HARNESS_IMAGE_CATALOG` maps each built-in harness to a default Docker image used when `DockerInvocation.image` is omitted. `lookupHarnessImage(agent)` returns the entry (or `undefined` for unknown harnesses, causing `buildInvocationCommand` to throw).

| Harness | Image |
|---|---|
| `claude`, `claude-code` | `ghcr.io/anthropics/claude-code` |
| `codex` | `ghcr.io/openai/codex` |
| `gemini` | `ghcr.io/google/gemini-cli` |
| `copilot` | `ghcr.io/github/copilot-cli` |
| `cursor` | `ghcr.io/cursor/cursor-agent` |
| `opencode` | `ghcr.io/anomalyco/opencode` |
| `pi` | `ghcr.io/a5c-ai/pi` |
| `omp` | `ghcr.io/a5c-ai/omp` |
| `openclaw` | `ghcr.io/openclaw/openclaw` |
| `hermes` | `ghcr.io/a5c-ai/hermes` |
| `aider` | `paulgauthier/aider` |
| `goose` | `ghcr.io/block/goose` |

## 4. `buildInvocationCommand(mode, spawnArgs, agent) -> InvocationCommand`

Pure function (no side effects, no subprocess). Returns:

```ts
interface InvocationCommand {
  command: string;
  args: string[];
  env: Record<string, string>;   // docker/ssh/k8s return {} — env is inlined in args
  cwd: string;
  stdin?: string;
  shell: boolean;
}
```

Dispatch rules (verbatim from `spawn-invocation.ts`):

- **local** — identity transform; env is merged but otherwise returned as-is.
- **docker** — `docker run --rm -i -v <cwd>:<workdir> -w <workdir> [-v ...]* [--network N] [-e K=V]* <image> <cmd> <args...>`. `baseEnv` + `DockerInvocation.env` are folded into `-e` flags.
- **ssh** — `ssh [-p N] [-i key] -o BatchMode=yes <host> -- 'cd <remoteDir> && K=V ... cmd args'`. Arguments and env values are shell-quoted.
- **k8s** — `kubectl [--context C] [-n NS] exec -i <pod> -- env K=V ... cmd args`. Pod name comes from `process.env.AMUX_K8S_POD` if set, otherwise falls back to the agent name.

## 5. `RunOptions.invocation`

```ts
client.run({
  agent: 'claude-code',
  prompt: '...',
  invocation: { mode: 'docker', image: 'ghcr.io/anthropics/claude-code:latest' },
});
```

The spawn loop calls `buildInvocationCommand()` once per attempt, after retry budget accounting. No behaviour change applies to event parsing — the harness inside the container/remote is still writing its native format to stdout/stderr.

## 6. `amux remote` bootstrap

`amux remote install|update <host>` ( `packages/cli/src/commands/remote.ts`) composes a four-step self-install pipeline through `buildInvocationCommand()`:

1. **Probe** — `amux --version` on the target. Skipped steps if already installed (unless `--force` or subcommand is `update`).
2. **Install amux** — `npm install -g @a5c-ai/agent-mux-cli` (or `npm update` for the update verb).
3. **Install harness** — `amux install <harness> [--force]` (or `amux update <harness>`).
4. **Verify** — `amux detect --all --json`.

Invocation mode for remote is picked by `--mode ssh|docker|k8s|local` (default `ssh` when a host is given). `--harness <agent>` controls the harness deployed (default: `claude-code`).

## 7. Security and environment

- **docker** — env vars from `RunOptions.env` and `DockerInvocation.env` become `-e` flags. Callers should avoid placing secrets on the command line if that is a concern; prefer `--env-file` via a custom `volumes` mount.
- **ssh** — `BatchMode=yes` is always set. SSH agent forwarding and host key policy are the caller's responsibility (via `~/.ssh/config`).
- **k8s** — two sub-modes, chosen by `K8sInvocation.ephemeral` (defaults to `true` when no `pod` is provided):

  - **Ephemeral** (`ephemeral: true` or `pod` unset): `buildInvocationCommand()` emits

    ```
    kubectl [--context C] [-n NS] run --rm -i --restart=Never \
      --image=<image> <generated-pod-name> \
      [--serviceaccount=SA] [--timeout=<podStartupTimeoutMs / 1000>s] \
      [--limits=cpu=C,memory=M] \
      [--env=K=V]... \
      -- <cmd> <args...>
    ```

    The pod name is generated as `amux-<agent>-<ts>-<seq>-<rand>`. `--rm` handles the happy-path teardown; additionally the invocation carries a `cleanup` hook (`K8sCleanup`) with `kubectl delete pod <name> --grace-period=0 --ignore-not-found=true` which `spawn-runner` fires detached on every exit path (completion, abort, crash) as a safety net in case the local `kubectl` was killed before `--rm` could finish.

  - **Existing pod** (`pod` provided, or `ephemeral: false`, or legacy `AMUX_K8S_POD` env var): `kubectl [--context C] [-n NS] exec -i <pod> -- env K=V... <cmd> <args...>`. No cleanup hook is attached.

  `resources.cpu`, `resources.memory`, `serviceAccount`, and `podStartupTimeoutMs` are consumed only by the ephemeral path.
