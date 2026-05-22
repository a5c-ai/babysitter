import { createKrateHttpServer, createKrateRuntime, runSmokeAssertions } from '../src/index.js';

const runtime = createKrateRuntime();
const server = createKrateHttpServer({ runtime });
const checks = [];

function record(name, passed, evidence = '') {
  checks.push({ name, passed: Boolean(passed), evidence });
  console.log(`${passed ? 'ok' : 'not ok'} - ${name}${evidence ? ` (${evidence})` : ''}`);
}

await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let model;
try {
  const health = await fetch(`${base}/healthz`);
  record('HTTP health endpoint is live', health.ok, '/healthz');
  const modelResponse = await fetch(`${base}/api/controller`);
  model = await modelResponse.json();
  record('Controller API exposes Krate workspace model', modelResponse.ok && model.controller.mode === 'krate-workspace', '/api/controller');
  record('Controller model reports truthful ready or degraded state', ['ready', 'degraded'].includes(model.status) && Number.isFinite(model.metrics.resources), `${model.status}; ${model.metrics.resources} resources`);
  record('Controller model includes Krate management endpoints', model.controller.endpoints.some((endpoint) => endpoint.path === '/api/orgs/:org/resources') && model.controller.endpoints.some((endpoint) => endpoint.path === '/api/orgs/:org/repositories'), model.controller.endpoints.map((endpoint) => endpoint.path).join(', '));
  record('Controller model includes publishing gates', model.operations.releaseGates.includes('npm pack --json') && model.operations.releaseGates.includes('docker build'), model.operations.releaseGates.join(', '));
  const snapshotResponse = await fetch(`${base}/api/orgs/default/snapshot`);
  const snapshot = await snapshotResponse.json();
  record('Org snapshot endpoint exports durable runtime state', snapshotResponse.ok && snapshot.export?.controlPlane && snapshot.resources?.Repository?.length > 0, '/api/orgs/default/snapshot');
} finally {
  await new Promise((resolve) => server.close(resolve));
}

const contractSmoke = runSmokeAssertions();
for (const [name, passed] of contractSmoke.assertions) record(name, passed, 'runtime contract compatibility');
if (!checks.every((check) => check.passed)) {
  console.error(JSON.stringify({ status: 'failed', checks }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'success', checks: checks.length, controllerStatus: model.status, resources: model.metrics.resources }, null, 2));
