import { RpcServer } from '@a5c-ai/genty-runtime/rpc';

export async function handleRpc(args: { workspace?: string; model?: string }): Promise<number> {
  const server = new RpcServer();

  server.register('health', async () => ({
    status: 'ok',
    workspace: args.workspace ?? process.cwd(),
    timestamp: new Date().toISOString(),
  }));

  server.register('session.create', async (params) => {
    const { handleHarnessCreateRun } = await import('./harness/createRun.js');
    const result = await handleHarnessCreateRun({
      prompt: params.prompt as string,
      harness: 'agent-core',
      workspace: params.workspace as string ?? args.workspace,
      model: params.model as string ?? args.model,
      interactive: false,
      json: true,
      verbose: false,
    });
    return { exitCode: result };
  });

  server.register('session.send', async (params) => {
    const { handleHarnessCreateRun } = await import('./harness/createRun.js');
    const result = await handleHarnessCreateRun({
      prompt: params.message as string,
      harness: 'agent-core',
      workspace: args.workspace,
      model: args.model,
      interactive: false,
      json: true,
      verbose: false,
    });
    return { exitCode: result };
  });

  server.register('model.switch', async (params) => {
    return {
      model: params.model as string,
      provider: params.provider as string ?? 'anthropic',
      switchedAt: new Date().toISOString(),
    };
  });

  server.register('model.list', async () => ({
    models: [
      { id: 'claude-opus-4-6', provider: 'anthropic' },
      { id: 'claude-sonnet-4-6', provider: 'anthropic' },
      { id: 'claude-haiku-4-5-20251001', provider: 'anthropic' },
    ],
  }));

  server.register('tool.list', async () => ({
    tools: ['read', 'write', 'edit', 'grep', 'bash', 'web_search'],
  }));

  server.register('extension.list', async () => ({
    extensions: [],
  }));

  await server.start();
  return 0;
}
