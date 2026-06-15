import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the loop control / stop-and-yield section.
 *
 * Three modes:
 *   1. stop-hook + hookDriven=true  → yield to stop-hook (Claude Code, Codex with hooks)
 *   2. loop-driver                  → return control to loop-driver (PI)
 *   3. stop-hook + hookDriven=false → drive loop in-turn (Codex without hooks)
 */
export function renderLoopControl(ctx: PromptContext): string {
  const isLoopDriver = ctx.loopControlTerm === 'loop-driver';
  const isStopHookDriven = ctx.loopControlTerm === 'stop-hook' && ctx.hookDriven;
  const isInTurn = ctx.loopControlTerm === 'stop-hook' && !ctx.hookDriven;

  return renderTemplate(resolveTemplatePath('loop-control.md'), ctx, {
    stopHookDriven: isStopHookDriven ? 'true' : '',
    loopDriverMode: isLoopDriver ? 'true' : '',
    inTurnMode: isInTurn ? 'true' : '',
  });
}
