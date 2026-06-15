/**
 * Keyboard grammar (SPEC §5 as amended by SPEC-V3 §V3-7) — the map-era mouse
 * surface (marquee, right-click dispatch/rally, camera pan/zoom, control
 * groups, F idle-cycle) is RETIRED; the board owns its own pointer events.
 *
 *  - Esc: foundry/archive → review panel → steer modal → inspector → selection.
 *  - Space (tap): jump to the latest alert (selects its card).
 *  - M: toggle the Archive overlay (§V2-3); N: toggle the Foundry (§V2-6).
 *    Both act only when no modal is open and the user is not typing.
 *  - Q/W/E/R/A/S/D/F/Z/X/C/V: command card hotkeys (positional grid cells).
 *
 * Window-scoped listeners; returns a cleanup function.
 */

import { executeCommandHotkey, hotkeyFromCode } from './commands';
import type { CommanderStore, Orders } from './store';

export interface AttachInputOptions {
  store: CommanderStore;
  orders: Orders;
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function isButtonLike(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a, [role="button"]') !== null;
}

export function attachInput({ store, orders }: AttachInputOptions): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    if (isTextEntry(e.target)) return;

    switch (e.code) {
      case 'Escape':
        store.getState().escape();
        return;
      case 'Space':
        if (isButtonLike(e.target)) return; // let focused buttons receive Space
        e.preventDefault();
        if (!e.repeat) {
          // Land the operator on the latest alert's card AND pulse the
          // Inquiry Dock (scroll into view + highlight, §V3-5).
          store.getState().jumpToLatestAlert();
          store.getState().pulseDock();
        }
        return;
      case 'KeyM': {
        if (e.ctrlKey || e.metaKey || e.altKey) break;
        // M acts only when no modal is open (SPEC-V2 §V2-9 guard).
        const meta = store.getState().meta;
        if (meta.foundryOpen || meta.steerOpen || meta.cardEditorTaskId !== null || meta.runsOpen || meta.ideTaskId !== null) return;
        if (meta.archiveOpen) {
          store.getState().closeArchive();
        } else {
          store.getState().openArchive();
        }
        return;
      }
      case 'KeyN': {
        if (e.ctrlKey || e.metaKey || e.altKey) break;
        const meta = store.getState().meta;
        if (meta.archiveOpen || meta.steerOpen || meta.cardEditorTaskId !== null || meta.runsOpen || meta.ideTaskId !== null) return;
        if (meta.foundryOpen) {
          store.getState().closeFoundry();
        } else {
          store.getState().openFoundry();
        }
        return;
      }
      default:
        break;
    }

    // Command hotkeys (Q/W/E/R/A/S/D/F/Z/X/C/V). Modified letters
    // (Ctrl+C, Cmd+R, …) stay with the browser. Digits are unbound under V3
    // (control groups retired).
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const letter = hotkeyFromCode(e.code);
    if (letter === null) return;
    const state = store.getState();
    if (
      state.meta.foundryOpen ||
      state.meta.archiveOpen ||
      state.meta.steerOpen ||
      state.meta.cardEditorTaskId !== null ||
      state.meta.ideTaskId !== null
    ) {
      return;
    }
    if (!e.repeat) {
      if (executeCommandHotkey(letter, store, orders)) e.preventDefault();
    } else {
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
  };
}
