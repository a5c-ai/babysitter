// Zero-network tests for ciChainGate.js: a PATH-stubbed fake `gh` and a throwaway git repo + origin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ciChainGateCommand, ciChainGate, findProdPushWithoutCiGate, DEFAULT_FLAKE_SIGNATURES } from './ciChainGate.js';

const sh = (cmd, opts = {}) => spawnSync('bash', ['-c', cmd], { encoding: 'utf8', ...opts });
const root = mkdtempSync(join(tmpdir(), 'ci-chain-'));
const origin = join(root, 'origin.git');
const work = join(root, 'work');
const bin = join(root, 'bin');
const stub = join(root, 'stub');
mkdirSync(bin); mkdirSync(stub);
sh(`git init -q --bare -b main '${origin}' && git clone -q '${origin}' '${work}' 2>/dev/null && cd '${work}' && git config user.email t@example.invalid && git config user.name t && git checkout -q -b main && echo a > a && git add a && git commit -q -m a && git push -q origin main`);

// Fake gh. `run list` prints $STUB/<workflow>.row; `run view <id>` reads files keyed by run id and by
// how many times that run was re-run (rerun-<id>); `run rerun` is counted and logged.
writeFileSync(join(bin, 'gh'), `#!/bin/bash
if [ "$1" = run ] && { [ "$2" = view ] || [ "$2" = rerun ]; }; then
  sub=$2; rid=$3; shift 3; json=""; lf=0
  while [ $# -gt 0 ]; do case "$1" in --json) json="$2"; shift;; --log-failed) lf=1;; esac; shift; done
  k=$(cat "$STUB/rerun-$rid" 2>/dev/null || echo 0)
  if [ "$sub" = rerun ]; then echo "rerun $rid" >> "$STUB/calls.log"; echo $((k + 1)) > "$STUB/rerun-$rid"; exit 0; fi
  if [ "$lf" = 1 ]; then [ -f "$STUB/log-$rid.txt" ] && printf '%b' "$(cat "$STUB/log-$rid.txt")"; exit 0; fi
  case "$json" in
    jobs) [ -f "$STUB/jobs-$rid.txt" ] && printf '%b' "$(cat "$STUB/jobs-$rid.txt")" ;;
    attempt) echo $((k + 1)) ;;
    *) [ -f "$STUB/view-$rid-$k.row" ] && printf '%b' "$(cat "$STUB/view-$rid-$k.row")" ;;
  esac
  exit 0
fi
wf=""
while [ $# -gt 0 ]; do case "$1" in --workflow) wf="$2"; shift;; esac; shift; done
[ -f "$STUB/$wf.row" ] && printf '%b' "$(cat "$STUB/$wf.row")"
exit 0
`);
chmodSync(join(bin, 'gh'), 0o755);

function run(opts, rows = {}, files = {}) {
  sh(`rm -rf '${stub}'/*`);
  for (const [w, row] of Object.entries(rows)) writeFileSync(join(stub, `${w}.row`), row);
  for (const [f, body] of Object.entries(files)) writeFileSync(join(stub, f), body);
  const cmd = ciChainGateCommand({ dir: work, repo: 'o/r', branch: 'main', pollSeconds: 0, maxPolls: 2, ...opts });
  const r = sh(cmd, { env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, STUB: stub } });
  const calls = existsSync(join(stub, 'calls.log')) ? readFileSync(join(stub, 'calls.log'), 'utf8') : '';
  return { ...r, calls };
}
const ok = (r) => r.status === 0 && r.stdout.trim().split('\n').pop() === 'CI_CHAIN_OK';
const FLAKE_LOG = 'e2e (desktop)\\tbuild\\tError: Failed to fetch font `Inter` from Google Fonts.\\n';

test('option validation throws on bad input', () => {
  const base = { dir: work, repo: 'o/r', branch: 'main' };
  assert.throws(() => ciChainGateCommand({}), /dir is required/);
  assert.throws(() => ciChainGateCommand({ dir: work, branch: 'main' }), /repo is required/);
  assert.throws(() => ciChainGateCommand({ ...base, workflows: [''] }), /workflows/);
  assert.throws(() => ciChainGateCommand({ ...base, flakeRetries: 2 }), /0 or 1/);
  assert.throws(() => ciChainGateCommand({ ...base, flakeRetries: 1, flakeSignatures: [] }), /at least one/);
  assert.throws(() => ciChainGateCommand({ ...base, flakeSignatures: ['no-separator'] }), /flakeSignatures/);
  assert.throws(() => ciChainGateCommand({ ...base, maxJobMinutes: 0 }), /positive/);
  assert.throws(() => ciChainGateCommand({ ...base, maxPolls: 0 }), /maxPolls/);
  assert.throws(() => ciChainGateCommand({ ...base, skipConclusions: ['Bad Value'] }), /skipConclusions/);
});

test('script runs under pipefail and carries the success marker', () => {
  const cmd = ciChainGateCommand({ dir: work, repo: 'o/r', branch: 'main' });
  assert.match(cmd, /^set -o pipefail/);
  assert.match(cmd, /echo CI_CHAIN_OK$/);
});

test('green chain across two workflows passes and prints each run id', () => {
  const r = run({ workflows: ['ci', 'seed.yml'] }, { ci: 'success\\t111\\n', 'seed.yml': 'success\\t222\\n' });
  assert.ok(ok(r), r.stdout + r.stderr);
  assert.match(r.stdout, /CI_RUN=111/);
  assert.match(r.stdout, /SEED_YML_RUN=222/);
});

test('(a) red CI fails and never prints the marker', () => {
  const r = run({ workflows: ['ci'] }, { ci: 'failure\\t111\\n' });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /concluded failure/);
  assert.doesNotMatch(r.stdout, /CI_CHAIN_OK/);
});

test('every workflow must pass: a red second workflow fails the chain', () => {
  const r = run({ workflows: ['ci', 'seed.yml'] }, { ci: 'success\\t111\\n', 'seed.yml': 'failure\\t222\\n' });
  assert.notEqual(r.status, 0);
  assert.doesNotMatch(r.stdout, /CI_CHAIN_OK/);
});

test('a workflow with no completed run fails (absence is not a pass)', () => {
  const r = run({ workflows: ['ci'] }, {});
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /no completed run/);
});

test('(b) a flake-signature failure is retried once (failed jobs only) and can then pass', () => {
  const r = run({ workflows: ['ci'], flakeRetries: 1 }, { ci: 'failure\\t111\\n' }, {
    'log-111.txt': FLAKE_LOG,
    'view-111-0.row': 'in_progress\\t\\t1\\n',
    'view-111-1.row': 'completed\\tsuccess\\t2\\n',
  });
  assert.ok(ok(r), r.stdout + r.stderr);
  assert.match(r.stdout, /CI_FLAKE_RERUN=e2e \(desktop\):font-download/);
  assert.equal(r.calls.match(/^rerun 111$/gm).length, 1);
});

test('(b2) a flake that fails again is NOT retried a second time', () => {
  const r = run({ workflows: ['ci'], flakeRetries: 1 }, { ci: 'failure\\t111\\n' }, {
    'log-111.txt': FLAKE_LOG,
    'view-111-1.row': 'completed\\tfailure\\t2\\n',
  });
  assert.notEqual(r.status, 0);
  assert.equal(r.calls.match(/^rerun 111$/gm).length, 1);
  assert.doesNotMatch(r.stdout, /CI_CHAIN_OK/);
});

test('(c) a non-flake failure is NOT retried', () => {
  const r = run({ workflows: ['ci'], flakeRetries: 1 }, { ci: 'failure\\t111\\n' }, {
    'log-111.txt': 'e2e (desktop)\\ttest\\tAssertionError: expected 1 to equal 2\\n',
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /CI_FLAKE_UNKNOWN/);
  assert.equal(r.calls.includes('rerun'), false);
});

test('(c2) one flaky job plus one real failure is NOT retried', () => {
  const r = run({ workflows: ['ci'], flakeRetries: 1 }, { ci: 'failure\\t111\\n' }, {
    'log-111.txt': `${FLAKE_LOG}unit\\ttest\\tAssertionError: boom\\n`,
  });
  assert.notEqual(r.status, 0);
  assert.equal(r.calls.includes('rerun'), false);
});

test('flakeRetries 0 (default) never retries even a known flake', () => {
  const r = run({ workflows: ['ci'] }, { ci: 'failure\\t111\\n' }, { 'log-111.txt': FLAKE_LOG });
  assert.notEqual(r.status, 0);
  assert.equal(r.calls.includes('rerun'), false);
});

test('a custom flakeSignatures list replaces the defaults', () => {
  const log = { 'log-111.txt': 'build\\tstep\\tECONNRESET while fetching registry\\n' };
  let r = run({ workflows: ['ci'], flakeRetries: 1 }, { ci: 'failure\\t111\\n' }, log);
  assert.equal(r.calls.includes('rerun'), false, 'not in the defaults');
  r = run({ workflows: ['ci'], flakeRetries: 1, flakeSignatures: ['registry|ECONNRESET while fetching'] }, { ci: 'failure\\t111\\n' },
    { ...log, 'view-111-1.row': 'completed\\tsuccess\\t2\\n' });
  assert.ok(ok(r), r.stdout);
  assert.ok(DEFAULT_FLAKE_SIGNATURES.length > 0);
});

const budget = { workflows: ['ci'], maxJobMinutes: 15, jobPrefix: 'e2e' };
test('(d) an over-budget job fails and names job, minutes and budget', () => {
  const r = run(budget, { ci: 'success\\t111\\n' }, { 'jobs-111.txt': 'lint\\t60\\ne2e (desktop)\\t1320\\ne2e (mobile)\\t500\\n' });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /FAIL: job e2e \(desktop\) took 22 min, budget 15/);
  assert.doesNotMatch(r.stdout, /CI_CHAIN_OK/);
});

test('an in-budget job passes; a slow job outside jobPrefix is ignored', () => {
  const r = run(budget, { ci: 'success\\t111\\n' }, { 'jobs-111.txt': 'lint\\t1200\\ne2e (desktop)\\t540\\n' });
  assert.ok(ok(r), r.stdout);
  assert.match(r.stdout, /JOB_MAX_MIN=9\n/);
});

test('a budget that matched no job fails (it measured nothing)', () => {
  const r = run(budget, { ci: 'success\\t111\\n' }, { 'jobs-111.txt': 'lint\\t60\\n' });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /measured nothing/);
});

test('ciChainGate builds a shell task with the SDK positional defineTask(id, impl, options) form', () => {
  const seen = {};
  const fake = (id, impl, options) => { Object.assign(seen, { id, impl, options }); return { id }; };
  ciChainGate('ci-chain', { dir: work, repo: 'o/r', branch: 'main', flakeRetries: 1 }, { defineTask: fake });
  assert.equal(seen.id, 'ci-chain');
  const def = seen.impl({}, { effectId: 'E1' });
  assert.equal(def.kind, 'shell');
  assert.match(def.shell.command, /^set -o pipefail/);
  assert.ok(def.shell.timeout > 120000);
  assert.equal(def.io.outputJsonPath, 'tasks/E1/output.json');
  assert.throws(() => ciChainGate('', { dir: work, repo: 'o/r', branch: 'main' }, { defineTask: fake }), /id/);
  assert.throws(() => ciChainGate('x', { dir: work }, { defineTask: fake }), /repo/);
});

test('HEAD ahead of origin fails', () => {
  sh(`cd '${work}' && echo b > b && git add b && git commit -q -m b`);
  const r = run({ workflows: ['ci'] }, { ci: 'success\\t111\\n' });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /is not origin\/main/);
});

// ---- static check ----
const BAD = `
import { ciChainGate } from './ciChainGate.js';
const gate = ciChainGate('g', { dir: '.', repo: 'o/r', branch: 'main' });   // post-merge chain: not a pre-push gate
export const ship = { kind: 'shell', shell: { command: 'git push origin main' } };
export const deploy = { kind: 'shell', shell: { command: 'vercel deploy --prod' } };
`;
const GOOD = `
import { ciChainGate } from './ciChainGate.js';
const gate = ciChainGate('g', { dir: '.', repo: 'o/r', branch: 'feature-x' });
// git push origin main  (comments never count)
export const ship = { kind: 'shell', shell: { command: 'git push origin main' } };
`;

test('static check flags production pushes that no CI gate precedes', () => {
  const hits = findProdPushWithoutCiGate(BAD);
  assert.deepEqual(hits.map((h) => h.line), [4, 5]);
  assert.match(hits[0].command, /git push origin main/);
  for (const cmd of ['npm publish', 'gh release create v1.0.0', 'git push origin HEAD:master', 'git push origin HEAD:refs/heads/main']) {
    assert.equal(findProdPushWithoutCiGate(`run('${cmd}')`).length, 1, cmd);
  }
});

test('static check passes a gated process, comments, feature-branch pushes and a documented escape', () => {
  assert.deepEqual(findProdPushWithoutCiGate(GOOD), []);
  assert.deepEqual(findProdPushWithoutCiGate("run('git push origin feature-x')"), []);
  assert.deepEqual(findProdPushWithoutCiGate(`// ci-gate: the release job gates on CI itself\nrun('npm publish')`), []);
  assert.equal(findProdPushWithoutCiGate(`run('npm publish')\nciChainGate('g', { branch: 'dev' })`).length, 1, 'a gate AFTER the push does not count');
});

test.after(() => rmSync(root, { recursive: true, force: true }));
