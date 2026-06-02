#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { createHooksLogger } from './hooks-logger';
import { invokeCommand } from './commands/invoke';
import { execCommand } from './commands/exec';
import { bootstrapCommand } from './commands/bootstrap';
import { showSessionCommand } from './commands/show-session';
import { clearSessionCommand } from './commands/clear-session';
import { doctorCommand } from './commands/doctor';

export async function main(argv: string[] = process.argv): Promise<void> {
  await yargs(hideBin(argv))
    .scriptName('agent-mux-hooks')
    .usage('$0 <command> [options]')
    .command(invokeCommand)
    .command(execCommand)
    .command(bootstrapCommand)
    .command(showSessionCommand)
    .command(clearSessionCommand)
    .command(doctorCommand)
    .demandCommand(1, 'You must provide a command')
    .strict()
    .help()
    .parse();
}

if (require.main === module) {
  const logger = createHooksLogger('main');
  main().catch((err: unknown) => {
    void logger.error('cli main failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    console.error(err);
    process.exit(1);
  });
}
