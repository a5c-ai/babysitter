# Atlas Graph & Agent Catalog

The knowledge layer that drives all runtime behavior.

## Atlas Graph

The atlas is a YAML-defined knowledge graph at `packages/atlas/graph/`. It models:

### Node Kinds

| Kind | Example | What it represents |
|------|---------|-------------------|
| `AgentVersion` | `agentVersion:claude:ge-1-0-0` | A harness at a version range |
| `AgentProduct` | `agent:claude-code` | The product identity |
| `Capability` | `capability:supports-mcp` | An abstract capability |
| `CapabilitySupport` | `capSupport:claude:mcp` | Claim that an agent has a capability |
| `ModelVersion` | `modelVersion:gpt-5.5` | A model with pricing/limits |
| `ModelProviderVersion` | `providerVersion:foundry` | A provider endpoint |
| `TransportProtocol` | `transportProtocol:anthropic` | An API wire format |
| `HookDescriptor` | `hook:sessionStart` | A lifecycle hook |
| `PluginTarget` | `pluginTarget:claude-code` | A plugin installation target |
| `LaunchConfig` | `launchConfig:claude.yolo` | A launch recipe |
| `Evidence` | `evidence:claude-mcp-docs` | A capability evidence source |

### Edge Kinds

| Edge | From → To | Meaning |
|------|-----------|---------|
| `supports` | AgentVersion → Capability | Agent has this capability |
| `version_of` | AgentVersion → AgentProduct | Version belongs to product |
| `composed_of` | AgentVersion → CoreImpl, RuntimeImpl, etc. | Architecture layers |
| `speaks` | CoreImpl → TransportProtocol | Agent uses this wire format |
| `defaults_to_model` | AgentVersion → ModelVersion | Default model selection |

### `adapterMetadata` Block

Each `AgentVersion` YAML includes an `adapterMetadata` section with runtime data:

```yaml
adapterMetadata:
  authMethods:
    - type: api_key
      name: "API Key"
      envVars: [ANTHROPIC_API_KEY]
  authFiles: ["~/.claude.json"]
  hostEnvSignals: [CLAUDECODE, CLAUDE_CODE_SESSION_ID]
  sessionDir: "~/.claude/projects"
  sessionPersistence: file
  automationEnv:
    GEMINI_CLI_TRUST_WORKSPACE: "true"
  approvalModes: [yolo, prompt, deny]
  capabilityFlags:
    canResume: true
    supportsMultiTurn: true
    supportsMCP: true
    supportsThinking: true
    # ... 30+ flags
  runtimeHooks:
    preToolUse: blocking
    stop: nonblocking
  configSchema:
    configFormat: json
    configFilePaths: ["~/.claude/settings.json"]
  displayName: "Claude Code"
  defaultModelId: "claude-sonnet-4-20250514"
```

## Atlas Catalog

`packages/atlas/src/catalog` provides a typed query API over the atlas graph
through the `@a5c-ai/atlas/catalog` export:

### Core Queries

```typescript
import {
  getAgentVersion,
  getCapabilityFlags,
  getAdapterMetadata,
  getInstallMethods,
  getAutomationEnv,
  getHostEnvSignals,
  getSessionConfig,
  getRuntimeHooks,
  getConfigSchema,
  getDisplayName,
  getDefaultModelId,
  getBridgeCapabilities,
  getHookSupport,
  getYoloLaunchArgs,
  getTransportCodecCapabilities,
} from '@a5c-ai/atlas/catalog';
```

### How Adapters Use It

Adapters are thin wrappers — all data comes from the graph:

```typescript
class ClaudeAdapter extends BaseAgentAdapter {
  get displayName() { return getDisplayName(this.agent); }
  get hostEnvSignals() { return getHostEnvSignals(this.agent); }
  get capabilities() {
    const flags = getCapabilityFlags(this.agent);
    const hooks = getRuntimeHooks(this.agent);
    return {
      agent: this.agent,
      canResume: Boolean(flags.canResume),
      supportsMCP: Boolean(flags.supportsMCP),
      runtimeHooks: {
        preToolUse: hooks.preToolUse ?? 'nonblocking',
        // ...
      },
      installMethods: getInstallMethods(this.agent).map(m => ({
        platform: 'all', type: m.type, command: m.command,
      })),
    };
  }
}
```

### Evidence System

The graph tracks evidence quality for each capability claim:

| Level | Meaning |
|-------|---------|
| `corroborated` | Multiple independent sources confirm |
| `partial` | Some evidence but gaps remain |
| `inferred` | Derived from related evidence |
| `unresolved-gap` | No evidence found yet |

Evidence is linked via `sourced_from:` edges from capability support nodes to evidence records.

### Graph Build Pipeline

```
packages/atlas/graph/**/*.yaml
    → atlas indexer (scripts/build-index.mjs)
    → packages/atlas/src/index.json (37MB)
    → imported by agent-catalog at build time
    → query functions available at runtime
```
