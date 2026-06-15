/**
 * @process processes/live-stack/omni-simple-test
 * @description Write a 6-section summary of Homer's Odyssey with Greek translations.
 * @inputs { traceId: string, outputDir: string }
 * @outputs { success: boolean, filePath: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const writeDocumentTask = defineTask('omni-simple.write-document', (args) => ({
  kind: 'agent',
  title: 'Write Odyssey summary with Greek translations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Literary scholar and translator',
      task: `Write a concise 6-section markdown summary of Homer's Odyssey. After each section, add one sentence translated to Greek (using Greek alphabet characters). Use ## headings for each section. Include the trace ID "${args.traceId}" at the top of the document.`,
      instructions: [
        'Use ## headings for each of the 6 sections.',
        'Each section should be 50-100 words.',
        'After each English section, add one Greek sentence.',
        'Return the complete markdown document.',
      ],
      outputFormat: 'markdown',
    },
    outputSchema: {
      type: 'object',
      required: ['markdown'],
      properties: {
        markdown: { type: 'string' },
      },
    },
  },
}));

const saveFileTask = defineTask('omni-simple.save-file', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Save Odyssey document to disk',
  shell: {
    command: 'node',
    args: [
      '-e',
      `const fs=require('fs');const path=require('path');` +
      `const dir=${JSON.stringify(args.outputDir)};` +
      `const file=path.join(dir,'${args.traceId}-odyssey.md');` +
      `fs.mkdirSync(dir,{recursive:true});` +
      `fs.writeFileSync(file,${JSON.stringify(args.markdown)},'utf8');` +
      `const size=fs.statSync(file).size;` +
      `process.stdout.write(JSON.stringify({success:true,filePath:file,size}));`,
    ],
    expectedExitCode: 0,
    timeout: 15000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const traceId = inputs?.traceId || globalThis.process?.env?.LIVE_STACK_TRACE_ID || 'unknown';
  const outputDir = inputs?.outputDir || globalThis.process?.env?.LIVE_STACK_OUTPUT_DIR || '.a5c-live-test';

  const document = await ctx.task(writeDocumentTask, { traceId });

  const markdown = typeof document === 'string' ? document
    : document?.markdown || document?.content || JSON.stringify(document);

  const result = JSON.parse(
    (await ctx.task(saveFileTask, { traceId, outputDir, markdown }))?.stdout || '{}'
  );

  return {
    success: result.success === true,
    filePath: result.filePath || `${outputDir}/${traceId}-odyssey.md`,
  };
}
