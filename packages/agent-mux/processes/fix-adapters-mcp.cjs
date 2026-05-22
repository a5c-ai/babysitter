const fs = require('fs');
const path = require('path');

const adaptersDir = 'packages/agent-mux/adapters/src';
const adapters = fs.readdirSync(adaptersDir).filter(f => f.endsWith('-adapter.ts') && f !== 'base-adapter.ts');

for (const a of adapters) {
  const filePath = path.join(adaptersDir, a);
  let code = fs.readFileSync(filePath, 'utf8');

  if (code.includes("'interactive:text:stream'")) {
    const isClaude = a.startsWith('claude');
    const isCodex = a.startsWith('codex');
    const isGemini = a.startsWith('gemini');

    code = code.replace(/executionModes: \[[\s\S]*?\],/g, "executionModes: ['normal'],");
    code = code.replace(/steeringModes: \[[\s\S]*?\],/, `text: {
      interactive: { stream: true, nonStream: true, steering: ${isClaude || isCodex || isGemini}, queueing: ${isCodex || isGemini} },
      nonInteractive: { stream: true, nonStream: true, steering: ${isClaude || isCodex || isGemini}, queueing: ${isCodex || isGemini} },
    },`);
    code = code.replace(/queueingModes: \[[\s\S]*?\],/, `jsonl: {
      interactive: { stream: ${isClaude || isCodex}, nonStream: ${isClaude}, steering: ${isClaude || isCodex}, queueing: ${isCodex} },
      nonInteractive: { stream: ${isClaude || isCodex}, nonStream: ${isClaude}, steering: ${isClaude || isCodex}, queueing: ${isCodex} },
    },`);
    fs.writeFileSync(filePath, code);
  }
}
console.log('Fixed executionModes and matrices in adapters.');
