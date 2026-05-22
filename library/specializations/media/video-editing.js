/**
 * @process specializations/media/video-editing
 * @description Video-editing persona. Analyse source + request → select tool (Veo Edit, FFmpeg AI,
 *   DaVinci Resolve, RunwayML Edit, Video Enhance) → run per-op pipeline (temporal-inpaint |
 *   stabilise | color-grade | upscale | transitions | scene-cut | audio-sync) → validate frame
 *   consistency + audio sync.
 * @inputs { sourceAsset: string, operation: string, instructions: string, audioTrack?: string }
 * @outputs { success, operation, tool, outputAsset, validation }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/media/video-editing-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:video-processing, skill-area:media-encoding, skill-area:streaming-protocols]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyseSourceTask = defineTask(
  'video-editing.analyse-source',
  async ({ sourceAsset, operation, instructions }, ctx) => {
    return ctx.agent({
      title: 'Video-edit: analyse source + operation',
      prompt: [
        'Inspect source video (duration, fps, resolution, codec, scenes). Parse operation into canonical op:',
        '  temporal-inpaint | stabilise | color-grade | upscale | transitions | scene-cut | audio-sync | object-removal | style-transfer.',
        `Source asset: ${sourceAsset}`,
        `Operation: ${operation}`,
        `Instructions: ${instructions}`,
        'Return JSON: { canonicalOp, sourceMeta: object, scenes: Array<{ start, end }>, targetRegion?: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Analyse video edit', labels: ['a5c', 'video-editing'] },
);

const selectToolTask = defineTask(
  'video-editing.select-tool',
  async ({ canonicalOp }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Video-edit: select tool',
      prompt: [
        'Map canonical op to tool:',
        '  - temporal-inpaint / object-removal → Veo Edit',
        '  - stabilise / transcode / scene-cut → FFmpeg AI',
        '  - color-grade → DaVinci Resolve',
        '  - creative effects / style-transfer → RunwayML Edit',
        '  - upscale / denoise → Video Enhance',
        `Canonical op: ${canonicalOp}`,
        'Return JSON: { tool: string, rationale: string }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Select video-edit tool', labels: ['a5c', 'video-editing'] },
);

const applyEditTask = defineTask(
  'video-editing.apply-edit',
  async ({ sourceAsset, canonicalOp, tool, scenes, targetRegion, instructions, audioTrack }, ctx) => {
    return ctx.agent({
      title: `Video-edit: apply ${canonicalOp} via ${tool}`,
      prompt: [
        'Invoke the chosen MCP editing tool. Maintain version history + project files.',
        `Source: ${sourceAsset}`,
        `Op: ${canonicalOp}`,
        `Tool: ${tool}`,
        `Scenes: ${JSON.stringify(scenes ?? [])}`,
        `Target region: ${JSON.stringify(targetRegion ?? {})}`,
        `Instructions: ${instructions}`,
        `Audio track (if any): ${audioTrack ?? '(none)'}`,
        'Return JSON: { outputAsset: string, versionId: string, logs: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Apply video edit', labels: ['a5c', 'video-editing', 'mcp-genmedia'] },
);

const validateEditTask = defineTask(
  'video-editing.validate-edit',
  async ({ outputAsset, canonicalOp }, ctx) => {
    return ctx.agent({
      title: 'Video-edit: validate result',
      prompt: [
        'Verify frame consistency + continuity, proper audio sync, fps stability, color grading consistency,',
        'absence of temporal artifacts.',
        `Output asset: ${outputAsset}`,
        `Op: ${canonicalOp}`,
        'Return JSON: { passed: boolean, issues: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validate video edit', labels: ['a5c', 'video-editing'] },
);

export async function process(inputs, ctx) {
  const { sourceAsset = '', operation = '', instructions = '', audioTrack } = inputs ?? {};
  if (!sourceAsset || !operation) return { success: false, reason: 'missing sourceAsset or operation' };

  const analysis = await ctx.task(analyseSourceTask, { sourceAsset, operation, instructions });
  const canonicalOp = String(analysis?.canonicalOp ?? 'scene-cut');

  const selection = await ctx.task(selectToolTask, { canonicalOp });
  const tool = String(selection?.tool ?? 'FFmpeg AI');

  const applied = await ctx.task(applyEditTask, {
    sourceAsset,
    canonicalOp,
    tool,
    scenes: analysis?.scenes ?? [],
    targetRegion: analysis?.targetRegion,
    instructions,
    audioTrack,
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
