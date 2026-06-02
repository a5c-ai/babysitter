/**
 * clear-session command — Delete one session state file.
 *
 * Spec section 18.5.
 */

import type { CommandModule } from 'yargs';
import { deleteSession } from '@a5c-ai/agent-mux-hooks-core';

interface ClearSessionArgs {
  'session-id': string;
  json?: boolean;
}

export const clearSessionCommand: CommandModule<object, ClearSessionArgs> = {
  command: 'clear-session',
  describe: 'Delete a session state file',
  builder: (yargs) =>
    yargs
      .option('session-id', {
        type: 'string',
        demandOption: true,
        describe: 'Session ID to delete',
      })
      .option('json', {
        type: 'boolean',
        default: false,
        describe: 'Output JSON format',
      }),
  handler: async (args) => {
    await deleteSession(args['session-id']);

    if (args.json) {
      process.stdout.write(
        JSON.stringify({ status: 'deleted', sessionId: args['session-id'] }) + '\n',
      );
    } else {
      console.log(`Session deleted: ${args['session-id']}`);
    }
  },
};
