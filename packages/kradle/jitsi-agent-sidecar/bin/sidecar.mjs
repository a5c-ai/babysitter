#!/usr/bin/env node
import { loadConfig, createIpcServer, createJitsiSidecarRuntime, createPuppeteerJitsiClient } from '../src/index.js';

const config = loadConfig();
const jitsi = createPuppeteerJitsiClient(config);
let ipc = null;
let runtime = null;

async function shutdown(reason) {
  if (runtime) await runtime.stop(reason, { graceful: false });
  if (ipc) await ipc.stop();
}

try {
  runtime = createJitsiSidecarRuntime({
    config,
    jitsi,
    broadcast: (event) => ipc?.broadcast(event),
  });
  ipc = createIpcServer({ socketPath: config.socketPath, runtime });

  await ipc.start();
  await runtime.start();

  process.on('SIGTERM', () => {
    shutdown('sigterm').finally(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    shutdown('sigint').finally(() => process.exit(0));
  });
} catch (err) {
  console.error(err.stack || err.message || String(err));
  await shutdown('startup_failed').catch(() => {});
  process.exit(1);
}
