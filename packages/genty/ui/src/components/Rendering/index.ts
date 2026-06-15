// Rendering primitives barrel export — pure TypeScript rendering utilities
// for effect trees, progress bars, streaming panels, diffs, message types,
// and subagent drill-down views.

export {
  buildEffectTree,
  formatEffectTreeText,
  renderEffectTreeHtml,
} from './EffectTreeView.js';
export type {
  EffectStatus,
  EffectTreeNode,
  FlatEffect,
} from './EffectTreeView.js';

export {
  formatProgressBar,
  formatStatusLine,
} from './ProgressStatusLine.js';
export type {
  ProgressData,
} from './ProgressStatusLine.js';

export {
  StreamPanelManager,
  formatPanelOutput,
} from './StreamingOutputPanel.js';
export type {
  StreamPanel,
} from './StreamingOutputPanel.js';

export {
  parseDiffOutput,
  formatDiffText,
  formatDiffHtml,
} from './StructuredDiffView.js';
export type {
  DiffLine,
  DiffLineType,
  DiffHunk,
} from './StructuredDiffView.js';

export {
  detectMessageType,
  formatMessageText,
  formatMessageHtml,
} from './MessageTypeRenderer.js';
export type {
  MessageType,
} from './MessageTypeRenderer.js';

export {
  buildSubagentView,
  formatSubagentSummary,
  formatSubagentDetail,
} from './SubagentDrillDown.js';
export type {
  SubagentStatus,
  SubagentEffect,
  SubagentView,
  SubagentDrillDownData,
  ProgressAgent,
  ProgressTracker,
} from './SubagentDrillDown.js';
