# Changelog

## [Unreleased] - 2026-06-01

### Features

- feat: Atlas catalog unification (#850) (6c9c72239, a5c-ai[bot], 5 minutes ago)
- feat: TDD blueprints rename convergence (#853) (c1c743c3a, a5c-ai[bot], 45 minutes ago)
- feat: agent-core to tula-core TDD rename (#852) (2dc9dcfb2, a5c-ai[bot], 2 hours ago)
- feat: preflight orphan-file grep prompts (#849) (ba6e2d8f5, a5c-ai[bot], 7 hours ago)
- feat(live-stack): add tula to vanilla and BP matrix sections (0e867fd48, Tal Muskal, 11 hours ago)
- feat(krate): add OpenAI-compatible provider support for assistant (0fd0f82ba, Tal Muskal, 23 hours ago)
- feat(graph): add OpenClaw 2026.5.28 issue 810 records (#829) (80c787ffe, a5c-ai[bot], 23 hours ago)
- feat(graph): track Copilot CLI 1.0.57-3 (#826) (6bf2b63b2, a5c-ai[bot], 23 hours ago)
- feat(graph): track Amp 0.0.1780244579-g6b52f9 (#825) (ad9d3d027, a5c-ai[bot], 23 hours ago)
- feat(graph): add Pi 0.78.0 issue 808 records (#824) (cfbaf82fb, a5c-ai[bot], 23 hours ago)
- feat(atlas): track OpenAI Node SDK 6.39.1 (#823) (da7481317, a5c-ai[bot], 23 hours ago)
- feat(graph): add Qwen Code 0.17.0 issue 807 records (#822) (ba4cfd04d, a5c-ai[bot], 23 hours ago)
- feat(atlas): track Droid CLI 0.137.1 (#830) (313ff1440, a5c-ai[bot], 23 hours ago)
- Add Cursor 2026-05-20 graph update (#821) (f31cf1daf, a5c-ai[bot], 23 hours ago)
- feat(atlas): track Claude Agent SDK 0.3.159 (#819) (d1aa94640, a5c-ai[bot], 23 hours ago)
- feat(graph): track OpenCode 1.15.13 for issue 811 (#818) (02ff17a6f, a5c-ai[bot], 23 hours ago)
- feat(graph): track Claude Code 2.1.159 (#816) (db73f79fe, a5c-ai[bot], 23 hours ago)

### Fixes

- fix(atlas): use readFileSync instead of require for graph index JSON (ce0247dbd, Tal Muskal, 7 minutes ago)
- fix(ci): alias atlas to dist in vitest + add graph data verification (54aee7f7b, Tal Muskal, 21 minutes ago)
- fix(ci): externalize atlas in vitest to fix 67 adapter test failures (ffc5a5088, Tal Muskal, 41 minutes ago)
- fix: krate default provider to anthropic, relax gemini version pin test (b660ceccd, Tal Muskal, 56 minutes ago)
- fix: additional CI test fixes (fa888cc2a, Tal Muskal, 77 minutes ago)
- fix(live-stack): accept missing file in resume mode (e512ef37c, Tal Muskal, 2 hours ago)
- fix(live-stack): use absolute outputDir in resume fixture inputs (9acbf924e, Tal Muskal, 2 hours ago)
- fix: resolve 4 pre-existing CI test failures (3b77d2e51, Tal Muskal, 2 hours ago)
- fix(live-stack): increase command timeout to 60 min for hermes Windows ConPTY (0abe419f4, Tal Muskal, 5 hours ago)
- fix(launch): increase NI idle timeout to 5 min in bridge-hooks mode (9d48bd7c8, Tal Muskal, 5 hours ago)
- fix(launch): skip ConPTY for hermes Windows in bridge-hooks mode (4c0d11358, Tal Muskal, 6 hours ago)
- fix(live-stack): resume completion-proof doesn't require file-creation (7289b3999, Tal Muskal, 7 hours ago)
- fix(live-stack): add resume-mode rescue for non-zero exit (dd276d92a, Tal Muskal, 7 hours ago)
- fix(ci): update architecture boundary check for omni→tula rename (8d5266cc3, Tal Muskal, 7 hours ago)
- fix(ci): plan agent creates draft PRs with feat: title, not Plan: (0c43046a1, Tal Muskal, 7 hours ago)
- fix(live-stack): increase test timeout to 48 min (> 45 min command + setup) (6e5a99476, Tal Muskal, 8 hours ago)
- fix(live-stack): increase all timeouts to 45 min for hermes Windows (28021fc45, Tal Muskal, 9 hours ago)
- fix(live-stack): relax tula validation thresholds (97e67a911, Tal Muskal, 9 hours ago)
- fix(agent-platform): auto-execute ALL effect kinds, check taskDef paths (e19b732b7, Tal Muskal, 10 hours ago)
- fix(agent-platform,live-stack): autonomous host loop + 35 min timeout (923c44d4e, Tal Muskal, 10 hours ago)
- fix(live-stack): increase command timeout from 15 to 25 min (6820e2c2d, Tal Muskal, 11 hours ago)
- fix(live-stack): increase interactive timeout to 25 min unconditionally (e4cbae9fb, Tal Muskal, 12 hours ago)
- fix(launch): increase PROMPT_ARTIFACT_MONITOR_TIMEOUT to 25 min on Windows (7eec88d3b, Tal Muskal, 12 hours ago)
- fix(live-stack): increase Windows interactive timeout to 25 min (ad9689487, Tal Muskal, 13 hours ago)
- fix(agent-platform): auto-execute agent effects via delegation (ebcd4399b, Tal Muskal, 13 hours ago)
- fix(agent-platform): auto-execute shell effects in orchestration host (3a9b84b95, Tal Muskal, 14 hours ago)
- fix(live-stack): accept resume-mode completion when run+artifact exist (9b4b8c859, Tal Muskal, 14 hours ago)
- fix(krate): add identity CRDs to KRATE_RESOURCES, enable ArgoCD+Gitea (68ef09e90, Tal Muskal, 14 hours ago)
- fix(live-stack): use simpler 2-task process for omni tests (61640bc10, Tal Muskal, 14 hours ago)
- fix(live-stack): omni uses simple call without --process (06fa83e22, Tal Muskal, 19 hours ago)
- fix(agent-platform): increase MAX_CONSECUTIVE_STALLS from 2 to 5 (83934170a, Tal Muskal, 20 hours ago)
- fix(live-stack): check deferredHooksEntries for hooks-mux-session (518906e65, Tal Muskal, 21 hours ago)
- fix(live-stack): move create-mode upgrade before entries are pushed (2cb757841, Tal Muskal, 21 hours ago)
- fix(live-stack): rescue non-zero exit in create mode when process file exists (e7da1f61d, Tal Muskal, 21 hours ago)
- fix(live-stack): accept create-mode success without formal SDK run (0126a124a, Tal Muskal, 21 hours ago)
- fix(launch): add --skip-trust for gemini-cli in addition to env var (f7c7fb29c, Tal Muskal, 22 hours ago)
- fix(live-stack): root-cause fixes for gemini-cli, macOS, pi, omni (4443e9297, Tal Muskal, 22 hours ago)
- fix(krate): lightweight readiness probe to prevent pod flip-flopping (581c9db58, Tal Muskal, 22 hours ago)
- fix(krate): remove production-only JWT secret requirement for Jitsi (ad267f4cb, Tal Muskal, 23 hours ago)
- fix(live-stack): use /resume for non-claude/codex agents in BP/Resume mode (d17e01611, Tal Muskal, 23 hours ago)
- fix(extension-mux): templatize harness name in generated plugins (6f188c842, Tal Muskal, 23 hours ago)
- fix(atlas): track Oh-My-Pi 15.7.3 graph updates (#827) (da5b4b314, a5c-ai[bot], 23 hours ago)
- fix(live-stack): use /yolo for pi/gemini/hermes BP (not /babysitter:yolo) (7817987a5, Tal Muskal, 23 hours ago)
- fix(live-stack): explicit babysitter call instruction for BP/Create non-native agents (529e6660b, Tal Muskal, 24 hours ago)
- fix(live-stack): restore proper BP verification thresholds (350afabb2, Tal Muskal, 24 hours ago)

### Refactors

- rename: omni → tula across entire repo (da7723a66, Tal Muskal, 12 hours ago)
- refactor(unified-plugin): remove per-harness babysit-SKILL overrides (b19518bc5, Tal Muskal, 22 hours ago)

### Documentation

- docs: add 4 rename/restructure gap analyses (56f57a01d, Tal Muskal, 11 hours ago)
- docs: daily changelog update (#799) (a7fe568df, a5c-ai[bot], 24 hours ago)

### Maintenance

- revert(launch): re-enable ConPTY for hermes Windows (stdin needs it) (6c4ed3a27, Tal Muskal, 5 hours ago)
- chore: regenerate package-lock.json after omni→tula rename (adf0d61aa, Tal Muskal, 12 hours ago)
- debug(live-stack): add logging to create-mode upgrade path (4406ef6be, Tal Muskal, 21 hours ago)
- chore(graph): track Hermes Agent 0.15.2 (#828) (534cd171f, a5c-ai[bot], 23 hours ago)
- chore(atlas): track Codex CLI 0.135.0 (#820) (fc2a667fa, a5c-ai[bot], 23 hours ago)
- chore(atlas): track gemini cli 0.44.1 for issue 806 (#817) (607e09858, a5c-ai[bot], 23 hours ago)
- Track upstream agent CLI versions (#815) (b347fb538, a5c-ai[bot], 24 hours ago)

## [Unreleased] - 2026-05-31

### Bug Fixes
- restore proper BP verification thresholds (350afabb2, Tal Muskal, 14 minutes ago)
- set LIVE_STACK_OUTPUT_DIR as absolute path in agent env (c6b436d3e, Tal Muskal, 21 minutes ago)
- resolve output path to absolute using LIVE_STACK_CWD (c846561a6, Tal Muskal, 39 minutes ago)
- also pass LIVE_STACK_TRACE_ID and BABYSITTER_RUNS_DIR in handler env (d96d15d86, Tal Muskal, 52 minutes ago)
- update bridge-hooks test for session ID prefix + unified harness (19033314d, Tal Muskal, 63 minutes ago)
- embed AGENT_SESSION_ID in handler command string (fe8be095e, Tal Muskal, 68 minutes ago)
- align isHostDelegableRoute mocks with route-based check (9adc0bdda, Tal Muskal, 2 hours ago)
- RBAC permissions + readiness probe timeout for controller (8a1102f4c, Tal Muskal, 3 hours ago)
- set AGENT_SESSION_ID env for session-start hook (574fe6bb0, Tal Muskal, 3 hours ago)
- isHostDelegableRoute should check route, not backend (5dd82f650, Tal Muskal, 3 hours ago)
- update broken process library links to point to library/ root (#793) (045a22651, Safet A, 3 hours ago)
- use 'unified' harness for session-start/end hooks (1334fbd6b, Tal Muskal, 3 hours ago)
- map amux agent name to babysitter SDK harness name (018d055c7, Tal Muskal, 4 hours ago)
- add SessionStart/Stop mappings to gemini and pi adapters (e195a4980, Tal Muskal, 5 hours ago)
- add Jitsi resource kinds to KRATE_RESOURCES array (c9a80314d, Tal Muskal, 5 hours ago)
- deliver stdin prompt through ConPTY for hermes Windows (4b92bc7a3, Tal Muskal, 6 hours ago)
- handle Windows Node 22 PATH resolution in live-stack (850950b7f, Tal Muskal, 7 hours ago)
- ensure Node 22 is active in live-stack test step (741489564, Tal Muskal, 7 hours ago)
- use ConPTY for hermes on Windows NI mode (a2865ee1a, Tal Muskal, 7 hours ago)
- add a5c GitHub App token for copilot-cli live-stack tests (40aef9d16, Tal Muskal, 13 hours ago)
- add full SDK build chain to ALL downstream publish jobs (4946105f5, Tal Muskal, 20 hours ago)
- add tasks-mux build to Publish Agent Core + Babysitter Agent jobs (458d565d7, Tal Muskal, 21 hours ago)
- add tasks-mux build to Publish SDK job (1036122b5, Tal Muskal, 22 hours ago)
- merge fallback mappings with catalog for hermes adapter (4e9b4ed23, Tal Muskal, 22 hours ago)
- read traceId from LIVE_STACK_TRACE_ID env in BP process (d72ab98c0, Tal Muskal, 23 hours ago)
- replace all new Function import tricks + align tasks-mux mocks (940c497b1, Tal Muskal, 23 hours ago)
- align routing tests with updated isHostDelegableRoute (972c6aec5, Tal Muskal, 23 hours ago)
- add SessionStart and Stop mappings to hermes adapter (0b2c75705, Tal Muskal, 23 hours ago)
- use native gemini babysitter prompts (#791) (69c094717, a5c-ai[bot], 24 hours ago)
- use child process for pluginExternalRouting test isolation (8ff240ee6, Tal Muskal, 24 hours ago)
- isolate pluginExternalRouting from vi.mock thread leaks (bdc57daf1, Tal Muskal, 24 hours ago)

### Maintenance
- Fix Pi resume command conflict (#794) (a5cc6edec, a5c-ai[bot], 3 hours ago)

## [Unreleased] - 2026-05-29

### New Features
- push all 10 adversarial dimensions to 100 (8cf40df99, Tal Muskal, 4 hours ago)
- push all 10 adversarial dimensions to 95+ (f44398767, Tal Muskal, 4 hours ago)
- server cache, barrel index, shared helper extraction (604adf0db, Tal Muskal, 7 hours ago)
- 30 new tests, remove mock data, dynamic tool discovery (622b8060e, Tal Muskal, 8 hours ago)
- fetch dedup, confirm dialog, unsaved changes, component docs (83343e4f5, Tal Muskal, 8 hours ago)
- complete accessibility — 40→3 components with zero a11y (247665f4b, Tal Muskal, 8 hours ago)
- router.refresh() migration, API route tests, force-dynamic fixes (fff3bfd54, Tal Muskal, 8 hours ago)
- add meaningful accessibility attributes to 20 components (3031a8c4a, Tal Muskal, 8 hours ago)
- add pagination to all list endpoints and UI (8beaf2162, Tal Muskal, 10 hours ago)
- add evil fallback audit and here be dragons audit processes (1332cb106, Tal Muskal, 10 hours ago)
- add route-level loading skeletons for 8 sections (f2a23c7d0, Tal Muskal, 11 hours ago)
- add Getting Started onboarding page (332411dd4, Tal Muskal, 11 hours ago)
- add transcript viewer to dispatch run detail page (7e5c0dafa, Tal Muskal, 11 hours ago)
- rewrite external provider wizard and list for typed providers (3e783b005, Tal Muskal, 12 hours ago)
- replace ExternalBackendProvider with 5 domain-scoped provider kinds (af3843f11, Tal Muskal, 12 hours ago)
- add inference playground with side-by-side model comparison (58474fad1, Tal Muskal, 13 hours ago)

### Bug Fixes
- harden remaining critical+high evil fallbacks across repo (ddf00cfb8, Tal Muskal, 5 minutes ago)
- route opencode through proxy for non-bundled providers (184bda9b0, Tal Muskal, 9 minutes ago)
- cap CLI orchestration at 20 iterations, bail on no-effects loop (ebd83c458, Tal Muskal, 11 minutes ago)
- remove mini model silent substitution, log non-zero exit tolerance (eb67d3984, Tal Muskal, 16 minutes ago)
- paginate agent runs/sessions to 25 items, aria on issue editor (722d2073c, Tal Muskal, 32 minutes ago)
- write opencode config as file, not just env var (46cdb2450, Tal Muskal, 33 minutes ago)
- fix real audit issues — 5 unauthed GETs, 8 confirm(), 5 silent catches (dc3e3e4bb, Tal Muskal, 3 hours ago)
- add GH_TOKEN, CURSOR_API_KEY, COPILOT_GITHUB_TOKEN to live-stack workflow (a9c29d5cb, Tal Muskal, 3 hours ago)
- single-task process template and 120s iterate timeout (c31b6381d, Tal Muskal, 4 hours ago)
- remove silent matrix defaults, assertion weakening, and config cascades (bace9627e, Tal Muskal, 8 hours ago)
- add metadata to 3 issue pages, error boundaries to 10 route groups (8f40b2dbb, Tal Muskal, 8 hours ago)
- remove 5 evil fallbacks that hide real problems (90df526cf, Tal Muskal, 8 hours ago)
- add diagnostic logging to 49 critical+high evil fallbacks across all packages (5758e11df, Tal Muskal, 8 hours ago)
- let hermes call Google directly, mark foundry/anthropic as blocked (4bbaed8cf, Tal Muskal, 9 hours ago)
- use OPENROUTER_API_KEY and provider: openrouter for hermes (e33d6e123, Tal Muskal, 9 hours ago)
- write hermes cli-config.yaml with proxy base_url (d8664b0e5, Tal Muskal, 10 hours ago)
- add hermes provider translations for foundry/anthropic/google (2d62fab2e, Tal Muskal, 10 hours ago)
- remove hermes custom provider config, use standard OpenAI env (0586b9b16, Tal Muskal, 10 hours ago)
- disable proxy auth for hermes (like gemini-cli) (a5cd4a554, Tal Muskal, 10 hours ago)
- log Gitea tree fallback instead of silently swallowing (70a0d6a55, Tal Muskal, 10 hours ago)
- replace staging Atlas URL with production default (d31c2dc44, Tal Muskal, 10 hours ago)
- replace silent .catch(() => {}) with console.warn logging (e9153da01, Tal Muskal, 10 hours ago)
- revert hermes launch to stdin delivery with keep-open (8de323dd6, Tal Muskal, 10 hours ago)
- adversarial audit fixes — security, errors, docs, accessibility (29c0dd327, Tal Muskal, 10 hours ago)
- pass thoughtSignatureStore to /v1/responses and WebSocket paths (c14c4500d, Tal Muskal, 11 hours ago)
- inject prompt flag in bridge-interactive for cli-flag harnesses (ece07b15f, Tal Muskal, 11 hours ago)
- write hermes proxy config to ~/.hermes/ instead of temp dir (b550e3a54, Tal Muskal, 11 hours ago)
- add auth to policy-reports, cache invalidation imports to profile (884f0c093, Tal Muskal, 11 hours ago)
- batch 3 color migration — 465 total replaced (1058→593) (d0a46db4d, Tal Muskal, 11 hours ago)
- batch 2 color migration + add 'use client' to inference-helpers (c37b7fffe, Tal Muskal, 11 hours ago)
- hermes back to -z headless mode — stdin TUI doesn't execute tasks (284871025, Tal Muskal, 11 hours ago)
- harden hook sandbox, add error boundaries, 6 adversarial tests (e6f08431c, Tal Muskal, 11 hours ago)
- replace 231 hardcoded hex colors with CSS variables (c02c0393c, Tal Muskal, 11 hours ago)
- write hermes proxy config to cli-config.yaml not config.yaml — fixes #468 (0b2aafe0d, Tal Muskal, 11 hours ago)
- use positional defineTask form in raw-session template (c29a7e82f, Tal Muskal, 11 hours ago)
- auto-correct babysitter-sdk import to @a5c-ai/babysitter-sdk (3ec8d665c, Tal Muskal, 12 hours ago)
- resolve agent prompt from both string and object formats (82c38ac84, Tal Muskal, 12 hours ago)
- post raw text as CLI orchestration task result (230eaf3af, Tal Muskal, 12 hours ago)
- instruct raw agent-core process to use fs.writeFile for file output (71300ad56, Tal Muskal, 12 hours ago)
- pin gemini-cli to 0.43.0 — 0.44.x auth regression confirmed (118589cca, Tal Muskal, 12 hours ago)
- add CJS require fallback to orchestrateIteration process loader (8d90a7178, Tal Muskal, 12 hours ago)
- fallback to CJS require when ESM import fails for process modules (52d6f49c5, Tal Muskal, 13 hours ago)
- ensure .a5c/processes has package.json type:module, use execFileSync (b0dbc67c2, Tal Muskal, 13 hours ago)
- pin gemini-cli to 0.43.0 + revert proxy env — fixes #483 (fbea9028e, Tal Muskal, 13 hours ago)
- hermes stdinBehavior keep-open + needsIdleKill — fixes #468 (8e29dd91f, Tal Muskal, 21 hours ago)
- hermes prompt via stdin instead of -z flag — fixes #468 (25cb23739, Tal Muskal, 21 hours ago)
- use execFileSync for CLI orchestration to avoid shell escaping (2e5381068, Tal Muskal, 21 hours ago)
- move hermes --output-format jsonl to unconditional block — fixes #468 (a2f7a5a9f, Tal Muskal, 21 hours ago)

### Refactors
- split settings-providers (425→259) and inference-playground (528→319) (f315b7e64, Tal Muskal, 5 minutes ago)
- split kanban-enhanced (602→264) and runner-pool-manager (434→241) (07e894410, Tal Muskal, 10 minutes ago)
- split assistant-chat.jsx (656→225 lines) into 3 modules (d1c2495bd, Tal Muskal, 16 minutes ago)
- split workspace-panel.jsx (704→219 lines) into 3 modules (765e828b8, Tal Muskal, 21 minutes ago)
- split artifact-registry.jsx (753→112 lines) into 4 modules (c0d2bdc85, Tal Muskal, 26 minutes ago)
- split 1254-line agent-pages.jsx into 11 focused modules (c970bcf16, Tal Muskal, 10 hours ago)
- extract shared phaseTone helper, remove 7 duplicates (46538b84f, Tal Muskal, 10 hours ago)
- split inference-service-manager into 7 focused files (2d86aae98, Tal Muskal, 13 hours ago)

### Documentation
- mark fixed evil fallbacks in evil-fallbacks.md (69e00ef14, Tal Muskal, 22 minutes ago)

### Maintenance
- add orchestration trace logging for omni CI diagnosis (d1bbc3916, Tal Muskal, 3 hours ago)
- regenerate dist-types and apply linter auto-fixes (4a9c8597c, Tal Muskal, 8 hours ago)
- track upstream agent versions (#545) (2f9063d8d, a5c-ai[bot], 13 hours ago)

## [Unreleased] - 2026-05-27

### feat
- 4341056a3 feat(krate-web): add unified model catalog UI and model route management (Tal Muskal, 21 hours ago)
- 856661cf5 feat(atlas): track Claude Mythos Preview (a5c automation, 21 hours ago)
- e18aedba6 feat(krate): add model route controller for Envoy AI Gateway integration (Tal Muskal, 21 hours ago)
- c37f18de0 feat(graph): track Cohere Command A+ and Embed v4 (a5c automation, 21 hours ago)
- b39c512e1 feat(atlas): track Mistral Large 3 and Medium 3.5 (a5c-ai agent, 21 hours ago)
- ca359f4a4 feat(krate): add Envoy AI Gateway dependency and KrateModelRoute CRD (Tal Muskal, 21 hours ago)
- 25ef6dd42 feat(omni): add omni agent as amux-launchable harness with live-stack support (Tal Muskal, 21 hours ago)
- b627b64c6 feat(krate-web): add For Agents documentation page with MCP setup guide (Tal Muskal, 22 hours ago)
- 80cdfa162 feat(krate): add resource contract tests and server-side validation (Tal Muskal, 22 hours ago)

### fix
- 0e4576396 fix(hermes): add --auto-approve launch config for NI file writes (Tal Muskal, 6 minutes ago)
- 2aefa94e4 fix(atlas): set omni plugin-target npmPublishable=false (Tal Muskal, 7 minutes ago)
- 735811478 fix(krate): remove broken Envoy AI Gateway Helm subchart dependency (Tal Muskal, 27 minutes ago)
- f4b8b240e fix(omni): use non-Azure proxy mode so agent-core sends Bearer auth (Tal Muskal, 20 hours ago)
- 4ab83c990 fix(omni): inject AMUX_* proxy env vars for agent-core endpoint resolution (Tal Muskal, 20 hours ago)
- 65b995a05 fix(omni): map 'omni' to 'omni yolo' in CLI_COMMAND_MAP, fix prompt delivery (Tal Muskal, 20 hours ago)
- 50815d58d fix(launch): TS errors — optional chaining on adapter, rename duplicate launchBehavior (Tal Muskal, 20 hours ago)
- ef50e66ba fix(launch): allow catalog-only harnesses (no adapter) like omni to be launched (Tal Muskal, 21 hours ago)
- 9ecb2859e fix(gemini-cli): add --yolo launch config for auto-approval in NI mode (Tal Muskal, 21 hours ago)
- 3451e5728 fix(live-stack): skip amux install for omni (already linked by CI workflow) (Tal Muskal, 21 hours ago)
- 541935650 fix(agent-platform): fix PI_PARENT_PROMPT_TIMEOUT_MS=0 causing instant abort (Tal Muskal, 21 hours ago)
- 8a704053a fix(krate): fix 4 resource schema mismatches caught by strengthened contract tests (Tal Muskal, 21 hours ago)

### refactor
- d2d6d00d5 refactor(agent-platform): extract agent-core-loop.ts from pi.ts (Tal Muskal, 21 hours ago)
- ff213e0aa refactor(agent-platform): rename PI_ timeout constants to generic agent-core names (Tal Muskal, 21 hours ago)

### docs
- cc9e2061b docs: daily changelog update (a5c automation, 21 hours ago)

### test
- No changes recorded.

### ci
- 02b2d5017 fix(ci): fix bridge-hooks tests for spawnSync, fix extension-mux sdkDefaults count (Tal Muskal, 23 minutes ago)
- 88aae424e fix(ci): update tests for timeout=900000, exclude omni from hooks adapters, fix extension-mux counts (Tal Muskal, 10 hours ago)

### chore
- 1435ff462 Audit Llama 4 405B graph record (a5c agent, 21 hours ago)
- ff41c83e7 Track DeepSeek V4 models in Atlas graph (a5c automation, 21 hours ago)
- 6dd580720 Track OpenAI GPT-5 variants for issue #356 (a5c-ai agent, 21 hours ago)
- df02a45b2 Track Qwen3 Coder model updates (a5c automation, 21 hours ago)
- b3f746f70 Add Gemini 3.5 Flash to Atlas graph (a5c-agent, 21 hours ago)
- 0c9027d7c Track Amazon Nova 2 models (a5c-ai-codex, 21 hours ago)
- 456233c95 Track xAI Grok 4.3 graph records (a5c-ai-agent, 21 hours ago)

## [Unreleased] - 2026-05-26

### feat
- ca359f4a4 feat(krate): add Envoy AI Gateway dependency and KrateModelRoute CRD (Tal Muskal, 10 minutes ago)
- 25ef6dd42 feat(omni): add omni agent as amux-launchable harness with live-stack support (Tal Muskal, 40 minutes ago)
- b627b64c6 feat(krate-web): add For Agents documentation page with MCP setup guide (Tal Muskal, 57 minutes ago)
- 80cdfa162 feat(krate): add resource contract tests and server-side validation (Tal Muskal, 63 minutes ago)
- 11e906721 feat(krate-web): add internal tools catalog API endpoint (Tal Muskal, 11 hours ago)
- b23aba63e feat(krate-web): split tools into internal/external sections, add memory repo selector (Tal Muskal, 11 hours ago)
- 2b831488d feat(agent-core): add Azure OpenAI and OPENAI_MODEL env var support (Tal Muskal, 11 hours ago)
- b6b2728f6 feat(krate): add tool categories and memory refs to AgentStack CRD (Tal Muskal, 11 hours ago)
- 8ad1a61ad feat(atlas): model omni in atlas graph — product, version, 4 layer impls, presentation (Tal Muskal, 13 hours ago)
- 2616b3e05 feat(loading): enhance loading view with circular animation and updated styles (Tal Muskal, 13 hours ago)

### fix
- 9ecb2859e fix(gemini-cli): add --yolo launch config for auto-approval in NI mode (Tal Muskal, 13 minutes ago)
- 3451e5728 fix(live-stack): skip amux install for omni (already linked by CI workflow) (Tal Muskal, 26 minutes ago)
- 541935650 fix(agent-platform): fix PI_PARENT_PROMPT_TIMEOUT_MS=0 causing instant abort (Tal Muskal, 42 minutes ago)
- 8a704053a fix(krate): fix 4 resource schema mismatches caught by strengthened contract tests (Tal Muskal, 43 minutes ago)
- 609071852 fix(bridge-hooks): resolve Windows .cmd/.sh to node+.js to avoid shell arg splitting (Tal Muskal, 5 hours ago)
- dcae62db5 fix: remove duplicate execFileSync import (Tal Muskal, 11 hours ago)
- 4e536a4b0 fix(bridge-hooks): resolve .cmd to .js on Windows to avoid shell arg splitting (Tal Muskal, 11 hours ago)
- 79f1eafa3 fix(krate-web): simplify loading page to plain spinner (Tal Muskal, 11 hours ago)
- fbed6eb64 fix(agent-core): auto-detect AZURE_OPENAI_API_KEY + AZURE_OPENAI_PROJECT_NAME (Tal Muskal, 11 hours ago)
- 97faa5145 fix(krate-web): fix header line-break and reorganize sidebar hierarchy (Tal Muskal, 12 hours ago)
- 7481423d8 fix(sdk): add --effect-id flag to CLI argument parser (#342) (Tal Muskal, 12 hours ago)
- a1f2d6662 fix(live-stack): hooks-mux CI link pointed to dist/index.js (no-op) (Tal Muskal, 12 hours ago)
- 7b0a3fa2c fix(live-stack): remove npm install -g hooks-mux-cli — shadows workspace link (Tal Muskal, 12 hours ago)
- f13934632 fix(atlas): assimilate OMP 15.3.1 graph references (a5c-agent, 12 hours ago)
- b559fb0d5 fix(amp): update CLI package metadata (a5c automation, 12 hours ago)
- 50a115882 fix(graph): assimilate opencode 1.15.10 metadata (a5c-agent, 12 hours ago)
- 799c572db fix(agent-core): fail fast with clear error when no API credentials found (Tal Muskal, 13 hours ago)
- 9544b7053 fix(live-stack): force reinstall hooks-mux-cli to avoid stale cached version (Tal Muskal, 13 hours ago)
- 35facab3c fix(agent-core): read AMUX_MODEL env var for Foundry default model (Tal Muskal, 13 hours ago)
- 0fde14c96 fix(agent-core): add diagnostic details to session errors (Tal Muskal, 13 hours ago)
- ffad3b464 fix(agent-core): add Anthropic Messages API support to agent-core session (Tal Muskal, 14 hours ago)
- fd9be11b9 fix(hooks-mux): use sync file ops in logger to prevent async flush race (Tal Muskal, 14 hours ago)
- 5f89747fc fix(bridge-hooks): always log hook invocation to stderr for CI debugging (Tal Muskal, 15 hours ago)
- 016f0b0e8 fix(live-stack): update bridge-hooks tests for hooks-mux invoke path (Tal Muskal, 15 hours ago)

### refactor
- d2d6d00d5 refactor(agent-platform): extract agent-core-loop.ts from pi.ts (Tal Muskal, 15 minutes ago)
- ff213e0aa refactor(agent-platform): rename PI_ timeout constants to generic agent-core names (Tal Muskal, 27 minutes ago)

### ci
- c1e442e06 feat(ci): add daily model version check workflow (Tal Muskal, 11 hours ago)

### chore
- 56adcc3aa chore: remove debug logging from hooks-mux logger and bridge-hooks (Tal Muskal, 4 hours ago)
- 32f49fea9 Track latest model version updates (a5c-ai bot, 11 hours ago)
- 9773c36d7 Assimilate Codex CLI 0.133.0 (a5c-ai agent, 12 hours ago)
- 12e33408b Assimilate Pi 0.75.5 (a5c Agent, 12 hours ago)
- c45488c0e Assimilate OpenAI SDK 6.39.0 metadata (a5c-ai-agent, 12 hours ago)
- 1bde9a524 Assimilate GitHub Copilot CLI 1.0.54 (a5c agent, 12 hours ago)
- a2a86329a chore(process): make publish step reproducible (a5c automation, 12 hours ago)
- e45f8ec42 chore(process): support gh pr create output (a5c automation, 12 hours ago)
- 06d49ad20 chore(atlas): record Claude Code 2.1.150 assimilation (a5c automation, 12 hours ago)
- 465f2864a Assimilate OpenClaw 2026.5.22 metadata (a5c automation, 12 hours ago)
- 79af09f60 debug(bridge-hooks): print spawnSync result details including stderr length (Tal Muskal, 12 hours ago)
- b1c099c86 Assimilate Droid 0.132.1 (a5c agent, 12 hours ago)
- 38ee186a9 chore(agent-mux): assimilate claude agent sdk 0.3.150 (a5c automation, 12 hours ago)
- 8cc2cd527 Assimilate Qwen Code 0.16.1 (a5c Codex Agent, 12 hours ago)
- 394e8f04f debug(hooks-mux): force stderr at top of appendHooksLog to verify binary + shouldLog (Tal Muskal, 13 hours ago)
- d9e748b51 debug(hooks-mux): force stderr output to verify binary version in CI (Tal Muskal, 13 hours ago)
- 3695338e0 debug(bridge-hooks): use spawnSync to capture and forward child stderr for #340 (Tal Muskal, 13 hours ago)
- e6d41de8d debug(hooks-mux): log write failures to stderr for #340 diagnosis (Tal Muskal, 14 hours ago)
- 608f4207b debug(live-stack): log hooks-mux search paths and results for #340 (Tal Muskal, 14 hours ago)

## [Unreleased] - 2026-05-25

### feat
- 85bf9b9b2 feat(krate-web): add stack inline editor, fix RBAC deletion cleanup (Tal Muskal, 6 hours ago)

### fix
- af82b2659 fix(krate-web): add cache invalidation to repository, dispatch, and conflict routes (Tal Muskal, 4 hours ago)
- a6661b3b8 fix(live-stack): update stale test assertions for prompt text and create-mode cleanup (Tal Muskal, 6 hours ago)
- 82b214fdd fix(krate-web): fix broken CRUD actions, API paths, and missing endpoints across console (Tal Muskal, 6 hours ago)
- 09a5cc834 fix(live-stack): hooks-mux optional in interactive mode, not just bridged-hooks (Tal Muskal, 6 hours ago)
- 98adc381c fix(live-stack): cross-platform BP fixture setup (bash→node) (Tal Muskal, 6 hours ago)
- aeb77e1b9 fix(live-stack): macOS BI child_process fallback + Windows BP npm spawn (Tal Muskal, 6 hours ago)
- 8994fb43a fix: gemini-cli prompt + macOS BI stdout capture + BP resume command (Tal Muskal, 7 hours ago)
- 07d877d5a fix(transport-mux): whitelist root path / for proxy auth (health checks) (Tal Muskal, 9 hours ago)
- f888f721b fix(launch): add PTY skip + child_process fallback to bridge-interactive path (#308) (Tal Muskal, 10 hours ago)
- b4e0d9f87 fix(launch): BI fallback uses pipe stdio (matching NI) + debug logging (Tal Muskal, 11 hours ago)
- 6ab464ce4 fix(launch): use resolveSpawnCommand in BI fallback path (Tal Muskal, 12 hours ago)
- 7495ef6c9 fix(transport-mux): update google streaming test to expect text/event-stream (Tal Muskal, 12 hours ago)
- 7cd802acc fix: three live-stack fixes — macOS BI skip, hooks trust pattern, gemini SSE (Tal Muskal, 12 hours ago)
- 04ca6ab00 fix(sdk): update fallback metadata contract test for LOCAL_FALLBACK merge (Tal Muskal, 23 hours ago)
- b0a5280e9 fix(launch-mux): auto-trust codex hooks in bridged-interactive mode (#309) (Tal Muskal, 24 hours ago)
- f4f6eba7b fix(launch-mux): robust PTY fallback for macOS ARM64 posix_spawnp failures (#308) (Tal Muskal, 24 hours ago)

### test
- 162419dd9 fix(test): use /babysitter:resume for BP resume mode (#312) (Tal Muskal, 9 hours ago)
- c7c9387a8 fix(test): only require hooks-mux logs in bridged-hooks mode, not interactive (Tal Muskal, 24 hours ago)

### ci
- 732ae0718 fix(ci): fix tool-mux/launch-mux build order in publish-packages-from-tag (Tal Muskal, 6 hours ago)
- 0acb12b0c fix(ci): add push trigger to live-stack-published for GitHub workflow discovery (Tal Muskal, 12 hours ago)
- 7068be42b fix(ci): add hooks-mux-adapter-hermes and krate to version bump paths (Tal Muskal, 12 hours ago)
- 690771e15 fix(ci): add agent-config-mux, agent-launch-mux, tool-mux to publish pipeline (Tal Muskal, 12 hours ago)
- f3231e185 feat(ci): add live-stack-published workflow — tests with npm packages only (Tal Muskal, 12 hours ago)
- 6f65d1699 fix(ci): add agent-runtime, omni, tool-mux to publish pipeline and version bumps (Tal Muskal, 24 hours ago)

### chore
- e4a494a26 chore: trigger workflow discovery for live-stack-published (Tal Muskal, 12 hours ago)
- 75193c134 redesign(krate-web): modern dark-first Terminal Craft design system (Tal Muskal, 12 hours ago)
- a4cc57b13 Move CLI implementation into omni (Tal Muskal, 12 hours ago)
- 0ca99c5d8 Revert "fix(test): only require hooks-mux logs in bridged-hooks mode, not interactive" (Tal Muskal, 24 hours ago)

## [Unreleased] - 2026-05-22

### feat
- 3b7851ee5 feat(agent-runtime): move daemon, session, cost, observability from babysitter-agent (#210) (Tal Muskal, 18 minutes ago)
- 108ffeb16 feat(ci): add daily agent version check pipeline (Tal Muskal, 32 minutes ago)
- 2ae6e96d4 feat(agent-runtime): scaffold agent-runtime package (L5) and move runtime files from agent-core (#210) (Tal Muskal, 41 minutes ago)
- d0d0968a5 feat(graph): add launchBehavior to PluginTarget, drive launch.ts from graph (Tal Muskal, 3 hours ago)
- c44ac9b52 feat(ci): add fix-broken-latest-tags script and workflow (Tal Muskal, 15 hours ago)
- 30895c64c feat: v6.1 graph alignment babysitter process definition (Tal Muskal, 24 hours ago)

### fix
- a7fd1e1c8 fix(workflow): update GitHub token generation and checkout action version (Tal Muskal, 14 minutes ago)
- d0934222a fix(video): update vulnerable fast-uri lock entry (Tal Muskal, 16 minutes ago)
- 949d9609b fix(ci): agent version check discovers agents from atlas graph at runtime (Tal Muskal, 29 minutes ago)
- 24e50bb6c fix(ci): add a5c GitHub App token to all trigger-based workflows (Tal Muskal, 49 minutes ago)
- eb8c0c551 fix(transport-mux): add stream error handling, fix Pi proxy API type (Tal Muskal, 50 minutes ago)
- 73b53ae76 fix(amux): restore Pi --mode json, resolve Windows spawn without shell (Tal Muskal, 80 minutes ago)
- 4edff3e2e fix(amux): deliver prompts via stdin on Windows to avoid cmd.exe mangling (Tal Muskal, 2 hours ago)
- f09793644 fix(live-stack): use platform-native mkdir instead of node -e on Windows (Tal Muskal, 2 hours ago)
- ae29cffaf fix(graph): Pi uses -p flag for prompt delivery, not stdin (Tal Muskal, 2 hours ago)
- fa900f15b fix(test): update launch tests for graph-driven launchBehavior (Tal Muskal, 3 hours ago)
- 39422c79d fix(amux): let Pi run in interactive mode for tool-use support (Tal Muskal, 4 hours ago)
- a64b877f0 fix(ci): align download-artifact version with upload, add debug listing (Tal Muskal, 4 hours ago)
- f73d12684 fix(amux): don't duplicate prompt via stdin when already passed as CLI arg (Tal Muskal, 5 hours ago)
- 0cf58b544 fix(ci): conditionally use --force-local tar flag (Windows only) (Tal Muskal, 14 hours ago)
- a2e883985 fix(ci): rename breakpoints-mux → tasks-mux in all workflows (Tal Muskal, 15 hours ago)
- c231e9e09 fix(npm): also flag plugin 5.0.0 as bad publish batch (Tal Muskal, 15 hours ago)
- 5294f1f23 fix(npm): validate plugin sdkVersion references actual published SDK (Tal Muskal, 15 hours ago)
- 60d7727cf fix(npm): add SDK install fallback and fix staging-on-latest detection (Tal Muskal, 15 hours ago)
- 9abaa9513 fix(ci): run publish install steps explicitly (Tal Muskal, 20 hours ago)
- c2c0dbae4 fix(ci): remove publish skip gates (Tal Muskal, 20 hours ago)
- 28347f861 fix(transport-mux): terminate responses SSE streams (Tal Muskal, 21 hours ago)
- 8737c45a8 fix(live-stack): remove output bridge fallback (Tal Muskal, 21 hours ago)
- 7cb50207f fix(ci): align workflows with extension mux rename (Tal Muskal, 21 hours ago)
- b0bc4c35e fix(live-stack): build extension mux workspace (Tal Muskal, 21 hours ago)
- 6f865e961 fix(live-stack): remove skip fallbacks (Tal Muskal, 21 hours ago)
- 15b26de69 fix(live-stack): remove live fallback skips (Tal Muskal, 22 hours ago)
- d60ea34a8 fix(live-stack): fail live evidence gaps (Tal Muskal, 22 hours ago)
- 42336868f fix(live-stack): reset create-mode process scope (Tal Muskal, 22 hours ago)
- 142e76f60 fix(agent-plan-dispatch): update process execution command in comments (Tal Muskal, 23 hours ago)
- d6938a962 fix(live-stack): summarize skipped live-agent lanes (Tal Muskal, 23 hours ago)
- 59f3a98d0 fix(live-stack): allow agent-unavailable coverage skips (Tal Muskal, 23 hours ago)
- 235879270 fix(live-stack): skip invalid bridged transcripts (Tal Muskal, 23 hours ago)
- 11987bc84 fix(live-stack): classify bridged transcript artifacts (Tal Muskal, 23 hours ago)
- 3f3d6fccf fix(live-stack): skip login and empty tool-use transcripts (Tal Muskal, 24 hours ago)

### refactor
- fd222f1ce refactor: rename breakpoints-mux → tasks-mux (Tal Muskal, 22 hours ago)
- 6fa60bb7e refactor: rename agent-plugins-mux → extension-mux (Tal Muskal, 22 hours ago)

### docs
- ace734b12 docs: remove duplicate daily changelog section (github-actions[bot], 14 hours ago)
- cb12a39a0 docs: daily changelog update (github-actions[bot], 14 hours ago)
- 71e2ebb95 docs(reference): add Pattern 8 — page.setContent stub for playwright structural specs (rogelsm, 17 hours ago)
- 9e0ad1f88 docs: v6.1 agent layer capabilities — what core/runtime/platform should do (Tal Muskal, 23 hours ago)
- 5183b3caf docs: v6.1 agent stack decomposition — babysitter-agent, agent-core, SDK (Tal Muskal, 24 hours ago)
- 909da7cf4 docs: v6.1 graph alignment task list — 66 tasks across 5 phases (Tal Muskal, 24 hours ago)

### chore
- 49e3946a2 Fix staging code scanning findings (Tal Muskal, 49 minutes ago)
- b1a6542a2 chore: set sdkVersion to 5.0.1-staging.28347f861706 [skip publish] (github-actions[bot], 20 hours ago)
- 46733254c chore: set sdkVersion to 5.0.1-staging.8737c45a8424 [skip publish] (github-actions[bot], 21 hours ago)
- e5bf90164 chore: set sdkVersion to 5.0.1-staging.7cb50207f287 [skip publish] (github-actions[bot], 21 hours ago)
- 9d9d98838 chore: set sdkVersion to 5.0.1-staging.132f1714ba54 [skip publish] (github-actions[bot], 22 hours ago)
- d4435ef57 Complete transport-mux codec architecture (a5c agent, 22 hours ago)
- 132f1714b chore: remove v6.1 process file — work tracked via GitHub issues (Tal Muskal, 22 hours ago)
- bfe9083b0 chore: set sdkVersion to 5.0.1-staging.59f3a98d09ae [skip publish] (github-actions[bot], 23 hours ago)
- 6d25bb238 chore: set sdkVersion to 5.0.1-staging.5183b3caf612 [skip publish] (github-actions[bot], 23 hours ago)
- 1a6fde4ae chore: set sdkVersion to 5.0.1-staging.c1fec6cebbe7 [skip publish] (github-actions[bot], 24 hours ago)

## [Unreleased] - 2026-05-21

### feat
- c44ac9b52 feat(ci): add fix-broken-latest-tags script and workflow (Tal Muskal, 56 minutes ago)
- 30895c64c feat: v6.1 graph alignment babysitter process definition (Tal Muskal, 9 hours ago)
- e3ace9f1b feat(mcp): add initial MCP server configuration for atlas (Tal Muskal, 11 hours ago)
- e920fef11 feat(live-stack): add OS to job names and report tables (Tal Muskal, 13 hours ago)

### fix
- a2e883985 fix(ci): rename breakpoints-mux → tasks-mux in all workflows (Tal Muskal, 9 minutes ago)
- c231e9e09 fix(npm): also flag plugin 5.0.0 as bad publish batch (Tal Muskal, 18 minutes ago)
- 5294f1f23 fix(npm): validate plugin sdkVersion references actual published SDK (Tal Muskal, 24 minutes ago)
- 60d7727cf fix(npm): add SDK install fallback and fix staging-on-latest detection (Tal Muskal, 35 minutes ago)
- 9abaa9513 fix(ci): run publish install steps explicitly (Tal Muskal, 6 hours ago)
- c2c0dbae4 fix(ci): remove publish skip gates (Tal Muskal, 6 hours ago)
- 28347f861 fix(transport-mux): terminate responses SSE streams (Tal Muskal, 6 hours ago)
- 8737c45a8 fix(live-stack): remove output bridge fallback (Tal Muskal, 6 hours ago)
- 7cb50207f fix(ci): align workflows with extension mux rename (Tal Muskal, 7 hours ago)
- b0bc4c35e fix(live-stack): build extension mux workspace (Tal Muskal, 7 hours ago)
- 6f865e961 fix(live-stack): remove skip fallbacks (Tal Muskal, 7 hours ago)
- 15b26de69 fix(live-stack): remove live fallback skips (Tal Muskal, 7 hours ago)
- d60ea34a8 fix(live-stack): fail live evidence gaps (Tal Muskal, 8 hours ago)
- 42336868f fix(live-stack): reset create-mode process scope (Tal Muskal, 8 hours ago)
- 142e76f60 fix(agent-plan-dispatch): update process execution command in comments (Tal Muskal, 8 hours ago)
- d6938a962 fix(live-stack): summarize skipped live-agent lanes (Tal Muskal, 8 hours ago)
- 59f3a98d0 fix(live-stack): allow agent-unavailable coverage skips (Tal Muskal, 8 hours ago)
- 235879270 fix(live-stack): skip invalid bridged transcripts (Tal Muskal, 9 hours ago)
- 11987bc84 fix(live-stack): classify bridged transcript artifacts (Tal Muskal, 9 hours ago)
- 3f3d6fccf fix(live-stack): skip login and empty tool-use transcripts (Tal Muskal, 9 hours ago)
- c1fec6ceb fix(live-stack): classify transient live agent failures (Tal Muskal, 10 hours ago)
- 5db31fee5 fix(live-stack): remove reference process in create mode setup (Tal Muskal, 12 hours ago)
- 416aa66e5 fix(live-stack): stricter create mode — no reference process, clearer prompt (Tal Muskal, 12 hours ago)
- 63253deb1 fix(agent-mux): use shell on Windows for npm install commands (Tal Muskal, 13 hours ago)
- 297873662 fix(live-stack): push defaults use create only (no predefined), add pi+kimi to BP (Tal Muskal, 13 hours ago)
- 945f4649b fix(live-stack): replace resume with create in push defaults (Tal Muskal, 13 hours ago)
- 31ea47fdc fix(live-stack): report falls back to JSON artifact when no markdown report (Tal Muskal, 13 hours ago)
- 05d599a10 fix(live-stack): set LIVE_STACK_BRIDGE_HOOKS=true in interactive fallback (Tal Muskal, 14 hours ago)
- 659b2a4c3 fix(ci): add push trigger to qa-daily for workflow discovery (Tal Muskal, 14 hours ago)
- 22c3fc507 fix(ci): add --force-local to tar for Windows drive letter paths (Tal Muskal, 19 hours ago)

### refactor
- fd222f1ce refactor: rename breakpoints-mux → tasks-mux (Tal Muskal, 7 hours ago)
- 6fa60bb7e refactor: rename agent-plugins-mux → extension-mux (Tal Muskal, 7 hours ago)

### docs
- 9e0ad1f88 docs: v6.1 agent layer capabilities — what core/runtime/platform should do (Tal Muskal, 8 hours ago)
- 5183b3caf docs: v6.1 agent stack decomposition — agent-platform, agent-core, SDK (Tal Muskal, 9 hours ago)
- 909da7cf4 docs: v6.1 graph alignment task list — 66 tasks across 5 phases (Tal Muskal, 9 hours ago)
- 3070405aa docs: v6.1 mux architecture deep dive — 9 canonical muxes vs packages (Tal Muskal, 10 hours ago)
- 8170b0775 docs: v6.1 spec — layer-to-package gap analysis (Tal Muskal, 11 hours ago)
- effad49e6 docs: daily changelog update (github-actions[bot], 14 hours ago)

### chore
- b1a6542a2 chore: set sdkVersion to 5.0.1-staging.28347f861706 [skip publish] (github-actions[bot], 6 hours ago)
- 46733254c chore: set sdkVersion to 5.0.1-staging.8737c45a8424 [skip publish] (github-actions[bot], 6 hours ago)
- e5bf90164 chore: set sdkVersion to 5.0.1-staging.7cb50207f287 [skip publish] (github-actions[bot], 6 hours ago)
- 9d9d98838 chore: set sdkVersion to 5.0.1-staging.132f1714ba54 [skip publish] (github-actions[bot], 7 hours ago)
- d4435ef57 Complete transport-mux codec architecture (a5c agent, 7 hours ago)
- 132f1714b chore: remove v6.1 process file — work tracked via GitHub issues (Tal Muskal, 8 hours ago)
- bfe9083b0 chore: set sdkVersion to 5.0.1-staging.59f3a98d09ae [skip publish] (github-actions[bot], 8 hours ago)
- 6d25bb238 chore: set sdkVersion to 5.0.1-staging.5183b3caf612 [skip publish] (github-actions[bot], 9 hours ago)
- 1a6fde4ae chore: set sdkVersion to 5.0.1-staging.c1fec6cebbe7 [skip publish] (github-actions[bot], 9 hours ago)
- 544743aee chore: set sdkVersion to 5.0.1-staging.8170b077568f [skip publish] (github-actions[bot], 11 hours ago)
- 26db07fcd chore: set sdkVersion to 5.0.1-staging.5db31fee5f41 [skip publish] (github-actions[bot], 12 hours ago)
- 144e41f5b chore: set sdkVersion to 5.0.1-staging.e920fef118ef [skip publish] (github-actions[bot], 12 hours ago)
- c6c2eff27 chore: set sdkVersion to 5.0.1-staging.945f4649b501 [skip publish] (github-actions[bot], 13 hours ago)
- 3c004881b chore: set sdkVersion to 5.0.1-staging.659b2a4c3b27 [skip publish] (github-actions[bot], 14 hours ago)
- d3bea7003 chore: set sdkVersion to 5.0.1-staging.22c3fc50735d [skip publish] (github-actions[bot], 19 hours ago)

## [Unreleased]

- No unreleased changes.


## [5.0.0] - 2026-04-18
- No notable changes.



### Fixed
- Restored the automatic stop-hook drive of `babysitter run:iterate` inside Claude Code and GitHub Copilot sessions. Two regressions had broken the chain: (a) `setBabysitterSessionIdInEnvFile` (and its Copilot twin) rewrote `CLAUDE_ENV_FILE`/`COPILOT_ENV_FILE` via `writeFileSync(tmp)+renameSync`, breaking the harness env-sourcing contract that relies on append-only writes to a stable inode; (b) the session-start PID-marker writer emitted `current-session-pid-<pid>` while the reader expected the slugged `current-session-claude-code-pid-<pid>`, causing the marker rail to always miss. The writer now goes through `getSessionMarkerPath()` so writer and reader agree, and the env-file helpers are append-only. The resolver's last-match regex already tolerates accumulated exports from repeated session rotation, so append-only is safe.
- Inverted session-ID resolution precedence across all harness adapters to prefer the PID-scoped session marker (authoritative, tied to live ancestor Claude Code PID) over the inheritable `BABYSITTER_SESSION_ID` env var, which previously caused cross-session bleed when a parent shell had a stale export.
- Env-file stale-line hazard: resolver uses last-match regex, tolerating the multiple `export BABYSITTER_SESSION_ID=...` lines that accumulate as `CLAUDE_ENV_FILE` is appended to across session rotation (/clear, re-init).
- Replaced legacy `wmic` with a PowerShell `Get-CimInstance` fallback cascade for Windows 11 24H2+, where `wmic` has been removed from the base image.
- Added `session:whoami` and `session:cleanup` commands, plus four new `/babysitter:doctor` checks covering session-binding provenance and liveness.
- Added `BABYSITTER_TRUST_ENV_SESSION=1` escape hatch to retain legacy env-first precedence for CI workflows that deliberately export `BABYSITTER_SESSION_ID`.
- Closes #130; related to previously-fixed #100, #107, #75.


## [0.0.187] - 2026-04-04
- No notable changes.



- No unreleased changes.


## [0.0.186] - 2026-04-04
- No notable changes.



- No unreleased changes.


## [0.0.185] - 2026-04-04
- No notable changes.



- No unreleased changes.


## [0.0.184] - 2026-04-03
- No notable changes.



- No unreleased changes.


## [0.0.183] - 2026-03-30
- No notable changes.



- No unreleased changes.


## [0.0.182] - 2026-03-15
- No notable changes.



- No unreleased changes.


## [0.0.181] - 2026-03-15
- No notable changes.



- No unreleased changes.


## [0.0.180] - 2026-03-10
- No notable changes.



- No unreleased changes.


## [0.0.179] - 2026-03-07
- No notable changes.



- No unreleased changes.


## [0.0.178] - 2026-03-07
- No notable changes.



- No unreleased changes.


## [0.0.177] - 2026-03-06
- No notable changes.



- No unreleased changes.


## [0.0.176] - 2026-03-06
- No notable changes.



- No unreleased changes.


## [0.0.175] - 2026-03-04
- No notable changes.



- No unreleased changes.


## [0.0.174] - 2026-03-04
- No notable changes.



- No unreleased changes.


## [0.0.173] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.172] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.171] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.170] - 2026-03-03
- No notable changes.



- No unreleased changes.


## [0.0.169] - 2026-02-19
- No notable changes.



- No unreleased changes.


## [0.0.168] - 2026-02-16
- No notable changes.



- No unreleased changes.


## [0.0.167] - 2026-02-16
- No notable changes.



- No unreleased changes.


## [0.0.166] - 2026-02-12
- No notable changes.



- No unreleased changes.


## [0.0.165] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.164] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.163] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.162] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.161] - 2026-02-10
- No notable changes.



- No unreleased changes.


## [0.0.160] - 2026-02-08
- No notable changes.



- No unreleased changes.


## [0.0.159] - 2026-02-08
- No notable changes.



- No unreleased changes.


## [0.0.158] - 2026-02-02
- No notable changes.



- No unreleased changes.


## [0.0.157] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.156] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.155] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.154] - 2026-01-31
- No notable changes.



- No unreleased changes.


## [0.0.153] - 2026-01-30
- No notable changes.



- No unreleased changes.


## [0.0.152] - 2026-01-30
- No notable changes.



- No unreleased changes.


## [0.0.151] - 2026-01-30
- No notable changes.



- No unreleased changes.


## [0.0.150] - 2026-01-28
- No notable changes.



- No unreleased changes.


## [0.0.149] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.148] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.147] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.146] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.145] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.144] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.143] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.142] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.141] - 2026-01-27
- No notable changes.



- No unreleased changes.


## [0.0.140] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.139] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.138] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.137] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.136] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.135] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.134] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.133] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.132] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.131] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.130] - 2026-01-26
- No notable changes.



- No unreleased changes.


## [0.0.129] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.128] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.127] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.126] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.125] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.124] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.123] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.122] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.121] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.120] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.119] - 2026-01-25
- No notable changes.



- No unreleased changes.


## [0.0.118] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.117] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.116] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.115] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.114] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.113] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.112] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.111] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.110] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.109] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.108] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.107] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.106] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.105] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.104] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.103] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.102] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.101] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.100] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.99] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.98] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.97] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.96] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.95] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.94] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.93] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.92] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.91] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.90] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.89] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.88] - 2026-01-24
- No notable changes.



- No unreleased changes.


## [0.0.87] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.86] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.85] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.84] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.83] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.82] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.81] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.80] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.79] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.78] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.77] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.76] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.75] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.74] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.73] - 2026-01-23
- No notable changes.



- No unreleased changes.


## [0.0.72] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.71] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.70] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.69] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.68] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.67] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.66] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.65] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.64] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.63] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.62] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.61] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.60] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.59] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.58] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.57] - 2026-01-22
- No notable changes.



- No unreleased changes.


## [0.0.56] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.55] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.54] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.53] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.52] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.51] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.50] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.49] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.48] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.47] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.46] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.45] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.44] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.43] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.42] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.41] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.40] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.39] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.38] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.37] - 2026-01-21
- No notable changes.



- No unreleased changes.


## [0.0.36] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.35] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.34] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.33] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.32] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [0.0.31] - 2026-01-20
- No notable changes.



- No unreleased changes.


## [Unreleased]

- No unreleased changes.


## [0.0.170] - 2026-03-02

Major release featuring a complete hook system overhaul, Docker-based deployment, harness adapter architecture for agent-agnostic compatibility, a growing process library with methodology assimilation, and many new slash commands.

Thank you for the active contributions and support: @YoavMayer , @MaTriXy , @guyelia , @Eyaldavid7 , @giladw , @yosit , @lorg , @davidt99 , @OriAshkenazi , @hexelon and others!

### Added

#### Slash Commands
- `/babysitter:doctor` — Run diagnostics
- `/babysitter:observe` — Observer dashboard for real-time process monitoring and management
- `/babysitter:yolo` — No breakpoint, fully autonomous execution mode
- `/babysitter:resume` — Resume interrupted or paused runs
- `/babysitter:help` — Usage guides for all babysitter commands and workflows, processes, skills, agents, and methodologies
- `/babysitter:plan` — Structured planning workflows
- `/babysitter:forever` — Long-running orchestration sessions
- `/babysitter:assimilate` — Convert external AI coding methodologies into babysitter process definitions, or integrate specific AI harness with the babysitter SDK (e.g. codex, opencode, antigravity)
- `/babysitter:call` — Invoke babysitter orchestration directly
- `/babysitter:project-install` and `/babysitter:user-install` — Setup and customize babysitter at project or user level

#### Core Features
- **Profiles SDK module** with CLI commands for managing user and project profiles
- **Process-driven skill and agent discovery** using JSDoc markers for better extensibility
- **Harness adapter architecture** for agent-agnostic session binding (fixes #7)
  - Claude-specific code centralized into harness adapter module
  - Auto-detection of harness environment when binding sessions
  - `--harness` flag on `run:create` for adapter selection
  - Foundation for supporting non-Claude hosts (Codex, OpenCode, etc.)
- **Session transcript capture and verification** for full orchestration lifecycle tracking
  - Structural transcript parsing for reliable stop hook verification
- **Initial prompt now persisted** in `run.json` and `RUN_CREATED` events (fixes #8)

#### Process Library
- **Methodology assimilation workflow** for converting external AI coding processes into babysitter process definitions
- **Harness integration process** — process definition for adapting the SDK to non-Claude environments
- **Codebase security audit process** for systematic security compliance scanning
- **GSD (Get Stuff Done) processes** properly converted to babysitter process definitions
- **Assimilated external methodologies**:
  - BMAD Method (bmad-code-org/BMAD-METHOD)
  - Superpowers Extended (pcvelz/superpowers)
  - Gas Town (steveyegge/gastown)
  - RPIKit (bostonaholic/rpikit)
  - CC10X (romiluz13/cc10x)
  - Metaswarm (dsifry/metaswarm)
  - and many more

#### Infrastructure
- **Docker support** as primary deployment method with comprehensive E2E testing
- **Staging publish workflow** for better release management
- **Breakpoints service and legacy editor extension surfaces completely removed** from the system
- **Completion secret renamed to completion proof** throughout the API for clearer semantics

### Fixed

#### Hook System
- **Hook invocation mechanism changed** from shell scripts to SDK CLI `hook:run` command for better reliability and maintainability
- **Stop hook** no longer bails on empty prompts when run is bound to a session
- **Stop hook** now uses `last_assistant_message` fallback for better reliability
- **Stop hook skill context** improved by excluding babysit, capping at 10, showing full paths
- **Stop hook** preserves session file when run state is unknown instead of deleting it, allowing recovery
- **Stop hook** fallback run directory search for nested `.a5c/.a5c/runs/` paths created by babysit skill
- **Session-start hook** creates baseline state file proactively
- **Session-start hook** prevents hanging by ensuring clean stdin EOF handling
- **Session-start hook** installs babysitter CLI from correct SDK version

#### Breakpoints
- **Breakpoint response validation for interactive mode** — `AskUserQuestion` responses are now validated; empty or dismissed responses are no longer silently treated as approval (fixes #19)

#### State Management
- **State cache** rebuilt after terminal events ensuring data consistency

#### CLI & Build
- **CLI exit codes** properly propagated via `process.exitCode`
- **Plugin version** derived dynamically instead of being hardcoded
- **Build system fixes** including rollup workarounds and npm optional dependencies
- **Deprecated transitive dependencies** updated — resolved npm audit warnings for glob, tar, rimraf, inflight, npmlog, etc. (fixes #10)

#### Discovery & Execution
- **Discovery bloat** removed from `run:iterate` with compacted `run:create` output
- **Irrelevant specialization skills** excluded from discovery with capped summary length
- **Harness CLI flag** respected for adapter selection in `run:create`
- **Run directory resolution** improved with doubled `.a5c` path collapsing
- **Shared `resolveInputPath` utility** prevents double-nested `.a5c/runs` paths
- **Runaway loop detection threshold** increased from 3 to 10 consecutive fast iterations to reduce false positives

#### E2E & Testing
- **Session transcript format handling** fixed for real Claude Code output
- **Stop hook verification tests** made resilient to non-interactive (`-p`) mode
- **E2E orchestration tests** handle nested run directory paths with recursive search and post-run consolidation
- **E2E journal verification** allows `STOP_HOOK_INVOKED` events after `RUN_COMPLETED`
- **E2E credential handling** fixed for Azure Foundry and multiple API key formats

### Improved

#### Architecture
- **Hook system refactored** from shell scripts to SDK CLI `hook:run` command
- **Session binding** auto-configures when harness and session-id are provided
- **Discovery expanded** to agents and processes for broader capability coverage

#### Observability
- **Comprehensive diagnostic logging** throughout stop hook execution paths
- **Doctor command enhanced** with hook execution health diagnostics
- **Run verification** more resilient with better error handling and diagnostics

#### Documentation
- **Command files rewritten** with improved structure and closed process gaps
- **Assimilation documentation** for converting external methodologies and harnesses
- **Orchestration loop rules** and common mistakes clarified in SKILL.md
- **Research and plan output** improved readability (fixes #9)
- **E2E test coverage** significantly expanded for hooks, profiles, and orchestration

---


### Added
- Explorer context command `Babysitter: Dispatch Run from Task File` that trims `.task.md` content and invokes the standard dispatch flow.
- Continuous release pipeline (`.github/workflows/release.yml`) with pinned actions, checksum-protected VSIX artifacts, helper scripts for semantic versioning/release notes, and a documented rollback script (`scripts/rollback-release.sh` + `docs/release-pipeline.md`).

## [0.0.3] - 2026-01-05

### Added

- Initial packaged editor observer surface with run discovery, monitoring, UI views, and `o` integration scaffolding.
