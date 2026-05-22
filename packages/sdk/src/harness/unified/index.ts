export { createUnifiedAdapter } from "./adapter";
export { UNIFIED_DISCOVERY_SPEC } from "./discovery";
export {
  deriveCapabilitiesFromProxy,
  buildPromptContextFromProxy,
  type ProxyCapabilities,
} from "./capabilities";
export {
  invokeHooksProxy,
  isHooksProxyAvailable,
  buildInvokeArgs,
  type InvokeOptions,
  type InvokeResult,
} from "./subprocess";
export { createUnifiedContext } from "./promptContext";
