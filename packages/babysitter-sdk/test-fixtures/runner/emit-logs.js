#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function main() {
  const outputPath = process.env.BABYSITTER_OUTPUT_JSON;
  if (!outputPath) {
    throw new Error('Missing BABYSITTER_OUTPUT_JSON');
  }

  const stdoutMessages = ["stdout: first line", "stdout: second line"];
  const stderrMessages = ["stderr: only line"];

  for (const message of stdoutMessages) {
    process.stdout.write(`${message}\n`);
  }
  for (const message of stderrMessages) {
    process.stderr.write(`${message}\n`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const payload = {
    effectId: process.env.BABYSITTER_EFFECT_ID || null,
    stdoutMessages,
    stderrMessages,
    stdoutCount: stdoutMessages.length,
    stderrCount: stderrMessages.length,
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload), 'utf8');
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
