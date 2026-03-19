import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useKeyboard, Shortcut } from '../use-keyboard';

describe('useKeyboard', () => {
  it('calls action when matching key is pressed', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    fireEvent.keyDown(document, { key: 'r' });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not call action for non-matching key', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    fireEvent.keyDown(document, { key: 'x' });
    expect(action).not.toHaveBeenCalled();
  });

  it('handles ctrl modifier correctly', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'k', ctrl: true, action, description: 'Open' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    // Without ctrl - should not fire
    fireEvent.keyDown(document, { key: 'k', ctrlKey: false });
    expect(action).not.toHaveBeenCalled();

    // With ctrl - should fire
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('handles shift modifier correctly', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'P', shift: true, action, description: 'Print' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    // Without shift - should not fire
    fireEvent.keyDown(document, { key: 'P', shiftKey: false });
    expect(action).not.toHaveBeenCalled();

    // With shift - should fire
    fireEvent.keyDown(document, { key: 'P', shiftKey: true });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('handles ctrl+shift combination', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'z', ctrl: true, shift: true, action, description: 'Redo' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    // Only ctrl - should not fire
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: false });
    expect(action).not.toHaveBeenCalled();

    // Both ctrl+shift - should fire
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ignores keydown events from INPUT elements', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'r' });
    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores keydown events from TEXTAREA elements', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireEvent.keyDown(textarea, { key: 'r' });
    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('ignores keydown events from SELECT elements', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    const select = document.createElement('select');
    document.body.appendChild(select);
    fireEvent.keyDown(select, { key: 'r' });
    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(select);
  });

  it('ignores keydown events from contentEditable elements', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    const div = document.createElement('div');
    div.contentEditable = 'true';
    // jsdom does not implement isContentEditable, so mock it
    Object.defineProperty(div, 'isContentEditable', { value: true });
    document.body.appendChild(div);
    fireEvent.keyDown(div, { key: 'r' });
    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('supports multiple shortcuts simultaneously', () => {
    const actionA = vi.fn();
    const actionB = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'a', action: actionA, description: 'Action A' },
      { key: 'b', action: actionB, description: 'Action B' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    fireEvent.keyDown(document, { key: 'a' });
    expect(actionA).toHaveBeenCalledTimes(1);
    expect(actionB).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'b' });
    expect(actionB).toHaveBeenCalledTimes(1);
  });

  it('calls preventDefault on matching keydown', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    renderHook(() => useKeyboard(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'r',
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [
      { key: 'r', action, description: 'Refresh' },
    ];

    const { unmount } = renderHook(() => useKeyboard(shortcuts));

    unmount();

    fireEvent.keyDown(document, { key: 'r' });
    expect(action).not.toHaveBeenCalled();
  });

  it('uses latest shortcuts via ref (no stale closure)', () => {
    const firstAction = vi.fn();
    const secondAction = vi.fn();

    const { rerender } = renderHook(
      ({ shortcuts }) => useKeyboard(shortcuts),
      {
        initialProps: {
          shortcuts: [{ key: 'r', action: firstAction, description: 'First' }] as Shortcut[],
        },
      }
    );

    // Re-render with new action
    rerender({
      shortcuts: [{ key: 'r', action: secondAction, description: 'Second' }] as Shortcut[],
    });

    fireEvent.keyDown(document, { key: 'r' });
    expect(firstAction).not.toHaveBeenCalled();
    expect(secondAction).toHaveBeenCalledTimes(1);
  });
});
