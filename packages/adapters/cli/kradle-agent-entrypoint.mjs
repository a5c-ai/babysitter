#!/usr/bin/env node
/**
 * Kradle agent runtime entrypoint.
 *
 * Runs in the dispatched K8s Job pod. It launches the requested coding-agent
 * harness via `adapters launch <harness> <provider>` (which stands up the JS
 * transport-mux proxy so e.g. the `claude` harness can talk to an OpenAI/Azure
 * provider), feeds it the task, captures the result, and POSTs a completion to
 * the kradle run callback so the dispatch run flips to Completed/Failed and the
 * board updates.
 *
 * Contract (env, set by createAgentJob):
 *   KRADLE_HARNESS    launcher harness id (e.g. 'claude')
 *   KRADLE_PROVIDER   provider id (e.g. 'openai')
 *   KRADLE_MODEL      model id (e.g. 'gpt-5.5')          [optional]
 *   AGENT_TASK        the task prompt                    [required for work]
 *   AGENT_SYSTEM_PROMPT  appended system prompt          [optional]
 *   KRADLE_CALLBACK_URL  run callback URL                [optional; logs if absent]
 *   KRADLE_RUN_ID     run name (for logging)
 *   KRADLE_WORKSPACE_PATH  agent working directory       [default /workspace]
 * Provider creds (AGENT_MUX_API_BASE, OPENAI_API_KEY/AZURE_API_KEY) arrive via
 * the model-provider secret envFrom and are consumed by resolveProvider.
 *
 * Repo-work mode (set by createManualDispatch when a concrete repository is
 * targeted — see agent-dispatch-controller.js):
 *   KRADLE_REPO_OWNER   git org/owner (e.g. 'a5c-ai')
 *   KRADLE_REPO_NAME    repository name (e.g. 'agent-sandbox')
 *   KRADLE_GIT_BASE_URL Gitea HTTP origin (e.g. 'http://host:3000')
 *   KRADLE_GIT_TOKEN    Gitea access token (clone + push + PR auth)
 *   KRADLE_BASE_BRANCH  PR base branch                   [default 'main']
 * When these are present the agent gets a real checkout: the repo is cloned into
 * the workspace, the harness edits it, and any changes are committed, pushed on a
 * fresh branch, and opened as a pull request whose URL is returned in the
 * callback. When absent the agent runs in an empty scratch workspace.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, 'dist/index.js');
const workspacePath = process.env.KRADLE_WORKSPACE_PATH || '/workspace';

// Repo-work env. All five must be present for repo mode; a partial set is a
// misconfiguration and must fail loudly (never silently degrade to scratch).
const repo = {
  owner: process.env.KRADLE_REPO_OWNER || '',
  name: process.env.KRADLE_REPO_NAME || '',
  baseUrl: (process.env.KRADLE_GIT_BASE_URL || '').replace(/\/$/, ''),
  token: process.env.KRADLE_GIT_TOKEN || '',
  baseBranch: process.env.KRADLE_BASE_BRANCH || 'main',
};
const repoMode = Boolean(repo.owner && repo.name && repo.baseUrl && repo.token);

const harness = process.env.KRADLE_HARNESS || 'claude';
const provider = process.env.KRADLE_PROVIDER || 'openai';
const model = process.env.KRADLE_MODEL || '';
// The launcher's resolveProvider does NOT auto-populate apiBase from
// AGENT_MUX_API_BASE for the openai provider, so without an explicit --api-base
// it creates no completion engine and the transport-mux proxy 404s every harness
// request. Pass apiBase/apiKey explicitly (the model-provider secret supplies
// them) so the proxy can translate the harness ↔ provider.
const apiBase = process.env.AGENT_MUX_API_BASE || process.env.KRADLE_ASSISTANT_BASE_URL || '';
const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_API_KEY || process.env.KRADLE_ASSISTANT_API_KEY || '';
const task = process.env.AGENT_TASK || '';
const systemPrompt = process.env.AGENT_SYSTEM_PROMPT || '';
const callbackUrl = process.env.KRADLE_CALLBACK_URL || '';
const runId = process.env.KRADLE_RUN_ID || 'unknown';

function log(...args) {
  console.error('[kradle-agent]', ...args);
}

/** Build the authenticated clone/push URL (token-as-username, Gitea HTTP auth). */
function authedRepoUrl() {
  const u = new URL(`${repo.baseUrl}/${repo.owner}/${repo.name}.git`);
  u.username = repo.token;
  return u.toString();
}

/** Run a git command in a cwd; resolves { exitCode, stdout, stderr }. */
function runGit(args, cwd = workspacePath) {
  return new Promise((resolvePromise) => {
    const safeArgs = args.map((a) => (repo.token && a.includes(repo.token) ? a.replace(repo.token, '***') : a));
    log('git', safeArgs.join(' '));
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => resolvePromise({ exitCode: 1, stdout, stderr: err.message }));
    child.on('close', (code) => resolvePromise({ exitCode: code ?? 0, stdout, stderr }));
  });
}

const branchName = `kradle/${runId}`;

/** Clone the repo into the workspace and check out a fresh work branch. Throws on failure. */
async function prepareCheckout() {
  const clone = await runGit(['clone', '--depth', '1', '--branch', repo.baseBranch, authedRepoUrl(), workspacePath]);
  if (clone.exitCode !== 0) {
    throw new Error(`git clone failed (${clone.exitCode}): ${clone.stderr.trim().slice(0, 400)}`);
  }
  await runGit(['config', 'user.email', 'agent@kradle.local']);
  await runGit(['config', 'user.name', 'Kradle Agent']);
  const branch = await runGit(['checkout', '-b', branchName]);
  if (branch.exitCode !== 0) {
    throw new Error(`git checkout -b failed (${branch.exitCode}): ${branch.stderr.trim().slice(0, 400)}`);
  }
  log(`checked out ${branchName} from ${repo.owner}/${repo.name}@${repo.baseBranch}`);
}

/** POST to the Gitea API with token auth; returns parsed JSON (throws on non-2xx). */
async function giteaApi(path, body) {
  const res = await fetch(`${repo.baseUrl}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `token ${repo.token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gitea POST ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

/**
 * After the harness runs: stage all changes, and if anything changed, commit,
 * push the work branch, and open a pull request. Resolves with a summary
 * { changed, pullRequest? } or throws on a git/PR failure.
 */
async function publishChanges(taskText) {
  await runGit(['add', '-A']);
  const staged = await runGit(['diff', '--cached', '--quiet']);
  if (staged.exitCode === 0) {
    log('no file changes produced by the agent — skipping PR');
    return { changed: false };
  }

  const subject = `kradle agent: ${(taskText || 'changes').split('\n')[0].slice(0, 64)}`;
  const commit = await runGit(['commit', '-m', subject]);
  if (commit.exitCode !== 0) throw new Error(`git commit failed: ${commit.stderr.trim().slice(0, 300)}`);

  const push = await runGit(['push', authedRepoUrl(), `HEAD:${branchName}`]);
  if (push.exitCode !== 0) throw new Error(`git push failed: ${push.stderr.trim().slice(0, 300)}`);

  const pr = await giteaApi(`/repos/${repo.owner}/${repo.name}/pulls`, {
    title: subject,
    head: branchName,
    base: repo.baseBranch,
    body: `Automated change by the Kradle agent for run \`${runId}\`.\n\n**Task**\n\n${(taskText || '').slice(0, 1000)}`,
  });
  log(`opened PR #${pr.number}: ${pr.html_url}`);
  return { changed: true, pullRequest: { url: pr.html_url, number: pr.number, branch: branchName } };
}

/**
 * Extract the agent's final text + token usage from harness stdout. The launcher
 * may emit plain text, a single claude-code JSON envelope, or stream-json NDJSON
 * (one JSON event per line). Handle all three.
 */
function parseHarnessOutput(stdout) {
  const trimmed = stdout.trim();
  let text = trimmed;
  let usage = {};

  const pickUsage = (u) => (u ? {
    inputTokens: u.input_tokens ?? u.prompt_tokens ?? 0,
    outputTokens: u.output_tokens ?? u.completion_tokens ?? 0,
  } : null);

  // Single JSON envelope.
  try {
    const o = JSON.parse(trimmed);
    if (o && typeof o === 'object') {
      text = o.result ?? o.text ?? o.content ?? text;
      usage = pickUsage(o.usage) ?? usage;
      return { text: String(text), usage };
    }
  } catch { /* not a single JSON object */ }

  // NDJSON / stream-json: scan events for the final result + usage.
  const events = [];
  for (const line of trimmed.split('\n')) {
    const s = line.trim();
    if (!s.startsWith('{')) continue;
    try { events.push(JSON.parse(s)); } catch { /* skip non-JSON line */ }
  }
  if (events.length > 0) {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      const t = e.result ?? (e.type === 'result' ? e.result : undefined)
        ?? (e.message?.content && typeof e.message.content === 'string' ? e.message.content : undefined)
        ?? (e.role === 'assistant' ? e.content : undefined);
      if (t != null) { text = typeof t === 'string' ? t : JSON.stringify(t); break; }
    }
    for (let i = events.length - 1; i >= 0; i--) {
      const u = pickUsage(events[i].usage);
      if (u) { usage = u; break; }
    }
  }
  return { text: String(text), usage };
}

/** Run the harness one-shot and resolve with { text, usage, raw, exitCode }. */
function runHarness() {
  return new Promise((resolvePromise) => {
    // Prepend the system prompt into the task (the launcher has no generic
    // system-prompt flag across harnesses).
    const fullTask = systemPrompt ? `${systemPrompt}\n\n${task}` : task;
    // `--no-interactive -p` is the launcher's one-shot contract: it sets the
    // harness's own prompt flag (cli-flag delivery) and plain-spawns it to
    // completion. `--with-proxy-if-needed` stands up the JS transport-mux so the
    // claude harness can speak to the openai/Azure provider.
    const args = [
      CLI, 'launch', harness, provider,
      ...(model ? ['--model', model] : []),
      ...(apiBase ? ['--api-base', apiBase] : []),
      ...(apiKey ? ['--api-key', apiKey] : []),
      '--with-proxy-if-needed',
      '--no-interactive',
      // Dispatched agents run headless in a Job pod with no human to approve
      // tool calls. --yolo resolves to the harness's auto-approve launch args
      // (claude → --dangerously-skip-permissions) so the agent can actually
      // Write/Edit/Bash; without it claude blocks every file edit on an
      // unanswerable permission prompt and produces no changes.
      '--yolo',
      '-p', fullTask,
    ];
    log('exec: node', args.map((a) => {
      if (a === fullTask) return '<task>';
      if (apiKey && a === apiKey) return '<api-key>';
      return a;
    }).join(' '));

    const child = spawn('node', args, { cwd: workspacePath, stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.on('error', (err) => resolvePromise({ text: '', usage: {}, raw: '', exitCode: 1, error: err.message }));
    child.on('close', (code) => {
      const { text, usage } = parseHarnessOutput(stdout);
      resolvePromise({ text, usage, raw: stdout, exitCode: code ?? 0 });
    });
  });
}

async function postCallback(body) {
  if (!callbackUrl) {
    log('no KRADLE_CALLBACK_URL — skipping callback. Result:', JSON.stringify(body).slice(0, 500));
    return;
  }
  try {
    const res = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    log(`callback ${callbackUrl} -> ${res.status}`);
  } catch (err) {
    log('callback failed:', err.message);
  }
}

async function main() {
  log(`run=${runId} harness=${harness} provider=${provider} model=${model || '(default)'} repoMode=${repoMode}`);
  if (!task) {
    await postCallback({ status: 'failed', error: 'No AGENT_TASK provided to the agent.' });
    process.exit(1);
  }

  // Repo-work mode: clone the target repo into the workspace before the harness
  // runs so the agent edits a real checkout. A clone/checkout failure is fatal —
  // never silently fall through to a scratch run the user did not ask for.
  if (repoMode) {
    try {
      await prepareCheckout();
    } catch (err) {
      await postCallback({ status: 'failed', error: `Repo checkout failed: ${err.message}` });
      process.exit(1);
    }
  }

  const result = await runHarness();
  const ok = result.exitCode === 0 && !result.error;

  // After a successful harness run in repo mode, publish any changes as a PR.
  let publish = null;
  let publishError = null;
  if (ok && repoMode) {
    try {
      publish = await publishChanges(task);
    } catch (err) {
      publishError = err.message;
      log('publish failed:', err.message);
    }
  }

  await postCallback({
    status: ok && !publishError ? 'completed' : 'failed',
    result: ok ? {
      text: result.text,
      ...(publish?.pullRequest ? { pullRequest: publish.pullRequest } : {}),
      ...(publish && publish.changed === false ? { noChanges: true } : {}),
    } : undefined,
    error: ok ? (publishError || undefined) : (result.error || `Harness exited with code ${result.exitCode}`),
    transcript: [
      { role: 'user', content: task },
      ...(result.text ? [{ role: 'assistant', content: result.text }] : []),
    ],
    tokenUsage: result.usage,
    ...(publish?.pullRequest ? { pullRequest: publish.pullRequest } : {}),
  });

  process.exit(ok && !publishError ? 0 : 1);
}

main().catch(async (err) => {
  log('fatal:', err?.stack || err?.message || String(err));
  await postCallback({ status: 'failed', error: err?.message || String(err) });
  process.exit(1);
});
