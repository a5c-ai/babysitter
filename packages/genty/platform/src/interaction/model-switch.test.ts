import { describe, it, expect } from 'vitest';
import { createModelSwitchState, switchModel, cycleFavorite, addFavorite, removeFavorite } from './model-switch.js';

describe('interaction/model-switch', () => {
  it('creates initial state', () => {
    const state = createModelSwitchState('claude-sonnet-4', 'anthropic');
    expect(state.currentModel).toBe('claude-sonnet-4');
    expect(state.currentProvider).toBe('anthropic');
    expect(state.history).toHaveLength(1);
  });

  it('switches model and records history', () => {
    const state = createModelSwitchState('claude-sonnet-4', 'anthropic');
    switchModel(state, 'gpt-5.5', 'openai');
    expect(state.currentModel).toBe('gpt-5.5');
    expect(state.currentProvider).toBe('openai');
    expect(state.history).toHaveLength(2);
  });

  it('keeps provider when switching model only', () => {
    const state = createModelSwitchState('claude-sonnet-4', 'anthropic');
    switchModel(state, 'claude-opus-4');
    expect(state.currentProvider).toBe('anthropic');
  });

  it('cycles through favorites', () => {
    const state = createModelSwitchState('a', 'p');
    addFavorite(state, 'a');
    addFavorite(state, 'b');
    addFavorite(state, 'c');

    expect(cycleFavorite(state)).toBe('b');
    expect(state.currentModel).toBe('b');
    expect(cycleFavorite(state)).toBe('c');
    expect(cycleFavorite(state)).toBe('a');
    expect(cycleFavorite(state)).toBe('b');
  });

  it('returns undefined when no favorites', () => {
    const state = createModelSwitchState('a', 'p');
    expect(cycleFavorite(state)).toBeUndefined();
  });

  it('removes a favorite', () => {
    const state = createModelSwitchState('a', 'p');
    addFavorite(state, 'a');
    addFavorite(state, 'b');
    removeFavorite(state, 'a');
    expect(state.favorites).toEqual(['b']);
  });

  it('does not duplicate favorites', () => {
    const state = createModelSwitchState('a', 'p');
    addFavorite(state, 'x');
    addFavorite(state, 'x');
    expect(state.favorites).toEqual(['x']);
  });
});
