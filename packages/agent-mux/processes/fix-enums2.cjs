const fs = require('fs');
const path = require('path');

const adaptersDir = 'packages/agent-mux/adapters/src';
const adapters = fs.readdirSync(adaptersDir).filter(f => f.endsWith('-adapter.ts') && f !== 'base-adapter.ts');

for (const a of adapters) {
  const filePath = path.join(adaptersDir, a);
  let code = fs.readFileSync(filePath, 'utf8');

  // Skip if we already replaced
  if (code.includes('executionModes: [')) continue;

  const isClaude = a.startsWith('claude');
  const isCodex = a.startsWith('codex');
  const isGemini = a.startsWith('gemini');

  const execModes = [
    "'interactive:text:stream'",
    "'interactive:text:non-stream'",
    "'non-interactive:text:stream'",
    "'non-interactive:text:non-stream'"
  ];
  if (isClaude || isCodex) {
    execModes.push("'interactive:jsonl:stream'", "'non-interactive:jsonl:stream'");
  }
  if (isClaude) {
    execModes.push("'interactive:jsonl:non-stream'", "'non-interactive:jsonl:non-stream'");
  }

  const steerModes = [];
  if (isClaude || isCodex || isGemini) {
    steerModes.push(
      "'interactive:text:stream'", "'interactive:text:non-stream'",
      "'non-interactive:text:stream'", "'non-interactive:text:non-stream'"
    );
  }
  if (isClaude || isCodex) {
    steerModes.push("'interactive:jsonl:stream'", "'non-interactive:jsonl:stream'");
  }
  if (isClaude) {
    steerModes.push("'interactive:jsonl:non-stream'", "'non-interactive:jsonl:non-stream'");
  }

  const queueModes = [];
  if (isCodex || isGemini) {
    queueModes.push(
      "'interactive:text:stream'", "'interactive:text:non-stream'",
      "'non-interactive:text:stream'", "'non-interactive:text:non-stream'"
    );
  }
  if (isCodex) {
    queueModes.push("'interactive:jsonl:stream'", "'non-interactive:jsonl:stream'");
  }

  // Remove the old flat properties
  code = code.replace(/supportsSteering:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsQueueing:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsNonInteractiveStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsInteractiveStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsJsonlStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsJsonlNonStream:\s*(true|false),?\s*/g, '');
  code = code.replace(/supportsAsyncLoopTools:\s*(true|false),?\s*/g, '');

  const toInject = `
    executionModes: [
      ${execModes.join(',\n      ')}
    ],
    steeringModes: [
      ${steerModes.join(',\n      ')}
    ],
    queueingModes: [
      ${queueModes.join(',\n      ')}
    ],
    supportsAsyncLoopTools: ${isClaude},`;

  code = code.replace(
    /(supportsFileAttachments:\s*(?:true|false),)/,
    `$1${toInject}`
  );

  fs.writeFileSync(filePath, code);
}
console.log('Enums updated successfully.');
