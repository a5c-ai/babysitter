import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Task Kinds table and Effect Execution Hints section.
 */
export function renderTaskKinds(ctx: PromptContext): string {
  const skillSystemLabel = ctx.harness === 'claude-code'
    ? 'Claude Code skill'
    : 'Installed skill';

  const augmentedCtx = {
    ...ctx,
    skillSystemLabel,
  };

  return renderTemplate(resolveTemplatePath('task-kinds.md'), augmentedCtx as PromptContext & { skillSystemLabel: string });
}
