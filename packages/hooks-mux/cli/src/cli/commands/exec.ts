/**
 * exec command — Run a command with restored session context.
 *
 * Spec section 18.2.
 *
 * Pipeline:
 *   1. Load session state
 *   2. Materialize env/context into subprocess
 *   3. Exec target command
 */

import { spawn } from 'child_process';
import type { CommandModule } from 'yargs';
import {
  loadSession,
  materializeExecContext,
} from '@a5c-ai/hooks-mux-core';
import { createHooksLogger } from '../hooks-logger';

interface ExecArgs {
  'session-id': string;
  _: (string | number)[];
}

export const execCommand: CommandModule<object, ExecArgs> = {
  command: 'exec',
  describe: 'Run a command with restored session context',
  builder: (yargs) =>
    yargs
      .option('session-id', {
        type: 'string',
        demandOption: true,
        describe: 'Session ID to load context from',
      })
      .parserConfiguration({ 'populate--': true })
      .example(
        '$0 exec --session-id abc123 -- echo hello',
        'Run "echo hello" with session abc123 context',
      ),
  handler: async (args) => {
    const logger = createHooksLogger('exec');
    const sessionId = args['session-id'];
    const command = (args['--'] as string[] | undefined) ?? [];

    if (command.length === 0) {
      await logger.error('exec invoked without command', { sessionId });
      console.error('Error: No command specified after --');
      process.exitCode = 1;
      return;
    }

    // Create a session store shim for materializeExecContext
    const sessionStore = {
      loadSession: (id: string) => loadSession(id),
      saveSession: async () => { /* not needed for exec */ },
    };

    // Materialize execution context
    let childEnv: Record<string, string | undefined>;
    try {
      const materialized = await materializeExecContext({
        sessionId,
        sessionStore,
      });

      // Merge materialized env with current process env
      childEnv = {
        ...process.env,
        ...materialized.env,
      };
      await logger.debug('exec materialized session context', {
        sessionId,
        command: command.join(' '),
      });
    } catch {
      // Fallback: inject at least AGENT_SESSION_ID even if session not found
      childEnv = {
        ...process.env,
        AGENT_SESSION_ID: sessionId,
      };
      await logger.warn('exec fell back to minimal session context', {
        sessionId,
        command: command.join(' '),
      });
    }

    // Spawn the target command
    const [cmd, ...cmdArgs] = command;
    await logger.info('exec spawning command', {
      sessionId,
      command: [cmd, ...cmdArgs].join(' '),
    });
    const child = spawn(cmd, cmdArgs, {
      env: childEnv,
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      void logger.error('exec spawn failed', {
        sessionId,
        command: [cmd, ...cmdArgs].join(' '),
        error: err.message,
      });
      console.error(`Failed to execute command: ${err.message}`);
      process.exitCode = 1;
    });

    child.on('close', (code) => {
      void logger.info('exec completed', {
        sessionId,
        command: [cmd, ...cmdArgs].join(' '),
        exitCode: code ?? 0,
      });
      process.exitCode = code ?? 0;
    });

    // Wait for the child process to finish
    await new Promise<void>((resolve) => {
      child.on('close', () => resolve());
    });
  },
};
