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
  AdapterAgentEvent,
  AdapterInteractionChannel,
  AgentMuxClient,
  AdapterAdapterInfo,
  AdapterAdapterInstallationCheck,
  AdapterAuthCheck,
  AgentMuxClientWithDiscovery,
} from "./adapterTypes";

export {
  HARNESS_TO_AGENT_MUX_ADAPTER,
  mapHarnessToAmuxAdapter,
  hasAmuxAdapter,
} from "./adapterHarnessMap";

export {
  mapAmuxEvent,
  isToolEvent,
  isCostEvent,
  isInteractiveEvent,
  isErrorEvent,
  isSessionLifecycleEvent,
  type BabysitterEvent,
  type BabysitterEventKind,
} from "./adapterEventMapper";

export {
  invokeViaAgentMux,
  type AdapterBridgeOptions,
  type AgentMuxBridgeResult,
  type AdapterEventCallback,
} from "./adapterBridge";

export {
  getAgentMuxClient,
  isAgentMuxAvailable,
  _resetAgentMuxClientCache,
} from "./adapterClientFactory";

export { AdapterEventEmitter } from "./adapterEventEmitter";

export {
  createAmuxStdinReader,
  waitForInteractionResponse,
  type AdapterInteractionEvent,
} from "./adapterStdinReader";
