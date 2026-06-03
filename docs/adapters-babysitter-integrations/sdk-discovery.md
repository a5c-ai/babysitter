# SDK-Level Agent-Mux Discovery

## Summary

Add an optional discovery layer to the SDK that detects agent-mux availability and queries installed agents, supported models, and capabilities. This data feeds into process creation context.

## API Design

### `discoverExternalAgents(): ExternalAgentDiscovery`

```typescript
// packages/sdk/src/harness/externalAgentDiscovery.ts

interface ExternalAgentInfo {
  name: string;              // adapter name (e.g., "claude", "codex", "gemini")
  displayName: string;       // human-readable (e.g., "Claude Code")
  installed: boolean;        // detected on PATH
  authenticated: boolean;    // has valid credentials
  capabilities: string[];    // e.g., ["file-edit", "bash", "browser"]
}

interface ExternalAgentDiscovery {
  available: boolean;                 // is agent-mux installed?
  agents: ExternalAgentInfo[];        // discovered agents
  defaultProvider: string | null;     // AMUX_PROVIDER env
  defaultModel: string | null;        // AMUX_MODEL env
}

export async function discoverExternalAgents(
  options?: { timeout?: number; cwd?: string }
): Promise<ExternalAgentDiscovery>;
```

### Detection Strategy

1. **Check if `@a5c-ai/adapters` is importable** — same pattern as `isAmuxAvailable()` in agent-platform
2. **If importable:** call `adapterRegistry.list()` and `adapterRegistry.installed()` to get agent info
3. **If not importable:** try `adapters doctor --json` via `execFileSync` (CLI fallback)
4. **If neither works:** return `{ available: false, agents: [], ... }`

### Caching

Discovery is expensive (spawns processes, checks file system). Cache for 60s. Invalidate on explicit `discoverExternalAgents({ force: true })`.

## Files to Create/Modify

### New Files
- `packages/sdk/src/harness/externalAgentDiscovery.ts` — discovery API
- `packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts` — unit tests

### Modified Files
- `packages/sdk/src/index.ts` — export `discoverExternalAgents`
- `packages/sdk/src/harness/discovery.ts` — integrate external agent discovery into harness discovery

## Integration with Process Creation

The discovery result is passed into the process creation context:

```typescript
// In agent-platform/src/harness/internal/createRun/planProcess/phase.ts
const externalAgents = await discoverExternalAgents({ timeout: 5000 });

// Inject into prompt context
const promptContext = buildPromptContext({
  workspace,
  selectedHarnessName,
  discovered,
  compressionConfig,
  externalAgents,  // NEW
});
```

The process creation prompt then includes:

```
Available external agents (via agent-mux):
- claude-code (installed, authenticated) — file-edit, bash, browser
- codex (installed, authenticated) — file-edit, bash
- gemini-cli (installed, not authenticated)

You may use `external: true` agent tasks to delegate work to these agents.
```

## Dependencies

- SDK has **no hard dependency** on agent-mux. Discovery uses dynamic import with fallback.
- At runtime, agent-mux is only needed if external tasks are actually dispatched.
