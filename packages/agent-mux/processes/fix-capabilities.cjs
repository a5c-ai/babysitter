const fs = require('fs');
const path = require('path');

const adaptersDir = 'packages/agent-mux/adapters/src';
const adapters = fs.readdirSync(adaptersDir).filter(f => f.endsWith('-adapter.ts') && f !== 'base-adapter.ts');

for (const a of adapters) {
  const filePath = path.join(adaptersDir, a);
  let code = fs.readFileSync(filePath, 'utf8');

  if (code.includes('supportsSteering:')) continue;

  const isClaude = a.startsWith('claude');
  const isCodex = a.startsWith('codex');
  const isGemini = a.startsWith('gemini');

  const steering = isClaude || isCodex || isGemini;
  const queueing = isCodex || isGemini;
  const asyncLoop = isClaude;
  const jsonlStream = isClaude || isCodex;
  const jsonlNonStream = isClaude;
  const nonIntStream = true;
  const intStream = true;

  const toInject = `
    supportsSteering: ${steering},
    supportsQueueing: ${queueing},
    supportsAsyncLoopTools: ${asyncLoop},
    supportsNonInteractiveStream: ${nonIntStream},
    supportsInteractiveStream: ${intStream},
    supportsJsonlStream: ${jsonlStream},
    supportsJsonlNonStream: ${jsonlNonStream},`;

  code = code.replace(
    /(supportsFileAttachments:\s*(?:true|false),)/,
    `$1${toInject}`
  );

  fs.writeFileSync(filePath, code);
}
console.log('Capabilities updated.');
