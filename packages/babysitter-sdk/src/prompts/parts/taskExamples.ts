import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Agent Task Example and Skill Task Example sections.
 * These are identical across all harnesses.
 */
export function renderTaskExamples(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('task-examples.md'), ctx);
}
