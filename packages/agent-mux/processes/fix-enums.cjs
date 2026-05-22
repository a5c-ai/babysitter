const fs = require('fs');
const path = require('path');

// 1. Update capabilities.ts
let capsPath = 'packages/agent-mux/core/src/capabilities.ts';
let capsCode = fs.readFileSync(capsPath, 'utf8');

const newTypes = `
export type ExecutionMode =
  | 'interactive:text:stream'
  | 'interactive:text:non-stream'
  | 'interactive:jsonl:stream'
  | 'interactive:jsonl:non-stream'
  | 'non-interactive:text:stream'
  | 'non-interactive:text:non-stream'
  | 'non-interactive:jsonl:stream'
  | 'non-interactive:jsonl:non-stream';
`;

capsCode = capsCode.replace(
  /\/\*\* Matrix of supported behaviors[\s\S]*?export interface OrchestrationFeature \{[\s\S]*?\}/,
  newTypes.trim()
);

capsCode = capsCode.replace(/executionModes: OrchestrationFeature;/g, 'executionModes: ExecutionMode[];');
capsCode = capsCode.replace(/steering: OrchestrationFeature;/g, 'steeringModes: ExecutionMode[];');
capsCode = capsCode.replace(/queueing: OrchestrationFeature;/g, 'queueingModes: ExecutionMode[];');

fs.writeFileSync(capsPath, capsCode);

// 2. Update adapters
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

  code = code.replace(/executionModes: \{[\s\S]*?\},/, `executionModes: [\n      ${execModes.join(',\n      ')}\n    ],`);
  code = code.replace(/steering: \{[\s\S]*?\},/, `steeringModes: [\n      ${steerModes.join(',\n      ')}\n    ],`);
  code = code.replace(/queueing: \{[\s\S]*?\},/, `queueingModes: [\n      ${queueModes.join(',\n      ')}\n    ],`);

  fs.writeFileSync(filePath, code);
}
console.log('Enums updated successfully.');
