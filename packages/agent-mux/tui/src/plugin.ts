import type { ComponentType } from 'react';
import type { AgentMuxClient, AgentEvent, RunHandle } from '@a5c-ai/agent-mux';
import type { EventStream } from './event-stream.js';
import type { TuiViewport } from './layout.js';

export type PromptHandler = (prompt: string) => void | Promise<void>;

export interface TuiContext {
  client: AgentMuxClient;
  eventStream: EventStream;
  registerView(view: TuiView): void;
  registerEventRenderer(renderer: EventRenderer): void;
  registerCommand(cmd: TuiCommand): void;
  registerPromptHandler(handler: PromptHandler): void;
  emit(event: TuiInternalEvent): void;
}

export interface TuiView {
  id: string;
  title: string;
  hotkey?: string;
  component: ComponentType<TuiViewProps>;
}

export interface TuiViewProps {
  client: AgentMuxClient;
  active: boolean;
  eventStream: EventStream;
  emit: (event: TuiInternalEvent) => void;
  pluginEpoch?: number;
  viewport?: TuiViewport;
  /** Optional global filter string (e.g. set via top-level `/` in chat). */
  filter?: string;
  /** Optional session selection routed by emit(session:detail). */
  selection?: { agent: string; sessionId: string };
  /** Sessions currently backed by an amux-managed run (keyed `${agent}:${sessionId}`). */
  activeSessions?: ReadonlySet<string>;
}

export interface EventRenderer {
  id: string;
  match(ev: AgentEvent): boolean;
  component: ComponentType<{ event: AgentEvent }>;
}

export interface TuiCommand {
  id: string;
  hotkey: string;
  label: string;
  run(ctx: TuiContext): void | Promise<void>;
}

export type TuiInternalEvent =
  | { type: 'view:switch'; id: string }
  | { type: 'run:attach'; handle: RunHandle }
  | { type: 'status'; message: string }
  | { type: 'event'; event: AgentEvent }
  | { type: 'session:select'; agent: string; sessionId: string }
  | { type: 'session:detail'; agent: string; sessionId: string }
  | { type: 'session:diff'; agent: string; sessionId: string };

export interface TuiPlugin {
  name: string;
  version?: string;
  register(ctx: TuiContext): void | Promise<void>;
}

export function definePlugin(plugin: TuiPlugin): TuiPlugin {
  return plugin;
}
