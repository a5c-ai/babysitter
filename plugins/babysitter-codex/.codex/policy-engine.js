'use strict';

const fs = require('fs');
const path = require('path');
const { resolveRules } = require('./rules-resolver');

function loadPolicyConfig(repoRoot) {
  const root = repoRoot || process.cwd();
  const p = path.join(root, '.a5c', 'config', 'policies.json');
  const layered = resolveRules(root).rules;
  if (!fs.existsSync(p)) {
    return {
      planModeImmutable: true,
      approvalPolicy: process.env.BABYSITTER_APPROVAL_POLICY || layered.approval?.default || 'interactive',
      longTaskMode: process.env.BABYSITTER_LONG_TASK_MODE || 'off',
      allowShellCommands: [],
      allowNodeScripts: [],
      stagedApprovals: [
        { iterationLte: 3, mode: 'auto-approve' },
        { iterationLte: 15, mode: 'interactive' },
      ],
      retry: {
        maxDelayMs: 30000,
        jitterPct: 0.2,
      },
      layeredRules: layered,
    };
  }
  try {
    const fileCfg = JSON.parse(fs.readFileSync(p, 'utf8')) || {};
    return {
      ...fileCfg,
      approvalPolicy: fileCfg.approvalPolicy || layered.approval?.default || 'interactive',
      planModeImmutable: fileCfg.planModeImmutable !== undefined
        ? fileCfg.planModeImmutable
        : layered.safety?.planModeImmutable !== false,
      layeredRules: layered,
    };
  } catch {
    return { layeredRules: layered };
  }
}

function shouldBlockPlanAction(mode, kind) {
  const planMode = String(mode || '').toLowerCase();
  if (planMode !== 'plan') return false;
  const mutableKinds = new Set(['agent', 'shell', 'node', 'skill']);
  return mutableKinds.has(String(kind || '').toLowerCase());
}

function applyApprovalPolicy(task, context = {}) {
  const repoRoot = context.repoRoot || process.cwd();
  const cfg = loadPolicyConfig(repoRoot);
  const iteration = Number(context.iteration || 1);
  let policy = context.policy || cfg.approvalPolicy || 'interactive';
  const staged = Array.isArray(cfg.stagedApprovals) ? cfg.stagedApprovals : [];
  const stage = staged.find((s) => iteration <= Number(s.iterationLte || 0));
  if (stage && stage.mode) {
    policy = stage.mode;
  }
  if (task.kind !== 'breakpoint') return { approved: true, reason: 'not_breakpoint' };
  if (policy === 'auto-approve') return { approved: true, reason: 'auto_approve' };
  if (policy === 'deny') return { approved: false, reason: 'policy_deny' };
  return { approved: null, reason: 'interactive_required' };
}

function nextRetryDelayMs(attempt) {
  const n = Math.max(1, Number(attempt || 1));
  const delay = Math.min(30000, 1000 * Math.pow(2, n - 1));
  const jitter = delay * ((Math.random() * 0.4) - 0.2);
  return Math.max(500, Math.round(delay + jitter));
}

function evaluateTaskPolicy(task, context = {}) {
  const repoRoot = context.repoRoot || process.cwd();
  const cfg = loadPolicyConfig(repoRoot);
  const kind = String(task && task.kind || '').toLowerCase();
  const mode = String(context.mode || process.env.BABYSITTER_MODE || '').toLowerCase();

  if (cfg.planModeImmutable !== false && shouldBlockPlanAction(mode, kind)) {
    return { allowed: false, reason: 'plan_mode_immutable' };
  }

  if (cfg.longTaskMode === 'strict' && kind === 'shell') {
    const command = String(task.shell && task.shell.command || '').trim();
    const allow = Array.isArray(cfg.allowShellCommands) ? cfg.allowShellCommands : [];
    if (command && !allow.some((prefix) => command.startsWith(prefix))) {
      return { allowed: false, reason: 'shell_not_allowlisted', command };
    }
  }

  if (cfg.longTaskMode === 'strict' && kind === 'node') {
    const script = String(task.node && task.node.script || '').trim();
    const allow = Array.isArray(cfg.allowNodeScripts) ? cfg.allowNodeScripts : [];
    if (script && !allow.includes(script)) {
      return { allowed: false, reason: 'node_not_allowlisted', script };
    }
  }

  return { allowed: true, reason: 'allowed' };
}

module.exports = {
  loadPolicyConfig,
  shouldBlockPlanAction,
  applyApprovalPolicy,
  nextRetryDelayMs,
  evaluateTaskPolicy,
};
