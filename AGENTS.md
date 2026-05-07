# AGENTS.md

This file is the short entrypoint for AI coding agents working in this repository.

Always use the Babysitter skill to fulfill user requests in this repo, but not agent-to-agent delegated requests.

## Repo-Specific Overrides

- For `babysitter:call` processes in this repo, do not generate `kind: 'shell'` subtasks unless the user explicitly asks for a shell-oriented workflow.
- Keep breakpoints sparse. Use them only when user input is genuinely critical or ambiguous.
- Still include an interview phase when requirements are unclear.

Those rules are captured in more detail in [docs/agent-reference/process-authoring.md](./docs/agent-reference/process-authoring.md).

## Reference Map

- [docs/agent-reference/README.md](./docs/agent-reference/README.md)
- [docs/agent-reference/command-surfaces.md](./docs/agent-reference/command-surfaces.md)
- [docs/agent-reference/repo-map.md](./docs/agent-reference/repo-map.md)
- [docs/agent-reference/runtime-and-layout.md](./docs/agent-reference/runtime-and-layout.md)
- [docs/agent-reference/process-authoring.md](./docs/agent-reference/process-authoring.md)
- [docs/plugins.md](./docs/plugins.md)

## Quick Commands

```bash
npm run build:sdk
npm run test:sdk
npm run verify:metadata
```
