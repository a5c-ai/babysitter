import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Results Posting workflow section.
 * This section is identical across all harnesses.
 */
export function renderResultsPosting(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('results-posting.md'), ctx);
}
