/**
 * @process specializations/communication/content-validator
 * @description Content-validator persona (a5c content-validator-agent). Acts as devil's
 *   advocate: stress-tests text for clarity, jargon, ambiguity, audience-fit, metaphors,
 *   and consistency. Returns structured feedback with rewrite suggestions — never accepts
 *   the message at face value.
 * @inputs { content: string, audiences?: string[] }
 * @outputs { success: boolean, feedback: object }
 *
 * Source: a5c-ai/registry/prompts/communication/content-validator-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const critiqueTask = defineTask(
  'content-validator.critique',
  async ({ content, audiences }, ctx) => {
    return ctx.agent({
      title: 'Content-validator: multi-lens critique',
      prompt: [
        'You are the content-validator-agent — a devil\'s advocate content critic.',
        'Your goal is to stress-test the message, not accept it at face value.',
        'Produce structured feedback in these categories (each with examples + rewrite suggestions):',
        ' 1. Clarity audit — vague, complex, jargon-heavy passages.',
        ' 2. Message challenge — would a first-time visitor instantly understand?',
        ' 3. Ambiguity hunt — misinterpretable phrases or CTAs.',
        ' 4. Audience perspective flip — technical / non-technical / investor / casual user views.',
        ' 5. Alternative suggestions — sharper, simpler rewrites.',
        ' 6. Impact check — does every headline/subheading/visual support the core message?',
        ' 7. Consistency sweep — tone, terminology, value propositions.',
        ' 8. Metaphor analyzer — accuracy, gaps, better alternatives.',
        ' 9. Simplification opportunities.',
        '10. Additional constructive feedback.',
        `Audiences: ${JSON.stringify(audiences ?? ['technical', 'non-technical', 'investor', 'casual'])}`,
        `Content:\n${(content ?? '').slice(0, 40000)}`,
        'Return JSON: { clarity, messageChallenge, ambiguity, audiencePerspectives, alternatives, impact, consistency, metaphors, simplifications, other }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-validator critique', labels: ['a5c', 'content-validator'] },
);

export async function process(inputs, ctx) {
  const { content = '', audiences } = inputs ?? {};
  const feedback = await ctx.task(critiqueTask, { content, audiences });
  return {
    success: true,
    feedback: feedback ?? {},
  };
}
