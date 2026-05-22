export * from './types.js';
export * from './config.js';
export * from './server.js';
export * from './runtime.js';
export type { TransportCodec, NormalizedToolDefinition, NormalizedToolCall, NormalizedCostRecord, CodecCapabilities } from './codec.js';
export {
  AnthropicCodec,
  BedrockConverseCodec,
  GoogleCodec,
  OpenAiChatCodec,
  OpenAiResponsesCodec,
  convertTools,
  getCodec,
  getCodecForDescriptor,
  normalizeUsage,
} from './codecs/index.js';
export { createOpenAICompletionEngine } from './engines/openai.js';
export { createGoogleCompletionEngine } from './engines/google.js';
export type { GoogleCompletionEngineOptions } from './engines/google.js';

export const TRANSPORT_MUX_RUNTIME = {
  packageName: '@a5c-ai/transport-mux',
  status: 'internal-placeholder',
  publishable: false,
  launcherIntegrated: true,
  cutoverComplete: false,
  ownsReleaseSurface: false,
  executable: 'amux-proxy',
} as const;

export const TRANSPORT_MUX_PACKAGE = TRANSPORT_MUX_RUNTIME.packageName;
