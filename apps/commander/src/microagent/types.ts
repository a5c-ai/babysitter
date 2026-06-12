/**
 * Microagent interface (SPEC §8 + SPEC-V2 §V2-2 + SPEC-V3 §V3-5/§V3-7):
 * contextual command generation, deterministic procedural icon generation,
 * and inquiry-option icon generation. The mock implementation is
 * rule-based/sync; a future LLM microagent implements the same surface
 * (Promise-able later) without UI changes.
 */

export type IconSpec = { svg: string; palette: string[] };

/** SPEC-V3 §V3-1 board columns as amended by SPEC-V4 §V4-1 (release rail). */
export type BoardColumn =
  | 'backlog'
  | 'do'
  | 'ai-review'
  | 'human-review'
  | 'approved'
  | 'merged'
  | 'in-production';

/** Agent roles attending a card (SPEC-V3 §V3-2). */
export type BoardAgentRole = 'worker' | 'reviewer' | 'integration';

export interface SelectionSummary {
  count: number;
  kinds: Array<'unit' | 'task'>;
  /** Distinct unit visual states in the selection (SPEC §3). */
  states: string[];
  /** Distinct adapters (factions) in the selection. */
  adapters: string[];
  /** Distinct task states in the selection. */
  taskStates: string[];
  /** Selected units currently under an operator hold (Pause command). */
  pausedUnits: number;
}

/**
 * Board-context summary for one card relevant to the selection (SPEC-V2
 * §V2-2 deep context + SPEC-V3 §V3-7 column-aware sets): the selected card
 * itself, or the card attended by a selected agent.
 */
export interface CardContextSummary {
  taskId: string;
  taskKind: string;
  column: BoardColumn;
  /** Current babysitter process phase label (§V2-5), null when no run. */
  runStage: string | null;
  /** An unanswered inquiry (§V3-5 breakpoint) targets this card. */
  inquiryPending: boolean;
  /** Workspace has uncommitted changes (§V2-7). */
  workspaceDirty: boolean;
  yolo: boolean;
  merged: boolean;
  /** Roles of the agents currently attending the card (§V3-2). */
  agentRoles: BoardAgentRole[];
}

export interface AlertSummary {
  hookRequestId: string;
  unitId: string;
  kind: string;
}

export interface FleetSnapshot {
  totalUnits: number;
  idleUnits: number;
  busyUnits: number;
  pendingAlerts: number;
  simPaused: boolean;
}

export interface CommandContext {
  selection: SelectionSummary;
  alerts: AlertSummary[];
  fleet: FleetSnapshot;
  /**
   * Cards in scope for the selection (selected cards + cards attended by
   * selected agents). Empty when nothing card-related is selected.
   */
  cards: CardContextSummary[];
}

export interface IconContext {
  entityId: string;
  kind: 'unit' | 'task';
  /** Adapter faction (units) — keys the palette. */
  adapter?: string;
  /** Task kind (tasks) — keys the glyph badge. */
  taskKind?: string;
}

/** Inquiry option shape the icon generator consumes (SPEC-V3 §V3-5). */
export interface InquiryOptionLike {
  id: string;
  caption: string;
  tone?: 'normal' | 'danger' | 'primary';
}

/**
 * UI/sim actions a command cell can trigger (SPEC-V3 verb set: every intent
 * routes to a real sim verb or visible store mutation in `executeIntent`).
 * Retired v1 intents (dispatch targeting, rally, clone, retire, idle
 * selection) are gone with the idle fleet (SPEC-V3 §V3-2).
 */
export type CommandIntent =
  | { kind: 'steer' }
  | { kind: 'pause-unit' }
  | { kind: 'inspect' }
  | { kind: 'abort' }
  | { kind: 'approve' }
  | { kind: 'deny' }
  /** Kind-specific verb (§V2-2): steers the attending agents with `prompt`. */
  | { kind: 'task-action'; action: string; prompt: string }
  /** Open the workspace/diff surface for the card's attending agent (§V2-7). */
  | { kind: 'open-diff' }
  /** User board move via the sim verb `moveCard` (§V3-1). */
  | { kind: 'move-card'; column: BoardColumn; danger?: boolean }
  | { kind: 'set-yolo'; on: boolean }
  | { kind: 'prioritize' }
  /** Commission Task — sim verb `createTask` (§V2-6, Foundry's only tab). */
  | { kind: 'commission-task' }
  /** Open the human-review side panel for the selected card (§V3-4). */
  | { kind: 'open-review' }
  /** Hold/release the integration agents of an approved card (§V3-2). */
  | { kind: 'hold-merge' }
  /** SPEC-V4 §V4-1: revert a MERGED card from staging back to DO (danger). */
  | { kind: 'revert-card' }
  /** SPEC-V4 §V4-1: throw the release lever — ship ALL merged cards. */
  | { kind: 'release' }
  /** SPEC-V4 §V4-1: roll an IN PRODUCTION card back to MERGED (danger). */
  | { kind: 'rollback-card' }
  /** SPEC-V4 §V4-7: open the cogitator terminal for the card's workspace. */
  | { kind: 'open-terminal' }
  | { kind: 'jump-to-alert' }
  | { kind: 'toggle-sim' };

export interface CommandSpec {
  id: string;
  label: string;
  hotkey?: string;
  icon: IconSpec;
  intent: CommandIntent;
  enabled: boolean;
  tooltip: string;
  severity?: 'normal' | 'danger' | 'urgent';
}

export interface Microagent {
  /** Selection state → command set; mixed selections get the intersection; ≤12. */
  generateCommands(ctx: CommandContext): CommandSpec[];
  /** Deterministic per entity: same id ⇒ byte-identical SVG. */
  generateIcon(ctx: IconContext): IconSpec;
  /** Deterministic per option: engraved-brass glyph for an inquiry option (§V3-5). */
  generateOptionIcon(option: InquiryOptionLike): IconSpec;
}
