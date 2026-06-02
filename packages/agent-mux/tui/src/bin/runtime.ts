export interface CliOptions {
  help: boolean;
  noUserPlugins: boolean;
  userPluginsDir?: string;
}

export interface PluginLoadError {
  source: string;
  error: string;
}

export interface PluginLoadResult<TPlugin> {
  plugins: TPlugin[];
  errors: PluginLoadError[];
}

export interface RuntimeDeps<TClient, TPlugin> {
  builtinPlugins: TPlugin[];
  createClient: () => TClient;
  defaultExternalPluginsDir: () => string;
  env?: NodeJS.ProcessEnv;
  loadExternalPlugins: (dir: string) => Promise<PluginLoadResult<TPlugin>>;
  registerBuiltInAdapters: (client: TClient) => void;
  renderApp: (args: { client: TClient; plugins: TPlugin[] }) => void;
  stderr?: NodeJS.WritableStream;
  stdout?: NodeJS.WritableStream;
}

export function userPluginsDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.AMUX_TUI_NO_USER_PLUGINS;
  return value === '1' || value === 'true';
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { help: false, noUserPlugins: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    const nextValue = (): string => {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--no-user-plugins') {
      options.noUserPlugins = true;
      continue;
    }
    if (arg === '--user-plugins-dir') {
      options.userPluginsDir = nextValue();
      continue;
    }
    if (arg.startsWith('--user-plugins-dir=')) {
      const [, value] = arg.split(/=(.*)/s, 2);
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      options.userPluginsDir = value;
      continue;
    }
    throw new Error(`Unknown flag: ${arg}`);
  }

  return options;
}

export function printHelp(stdout: NodeJS.WritableStream = process.stdout): void {
  stdout.write(
    [
      'Usage: agent-mux-tui [options]',
      '',
      'Launch the Ink-based agent-mux TUI.',
      '',
      'Options:',
      '  --user-plugins-dir <dir>  Override user-plugin discovery dir',
      '                            (default: $AMUX_TUI_PLUGINS_DIR or ~/.amux/tui-plugins)',
      '  --no-user-plugins         Skip discovering user plugins from the directory',
      '  -h, --help                Show this help',
    ].join('\n') + '\n',
  );
}

export async function runWithArgs<TClient, TPlugin>(
  argv: string[],
  deps: RuntimeDeps<TClient, TPlugin>,
): Promise<void> {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp(deps.stdout);
    return;
  }

  const client = deps.createClient();
  deps.registerBuiltInAdapters(client);

  const plugins = [...deps.builtinPlugins];
  const userPluginsDir = options.userPluginsDir ?? deps.defaultExternalPluginsDir();
  if (!options.noUserPlugins && !userPluginsDisabled(deps.env)) {
    try {
      const external = await deps.loadExternalPlugins(userPluginsDir);
      plugins.push(...external.plugins);
      for (const error of external.errors) {
        (deps.stderr ?? process.stderr).write(
          `agent-mux-tui: failed to load plugin from ${error.source}: ${error.error}\n`,
        );
      }
    } catch (error) {
      (deps.stderr ?? process.stderr).write(
        `agent-mux-tui: external plugin discovery failed: ${(error as Error).message}\n`,
      );
    }
  }

  deps.renderApp({ client, plugins });
}
