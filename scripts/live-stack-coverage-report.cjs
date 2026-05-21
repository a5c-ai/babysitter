#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const scenarioId = process.env.LIVE_STACK_SCENARIO_ID || 'live.agent-mux.claude-code.foundry-openai.gpt-5.5';
const installMode = process.env.LIVE_STACK_INSTALL_MODE || 'babysitter-plugin';
const outDir = process.env.LIVE_STACK_ARTIFACTS_DIR || path.join('artifacts', 'live-stack');
const scenarioArtifact = path.join(outDir, `${scenarioId}.json`);
const requireEvidence = process.env.LIVE_STACK_REQUIRE_EVIDENCE === '1';
const coveredLayers = listEnv('LIVE_STACK_COVERAGE_LAYERS', [
  'agent-mux',
  'plugin',
  'transport-mux',
  'hooks-mux',
  'babysitter-sdk',
  'foundry-openai',
]);
const requiredArtifacts = listEnv('LIVE_STACK_EXPECTED_ARTIFACTS', [
  'agent-mux-events',
  'plugin-command-transcript',
  'babysitter-run-summary',
  'babysitter-task-bundle',
  'hooks-mux-normalized-event',
  'hooks-mux-handler-result',
  'transport-mux-trace',
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
  agentPath: process.env.LIVE_STACK_AGENT_PATH || 'agent-mux',
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
const isLiveUnavailableSkip = execution?.status === 'skipped' && hasLiveUnavailableReason(execution);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${safeFileName(installMode)}-${safeFileName(scenarioId)}-coverage-summary.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (requireEvidence) {
  if (!execution) fail(`missing live scenario artifact: ${scenarioArtifact}`);
  if (execution.status === 'passed') {
    if ((execution.missingTraceIds || []).length > 0) fail(`missing trace ids: ${execution.missingTraceIds.join(', ')}`);
    if (missingArtifacts.length > 0) fail(`missing live evidence artifacts: ${missingArtifacts.map((artifact) => artifact.name).join(', ')}`);
  } else if (!isLiveUnavailableSkip) {
    fail(`live scenario did not pass: ${execution.failure || execution.skipReason || execution.status}`);
  }
}

function listEnv(name, fallback) {
  return process.env[name] ? process.env[name].split(',').map((value) => value.trim()).filter(Boolean) : fallback;
}

function safeFileName(value) {
  return value.replace(/[^A-Za-z0-9_.-]+/g, '-');
}

function hasLiveUnavailableReason(execution) {
  const reason = `${execution?.skipReason || ''}\n${execution?.failure || ''}`.toLowerCase();
  return reason.includes('live provider unavailable') || reason.includes('live agent unavailable');
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}
