'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fetchIssue, fetchIssueComments, updatePullRequest } = require('./github-workflow');
const { findSession, listSessions, updateSessionMetadata } = require('./state-index');
const { runMcpDoctor } = require('./mcp-doctor');

function policyPath(repoRoot) {
  return path.join(repoRoot || process.cwd(), '.a5c', 'config', 'model-policy.json');
}

function readPolicy(repoRoot) {
  const p = policyPath(repoRoot);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writePolicy(repoRoot, policy) {
  const p = policyPath(repoRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(policy, null, 2), 'utf8');
}

function parseModelArgs(args) {
  const trimmed = String(args || '').trim();
  if (!trimmed || trimmed === 'show') return { action: 'show', pairs: [] };
  if (trimmed === 'clear') return { action: 'clear', pairs: [] };

  if (!trimmed.startsWith('set')) {
    return { action: 'invalid', error: 'Use "show", "clear", or "set <phase>=<model> ..."' };
  }

  const pairs = trimmed
    .slice(3)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const i = token.indexOf('=');
      if (i <= 0) return null;
      return { phase: token.slice(0, i), model: token.slice(i + 1) };
    })
    .filter(Boolean);

  if (pairs.length === 0) {
    return { action: 'invalid', error: 'No phase=model pairs provided.' };
  }

  return { action: 'set', pairs };
}

function handleModelCommand(args, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const parsed = parseModelArgs(args);
  if (parsed.action === 'invalid') {
    return {
      ok: false,
      action: 'set',
      applied: false,
      policy: readPolicy(repoRoot),
      notes: [parsed.error],
    };
  }

  if (parsed.action === 'show') {
    const envPolicy = process.env.BABYSITTER_MODEL_POLICY_JSON
      ? (() => {
          try { return JSON.parse(process.env.BABYSITTER_MODEL_POLICY_JSON); } catch { return null; }
        })()
      : null;
    return {
      ok: true,
      action: 'show',
      applied: false,
      policy: readPolicy(repoRoot),
      envPolicy,
      notes: ['Loaded current model routing policy.'],
    };
  }

  if (parsed.action === 'clear') {
    writePolicy(repoRoot, {});
    return {
      ok: true,
      action: 'clear',
      applied: true,
      policy: {},
      notes: ['Model routing policy cleared.'],
    };
  }

  const validPhases = new Set(['plan', 'execute', 'review', 'fix']);
  const policy = readPolicy(repoRoot);
  const notes = [];
  for (const p of parsed.pairs) {
    if (!validPhases.has(p.phase)) {
      notes.push(`Ignored invalid phase "${p.phase}"`);
      continue;
    }
    policy[p.phase] = p.model;
  }
  writePolicy(repoRoot, policy);

  return {
    ok: true,
    action: 'set',
    applied: true,
    policy,
    notes: notes.length > 0 ? notes : ['Model routing policy updated.'],
  };
}

function inferRepoFromGitRemote(repoRoot) {
  const p = path.join(repoRoot || process.cwd(), '.git', 'config');
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, 'utf8');
  const m = text.match(/url\s*=\s*https:\/\/github\.com\/([^/\s]+\/[^/\s]+?)(?:\.git)?\s*$/m);
  return m ? m[1] : null;
}

function parseIssueArgs(args) {
  const tokens = String(args || '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: 'Issue number or URL is required.' };

  let issueToken = tokens[0];
  let repo = null;
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] === '--repo' && tokens[i + 1]) {
      repo = tokens[i + 1];
      i += 1;
    }
  }

  const urlMatch = issueToken.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)/);
  if (urlMatch) {
    return { ok: true, repo: repo || urlMatch[1], issueNumber: Number(urlMatch[2]) };
  }

  const n = Number(issueToken);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `Invalid issue identifier: ${issueToken}` };
  }
  return { ok: true, repo, issueNumber: n };
}

function handleIssueCommand(args, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const trimmed = String(args || '').trim();
  const apply = /(?:^|\s)--apply(?:\s|$)/.test(trimmed);
  const openPr = /(?:^|\s)--open-pr(?:\s|$)/.test(trimmed);
  const prMatch = trimmed.match(/(?:^|\s)--pr\s+(\d+)(?:\s|$)/);
  const updatePrNumber = prMatch ? Number(prMatch[1]) : null;
  const cleaned = trimmed
    .replace(/\s--apply(?:\s|$)/g, ' ')
    .replace(/\s--open-pr(?:\s|$)/g, ' ')
    .replace(/\s--pr\s+\d+(?:\s|$)/g, ' ')
    .trim();
  const parsed = parseIssueArgs(cleaned);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const repo = parsed.repo || inferRepoFromGitRemote(repoRoot);
  if (!repo) {
    return { ok: false, error: 'Could not infer GitHub repo. Pass --repo owner/name.' };
  }

  const fetched = fetchIssue(repo, parsed.issueNumber);
  if (!fetched.ok) {
    return { ok: false, error: fetched.error, issue: { number: parsed.issueNumber, repo } };
  }

  const issue = fetched.issue;
  const comments = fetchIssueComments(repo, issue.number);
  const commentSnippets = comments.ok
    ? comments.comments
        .slice(-3)
        .map((c) => String(c.body || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    : [];
  const plan = [
    `Understand issue #${issue.number}: ${issue.title}`,
    'Create minimal reproducible test covering the reported behavior',
    'Implement fix behind compatibility-safe defaults',
    'Run tests and summarize regression risk',
  ];
  const prompt = [
    `Implement GitHub issue #${issue.number} in ${repo}.`,
    `Title: ${issue.title}`,
    '',
    'Issue body:',
    String(issue.body || '(no body provided)').slice(0, 4000),
  ].join('\n');
  let prResult = null;
  if (openPr) {
    const prCreate = spawnSync(
      process.platform === 'win32' ? 'gh.exe' : 'gh',
      ['pr', 'create', '--repo', repo, '--fill'],
      { encoding: 'utf8', timeout: 15000 }
    );
    prResult = {
      ok: prCreate.status === 0,
      stdout: String(prCreate.stdout || '').trim(),
      stderr: String(prCreate.stderr || '').trim(),
      exitCode: prCreate.status,
    };
  }
  if (updatePrNumber) {
    const prBody = [
      `Issue context loaded: #${issue.number} (${issue.title})`,
      '',
      'Proposed plan:',
      ...plan.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
    prResult = updatePullRequest(repo, updatePrNumber, prBody);
  }

  return {
    ok: true,
    issue,
    commentSnippets,
    plan,
    mode: apply ? 'apply' : 'plan',
    apply,
    nextAction: apply
      ? `babysitter call ${prompt}`
      : `babysitter call implement issue #${issue.number}: ${issue.title}`,
    prompt,
    prResult,
  };
}

function handleResumeSelector(args, options = {}) {
  const selector = String(args || '').trim() || 'recent';
  const repoRoot = options.repoRoot || process.cwd();

  if (selector === 'list') {
    return {
      ok: true,
      selector,
      sessions: listSessions(repoRoot),
      notes: ['Listing indexed sessions ordered by most-recent update.'],
    };
  }
  if (selector.startsWith('search:')) {
    const query = selector.slice(7).trim();
    return {
      ok: true,
      selector,
      sessions: listSessions(repoRoot, { query }),
      notes: [`Search results for "${query}".`],
    };
  }

  const nameMatch = selector.match(/^name\s+(.+)$/i);
  if (nameMatch) {
    const recent = findSession(repoRoot, 'recent');
    if (!recent) {
      return { ok: false, selector, error: 'No recent session found to rename.' };
    }
    const updated = updateSessionMetadata(repoRoot, recent.sessionId, { alias: nameMatch[1] });
    return {
      ok: updated.ok,
      selector,
      session: updated.session || null,
      error: updated.error || null,
      notes: updated.ok ? [`Session alias set to "${nameMatch[1]}".`] : [],
    };
  }

  const tagAdd = selector.match(/^tag\s+\+(.+)$/i);
  if (tagAdd) {
    const recent = findSession(repoRoot, 'recent');
    if (!recent) {
      return { ok: false, selector, error: 'No recent session found to tag.' };
    }
    const updated = updateSessionMetadata(repoRoot, recent.sessionId, { addTag: tagAdd[1].trim() });
    return {
      ok: updated.ok,
      selector,
      session: updated.session || null,
      error: updated.error || null,
      notes: updated.ok ? [`Added tag "${tagAdd[1].trim()}".`] : [],
    };
  }

  const tagRemove = selector.match(/^tag\s+\-(.+)$/i);
  if (tagRemove) {
    const recent = findSession(repoRoot, 'recent');
    if (!recent) {
      return { ok: false, selector, error: 'No recent session found to update tag.' };
    }
    const updated = updateSessionMetadata(repoRoot, recent.sessionId, { removeTag: tagRemove[1].trim() });
    return {
      ok: updated.ok,
      selector,
      session: updated.session || null,
      error: updated.error || null,
      notes: updated.ok ? [`Removed tag "${tagRemove[1].trim()}".`] : [],
    };
  }

  const session = findSession(repoRoot, selector);
  if (!session) {
    return {
      ok: false,
      selector,
      error: `No session found for selector "${selector}"`,
    };
  }
  return {
    ok: true,
    selector,
    session,
    nextAction: `babysitter session:resume --session-id ${session.sessionId} --state-dir .a5c --run-id ${session.lastRunId || '<runId>'} --json`,
  };
}

function handleDoctorCommand(args, options = {}) {
  const arg = String(args || '').trim().toLowerCase();
  if (arg === 'mcp' || arg === '--mcp' || arg.includes('mcp')) {
    const report = runMcpDoctor(options.repoRoot || process.cwd());
    return {
      ok: report.ok,
      scope: 'mcp',
      report,
    };
  }
  return {
    ok: true,
    scope: 'general',
    notes: ['General doctor path is delegated to existing babysitter:doctor skill instructions.'],
  };
}

module.exports = {
  handleModelCommand,
  handleIssueCommand,
  handleResumeSelector,
  handleDoctorCommand,
};
