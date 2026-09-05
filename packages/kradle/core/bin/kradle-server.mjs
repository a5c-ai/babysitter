#!/usr/bin/env node
import { createKradleHttpServer } from '../src/http-server.js';
import {
  createKradleApiController,
  createKubernetesResourceGateway,
  createGiteaService,
  reconcileRepositories,
} from '../src/index.js';

const portArg = process.argv.find((arg) => arg.startsWith('--port='));
const port = Number(portArg?.split('=')[1] || process.env.PORT || 3080);
const server = createKradleHttpServer();
server.listen(port, () => {
  console.log(JSON.stringify({
    status: 'listening',
    port,
    mode: 'kubernetes-api',
    endpoints: ['/healthz', '/api/controller', '/api/controller/resources', '/api/repositories', '/api/watch/*', '/api/git-proxy']
  }));
});

// Opt-in self-heal loop: periodically ensure every Repository CRD has a backing
// Gitea repo. Off unless KRADLE_REPO_RECONCILE_INTERVAL_MS > 0. Best-effort — a
// failed pass logs and retries on the next tick; it never crashes the server.
const reconcileIntervalMs = Number(process.env.KRADLE_REPO_RECONCILE_INTERVAL_MS || 0);
if (reconcileIntervalMs > 0) {
  const controller = createKradleApiController({ resourceGateway: createKubernetesResourceGateway() });
  const giteaService = createGiteaService();
  const runPass = async () => {
    try {
      const list = await controller.listResource('Repository');
      const repositories = Array.isArray(list) ? list : (list?.items || []);
      const summary = await reconcileRepositories(repositories, { giteaService, logger: console });
      if (summary.created || summary.failed) {
        console.log(JSON.stringify({ event: 'repository-reconcile', ...summary, errors: undefined, errorCount: summary.errors.length }));
      }
    } catch (err) {
      console.warn(`[kradle] repository reconcile pass failed: ${err.message}`);
    }
  };
  console.log(JSON.stringify({ status: 'repository-reconcile-loop', intervalMs: reconcileIntervalMs, enabled: Boolean(giteaService) }));
  const timer = setInterval(runPass, reconcileIntervalMs);
  timer.unref?.();
  runPass();
}
