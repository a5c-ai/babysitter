/**
 * Prompt context factory — derives context from the Atlas graph.
 *
 * @module prompts/context
 */

export { createPromptContextFromCatalog, createPromptContextFromCatalog as createPromptContextForHarness } from "../harness/hooks/promptContexts";
export { createInternalContext } from "../harness/internal/promptContext";
