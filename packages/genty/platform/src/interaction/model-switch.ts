export interface ModelSwitchState {
  currentModel: string;
  currentProvider: string;
  favorites: string[];
  history: Array<{ model: string; provider: string; switchedAt: string }>;
}

export function createModelSwitchState(initialModel: string, initialProvider: string): ModelSwitchState {
  return {
    currentModel: initialModel,
    currentProvider: initialProvider,
    favorites: [],
    history: [{ model: initialModel, provider: initialProvider, switchedAt: new Date().toISOString() }],
  };
}

export function switchModel(state: ModelSwitchState, model: string, provider?: string): void {
  state.currentModel = model;
  if (provider) state.currentProvider = provider;
  state.history.push({
    model,
    provider: provider ?? state.currentProvider,
    switchedAt: new Date().toISOString(),
  });
}

export function cycleFavorite(state: ModelSwitchState): string | undefined {
  if (state.favorites.length === 0) return undefined;
  const currentIdx = state.favorites.indexOf(state.currentModel);
  const nextIdx = (currentIdx + 1) % state.favorites.length;
  const next = state.favorites[nextIdx];
  switchModel(state, next);
  return next;
}

export function addFavorite(state: ModelSwitchState, model: string): void {
  if (!state.favorites.includes(model)) state.favorites.push(model);
}

export function removeFavorite(state: ModelSwitchState, model: string): void {
  state.favorites = state.favorites.filter(m => m !== model);
}
