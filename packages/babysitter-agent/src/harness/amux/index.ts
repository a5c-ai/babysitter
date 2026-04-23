/**
 * agent-mux integration bridge for babysitter-agent.
 *
 * This module provides an alternative invocation path that delegates to
 * an AmuxClient rather than spawning harness CLIs directly. The existing
 * invoker.ts is preserved as a fallback.
 *
 * @module harness/amux
 */

export type {
  AmuxRunOptions,
  AmuxRunHandle,
  AmuxAgentEvent,
  AmuxInteractionChannel,
  AmuxClient,
  AmuxAdapterInfo,
  AmuxAdapterInstallationCheck,
  AmuxAuthCheck,
  AmuxClientWithDiscovery,
} from "./amuxTypes";

export {
  HARNESS_TO_AMUX_ADAPTER,
  mapHarnessToAmuxAdapter,
  hasAmuxAdapter,
} from "./amuxHarnessMap";

export {
  mapAmuxEvent,
  isToolEvent,
  isCostEvent,
  isInteractiveEvent,
  isErrorEvent,
  isSessionLifecycleEvent,
  type BabysitterEvent,
  type BabysitterEventKind,
} from "./amuxEventMapper";

export {
  invokeViaAgentMux,
  type AmuxBridgeOptions,
  type AmuxBridgeResult,
  type AmuxEventCallback,
} from "./amuxBridge";

export {
  getAmuxClient,
  isAmuxAvailable,
  _resetAmuxClientCache,
} from "./amuxClientFactory";

export { AmuxEventEmitter } from "./amuxEventEmitter";

export {
  createAmuxStdinReader,
  waitForInteractionResponse,
  type AmuxInteractionEvent,
} from "./amuxStdinReader";
