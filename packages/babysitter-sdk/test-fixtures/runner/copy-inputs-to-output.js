#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJsonIfExists(filePath) {
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

async function main() {
  const inputPath = process.env.BABYSITTER_INPUT_JSON || null;
  const outputPath = process.env.BABYSITTER_OUTPUT_JSON;
  if (!outputPath) {
    throw new Error('Missing BABYSITTER_OUTPUT_JSON');
  }
  const stdoutPath = process.env.BABYSITTER_STDOUT_PATH || null;
  const stderrPath = process.env.BABYSITTER_STDERR_PATH || null;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const payload = {
    inputPath,
    outputPath,
    stdoutPathEnv: stdoutPath,
    stderrPathEnv: stderrPath,
    effectId: process.env.BABYSITTER_EFFECT_ID || null,
    inputExists: Boolean(inputPath && fs.existsSync(inputPath)),
    inputValue: readJsonIfExists(inputPath),
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload), 'utf8');
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
