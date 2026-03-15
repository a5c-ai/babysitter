#!/usr/bin/env node
import { handleMcpServe } from "./commands/mcpServe";

handleMcpServe({ json: false }).catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
