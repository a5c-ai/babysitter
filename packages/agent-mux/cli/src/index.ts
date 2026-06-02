#!/usr/bin/env node

/**
 * @a5c-ai/agent-mux-cli
 *
 * CLI binary entry point for the `amux` command.
 *
 * Parses arguments, creates a client, and dispatches to the appropriate
 * command handler. Exports core functionality for programmatic use.
 */

export { createClient } from '@a5c-ai/agent-mux-comm';
export { ExitCode, errorCodeToExitCode } from './exit-codes.js';
export { parseArgs } from './parse-args.js';
export { registerBuiltInAdapters } from './bootstrap.js';
export { resolveCliLoggerConfig, type CliLoggerConfig } from './loggingConfig.js';
export type { ParsedArgs, FlagDef } from './parse-args.js';
// Re-exported so the meta-package shim (`@a5c-ai/agent-mux`) can drive the CLI.
export { main as runCli };

import { createClient, AgentMuxError } from '@a5c-ai/agent-mux-comm';
import { parseArgs } from './parse-args.js';
import { flagBool, flagStr } from './parse-args.js';
import { RUN_FLAGS } from './commands/run.js';
import { INSTALL_FLAGS } from './commands/install.js';
import { ExitCode, errorCodeToExitCode } from './exit-codes.js';
import { setColorEnabled, printError, printJsonError } from './output.js';
import { printHelp, printVersion } from './commands/help.js';
import { runCommand } from './commands/run.js';
import { adaptersCommand } from './commands/adapters.js';
import { sessionsCommand } from './commands/sessions.js';
import { configCommand } from './commands/config.js';
import { authCommand } from './commands/auth.js';
import { modelsCommand } from './commands/models.js';
import { profilesCommand } from './commands/profiles.js';
import { pluginCommand } from './commands/plugin.js';
import { mcpCommand } from './commands/mcp.js';
import { installCommand } from './commands/install.js';
import { detectHostCommand } from './commands/detect-host.js';
import { remoteCommand, REMOTE_FLAGS } from './commands/remote.js';
import { hooksCommand, HOOKS_FLAGS } from './commands/hooks.js';
import { doctorCommand } from './commands/doctor.js';
import { tuiCommand } from './commands/tui.js';
import { skillCommand, SKILL_FLAGS } from './commands/skill.js';
import { agentCommand, AGENT_FLAGS } from './commands/agent.js';
import { gatewayCommand, GATEWAY_FLAGS } from './commands/gateway/index.js';
import { launchCommand, LAUNCH_FLAGS } from './commands/launch.js';
import { workspacesCommand, WORKSPACE_FLAGS } from './commands/workspaces.js';
import { registerBuiltInAdapters } from './bootstrap.js';
import { reconfigureLogger } from '@a5c-ai/agent-mux-observability';
import { resolveCliLoggerConfig } from './loggingConfig.js';

/**
 * Main CLI entry point.
 *
 * @param argv - Command-line arguments (defaults to process.argv.slice(2))
 * @returns Exit code
 */
export async function main(argv?: string[]): Promise<number> {
  const rawArgs = argv ?? process.argv.slice(2);

  // First pass: parse with all known flags to capture global flags
  const args = parseArgs(rawArgs, { ...RUN_FLAGS, ...INSTALL_FLAGS, ...REMOTE_FLAGS, ...HOOKS_FLAGS, ...SKILL_FLAGS, ...AGENT_FLAGS, ...GATEWAY_FLAGS, ...LAUNCH_FLAGS, ...WORKSPACE_FLAGS });

  // Handle --no-color
  if (flagBool(args.flags, 'no-color') === true) {
    setColorEnabled(false);
  }

  // Handle --version / -V
  if (flagBool(args.flags, 'version') === true) {
    printVersion();
    return ExitCode.SUCCESS;
  }

  // Handle `amux version` command
  if (args.command === 'version') {
    printVersion();
    return ExitCode.SUCCESS;
  }

  // Handle --help / -h
  if (flagBool(args.flags, 'help') === true) {
    printHelp(args.command);
    return ExitCode.SUCCESS;
  }

  // Handle `amux help [command]`
  if (args.command === 'help') {
    printHelp(args.positionals[0] ?? args.subcommand);
    return ExitCode.SUCCESS;
  }

  // No command — print help. But if there are stray positionals, treat
  // the first as an unknown command so users get actionable feedback
  // instead of silently seeing the help text with a success exit code.
  if (!args.command) {
    if (args.positionals.length > 0) {
      const unknown = args.positionals[0];
      const jsonModeEarly = flagBool(args.flags, 'json') === true;
      if (jsonModeEarly) {
        printJsonError('VALIDATION_ERROR', `Unknown command: ${unknown}`);
      } else {
        printError(`Unknown command: ${unknown}. Run "amux help" for usage.`);
      }
      return ExitCode.USAGE_ERROR;
    }
    printHelp();
    return ExitCode.SUCCESS;
  }

  // Create client with global flag overrides
  const jsonMode = flagBool(args.flags, 'json') === true;

  try {
    const clientOpts: Record<string, unknown> = {};

    const configDir = flagStr(args.flags, 'config-dir');
    const projectDir = flagStr(args.flags, 'project-dir');
    const debug = flagBool(args.flags, 'debug');
    const agent = flagStr(args.flags, 'agent');
    const model = flagStr(args.flags, 'model');
    const logLevel = flagStr(args.flags, 'log-level');
    const logFile = flagStr(args.flags, 'log-file');

    if (configDir) clientOpts['configDir'] = configDir;
    if (projectDir) clientOpts['projectConfigDir'] = projectDir;
    if (debug) clientOpts['debug'] = true;
    if (agent) clientOpts['defaultAgent'] = agent;
    if (model) clientOpts['defaultModel'] = model;

    reconfigureLogger(resolveCliLoggerConfig({ debug, logLevel, logFile }));

    const client = createClient(clientOpts as Parameters<typeof createClient>[0]);
    registerBuiltInAdapters(client);

    // Dispatch to command handler
    switch (args.command) {
      case 'run':
        return await runCommand(client, args);

      case 'adapters':
        return await adaptersCommand(client, args);

      case 'sessions':
        return await sessionsCommand(client, args);

      case 'config':
        return await configCommand(client, args);

      case 'auth':
        return await authCommand(client, args);

      case 'models':
        return await modelsCommand(client, args);

      case 'profiles':
        return await profilesCommand(client, args);

      case 'plugin':
      case 'plugins':
        return await pluginCommand(client, args);

      case 'mcp':
        return await mcpCommand(client, args);

      case 'install':
      case 'uninstall':
      case 'update':
      case 'detect':
        return await installCommand(client, args);

      case 'detect-host':
        return await detectHostCommand(client, args);

      case 'remote':
        return await remoteCommand(client, args);

      case 'hooks':
        return await hooksCommand(client, args);

      case 'doctor':
        return await doctorCommand(client, args);

      case 'tui':
        return await tuiCommand(client, args);

      case 'skill':
        return await skillCommand(client, args);

      case 'agent':
        return await agentCommand(client, args);

      case 'gateway':
        return await gatewayCommand(client, args);

      case 'launch':
        return await launchCommand(client, args);

      case 'workspaces':
        return await workspacesCommand(client, args);

      default:
        if (jsonMode) {
          printJsonError('VALIDATION_ERROR', `Unknown command: ${args.command}`);
        } else {
          printError(`Unknown command: ${args.command}. Run "amux help" for usage.`);
        }
        return ExitCode.USAGE_ERROR;
    }
  } catch (err: unknown) {
    if (err instanceof AgentMuxError) {
      if (jsonMode) {
        printJsonError(err.code, err.message, err.recoverable);
      } else {
        printError(err.message);
      }
      return errorCodeToExitCode(err.code);
    }

    const message = err instanceof Error ? err.message : String(err);
    if (jsonMode) {
      printJsonError('INTERNAL', message);
    } else {
      printError(message);
    }
    return ExitCode.GENERAL_ERROR;
  }
}

// Run when executed directly (not imported)
// We detect this by checking if this file is the entry point
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('/index.js') ||
   process.argv[1].endsWith('\\index.js') ||
   process.argv[1].endsWith('/amux') ||
   process.argv[1].endsWith('\\amux'));

if (isDirectRun) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((err: unknown) => {
    process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}
