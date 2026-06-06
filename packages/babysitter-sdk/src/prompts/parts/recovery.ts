import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Recovery from failure section.
 * Codex has an extended Failure Protocol; other harnesses have a basic version.
 */
export function renderRecovery(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('recovery.md'), ctx);
}
