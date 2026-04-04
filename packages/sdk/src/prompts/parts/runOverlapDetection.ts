import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Run Overlap Detection section.
 */
export function renderRunOverlapDetection(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('run-overlap-detection.md'), ctx);
}
