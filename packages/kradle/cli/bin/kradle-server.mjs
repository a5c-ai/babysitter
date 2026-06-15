#!/usr/bin/env node
// Convenience alias: starts the HTTP server directly.
const { createKradleHttpServer } = await import('../src/index.js');
const server = createKradleHttpServer();
const port = Number(process.env.PORT || 3080);
server.listen(port, () => console.log(`Kradle server listening on port ${port}`));
