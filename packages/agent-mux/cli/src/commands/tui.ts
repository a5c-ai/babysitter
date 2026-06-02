import type { AgentMuxClient } from '@a5c-ai/agent-mux-comm';
import type { ParsedArgs } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printError } from '../output.js';

export async function tuiCommand(
  client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  if (args.flags.help) {
    process.stdout.write(
      [
        'Usage: amux tui [--agent <name>]',
        '',
        'Launches the Ink-based agent-mux TUI with the default plugin set.',
        '',
        'Options:',
        '  --agent <name>            Default agent for new prompts (default: claude-code)',
        '  --user-plugins-dir <dir>  Override user-plugin discovery dir',
        '                            (default: $AMUX_TUI_PLUGINS_DIR or ~/.amux/tui-plugins)',
        '  --no-user-plugins         Skip discovering user plugins from the directory',
      ].join('\n') + '\n',
    );
    return ExitCode.SUCCESS;
  }

  let tui: {
    App: unknown;
    builtinPlugins: unknown[];
    loadExternalPlugins: (
      dir?: string,
    ) => Promise<{ plugins: unknown[]; errors: { source: string; error: string }[] }>;
    defaultExternalPluginsDir: () => string;
  };
  try {
    const dynImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
    tui = (await dynImport('@a5c-ai/agent-mux-tui')) as never;
  } catch (err) {
    printError(
      'The TUI package is not installed. Install it with:\n' +
        '  npm i -g @a5c-ai/agent-mux-tui\n' +
        `Underlying error: ${(err as Error).message}`,
    );
    return ExitCode.GENERAL_ERROR;
  }

  const React = await import('react');
  const defaultAgent = (args.flags.agent as string | undefined) ?? 'claude-code';
  const noUser = args.flags['no-user-plugins'] === true;
  const userDir =
    typeof args.flags['user-plugins-dir'] === 'string'
      ? (args.flags['user-plugins-dir'] as string)
      : tui.defaultExternalPluginsDir();

  const plugins: unknown[] = [...tui.builtinPlugins];
  if (!noUser) {
    try {
      const ext = await tui.loadExternalPlugins(userDir);
      plugins.push(...ext.plugins);
      for (const e of ext.errors) {
        process.stderr.write(`tui: failed to load plugin from ${e.source}: ${e.error}\n`);
      }
    } catch (e) {
      process.stderr.write(`tui: external plugin discovery failed: ${(e as Error).message}\n`);
    }
  }

  const { render } = await import('ink');
  // Type assertion bridges Ink 5.x (React 18 types) with React 19's stricter ReactNode
  render(
    React.createElement(tui.App as never, {
      client: client as never,
      plugins: plugins as never,
      defaultAgent,
    }) as any,
  );
  return ExitCode.SUCCESS;
}
