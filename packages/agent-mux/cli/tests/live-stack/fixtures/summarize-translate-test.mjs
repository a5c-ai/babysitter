/**
 * @process processes/live-stack/summarize-translate-test
 * @description Write a 12-paragraph summary of Homer's Odyssey, translate each paragraph
 *   to Greek, combine into a single markdown document and save to disk.
 * @inputs { traceId: string, outputDir: string }
 * @outputs { success: boolean, filePath: string, size: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SHARDS = [
  { id: 'opening-journeys', start: 1, end: 4, focus: 'Telemachus, Athena, Calypso, and Odysseus leaving Ogygia' },
  { id: 'wanderings', start: 5, end: 8, focus: 'Phaeacia and Odysseus recounting the Cyclops, Aeolus, Circe, and the dead' },
  { id: 'homecoming', start: 9, end: 12, focus: 'Ithaca, disguise, recognition, the bow contest, and restored household order' },
];

const paragraphSchema = {
  type: 'object',
  required: ['index', 'title', 'english'],
  properties: {
    index: { type: 'number' },
    title: { type: 'string' },
    english: { type: 'string' },
  },
};

const translationSchema = {
  type: 'object',
  required: ['index', 'greek'],
  properties: {
    index: { type: 'number' },
    greek: { type: 'string' },
  },
};

function encodePayload(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
}

function parseShellJson(result) {
  const stdout = typeof result === 'string' ? result : result?.stdout;
  if (!stdout || typeof stdout !== 'string') {
    throw new Error('task did not produce JSON stdout');
  }
  return JSON.parse(stdout.trim());
}

const prepareOutputDirScript = String.raw`
const fs = require('node:fs');
const payload = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8'));
fs.mkdirSync(payload.outputDir, { recursive: true });
process.stdout.write(JSON.stringify({ success: true, outputDir: payload.outputDir }));
`;

const assembleDocumentScript = String.raw`
const fs = require('node:fs');
const path = require('node:path');
const payload = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8'));
const paragraphs = new Map();
for (const shard of payload.summaryShards) {
  for (const paragraph of shard.paragraphs) {
    const index = Number(paragraph.index);
    paragraphs.set(index, {
      index,
      title: String(paragraph.title).trim(),
      english: String(paragraph.english).trim(),
    });
  }
}
const translations = new Map();
for (const shard of payload.translationShards) {
  for (const translation of shard.translations) {
    translations.set(Number(translation.index), String(translation.greek).trim());
  }
}
const lines = [
  '# Homer\'s Odyssey — Summary and Greek Translation',
  '',
  'Trace: ' + payload.traceId,
  '',
];
for (let index = 1; index <= 12; index += 1) {
  const paragraph = paragraphs.get(index);
  const greek = translations.get(index);
  if (!paragraph || !paragraph.title || !paragraph.english || !greek) {
    throw new Error('missing assembled paragraph or translation for index ' + index);
  }
  lines.push('## ' + index + '. ' + paragraph.title, '', paragraph.english, '', '**Greek:**', '', greek, '');
}
const markdown = lines.join('\n').trim() + '\n';
fs.mkdirSync(path.dirname(payload.filePath), { recursive: true });
fs.writeFileSync(payload.filePath, markdown, 'utf8');
const size = fs.statSync(payload.filePath).size;
if (size <= 500) {
  throw new Error('assembled document too small: ' + size + ' bytes');
}
process.stdout.write(JSON.stringify({ success: true, filePath: payload.filePath, size }));
`;

const verifyDocumentScript = String.raw`
const fs = require('node:fs');
const payload = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8'));
const content = fs.readFileSync(payload.filePath, 'utf8');
const size = Buffer.byteLength(content, 'utf8');
const headingMatches = content.match(/^##\s+\d+\./gm);
const headingCount = headingMatches ? headingMatches.length : 0;
const hasGreek = /[\u0370-\u03ff]/.test(content);
if (size <= 500) throw new Error('document too small: ' + size + ' bytes');
if (headingCount !== 12) throw new Error('expected 12 paragraph headings, found ' + headingCount);
if (!hasGreek) throw new Error('document does not contain Greek characters');
process.stdout.write(JSON.stringify({ success: true, filePath: payload.filePath, size, headingCount, hasGreek }));
`;

const prepareOutputDirTask = defineTask('summarize-translate.prepare-output-dir', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prepare live-stack output directory',
  shell: {
    command: 'node',
    args: ['-e', prepareOutputDirScript, encodePayload({ outputDir: args.outputDir })],
    expectedExitCode: 0,
    timeout: 30_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const planOutlineTask = defineTask('summarize-translate.plan-outline', (args) => ({
  kind: 'agent',
  title: 'Plan 12-paragraph Odyssey outline',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Classics editor',
      task: 'Plan the 12-paragraph structure for a concise but complete summary of Homer\'s Odyssey.',
      context: { paragraphCount: args.paragraphCount, shards: args.shards },
      instructions: [
        'Return exactly 12 outline entries, one per paragraph.',
        'Respect the shard boundaries so parallel writing agents can work independently.',
        'Keep titles short and specific to the episode covered.',
      ],
      outputFormat: 'JSON only',
    },
    outputSchema: {
      type: 'object',
      required: ['sections'],
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            required: ['index', 'title', 'focus'],
            properties: {
              index: { type: 'number' },
              title: { type: 'string' },
              focus: { type: 'string' },
            },
          },
        },
      },
    },
  },
}));

const writeSummaryShardTask = defineTask('summarize-translate.write-summary-shard', (args) => ({
  kind: 'agent',
  title: `Write Odyssey summary paragraphs ${args.shard.start}-${args.shard.end}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Literary summarizer',
      task: `Write English summary paragraphs ${args.shard.start}-${args.shard.end} of Homer\'s Odyssey.`,
      context: { shard: args.shard, outline: args.outline },
      instructions: [
        'Write one substantial English paragraph for each assigned index.',
        'Each paragraph should be 70-110 words and preserve narrative continuity.',
        'Do not translate yet; focus only on polished English source text.',
        'Return only paragraphs within the assigned start/end range.',
      ],
      outputFormat: 'JSON only',
    },
    outputSchema: {
      type: 'object',
      required: ['shardId', 'paragraphs'],
      properties: {
        shardId: { type: 'string' },
        paragraphs: { type: 'array', items: paragraphSchema },
      },
    },
  },
}));

const translateShardTask = defineTask('summarize-translate.translate-shard', (args) => ({
  kind: 'agent',
  title: `Translate Odyssey paragraphs ${args.shard.start}-${args.shard.end} to Greek`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Greek translator',
      task: `Translate English Odyssey summary paragraphs ${args.shard.start}-${args.shard.end} into Greek.`,
      context: { shard: args.shard, summaryShard: args.summaryShard },
      instructions: [
        'Translate every paragraph in the summaryShard input.',
        'Preserve the paragraph index exactly.',
        'Use fluent Modern Greek with enough detail to correspond to the English source.',
        'Do not add markdown; return structured JSON only.',
      ],
      outputFormat: 'JSON only',
    },
    outputSchema: {
      type: 'object',
      required: ['shardId', 'translations'],
      properties: {
        shardId: { type: 'string' },
        translations: { type: 'array', items: translationSchema },
      },
    },
  },
}));

const assembleDocumentTask = defineTask('summarize-translate.assemble-document', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Assemble Odyssey markdown document',
  shell: {
    command: 'node',
    args: ['-e', assembleDocumentScript, encodePayload(args)],
    expectedExitCode: 0,
    timeout: 30_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyDocumentTask = defineTask('summarize-translate.verify-document', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Odyssey markdown artifact',
  shell: {
    command: 'node',
    args: ['-e', verifyDocumentScript, encodePayload(args)],
    expectedExitCode: 0,
    timeout: 30_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const traceId = inputs?.traceId || globalThis.process?.env?.LIVE_STACK_TRACE_ID || 'unknown';
  const outputDir = inputs?.outputDir || globalThis.process?.env?.LIVE_STACK_OUTPUT_DIR || '.a5c-live-test';
  const filePath = `${outputDir}/${traceId}-odyssey.md`;

  const [, outline] = await ctx.parallel.all([
    async () => ctx.task(prepareOutputDirTask, { outputDir }),
    async () => ctx.task(planOutlineTask, { paragraphCount: 12, shards: SHARDS }),
  ], { maxConcurrency: 2 });

  const summaryShards = await ctx.parallel.all(
    SHARDS.map((shard) => async () => ctx.task(writeSummaryShardTask, { shard, outline })),
    { maxConcurrency: SHARDS.length },
  );

  const translationShards = await ctx.parallel.all(
    SHARDS.map((shard, index) => async () => ctx.task(translateShardTask, {
      shard,
      summaryShard: summaryShards[index],
    })),
    { maxConcurrency: SHARDS.length },
  );

  const assembled = parseShellJson(await ctx.task(assembleDocumentTask, {
    traceId,
    outputDir,
    filePath,
    summaryShards,
    translationShards,
  }));

  const verified = parseShellJson(await ctx.task(verifyDocumentTask, { filePath }));

  return {
    success: verified.success === true,
    filePath: verified.filePath ?? assembled.filePath ?? filePath,
    size: verified.size ?? assembled.size ?? 0,
  };
}

