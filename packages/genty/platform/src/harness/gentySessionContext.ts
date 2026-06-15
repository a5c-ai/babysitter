import { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';
import type { IdentityKeyPair } from '@a5c-ai/genty-core/trust';
import { loadOrCreate } from '../trust/key-store.js';
import { createDynamicContextPipeline, type DynamicContextPipeline } from '../context/dynamic.js';
import { loadInstructions, type LoadedInstructions } from '../context/instructions.js';
import { SteeringQueue } from '../interaction/steering.js';
import { createModelSwitchState, type ModelSwitchState } from '../interaction/model-switch.js';
import { activateDiscoveredExtensions } from '../extensions/discovery.js';

export interface GentySessionContextOptions {
  workspace: string;
  model?: string;
  provider?: string;
  agentId?: string;
  sessionId: string;
  isolated?: boolean;
}

export interface GentySessionContext {
  readonly agentId: string;
  readonly sessionId: string;
  readonly keyPair: IdentityKeyPair;
  readonly extensionRegistry: ExtensionRegistry;
  readonly dynamicContext: DynamicContextPipeline;
  readonly instructions: LoadedInstructions;
  readonly steeringQueue: SteeringQueue;
  readonly modelSwitch: ModelSwitchState;
  readonly extensionLoadResult: { activated: string[]; failed: string[] };
}

export async function createGentySessionContext(
  opts: GentySessionContextOptions,
): Promise<GentySessionContext> {
  const agentId = opts.agentId ?? `genty-${opts.sessionId}`;

  // 1. Key persistence — load or create agent key
  const storedKey = loadOrCreate(agentId, `session:${opts.sessionId}`);

  // 2. Extension registry
  const extensionRegistry = new ExtensionRegistry();

  // 3. Dynamic context pipeline
  const dynamicContext = createDynamicContextPipeline();

  // 4. Instructions loader (AGENTS.md / SYSTEM.md)
  const instructions = loadInstructions(opts.workspace);

  // 5. Steering queue
  const steeringQueue = new SteeringQueue();

  // 6. Model switch state
  const modelSwitch = createModelSwitchState(
    opts.model ?? 'claude-sonnet-4-6',
    opts.provider ?? 'anthropic',
  );

  // 7. Discover and activate extensions (unless isolated)
  let extensionLoadResult = { activated: [] as string[], failed: [] as string[] };
  if (!opts.isolated) {
    extensionLoadResult = await activateDiscoveredExtensions(extensionRegistry);

    // Wire extension context providers into the dynamic context pipeline
    for (const provider of extensionRegistry.getContextProviders()) {
      dynamicContext.addProvider(provider);
    }
  }

  return {
    agentId,
    sessionId: opts.sessionId,
    keyPair: storedKey.keyPair,
    extensionRegistry,
    dynamicContext,
    instructions,
    steeringQueue,
    modelSwitch,
    extensionLoadResult,
  };
}

export async function destroyGentySessionContext(ctx: GentySessionContext): Promise<void> {
  await ctx.extensionRegistry.deactivateAll();
}
