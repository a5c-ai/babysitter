import { readFile } from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import { createControllerUiModel, createKrateHandoffSummary, createKrateMvpDemo, createKrateRuntime } from '../src/index.js';

const packageInfo = JSON.parse(await readFile('package.json', 'utf8'));
const runtime = createKrateRuntime();
const controller = createControllerUiModel(runtime);
const snapshot = runtime.snapshot();
const demo = createKrateMvpDemo();
const lifecycle = demo.lifecycle;
const summary = createKrateHandoffSummary(demo, { packageInfo });
summary.controller = {
  status: controller.status,
  namespace: controller.namespace,
  endpoints: controller.controller.endpoints,
  metrics: controller.metrics,
  operations: controller.operations
};
summary.runtime = {
  resources: Object.fromEntries(Object.entries(snapshot.resources).map(([kind, resources]) => [kind, resources.length])),
  events: snapshot.events.length,
  auditEntries: snapshot.auditLog.length
};
await mkdir('dist', { recursive: true });
await writeFile('dist/krate-summary.json', JSON.stringify(summary, null, 2));
await writeFile('dist/krate-controller-ui.json', JSON.stringify(controller, null, 2));
await writeFile('dist/krate-runtime-snapshot.json', JSON.stringify(snapshot, null, 2));
await writeFile('dist/krate-lifecycle.json', JSON.stringify(lifecycle, null, 2));
console.log('build ok: dist/krate-summary.json dist/krate-controller-ui.json dist/krate-runtime-snapshot.json dist/krate-lifecycle.json');