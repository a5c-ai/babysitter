import { access } from 'node:fs/promises';

const required = [
  'src/index.js',
  'src/ipc-server.js',
  'src/runtime.js',
  'src/puppeteer-jitsi-client.js',
  'bin/sidecar.mjs',
  'bin/graceful-leave.mjs',
  'Dockerfile',
];

for (const file of required) {
  await access(new URL(`../${file}`, import.meta.url));
}
