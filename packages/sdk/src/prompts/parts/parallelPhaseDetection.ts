import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Parallel Phase Detection section.
 */
export function renderParallelPhaseDetection(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('parallel-phase-detection.md'), ctx);
}
