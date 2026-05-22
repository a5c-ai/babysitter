/**
 * @process specializations/media/music-generation
 * @description Music-generation persona. Parse composition brief (genre/mood/duration/instruments)
 *   → select optimal model (Lyria, MusicLM, AIVA, Mubert, Amper) → generate via MCP GenMedia →
 *   apply mastering + stem separation if requested → validate musical coherence + technical audio.
 * @inputs { prompt: string, genre?: string, durationSec?: number, bpm?: number, key?: string, stems?: boolean, masterOutput?: boolean }
 * @outputs { success, model, outputAsset, stems?, validation }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/media/music-generation-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:audio-processing, skill-area:media-encoding, skill-area:prompt-engineering]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const parseBriefTask = defineTask(
  'music-generation.parse-brief',
  async ({ prompt, genre, durationSec, bpm, key }, ctx) => {
    return ctx.agent({
      title: 'Music-gen: parse composition brief',
      prompt: [
        'Extract musical elements: genre, mood, tempo (BPM), key signature, time signature, instrumentation, structure.',
        `Prompt: ${prompt}`,
        `Genre (hint): ${genre ?? '(unspecified)'}`,
        `Duration sec: ${durationSec ?? 60}`,
        `BPM (hint): ${bpm ?? '(auto)'}`,
        `Key (hint): ${key ?? '(auto)'}`,
        'Return JSON: { genre, mood, bpm, key, timeSignature, instruments: string[], structure: string, durationSec }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Parse music brief', labels: ['a5c', 'music-generation'] },
);

const selectModelTask = defineTask(
  'music-generation.select-model',
  async ({ brief }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Music-gen: select model',
      prompt: [
        'Pick a model:',
        '  - broad / diverse / highest-quality → Lyria',
        '  - text-to-music → MusicLM',
        '  - classical / orchestral → AIVA',
        '  - electronic / generative → Mubert',
        '  - commercial / background → Amper',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { model: string, rationale: string }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Select music model', labels: ['a5c', 'music-generation'] },
);

const generateCompositionTask = defineTask(
  'music-generation.generate-composition',
  async ({ brief, model }, ctx) => {
    return ctx.agent({
      title: `Music-gen: generate with ${model}`,
      prompt: [
        'Call MCP GenMedia music tool with the selected model and brief parameters.',
        `Model: ${model}`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { outputAsset: string, metadata: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Generate music', labels: ['a5c', 'music-generation', 'mcp-genmedia'] },
);

const stemsAndMasterTask = defineTask(
  'music-generation.stems-and-master',
  async ({ outputAsset, stems, masterOutput }, ctx) => {
    return ctx.agent({
      title: 'Music-gen: stems + master',
      prompt: [
        'If stems=true, produce per-instrument stem tracks. If masterOutput=true, apply professional mastering.',
        `Output asset: ${outputAsset}`,
        `Stems: ${stems}`,
        `Master: ${masterOutput}`,
        'Return JSON: { stems?: string[], masteredAsset?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Stems and mastering', labels: ['a5c', 'music-generation'] },
);

const validateTask = defineTask(
  'music-generation.validate',
  async ({ outputAsset, brief }, ctx) => {
    return ctx.agent({
      title: 'Music-gen: validate composition',
      prompt: [
        'Validate musical coherence (structure, harmony, tempo consistency), genre adherence,',
        'and technical audio (format, bitrate, frequency response, compression).',
        `Output asset: ${outputAsset}`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { passed: boolean, issues: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validate music', labels: ['a5c', 'music-generation'] },
);

export async function process(inputs, ctx) {
  const { prompt = '', genre, durationSec, bpm, key, stems = false, masterOutput = false } = inputs ?? {};
  if (!prompt) return { success: false, reason: 'missing prompt' };

  const brief = await ctx.task(parseBriefTask, { prompt, genre, durationSec, bpm, key });
  const selection = await ctx.task(selectModelTask, { brief });
  const model = String(selection?.model ?? 'Lyria');

  const composition = await ctx.task(generateCompositionTask, { brief, model });
  const outputAsset = composition?.outputAsset;

  let stemsOrMaster;
  if (stems || masterOutput) {
    stemsOrMaster = await ctx.task(stemsAndMasterTask, { outputAsset, stems, masterOutput });
  }

  const validation = await ctx.task(validateTask, { outputAsset: stemsOrMaster?.masteredAsset ?? outputAsset, brief });

  return {
    success: !!validation?.passed,
    model,
    outputAsset: stemsOrMaster?.masteredAsset ?? outputAsset,
    stems: stemsOrMaster?.stems,
    validation,
  };
}
