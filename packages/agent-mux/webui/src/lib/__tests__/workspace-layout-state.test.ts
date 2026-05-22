import {
  DEFAULT_WORKSPACE_PANEL_SIZES,
  DEFAULT_WORKSPACE_PANEL_VISIBILITY,
  ensureVisiblePanels,
  getVisiblePanels,
  normalizeWorkspacePanelSizes,
  resizeWorkspacePanels,
  toggleWorkspacePanel,
} from "../workspace-layout-state";

describe("workspace-layout-state", () => {
  it("keeps the conversation panel visible when every panel is toggled off", () => {
    const next = ensureVisiblePanels({
      sidebar: false,
      conversation: false,
      context: false,
      details: false,
    });

    expect(next).toEqual({
      sidebar: false,
      conversation: true,
      context: false,
      details: false,
    });
  });

  it("returns visible panels in the canonical layout order", () => {
    expect(
      getVisiblePanels({
        sidebar: true,
        conversation: false,
        context: true,
        details: true,
      }),
    ).toEqual(["sidebar", "context", "details"]);
  });

  it("normalizes only the visible panel sizes", () => {
    const next = normalizeWorkspacePanelSizes(
      {
        sidebar: 20,
        conversation: 40,
        context: 30,
        details: 10,
      },
      {
        sidebar: true,
        conversation: true,
        context: false,
        details: true,
      },
    );

    expect(Math.round(next.sidebar)).toBe(29);
    expect(Math.round(next.conversation)).toBe(57);
    expect(Math.round(next.details)).toBe(14);
    expect(next.context).toBe(30);
  });

  it("toggles a single panel and preserves the others", () => {
    const next = toggleWorkspacePanel(DEFAULT_WORKSPACE_PANEL_VISIBILITY, "context");
    expect(next).toEqual({
      sidebar: true,
      conversation: true,
      context: false,
      details: true,
    });
  });

  it("resizes adjacent visible panels and clamps to minimum widths", () => {
    const next = resizeWorkspacePanels({
      sizes: DEFAULT_WORKSPACE_PANEL_SIZES,
      visibility: DEFAULT_WORKSPACE_PANEL_VISIBILITY,
      leftPanel: "sidebar",
      rightPanel: "conversation",
      deltaPercentage: -20,
      minPercentage: 14,
    });

    expect(next.sidebar).toBe(14);
    expect(next.conversation).toBe(42);
  });

  it("ignores resize requests when one side of the boundary is hidden", () => {
    const next = resizeWorkspacePanels({
      sizes: DEFAULT_WORKSPACE_PANEL_SIZES,
      visibility: {
        sidebar: true,
        conversation: true,
        context: false,
        details: true,
      },
      leftPanel: "conversation",
      rightPanel: "context",
      deltaPercentage: 12,
    });

    expect(next).toEqual(DEFAULT_WORKSPACE_PANEL_SIZES);
  });
});
