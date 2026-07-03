/**
 * Milestone D — carry-forward: the `touchesScope` interpreter-payload blind spot.
 *
 * Frozen tests authored strictly from docs/design/proof-based-policy-enforcement.md
 * §7 (AC-38a/AC-38c: interpreter indirection defeats static resolution → unresolvable →
 * covered-but-unauthorized → DENY, never default-allow) and §9 (AC-23: a gate MUST NOT
 * treat `matchArgv` `deny:false` as ALLOW for a covered-scope disguise; the gate must
 * apply an INDEPENDENT uncovered-command default-deny).
 *
 * THE BLIND SPOT (carry-forward the task calls out): a gate that calls `matchArgv` with
 * `commandDefaultAllow: true` and then treats a `{ deny: false }` result as "allow" would
 * let `python -c "import os; os.system('aws s3 rm ...')"` (and perl -e / ruby -e / node -e)
 * through — the interpreter runs an inline payload that NAMES a covered program, but the
 * matcher's leading program is the interpreter, so it is not the covered program. AC-38a
 * requires the interpreter-flag form under a covered scope to be UNRESOLVABLE → deny.
 *
 * This suite pins two things:
 *   (1) `matchArgv` itself denies the interpreter-`-c`/`-e` disguise of a covered program;
 *   (2) the GATE (which owns commandDefaultAllow) must DENY such a disguise even with
 *       commandDefaultAllow=true — a `deny:false` from the matcher is NOT sufficient to
 *       allow when the command touches a covered scope.
 *
 * MODULE PATHS: `matchArgv` imports from `@a5c-ai/policy-adapter`; the intended
 * Milestone-D GATE-1 coverage decision imports from `../policy-verifier-hook.js`
 * (`decideCoverage`). Resolution may fail until Milestone D lands — expected.
 */
import { describe, it, expect } from 'vitest';
import { matchArgv, type ArgvMatchScope } from '@a5c-ai/policy-adapter';
// Intended Milestone-D GATE-1 coverage decision helper (owns commandDefaultAllow, AC-23).
import { decideCoverage } from '../policy-verifier-hook.js';

// A covered scope: `aws s3 rm|cp|sync` under production. The scope recognizes `aws` and
// declares a CLOSED wrapper allowlist (AC-38c). No interpreter is allowlisted.
const AWS_SCOPE: ArgvMatchScope = {
  scopeId: 'aws-prod-write',
  match: {
    program: 'aws',
    subcommandEquals: ['s3 rm', 's3 cp', 's3 sync'],
  },
  wrapperAllowlist: ['time', 'sudo'],
  recognizedPrograms: ['aws'],
  // The dangerous default is OFF by default; even when a gate opts IN, an interpreter
  // disguise of a covered program must still deny (AC-38a).
  commandDefaultAllow: true,
};

const INTERPRETER_DISGUISES: { label: string; command: string }[] = [
  { label: 'python -c', command: `python -c "import os; os.system('aws s3 rm s3://prod --recursive')"` },
  { label: 'python3 -c', command: `python3 -c "import subprocess; subprocess.run(['aws','s3','rm','s3://prod'])"` },
  { label: 'perl -e', command: `perl -e 'system("aws s3 rm s3://prod")'` },
  { label: 'ruby -e', command: `ruby -e 'system("aws s3 sync . s3://prod")'` },
  { label: 'node -e', command: `node -e "require('child_process').execSync('aws s3 cp x s3://prod')"` },
];

describe('Milestone D carry-forward — interpreter-payload disguise of a covered program (AC-38a/AC-38c, AC-23)', () => {
  for (const { label, command } of INTERPRETER_DISGUISES) {
    it(`AC-38a: matchArgv denies the ${label} disguise of a covered aws command`, () => {
      const result = matchArgv(command, AWS_SCOPE);
      // The interpreter-flag form under a covered scope is unresolvable → deny; it MUST
      // NOT return { deny: false } (which the gate could misread as allow).
      expect(result.deny).toBe(true);
      expect(result.covered).toBe(false);
    });

    it(`AC-23: the GATE denies the ${label} disguise even with commandDefaultAllow=true`, () => {
      // The gate owns commandDefaultAllow. A `deny:false` from the matcher must NOT be
      // read as ALLOW when the command touches a covered scope: the gate applies the
      // independent uncovered-command default-deny for covered-scope disguises.
      const decision = decideCoverage(command, [AWS_SCOPE]);
      expect(decision.deny).toBe(true);
    });
  }

  it('AC-38a: a bare shell -c wrapping a covered aws command is also denied (recurses to inner program)', () => {
    const command = `sh -c "aws s3 rm s3://prod --recursive"`;
    const result = matchArgv(command, AWS_SCOPE);
    // sh -c recurses into the inner program (`aws`) → covered → an authorization is
    // required. The matcher marks it covered (needs authorization), NOT default-allowed.
    expect(result.deny === true || result.covered === true).toBe(true);
    expect(result.covered === true ? true : result.deny).toBeTruthy();
  });

  it('AC-23: a gate must NOT treat matchArgv deny:false as ALLOW without an independent default-deny', () => {
    // A genuinely UNCOVERED, unrelated command (no covered program named) with
    // commandDefaultAllow=true is the ONLY case a gate may pass through. The interpreter
    // disguise above is not this case — assert the two are decided differently.
    const benign = decideCoverage('echo hello world', [AWS_SCOPE]);
    const disguise = decideCoverage(INTERPRETER_DISGUISES[0].command, [AWS_SCOPE]);
    expect(benign.deny).toBe(false);
    expect(disguise.deny).toBe(true);
  });
});
