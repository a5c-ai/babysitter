import { createProxyConfig } from '../src/config.js';
import { createTransportMuxApp } from '../src/server.js';
import type { CompletionEngine } from '../src/types.js';

export function createTestConfig(overrides: Partial<ReturnType<typeof createProxyConfig>> = {}) {
  return createProxyConfig({
    targetProvider: 'openai',
    targetModel: 'openai/gpt-4o',
    exposedTransport: 'anthropic',
    authToken: 'test-token',
    ...overrides,
  });
}

export function createTestApp(
  overrides: Partial<ReturnType<typeof createProxyConfig>> = {},
  completionEngine?: CompletionEngine,
) {
  return createTransportMuxApp({
    config: createTestConfig(overrides),
    completionEngine,
  });
}
