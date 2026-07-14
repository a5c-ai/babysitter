/**
 * Run-detail page header — copy-full-run-id affordance.
 *
 * Owner UX ask 2026-07: the breadcrumb short-id ("01KX4TCZ...") must expose
 * the WHOLE run id on hover and copy it on click, because resuming a run
 * needs the full id (`babysitter run:iterate <id>`).
 *
 * Heavy route panels (pipeline / event stream / task detail), banners and the
 * data hooks are mocked — this test exercises the header only.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { createMockRun } from "@/test/fixtures";
import type { Run } from "@/types";

const RUN_ID = "01KX4TCZRUNDETAILHEADER01";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

let mockRun: Run;
vi.mock("@/hooks/use-run-detail", () => ({
  useRunDetail: () => ({
    run: mockRun,
    loading: false,
    error: null,
    hasBreakpointWaiting: false,
  }),
}));

vi.mock("@/hooks/use-keyboard", () => ({
  useKeyboard: () => {},
}));

vi.mock("@/components/notifications/notification-provider", () => ({
  useNotificationContext: () => ({
    notifications: [],
    dismiss: vi.fn(),
    notify: vi.fn(),
  }),
}));

// Heavy lazy-loaded panels + summary banners: not under test here.
vi.mock("@/components/shared/outcome-banner", () => ({
  OutcomeBanner: () => null,
}));
vi.mock("@/components/shared/metrics-row", () => ({
  MetricsRow: () => null,
}));
vi.mock("@/components/pipeline/pipeline-view", () => ({
  PipelineView: () => <div data-testid="pipeline-view-mock" />,
}));
vi.mock("@/components/events/event-stream", () => ({
  EventStream: () => <div data-testid="event-stream-mock" />,
}));
vi.mock("@/components/details/task-detail", () => ({
  TaskDetailPanel: () => <div data-testid="task-detail-mock" />,
}));

import RunDetailPage from "../page";

describe("RunDetailPage header run-id copy affordance", () => {
  beforeEach(() => {
    mockRun = createMockRun({ runId: RUN_ID });
  });

  it("renders the truncated breadcrumb id with the FULL run id in its title (hover)", () => {
    render(<RunDetailPage params={{ runId: RUN_ID }} />);
    const el = screen.getByText(`${RUN_ID.slice(0, 8)}...`);
    expect(el).toHaveAttribute("title", RUN_ID);
  });

  it("clicking the breadcrumb id copies the FULL run id to the clipboard", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
    render(<RunDetailPage params={{ runId: RUN_ID }} />);
    await user.click(screen.getByText(`${RUN_ID.slice(0, 8)}...`));
    expect(writeTextSpy).toHaveBeenCalledWith(RUN_ID);
  });
});
