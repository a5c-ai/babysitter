import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';
import { listPluginTargetDescriptors } from '@a5c-ai/agent-catalog';

/**
 * Resolve the skill system label from catalog metadata.
 */
function resolveSkillSystemLabel(ctx: PromptContext): string {
  const target = listPluginTargetDescriptors().find(t => t.targetId === ctx.harness);
  if (target?.skillSystemLabel) return target.skillSystemLabel;
  return 'Installed skill';
}

/**
 * Renders the Task Kinds table and Effect Execution Hints section.
 */
export function renderTaskKinds(ctx: PromptContext): string {
  const skillSystemLabel = resolveSkillSystemLabel(ctx);

  const augmentedCtx = {
    ...ctx,
    skillSystemLabel,
  };

  return renderTemplate(resolveTemplatePath('task-kinds.md'), augmentedCtx as PromptContext & { skillSystemLabel: string });
}
