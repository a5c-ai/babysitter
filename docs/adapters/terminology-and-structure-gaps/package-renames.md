# Package Renames

42 adapter-related packages need naming alignment to `@a5c-ai/adapters-{feature}`.

## Top-Level Packages → Move Under adapters/

These currently live at `packages/{name}` and need to move to `packages/adapters/{name}/`.

| Current Package | Current Dir | Target Package | Target Dir |
|----------------|------------|---------------|-----------|
| `@a5c-ai/transport-adapter` | `packages/transport-adapter/` | `@a5c-ai/transport-adapter` | `packages/adapters/transport/` |
| `@a5c-ai/extensions-adapter` | `packages/extensions-adapter/` | `@a5c-ai/extensions-adapter` | `packages/adapters/extensions/` |
| `@a5c-ai/triggers-adapter` | `packages/triggers-adapter/` | `@a5c-ai/triggers-adapter` | `packages/adapters/triggers/` |
| `@a5c-ai/tasks-adapter` | `packages/tasks-adapter/` | `@a5c-ai/tasks-adapter` | `packages/adapters/tasks/` |
| `@a5c-ai/tools-adapter` | `packages/tools-adapter/` | `@a5c-ai/tools-adapter` | `packages/adapters/tools/` |

## Hooks-Adapter → Move Under adapters/

| Current Package | Current Dir | Target Package | Target Dir |
|----------------|------------|---------------|-----------|
| `@a5c-ai/hooks-adapter-core` | `packages/hooks-adapter/core/` | `@a5c-ai/hooks-adapter-core` | `packages/adapters/hooks/core/` |
| `@a5c-ai/hooks-adapter-cli` | `packages/hooks-adapter/cli/` | `@a5c-ai/hooks-adapter-cli` | `packages/adapters/hooks/cli/` |
| `@a5c-ai/hooks-adapter-adapter-claude` | `packages/hooks-adapter/adapter-claude/` | `@a5c-ai/hooks-adapter-claude` | `packages/adapters/hooks/adapter-claude/` |
| `@a5c-ai/hooks-adapter-adapter-codex` | `packages/hooks-adapter/adapter-codex/` | `@a5c-ai/hooks-adapter-codex` | `packages/adapters/hooks/adapter-codex/` |
| `@a5c-ai/hooks-adapter-adapter-copilot` | `packages/hooks-adapter/adapter-copilot/` | `@a5c-ai/hooks-adapter-copilot` | `packages/adapters/hooks/adapter-copilot/` |
| `@a5c-ai/hooks-adapter-adapter-cursor` | `packages/hooks-adapter/adapter-cursor/` | `@a5c-ai/hooks-adapter-cursor` | `packages/adapters/hooks/adapter-cursor/` |
| `@a5c-ai/hooks-adapter-adapter-gemini` | `packages/hooks-adapter/adapter-gemini/` | `@a5c-ai/hooks-adapter-gemini` | `packages/adapters/hooks/adapter-gemini/` |
| `@a5c-ai/hooks-adapter-adapter-hermes` | `packages/hooks-adapter/adapter-hermes/` | `@a5c-ai/hooks-adapter-hermes` | `packages/adapters/hooks/adapter-hermes/` |
| `@a5c-ai/hooks-adapter-adapter-oh-my-pi` | `packages/hooks-adapter/adapter-oh-my-pi/` | `@a5c-ai/hooks-adapter-oh-my-pi` | `packages/adapters/hooks/adapter-oh-my-pi/` |
| `@a5c-ai/hooks-adapter-adapter-openclaw` | `packages/hooks-adapter/adapter-openclaw/` | `@a5c-ai/hooks-adapter-openclaw` | `packages/adapters/hooks/adapter-openclaw/` |
| `@a5c-ai/hooks-adapter-adapter-opencode` | `packages/hooks-adapter/adapter-opencode/` | `@a5c-ai/hooks-adapter-opencode` | `packages/adapters/hooks/adapter-opencode/` |
| `@a5c-ai/hooks-adapter-adapter-pi` | `packages/hooks-adapter/adapter-pi/` | `@a5c-ai/hooks-adapter-pi` | `packages/adapters/hooks/adapter-pi/` |

## Existing Agent-Adapter Subpackages → Rename Only

These are already under `packages/adapters/` but have inconsistent package names.

| Current Package | Target Package | Dir (unchanged) |
|----------------|---------------|----------------|
| `@a5c-ai/agent-comm-adapter` | `@a5c-ai/comm-adapter` | `packages/adapters/core/` |
| `@a5c-ai/agent-config-adapter` | `@a5c-ai/config-adapter` | `packages/adapters/config/` |
| `@a5c-ai/agent-launch-adapter` | `@a5c-ai/launch-adapter` | `packages/adapters/launch/` |
| `@a5c-ai/adapters` (sdk) | `@a5c-ai/adapters` (keep) | `packages/adapters/sdk/` |
| `@a5c-ai/adapters-cli` | `@a5c-ai/adapters-cli` (keep) | `packages/adapters/cli/` |
| `@a5c-ai/adapters-codecs` | `@a5c-ai/adapters-codecs` (keep) | `packages/adapters/adapters/` |
| `@a5c-ai/adapters-gateway` | `@a5c-ai/adapters-gateway` (keep) | `packages/adapters/gateway/` |
| `@a5c-ai/adapters-harness-mock` | `@a5c-ai/adapters-harness-mock` (keep) | `packages/adapters/harness-mock/` |
| `@a5c-ai/adapters-observability` | `@a5c-ai/adapters-observability` (keep) | `packages/adapters/observability/` |
| `@a5c-ai/genty-tui` | `@a5c-ai/genty-tui` (keep) | `packages/adapters/tui/` |
| `@a5c-ai/genty-ui` | `@a5c-ai/genty-ui` (keep) | `packages/adapters/ui/` |
| `@a5c-ai/genty-web-app` | `@a5c-ai/genty-web-app` (keep) | `packages/adapters/webui/` |

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Move to adapters/ | 5 | git mv + package rename |
| Move hooks-adapter/ to adapters/hooks/ | 12 | git mv + package rename |
| Rename package only (already in adapters/) | 3 | package.json name change |
| Already correct | 22 | No change |
| **Total** | **42** | |
