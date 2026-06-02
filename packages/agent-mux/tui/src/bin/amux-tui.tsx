#!/usr/bin/env node

export * from './agent-mux-tui.js';

import { runAgentMuxTuiCli } from './agent-mux-tui.js';

const invokedAsScript = (() => {
  try {
    const argv1 = process.argv[1];
    if (!argv1) return false;
    return /amux-tui(\.js|\.tsx?)?$/.test(argv1);
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  process.stderr.write('[agent-mux] "amux-tui" is deprecated, use "agent-mux-tui" instead.\n');
  runAgentMuxTuiCli();
}
