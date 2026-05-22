#!/usr/bin/env node

/**
 * Omni CLI — thin wrapper around agent-platform's CLI.
 *
 * Delegates all argument parsing, dispatch, and output to the platform layer.
 * Future versions will compose TUI plugins and agent-mux features here.
 */

import { createBabysitterAgentCli } from "@a5c-ai/agent-platform";

const cli = createBabysitterAgentCli();

if (require.main === module) {
  void cli.run().then((code: number) => {
    process.exitCode = code;
  });
}

export { cli };
export { createBabysitterAgentCli } from "@a5c-ai/agent-platform";
