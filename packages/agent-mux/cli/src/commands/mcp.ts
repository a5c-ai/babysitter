import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printError } from '../output.js';

export async function mcpCommand(
  client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  if (args.flags.help) {
    process.stdout.write([
      'Usage: amux mcp <subcommand> <agent> [args] [flags]',
      '',
      'Manage Model Context Protocol (MCP) servers per agent',
      '',
      'Subcommands:',
      '  list <agent>                    List installed MCP servers',
      '  install <agent> <server>        Install MCP server',
      '  uninstall <agent> <server>      Uninstall MCP server',
      '',
      'Flags:',
      '  --project                       Use project-level configuration',
      '  --global                        Use global configuration (default)',
      '',
      'Examples:',
      '  amux mcp list claude',
      '  amux mcp install claude filesystem',
      '  amux mcp install claude filesystem --project',
    ].join('\n') + '\n');
    return ExitCode.SUCCESS;
  }

  const subcommand = args.subcommand;
  const agentName = args.positionals[0];

  if (!subcommand) {
    printError('Missing subcommand. Available: list, install, uninstall');
    return ExitCode.GENERAL_ERROR;
  }

  if (!agentName) {
    printError('Missing required argument: <agent>');
    return ExitCode.GENERAL_ERROR;
  }

  const isGlobal = args.flags.global === true || !args.flags.project;

  try {
    switch (subcommand) {
      case 'list': {
        const plugins = await client.plugins.list(agentName as never);
        const servers = plugins.filter(p => p.format === 'mcp-server' || !p.format);
        if (servers.length === 0) {
          process.stdout.write('(no MCP servers installed)\n');
          return ExitCode.SUCCESS;
        }
        for (const server of servers) {
          const status = 'enabled'; // MCP servers are enabled by default
          const s = server as { pluginId: string; scope?: string; command?: string; args?: string[]; env?: Record<string, string> };
          
          let cmdStr = s.command ?? '';
          if (s.args && s.args.length > 0) cmdStr += ' ' + s.args.join(' ');
          
          let envStr = '';
          if (s.env && Object.keys(s.env).length > 0) {
            envStr = Object.entries(s.env).map(([k, v]) => `${k}=${v}`).join(' ');
          }
          
          const scopeStr = s.scope ? `[${s.scope}]` : '';
          const displayStr = [s.pluginId, status, scopeStr, cmdStr, envStr].filter(Boolean).join('\t');
          process.stdout.write(`${displayStr}\n`);
        }
        return ExitCode.SUCCESS;
      }
      case 'install': {
        const serverName = args.positionals[1];
        if (!serverName) {
          printError('Missing required argument: <server>');
          return ExitCode.GENERAL_ERROR;
        }
        await client.plugins.install(agentName as never, serverName, { global: isGlobal });
        process.stdout.write(`installed: ${serverName} (${isGlobal ? 'global' : 'project'})\n`);
        return ExitCode.SUCCESS;
      }
      case 'uninstall': {
        const serverToRemove = args.positionals[1];
        if (!serverToRemove) {
          printError('Missing required argument: <server>');
          return ExitCode.GENERAL_ERROR;
        }
        await client.plugins.uninstall(agentName as never, serverToRemove, { global: args.flags.global as boolean | undefined });
        process.stdout.write(`uninstalled: ${serverToRemove}\n`);
        return ExitCode.SUCCESS;
      }
      default:
        printError(`Unknown subcommand: ${subcommand}`);
        return ExitCode.GENERAL_ERROR;
    }
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    printError(`mcp ${subcommand} failed: ${msg}`);
    return ExitCode.GENERAL_ERROR;
  }
}
