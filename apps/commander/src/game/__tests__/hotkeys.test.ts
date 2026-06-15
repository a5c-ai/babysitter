/**
 * Command hotkey tests (SPEC §5/§8, HUD phase): the mode arbiter precedence
 * (command vs camera-pan vs idle-cycle), positional hotkey assignment on the
 * 3x4 grid, hotkey→command lookup over the live store, and execution wiring
 * (Q primes dispatch targeting for an idle selection; the global Q selects
 * all idle units; disabled cells swallow their key without side effects).
 */
import { describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import {
  executeCommandHotkey,
  executeIntent,
  findCommandByHotkey,
  hotkeyFromCode,
} from '../commands';
import { generateCommands } from '../../microagent/mock/commandGen';
import {
  bindBackendToStore,
  createCommanderStore,
  type BackendBinding,
  type CommanderStore,
} from '../store';

interface Rig {
  backend: MockBackend;
  store: CommanderStore;
  binding: BackendBinding;
}

function makeRig(seed: number): Rig {
  const backend = new MockBackend({ seed, autoStart: false });
  const store = createCommanderStore();
  const binding = bindBackendToStore(store, backend);
  binding.flush();
  return { backend, store, binding };
}

describe('hotkeyFromCode', () => {
  it('maps KeyX codes inside the grid and rejects everything else', () => {
    expect(hotkeyFromCode('KeyQ')).toBe('Q');
    expect(hotkeyFromCode('KeyV')).toBe('V');
    expect(hotkeyFromCode('KeyG')).toBeNull(); // not a grid letter
    expect(hotkeyFromCode('Digit1')).toBeNull();
    expect(hotkeyFromCode('Escape')).toBeNull();
  });
});

// RETIRED by V3: the camera-pan / idle-cycle mode arbiter — letters either
// activate their command cell or do nothing (the map canvas is gone).

describe('positional hotkeys on the 3x4 grid', () => {
  it('cell i answers to COMMAND_HOTKEYS[i] (backlog card set → Q/W/E/R)', () => {
    const specs = generateCommands({
      selection: {
        count: 1,
        kinds: ['task'],
        states: [],
        adapters: [],
        taskStates: ['queued'],
        pausedUnits: 0,
      },
      alerts: [],
      fleet: { totalUnits: 0, idleUnits: 0, busyUnits: 0, pendingAlerts: 0, simPaused: false },
      cards: [
        {
          taskId: 'adr-01-fix',
          taskKind: 'fix',
          column: 'backlog',
          runStage: null,
          inquiryPending: false,
          workspaceDirty: false,
          yolo: false,
          merged: false,
          agentRoles: [],
        },
      ],
    });
    // V4 adds the Edit Card staple to the backlog set (§V4-5) → 5 cells.
    expect(specs.map((s) => s.hotkey)).toEqual(['Q', 'W', 'E', 'R', 'A']);
  });
});

describe('hotkey execution over the live store', () => {
  it('empty selection: Q commissions a new task into the backlog (§V3-7 global set)', () => {
    const rig = makeRig(42);
    const state = rig.store.getState();
    expect(state.selection.ids).toEqual([]);
    expect(findCommandByHotkey(state, 'Q')?.id).toBe('commission-task');
    const tasksBefore = state.world.taskIds.length;

    const claimed = executeCommandHotkey('Q', rig.store, rig.binding.orders);
    expect(claimed).toBe(true);
    const after = rig.store.getState();
    expect(after.world.taskIds.length).toBe(tasksBefore + 1);
    const created = after.world.taskIds.find((id) => id.startsWith('adr-c'));
    expect(created).toBeDefined();
    expect(after.world.tasks[created!]?.view.state).toBe('queued'); // lands in backlog
    expect(after.events.some((e) => /commissioned/i.test(e.text))).toBe(true);
  });

  // RETIRED by V3: "idle unit selected: Q primes dispatch targeting" and
  // "Q selects all idle" — there are no idle units and the idle-unit command
  // set is retired (SPEC-V3 §V3-2); the pure command-gen path is covered above.

  it('unbound letters fall through (F with a sub-8-command card)', () => {
    const rig = makeRig(42);
    // Select a backlog card: its column set binds Q/W/E/R only.
    rig.store.getState().clickSelect(rig.store.getState().world.taskIds[0]!, false);
    expect(findCommandByHotkey(rig.store.getState(), 'F')).toBeUndefined();
    expect(executeCommandHotkey('F', rig.store, rig.binding.orders)).toBe(false);
  });

  it('disabled cells swallow the key without side effects', () => {
    const rig = makeRig(42);
    const state = rig.store.getState();
    // Empty selection, no pending alerts at boot → Jump to Alert is disabled.
    const spec = findCommandByHotkey(state, 'W');
    expect(spec?.id).toBe('jump-to-alert');
    expect(spec?.enabled).toBe(false);

    const eventsBefore = rig.store.getState().events.length;
    expect(executeCommandHotkey('W', rig.store, rig.binding.orders)).toBe(true);
    expect(rig.store.getState().events.length).toBe(eventsBefore); // no side effects
    expect(rig.store.getState().selection.ids).toEqual([]);
  });

  it('executeIntent toggle-sim pauses and resumes the simulation', () => {
    const rig = makeRig(42);
    expect(rig.backend.sim.paused).toBe(false);
    executeIntent({ kind: 'toggle-sim' }, rig.store, rig.binding.orders);
    expect(rig.backend.sim.paused).toBe(true);
    expect(rig.store.getState().meta.paused).toBe(true);
    executeIntent({ kind: 'toggle-sim' }, rig.store, rig.binding.orders);
    expect(rig.backend.sim.paused).toBe(false);
  });
});
