import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the User Profile Integration section.
 * This section is identical across all harnesses.
 */
export function renderUserProfile(ctx: PromptContext): string {
  return renderTemplate(resolveTemplatePath('user-profile.md'), ctx);
}
