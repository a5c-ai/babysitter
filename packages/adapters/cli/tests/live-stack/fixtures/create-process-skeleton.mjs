/**
 * @process processes/live-stack/odyssey-live-test
 * @description Create-mode Odyssey process fixture with a small, deterministic authoring surface.
 * @reference methodologies/spec-kit-brownfield.js; methodologies/process-hardening/process-hardening-patterns.js
 * @inputs { traceId: string, outputDir: string }
 * @outputs { success: boolean, filePath: string, size: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SECTIONS = [
  ['Invocation', 'The Odyssey opens with a poet asking the Muse to recall the long struggle of Odysseus after Troy. His crew is gone, his home is threatened, and his journey shows how longing for home can survive storms, monsters, and divine anger.'],
  ['Telemachus', 'In Ithaca, Telemachus grows under pressure from suitors who consume his household. Athena urges him to seek news of his father, and the journey changes him from a watched child into a young man ready to defend his family.'],
  ['Ogygia', 'Odysseus is trapped with Calypso, offered ease and immortality but still grieving for Ithaca. Zeus orders his release, and the hero builds a raft because home matters more than comfort, safety, or eternal delay.'],
  ['Phaeacia', 'After Poseidon wrecks the raft, Odysseus reaches Phaeacia as a stranger. Nausicaa and the royal house receive him with care, proving that hospitality can restore dignity before a wanderer even speaks his name.'],
  ['Cyclops', 'Odysseus remembers the Cyclops cave, where clever speech and disciplined timing save the crew from Polyphemus. His later boast wins fame but also calls down Poseidon, turning intelligence into a costly victory.'],
  ['Aeolus and Circe', 'The wandering continues through Aeolus, the Laestrygonians, and Circe. Each stop tests trust, restraint, and leadership, while Circe becomes both danger and guide when Odysseus must learn how to continue.'],
  ['Underworld', 'In the land of the dead, Odysseus hears prophecy, grief, and memory. Tiresias warns him about the cattle of the Sun, and meetings with lost companions teach that survival carries obligations to the dead.'],
  ['Sirens and Scylla', 'The Sirens, Scylla, Charybdis, and the cattle of Helios compress the voyage into hard choices. Odysseus survives by planning, but his crew hunger and disobedience complete the ruin already foretold.'],
  ['Return', 'Phaeacian ships finally bring Odysseus to Ithaca, where Athena hides him in beggar form. The disguise lets him study servants, suitors, and kin before acting, making patience part of heroic strength.'],
  ['Recognition', 'Eumaeus, Telemachus, Argos, and Eurycleia reveal different kinds of loyalty and recognition. Odysseus rebuilds his household first through trust, then through signs that only the faithful understand.'],
  ['Bow', 'Penelope sets the bow contest, and the suitors fail at the weapon that belongs to the absent king. When Odysseus strings it, hidden identity becomes open judgment, and the hall turns from feast to reckoning.'],
  ['Peace', 'The poem ends beyond vengeance, as Penelope tests Odysseus through the secret of their bed and Athena restrains wider bloodshed. Homecoming becomes not just return, but the restoration of memory, marriage, and civic order.'],
];

function encodePayload(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
}

function parseShellJson(result) {
  const stdout = typeof result === 'string' ? result : result?.stdout;
  if (!stdout || typeof stdout !== 'string') throw new Error('task did not produce JSON stdout');
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
const greek = [
  'Ο Οδυσσέας ποθεί την Ιθάκη και ζητά δρόμο μέσα από δοκιμασίες.',
  'Ο Τηλέμαχος μαθαίνει να στέκεται απέναντι στους μνηστήρες.',
  'Η Καλυψώ προσφέρει αθανασία, αλλά η πατρίδα μένει ισχυρότερη.',
  'Οι Φαίακες δείχνουν φιλοξενία και ακούν την ιστορία του ξένου.',
  'Ο Κύκλωπας νικιέται με τέχνη, όμως η ύβρη φέρνει οργή.',
  'Η Κίρκη γίνεται κίνδυνος και οδηγός για το δύσκολο ταξίδι.',
  'Στον Άδη, η μνήμη και η προφητεία διδάσκουν ευθύνη.',
  'Οι Σειρήνες και η Σκύλλα απαιτούν πειθαρχία και θυσία.',
  'Η Ιθάκη δέχεται τον ήρωα κρυμμένο, ώστε να δοκιμάσει την πίστη.',
  'Οι πιστοί αναγνωρίζουν τον κύριο μέσα από σημάδια και μνήμη.',
  'Το τόξο φανερώνει τον βασιλιά και φέρνει δίκαιη κρίση.',
  'Η ειρήνη επιστρέφει όταν ο οίκος, ο γάμος και η πόλη ενώνονται.',
];
const lines = ['# Homer\\'s Odyssey - Summary and Greek Translation', '', 'Trace: ' + payload.traceId, ''];
payload.sections.forEach(([title, english], index) => {
  lines.push('## ' + (index + 1) + '. ' + title, '', english, '', '**Greek:**', '', greek[index], '');
});
const markdown = lines.join('\n').trim() + '\n';
fs.mkdirSync(path.dirname(payload.filePath), { recursive: true });
fs.writeFileSync(payload.filePath, markdown, 'utf8');
process.stdout.write(JSON.stringify({ success: true, filePath: payload.filePath, size: Buffer.byteLength(markdown, 'utf8') }));
`;

const verifyDocumentScript = String.raw`
const fs = require('node:fs');
const payload = JSON.parse(Buffer.from(process.argv[1], 'base64').toString('utf8'));
const content = fs.readFileSync(payload.filePath, 'utf8');
const size = Buffer.byteLength(content, 'utf8');
const headingCount = (content.match(/^##\s+\d+\./gm) || []).length;
const hasGreek = /[\u0370-\u03ff]/u.test(content);
if (size <= 500) throw new Error('document too small: ' + size + ' bytes');
if (headingCount !== 12) throw new Error('expected 12 paragraph headings, found ' + headingCount);
if (!hasGreek) throw new Error('document does not contain Greek characters');
process.stdout.write(JSON.stringify({ success: true, filePath: payload.filePath, size, headingCount, hasGreek }));
`;

const prepareOutputDirTask = defineTask('odyssey-create.prepare-output-dir', (args, taskCtx) => ({
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

const inspectSectionsTask = defineTask('odyssey-create.inspect-sections', (args) => ({
  kind: 'agent',
  title: 'Inspect deterministic Odyssey sections',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Classics editor',
      task: 'Confirm the provided Odyssey section plan is coherent and ready for assembly.',
      context: { sectionCount: args.sections.length },
      instructions: ['Return JSON with approved true and a short note.'],
      outputFormat: 'JSON only',
    },
  },
}));

const assembleDocumentTask = defineTask('odyssey-create.assemble-document', (args, taskCtx) => ({
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

const verifyDocumentTask = defineTask('odyssey-create.verify-document', (args, taskCtx) => ({
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
  const { traceId = 'unknown', outputDir = '.a5c-live-test' } = inputs ?? {};
  const filePath = `${outputDir}/${traceId}-odyssey.md`;

  await ctx.parallel.all([
    async () => ctx.task(prepareOutputDirTask, { outputDir }),
    async () => ctx.task(inspectSectionsTask, { sections: SECTIONS }),
  ], { maxConcurrency: 2 });

  const assembled = parseShellJson(await ctx.task(assembleDocumentTask, {
    traceId,
    outputDir,
    filePath,
    sections: SECTIONS,
  }));

  const verified = parseShellJson(await ctx.task(verifyDocumentTask, { filePath }));

  return {
    success: verified.success === true,
    filePath: verified.filePath ?? assembled.filePath ?? filePath,
    size: verified.size ?? assembled.size ?? 0,
  };
}
