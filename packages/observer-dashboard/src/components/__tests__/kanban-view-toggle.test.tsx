/**
 * Unit tests — ViewToggle (SPEC-vibekanban §6.1, Wave 2).
 *
 * The board/list segmented control: simple buttons (no tablist role) with
 * aria-pressed semantics, testids frozen by the e2e contract
 * (view-toggle-board / view-toggle-list).
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, setupUser } from "@/test/test-utils";
import { ViewToggle } from "@/components/kanban/view-toggle";

describe("ViewToggle (SPEC-vibekanban §6.1)", () => {
  it("renders both segments with aria-pressed reflecting the active view", () => {
    render(<ViewToggle view="board" onViewChange={() => {}} />);
    expect(screen.getByTestId("view-toggle-board")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("view-toggle-list")).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects the list view when active", () => {
    render(<ViewToggle view="list" onViewChange={() => {}} />);
    expect(screen.getByTestId("view-toggle-board")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("view-toggle-list")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onViewChange with the clicked segment's view", async () => {
    const onViewChange = vi.fn();
    const user = setupUser();
    render(<ViewToggle view="board" onViewChange={onViewChange} />);

    await user.click(screen.getByTestId("view-toggle-list"));
    expect(onViewChange).toHaveBeenCalledWith("list");

    await user.click(screen.getByTestId("view-toggle-board"));
    expect(onViewChange).toHaveBeenCalledWith("board");
  });
});
