'use strict';

const fs = require('fs');
const path = require('path');

function parsePolicy() {
  const raw = process.env.BABYSITTER_MODEL_POLICY_JSON;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  const repoRoot = process.env.BABYSITTER_REPO_ROOT || process.cwd();
  const policyFile = path.join(repoRoot, '.a5c', 'config', 'model-policy.json');
  if (!fs.existsSync(policyFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(policyFile, 'utf8')) || {};
  } catch {
    return {};
  }
}

function resolveModelForTask(task, phase) {
  const explicit = task && (task.model || (task.agent && task.agent.model));
  if (explicit) return explicit;
  const policy = parsePolicy();
  const stepPhase = task && (task.phase || (task.metadata && task.metadata.phase));
  if (stepPhase && policy[stepPhase]) return policy[stepPhase];
  if (phase && policy[phase]) return policy[phase];
  return process.env.BABYSITTER_MODEL_DEFAULT || null;
}

module.exports = {
  resolveModelForTask,
};
