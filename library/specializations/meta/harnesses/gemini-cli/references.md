# Gemini CLI Harness -- References

All reference URLs organized by category. Last verified: 2026-04-03.

---

## Official Resources

| Resource | URL |
|----------|-----|
| Gemini CLI GitHub Repository | https://github.com/google-gemini/gemini-cli |
| Gemini CLI Extension Gallery | https://geminicli.com/extensions |
| Google Gemini (product page) | https://gemini.google.com |
| Google AI Studio | https://aistudio.google.com |

## Official Documentation

| Resource | URL |
|----------|-----|
| Extensions Overview | https://geminicli.com/docs/extensions/ |
| Writing Extensions | https://geminicli.com/docs/extensions/writing-extensions/ |
| Releasing Extensions | https://geminicli.com/docs/extensions/releasing/ |
| Extension Best Practices | https://geminicli.com/docs/extensions/best-practices/ |
| Hooks Overview (all 11 types) | https://geminicli.com/docs/hooks/ |
| Writing Hooks (I/O protocol) | https://geminicli.com/docs/hooks/writing-hooks/ |

## Community Resources

| Resource | URL |
|----------|-----|
| Awesome Gemini CLI (curated list) | https://github.com/Piebald-AI/awesome-gemini-cli |

## Babysitter Integration

| Resource | URL |
|----------|-----|
| Babysitter Gemini Plugin (source) | https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-gemini |
| Babysitter Gemini Extension (npm) | https://www.npmjs.com/package/@a5c-ai/babysitter-gemini |
| Babysitter SDK (npm) | https://www.npmjs.com/package/@a5c-ai/babysitter-sdk |
| Babysitter Repository | https://github.com/a5c-ai/babysitter |

## SDK Source Files (within babysitter repo)

| File | Path | Description |
|------|------|-------------|
| Gemini CLI Adapter | `packages/sdk/src/harness/geminiCli.ts` | SDK adapter with session binding, hook handlers, install support |
| Gemini CLI Adapter Tests | `packages/sdk/src/harness/__tests__/geminiCli.test.ts` | Unit tests for the adapter |
| Harness Types | `packages/sdk/src/harness/types.ts` | `HarnessAdapter`, `HookHandlerArgs`, `SessionBindOptions` type definitions |
| Install Support | `packages/sdk/src/harness/installSupport.ts` | `getGeminiExtensionDir`, `installCliViaNpm`, `isGeminiPluginInstalled` helpers |

## Plugin Files (within babysitter repo)

| File | Path | Description |
|------|------|-------------|
| Extension Manifest | `plugins/babysitter-gemini/gemini-extension.json` | Extension identity and configuration |
| Hooks Config | `plugins/babysitter-gemini/hooks/hooks.json` | SessionStart and AfterAgent hook registration |
| AfterAgent Hook | `plugins/babysitter-gemini/hooks/after-agent.sh` | Core orchestration loop driver |
| SessionStart Hook | `plugins/babysitter-gemini/hooks/session-start.sh` | Session state initialization |
| GEMINI.md | `plugins/babysitter-gemini/GEMINI.md` | Full orchestration protocol instructions |
| Package.json | `plugins/babysitter-gemini/package.json` | npm package definition for the extension |
| Versions | `plugins/babysitter-gemini/versions.json` | SDK and extension version tracking |
| Call Command | `plugins/babysitter-gemini/commands/babysitter/call.toml` | `/babysitter:call` command definition |
| Resume Command | `plugins/babysitter-gemini/commands/babysitter/resume.toml` | `/babysitter:resume` command definition |
| Yolo Command | `plugins/babysitter-gemini/commands/babysitter/yolo.toml` | `/babysitter:yolo` command definition |
| Doctor Command | `plugins/babysitter-gemini/commands/babysitter/doctor.toml` | `/babysitter:doctor` command definition |

## Assimilation Process

| File | Path | Description |
|------|------|-------------|
| Gemini CLI Assimilation | `library/specializations/meta/assimilation/harness/gemini-cli.js` | Process definition for assimilating Gemini CLI into Babysitter |

## Related Harness Instruction Files

| Harness | Instruction File Convention | Analogous To |
|---------|---------------------------|--------------|
| Gemini CLI | `GEMINI.md` | Project-level agent instructions |
| Claude Code | `CLAUDE.md` | Project-level agent instructions |
| GitHub Copilot | `AGENTS.md` | Project-level agent instructions |
| Cursor | `.cursorrules` | Project-level agent instructions |
