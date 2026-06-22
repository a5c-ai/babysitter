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
 * Provider creds (AGENT_MUX_API_BASE, OPENAI_API_KEY/AZURE_API_KEY) arrive via
 * the model-provider secret envFrom and are consumed by resolveProvider.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, 'dist/index.js');

const harness = process.env.KRADLE_HARNESS || 'claude';
const provider = process.env.KRADLE_PROVIDER || 'openai';
const model = process.env.KRADLE_MODEL || '';
const task = process.env.AGENT_TASK || '';
const systemPrompt = process.env.AGENT_SYSTEM_PROMPT || '';
const callbackUrl = process.env.KRADLE_CALLBACK_URL || '';
const runId = process.env.KRADLE_RUN_ID || 'unknown';

function log(...args) {
  console.error('[kradle-agent]', ...args);
}

/** Run the harness one-shot and resolve with { text, usage, raw, exitCode }. */
function runHarness() {
  return new Promise((resolvePromise) => {
    // claude-code one-shot: -p prints and exits; --output-format json yields a
    // structured result envelope. Pass harness args after the `--` separator.
    const harnessArgs = ['-p', task, '--output-format', 'json'];
    if (systemPrompt) harnessArgs.push('--append-system-prompt', systemPrompt);

    const args = [
      CLI, 'launch', harness, provider,
      ...(model ? ['--model', model] : []),
      '--with-proxy-if-needed',
      '--', ...harnessArgs,
    ];
    log('exec: node', args.map((a) => (a === task ? '<task>' : a)).join(' '));

    const child = spawn('node', args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.on('error', (err) => resolvePromise({ text: '', usage: {}, raw: '', exitCode: 1, error: err.message }));
    child.on('close', (code) => {
      let text = stdout.trim();
      let usage = {};
      // Try to parse claude-code --output-format json envelope.
      try {
        const parsed = JSON.parse(stdout);
        if (parsed && typeof parsed === 'object') {
          text = parsed.result ?? parsed.text ?? parsed.content ?? text;
          if (parsed.usage) {
            usage = {
              inputTokens: parsed.usage.input_tokens ?? parsed.usage.prompt_tokens ?? 0,
              outputTokens: parsed.usage.output_tokens ?? parsed.usage.completion_tokens ?? 0,
            };
          }
        }
      } catch {
        // Not JSON — keep raw text.
      }
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
  log(`run=${runId} harness=${harness} provider=${provider} model=${model || '(default)'}`);
  if (!task) {
    await postCallback({ status: 'failed', error: 'No AGENT_TASK provided to the agent.' });
    process.exit(1);
  }

  const result = await runHarness();
  const ok = result.exitCode === 0 && !result.error;

  await postCallback({
    status: ok ? 'completed' : 'failed',
    result: ok ? { text: result.text } : undefined,
    error: ok ? undefined : (result.error || `Harness exited with code ${result.exitCode}`),
    transcript: [
      { role: 'user', content: task },
      ...(result.text ? [{ role: 'assistant', content: result.text }] : []),
    ],
    tokenUsage: result.usage,
  });

  process.exit(ok ? 0 : 1);
}

main().catch(async (err) => {
  log('fatal:', err?.stack || err?.message || String(err));
  await postCallback({ status: 'failed', error: err?.message || String(err) });
  process.exit(1);
});
