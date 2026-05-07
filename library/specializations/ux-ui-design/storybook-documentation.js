/**
 * @process specializations/ux-ui-design/storybook-documentation
 * @description Ensure every public component ships Storybook stories covering default, variants, edge states, and a11y.
 * @inputs { componentPath: string, componentName: string, existingStories?: Array<string>, variantsDeclared?: Array<string> }
 * @outputs { success: boolean, missingStories: Array<string>, generatedStoryPath?: string, a11yNotes?: Array<string> }
 * @graph
 *   domains: [domain:web-development]
 *   specializations: [specialization:ux-ui-design]
 *   skillAreas: [skill-area:design-systems, skill-area:interaction-design]
 *   roles: [role:product-designer, role:ux-researcher]
 *   workflows: [workflow:user-feedback-loop, workflow:product-discovery]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const REQUIRED_STORY_KINDS = ['Default', 'AllVariants', 'Loading', 'Empty', 'Error', 'Disabled', 'LongContent'];

const generateTask = defineTask(
  'storybook-docs.generate',
  async ({ componentPath, componentName, variantsDeclared, missing }, ctx) => {
    return ctx.agent({
      title: `Generate Storybook stories for ${componentName}`,
      prompt: [
        `Generate Storybook stories for ${componentName} at ${componentPath}.`,
        `Variants: ${JSON.stringify(variantsDeclared ?? [])}`,
        `Missing story kinds to produce: ${JSON.stringify(missing)}`,
        'Rules:',
        '- Use CSF3 format (`Meta`/`StoryObj`).',
        '- Include `argTypes` with controls for every prop; attach a `parameters.docs.description.component` paragraph.',
        '- Add `play` functions for interactive states where relevant.',
        '- Include a11y notes: keyboard traversal, screen-reader labels, color-contrast expectations.',
        'Return JSON: { storyFileContent: string, a11yNotes: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Generate stories', labels: ['ux', 'storybook', 'documentation'] },
);

function missingKinds(existing) {
  const present = new Set((existing ?? []).map((s) => s.replace(/\.stories\.[jt]sx?$/, '').split(/[./]/).pop()));
  return REQUIRED_STORY_KINDS.filter((k) => !present.has(k));
}

export async function process(inputs, ctx) {
  const { componentPath, componentName, existingStories = [] } = inputs;
  const missing = missingKinds(existingStories);
  if (missing.length === 0) {
    return { success: true, missingStories: [] };
  }
  const generated = await ctx.task(generateTask, { ...inputs, missing });
  const storyFilePath = componentPath.replace(/\.[jt]sx?$/, '.stories.tsx');
  return {
    success: false,
    missingStories: missing,
    generatedStoryPath: storyFilePath,
    a11yNotes: generated.a11yNotes ?? [],
    storyFileContent: generated.storyFileContent,
    _meta: { componentName },
  };
}
