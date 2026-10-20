/**
 * @module contrib/rogelsm/ciChainGate
 * @description Zero-token shell gate that waits for EVERY CI run of one commit across the named
 * GitHub Actions workflows and fails on anything but success. Optionally retries a failed run ONCE
 * when (and only when) its failed-job log matches a known-flake signature, and fails any job that
 * runs longer than a time budget. Also ships `findProdPushWithoutCiGate(source)`, a static check
 * that flags a process whose production push/deploy command is not preceded by a CI gate.
 *
 * Failure modes it closes:
 *  - a production push that never waited for CI (or waited for only one of several workflows);
 *  - a CI run failed by a transient third-party download (e.g. a font fetch) that a human would
 *    simply re-run, but which must not hide a real regression behind blind retries;
 *  - a hung CI job that holds the chain forever.
 *
 * Usage:
 *   import { ciChainGate, findProdPushWithoutCiGate } from './ciChainGate.js';
 *   // In your process, right before the production push:
 *   const gate = ciChainGate('ci-chain', {
 *     dir: '<repoDir>', repo: '<owner>/<repo>', branch: 'release-candidate',
 *     workflows: ['ci', 'e2e.yml'], flakeRetries: 1, maxJobMinutes: 15, jobPrefix: 'e2e',
 *   });
 *   await ctx.task(gate, {});   // stdout ends with CI_CHAIN_OK only on success
 *
 *   // CI/lint side: static check over a process source string.
 *   findProdPushWithoutCiGate(fs.readFileSync('process.js', 'utf8')); // -> [{line, command}]
 *
 * Needs `gh` (authenticated), `git` and `awk` at run time (the jq filters run inside `gh --jq`). `ciChainGateCommand` and
 * `findProdPushWithoutCiGate` are pure and import-free; the SDK is only loaded (optionally) by
 * `ciChainGate` so the builder and the static check stay usable without an install.
 *
 * @graph
 *   domains: [domain:software-engineering, domain:devops]
 *   workflows: [workflow:feature-development, workflow:release]
 */

/** Default known-flake signatures: `<name>|<literal substring>`, matched literally (never as a regex). */
export const DEFAULT_FLAKE_SIGNATURES = [
  'font-download|` from Google Fonts.',
  'font-css|Failed to fetch font `',
  'font-file|Failed to fetch font file from `https://fonts.gstatic.com/',
  'job-timeout|has exceeded the maximum execution time of',
];

// Optional SDK, loaded dynamically so the pure parts work without an install.
let sdkDefineTask = null;
let sdkLoadError = null;
try {
  ({ defineTask: sdkDefineTask } = await import('@a5c-ai/babysitter-sdk'));
} catch (e) {
  // Only "the SDK itself is not installed" is benign; a broken install must surface its real cause.
  const notInstalled = e?.code === 'ERR_MODULE_NOT_FOUND' && String(e.message).includes('@a5c-ai/babysitter-sdk');
  if (!notInstalled) sdkLoadError = e;
}

/** Single-quote a value for safe shell interpolation. */
function shq(v) {
  return `'${String(v == null ? '' : v).replace(/'/g, `'\\''`)}'`;
}

// awk: classify each failed job (lines are `<job>\t<step>\t<log line>`) against the signatures in $FLAKE_SIGS
// (newline-separated `<name>|<literal>`). Prints `MATCH\t<job>\t<name>` or `UNMATCHED\t<job>` per job.
const AWK_FLAKE_CLASSIFY = String.raw`BEGIN { FS = "\t"; m = split(ENVIRON["FLAKE_SIGS"], L, "\n"); for (a = 1; a <= m; a++) { p = index(L[a], "|"); if (p < 2 || substr(L[a], p + 1) == "") continue; n++; N[n] = substr(L[a], 1, p - 1); S[n] = substr(L[a], p + 1) } }
NF >= 2 { j = $1; if (!(j in seen)) { seen[j] = 1; order[++k] = j } if (!(j in hit)) for (i = 1; i <= n; i++) if (index($0, S[i]) > 0) { hit[j] = N[i]; break } }
END { for (q = 1; q <= k; q++) { j = order[q]; if (j in hit) print "MATCH\t" j "\t" hit[j]; else print "UNMATCHED\t" j } }`;
const AWK_FLAKE_PRINT = String.raw`BEGIN { FS = "\t" } $1 == "MATCH" { print "CI_FLAKE_RERUN=" $2 ":" $3 }`;
// jq: `<name>\t<seconds>` per job that actually ran.
const JQ_JOB_SECONDS = String.raw`.jobs[] | select(.conclusion != "skipped" and .startedAt != null and .completedAt != null) | "\(.name)\t\((.completedAt|fromdateiso8601) - (.startedAt|fromdateiso8601))"`;
// awk: `OVER\t<name>\t<min>` per job over budget, then `MAX\t<min>` (-1 = no matching job).
const AWK_JOB_BUDGET = String.raw`BEGIN { FS = "\t"; mx = -1 }
NF >= 2 && (p == "" || substr($1, 1, length(p)) == p) { s = $2 + 0; mn = int((s + 59) / 60); if (mn > mx) mx = mn; if (s > max) print "OVER\t" $1 "\t" mn }
END { print "MAX\t" mx }`;

/**
 * Build the bash script (pure; throws on invalid options).
 *
 * For HEAD of `branch` (asserts HEAD == origin/<branch>) each workflow is polled in order with
 * `gh run list --workflow <w> --branch <branch> --commit $SHA`. EVERY run of that workflow for the
 * commit is considered: polling continues while any run is queued/in progress, then every run whose
 * conclusion is not in skipConclusions must be `success`. No completed run after maxPolls fails
 * (an absent run is never a pass).
 * Prints `<W>_RUN=<id>` per workflow and CI_CHAIN_OK last, only on success.
 *
 * @param {object} o
 * @param {string} o.dir - repo checkout directory
 * @param {string} o.repo - `<owner>/<repo>`
 * @param {string} o.branch - branch whose HEAD commit is gated
 * @param {string[]} [o.workflows=['ci']] - workflow names/files; ALL must succeed, in order
 * @param {number} [o.pollSeconds=30]
 * @param {number} [o.maxPolls=100] - polls per workflow before failing as "no completed run"
 * @param {string[]} [o.skipConclusions=['skipped']] - conclusions ignored when picking the newest run
 * @param {0|1} [o.flakeRetries=0] - 1: re-run ONLY the failed jobs, ONCE, and only when EVERY failed
 *   job's log matches a flake signature. Unknown failures, empty logs and a second failure still fail.
 * @param {string[]} [o.flakeSignatures=DEFAULT_FLAKE_SIGNATURES] - `<name>|<literal substring>` entries
 * @param {number} [o.maxJobMinutes] - fail when a (non-skipped) job ran longer; fails if no job matched
 * @param {string} [o.jobPrefix=''] - only jobs whose name starts with this count toward the budget
 * @returns {string}
 */
export function ciChainGateCommand(o = {}) {
  if (!o || typeof o !== 'object') throw new Error('ciChainGateCommand: options object is required');
  for (const k of ['dir', 'repo', 'branch']) {
    if (typeof o[k] !== 'string' || !o[k]) throw new Error(`ciChainGateCommand: opts.${k} is required`);
  }
  const workflows = Array.isArray(o.workflows) && o.workflows.length ? o.workflows : ['ci'];
  for (const w of workflows) if (typeof w !== 'string' || !w) throw new Error('ciChainGateCommand: workflows must be non-empty strings');
  const pollSeconds = o.pollSeconds === undefined ? 30 : o.pollSeconds;
  const maxPolls = o.maxPolls === undefined ? 100 : o.maxPolls;
  if (!Number.isInteger(pollSeconds) || pollSeconds < 0) throw new Error('ciChainGateCommand: pollSeconds must be a non-negative integer');
  if (!Number.isInteger(maxPolls) || maxPolls < 1) throw new Error('ciChainGateCommand: maxPolls must be a positive integer');
  const skip = o.skipConclusions === undefined ? ['skipped'] : o.skipConclusions;
  if (!Array.isArray(skip) || skip.some((c) => typeof c !== 'string' || !/^[a-z_]+$/.test(c))) {
    throw new Error('ciChainGateCommand: skipConclusions must be an array of lower-case conclusion names');
  }
  const flakeRetries = o.flakeRetries === undefined ? 0 : o.flakeRetries;
  if (flakeRetries !== 0 && flakeRetries !== 1) {
    throw new Error('ciChainGateCommand: flakeRetries must be 0 or 1 (capped at 1 so a real regression cannot hide behind retries)');
  }
  const sigs = o.flakeSignatures === undefined ? DEFAULT_FLAKE_SIGNATURES : o.flakeSignatures;
  if (!Array.isArray(sigs) || sigs.some((s) => typeof s !== 'string' || s.indexOf('|') < 1 || s.indexOf('|') === s.length - 1 || s.includes('\n'))) {
    throw new Error('ciChainGateCommand: flakeSignatures must be an array of "<name>|<literal substring>" strings');
  }
  if (flakeRetries === 1 && sigs.length === 0) throw new Error('ciChainGateCommand: flakeRetries 1 needs at least one flake signature');
  const maxJobMinutes = o.maxJobMinutes === undefined || o.maxJobMinutes === null ? null : o.maxJobMinutes;
  if (maxJobMinutes !== null && !(Number.isFinite(maxJobMinutes) && maxJobMinutes > 0)) {
    throw new Error('ciChainGateCommand: maxJobMinutes must be a positive number');
  }
  if (o.jobPrefix !== undefined && typeof o.jobPrefix !== 'string') throw new Error('ciChainGateCommand: jobPrefix must be a string');
  const jobPrefix = o.jobPrefix || '';
  // gh --jq: "pending" while ANY run of the commit is not completed; otherwise the first non-success
  // counted run (else the newest) as "<conclusion>\t<id>"; "" when every run was skipped/none exist.
  const counted = `select(.conclusion!=null${skip.map((c) => ` and .conclusion!="${c}"`).join('')})`;
  const listJq = `if any(.[]; .status!="completed") then "pending" else [.[]|${counted}] as $r | if ($r|length)==0 then "" else (([$r[]|select(.conclusion!="success")]|.[0]) // $r[0]) | "\\(.conclusion)\\t\\(.databaseId)" end end`;
  const clean = (w) => w.replace(/["\\$`']/g, '');

  const steps = workflows.map((w) => {
    const tag = `${w.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_RUN`;
    const flake = flakeRetries > 0 ? `
  if [ "$CONC" = failure ] && [ "$RETRY" -lt ${flakeRetries} ]; then
    FLOG=$(mktemp) || { echo "FAIL: cannot create a temp file for the failed-job log"; exit 1; }
    gh run view "$RID" --repo "$REPO" --log-failed > "$FLOG" 2>/dev/null
    CLS=$(awk ${shq(AWK_FLAKE_CLASSIFY)} "$FLOG")
    rm -f "$FLOG"
    case "$CLS" in
      ""|*UNMATCHED*)
        echo "CI_FLAKE_UNKNOWN: run $RID failed jobs do not all match a known flake signature; not re-running"
        printf '%s\\n' "$CLS" | awk -F "$TAB" '$1 == "UNMATCHED" { print "  unmatched job: " $2 }' ;;
      *)
        ATT0=$(gh run view "$RID" --repo "$REPO" --json attempt --jq .attempt 2>/dev/null)
        case "$ATT0" in ''|*[!0-9]*) ATT0=1 ;; esac
        if ! gh run rerun "$RID" --repo "$REPO" --failed >/dev/null 2>&1; then echo "FAIL: gh run rerun $RID --failed did not start"; exit 1; fi
        RETRY=$((RETRY + 1))
        printf '%s\\n' "$CLS" | awk ${shq(AWK_FLAKE_PRINT)}
        WAIT=$RID; WAIT_ATT=$ATT0
        continue ;;
    esac
  fi` : '';
    const budget = maxJobMinutes !== null ? `
JOBS=$(gh run view "$RID" --repo "$REPO" --json jobs --jq ${shq(JQ_JOB_SECONDS)} 2>/dev/null) || JOBS=""
JB=$(printf '%s\\n' "$JOBS" | awk -v p="$JOB_PREFIX" -v max=${Math.round(maxJobMinutes * 60)} ${shq(AWK_JOB_BUDGET)})
JMAX=$(printf '%s\\n' "$JB" | awk -F "$TAB" '$1 == "MAX" { print $2 }')
if [ "\${JMAX:--1}" != "-1" ]; then echo "JOB_MAX_MIN=$JMAX"; JOBS_SEEN=$((JOBS_SEEN + 1)); fi
OVER=$(printf '%s\\n' "$JB" | awk -F "$TAB" -v b=${shq(String(maxJobMinutes))} '$1 == "OVER" { print "FAIL: job " $2 " took " $3 " min, budget " b }')
if [ -n "$OVER" ]; then printf '%s\\n' "$OVER"; exit 1; fi` : '';
    return `
CONC=""; RID=""; WAIT=""; WAIT_ATT=0; RETRY=0; REWAIT=0
while :; do
  CONC=""; RID=""
  i=0
  while [ "$i" -lt ${maxPolls} ]; do
    i=$((i + 1))
    if [ -z "$WAIT" ]; then
      ROW=$(gh run list --repo "$REPO" --workflow ${shq(w)} --branch "$BR" --commit "$SHA" --json status,conclusion,databaseId --jq ${shq(listJq)} 2>/dev/null) || ROW=""
      if [ -n "$ROW" ] && [ "$ROW" != pending ]; then CONC=\${ROW%%"$TAB"*}; RID=\${ROW#*"$TAB"}; break; fi
    else
      ROW=$(gh run view "$WAIT" --repo "$REPO" --json status,conclusion,attempt --jq '"\\(.status)\\t\\(.conclusion)\\t\\(.attempt)"' 2>/dev/null) || ROW=""
      VST=\${ROW%%"$TAB"*}; VREST=\${ROW#*"$TAB"}; VCONC=\${VREST%%"$TAB"*}; VATT=\${VREST##*"$TAB"}
      case "$VATT" in ''|*[!0-9]*) VATT=0 ;; esac
      if [ "$VST" = completed ] && [ "$VATT" -gt "$WAIT_ATT" ]; then WAIT=""; REWAIT=1; break; fi
    fi
    [ "$i" -lt ${maxPolls} ] && sleep ${pollSeconds}
  done
  if [ "$REWAIT" = 1 ]; then REWAIT=0; continue; fi
  if [ -z "$CONC" ]; then echo "FAIL: workflow ${clean(w)} has no completed run for $SHA on $BR after ${maxPolls} polls"; exit 1; fi
  echo "${tag}=$RID"
  [ "$CONC" = success ] && break${flake}
  echo "FAIL: workflow ${clean(w)} concluded $CONC (run $RID)"; exit 1
done${budget}`;
  }).join('\n');
  const jobsTail = maxJobMinutes !== null
    ? `\nif [ "$JOBS_SEEN" -eq 0 ]; then echo "FAIL: maxJobMinutes=${maxJobMinutes} but no job named '${clean(jobPrefix)}*' ran in any workflow; the job-time budget measured nothing"; exit 1; fi`
    : '';
  return `set -o pipefail
set +e
cd ${shq(o.dir)} || { echo "FAIL: cannot cd to dir"; exit 1; }
REPO=${shq(o.repo)}; BR=${shq(o.branch)}
TAB=$(printf '\\t')
export FLAKE_SIGS=${shq(sigs.join('\n'))}; JOB_PREFIX=${shq(jobPrefix)}; JOBS_SEEN=0
git fetch origin "$BR" >/dev/null 2>&1
SHA=$(git rev-parse HEAD); REMOTE=$(git rev-parse "origin/$BR" 2>/dev/null)
echo "SHA=$SHA"
if [ "$SHA" != "$REMOTE" ]; then echo "FAIL: HEAD $SHA is not origin/$BR ($REMOTE)"; exit 1; fi${steps}${jobsTail}
echo CI_CHAIN_OK`;
}

/**
 * The CI-chain gate as a babysitter shell task, built with the SDK's real positional form
 * `defineTask(id, impl(args, ctx) => TaskDef, options)`. A task id may be registered only once per
 * process, so call this once per gate with a unique `id`. Takes every ciChainGateCommand option plus
 * `title` and `timeout` (default covers maxPolls * pollSeconds per workflow, doubled with a retry).
 * Assert success by checking stdout for CI_CHAIN_OK.
 *
 * @param {string} id
 * @param {object} opts
 * @param {{defineTask?: Function}} [deps] - inject defineTask (tests); defaults to the SDK's
 */
export function ciChainGate(id, opts = {}, deps = {}) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('ciChainGate: id must be a non-empty string');
  const command = ciChainGateCommand(opts);
  const define = deps.defineTask || sdkDefineTask;
  if (!deps.defineTask && sdkLoadError) throw new Error(`ciChainGate: @a5c-ai/babysitter-sdk failed to load: ${sdkLoadError.message}`, { cause: sdkLoadError });
  if (typeof define !== 'function') throw new Error('ciChainGate: @a5c-ai/babysitter-sdk is not installed (ciChainGateCommand works without it)');
  const workflows = Array.isArray(opts.workflows) && opts.workflows.length ? opts.workflows : ['ci'];
  const attempts = 1 + (opts.flakeRetries === 1 ? 1 : 0);
  const budgetMs = (opts.maxPolls ?? 100) * (opts.pollSeconds ?? 30) * 1000 * workflows.length * attempts + 120000;
  return define(id, (_args, taskCtx) => ({
    kind: 'shell',
    title: opts.title || `GATE: CI chain on ${opts.branch} green for HEAD (${workflows.join(' -> ')})`,
    shell: { command, expectedExitCode: 0, timeout: opts.timeout ?? budgetMs },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }), { kind: 'shell', labels: ['gate', 'ci'] });
}

// ---- static check -------------------------------------------------------------------------

const PROD_PUSH = /\bgit\s+push\b[^\n`'"]*?(?:\s|:)(?:main|master)\b|:refs\/heads\/(?:main|master)\b|\bvercel\b[^\n`]*--prod\b|\b(?:npm|pnpm|yarn)\s+publish\b|\bgh\s+release\s+create\b/;

// Blank out comments, keeping offsets and newlines so line numbers survive.
function stripComments(src) {
  let out = '';
  for (let i = 0; i < src.length;) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, ' '); i = stop; continue;
    }
    if (c === '"' || c === "'" || c === '`') { // copy string/template literal verbatim
      let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, j + 1); i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}

/**
 * Static check: flag production push/deploy commands (git push to main/master, `vercel --prod`,
 * npm/pnpm/yarn publish, gh release create) that are not preceded, in source order, by a
 * `ciChainGate(` use. A gate on branch 'main' does not count (it proves nothing before the push).
 * Escape hatch, file-wide, with a reason: `// ci-gate: <reason>`.
 *
 * @param {string} source - process source text
 * @returns {{line: number, command: string}[]}
 */
export function findProdPushWithoutCiGate(source) {
  const src = String(source ?? '');
  if (/\/\/\s*ci-gate:\s*\S.{3,}/.test(src)) return [];
  const code = stripComments(src);
  const gateAt = [];
  const gre = /\bciChainGate\s*\(/g;
  let m;
  while ((m = gre.exec(code))) {
    let depth = 0; let end = m.index + m[0].length - 1;
    for (; end < code.length; end++) { if (code[end] === '(') depth++; else if (code[end] === ')' && --depth === 0) break; }
    if (!/\bbranch\s*:\s*['"`](?:main|master)['"`]/.test(code.slice(m.index, end + 1))) gateAt.push(m.index);
  }
  const found = [];
  const lines = code.split('\n');
  let offset = 0;
  lines.forEach((text, idx) => {
    const hit = PROD_PUSH.exec(text);
    if (hit && !gateAt.some((g) => g < offset + hit.index)) found.push({ line: idx + 1, command: text.trim() });
    offset += text.length + 1;
  });
  return found;
}
