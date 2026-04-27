import type { AgentMuxClient } from '@a5c-ai/agent-mux';
import type { KanbanControlPlane } from './kanban-control-plane.js';
import type { EventStream } from './event-stream.js';
import type {
  EventRenderer,
  PromptHandler,
  TuiCommand,
  TuiContext,
  TuiInternalEvent,
  TuiPlugin,
  TuiView,
} from './plugin.js';

export interface Registry {
  views: TuiView[];
  renderers: EventRenderer[];
  commands: TuiCommand[];
  promptHandlers: PromptHandler[];
}

export function createRegistry(): Registry {
  return { views: [], renderers: [], commands: [], promptHandlers: [] };
}

export function createContext(
  client: AgentMuxClient,
  registry: Registry,
  emit: (e: TuiInternalEvent) => void,
  eventStream: EventStream,
  kanban?: KanbanControlPlane,
): TuiContext {
  return {
    client,
    kanban,
    eventStream,
    registerView: (v) => registry.views.push(v),
    registerEventRenderer: (r) => registry.renderers.push(r),
    registerCommand: (c) => registry.commands.push(c),
    registerPromptHandler: (h) => registry.promptHandlers.push(h),
    emit: (e) => {
      if (e.type === 'event') {
        eventStream.push(e.event);
        return;
      }
      emit(e);
    },
  };
}

export async function loadPlugins(
  plugins: TuiPlugin[],
  ctx: TuiContext,
): Promise<void> {
  for (const p of plugins) {
    await p.register(ctx);
  }
}
