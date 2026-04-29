"use client";

export const WORKSPACE_PANEL_ORDER = [
  "sidebar",
  "conversation",
  "context",
  "details",
] as const;

export type WorkspacePanelKey = (typeof WORKSPACE_PANEL_ORDER)[number];

export type WorkspacePanelVisibility = Record<WorkspacePanelKey, boolean>;
export type WorkspacePanelSizes = Record<WorkspacePanelKey, number>;

export const DEFAULT_WORKSPACE_PANEL_VISIBILITY: WorkspacePanelVisibility = {
  sidebar: true,
  conversation: true,
  context: true,
  details: true,
};

export const DEFAULT_WORKSPACE_PANEL_SIZES: WorkspacePanelSizes = {
  sidebar: 20,
  conversation: 36,
  context: 24,
  details: 20,
};

export const DESKTOP_LAYOUT_BREAKPOINT = 1280;
export const MIN_WORKSPACE_PANEL_SIZE = 14;

export function ensureVisiblePanels(visibility: WorkspacePanelVisibility): WorkspacePanelVisibility {
  if (Object.values(visibility).some(Boolean)) {
    return visibility;
  }

  return {
    ...visibility,
    conversation: true,
  };
}

export function getVisiblePanels(visibility: WorkspacePanelVisibility): WorkspacePanelKey[] {
  const safeVisibility = ensureVisiblePanels(visibility);
  return WORKSPACE_PANEL_ORDER.filter((panel) => safeVisibility[panel]);
}

export function toggleWorkspacePanel(
  visibility: WorkspacePanelVisibility,
  panel: WorkspacePanelKey,
): WorkspacePanelVisibility {
  return ensureVisiblePanels({
    ...visibility,
    [panel]: !visibility[panel],
  });
}

export function normalizeWorkspacePanelSizes(
  sizes: WorkspacePanelSizes,
  visibility: WorkspacePanelVisibility,
): WorkspacePanelSizes {
  const safeVisibility = ensureVisiblePanels(visibility);
  const visiblePanels = getVisiblePanels(safeVisibility);
  const totalVisible = visiblePanels.reduce((sum, panel) => sum + Math.max(sizes[panel], 0), 0);
  const fallbackVisible = visiblePanels.reduce(
    (sum, panel) => sum + DEFAULT_WORKSPACE_PANEL_SIZES[panel],
    0,
  );

  return WORKSPACE_PANEL_ORDER.reduce<WorkspacePanelSizes>((acc, panel) => {
    if (!safeVisibility[panel]) {
      acc[panel] = sizes[panel];
      return acc;
    }

    const base = totalVisible > 0 ? sizes[panel] : DEFAULT_WORKSPACE_PANEL_SIZES[panel];
    const divisor = totalVisible > 0 ? totalVisible : fallbackVisible;
    acc[panel] = divisor > 0 ? (base / divisor) * 100 : 0;
    return acc;
  }, { ...sizes });
}

export function resizeWorkspacePanels(args: {
  sizes: WorkspacePanelSizes;
  visibility: WorkspacePanelVisibility;
  leftPanel: WorkspacePanelKey;
  rightPanel: WorkspacePanelKey;
  deltaPercentage: number;
  minPercentage?: number;
}): WorkspacePanelSizes {
  const {
    sizes,
    visibility,
    leftPanel,
    rightPanel,
    deltaPercentage,
    minPercentage = MIN_WORKSPACE_PANEL_SIZE,
  } = args;
  const safeVisibility = ensureVisiblePanels(visibility);

  if (!safeVisibility[leftPanel] || !safeVisibility[rightPanel]) {
    return sizes;
  }

  const normalized = normalizeWorkspacePanelSizes(sizes, safeVisibility);
  const leftSize = normalized[leftPanel];
  const rightSize = normalized[rightPanel];
  const minDelta = minPercentage - leftSize;
  const maxDelta = rightSize - minPercentage;
  const nextDelta = Math.max(minDelta, Math.min(deltaPercentage, maxDelta));

  return {
    ...sizes,
    [leftPanel]: leftSize + nextDelta,
    [rightPanel]: rightSize - nextDelta,
  };
}
