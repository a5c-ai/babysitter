import { describe, expect, it } from "vitest";
import { renderEffectTree, stripAnsi, type EffectNode } from "../index";

describe("cli render effectTree", () => {
  it("renders nested effects", () => {
    const effects: EffectNode[] = [
      {
        effectId: "parent",
        kind: "agent",
        status: "completed",
        title: "Parent",
        children: [
          { effectId: "child", kind: "shell", status: "running", title: "Child" },
        ],
      },
    ];

    const rendered = stripAnsi(renderEffectTree(effects));
    expect(rendered).toContain("Parent");
    expect(rendered).toContain("Child");
    expect(rendered).toContain("\u2514");
  });

  it("renders empty trees explicitly", () => {
    expect(stripAnsi(renderEffectTree([]))).toContain("no effects");
  });
});
