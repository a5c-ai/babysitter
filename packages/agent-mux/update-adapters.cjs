const fs = require('fs');
const path = require('path');

const adaptersDir = 'packages/adapters/src';
const adapters = fs.readdirSync(adaptersDir).filter(f => f.endsWith('-adapter.ts') && f !== 'base-adapter.ts');

for (const a of adapters) {
  const filePath = path.join(adaptersDir, a);
  let code = fs.readFileSync(filePath, 'utf8');

  // Strip the old flat properties
  code = code.replace(/supportsSteering:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsQueueing:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsNonInteractiveStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsInteractiveStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsJsonlStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsJsonlNonStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsAsyncLoopTools:\s*(true|false),?\s*/g, '');

  const isClaude = a.startsWith('claude');
  const isCodex = a.startsWith('codex');
  const isGemini = a.startsWith('gemini');

  const toInject = `
    executionModes: {
      interactive: { stream: true, nonStream: true, jsonlStream: ${isClaude || isCodex}, jsonlNonStream: ${isClaude} },
      nonInteractive: { stream: true, nonStream: true, jsonlStream: ${isClaude || isCodex}, jsonlNonStream: ${isClaude} },
    },
    steering: {
      interactive: { stream: ${isClaude || isCodex || isGemini}, nonStream: ${isClaude || isCodex || isGemini}, jsonlStream: ${isClaude || isCodex}, jsonlNonStream: ${isClaude} },
      nonInteractive: { stream: ${isClaude || isCodex || isGemini}, nonStream: ${isClaude || isCodex || isGemini}, jsonlStream: ${isClaude || isCodex}, jsonlNonStream: ${isClaude} },
    },
    queueing: {
      interactive: { stream: ${isCodex || isGemini}, nonStream: ${isCodex || isGemini}, jsonlStream: ${isCodex}, jsonlNonStream: false },
      nonInteractive: { stream: ${isCodex || isGemini}, nonStream: ${isCodex || isGemini}, jsonlStream: ${isCodex}, jsonlNonStream: false },
    },
    supportsAsyncLoopTools: ${isClaude},`;

  code = code.replace(
    /(supportsFileAttachments:\s*(?:true|false),)/,
    `$1${toInject}`
  );

  fs.writeFileSync(filePath, code);
}
console.log('Adapters updated successfully.');
