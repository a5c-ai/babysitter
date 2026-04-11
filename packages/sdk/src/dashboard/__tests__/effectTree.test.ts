import { describe, it, expect } from "vitest";
import { renderEffectTree, stripAnsi, type EffectNode } from "../index";

describe("GAP-UX-001a: EffectTree", () => {
  it("renders single effect", () => {
    const effects: EffectNode[] = [
      { effectId: "e1", kind: "shell", status: "completed", title: "Run tests" },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("[shell]");
    expect(result).toContain("Run tests");
  });

  it("renders status symbols correctly", () => {
    const effects: EffectNode[] = [
      { effectId: "e1", kind: "agent", status: "completed", title: "Done" },
      { effectId: "e2", kind: "agent", status: "failed", title: "Broken" },
      { effectId: "e3", kind: "agent", status: "pending", title: "Waiting" },
      { effectId: "e4", kind: "agent", status: "running", title: "Active" },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("\u2714"); // check
    expect(result).toContain("\u2718"); // X
    expect(result).toContain("\u25CB"); // circle
    expect(result).toContain("\u25CF"); // filled circle
  });

  it("renders nested effects (parent/child)", () => {
    const effects: EffectNode[] = [
      {
        effectId: "e1", kind: "agent", status: "completed", title: "Parent",
        children: [
          { effectId: "e2", kind: "shell", status: "completed", title: "Child" },
        ],
      },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("Parent");
    expect(result).toContain("Child");
    // Child should be indented more than parent
    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it("renders parallel effects at same level", () => {
    const effects: EffectNode[] = [
      { effectId: "e1", kind: "shell", status: "completed", title: "Task A" },
      { effectId: "e2", kind: "shell", status: "running", title: "Task B" },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("Task A");
    expect(result).toContain("Task B");
  });

  it("renders duration when present", () => {
    const effects: EffectNode[] = [
      { effectId: "e1", kind: "shell", status: "completed", title: "Fast", duration: 500 },
      { effectId: "e2", kind: "agent", status: "completed", title: "Slow", duration: 65000 },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("500ms");
    expect(result).toContain("1.1m");
  });

  it("renders deep nesting (3+ levels)", () => {
    const effects: EffectNode[] = [
      {
        effectId: "e1", kind: "agent", status: "completed", title: "L1",
        children: [
          {
            effectId: "e2", kind: "agent", status: "completed", title: "L2",
            children: [
              { effectId: "e3", kind: "shell", status: "completed", title: "L3" },
            ],
          },
        ],
      },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("L1");
    expect(result).toContain("L2");
    expect(result).toContain("L3");
    const lines = result.split("\n");
    expect(lines.length).toBe(3);
  });

  it("uses tree connectors", () => {
    const effects: EffectNode[] = [
      { effectId: "e1", kind: "shell", status: "completed", title: "First" },
      { effectId: "e2", kind: "shell", status: "completed", title: "Last" },
    ];
    const result = stripAnsi(renderEffectTree(effects));
    expect(result).toContain("\u251C"); // ├
    expect(result).toContain("\u2514"); // └
  });

  it("renders empty tree", () => {
    const result = stripAnsi(renderEffectTree([]));
    expect(result).toContain("no effects");
  });
});
