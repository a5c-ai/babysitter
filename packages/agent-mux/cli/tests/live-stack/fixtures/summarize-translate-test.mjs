/**
 * @process processes/live-stack/summarize-translate-test
 * @description Write a 12-paragraph summary of Homer's Odyssey, translate each paragraph
 *   to Greek, combine into a single markdown document and save to disk.
 * @inputs { traceId: string, outputDir: string }
 * @outputs { success: boolean, filePath: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const writeOdysseyTask = defineTask(
  'summarize-translate.write-odyssey',
  async ({ traceId, outputDir }, ctx) => {
    return ctx.agent({
      title: 'Write Odyssey summary with Greek translation',
      prompt: [
        'Write a 12-paragraph summary of Homer\'s Odyssey.',
        'Then translate each paragraph to Greek.',
        'Combine the English and Greek versions into one markdown document.',
        `Save the entire result in a single file write to ${outputDir}/${traceId}-odyssey.md`,
        'The file must be >500 bytes with real content.',
        'Return JSON: { filePath: string, size: number }',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Write Odyssey summary + Greek translation', labels: ['live-stack', 'test'] },
);

export async function process(inputs, ctx) {
  const { traceId = 'unknown', outputDir = '.a5c-live-test' } = inputs ?? {};
  const result = await ctx.task(writeOdysseyTask, { traceId, outputDir });
  return {
    success: !!(result?.filePath),
    filePath: result?.filePath ?? `${outputDir}/${traceId}-odyssey.md`,
  };
}
