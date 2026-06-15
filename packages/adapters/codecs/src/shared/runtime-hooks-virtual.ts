import type { RuntimeHookCapabilities, RuntimeHookMode } from '@a5c-ai/comm-adapter';

const NONBLOCKING: RuntimeHookMode = 'nonblocking';

export function createVirtualRuntimeHookCapabilities(
  overrides: Partial<RuntimeHookCapabilities> = {},
): RuntimeHookCapabilities {
  return {
    preToolUse: NONBLOCKING,
    postToolUse: NONBLOCKING,
    sessionStart: NONBLOCKING,
    sessionEnd: NONBLOCKING,
    stop: NONBLOCKING,
    userPromptSubmit: NONBLOCKING,
    ...overrides,
  };
}
