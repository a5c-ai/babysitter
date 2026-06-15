/**
 * @process specializations/media/speech-generation
 * @description Speech-generation persona. Analyse text + voice requirements (language, style,
 *   emotion, SSML) → select model (Chirp 3, Azure Speech, ElevenLabs, OpenAI TTS, AWS Polly) →
 *   synthesise via MCP GenMedia → validate naturalness / pronunciation / audio specs.
 * @inputs { text: string, language?: string, voice?: string, style?: string, emotion?: string, ssml?: boolean, pace?: number }
 * @outputs { success, model, outputAsset, validation }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/media/speech-generation-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:audio-processing, skill-area:media-encoding, skill-area:streaming-protocols]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const parseRequirementsTask = defineTask(
  'speech-generation.parse-requirements',
  async ({ text, language, voice, style, emotion, ssml, pace }, ctx) => {
    return ctx.agent({
      title: 'Speech-gen: parse voice requirements',
      prompt: [
        'Extract language, desired voice persona (male/female/age), accent, style (conversational/newscast/audiobook),',
        'emotion (happy/sad/excited/calm/professional/urgent), SSML usage, pace.',
        `Text length: ${String(text ?? '').length} chars`,
        `Language: ${language ?? '(auto-detect)'}`,
        `Voice hint: ${voice ?? '(unspecified)'}`,
        `Style: ${style ?? '(unspecified)'}`,
        `Emotion: ${emotion ?? '(neutral)'}`,
        `SSML: ${ssml ?? false}`,
        `Pace: ${pace ?? 1.0}`,
        'Return JSON: { language, voicePersona, accent, style, emotion, ssml: boolean, pace }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Parse speech requirements', labels: ['a5c', 'speech-generation'] },
);

const selectModelTask = defineTask(
  'speech-generation.select-model',
  async ({ requirements }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Speech-gen: select model',
      prompt: [
        'Pick the best model:',
        '  - highest naturalness → Chirp 3',
        '  - broad multilingual → Azure Speech',
        '  - expressive / emotional / voice-cloning → ElevenLabs',
        '  - conversational → OpenAI TTS',
        '  - reliable / consistent → AWS Polly',
        `Requirements: ${JSON.stringify(requirements, null, 2)}`,
        'Return JSON: { model: string, rationale: string }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Select speech model', labels: ['a5c', 'speech-generation'] },
);

const prepareSsmlTask = defineTask(
  'speech-generation.prepare-ssml',
  async ({ text, requirements }, ctx) => {
    return ctx.agent({
      title: 'Speech-gen: prepare SSML markup',
      prompt: [
        'Wrap the text in SSML with breaks/emphasis/prosody/phoneme markup as appropriate for the requirements.',
        `Text: ${text}`,
        `Requirements: ${JSON.stringify(requirements, null, 2)}`,
        'Return JSON: { ssml: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Prepare SSML', labels: ['a5c', 'speech-generation'] },
);

const synthesiseTask = defineTask(
  'speech-generation.synthesise',
  async ({ model, payload, requirements }, ctx) => {
    return ctx.agent({
      title: `Speech-gen: synthesise via ${model}`,
      prompt: [
        'Call MCP GenMedia speech tool. Preserve metadata (language, voice, model).',
        `Model: ${model}`,
        `Payload (text or SSML): ${payload}`,
        `Requirements: ${JSON.stringify(requirements, null, 2)}`,
        'Return JSON: { outputAsset: string, metadata: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Synthesise speech', labels: ['a5c', 'speech-generation', 'mcp-genmedia'] },
);

const validateTask = defineTask(
  'speech-generation.validate',
  async ({ outputAsset, requirements }, ctx) => {
    return ctx.agent({
      title: 'Speech-gen: validate',
      prompt: [
        'Verify naturalness, pronunciation, intonation, emotional accuracy, linguistic correctness, and',
        'technical audio specs (format, sample-rate, bitrate).',
        `Output asset: ${outputAsset}`,
        `Requirements: ${JSON.stringify(requirements, null, 2)}`,
        'Return JSON: { passed: boolean, issues: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validate speech', labels: ['a5c', 'speech-generation'] },
);

export async function process(inputs, ctx) {
  const { text = '', language, voice, style, emotion, ssml = false, pace } = inputs ?? {};
  if (!text) return { success: false, reason: 'missing text' };

  const requirements = await ctx.task(parseRequirementsTask, { text, language, voice, style, emotion, ssml, pace });
  const selection = await ctx.task(selectModelTask, { requirements });
  const model = String(selection?.model ?? 'Chirp 3');

  let payload = text;
  if (requirements?.ssml) {
    const wrapped = await ctx.task(prepareSsmlTask, { text, requirements });
    payload = String(wrapped?.ssml ?? text);
  }

  const synth = await ctx.task(synthesiseTask, { model, payload, requirements });
  const validation = await ctx.task(validateTask, { outputAsset: synth?.outputAsset, requirements });

  return {
    success: !!validation?.passed,
    model,
    outputAsset: synth?.outputAsset,
    validation,
  };
}
