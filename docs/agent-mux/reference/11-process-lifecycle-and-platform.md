# Process Lifecycle, Safety, and Cross-Platform Support

**Specification v1.0** | `@a5c-ai/agent-mux`

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent per explicit project requirements from the project owner. It extends the original scope document's 9 built-in agents. All hermes-specific content in this spec is marked with this same scope extension note.

---

## 1. Overview

This specification is the authoritative reference for subprocess management, process safety guarantees, and cross-platform support in `@a5c-ai/agent-mux`. It consolidates and deepens the process-lifecycle material introduced in `03-run-handle-and-interaction.md` (sections 6–12), adds the full per-agent cross-platform compatibility matrix from scope §23, and specifies platform-specific path resolution, shell invocation, PTY backend selection, and resource cleanup in detail.

All ten built-in agents (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes) share the same process lifecycle contract. Differences in platform support, PTY requirements, and shell invocation are documented per-agent in the tables below.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `RunHandle`, subprocess management | `03-run-handle-and-interaction.md` | 6 |
| `ProcessTracker`, zombie prevention | `03-run-handle-and-interaction.md` | 6.4 |
| `PlatformAdapter` interface (base) | `03-run-handle-and-interaction.md` | 8.3 |
| PTY support, `node-pty` dependency | `03-run-handle-and-interaction.md` | 7 |
| Run isolation, temp directories | `03-run-handle-and-interaction.md` | 9 |
| Backpressure and buffer management | `03-run-handle-and-interaction.md` | 10 |
| Concurrency safety | `03-run-handle-and-interaction.md` | 11 |
| `RunOptions.gracePeriodMs` | `03-run-handle-and-interaction.md` | 6.2 (within signal handling prose) |
| `SpawnArgs` type | `05-adapter-system.md` | 3.1 |
| `AgentAdapter.buildSpawnArgs()` | `05-adapter-system.md` | 2 |
| `AgentCapabilities.supportedPlatforms` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.requiresPty` | `06-capabilities-and-models.md` | 2 |
| `ConfigManager` file locking | `08-config-and-auth.md` | 13 |
| Native config file locations | `08-config-and-auth.md` | 7 |
| `ErrorCode` union | `01-core-types-and-client.md` | 3.1 |
| `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| CLI signal handling | `10-cli-reference.md` | 20 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |

---

## 2. Subprocess Spawn Sequence

When `mux.run()` is called, the stream engine executes the following spawn sequence. Each step is numbered for reference in error-handling sections. This sequence is a simplified summary; the authoritative step-by-step is in `03-run-handle-and-interaction.md` §6.1. The ordering below groups steps by concern for readability — the critical constraint is that Step 5 (ProcessTracker registration) must happen synchronously after spawn and before any `await`.

```
Step 1  Validate RunOptions against agent capabilities
        → CapabilityError on unsupported options

Step 2  Create per-run temp directory
        → os.tmpdir()/agent-mux-<runId>/
        → Mode 0o700 (owner read/write/execute only)

Step 3  Call adapter.buildSpawnArgs(resolvedOptions)
        → Produces SpawnArgs { command, args, env, cwd, shell, usePty }

Step 4  Determine spawn mode (pipe vs. PTY)
        → If usePty && !nodePtyAvailable → throw PTY_NOT_AVAILABLE
        → If usePty → pty.spawn()
        → Else → child_process.spawn()

Step 5  Register subprocess with ProcessTracker
        → Must happen synchronously after spawn, before any await

Step 6  Wire stdio pipes / PTY streams to line parser
        → Line parser feeds adapter.parseEvent()
        → Parsed events enter the event buffer

Step 7  Start timeout / inactivity timers
        → Per RunOptions.timeout and RunOptions.inactivityTimeout

Step 8  Emit 'session_start' or 'session_resume' event
        → Run is now in 'running' state
```

### 2.1 Spawn Options by Mode

#### Pipe Mode (default)

```typescript
import { spawn } from 'child_process';

const child = spawn(spawnArgs.command, spawnArgs.args, {
  cwd: spawnArgs.cwd,
  env: { ...process.env, ...spawnArgs.env },
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: process.platform !== 'win32',  // Unix: new process group
  shell: spawnArgs.shell,
  windowsHide: true,
});
```

**Unix:** `detached: true` creates a new process group. The process group ID equals the child PID. Signals sent to `-pid` reach the entire group.

**Windows:** `detached: false` (the child shares the parent's console). The child is assigned to a Job Object for lifecycle management (see Section 3.3).

#### PTY Mode

```typescript
import * as pty from 'node-pty';

const child = pty.spawn(spawnArgs.command, spawnArgs.args, {
  name: 'xterm-256color',
  cols: 120,
  rows: 40,
  cwd: spawnArgs.cwd,
  env: { ...process.env, ...spawnArgs.env },
});
```

PTY mode is used only when `spawnArgs.usePty` is `true` (see Section 6 for which agents require it).

---

## 3. Process Tracking and Zombie Prevention

### 3.1 ProcessTracker Singleton

The `ProcessTracker` is a module-level singleton that maintains the set of all active subprocesses across all `RunHandle` instances. Its interface is defined in `03-run-handle-and-interaction.md` §6.4; this section specifies platform-specific implementation details.

```typescript
interface ProcessTracker {
  /**
   * Register a spawned process for tracking.
   *
   * @param pid - Process ID of the spawned child.
   * @param groupId - Process group ID (Unix) or Job Object handle ID (Windows).
   * @param runId - The run ID that owns this process.
   * @param gracePeriodMs - Grace period for this process's two-phase shutdown.
   *   Stored per-registration so killAll() uses the correct grace period for
   *   each tracked process. Defaults to 5000ms if not provided.
   */
  register(pid: number, groupId: number, runId: string, gracePeriodMs?: number): void;

  unregister(pid: number): void;

  /**
   * Kill all tracked processes using the two-phase shutdown sequence.
   * Each process uses the gracePeriodMs stored at registration time.
   * See behavioral contract below.
   */
  killAll(): void;

  readonly activeCount: number;
}
```

> **Note on interface divergence:** The `ProcessTracker` interface in `03-run-handle-and-interaction.md` §6.4 defines `register(pid, groupId, runId)` with 3 parameters. This spec extends it with an optional 4th parameter `gracePeriodMs`. Implementors must provide the 4-parameter signature. The authoritative complete interface is in §19 (Complete Type Reference) of this spec.

**`killAll()` behavioral contract** (implements scope §22: "On SIGTERM: SIGINT first, SIGKILL after grace period"):

The grace period for each tracked process is stored at `register()` time, sourced from the run's resolved `RunOptions.gracePeriodMs` (see `03-run-handle-and-interaction.md` §6.2). This allows `killAll()` to use per-run grace periods without accepting parameters — important because `killAll()` is called from `process.on('exit')` and signal handlers where argument passing is impractical.

When called from an **async-capable context** (e.g., `process.on('SIGTERM')`, `process.on('SIGINT')`):

1. Send SIGINT (Unix) or `CTRL_C_EVENT` (Windows) to each tracked process group.
2. Wait up to each process's registered grace period (default: 5000ms).
3. Send SIGKILL (Unix) or `TerminateProcess` (Windows) to any process groups that have not exited.
4. On Windows, additionally close each Job Object handle (defense-in-depth).

When called from a **synchronous-only context** (`process.on('exit')`):

1. Send SIGKILL (Unix) or close Job Object handles (Windows) immediately — the grace period cannot be honored because the event loop is shutting down.

### 3.2 Unix Process Group Management

On Unix (macOS and Linux), each subprocess is spawned with `detached: true`, creating a new process group:

- **Process group ID** equals the child PID (standard POSIX behavior for `setpgid(0, 0)`).
- **Signal delivery** uses `process.kill(-pid, signal)` — the negated PID targets the entire process group, including any child-of-child processes (language servers, build tools, shell scripts).
- **Zombie reaping** is handled by Node.js's internal libuv loop, which calls `waitpid()` for each child. The `'exit'` event on the `ChildProcess` triggers `ProcessTracker.unregister()`.

### 3.3 Windows Job Object Management

On Windows, each subprocess is assigned to a **Job Object** immediately after spawn:

- Created with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` — when the job handle is closed (including on abrupt Node.js exit), the OS terminates all processes in the job.
- This provides defense-in-depth: even if `process.on('exit')` handlers do not execute (e.g., `TerminateProcess` is called on the Node.js process itself), orphaned agent subprocesses are still cleaned up.
- The Job Object handle is stored in the `ProcessTracker` alongside the PID and run ID.
- `killAll()` on Windows closes all stored job handles, triggering OS-level cleanup.

### 3.4 Node.js Exit Handlers

The `ProcessTracker` installs handlers on the following Node.js events (installed once, on first `register()` call):

| Event | Action |
|---|---|
| `process.on('exit')` | Synchronous `killAll()`. Cannot start async work. |
| `process.on('SIGTERM')` | `killAll()`, then `process.exit(1)`. |
| `process.on('SIGINT')` | `killAll()`, then `process.exit(1)`. |
| `process.on('uncaughtException')` | `killAll()`, then rethrow. |
| `process.on('unhandledRejection')` | `killAll()`, then rethrow. |

**Invariant:** `killAll()` must be unconditionally safe (never throws). If an individual process kill fails (e.g., process already exited, permission denied), the error is silently ignored and the tracker continues to the next process.

### 3.5 Orphan Scenarios

| Scenario | Unix | Windows |
|---|---|---|
| Normal Node.js exit | `process.on('exit')` → `killAll()` | Job Object auto-kill |
| SIGTERM to Node.js | Handler runs `killAll()` | Node.js emulates SIGTERM on Windows; handler runs `killAll()` |
| SIGKILL to Node.js | **Orphans survive.** Re-parented to PID 1. Cleanup: `kill -9 -<pgid>` | Job Object auto-kill (OS-level) |
| Node.js crash (segfault) | Depends on signal handler; likely orphans | Job Object auto-kill |
| `process.exit(0)` from code | `process.on('exit')` runs | `process.on('exit')` runs + Job Object |

---

## 4. Signal Handling

### 4.1 Two-Phase Shutdown (abort)

When `RunHandle.abort()` is called:

```
t=0ms       Send graceful signal
            ├── Unix: SIGTERM to process group (kill(-pid, SIGTERM))
            └── Windows: GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT)
            Start grace period timer

t=0..G      Monitor for process exit
            If process exits → cleanup, resolve RunResult

t=G ms      Grace period expired, process still alive
            ├── Unix: SIGKILL to process group (kill(-pid, SIGKILL))
            └── Windows: TerminateProcess(handle, 1)

t=G+100ms   Final check — process guaranteed dead
            Cleanup temp dir, resolve RunResult
```

**Default grace period:** 5000ms (scope §22).

**Per-run override:** `RunOptions.gracePeriodMs` (spec-level extension defined in `03-run-handle-and-interaction.md` §6.2). Also configurable at the global config level via `gracePeriodMs`.

**Signal choice rationale (abort vs. killAll):** `abort()` sends SIGTERM (a graceful termination request), because the consumer is explicitly ending a single run and the agent should have a chance to clean up. `killAll()` sends SIGINT (the interrupt signal), because it implements scope §22's requirement ("On SIGTERM: SIGINT first, SIGKILL after grace period") — when the Node.js process itself receives SIGTERM (or SIGINT, or encounters a fatal error), it forwards SIGINT to child processes as the first phase of shutdown. The choice of SIGINT (not SIGTERM) for the forwarded signal intentionally differentiates the signal received by children from the signal received by the parent, making it possible for agents that trap both signals to distinguish between "the mux process is shutting down" (SIGINT) and "this specific run is being aborted" (SIGTERM).

### 4.2 Interrupt (SIGINT)

`RunHandle.interrupt()` sends a soft interrupt, allowing the agent to finish its current tool call:

| Platform | Pipe mode | PTY mode |
|---|---|---|
| Unix | `process.kill(-pid, 'SIGINT')` | Write `\x03` (Ctrl+C) to PTY input |
| Windows | `GenerateConsoleCtrlEvent(CTRL_C_EVENT, pid)` | Write `\x03` to PTY input |

**Windows caveat:** `GenerateConsoleCtrlEvent` requires the subprocess to share a console with the parent. For console-detached processes, the signal delivery may silently fail. All 10 built-in agents are spawned with `windowsHide: true` (console shared), so this is not an issue for built-in agents.

### 4.3 Pause / Resume

| Platform | Pause | Resume |
|---|---|---|
| Unix | `process.kill(pid, 'SIGTSTP')` | `process.kill(pid, 'SIGCONT')` |
| Windows | `SuspendThread()` on all process threads | `ResumeThread()` on all process threads |

**Windows caveat:** Thread enumeration for pause/resume uses `NtQuerySystemInformation` or `CreateToolhelp32Snapshot`. Race conditions exist if the process creates new threads between enumeration and suspension. This is a known limitation; in practice, agent CLI processes rarely create threads during operation.

### 4.4 Signal Summary Table

| Operation | Unix Signal | Windows Equivalent | PTY Override |
|---|---|---|---|
| Interrupt | SIGINT | CTRL_C_EVENT | `\x03` to PTY stdin |
| Graceful terminate | SIGTERM | CTRL_BREAK_EVENT | `\x03` then close PTY |
| Force kill | SIGKILL | TerminateProcess | Close PTY handle |
| Pause | SIGTSTP | SuspendThread | `\x1a` to PTY stdin |
| Resume | SIGCONT | ResumeThread | (automatic on data write) |

---

## 5. Cross-Platform Support Matrix

### 5.1 Per-Agent Platform Support

From scope §23, extended with hermes-agent:

| Agent | macOS | Linux | Windows | Notes |
|---|---|---|---|---|
| claude | ✅ | ✅ | ✅ | |
| codex | ✅ | ✅ | ✅ | |
| gemini | ✅ | ✅ | ✅ | |
| copilot | ✅ | ✅ | ✅ | |
| cursor | ✅ | ✅ | ✅ | |
| opencode | ✅ | ✅ | ✅ | |
| pi | ✅ | ✅ | ✅ | |
| omp | ✅ | ✅ | partial | See §5.2 |
| openclaw | ✅ | ✅ | ✅ | Requires PTY (§6); Windows needs ConPTY (Win 10 1809+), see §6.2 |
| hermes | ✅ | ✅ | WSL2 only | See §5.3 |

> **SCOPE EXTENSION:** hermes-agent platform support is WSL2-only on Windows, as the hermes CLI is a Python application that depends on Unix-specific system calls not available in native Windows.

### 5.2 omp on Windows (Partial Support)

The omp agent has partial Windows support:

- **Core run/prompt functionality:** Works.
- **PTY-dependent features:** Not applicable (omp does not require PTY).
- **Known limitations:** Some shell-dependent tool operations may behave differently under `cmd.exe` vs. bash.
- **`supportedPlatforms`:** `['darwin', 'linux', 'win32']` — `'win32'` is included because the core agent does run on Windows.
- **`AdapterRegistry.installed()` on Windows:** Returns `true` if the omp binary is found on PATH. The adapter does not block installation or detection on Windows.
- **Runtime warning:** On Windows, the adapter emits a `debug` event with `level: 'warn'` during the spawn sequence: `'Agent "omp" has partial Windows support; some features may not work as expected.'` This warning does not prevent the run from proceeding.

**Design rationale (omp vs. hermes):** omp includes `'win32'` in `supportedPlatforms` because the agent is functional on Windows for core operations — only some features are degraded. hermes excludes `'win32'` because the agent cannot run at all on native Windows (requires WSL2). The distinction is: partial support → include in platforms + warn; no support → exclude from platforms + throw `AGENT_NOT_INSTALLED`.

### 5.3 hermes on Windows (WSL2 Only)

> **SCOPE EXTENSION:** hermes-agent is a Python-based CLI (`pip install hermes-agent`) that requires Unix-specific system calls.

- **Native Windows:** Not supported. `AdapterRegistry.installed()` returns `false` for hermes on native Windows (`process.platform === 'win32'` without WSL detection).
- **WSL2:** Supported. The hermes adapter detects WSL2 by checking for `/proc/version` containing `microsoft` (case-insensitive) or the presence of `WSL_DISTRO_NAME` in the environment.
- **`supportedPlatforms`:** `['darwin', 'linux']` — the adapter does not list `'win32'`. On WSL2, `process.platform` reports `'linux'`, so the adapter is available.
- **Error on native Windows:** If a consumer attempts `mux.run({ agent: 'hermes' })` on native Windows, the `AdapterRegistry.detect()` method returns `installed: false`, and `mux.run()` throws `AgentMuxError` with code `AGENT_NOT_INSTALLED` and a message suggesting WSL2 installation.

### 5.4 Platform Detection

Platform detection occurs at two levels:

1. **Module-level:** `PlatformAdapter` selection (see §8).
2. **Adapter-level:** Each adapter's `capabilities.supportedPlatforms` is checked by `AdapterRegistry.installed()` and `detect()`:

```typescript
// Simplified detection logic
function isPlatformSupported(adapter: AgentAdapter): boolean {
  const platforms = adapter.capabilities.supportedPlatforms;
  return platforms.includes(process.platform as NodeJS.Platform);
}
```

For hermes on WSL2, the platform is `'linux'` (not `'win32'`), so the standard check succeeds.

---

## 6. PTY Support

### 6.1 Agents Requiring PTY

| Agent | `requiresPty` | Reason |
|---|---|---|
| claude | `false` | Streams JSON to stdout |
| codex | `false` | Streams JSON to stdout |
| gemini | `false` | Streams JSON to stdout |
| copilot | `false` | Structured output |
| cursor | `false` | Structured output |
| opencode | `false` | Structured output |
| pi | `false` | Structured output |
| omp | `false` | Structured output |
| openclaw | `true` | Interactive TUI; uses terminal control sequences. On Windows, requires ConPTY (Windows 10 1809+); older Windows versions fall back to winpty with potential output buffering differences (see §6.2). |
| hermes | `false` | Structured output via `--output-format jsonl` flag |

> **SCOPE EXTENSION:** hermes-agent does not require PTY; it supports a `--output-format jsonl` flag for structured output.

> **Cross-spec reconciliation note:** `06-capabilities-and-models.md` §12.5 lists `requiresPty=true` for cursor and §12.9 lists `requiresPty=false` for openclaw. These values are **swapped** relative to the authoritative sources: scope §22 explicitly names OpenClaw as requiring PTY ("PTY support via node-pty for agents that require it (OpenClaw, some interactive modes)"), and `03-run-handle-and-interaction.md` §7.1 confirms openclaw=true, cursor=false. The values in this spec (spec 11) and spec 03 are correct; spec 06 §12.5 and §12.9 require correction during the cross-spec consistency review.

### 6.2 PTY Backend Selection

The `node-pty` library selects its backend based on the platform:

| Platform | Backend | Minimum OS Version | Notes |
|---|---|---|---|
| macOS | `openpty(3)` | macOS 10.15+ | Native POSIX PTY allocation |
| Linux | `openpty(3)` | Kernel 2.6+ | Native POSIX PTY allocation |
| Windows | ConPTY | Windows 10 1809+ | Preferred; better VT sequence support |
| Windows (legacy) | winpty | Windows 7+ | Fallback; output buffering differences |

**ConPTY vs. winpty behavioral differences:**

| Aspect | ConPTY | winpty |
|---|---|---|
| VT sequence fidelity | High (native Windows Terminal support) | Moderate (translation layer) |
| Output buffering | Line-buffered by default | May buffer more aggressively |
| Resize support | Native | Emulated |
| Performance | Better | Slower due to translation |

### 6.3 VT Escape Sequence Stripping

PTY output contains VT escape sequences (cursor movement, colors, etc.) that must be stripped before line-based event parsing. The stream engine applies a stripping pass before feeding lines to `adapter.parseEvent()`:

```typescript
/**
 * Strip ANSI/VT escape sequences from PTY output.
 *
 * Handles:
 * - CSI sequences: ESC [ ... final_byte
 * - OSC sequences: ESC ] ... ST
 * - Simple escapes: ESC followed by a single byte
 * - C1 control codes: 0x80-0x9F
 *
 * Maintains internal state to handle sequences split across
 * read() chunk boundaries.
 */
interface VtStripper {
  /**
   * Process a chunk of PTY output. Returns the text with all
   * escape sequences removed.
   *
   * @param chunk - Raw PTY output bytes (may contain partial sequences)
   * @returns Clean text suitable for line-based parsing
   */
  strip(chunk: string): string;

  /**
   * Reset internal state. Called when the PTY stream ends.
   */
  reset(): void;
}
```

**Partial sequence handling:** When a VT escape sequence is split across two `read()` chunks, the `VtStripper` buffers the incomplete sequence and concatenates it with the start of the next chunk before deciding whether to strip or pass through. This is critical for correctness — a naïve regex-based stripper would produce spurious characters.

### 6.4 node-pty as Optional Peer Dependency

```json
{
  "peerDependencies": {
    "node-pty": ">=1.0.0"
  },
  "peerDependenciesMeta": {
    "node-pty": { "optional": true }
  }
}
```

If `node-pty` is not installed and the selected agent requires PTY:

```typescript
throw new AgentMuxError(
  'PTY_NOT_AVAILABLE',
  `Agent "${agent}" requires PTY support but node-pty is not installed. ` +
  `Install it with: npm install node-pty`
);
```

**Native module caveat:** `node-pty` requires platform-specific compilation via `node-gyp`. If the Node.js version changes after installation (e.g., `nvm use` to a different version), the native bindings may become invalid. The error manifests as a module load failure, which the stream engine catches and re-throws as `PTY_NOT_AVAILABLE` with an amended message suggesting reinstallation.

### 6.5 PTY Resource Limits

On Unix systems, each PTY-mode spawn allocates a real OS PTY pair via `openpty(3)`. Systems have finite PTY limits:

- **Linux:** Controlled by `/proc/sys/kernel/pty/max` (default: 4096).
- **macOS:** Since macOS 10.7, PTYs are allocated via a `devfs`-backed mechanism. The limit is configurable via `sysctl kern.tty.ptmx_max` (typically 512+ on modern macOS).

Exceeding the PTY limit results in `ENXIO` or `EIO` from `openpty()`. The stream engine catches this and throws `AgentMuxError` with code `SPAWN_ERROR` and a message indicating PTY exhaustion.

---

## 7. Cross-Platform Path Normalization

### 7.1 agent-mux Own Paths

| Path Purpose | Resolution | Override |
|---|---|---|
| Global config dir | `os.homedir()/.agent-mux/` | `createClient({ configDir })` or `AGENT_MUX_CONFIG_DIR` env var |
| Project config dir | `<projectRoot>/.agent-mux/` | `createClient({ projectConfigDir })` or `--project-dir` CLI flag |
| Run temp dir | `os.tmpdir()/agent-mux-<runId>/` | Not overridable |
| Run index | `<projectConfigDir>/run-index.jsonl` | Project-local (scope §4); falls back to global config dir if no project root is resolved |

**`os.homedir()` resolution per platform:**

| Platform | Typical value |
|---|---|
| macOS | `/Users/<username>` |
| Linux | `/home/<username>` |
| Windows | `C:\Users\<username>` (via `%USERPROFILE%`) |

**`os.tmpdir()` resolution per platform:**

| Platform | Typical value |
|---|---|
| macOS | `/var/folders/<hash>/T` (via `$TMPDIR`) |
| Linux | `/tmp` |
| Windows | `C:\Users\<username>\AppData\Local\Temp` (via `GetTempPath()`) |

### 7.2 Per-Agent Config Paths

Each adapter resolves its agent's native config paths according to the agent's own conventions. The authoritative table of per-agent config file paths is in `08-config-and-auth.md` §7 (Native Config File Locations). This section summarizes the platform resolution rules relevant to process lifecycle.

**Authoritative config paths** (from `08-config-and-auth.md` §7):

| Agent | Global Config Path | Format |
|---|---|---|
| claude | `~/.claude/settings.json` | JSON |
| codex | `~/.codex/config.json` | JSON |
| gemini | `~/.config/gemini/settings.json` | JSON |
| copilot | `~/.config/github-copilot/settings.json` | JSON |
| cursor | `~/.cursor/settings.json` | JSON |
| opencode | `~/.config/opencode/opencode.json` | JSON |
| pi | `~/.pi/agent/settings.json` | JSON |
| omp | `~/.omp/agent/settings.json` | JSON |
| openclaw | `~/.openclaw/config.json` | JSON |
| hermes | `~/.hermes/cli-config.yaml` | YAML |

> **SCOPE EXTENSION:** hermes config path is `~/.hermes/cli-config.yaml` (YAML format, not JSON). See `08-config-and-auth.md` §7.2 for YAML handling details.

**Platform resolution:** The `~` prefix in all paths resolves to `os.homedir()` (see §7.1). On Windows, `os.homedir()` resolves to `%USERPROFILE%` (typically `C:\Users\<username>`). Paths using `~/.config/` follow the XDG convention on Linux but use the same `~/.config/` path on macOS (not `~/Library/`). The per-agent config paths are **the same on all platforms** — they use home-relative paths, not platform-specific config directories. This is because the agent CLIs themselves use the same home-relative paths across platforms.

**Note:** This table intentionally omits the "Project Config Path" column present in `08-config-and-auth.md` §7, as project-level config paths are not relevant to process lifecycle. See `08-config-and-auth.md` §7 for the complete table including project config paths, merge semantics, and format-specific notes.

### 7.3 Path Separator Normalization

All paths exposed through agent-mux API surfaces are normalized to **forward slashes** regardless of platform:

```typescript
// Internal normalization utility
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}
```

This normalization applies to:

- `AgentEvent` fields containing file paths (`file_read.path`, `file_write.path`, etc.)
- `RunResult` fields containing paths
- `SessionManager` path fields
- `ConfigManager` path fields
- All API return values

**Not normalized:** Arguments passed to `child_process.spawn()` and `pty.spawn()` — these use the OS-native format as expected by the agent CLI binary.

### 7.4 Run ID Format

Run IDs are **ULIDs** (Universally Unique Lexicographically Sortable Identifiers):

- **Format:** 26-character string, e.g., `01ARYZ6S41TSV4RRFFQ69G5FAV`
- **Character set:** Crockford Base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`)
- **Properties:** Monotonically sortable, URL-safe, filesystem-safe on all platforms (no colons, slashes, or special characters)
- **Generation:** Client-side via the `ulid` package. If `RunOptions.runId` is provided, it must match the ULID format (`/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/`); otherwise, `AgentMuxError` with code `VALIDATION_ERROR` is thrown.

---

## 8. Platform Abstraction Layer

### 8.1 PlatformAdapter Interface

Platform-specific behavior is encapsulated behind the `PlatformAdapter` interface, selected at module load time. The base interface is defined in `03-run-handle-and-interaction.md` §8.3; this spec adds two utility methods for path and line-ending normalization:

```typescript
/**
 * Base methods (defined in 03-run-handle-and-interaction.md §8.3):
 * - sendInterrupt(pid): void
 * - sendTerminate(pid): void
 * - sendKill(pid): void
 * - suspendProcess(pid): void
 * - resumeProcess(pid): void
 * - createProcessGroup(pid): ProcessGroupHandle
 * - killProcessGroup(handle): void
 * - tempDir(runId): string
 * - shellCommand(): [cmd, args]
 *
 * Extended by this spec:
 */
interface PlatformAdapter {
  // ... all base methods from 03-run-handle-and-interaction.md §8.3 ...

  /**
   * Normalize a path for API surface output.
   * Converts backslashes to forward slashes on Windows; no-op on Unix.
   *
   * > **Spec-level addition:** Not in base PlatformAdapter from spec 03.
   * > Required by the path normalization contract (§7.3).
   */
  normalizePath(p: string): string;

  /**
   * Strip \r from line endings (Windows CRLF → LF).
   * Returns the line unchanged on Unix.
   *
   * > **Spec-level addition:** Not in base PlatformAdapter from spec 03.
   * > Required for CRLF handling (§11.2).
   */
  normalizeLineEnding(line: string): string;
}
```

> **Note on interface divergence:** The base `PlatformAdapter` interface in `03-run-handle-and-interaction.md` §8.3 defines 9 methods. This spec extends it with 2 additional methods (`normalizePath`, `normalizeLineEnding`). Implementors must provide all 11 methods. The authoritative complete interface is in §19 (Complete Type Reference) of this spec.

### 8.2 Implementation Selection

```typescript
const platform: PlatformAdapter =
  process.platform === 'win32'
    ? new WindowsPlatformAdapter()
    : new UnixPlatformAdapter();
```

The selection is made once at module load time. It is not reconfigurable at runtime.

### 8.3 ProcessGroupHandle

```typescript
/**
 * Opaque handle representing a process group.
 * - Unix: the process group ID (number, same as child PID).
 * - Windows: a Job Object handle (native handle wrapped in a class).
 */
type ProcessGroupHandle = UnixProcessGroup | WindowsJobObject;

interface UnixProcessGroup {
  readonly kind: 'unix';
  readonly pgid: number;
}

interface WindowsJobObject {
  readonly kind: 'windows';
  readonly jobHandle: unknown;  // Native handle, opaque to TypeScript
  close(): void;
}
```

---

## 9. Shell Invocation

### 9.1 When Shell Mode Is Used

Shell mode (`SpawnArgs.shell: true`) is used when the adapter needs the system shell to resolve the command. Most built-in adapters do **not** use shell mode — they invoke the agent CLI binary directly.

| Agent | Shell mode | Reason |
|---|---|---|
| claude | No | Direct binary: `claude` |
| codex | No | Direct binary: `codex` |
| gemini | No | Direct binary: `gemini` |
| copilot | No | `cliCommand: 'copilot'`; actual spawn: `gh copilot ...` (`SpawnArgs.command = 'gh'`, `args = ['copilot', ...]`) |
| cursor | No | Direct binary: `cursor` |
| opencode | No | Direct binary: `opencode` |
| pi | No | Direct binary: `pi` |
| omp | No | Direct binary: `omp` |
| openclaw | No | Direct binary: `openclaw` |
| hermes | No | Direct binary: `hermes` |

Shell mode may be used by **plugin adapters** that register custom agents with non-standard invocation patterns.

### 9.2 Shell Selection Per Platform

When shell mode is required:

| Platform | Shell command | Invocation |
|---|---|---|
| macOS | `/bin/sh` | `/bin/sh -c '<command>'` |
| Linux | `/bin/sh` | `/bin/sh -c '<command>'` |
| Windows | `cmd.exe` | `cmd.exe /c <command>` |

**Design rationale:** The minimal POSIX shell (`/bin/sh`) is used on Unix to avoid profile-script side effects. On Debian/Ubuntu, `/bin/sh` is `dash` (not `bash`); adapters that construct shell commands must use POSIX sh syntax. If bash-specific features are needed, the adapter should explicitly use `/bin/bash -c`.

On Windows, `cmd.exe` is the default. If an adapter requires PowerShell, it should set `SpawnArgs.command` to `powershell.exe` with appropriate `-Command` arguments rather than using shell mode.

### 9.3 Shell Injection Prevention

**Critical security requirement:** Adapters must **never** interpolate user-supplied `RunOptions` fields (prompt text, file paths, environment variables) into shell command strings. All adapters should:

1. Build the command and arguments as separate string array elements.
2. Use shell mode only when strictly required (e.g., for PATH resolution).
3. If shell mode is used, use `child_process.spawn` with `shell: true` and pass the command as the first argument with args as separate array elements — Node.js handles escaping.

---

## 10. Run Isolation

### 10.1 Temp Directory Lifecycle

```
mux.run() called
    │
    ├── Step 2: mkdir(os.tmpdir()/agent-mux-<runId>/, { mode: 0o700 })
    │           Creates: stdin-buffer.txt, harness-state.json
    │
    ├── During run: adapter may write to temp dir
    │           Optional: pty-log.txt (PTY + debug mode only)
    │
    └── Run terminates (any terminal state)
            │
            └── Cleanup: rm -rf temp dir (best-effort)
                ├── Success: directory removed
                └── Failure (Windows locked files): directory left for OS cleanup
```

### 10.2 Temp Directory Contents

| File | Purpose | Created |
|---|---|---|
| `stdin-buffer.txt` | Buffered stdin for batch prompt injection | Always |
| `harness-state.json` | Interaction queue, internal state | Always |
| `pty-log.txt` | Raw PTY output for debugging | PTY mode + `debug: true` only |

### 10.3 Temp Directory Security

The temp directory is created with mode `0o700` (owner-only access) to prevent:

- Other users on shared systems from reading `harness-state.json` (may contain prompt text).
- Injection of data into `stdin-buffer.txt` by other processes.
- Symlink attacks: `mkdtemp()` is used on Unix to create the directory atomically.

On Windows, `os.tmpdir()` resolves to the user's `%TEMP%` directory, which is typically accessible only to the user and administrators. The `0o700` mode is applied but has limited effect on Windows (NTFS ACLs take precedence).

### 10.4 Cleanup Failures

Cleanup is best-effort. Known failure scenarios:

| Scenario | Platform | Behavior |
|---|---|---|
| File locked by agent subprocess | Windows | `rmdir` fails; directory left in `%TEMP%` |
| Permission denied | Unix | `rm -rf` fails; logged as `debug` warning |
| Disk full (can't delete) | Any | Extremely rare; cleanup skipped |
| Node.js killed before cleanup | Any | ProcessTracker kills subprocess; temp dir left |

Accumulated orphaned temp directories are the consumer's responsibility to clean up. A utility function is available:

```typescript
/**
 * Remove all orphaned agent-mux temp directories.
 * 
 * Scans os.tmpdir() for directories matching 'agent-mux-*' that have
 * no corresponding running process. Safe to call while runs are active
 * (skips directories for active run IDs).
 *
 * @returns Number of directories removed.
 */
function cleanupOrphanedTempDirs(): Promise<number>;
```

---

## 11. Line Parsing and CRLF Handling

### 11.1 Line Parser

The stream engine's line parser converts raw subprocess output into individual lines for `adapter.parseEvent()`:

```typescript
interface LineParser {
  /**
   * Feed a chunk of raw output. Calls the handler for each
   * complete line found.
   *
   * @param chunk - Raw stdout/PTY output
   * @param handler - Called with each complete line (no trailing newline)
   */
  feed(chunk: string, handler: (line: string) => void): void;

  /**
   * Flush any remaining partial line. Called when the subprocess exits.
   */
  flush(handler: (line: string) => void): void;
}
```

### 11.2 CRLF Normalization

On Windows, subprocess stdout may use CRLF (`\r\n`) line endings. The line parser **always** strips trailing `\r` before passing lines to the handler:

```typescript
// Inside LineParser.feed():
const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
handler(line);
```

This is critical because trailing `\r` characters would corrupt JSON parsing in `adapter.parseEvent()` (e.g., `{"type": "text_delta"}\r` is not valid JSON).

### 11.3 PTY Output Pipeline

For PTY-mode runs, the pipeline has an additional stripping step:

```
PTY output → VtStripper.strip() → LineParser.feed() → adapter.parseEvent()
```

For pipe-mode runs:

```
stdout → LineParser.feed() → adapter.parseEvent()
stderr → (captured for error reporting, not parsed for events)
```

---

## 12. Concurrency Model

### 12.1 Independent State Per RunHandle

Each `RunHandle` instance owns:

| Resource | Isolation |
|---|---|
| Subprocess (PID) | Own PID, own stdio pipes or PTY |
| Process group | Own process group (Unix) or Job Object (Windows) |
| Event buffer | Per-instance, not shared between handles |
| State machine | Per-instance `RunState` |
| Interaction channel | Per-instance queue |
| Timers | Per-instance timeout and inactivity timers |
| Temp directory | Unique path per `runId` |

### 12.2 Shared Resources

| Resource | Sharing model | Synchronization mechanism |
|---|---|---|
| `ProcessTracker` | Singleton | Synchronous register/unregister (no async gaps) |
| Agent config files | Read: point-in-time snapshots | No locking for reads |
| Agent config files | Write: via `ConfigManager` | File-level advisory locking |
| `run-index.jsonl` | Append-only per RunHandle | File-level advisory locking |
| Session files | Read-only by agent-mux | No locking (agent-owned) |
| `node-pty` instances | One per PTY-mode run | No sharing needed |
| `PlatformAdapter` | Singleton | Stateless (no synchronization needed) |
| `AdapterRegistry` | Singleton | `installed()` cache with 30s TTL |

### 12.3 File Locking Protocol

File-level advisory locking is used for all shared mutable files:

```typescript
/**
 * Acquire an advisory lock on the given file path.
 * 
 * Uses platform-appropriate locking:
 * - Unix: flock(2) or fcntl(2) (depending on NFS requirements)
 * - Windows: LockFileEx with LOCKFILE_EXCLUSIVE_LOCK
 *
 * @param filePath - Path to the file to lock
 * @param timeoutMs - Maximum time to wait for the lock (default: 5000ms)
 * @throws AgentMuxError with code CONFIG_LOCK_ERROR if lock cannot be acquired
 */
async function acquireFileLock(filePath: string, timeoutMs?: number): Promise<FileLock>;

interface FileLock {
  release(): Promise<void>;
}
```

**Advisory lock limitation:** Advisory locks are cooperative — they only prevent conflicts between processes that use the same locking protocol. External processes (e.g., a user editing config with a text editor) can bypass the lock. This is documented as a known limitation.

---

## 13. Environment Variable Handling

### 13.1 SpawnArgs.env Merge

The subprocess environment is constructed by merging:

```typescript
const childEnv = {
  ...process.env,        // Parent process environment
  ...spawnArgs.env,      // Adapter-provided overrides (takes precedence)
};
```

### 13.2 Sensitive Variable Inheritance

The parent process's environment variables are inherited by the subprocess. This includes potentially sensitive variables (API keys, tokens, credentials). Each adapter is responsible for:

1. **Setting required variables:** Adding agent-specific API key variables to `spawnArgs.env` based on `AuthManager` state.
2. **Not filtering parent env:** agent-mux does not strip or filter inherited variables, as agents may legitimately need access to `PATH`, `HOME`, `LANG`, `TERM`, and other system variables.

### 13.3 Per-Agent Environment Variables

Key agent-specific environment variables set by adapters:

| Agent | Variable(s) | Purpose |
|---|---|---|
| claude | `ANTHROPIC_API_KEY` | API authentication |
| codex | `OPENAI_API_KEY` | API authentication |
| gemini | `GOOGLE_API_KEY` | API authentication |
| copilot | `GITHUB_TOKEN` | API authentication |
| cursor | `CURSOR_API_KEY` (fallback) | Primary auth via session token in `~/.cursor/`; API key as fallback |
| opencode | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Multi-provider API authentication |
| pi | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Multi-provider API authentication |
| omp | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Multi-provider API authentication |
| openclaw | `OPENCLAW_API_KEY` | API authentication |
| hermes | `OPENROUTER_API_KEY`, `NOUS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_API_KEY` | Multi-provider API authentication |

> **SCOPE EXTENSION:** hermes-agent supports the broadest set of auth environment variables among all supported agents, reflecting its multi-provider architecture.

**Note:** Adapters set only the variables their agent requires. Agents marked "(none set by adapter)" rely on authentication mechanisms other than environment variables (e.g., OAuth tokens, config file credentials). The full auth strategy per agent is documented in `08-config-and-auth.md` §10 (AuthMethod) and §14 (Auth Detection Strategies).

**Cross-reference:** Full per-agent auth environment variable details are in `08-config-and-auth.md` §8 (Table 8.2).

---

## 14. Backpressure and Buffer Management

This section provides the authoritative reference for event buffer backpressure, expanding on `03-run-handle-and-interaction.md` §10.

### 14.1 Buffer Architecture

```
Subprocess stdout/PTY → Line Parser → adapter.parseEvent() → ┐
                                                               │
                                            EventEmitter.emit()│ (synchronous, always)
                                                               │
                                                     Event Buffer (ring)
                                                        │     │
                                                        v     v
                                               Iterator 1  Iterator 2
                                              (read cursor) (read cursor)
```

**Key ordering guarantee:** EventEmitter handlers fire **before** the event enters the buffer. This means:

1. `on()` handlers always see every event (no drops).
2. `on()` handlers see events before `for await` iterators.
3. If an `on()` handler blocks synchronously, it delays all downstream processing.

### 14.2 High-Water Mark Configuration

| Configuration level | Property | Default |
|---|---|---|
| Client-level | `createClient({ eventBufferSize })` | 1000 |
| Run-level | `RunOptions.eventBufferSize` | Inherits from client |

> **Spec-level addition:** `RunOptions.eventBufferSize` and `AgentMuxClientOptions.eventBufferSize` are not present in scope §6 but are required to support configurable backpressure. They are typed as `number` (positive integer, minimum 100, maximum 100000).

### 14.3 Fan-Out Model

Multiple async iterators on the same `RunHandle` each get their own read cursor:

- Events are retained in the buffer until **all** active iterators have consumed them.
- If one iterator stalls, events accumulate for all iterators.
- When the buffer exceeds the high-water mark, the eviction strategy is:
  1. Evict events already consumed by all iterators.
  2. If still over the high-water mark, drop the oldest unconsumed events.
  3. Emit a `debug` event with `level: 'warn'` and message `'Event buffer overflow: N events dropped'` (as specified in `03-run-handle-and-interaction.md` §10.3). This event is not subject to backpressure and is always delivered.

> **Note:** The `RunHandle` iterator JSDoc in `03-run-handle-and-interaction.md` §2 informally refers to this as a "`buffer_overflow` warning". The authoritative event type is `debug` with `level: 'warn'`, as defined in §10.3 of that same spec.

### 14.4 Post-Completion Iteration

Iterating over a `RunHandle` after the run has completed yields all buffered events (those still within the high-water mark), then immediately completes. Events dropped due to overflow during the run are permanently lost.

---

## 15. Security Considerations

### 15.1 Process Isolation

- Each run's subprocess executes in its own process group (Unix) or Job Object (Windows).
- Subprocesses cannot access each other's stdio pipes, temp directories, or internal state.
- The `ProcessTracker` ensures all subprocesses are terminated on Node.js exit.

### 15.2 Temp Directory Security

- Created with mode `0o700` to prevent unauthorized access.
- On Unix, `mkdtemp()` is used for atomic creation (prevents TOCTOU race conditions).
- Contents (`harness-state.json`, `stdin-buffer.txt`) may contain sensitive prompt text and should not be world-readable.

### 15.3 Shell Injection Prevention

- Built-in adapters never use shell mode; they invoke agent CLIs directly.
- Plugin adapters that require shell mode must use `child_process.spawn` with args as separate array elements; Node.js handles escaping.
- Direct string interpolation into shell commands is explicitly prohibited.

### 15.4 Environment Variable Leakage

- Parent process environment is inherited by subprocesses. Sensitive variables (API keys, tokens) flow to agent subprocesses.
- agent-mux does not filter the parent environment because agents may legitimately need system variables.
- Consumers with strict security requirements should use a minimal parent environment.

### 15.5 File Locking Limitations

- Advisory locking is cooperative; external processes can bypass it.
- Config file corruption is possible if external tools write to agent config files while agent-mux holds a lock.

### 15.6 Run ID Validation

- `RunOptions.runId`, if provided, must match the ULID format (`/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/`).
- This prevents path traversal attacks where a crafted run ID like `../../etc/passwd` could be used in temp directory paths.

### 15.7 PTY Output Sanitization

- PTY output may contain VT escape sequences that could be exploited for terminal injection if displayed raw.
- The `VtStripper` removes all escape sequences before event parsing.
- The `pty-log.txt` debug file contains raw (unsanitized) PTY output and should be treated as untrusted data.

---

## 16. Node.js Version Requirements

| Requirement | Minimum Version | Rationale |
|---|---|---|
| Node.js | 20.9.0 | Stable Web Streams API, `structuredClone()`, improved `AbortSignal` support |
| npm | 10.0.0 | Workspace protocol support for monorepo package structure |
| TypeScript (development) | 5.3 | `satisfies` operator, const type parameters |

The `engines` field in `package.json`:

```json
{
  "engines": {
    "node": ">=20.9.0",
    "npm": ">=10.0.0"
  }
}
```

---

## 17. Error Reference

Process lifecycle errors and their codes:

| Error condition | ErrorCode | Thrown by | Defined in |
|---|---|---|---|
| Agent CLI not found | `AGENT_NOT_FOUND` | `mux.run()` | `01-core-types-and-client.md` §3.1; scope §14 (AdapterRegistry) |
| Agent not installed on platform | `AGENT_NOT_INSTALLED` | `AdapterRegistry.detect()` | `01-core-types-and-client.md` §3.1; scope §14 (AdapterRegistry) |
| PTY required but node-pty missing | `PTY_NOT_AVAILABLE` | Stream engine, Step 4 | Spec-level addition (this spec + `03-run-handle-and-interaction.md` §7.3) |
| Subprocess spawn failure | `SPAWN_ERROR` | Stream engine, Step 4 | `01-core-types-and-client.md` §3.1; scope §22 (process lifecycle) |
| Run timeout exceeded | `TIMEOUT` | Stream engine, timer | `01-core-types-and-client.md` §3.1; scope §22 (process lifecycle) |
| Config file lock acquisition failure | `CONFIG_LOCK_ERROR` | `ConfigManager` writes | `01-core-types-and-client.md` §3.1; scope §17 (ConfigManager) |
| Invalid run ID format | `VALIDATION_ERROR` | `mux.run()`, Step 1 | `01-core-types-and-client.md` §3.1; scope §6 (RunOptions) |
| Unsupported capability for agent | `CAPABILITY_ERROR` | `mux.run()`, Step 1 | `01-core-types-and-client.md` §3.1; scope §11 (capabilities) |

> **Note:** `AGENT_NOT_INSTALLED` is defined in the canonical `ErrorCode` union in `01-core-types-and-client.md` §3.1. `PTY_NOT_AVAILABLE` is a **spec-level addition** not present in scope's `ErrorCode` list; it is referenced in `03-run-handle-and-interaction.md` §7.3 and defined here.

---

## 18. Behavioral Contracts

### 18.1 Graceful Shutdown Guarantee

When `mux.run()` returns a `RunHandle`, the following guarantee holds:

> **If the Node.js process exits normally (via `process.exit()`, end of event loop, or SIGTERM/SIGINT), all active subprocesses will be terminated before the Node.js process exits.**

This guarantee does **not** hold for `SIGKILL` on Unix (uncatchable). On Windows, the Job Object provides this guarantee even for abrupt exits.

### 18.2 Event Ordering Guarantee

Events from a single subprocess are delivered in the order they were parsed from stdout/PTY output. No reordering occurs in the line parser, event buffer, or fan-out system.

### 18.3 Cleanup Ordering

Run cleanup follows this sequence:

1. Subprocess is confirmed terminated (exit event received or force-killed).
2. `ProcessTracker.unregister(pid)` removes the process from tracking.
3. Final events (`session_end`, terminal state event) are emitted.
4. `RunResult` promise is resolved.
5. Async iterators complete (`{ done: true }`).
6. Temp directory is removed (best-effort).
7. `run-index.jsonl` entry is appended (under file lock).

Steps 3–5 are synchronous (within the same microtask). Step 6 is async and may fail. Step 7 is async with retry on lock contention.

---

## 19. Complete Type Reference

```typescript
// ── ProcessTracker ──────────────────────────────────────────────────────

interface ProcessTracker {
  register(pid: number, groupId: number, runId: string, gracePeriodMs?: number): void;
  unregister(pid: number): void;
  killAll(): void;
  readonly activeCount: number;
}

// ── PlatformAdapter (complete, extends base from spec 03 §8.3) ──────────

interface PlatformAdapter {
  // Base methods (from 03-run-handle-and-interaction.md §8.3):
  sendInterrupt(pid: number): void;
  sendTerminate(pid: number): void;
  sendKill(pid: number): void;
  suspendProcess(pid: number): void;
  resumeProcess(pid: number): void;
  createProcessGroup(pid: number): ProcessGroupHandle;
  killProcessGroup(handle: ProcessGroupHandle): void;
  tempDir(runId: string): string;
  shellCommand(): [cmd: string, args: string[]];
  // Extended by this spec (§8.1):
  normalizePath(p: string): string;
  normalizeLineEnding(line: string): string;
}

// ── ProcessGroupHandle ──────────────────────────────────────────────────

type ProcessGroupHandle = UnixProcessGroup | WindowsJobObject;

interface UnixProcessGroup {
  readonly kind: 'unix';
  readonly pgid: number;
}

interface WindowsJobObject {
  readonly kind: 'windows';
  readonly jobHandle: unknown;
  close(): void;
}

// ── VtStripper ──────────────────────────────────────────────────────────

interface VtStripper {
  strip(chunk: string): string;
  reset(): void;
}

// ── LineParser ──────────────────────────────────────────────────────────

interface LineParser {
  feed(chunk: string, handler: (line: string) => void): void;
  flush(handler: (line: string) => void): void;
}

// ── FileLock ────────────────────────────────────────────────────────────

interface FileLock {
  release(): Promise<void>;
}

// ── Utility ─────────────────────────────────────────────────────────────

function cleanupOrphanedTempDirs(): Promise<number>;
function acquireFileLock(filePath: string, timeoutMs?: number): Promise<FileLock>;
```

---

## 20. Spec-Level Additions

The following items are **spec-level additions** — details that are implied by but not explicitly stated in the scope document:

| Addition | Section | Rationale |
|---|---|---|
| `PlatformAdapter.normalizePath()` | §8.1 | Extends base interface from spec 03; required for path normalization (§7.3) |
| `PlatformAdapter.normalizeLineEnding()` | §8.1 | Extends base interface from spec 03; required for CRLF handling (§11.2) |
| `VtStripper` interface | §6.3 | Required for PTY output parsing correctness |
| `LineParser` interface | §11.1 | Required for the subprocess-to-event pipeline |
| `cleanupOrphanedTempDirs()` utility | §10.4 | Addresses temp directory accumulation on Windows |
| `RunOptions.eventBufferSize` | §14.2 | Per-run backpressure configuration (also referenced in spec 03 §10.1) |
| `AgentMuxClientOptions.eventBufferSize` | §14.2 | Per-client backpressure configuration |
| `PTY_NOT_AVAILABLE` error code | §17 | Referenced in spec 03 §7.3 but not in scope's ErrorCode list |
| hermes-agent WSL2 detection | §5.3 | Platform-specific detection for hermes on Windows |
| omp partial Windows support warning | §5.2 | Behavioral contract for partial platform support |
| Run ID ULID validation | §7.4 | Path traversal prevention |
| Temp directory mode 0o700 | §10.3 | Security hardening for shared systems |
| `ProcessTracker.register()` `gracePeriodMs` param | §3.1 | Per-run grace period stored at registration for `killAll()` |

**Note:** `AGENT_NOT_INSTALLED` is **not** a spec-level addition — it is part of the canonical `ErrorCode` union defined in `01-core-types-and-client.md` §3.1. `RunOptions.gracePeriodMs` is also not a spec-level addition from this spec — it is defined in `03-run-handle-and-interaction.md` §6.2.

---

## Implementation Status (2026-04-12)

### Actual spawn model

Spawning is implemented in `packages/core/src/spawn-runner.ts` via a single `node:child_process.spawn`. The pipeline per attempt:

1. `adapter.buildSpawnArgs(options)` → abstract `SpawnArgs { command, args, env, cwd, stdin?, shell? }`.
2. `buildInvocationCommand(options.invocation, spawnArgs, agent)` → concrete host `{ command, args, env, cwd, stdin?, shell }` (see `spawn-invocation.ts` and `docs/13-invocation-modes.md`).
3. `child_process.spawn(cmd, args, { cwd, env, stdio: ['pipe','pipe','pipe'], detached, shell })`, where `detached` is `true` on Unix-like platforms so the child becomes a process-group leader.
4. Line-buffer stdout/stderr, feed to `adapter.parseEvent(line, ctx)`, emit `AgentEvent`s.
5. Honour `retryPolicy`, `timeout` (overall), `inactivityTimeout`. Retries re-enter step 1.

### Kill strategy

- **Unix**: `process.kill(-pid, sig)` sends the signal to the entire process group (SIGTERM, then SIGKILL after `gracePeriodMs`).
- **Windows**: Node terminates the root child; for stubborn trees the runner falls back to `taskkill /PID <pid> /T /F`. A full Win32 Job Object implementation (per §3.3) is not yet wired — the current approach is pragmatic but can leak grandchildren in rare cases.

### ProcessTracker

`packages/core/src/process-tracker.ts` provides a registry for in-flight runs and a `killAll()` used by process exit handlers. Registered at spawn time, unregistered on clean exit.

### Invocation modes vs process tracking

When `invocation.mode` is `docker`, `ssh`, or `k8s`, the `pid` tracked by `ProcessTracker` belongs to the *transport* process (`docker`, `ssh`, `kubectl`), not the harness. Signal propagation to the containerised/remote harness is the transport's responsibility — Docker forwards SIGTERM to PID 1 in the container; `kubectl exec` / `kubectl run` forwards to the pod's process group.

#### SSH signal propagation

The `ssh` invocation builder in `packages/core/src/spawn-invocation.ts` now:

- Passes `-t` to allocate a pseudo-tty, so TERM/INT received by the local ssh client are delivered to the remote side.
- Wraps the remote command in a POSIX-sh PID-forwarding trap:

  ```sh
  exec /bin/sh -c '<cd && env && cmd> & pid=$!; trap "kill -TERM $pid" TERM INT; wait $pid'
  ```

  The wrapper `exec`s away so the sh is not an extra hop, backgrounds the real command, installs a signal trap forwarding TERM/INT to the child's PID, then `wait`s. When the local spawn-runner sends SIGTERM (then SIGKILL after the grace window) to the ssh client, the signal is propagated to the remote harness process for a clean shutdown.

The wrapper appears exactly once per invocation and is covered by unit tests in `packages/core/tests/build-invocation-command.test.ts`.
