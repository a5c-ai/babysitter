#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export async function main(argv: string[] = process.argv): Promise<void> {
  await yargs(hideBin(argv))
    .scriptName('a5c-hooks-proxy')
    .usage('$0 <command> [options]')
    .demandCommand(1, 'You must provide a command')
    .strict()
    .help()
    .parseAsync();
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
