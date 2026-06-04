export { App } from './app.js';
export { createRegistry, createContext, loadPlugins } from './registry.js';
export type { Registry } from './registry.js';
export { EventStream } from './event-stream.js';
export type { EventSubscriber, Unsubscribe } from './event-stream.js';
export { PromptInput } from './prompt-input.js';
export {
  createKanbanControlPlane,
  type KanbanControlPlane,
  type KanbanControlPlaneToolArgsByName,
  type KanbanControlPlaneToolInvoker,
  type KanbanControlPlaneToolName,
  type KanbanControlPlaneToolResultByName,
} from './kanban-control-plane.js';
export {
  loadExternalPlugins,
  defaultExternalPluginsDir,
  type LoadResult as ExternalPluginsLoadResult,
} from './external-plugins.js';
export * from './plugin.js';

import textDelta from './plugins/text-delta.js';
import toolCall from './plugins/tool-call.js';
import cost from './plugins/cost.js';
import costAlerts from './plugins/cost-alerts.js';
import chatView from './plugins/chat-view.js';
import sessionsView from './plugins/sessions-view.js';
import sessionDetailView from './plugins/session-detail-view.js';
import costView from './plugins/cost-view.js';
import fallback from './plugins/fallback.js';
import diff from './plugins/diff.js';
import shell from './plugins/shell.js';
import mcp from './plugins/mcp.js';
import subagent from './plugins/subagent.js';
import fileOps from './plugins/file-ops.js';
import sessionLifecycle from './plugins/session-lifecycle.js';
import approval from './plugins/approval.js';
import pluginSkill from './plugins/plugin-skill.js';
import image from './plugins/image.js';
import control from './plugins/control.js';
import lifecycle from './plugins/lifecycle.js';
import adaptersView from './plugins/adapters-view.js';
import modelsView from './plugins/models-view.js';
import profilesView from './plugins/profiles-view.js';
import pluginsView from './plugins/plugins-view.js';
import kanbanView from './plugins/kanban-view.js';
import workspacesView from './plugins/workspaces-view.js';
import helpView from './plugins/help-view.js';
import mcpView from './plugins/mcp-view.js';
import doctorView from './plugins/doctor-view.js';
import authView from './plugins/auth-view.js';
import configView from './plugins/config-view.js';
import skillsView from './plugins/skills-view.js';
import agentsView from './plugins/agents-view.js';
import hooksView from './plugins/hooks-view.js';
import observabilityView from './plugins/observability-view.js';
import type { TuiPlugin } from './plugin.js';

// Order matters: specific renderers first, fallback LAST so it only matches
// when nothing else did (chat-view's pickRenderers enforces this).
export const builtinPlugins: TuiPlugin[] = [
  textDelta,
  toolCall,
  diff,
  shell,
  mcp,
  subagent,
  fileOps,
  sessionLifecycle,
  approval,
  pluginSkill,
  image,
  control,
  lifecycle,
  cost,
  costAlerts,
  chatView,
  sessionsView,
  sessionDetailView,
  costView,
  adaptersView,
  modelsView,
  profilesView,
  pluginsView,
  kanbanView,
  workspacesView,
  helpView,
  mcpView,
  doctorView,
  authView,
  configView,
  skillsView,
  agentsView,
  hooksView,
  observabilityView,
  fallback,
];
