/**
 * deployed-route-verify-gate — portable Babysitter process-library gate.
 *
 * The only quality gate that catches serverless-specific failure — native-binary
 * bundling, function OOM, cold-start, cookie/SSR auth — is a request to the ACTUAL
 * DEPLOYED route with a REAL authenticated session, asserting the real response.
 * Local unit tests, local pipeline probes (wrong runtime), and reachability checks
 * (HTTP-401 / chunk-grep) prove the code LOADS, not that it BEHAVES on the target.
 *
 * Born from the cookbook jul-07 recipe-import saga: 5 deploys shipped with fixes
 * "verified" only locally; every real failure (sharp not bundling → prod 500; OOM
 * on a 51MP image → uncatchable HTML-500) lived at the one layer never tested.
 *
 * This is a deterministic `shell` gate (exit-code pass/fail — cannot be negotiated
 * by an agent). It is auth-mechanism-agnostic: you supply the verify command that
 * mints a real session and hits the deployed route. Reference harness for Supabase
 * + @supabase/ssr cookie auth is in the accompanying README.
 *
 * @example
 *   import { defineTask } from '@a5c-ai/babysitter-sdk';
 *   import { createDeployedRouteVerifyGate } from './deployed-route-verify-gate.js';
 *
 *   const gate = createDeployedRouteVerifyGate({
 *     name: 'verify-import-image',
 *     // A command that mints a REAL session, POSTs to the DEPLOYED route, and
 *     // exits 0 only when the real response body satisfies the contract.
 *     command:
 *       "node scripts/verify-prod-route.mjs --path /api/import/image " +
 *       "--file ./fixtures/recipe.heic --expect-status 200 --expect-json draftId",
 *     timeout: 300000,
 *   });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export function createDeployedRouteVerifyGate({
  name = 'deployed-route-verify',
  command,
  projectDir = '.',
  timeout = 300000,
  expectedExitCode = 0,
} = {}) {
  if (!command) {
    throw new Error(
      'createDeployedRouteVerifyGate: `command` is required — it must mint a REAL ' +
        'session, request the DEPLOYED route, and exit non-zero unless the real ' +
        'response body satisfies the contract.',
    );
  }
  return defineTask(name, (args, taskCtx) => ({
    kind: 'shell',
    title: `Deployed-route verification — real session → real request → assert body`,
    labels: ['shell', 'gate', 'deployed-route'],
    shell: {
      command: `cd ${projectDir} && ${command}`,
      expectedExitCode,
      timeout,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }));
}

// Guidance for authoring the verify command / choosing the right layer.
export const DEPLOYED_ROUTE_VERIFY_GUIDANCE = {
  matchTestToFailureMode: {
    'pure logic / data mapping': 'hostless unit test',
    'query / schema / RLS': '2-actor integration test (seeded DB)',
    'native-binary bundling (sharp, node-gyp)': 'DEPLOYED route — bundlers differ',
    'memory / OOM / cold-start / timeout': 'DEPLOYED route — local RAM >> function limit',
    'cookie / SSR auth': 'DEPLOYED route with a real session cookie',
    'rendered / wired UI': 'screenshot of the real authenticated page',
  },
  diagnostic:
    'An uncatchable HTML-5xx (a try/catch around the handler does NOT catch it) is ' +
    'a process kill, usually OOM. A JSON error body is a normal throw you can handle.',
  language:
    '"Verified" requires evidence from the real surface (status + asserted body ' +
    'fields). Otherwise say "passes locally (deployed-route unverified)".',
};
