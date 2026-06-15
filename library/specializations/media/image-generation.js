/**
 * @process specializations/media/image-generation
 * @description Image-generation persona. Parse creative brief → select optimal model
 *   (Imagen 3/4, Flux, DALL-E, Stable Diffusion) → generate variants in parallel →
 *   validate technical + creative quality → organise outputs with metadata.
 * @inputs { prompt: string, style?: string, aspectRatio?: string, variants?: number, format?: string }
 * @outputs { success, model, outputs, validated }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/media/image-generation-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:image-processing, skill-area:media-encoding, skill-area:prompt-engineering]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyseBriefTask = defineTask(
  'image-generation.analyse-brief',
  async ({ prompt, style, aspectRatio, format }, ctx) => {
    return ctx.agent({
      title: 'Image-gen: analyse creative brief',
      prompt: [
        'Parse the brief for visual elements (subject, composition, mood, lighting), style, and platform target.',
        'Recommend optimal aspect ratio + format if not specified.',
        `Prompt: ${prompt}`,
        `Style (if any): ${style ?? '(unspecified)'}`,
        `Aspect ratio (if any): ${aspectRatio ?? '(unspecified)'}`,
        `Format (if any): ${format ?? 'PNG'}`,
        'Return JSON: { subject, composition, mood, style, aspectRatio, format, colorMode }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Analyse image brief', labels: ['a5c', 'image-generation'] },
);

const selectModelTask = defineTask(
  'image-generation.select-model',
  async ({ brief }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Image-gen: select model',
      prompt: [
        'Pick a model based on the brief:',
        '  - photorealistic/detailed → Imagen 3/4',
        '  - creative/artistic → Flux',
        '  - versatile general → DALL-E',
        '  - customisable style → Stable Diffusion',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { model: string, rationale: string, parameters: object }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Select image model', labels: ['a5c', 'image-generation'] },
);

const generateVariantTask = defineTask(
  'image-generation.generate-variant',
  async ({ prompt, brief, model, parameters, variantIndex }, ctx) => {
    return ctx.agent({
      title: `Image-gen: generate variant ${variantIndex + 1}`,
      prompt: [
        'Call MCP GenMedia image tool with the selected model and parameters. Generate one variant.',
        `Prompt: ${prompt}`,
        `Model: ${model}`,
        `Parameters: ${JSON.stringify(parameters, null, 2)}`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        `Variant index: ${variantIndex}`,
        'Return JSON: { assetPath: string, metadata: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Generate image variant', labels: ['a5c', 'image-generation', 'mcp-genmedia'] },
);

const validateQualityTask = defineTask(
  'image-generation.validate-quality',
  async ({ outputs, brief }, ctx) => {
    return ctx.agent({
      title: `Image-gen: validate ${outputs.length} output(s)`,
      prompt: [
        'Validate technical (resolution, aspect ratio, format, color mode) AND creative',
        '(visual coherence, style adherence, content safety) quality. Flag any failures for regeneration.',
        `Outputs: ${JSON.stringify(outputs, null, 2)}`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { passed: string[], failed: Array<{ assetPath, reason }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validate image quality', labels: ['a5c', 'image-generation'] },
);

export async function process(inputs, ctx) {
  const { prompt = '', style, aspectRatio, variants = 1, format } = inputs ?? {};
  if (!prompt) return { success: false, reason: 'missing prompt' };

  const brief = await ctx.task(analyseBriefTask, { prompt, style, aspectRatio, format });
  const selection = await ctx.task(selectModelTask, { brief });
  const model = String(selection?.model ?? 'Imagen');
  const parameters = selection?.parameters ?? {};

  const batch = Array.from({ length: Math.max(1, variants) }, (_, i) => i);
  const outputs = await ctx.parallel.map(batch, (variantIndex) =>
    ctx.task(generateVariantTask, { prompt, brief, model, parameters, variantIndex }),
  );

  const validated = await ctx.task(validateQualityTask, { outputs, brief });

  return {
    success: true,
    model,
    outputs,
    validated,
  };
}
