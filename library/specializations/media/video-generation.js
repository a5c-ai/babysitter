/**
 * @process specializations/media/video-generation
 * @description Video-generation persona. Parse request (text-to-video | image-to-video | video-to-video) →
 *   select optimal model (Veo 2/3, Luma, RunwayML, Stable Video, Minimax) → generate via MCP GenMedia
 *   with camera/lighting/composition parameters → validate technical + content quality → retry
 *   with fallback model on low-quality outputs.
 * @inputs { prompt?: string, sourceImage?: string, sourceVideo?: string, durationSec?: number, resolution?: string, fps?: number, style?: string }
 * @outputs { success, method, model, output?, retries }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/media/video-generation-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:video-processing, skill-area:media-encoding, skill-area:streaming-protocols]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyseRequestTask = defineTask(
  'video-generation.analyse-request',
  async ({ prompt, sourceImage, sourceVideo, durationSec, resolution, fps, style }, ctx) => {
    return ctx.agent({
      title: 'Video-gen: analyse request',
      prompt: [
        'Determine the generation method: "text-to-video" | "image-to-video" | "video-to-video".',
        'Extract scene / camera movement / lighting / composition parameters from the prompt.',
        `Prompt: ${prompt ?? '(none)'}`,
        `Source image: ${sourceImage ?? '(none)'}`,
        `Source video: ${sourceVideo ?? '(none)'}`,
        `Duration sec: ${durationSec ?? 10}`,
        `Resolution: ${resolution ?? '1080p'}`,
        `FPS: ${fps ?? 30}`,
        `Style: ${style ?? '(unspecified)'}`,
        'Return JSON: { method, scene: object, camera: object, lighting: object, composition: object, technical: { resolution, fps, codec, durationSec } }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Analyse video request', labels: ['a5c', 'video-generation'] },
);

const selectModelTask = defineTask(
  'video-generation.select-model',
  async ({ brief }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Video-gen: select model',
      prompt: [
        'Pick primary + fallback model:',
        '  - photorealistic → Veo 2/3 primary; RunwayML fallback',
        '  - creative/artistic → Luma Dream Machine primary; Veo fallback',
        '  - professional effects → RunwayML primary; Veo fallback',
        '  - custom workflow → Stable Video',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { model: string, fallback: string, rationale: string, parameters: object }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Select video model', labels: ['a5c', 'video-generation'] },
);

const generateVideoTask = defineTask(
  'video-generation.generate',
  async ({ brief, model, parameters, sourceImage, sourceVideo }, ctx) => {
    return ctx.agent({
      title: `Video-gen: generate with ${model}`,
      prompt: [
        'Call MCP GenMedia video tool with selected model and parameters. Return the asset path + metadata.',
        `Model: ${model}`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        `Parameters: ${JSON.stringify(parameters, null, 2)}`,
        `Source image: ${sourceImage ?? '(none)'}`,
        `Source video: ${sourceVideo ?? '(none)'}`,
        'Return JSON: { assetPath: string, metadata: object, qualityScore?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Generate video', labels: ['a5c', 'video-generation', 'mcp-genmedia'] },
);

const validateOutputTask = defineTask(
  'video-generation.validate-output',
  async ({ output, brief }, ctx) => {
    return ctx.agent({
      title: 'Video-gen: validate output',
      prompt: [
        'Validate frame-rate consistency, resolution, aspect ratio, color accuracy, audio sync (if any),',
        'visual coherence, content-policy compliance.',
        `Output: ${JSON.stringify(output, null, 2)}`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { passed: boolean, issues: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validate video output', labels: ['a5c', 'video-generation'] },
);

export async function process(inputs, ctx) {
  const { prompt, sourceImage, sourceVideo, durationSec, resolution, fps, style } = inputs ?? {};
  const brief = await ctx.task(analyseRequestTask, { prompt, sourceImage, sourceVideo, durationSec, resolution, fps, style });
  const method = String(brief?.method ?? 'text-to-video');

  const selection = await ctx.task(selectModelTask, { brief });
  const primary = String(selection?.model ?? 'Veo');
  const fallback = String(selection?.fallback ?? 'RunwayML');
  const parameters = selection?.parameters ?? {};

  let output = await ctx.task(generateVideoTask, { brief, model: primary, parameters, sourceImage, sourceVideo });
  let validation = await ctx.task(validateOutputTask, { output, brief });

  let retries = 0;
  let model = primary;
  if (!validation?.passed) {
    retries = 1;
    model = fallback;
    output = await ctx.task(generateVideoTask, { brief, model: fallback, parameters, sourceImage, sourceVideo });
    validation = await ctx.task(validateOutputTask, { output, brief });
  }

  return {
    success: !!validation?.passed,
    method,
    model,
    output,
    retries,
    validation,
  };
}
