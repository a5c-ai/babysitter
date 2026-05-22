#!/usr/bin/env node
// Convenience alias: starts the HTTP server directly.
const { createKrateHttpServer } = await import('../src/index.js');
const server = createKrateHttpServer();
const port = Number(process.env.PORT || 3080);
server.listen(port, () => console.log(`Krate server listening on port ${port}`));
