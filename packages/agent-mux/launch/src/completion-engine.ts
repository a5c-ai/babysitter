/**
 * Backward-compatibility re-exports.
 *
 * The completion engine implementations now live in @a5c-ai/agent-mux-transport.
 * This module re-exports them so existing import paths continue to work.
 */

export { createOpenAICompletionEngine, createGoogleCompletionEngine, createAnthropicCompletionEngine } from '@a5c-ai/agent-mux-transport';
