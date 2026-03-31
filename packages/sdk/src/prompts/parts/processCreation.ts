import { renderTemplate, resolveTemplatePath } from '../templateRenderer';
import type { PromptContext } from '../types';

/**
 * Renders the Process Creation phase section.
 */
export function renderProcessCreation(ctx: PromptContext): string {
  const sdkInstallSuffix = ctx.sdkVersionExpr
    ? `@${ctx.sdkVersionExpr}`
    : '';

  const sdkInstallCmd = ctx.sdkVersionExpr
    ? `npm i --prefix .a5c @a5c-ai/babysitter-sdk${sdkInstallSuffix}`
    : 'npm i --prefix .a5c @a5c-ai/babysitter-sdk';

  const sdkSubshellCmd = ctx.sdkVersionExpr
    ? `(cd .a5c && npm i @a5c-ai/babysitter-sdk${sdkInstallSuffix})`
    : '(cd .a5c && npm i @a5c-ai/babysitter-sdk)';

  const augmentedCtx = {
    ...ctx,
    sdkInstallCmd,
    sdkSubshellCmd,
  };

  return renderTemplate(resolveTemplatePath('process-creation.md'), augmentedCtx as PromptContext & { sdkInstallCmd: string; sdkSubshellCmd: string });
}
