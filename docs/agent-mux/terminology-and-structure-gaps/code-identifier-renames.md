# Code Identifier Renames

3,500+ references to `amux` in source code identifiers, file names, and paths.

## Source Code Identifiers

| Current Pattern | Target Pattern | Occurrences | Key Files |
|----------------|---------------|-------------|-----------|
| `amuxBridge` | `agentMuxBridge` | 50+ | `agent-platform/src/harness/amux/amuxBridge.ts` |
| `amuxClient` | `agentMuxClient` | 40+ | `agent-platform/src/harness/amux/amuxClientFactory.ts` |
| `amuxEventMapper` | `agentMuxEventMapper` | 20+ | `agent-platform/src/harness/amux/amuxEventMapper.ts` |
| `amuxHarnessMap` | `agentMuxHarnessMap` | 15+ | `agent-platform/src/harness/amux/amuxHarnessMap.ts` |
| `amuxStdinReader` | `agentMuxStdinReader` | 10+ | `agent-platform/src/harness/amux/amuxStdinReader.ts` |
| `isAmuxAvailable` | `isAgentMuxAvailable` | 10+ | `agent-platform/src/harness/amux/amuxClientFactory.ts` |
| `getAmuxClient` | `getAgentMuxClient` | 15+ | Multiple files |
| `invokeViaAgentMux` | `invokeViaAgentMux` (keep) | 5+ | Already correct pattern |
| `AmuxBridgeResult` | `AgentMuxBridgeResult` | 5+ | Type definitions |
| `AmuxRunOptions` | `AgentMuxRunOptions` | 5+ | Type definitions |
| `mapAmuxEvent` | `mapAgentMuxEvent` | 5+ | Event mapping |
| `amuxProvider` | `agentMuxProvider` | 20+ | Provider resolution |

## File/Directory Renames

| Current Path | Target Path |
|-------------|------------|
| `packages/tula-platform/src/harness/amux/` | `packages/tula-platform/src/harness/agent-mux/` |
| `packages/tula-platform/src/harness/amux/amuxBridge.ts` | `packages/tula-platform/src/harness/agent-mux/bridge.ts` |
| `packages/tula-platform/src/harness/amux/amuxClientFactory.ts` | `packages/tula-platform/src/harness/agent-mux/clientFactory.ts` |
| `packages/tula-platform/src/harness/amux/amuxEventMapper.ts` | `packages/tula-platform/src/harness/agent-mux/eventMapper.ts` |
| `packages/tula-platform/src/harness/amux/amuxHarnessMap.ts` | `packages/tula-platform/src/harness/agent-mux/harnessMap.ts` |
| `packages/tula-platform/src/harness/amux/amuxStdinReader.ts` | `packages/tula-platform/src/harness/agent-mux/stdinReader.ts` |
| `packages/tula-platform/src/harness/amux/amuxTypes.ts` | `packages/tula-platform/src/harness/agent-mux/types.ts` |
| `packages/agent-mux/amux-proxy/` | `packages/agent-mux/transport-proxy/` |
| `packages/agent-mux/meta/config/amux/` | `packages/agent-mux/meta/config/agent-mux/` |

## Mobile/App Package References

Java/Kotlin packages use `ai.a5c.amux` as the Android package namespace. These need to become `ai.a5c.agentmux`:
- `packages/agent-mux/mobile-android-app/`
- `packages/agent-mux/tv-androidtv-app/`
- `packages/agent-mux/watch-wearos-app/`

## Test File References

Many test files reference `amux` in:
- Mock objects: `mockAmuxClient`, `amuxMockAdapter`
- Test descriptions: "amux bridge should..."
- Fixture file names: `amux-e2e-roundtrip.test.ts`

## Scope Estimate

| Category | Count | Effort |
|----------|-------|--------|
| Source identifiers | 3,500+ lines | Large — automated sed + manual review |
| File/directory renames | 15+ files | Medium — git mv |
| Type/interface renames | 20+ types | Medium — find-replace |
| Test updates | 100+ lines | Medium — automated |
| Mobile package namespace | 3 apps | Small — config change |
