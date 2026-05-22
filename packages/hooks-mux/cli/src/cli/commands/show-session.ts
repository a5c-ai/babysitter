/**
 * show-session command — Inspect current session state.
 *
 * Spec section 18.4.
 */

import type { CommandModule } from 'yargs';
import { loadSession } from '@a5c-ai/hooks-mux-core';

interface ShowSessionArgs {
  'session-id': string;
  json?: boolean;
}

export const showSessionCommand: CommandModule<object, ShowSessionArgs> = {
  command: 'show-session',
  describe: 'Inspect current session state',
  builder: (yargs) =>
    yargs
      .option('session-id', {
        type: 'string',
        demandOption: true,
        describe: 'Session ID to inspect',
      })
      .option('json', {
        type: 'boolean',
        default: false,
        describe: 'Output JSON format',
      }),
  handler: async (args) => {
    const session = await loadSession(args['session-id']);

    if (!session) {
      if (args.json) {
        process.stdout.write(JSON.stringify({ error: 'Session not found', sessionId: args['session-id'] }) + '\n');
      } else {
        console.error(`Session not found: ${args['session-id']}`);
      }
      process.exitCode = 1;
      return;
    }

    if (args.json) {
      process.stdout.write(JSON.stringify(session, null, 2) + '\n');
    } else {
      console.log(`Session: ${session.sessionId}`);
      console.log(`  Adapter:  ${session.adapter}`);
      console.log(`  Created:  ${session.createdAt}`);
      console.log(`  Updated:  ${session.updatedAt}`);
      if (session.cwd) console.log(`  CWD:      ${session.cwd}`);
      const envCount = Object.keys(session.persistedEnv).length;
      console.log(`  Env vars: ${envCount}`);
      const varCount = Object.keys(session.contextVars).length;
      console.log(`  Context:  ${varCount} vars, ${session.contextFragments.length} fragments`);
    }
  },
};
