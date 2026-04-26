---
title: Additional Reference Projects
process: find-more-references
date: 2026-04-12
target: a5c-ai/agent-mux
filter: ">100 stars OR commits in last 6 months"
count: 17
---

# Additional Reference Projects

> Archived comparison document. Preserved for historical context; not part of the current normative `reference/` contract.

Extension of `16-reference-comparison.md`. Candidates surfaced via WebSearch on 2026-04-12 across four categories:

1. Monitoring/orchestration CLIs wrapping coding-agent CLIs
2. UI wrappers over agent harnesses
3. Multi-harness SDKs/runners
4. Session/token analytics

## Candidates

| # | Name | URL | Stars (approx) | Language | Category | Agents supported | Relevance to agent-mux |
|---|---|---|---|---|---|---|---|
| 1 | cctop | https://github.com/st0012/cctop | ~1k | Swift | Monitoring | claude-code, opencode | Menubar switcher between sessions — UX pattern for our `sessions` surface. |
| 2 | ccmonitor | https://github.com/shinagaki/ccmonitor | ~500 | TS/Node | Monitoring | claude-code | 5-hour rolling window reporting we don't model in `CostRecord`. |
| 3 | cc-monitor-rs | https://github.com/ZhangHanDong/cc-monitor-rs | ~300 | Rust (Makepad) | Monitoring | claude-code | Native real-time UI consuming JSONL — validates our event stream shape. |
| 4 | Claude-Code-Usage-Monitor | https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor | ~6k | Python | Analytics | claude-code | ML-based burn-rate prediction — gap in agent-mux. |
| 5 | ccboard | https://github.com/FlorianBruniaux/ccboard | ~400 | Rust | Monitoring + Dashboard | claude-code | Unifies sessions, costs, hooks, agents, MCP in one binary — mirrors our CLI surface. |
| 6 | cc-viewer | https://github.com/weiesky/cc-viewer | ~200 | TS | Monitoring | claude-code | Live request/response capture for debugging — could inspire a `--trace` mode. |
| 7 | claude-code-monitor (zcquant) | https://github.com/zcquant/claude-code-monitor | ~150 | TS | Analytics | claude-code | OpenTelemetry OTLP dashboard — telemetry export gap. |
| 8 | ccusage | https://github.com/ryoppippi/ccusage | ~20k | TS | Analytics | claude, codex, opencode, pi, amp | JSONL session reader family — already tracked; listed for completeness. |
| 9 | claude-usage (phuryn) | https://github.com/phuryn/claude-usage | ~200 | TS | Analytics | claude-code | Pro/Max subscription progress-bar UX. |
| 10 | vibe-kanban | https://github.com/BloopAI/vibe-kanban | ~15k | Rust | UI wrapper | claude, copilot, cursor, codex, gemini, qwen, droid, opencode, amp, ccr | Kanban + per-agent worktree — gap: we lack a default UI. |
| 11 | paperclip | https://github.com/paperclipai/paperclip | ~30k | TS/React | SDK + UI | claude, codex, cursor, openclaw, pi, bash, http | Already tracked; closest structural peer. |
| 12 | claude-squad | https://github.com/smtg-ai/claude-squad | ~7k | Go | Terminal orchestrator | claude, codex, gemini, aider, opencode, amp | tmux-based parallel workspaces with yolo mode — gap. |
| 13 | aider | https://github.com/Aider-AI/aider | ~42k | Python | Agent harness | multi-LLM (Claude, o1, DeepSeek, local) | Tree-sitter repo map + architect mode — we don't ship these. |
| 14 | continue | https://github.com/continuedev/continue | ~26k | TS | IDE wrapper | any (Claude, GPT, local, Mistral) | VS Code/JetBrains integration — agent-mux has no IDE surface. |
| 15 | goose (block) | https://github.com/block/goose | ~29k | Rust | Agent framework | 15+ providers via MCP | 3000+ MCP tools + recipes — our MCP manager is narrower. |
| 17 | OpenHarness (HKUDS) | https://github.com/HKUDS/OpenHarness | ~400 | Python | Harness | Claude, OpenAI, Copilot, Codex, Kimi, GLM, MiniMax | Academic harness with pluggable endpoints — reference for capability surface. |

## Cross-reference: features agent-mux lacks

| Feature | Covered by | Priority |
|---|---|---|
| Burn-rate / limit prediction (5-hour rolling) | Claude-Code-Usage-Monitor, ccmonitor | High — pairs with existing `CostRecord`. |
| OpenTelemetry / OTLP export | claude-code-monitor (zcquant), ccboard | Medium — we have events but no OTLP exporter. |
| Built-in Kanban / task UI | vibe-kanban, paperclip | Medium — scope decision (SDK-first vs UI-first). |
| Tree-sitter repo map / architect planning | aider | Medium — out of scope for pure harness, but useful as plugin. |
| IDE extension (VS Code / JetBrains) | continue | Low — different shape of product. |
| MCP recipe library (3000+ tools) | goose | Medium — we ship MCP lifecycle but no curated catalog. |
| Live request/response trace viewer | cc-viewer | Low — debugging aid. |
| Menubar / system tray switcher | cctop | Low — presentation layer only. |
| Qwen / droid / amp adapters | vibe-kanban, ccusage, claude-squad | Medium — already noted in `16-reference-comparison.md`. |

## Net assessment

Adding these 17 projects to the survey in `16-reference-comparison.md` does not change the top-line conclusion: **agent-mux remains a structural superset on the SDK surface**. However three previously-unflagged gaps emerge:

1. **Predictive burn-rate analytics** (Claude-Code-Usage-Monitor) — additive to `CostRecord`.
2. **OTLP telemetry exporter** (zcquant, ccboard) — natural plugin.
3. **MCP recipe catalog** (goose) — complements our MCP lifecycle manager.

The UI-shaped projects (vibe-kanban, paperclip, continue) remain orthogonal: agent-mux is an SDK, not a UI, and should stay that way per scope doc.
