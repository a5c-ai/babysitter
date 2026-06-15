import { readFile } from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import { createControllerUiModel, createKradleHandoffSummary, createKradleMvpDemo, createKradleRuntime } from '../src/index.js';

const packageInfo = JSON.parse(await readFile('package.json', 'utf8'));
const runtime = createKradleRuntime();
const controller = createControllerUiModel(runtime);
const snapshot = runtime.snapshot();
const demo = createKradleMvpDemo();
const lifecycle = demo.lifecycle;
const summary = createKradleHandoffSummary(demo, { packageInfo });
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
await writeFile('dist/kradle-summary.json', JSON.stringify(summary, null, 2));
await writeFile('dist/kradle-controller-ui.json', JSON.stringify(controller, null, 2));
await writeFile('dist/kradle-runtime-snapshot.json', JSON.stringify(snapshot, null, 2));
await writeFile('dist/kradle-lifecycle.json', JSON.stringify(lifecycle, null, 2));
console.log('build ok: dist/kradle-summary.json dist/kradle-controller-ui.json dist/kradle-runtime-snapshot.json dist/kradle-lifecycle.json');