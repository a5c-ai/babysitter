import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseArgs, runWithArgs } from '../src/bin/runtime.js';

function createPlugin(name: string) {
  return { name, register() {} };
}

function createDeps(overrides: Partial<Parameters<typeof runWithArgs>[1]> = {}) {
  const client = { kind: 'client' };
  const render = vi.fn();

  return {
    client,
    render,
    deps: {
      builtinPlugins: [createPlugin('builtin:core')],
      createClient: vi.fn(() => client),
      defaultExternalPluginsDir: vi.fn(() => '/default/plugins'),
      loadExternalPlugins: vi.fn(async () => ({
        plugins: [createPlugin('user:extra')],
        errors: [],
      })),
      registerBuiltInAdapters: vi.fn(),
      renderApp: vi.fn(({ client: _client, plugins }) => render({ client: _client, plugins })),
      ...overrides,
    },
  };
}

function renderedPlugins(render: ReturnType<typeof vi.fn>): string[] {
  const payload = render.mock.calls[0]?.[0] as { plugins: { name: string }[] } | undefined;
  return payload?.plugins.map((plugin) => plugin.name) ?? [];
}

describe('amux-tui binary entrypoint', () => {
  const env = { ...process.env };

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...env };
  });

  it('parses documented plugin flags', () => {
    expect(parseArgs(['--user-plugins-dir', '/tmp/plugins', '--no-user-plugins'])).toEqual({
      help: false,
      noUserPlugins: true,
      userPluginsDir: '/tmp/plugins',
    });
    expect(parseArgs(['--user-plugins-dir=/tmp/plugins'])).toEqual({
      help: false,
      noUserPlugins: false,
      userPluginsDir: '/tmp/plugins',
    });
  });

  it('loads discovered plugins from the default user directory by default', async () => {
    const { deps, render } = createDeps();

    await runWithArgs([], deps);

    expect(deps.defaultExternalPluginsDir).toHaveBeenCalledTimes(1);
    expect(deps.loadExternalPlugins).toHaveBeenCalledWith('/default/plugins');
    expect(renderedPlugins(render)).toEqual(['builtin:core', 'user:extra']);
  });

  it('honors --user-plugins-dir over the default directory', async () => {
    const { deps, render } = createDeps();

    await runWithArgs(['--user-plugins-dir', '/custom/plugins'], deps);

    expect(deps.defaultExternalPluginsDir).not.toHaveBeenCalled();
    expect(deps.loadExternalPlugins).toHaveBeenCalledWith('/custom/plugins');
    expect(renderedPlugins(render)).toEqual(['builtin:core', 'user:extra']);
  });

  it('honors --no-user-plugins and renders only builtins', async () => {
    const { deps, render } = createDeps();

    await runWithArgs(['--user-plugins-dir', '/custom/plugins', '--no-user-plugins'], deps);

    expect(deps.loadExternalPlugins).not.toHaveBeenCalled();
    expect(renderedPlugins(render)).toEqual(['builtin:core']);
  });

  it('honors AMUX_TUI_NO_USER_PLUGINS as an opt-out', async () => {
    process.env.AMUX_TUI_NO_USER_PLUGINS = 'true';
    const { deps, render } = createDeps();

    await runWithArgs([], deps);

    expect(deps.loadExternalPlugins).not.toHaveBeenCalled();
    expect(renderedPlugins(render)).toEqual(['builtin:core']);
  });

  it('prints help without launching the app', async () => {
    const { deps } = createDeps();
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await runWithArgs(['--help'], deps);

    expect(stdout).toHaveBeenCalled();
    expect(deps.createClient).not.toHaveBeenCalled();
    expect(deps.renderApp).not.toHaveBeenCalled();
  });
});
