# Code Identifier Renames

3,500+ references to `adapters` in source code identifiers, file names, and paths.

## Source Code Identifiers

| Current Pattern | Target Pattern | Occurrences | Key Files |
|----------------|---------------|-------------|-----------|
| `amuxBridge` | `agentMuxBridge` | 50+ | `agent-platform/src/harness/adapters/amuxBridge.ts` |
| `amuxClient` | `agentMuxClient` | 40+ | `agent-platform/src/harness/adapters/amuxClientFactory.ts` |
| `amuxEventMapper` | `agentMuxEventMapper` | 20+ | `agent-platform/src/harness/adapters/amuxEventMapper.ts` |
| `amuxHarnessMap` | `agentMuxHarnessMap` | 15+ | `agent-platform/src/harness/adapters/amuxHarnessMap.ts` |
| `amuxStdinReader` | `agentMuxStdinReader` | 10+ | `agent-platform/src/harness/adapters/amuxStdinReader.ts` |
| `isAmuxAvailable` | `isAgentMuxAvailable` | 10+ | `agent-platform/src/harness/adapters/amuxClientFactory.ts` |
| `getAmuxClient` | `getAgentMuxClient` | 15+ | Multiple files |
| `invokeViaAgentMux` | `invokeViaAgentMux` (keep) | 5+ | Already correct pattern |
| `AmuxBridgeResult` | `AgentMuxBridgeResult` | 5+ | Type definitions |
| `AmuxRunOptions` | `AgentMuxRunOptions` | 5+ | Type definitions |
| `mapAmuxEvent` | `mapAgentMuxEvent` | 5+ | Event mapping |
| `amuxProvider` | `agentMuxProvider` | 20+ | Provider resolution |

## File/Directory Renames

| Current Path | Target Path |
|-------------|------------|
| `packages/tula/platform/src/harness/adapters/` | `packages/tula/platform/src/harness/agent-mux/` |
| `packages/tula/platform/src/harness/adapters/amuxBridge.ts` | `packages/tula/platform/src/harness/agent-mux/bridge.ts` |
| `packages/tula/platform/src/harness/adapters/amuxClientFactory.ts` | `packages/tula/platform/src/harness/agent-mux/clientFactory.ts` |
| `packages/tula/platform/src/harness/adapters/amuxEventMapper.ts` | `packages/tula/platform/src/harness/agent-mux/eventMapper.ts` |
| `packages/tula/platform/src/harness/adapters/amuxHarnessMap.ts` | `packages/tula/platform/src/harness/agent-mux/harnessMap.ts` |
| `packages/tula/platform/src/harness/adapters/amuxStdinReader.ts` | `packages/tula/platform/src/harness/agent-mux/stdinReader.ts` |
| `packages/tula/platform/src/harness/adapters/amuxTypes.ts` | `packages/tula/platform/src/harness/agent-mux/types.ts` |
| `packages/adapters/adapters-proxy/` | `packages/adapters/transport-proxy/` |
| `packages/adapters/meta/config/adapters/` | `packages/adapters/meta/config/agent-mux/` |

## Mobile/App Package References

Java/Kotlin packages use `ai.a5c.adapters` as the Android package namespace. These need to become `ai.a5c.agentmux`:
- `packages/adapters/mobile-android-app/`
- `packages/adapters/tv-androidtv-app/`
- `packages/adapters/watch-wearos-app/`

## Test File References

Many test files reference `adapters` in:
- Mock objects: `mockAmuxClient`, `amuxMockAdapter`
- Test descriptions: "adapters bridge should..."
- Fixture file names: `adapters-e2e-roundtrip.test.ts`

## Scope Estimate

| Category | Count | Effort |
|----------|-------|--------|
| Source identifiers | 3,500+ lines | Large — automated sed + manual review |
| File/directory renames | 15+ files | Medium — git mv |
| Type/interface renames | 20+ types | Medium — find-replace |
| Test updates | 100+ lines | Medium — automated |
| Mobile package namespace | 3 apps | Small — config change |
