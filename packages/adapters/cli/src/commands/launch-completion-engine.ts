/**
 * Completion engine — thin wrapper.
 *
 * The implementation now lives in @a5c-ai/launch-adapter.
 * This module re-exports everything for backward compatibility.
 */

export {
  createOpenAICompletionEngine,
  createGoogleCompletionEngine,
} from '@a5c-ai/launch-adapter';
