# Code Identifier Renames

3,500+ references to `adapters` in source code identifiers, file names, and paths.

## Source Code Identifiers

| Current Pattern | Target Pattern | Occurrences | Key Files |
|----------------|---------------|-------------|-----------|
| `adapterBridge` | `agentMuxBridge` | 50+ | `agent-platform/src/harness/adapters/adapterBridge.ts` |
| `adapterClient` | `agentMuxClient` | 40+ | `agent-platform/src/harness/adapters/adapterClientFactory.ts` |
| `adapterEventMapper` | `agentMuxEventMapper` | 20+ | `agent-platform/src/harness/adapters/adapterEventMapper.ts` |
| `adapterHarnessMap` | `agentMuxHarnessMap` | 15+ | `agent-platform/src/harness/adapters/adapterHarnessMap.ts` |
| `adapterStdinReader` | `agentMuxStdinReader` | 10+ | `agent-platform/src/harness/adapters/adapterStdinReader.ts` |
| `isAmuxAvailable` | `isAgentMuxAvailable` | 10+ | `agent-platform/src/harness/adapters/adapterClientFactory.ts` |
| `getAmuxClient` | `getAgentMuxClient` | 15+ | Multiple files |
| `invokeViaAgentMux` | `invokeViaAgentMux` (keep) | 5+ | Already correct pattern |
| `AdapterBridgeResult` | `AgentMuxBridgeResult` | 5+ | Type definitions |
| `AdapterRunOptions` | `AgentMuxRunOptions` | 5+ | Type definitions |
| `mapAmuxEvent` | `mapAgentMuxEvent` | 5+ | Event mapping |
| `adapterProvider` | `agentMuxProvider` | 20+ | Provider resolution |

## File/Directory Renames

| Current Path | Target Path |
|-------------|------------|
| `packages/genty/platform/src/harness/adapters/` | `packages/genty/platform/src/harness/adapters/` |
| `packages/genty/platform/src/harness/adapters/adapterBridge.ts` | `packages/genty/platform/src/harness/adapters/bridge.ts` |
| `packages/genty/platform/src/harness/adapters/adapterClientFactory.ts` | `packages/genty/platform/src/harness/adapters/clientFactory.ts` |
| `packages/genty/platform/src/harness/adapters/adapterEventMapper.ts` | `packages/genty/platform/src/harness/adapters/eventMapper.ts` |
| `packages/genty/platform/src/harness/adapters/adapterHarnessMap.ts` | `packages/genty/platform/src/harness/adapters/harnessMap.ts` |
| `packages/genty/platform/src/harness/adapters/adapterStdinReader.ts` | `packages/genty/platform/src/harness/adapters/stdinReader.ts` |
| `packages/genty/platform/src/harness/adapters/adapterTypes.ts` | `packages/genty/platform/src/harness/adapters/types.ts` |
| `packages/adapters/adapters-proxy/` | `packages/adapters/transport-proxy/` |
| `packages/adapters/meta/config/adapters/` | `packages/adapters/meta/config/adapters/` |

## Mobile/App Package References

Java/Kotlin packages use `ai.a5c.adapters` as the Android package namespace. These need to become `ai.a5c.agentmux`:
- `packages/adapters/mobile-android-app/`
- `packages/adapters/tv-androidtv-app/`
- `packages/adapters/watch-wearos-app/`

## Test File References

Many test files reference `adapters` in:
- Mock objects: `mockAmuxClient`, `adapterMockAdapter`
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
