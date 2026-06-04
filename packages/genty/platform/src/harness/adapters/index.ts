/**
 * adapters integration bridge for agent-platform.
 *
 * This module provides an alternative invocation path that delegates to
 * an AgentMuxClient rather than spawning harness CLIs directly. The existing
 * invoker.ts is preserved as a fallback.
 *
 * @module harness/adapters
 */

export type {
  AgentMuxRunOptions,
  AgentMuxRunHandle,
  AmuxAgentEvent,
  AmuxInteractionChannel,
  AgentMuxClient,
  AmuxAdapterInfo,
  AmuxAdapterInstallationCheck,
  AmuxAuthCheck,
  AgentMuxClientWithDiscovery,
} from "./agentMuxTypes";

export {
  HARNESS_TO_AGENT_MUX_ADAPTER,
  mapHarnessToAmuxAdapter,
  hasAmuxAdapter,
} from "./agentMuxHarnessMap";

export {
  mapAmuxEvent,
  isToolEvent,
  isCostEvent,
  isInteractiveEvent,
  isErrorEvent,
  isSessionLifecycleEvent,
  type BabysitterEvent,
  type BabysitterEventKind,
} from "./agentMuxEventMapper";

export {
  invokeViaAgentMux,
  type AmuxBridgeOptions,
  type AgentMuxBridgeResult,
  type AmuxEventCallback,
} from "./agentMuxBridge";

export {
  getAgentMuxClient,
  isAgentMuxAvailable,
  _resetAgentMuxClientCache,
} from "./agentMuxClientFactory";

export { AmuxEventEmitter } from "./agentMuxEventEmitter";

export {
  createAmuxStdinReader,
  waitForInteractionResponse,
  type AmuxInteractionEvent,
} from "./agentMuxStdinReader";
