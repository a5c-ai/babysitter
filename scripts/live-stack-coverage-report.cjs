#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const scenarioId = process.env.LIVE_STACK_SCENARIO_ID || 'live.adapters.claude-code.foundry-openai.gpt-5.5';
const installMode = process.env.LIVE_STACK_INSTALL_MODE || 'babysitter-plugin';
const outDir = process.env.LIVE_STACK_ARTIFACTS_DIR || path.join('artifacts', 'live-stack');
const scenarioArtifact = path.join(outDir, `${scenarioId}.json`);
const requireEvidence = process.env.LIVE_STACK_REQUIRE_EVIDENCE === '1';
const coveredLayers = listEnv('LIVE_STACK_COVERAGE_LAYERS', [
  'adapters',
  'plugin',
  'transport-adapter',
  'hooks-adapter',
  'babysitter-sdk',
  'foundry-openai',
]);
const requiredArtifacts = listEnv('LIVE_STACK_EXPECTED_ARTIFACTS', [
  'adapters-events',
  'plugin-command-transcript',
  'babysitter-run-summary',
  'babysitter-task-bundle',
  'hooks-adapter-normalized-event',
  'hooks-adapter-handler-result',
  'transport-adapter-trace',
  'provider-trace-redacted',
]);

let execution = null;
if (fs.existsSync(scenarioArtifact)) {
  execution = JSON.parse(fs.readFileSync(scenarioArtifact, 'utf8'));
}

const missingArtifacts = requiredArtifacts
  .map((name) => ({ name, file: execution?.evidence?.artifacts?.[name] || path.join(outDir, `${name}.json`) }))
  .filter((artifact) => !fs.existsSync(artifact.file));

const report = {
  generatedAt: new Date().toISOString(),
  scenarioId,
  installMode,
  agentPath: process.env.LIVE_STACK_AGENT_PATH || 'adapters',
  agent: process.env.LIVE_STACK_AGENT || 'claude-code',
  agentMuxAgent: process.env.LIVE_STACK_AMUX_AGENT || 'claude',
  provider: process.env.LIVE_STACK_PROVIDER || 'foundry-openai',
  model: process.env.LIVE_STACK_MODEL || 'gpt-5.5',
  coveredLayers: [...new Set(coveredLayers)].sort(),
  requiredArtifacts,
  scenarioArtifact,
  status: execution?.status || 'missing',
  missingTraceIds: execution?.missingTraceIds || [],
  missingArtifacts: missingArtifacts.map((artifact) => artifact.name),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${safeFileName(installMode)}-${safeFileName(scenarioId)}-coverage-summary.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (requireEvidence) {
  if (!execution) fail(`missing live scenario artifact: ${scenarioArtifact}`);
  if (execution.status !== 'passed') {
    fail(`live scenario did not pass: ${execution.failure || execution.status}`);
  } else {
    if ((execution.missingTraceIds || []).length > 0) fail(`missing trace ids: ${execution.missingTraceIds.join(', ')}`);
    if (missingArtifacts.length > 0) fail(`missing live evidence artifacts: ${missingArtifacts.map((artifact) => artifact.name).join(', ')}`);
  }
}

function listEnv(name, defaultValues) {
  return process.env[name] ? process.env[name].split(',').map((value) => value.trim()).filter(Boolean) : defaultValues;
}

function safeFileName(value) {
  return value.replace(/[^A-Za-z0-9_.-]+/g, '-');
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}
