import type { TransportId } from '@a5c-ai/agent-mux-comm';

export interface HarnessProviderTranslation {
  env: Record<string, string>;
  args: string[];
  configContent?: string;
  configPath?: string;
  proxyRequired: boolean;
  proxyExposedTransport?: TransportId;
}
