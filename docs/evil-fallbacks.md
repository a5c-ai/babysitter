# Evil Fallbacks

Silent fallback mechanisms that hide real problems, introduce unexpected degraded behavior, or make debugging impossible. Ordered by severity within each section.

**Legend:** ~~strikethrough~~ = fixed/removed, **(logged)** = diagnostic logging added, **(hardened)** = fallback behavior changed

---

## SDK & Runtime (packages/sdk, packages/tula-runtime)

### Critical

**Journal append queue swallows previous errors** — `packages/sdk/src/storage/journal.ts:19-27` **(logged)**
`.catch(() => undefined)` on the previous operation means ALL prior journal write failures are silently swallowed. The journal — the system's audit trail and replay foundation — can silently lose events. Queue must continue (can't block future writes), so error is now logged to stderr.

~~**Atomic write silently downgrades to non-atomic**~~ — `packages/sdk/src/storage/atomic.ts:30-47` **(hardened)**
On `ENOENT`, the atomic rename used to fall back to `fs.writeFile` (non-atomic). Now throws an error instead.

### High

~~**Cost computation silent failure**~~ — `packages/sdk/src/runtime/orchestrateIteration.ts:135-136` **(hardened)**
Three operations in one `try/catch`. Error now captured as `costError` field in the RUN_COMPLETED event instead of silently vanishing.

**Stray effect detection is a heuristic guess** — `packages/sdk/src/runtime/orchestrateIteration.ts:94-107`
Un-awaited `ctx.task()` detected via `setImmediate` loops + 250ms delay. Timing-dependent — effects can be silently lost.

**Policy decision reporting — best effort** — `packages/sdk/src/runtime/intrinsics/task.ts:132-133` **(logged)**
Compliance decisions now log failures to stderr. Audit trail gaps are visible.

### Medium

**Lock acquisition retries 41 times silently** — `packages/sdk/src/storage/lock.ts:68-79` **(logged)**
Now logs on first retry attempt when contention is detected.

**ESM → CJS module loading fallback chain** — `orchestrateIteration.ts:197-202`, `runSupport.ts:314-329`, `validation.ts:125-138`
Try ESM `import()`, if fail try `require()`, swallow ESM error. Original failure reason lost. Three locations.

**Require cache clear failures ignored** — `packages/sdk/src/runtime/orchestrateIteration.ts:200` **(logged)**
Now logs the failure with resolved path.

**Breakpoint auto-approval — non-critical** — `packages/sdk/src/runtime/intrinsics/task.ts:141-154` **(logged)**
Now logs when auto-approval evaluation fails.

**Process library resolution — fall through** — `packages/sdk/src/processLibrary/active.ts:196-203` **(logged)**
Now logs when falling through to default.

**Git marketplace — nested fallback** — `packages/sdk/src/plugins/marketplace.ts:134-139` **(logged)**
Stash errors now logged before force-checkout.

**Session marker cleanup — ignore errors** — `packages/sdk/src/utils/sessionMarker.ts:79,101`
Stale markers accumulate on disk over time.

**Daemon lifecycle cleanup — `.catch(() => {})`** — `packages/tula-runtime/src/daemon/lifecycle.ts:68-70,174-178,243`
PID file deletion and log writes are best-effort. Stale PID files cause "daemon already running" false positives.

**Webhook trigger setup — silent skip** — `packages/tula-runtime/src/daemon/loop.ts:132-142`
Port in use or permission denied → trigger silently never fires. No indication to user.

**Resource warning callbacks swallowed** — `packages/tula-runtime/src/resources/manager.ts:141-155`
Subscriber errors silently discarded.

---

## Tula Core (packages/tula-core)

### Critical

**Endpoint resolution fallback chain** — `packages/tula-core/src/session.ts:38-89` **(logged)**
9 env vars checked in priority order. Model defaults to "gpt-4o" now warns when no model specified. Anthropic path now logs model conversion.

### High

**Tool error wrapping loses everything** — `packages/tula-core/src/agenticTools/shared/results.ts:37-58` **(logged)**
Now logs full error including stack trace to stderr before converting to errorResult.

**Subagent invocation — message only** — `packages/tula-core/src/subagent/invoker.ts:65-76,116-118` **(logged)**
Now logs full stack trace in `buildErrorResult` before returning message-only result.

### Medium

**AST-grep → ripgrep silent fallback** — `packages/tula-core/src/agenticTools/tools/code.ts:100-130` **(logged)**
Now logs exit code when falling back from `sg` to `rg`.

**Mermaid rendering — "mmdc not available"** — `packages/tula-core/src/agenticTools/tools/code.ts:216-239` **(logged)**
Now logs the error reason. Temp file cleanup failures also logged.

**Puppeteer import — misleading message** — `packages/tula-core/src/agenticTools/browser/tool.ts:42-49` **(hardened)**
Error message now includes actual import error, not just "not installed."

**JSON parse fallback changes types** — `packages/tula-core/src/agenticTools/tools/programmaticToolCalling.ts:137-142`
`JSON.parse()` fails → returns raw string instead. Callers expecting object get string. Type mismatch propagates.

**Web search URL decode fallback** — `packages/tula-core/src/agenticTools/web/searchHelpers.ts:18-23`
`decodeURIComponent` fails → uses raw DuckDuckGo-encoded URL. Broken URLs passed downstream.

~~**Session abort is a no-op**~~ — `packages/tula-core/src/session.ts` **(hardened)**
`abort()` now cancels the active provider request through the request `AbortController`; abort after completion is harmless and aborted prompts do not append partial history.

**Directory walk silent failure** — `packages/tula-core/src/agenticTools/shared/paths.ts:61-65` **(logged)**
Now logs the directory path and error before returning.

**Spawn error — message only** — `packages/tula-core/src/agenticTools/shared/process.ts:94-99` **(hardened)**
Now includes `ErrnoException.code` (ENOENT, EACCES, etc.) in error message.

---

## Agent Platform (packages/agent-platform)

### Critical

**Process module load retry — 3 silent attempts** — `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts:632-678` **(logged)**
Now logs each retry attempt unconditionally, not just in verbose mode.

### High

**Session recovery — 3-layer fallback chain** — `packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts:166-464`
If agent fails → recover from outputs → recovery prompt → host-side recovery. Three levels of silent degradation before final error. Invisible without verbose mode.

~~**Process definition extraction — wrong code blocks**~~ — `packages/agent-platform/src/harness/internal/createRun/planProcess/recovery.ts:33-106` **(hardened)**
Non-process code blocks are now rejected (returns `null`) instead of being extracted and executed.

**Journal scan silent stop** — `packages/agent-platform/src/storage/journalWatcher.ts:83-139` **(logged)**
readdir error now logged with directory path and error message.

**MCP reconnection — error status not exception** — `packages/agent-platform/src/mcp/client/manager.ts:242-271` **(logged)**
Connection failures now logged after exhausting retries.

### Medium

**CLI orchestration fallback** — `packages/agent-platform/src/harness/internal/createRun/orchestration/index.ts:42-44`
No Pi backend → silently falls back to subprocess CLI mode. Undocumented user-facing behavior change.

**Prompt retry — no history** — `packages/agent-platform/src/harness/internal/createRun/agent-core-loop.ts:118-164` **(logged)**
First retry now always logged to stderr.

**Effect execution retry — count swallowed** — `packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts:521-630` **(logged)**
Now logs effect ID, attempt number, and error before each retry.

**Harness name resolution — no validation** — `packages/agent-platform/src/harness/internal/createRun/agent-core-loop.ts:250-262`
Unknown harness names returned as-is. Typos only caught at runtime execution.

**MCP config file — corrupt = empty** — `packages/agent-platform/src/mcp/client/config.ts:33-52` **(logged)**
Non-ENOENT read errors and JSON parse errors now logged distinctly.

**Session state parsing — silent defaults** — `packages/agent-platform/src/session/parse.ts:78-120`
Malformed values silently revert to defaults. Invalid iteration counts become defaults without indication.

**MCP tool execution — exception → result object** — `packages/agent-platform/src/mcp/client/executor.ts:38-59` **(logged)**
Now logs tool name and error message before converting to result object.

---

## Agent Mux Family (packages/agent-mux, agent-launch-mux, triggers-mux, tool-mux)

### High

**Provider resolution — 5-level model fallback** — `packages/agent-mux/core/src/provider-resolver.ts:94-96` **(logged)**
Now logs which source was selected (input/AMUX_MODEL/profile/defaults-file/provider-default) at debug level.

**Credential cascade — silent switching** — `packages/agent-mux/core/src/provider-resolver.ts:34-49`
API key resolved from: direct input → AMUX_API_KEY → GOOGLE_API_KEY → GEMINI_API_KEY → provider envKey. No indication which credential is active.

**Region resolution — 6+ env vars** — `packages/agent-mux/core/src/provider-resolver.ts:113-114`
`AMUX_REGION ?? GOOGLE_CLOUD_LOCATION ?? VERTEXAI_LOCATION ?? AWS_REGION ?? AWS_REGION_NAME ?? params.region`. Wrong region = wrong datacenter, no log.

~~**Auth detection — `void e;` suppression**~~ **(logged)** — `packages/agent-mux/cli/src/commands/doctor.ts:63-69`
Auth detection errors become `{ status: 'unauthenticated' }`. `void e;` explicitly suppresses the error.

~~**GitHub API failures — empty result**~~ **(logged)** — `packages/triggers-mux/src/enrich.ts:61-96`
Missing token, rate limits, HTTP errors all return `[]`. No distinction from "no changes."

### Medium

**Google → Vertex silent upgrade** — `packages/agent-mux/core/src/provider-resolver.ts:124-126` **(logged)**
Now always logs the upgrade with reason (project name or env var value).

**Profile precedence hidden** — `packages/agent-mux/core/src/provider-profiles.ts:135-170`
Project-level file silently shadows global-level. No indication which is active.

**Unknown provider → 'custom'** — `packages/agent-mux/core/src/provider-resolver.ts:25`
Unknown provider IDs silently become 'custom' with no warning.

**Trigger backend detection → 'github'** — `packages/triggers-mux/src/enrich.ts:9-12`
Unknown backends silently default to 'github'.

**Adapter registration — skip on error** — `packages/agent-mux/cli/src/bootstrap.ts:73-85`
Failed adapters silently skipped during startup. Only stderr log, not captured by logging system.

**Plugin capability detection — catch all** — `packages/agent-mux/cli/src/lib/agent-capabilities.ts:58-71`
Command execution timeout/error → `{ supportsPlugins: false }`. No distinction from "not installed."

**Gateway shutdown — void suppression** — `packages/agent-mux/cli/src/commands/gateway/serve.ts:75-76`
`process.once('SIGINT', () => void finish())`. Shutdown errors completely suppressed. Could leave zombie processes.

**Git enrichment — empty changes** — `packages/triggers-mux/src/enrich.ts:30-42`
Git command failures return `[]`. "No changes" indistinguishable from "git failed."

---

## Live-Stack Test Infrastructure

### High

~~**Silent model substitution**~~ — `.github/workflows/live-stack.yml:230-233` **(hardened)**
Now throws instead of silently substituting. If mini isn't supported, the matrix entry fails at generation time.

~~**Missing model config → foundry-gpt55**~~ — `.github/workflows/live-stack.yml:231` **(hardened)**
Now throws `Error('Unknown model ...')` instead of silently defaulting. Typos fail fast.

~~**Unknown agent → synthetic config**~~ — `.github/workflows/live-stack.yml:235-236` **(hardened)**
Now throws `Error('Unknown agent ...')` instead of inventing a config.

~~**Unknown mode → non-interactive**~~ — `.github/workflows/live-stack.yml:251` **(hardened)**
Now throws `Error('Unknown mode ...')`.

~~**Unknown install → vanilla**~~ — `.github/workflows/live-stack.yml:252` **(hardened)**
Now throws `Error('Unknown install mode ...')`.

~~**Hooks "pending" cast to "passed"**~~ — `packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts:889-909` **(hardened)**
Removed `'pending' as 'passed'` type lie. Deferred hooks now start as `'failed'` with explicit upgrade path.

**Non-zero exit tolerated** — `packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts:306-326`
Exit code 1 acceptable if artifact file exists. Crashes after partial output still pass.

### Medium

~~**3-event journal = "completed"**~~ — `packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts:919-930` **(hardened)**
`MIN_JOURNAL_EVENTS` raised from 3 to 5. Journal events alone no longer count as completion proof.

**Odyssey validation is weak** — `packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts:1025-1031`
Only checks: >500 bytes, no error strings, has Greek chars, has markdown headers, mentions "Odyssey." Easily gamed.

**JSON parse errors → `2>/dev/null`** — `.github/workflows/live-stack.yml:578,595-597`
Malformed artifacts silently produce empty strings. Report shows "—" with no error indication.

**grep count errors → zero** — `.github/workflows/live-stack.yml:585-586`
`grep -c '✗' 2>/dev/null || true`. Grep errors become "0 failures." Unreadable reports appear clean.

**Native package install — continue on failure** — `.github/workflows/live-stack.yml:81-83`
`npm install --no-save $NATIVE_PKGS || echo "some native deps failed to install"`. Build continues with missing deps.

**Tula startup check — non-fatal** — `.github/workflows/live-stack.yml:454-456`
Tula binary can't start → test proceeds anyway. Later failures attributed to test logic.

**Run evidence files — silent skip** — `packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts:630-635`
Missing run metadata files silently skipped. Incomplete trace ID evidence.

**Task directory errors → empty** — `packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts:649-655`
Missing tasks directory returns `[]`. Failed runs look like "no tasks created."

---

## Atlas & Graph (packages/atlas)

### Medium

**YAML schema parse errors silently skipped** — `packages/atlas/src/indexer.ts:250-264,273-283`
`catch { }` in `loadNodeKinds()` and `loadEdgeKinds()`. Bad schema files silently skip, parseErrors counter incremented but never reported to user. Graph definition may be incomplete.

**Parse error counter never surfaced** — `packages/atlas/src/indexer.ts:417-419`
Parse errors are counted internally but the count is not returned or logged. Caller has no way to know how many files failed.

---

## Harness Discovery & Config (packages/sdk/src/harness, packages/sdk/src/config)

### Critical

**Graph catalog resolution silently falls back to hardcoded metadata** — `packages/sdk/src/harness/amuxFallbackMetadata.ts:179-220` **(logged)**
`buildStaticFallbackMetadata()` catches ALL errors and returns `LOCAL_FALLBACK_METADATA`. If catalog loading fails or returns all-false capabilities (schema mismatch), silently uses hardcoded local fallback. No indication which metadata is active.

### High

**Harness discovery falls back to legacy probing silently** — `packages/sdk/src/harness/discovery.ts:144-151` **(logged)**
`discoverHarnesses()` tries amux discovery first, any error falls back to legacy direct probing. User never knows which path was taken. Degraded behavior (slower, less capable) is invisible.

**Config resolution — 10+ `??` chains without logging** — `packages/sdk/src/config/configValidation.ts:49-86`
`overrides?.field ?? parseEnvVar(..., DEFAULTS.field)` repeated for every config key. No logging of which source (override, env var, default) was selected. Effective config is unauditable.

**Boolean parsing treats everything non-true as false** — `packages/sdk/src/config/configValidation.ts:18-21`
`parseEnvBoolean()` returns `false` for undefined, empty string, or any non-"1"/"true" value. `false` is indistinguishable from "user explicitly set to false."

**Log level parsing — invalid becomes default** — `packages/sdk/src/config/configValidation.ts:37-43`
Invalid log level silently reverts to fallback. User thinks they set "debug" but gets "info."

### Medium

**Legacy session directory remapping** — `packages/sdk/src/harness/amuxFallbackMetadata.ts:8-11`
`resolveFallbackSessionDir()` silently remaps `LEGACY_REPO_RUNS_DIR` to default. Users with old config don't know they're using a different path.

**Host signal map — empty on error** — `packages/sdk/src/harness/amuxFallbackMetadata.ts:189-191`
If `hostSignalMap[name]` is undefined, silently falls back to empty array. Harness detection becomes impossible.

---

## Agent Platform Internals (packages/agent-platform — additional)

### High

**Azure OpenAI URL parse fallback** — `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts:119-122`
`normalizeAzureOpenAiBaseUrl()` catches URL.parse errors and returns raw untrimmed value. Malformed URLs passed downstream without indication.

**Azure model synthesis returns undefined silently** — `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts:146-175`
`synthesizeAzureModelEntry()` returns `undefined` at multiple points without logging. Model resolution fails silently.

**Non-JSON stdin lines silently discarded** — `packages/agent-platform/src/harness/amux/amuxStdinReader.ts:64-66`
`catch { continue; }` on JSON.parse. Invalid interaction events vanish. Downstream code may wait forever for a response that was malformed and discarded.

**Pi module import — generic error hides real cause** — `packages/agent-platform/src/harness/piWrapper/moduleSupport.ts:86-96`
Catch wraps error with "is the package installed?" but original error lost. Could be version mismatch, init error, or actual missing package.

### Medium

**Inline `.catch(() => undefined)` pattern** — Multiple files:
- `packages/agent-platform/src/api/breakpoints.ts` — task definition read
- `packages/agent-platform/src/harness/piSecureSandbox.ts:245` — `void session.abort().catch(() => undefined)`
- `packages/agent-platform/src/harness/piWrapper.ts:245` — same pattern

All errors from these operations are completely invisible.

---

## Transport, Tasks, Extension, Cloud (packages/transport-mux, tasks-mux, extension-mux, cloud)

### Critical

~~**Tool call arguments JSON parse → empty object**~~ — `packages/transport-mux/src/server.ts:1304` **(hardened)**
`try { input = JSON.parse(tc.arguments); } catch { input = {}; }`. Malformed tool call arguments silently become `{}` — tool executes with garbage input.

~~**Hook bash execution → `{}\n`**~~ — `packages/extension-mux/src/transformHelpers.ts:110,123-125` **(hardened)**
Shell script execution catch returns `{}\n`. Caller thinks hook succeeded with empty result. Completely masks bash failures.

**Gemini CLI spawn errors → "not found"** — `packages/extension-mux/src/transformHelpers.ts:272-275` **(logged)**
Any spawn error (permissions, system issues) treated same as "CLI not found." Wrong fallback message.

**Extension uninstall — double empty catch with destructive fallback** — `packages/extension-mux/src/transformHelpers.ts:290,295` **(logged)**
Uninstall failures fall through to `fs.rmSync({ recursive: true, force: true })` without verification.

**Breakpoint answer poller — fabricated "expired" result** — `packages/tasks-mux/src/client/answer-poller.ts:220` **(logged)**
Any error fetching final breakpoint state → returns hardcoded minimal "expired" result. Misleads consumers.

**Response body nested catch** — `packages/tasks-mux/src/backends/server.ts:244` **(logged)**
If response isn't JSON AND reading text fails, body becomes `undefined`. Error reporting becomes lossy.

### High

~~**Hook execution best-effort**~~ — `packages/extension-mux/src/transformHelpers.ts:247-254` **(hardened)**
`try { execFileSync("bash", [...]); } catch { /* best-effort */ }`. Hook failures completely invisible.

**File overwrite on read error** — `packages/extension-mux/src/installSharedGenerator.ts:77-84` **(logged)**
Read errors (permissions, corrupt file) treated as "doesn't exist." May overwrite with wrong content.

**chmod failure ignored** — `packages/extension-mux/src/installSharedGenerator.ts:131-133`, `packages/cloud/src/sdk/providers.ts:128-130` **(logged)**
File permission changes fail silently. Scripts won't be executable; provider secrets may be world-readable.

**Cloud agent spawn — JSON/raw conflation** — `packages/cloud/src/sdk/agents.ts:96-110` **(logged)**
JSON parse failure converts structured output into "raw output" mode. Caller can't distinguish.

**Kubernetes resource parse → empty array** — `packages/cloud/src/sdk/deploy.ts:103-107` **(logged)**
Invalid K8s response → `[]`. "No resources" indistinguishable from "API returned garbage."

**Response body read → undefined** — `packages/tasks-mux/src/client/server-client.ts:329`
`.catch(() => undefined)` on response text. Error details lost in ServerError constructor.

### Medium

**Atlas catalog readdir/stat → empty/undefined** — `packages/atlas/src/catalog/discovery.ts:190-202`
`readdirSync` catch returns `[]`, `statSync` catch returns `undefined`. Permission errors = "nothing here."

**Atlas catalog frontmatter parse → empty** — `packages/atlas/src/catalog/discovery.ts:267-275`
YAML parse errors → `{ frontmatter: {}, content }`. Missing metadata without indication.

**Tasks-mux config → undefined** — `packages/tasks-mux/src/config.ts:115-124`
File read, JSON parse, and validation errors all collapse to `undefined`. Missing config silently accepted.

**Proxy auth token → random UUID** — `packages/transport-mux/src/bin/amux-proxy.ts:27`
`process.env.AMUX_PROXY_AUTH_TOKEN || randomUUID()`. Silent fallback to random token if env not set.

**Extension env var cascades** — `packages/extension-mux/src/transformHelpers.ts:108,117-118`
`process.env.${pluginRootEnvVar} || process.env.PLUGIN_ROOT || path.resolve(...)`. No log of which path taken.

---

## Agent Mux Subpackages (adapters, gateway, launch, core, config, tui, ui, webui, mobile)

### Critical

**Config write serialization — previous error swallowed** — `packages/agent-mux/core/src/config-manager.ts:161` **(logged)**
`prev.catch(() => undefined).then(fn)`. Previous write error swallowed, next write proceeds. Race conditions possible.

### High

**PTY/subprocess kill failures — 8+ locations** — `packages/agent-mux/core/src/spawn-runner.ts:163`, `packages/agent-mux/launch/src/launch.ts` (multiple) **(logged — spawn-runner)**
`try { ptyProcess.kill(sig); } catch { /* */ }`. Failed process termination = zombie processes remain alive.

**stdin write failures — input lost** — `packages/agent-mux/core/src/spawn-runner.ts:337,355,365`
User input and interaction responses silently discarded on write failure.

**Connection/server cleanup — resource leaks** — `packages/agent-mux/adapters/src/remote-adapter-base.ts:136,141` **(logged)**
`connection.close().catch(() => {})`, `stopServer?.().catch(() => {})`. Connections and servers leak.

**Ephemeral config cleanup** — `packages/agent-mux/adapters/src/claude-code/runtime-hooks/ephemeral-config.ts:112,117,130` **(logged)**
Three `fs.rm().catch(() => {})` calls. Filesystem leaks accumulate.

**Hook event chain failure** — `packages/agent-mux/core/src/spawn-runtime-hooks.ts:145` **(logged)**
`await eventChain.catch(() => {})`. Hook dispatch failures silently ignored.

**Adapter installation detection → null** — `packages/agent-mux/core/src/adapter-registry.ts:160`, `packages/agent-mux/core/src/spawn-runner-utils.ts:66` **(logged — adapter-registry)**
`.catch(() => null)`. Detection error indistinguishable from "not installed."

**Keytar import failure → null** — `packages/agent-mux/adapters/src/auth-config.ts:179`
`.catch(() => null)`. Password store access disabled silently.

**Gateway JSON parse → empty object** — `packages/agent-mux/gateway/src/kanban/routes.ts:1494` **(logged)**
`.catch(() => ({}))`. API response parse failure → empty object.

### Medium

**Auth detection → 'unknown'** — `packages/agent-mux/core/src/adapter-registry.ts:155-157` **(logged)**
Auth detection failure now logged with agent name before marking 'unknown'.

**Remote agent fallback → 'claude'** — `packages/agent-mux/adapters/src/agent-mux-remote-adapter.ts:112`
`env['AMUX_REMOTE_AGENT'] ?? process.env['AMUX_REMOTE_AGENT'] ?? 'claude'`. Silent default.

**Binary resolution fallbacks** — `packages/agent-mux/launch/src/bridge-hooks.ts:41-46`
`env['BABYSITTER_BIN'] || 'babysitter'`, `env['HOOKS_MUX_BIN'] || 'a5c-hooks-mux'`. Wrong tool version possible.

**Bridge hook .cmd shim parsing** — `packages/agent-mux/launch/src/bridge-hooks.ts:109,121`
`catch { /* not found */ }` × 2. Falls back to `shell: true` which changes execution semantics.

**Mobile connection failure — void** — `packages/agent-mux/mobile-ios-app/src/providers/GatewayProvider.tsx:107`, `mobile-android-app` same
`void client.connect().catch(() => undefined)`. Connection failure invisible to user.

**Cost/token extraction → 0** — `packages/agent-mux/adapters/src/base-adapter-helpers.ts:32-38`
`extractNumber(...) ?? 0`. Missing cost data zeroed out instead of flagged.

**WebUI fetch parse → null** — Multiple webui components (automations, workspaces, dashboard)
`.catch(() => null)` on `.json()` calls. API response loss.

**K8s cleanup best-effort** — `packages/agent-mux/core/src/spawn-invocation.ts:177,180`
Pod cleanup spawn error and catch block both silenced.

---

## Krate Web & Observer (packages/krate/web, packages/observer-dashboard, packages/babysitter-tui-plugins)

### Critical

~~**RBAC deletion — orphaned role bindings**~~ **(logged)** — `packages/krate/web/app/components/settings-rbac.jsx:34-36`
`fetch('/api/orgs/.../rolebindings', { method: 'DELETE' }).catch(() => {})`. Deletion failure = orphaned permissions. Security boundary violation.

~~**SSE stream endpoint — triple null return**~~ **(logged)** — `packages/krate/web/app/api/orgs/[org]/agents/events/stream/route.js:15,23,26`
Missing env var → `null`. Upstream error → `null`. Parse error → `null`. Client waits forever.

### High

~~**Cache invalidation silently fails**~~ **(logged)** — `packages/krate/web/app/lib/api-errors.js:9`
`fetch('.../cache/invalidate', { method: 'POST' }).catch(() => {})`. Stale data circulates indefinitely.

~~**Multiple component fetch `.catch(() => {})`**~~ **(logged)** — `curated-model-catalog.jsx:117`, `runner-pool-manager.jsx:278,292`, `kanban-enhanced.jsx:423`, `stack-builder-graph.jsx:436,533`
Model deployments, runner scaling, status updates — all fire-and-forget. UI optimistically updates; backend silently fails.

~~**Journal entry skipping**~~ **(logged)** — `packages/babysitter-tui-plugins/src/data.ts:69,128,277`, `status-plugin.tsx:104`
`catch { // skip malformed journal entries }`. Run data silently lost. Audit trail gaps.

### Medium

**Session cookie parsing → null** — `packages/krate/web/app/lib/krate-ui.jsx:262-263`
Crypto failures, format errors → `null` → logged out. No audit trail.

**Clipboard copy silent failure** — Multiple components: `assistant-chat.jsx:201`, `assistant-generate.jsx:117`, `inference-helpers.jsx:167`
`navigator.clipboard.writeText(text).catch(() => {})`. User thinks copy worked.

**Theme script empty catch** — `packages/krate/web/app/layout.jsx:6`, `packages/observer-dashboard/src/app/layout.tsx:15`
localStorage/matchMedia errors → empty catch. Theme preference not persisted.

**Observer components — null on missing data** — `packages/observer-dashboard/src/app/runs/[runId]/page.tsx:107` and others
Components disappear instead of showing error state.

---

## CI/CD & Build Configs

### Critical

~~**Gateway tsconfig — `noImplicitAny: false` + `useUnknownInCatchVariables: false`**~~ **(hardened)** — `packages/agent-mux/gateway/tsconfig.json:9-10`
Catch handlers receive `any` type. No compile-time validation of error handling. Wrong error properties accessed at runtime.

~~**E2E tests continue-on-error on non-main**~~ **(hardened)** — `.github/workflows/publish.yml:343`
`continue-on-error: ${{ github.ref_name != 'main' }}`. Broken code ships on staging.

### High

**Native deps — `2>/dev/null || true` × 15+ locations** — `.github/workflows/ci.yml:34,73,264,345`, `generate-plugins.yml:42`, `sync-external-plugins.yml:48`, `staging-sync-plugin-commands.yml:42`, `live-stack.yml:82`, `live-stack-published.yml:216,220`
Build succeeds with degraded native binaries. Rollup/SWC/Tailwind run in slow JS fallback. No CI signal.

~~**Token generation continue-on-error**~~ **(hardened)** — `.github/workflows/qa-daily.yml:43`
GitHub App token generation fails → falls back to `github.token`. Tests run with wrong permissions/quotas.

### Medium

**Root tsconfig — `skipLibCheck: true`** — `tsconfig.json:12`
Skips type checking for all declaration files. Dependency type incompatibilities invisible.

**Label creation — `2>/dev/null || true`** — `.github/workflows/agent-review-dispatch.yml:111`
GitHub API errors, rate limits silently absorbed.

**Version checks — non-fatal** — `.github/workflows/live-stack.yml:456` and others
Tool startup failures echo but don't fail CI. Tests proceed with missing tools.

---

## Anti-Patterns Reference

| Pattern | Why It's Evil | What To Do Instead |
|---------|--------------|-------------------|
| `catch { /* */ }` | Error completely invisible | `catch (e) { logger.warn('...', e.message); }` |
| `catch { /* best effort */ }` | Sounds intentional, still invisible | Log it. "Best effort" means "we chose to be blind" |
| `\|\|` for defaults | Treats 0, "", false as missing | Use `??` for nullish-only coalescing |
| `catch { return []; }` | "No results" = "detection failed" | Return `{ results: [], error?: string }` |
| `A \|\| B \|\| C` env chains | No audit of which value won | Log the resolution: `using ${source} for ${key}` |
| `catch { continue; }` | Loop silently skips corrupted items | Collect errors, report count at end |
| `.catch(() => undefined)` | Promise chain silently absorbs rejections | `.catch(e => { log(e); return undefined; })` |
| `void asyncFn()` | Promise rejection suppressed | `asyncFn().catch(e => log(e))` |
| Retry N times silently | "Slow" and "broken" look identical | Log first retry and final outcome |
| `status: 'pending' as 'passed'` | Type system lies about reality | Use a proper union type with pending state |
