# @a5c-ai/tula-runtime

Agent runtime layer (L5) for the Babysitter monorepo.

Provides daemon lifecycle, session management, resource management, and telemetry infrastructure.

The runtime observability surface includes compatible daemon JSONL logging policy
helpers, run-health latency percentiles, pure diagnostics renderers for health,
metrics, config, and queue state, and optional telemetry trace/export helpers.
Remote telemetry exporters are opt-in; local and no-op behavior remains the
default.

## Execution Policy

Execution configs accept an optional `policy` field that describes environment,
filesystem, network, resource, sandbox, Docker, SSH, and Kubernetes-compatible
execution constraints.

Secure defaults are intentionally conservative:

- Local and background execution do not inherit `process.env` by default.
  Pass explicit `env` values, use `policy.environment.allow` for selected
  parent variables, or set `policy.environment.inheritParentEnv: true` as an
  explicit legacy opt-in.
- Local execution validates filesystem roots and fails fast when asked to
  enforce network, namespace, chroot, seccomp, capability, CPU, memory, pids,
  or open-file guarantees it cannot provide. Use Docker or Kubernetes for
  enforceable isolation, or set `policy.sandbox.allowUnsupportedLocal: true`
  only for trusted host-process execution.
- Docker execution emits hardened defaults: read-only root filesystem, `ALL`
  capabilities dropped, `no-new-privileges`, a non-root user, and `--network
  none` unless a network is explicitly configured. Host network and writable
  root filesystem require `policy.docker.insecureAllowPrivilegedOptions: true`.
- SSH execution uses strict host-key checking by default. `StrictHostKeyChecking=no`
  is emitted only when `policy.ssh.insecureSkipHostKeyChecking: true` is set.
- Kubernetes manifests include policy environment, resources, and a restricted
  container `securityContext` where structurally supported by the manifest
  builder.
- Background processes use the same environment and cwd policy semantics and
  can cap retained stdout/stderr with `policy.resources.maxOutputBytes`.
  Snapshots and completion events include retained and dropped byte counts so
  truncation is explicit.
- Background process lifecycle controls support opt-in process-group signaling
  on POSIX, direct-child fallback, grace-period SIGKILL escalation, timeout
  status, platform-gated pause/resume, dependency queueing, and lifecycle hook
  diagnostics. These controls are separate from daemon start/stop and session
  pause policy.

The policy layer records OS resource intent through `ResourceManagerImpl` but
does not claim direct kernel enforcement. Concrete executors translate supported
limits into their own runtime arguments.

## Install

```bash
npm install @a5c-ai/tula-runtime
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```
