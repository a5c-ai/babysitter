#!/usr/bin/env node
import { createKradleHttpServer } from '../src/http-server.js';

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
