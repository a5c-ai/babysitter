/**
 * Backward-compatibility re-exports.
 *
 * The completion engine implementations now live in @a5c-ai/transport-mux.
 * This module re-exports them so existing import paths continue to work.
 */

export { createOpenAICompletionEngine, createGoogleCompletionEngine } from '@a5c-ai/transport-mux';
