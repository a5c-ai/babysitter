/**
 * @process specializations/media/image-editing
 * @description Image-editing persona. Analyse source + operation request → select tool
 *   (Imagen Edit, DALL-E Edit, Stability Edit, Photoshop AI, Upscaler) → apply operation
 *   (inpaint | outpaint | object-removal | background-replace | style-transfer | upscale) →
 *   validate edge quality / color consistency / artifact absence.
 * @inputs { sourceAsset: string, operation: string, instructions: string, targetFormat?: string }
 * @outputs { success, operation, tool, outputAsset, validation }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/media/image-editing-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:image-processing, skill-area:media-encoding, skill-area:visual-design]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyseSourceTask = defineTask(
  'image-editing.analyse-source',
  async ({ sourceAsset, operation, instructions }, ctx) => {
    return ctx.agent({
      title: 'Image-edit: analyse source + operation',
      prompt: [
        'Inspect the source image and parse the operation. Identify regions of interest, edges, palette, resolution.',
        'Map the operation to one of: inpaint | outpaint | object-removal | background-replace | style-transfer | upscale | restoration | color-correction.',
        `Source asset: ${sourceAsset}`,
        `Operation: ${operation}`,
        `Instructions: ${instructions}`,
        'Return JSON: { canonicalOp: string, regions: object, sourceMeta: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Analyse image edit', labels: ['a5c', 'image-editing'] },
);

const selectToolTask = defineTask(
  'image-editing.select-tool',
  async ({ canonicalOp }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Image-edit: select tool',
      prompt: [
        'Pick the best tool:',
        '  - inpaint/outpaint/object-removal → Imagen Edit',
        '  - variations/style-mod → DALL-E Edit',
        '  - customisable style → Stability Edit',
        '  - pro detail work → Photoshop AI',
        '  - upscale/denoise → Upscaler',
        `Canonical op: ${canonicalOp}`,
        'Return JSON: { tool: string, rationale: string }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Select edit tool', labels: ['a5c', 'image-editing'] },
);

const applyEditTask = defineTask(
  'image-editing.apply-edit',
  async ({ sourceAsset, canonicalOp, tool, regions, instructions, targetFormat }, ctx) => {
    return ctx.agent({
      title: `Image-edit: apply ${canonicalOp} via ${tool}`,
      prompt: [
        'Invoke the chosen MCP editing tool. Preserve metadata; keep version history.',
        `Source: ${sourceAsset}`,
        `Op: ${canonicalOp}`,
        `Tool: ${tool}`,
        `Regions: ${JSON.stringify(regions, null, 2)}`,
        `Instructions: ${instructions}`,
        `Target format: ${targetFormat ?? 'PNG'}`,
        'Return JSON: { outputAsset: string, versionId: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Apply image edit', labels: ['a5c', 'image-editing', 'mcp-genmedia'] },
);

const validateEditTask = defineTask(
  'image-editing.validate-edit',
  async ({ outputAsset, canonicalOp }, ctx) => {
    return ctx.agent({
      title: 'Image-edit: validate result',
      prompt: [
        'Verify: edge quality/naturalness, color consistency, absence of artifacts, technical spec compliance.',
        `Output asset: ${outputAsset}`,
        `Op: ${canonicalOp}`,
        'Return JSON: { passed: boolean, issues: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validate edit', labels: ['a5c', 'image-editing'] },
);

export async function process(inputs, ctx) {
  const { sourceAsset = '', operation = '', instructions = '', targetFormat } = inputs ?? {};
  if (!sourceAsset || !operation) return { success: false, reason: 'missing sourceAsset or operation' };

  const analysis = await ctx.task(analyseSourceTask, { sourceAsset, operation, instructions });
  const canonicalOp = String(analysis?.canonicalOp ?? 'inpaint');

  const selection = await ctx.task(selectToolTask, { canonicalOp });
  const tool = String(selection?.tool ?? 'Imagen Edit');

  const applied = await ctx.task(applyEditTask, {
    sourceAsset,
    canonicalOp,
    tool,
    regions: analysis?.regions ?? {},
    instructions,
    targetFormat,
  });

  const validation = await ctx.task(validateEditTask, {
    outputAsset: applied?.outputAsset,
    canonicalOp,
  });

  return {
    success: !!validation?.passed,
    operation: canonicalOp,
    tool,
    outputAsset: applied?.outputAsset,
    validation,
  };
}
