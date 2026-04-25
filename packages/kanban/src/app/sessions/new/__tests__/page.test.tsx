import type { ReactNode, TextareaHTMLAttributes } from "react";
import { createStore } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";

import { render, screen, setupUser } from "@/test/test-utils";

import NewSessionPage from "../page";

const push = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@a5c-ai/compendium", () => ({
  Field: ({ label, children }: { label: string; children: unknown }) => (
    <label>
      <span>{label}</span>
      {children}
    </label>
  ),
  Select: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
  }) => (
    <select aria-label="Agent" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  Textarea: (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

vi.mock("@/components/agent-mux/require-gateway-auth", () => ({
  RequireGatewayAuth: ({ children }: { children: unknown }) => <>{children}</>,
}));

vi.mock("@/components/agent-mux/gateway-provider", () => ({
  useGatewayFetch: () => vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    asChild,
    children,
    ...props
  }: {
    asChild?: boolean;
    children: ReactNode;
  } & Record<string, unknown>) =>
    asChild ? <>{children}</> : <button {...props}>{children}</button>,
}));

vi.mock("@/hooks/use-task-tags", () => ({
  useTaskTags: () => ({
    taskTags: [
      {
        id: "task-tag-bug-report",
        key: "bug_report",
        label: "Bug Report",
        content: "Describe the bug in detail.",
        order: 0,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
    ],
    loading: false,
    error: null,
  }),
}));

const store = createStore(() => ({
  agents: {
    byId: {
      codex: {
        supportsInteractiveMode: true,
        structuredSessionTransport: "persistent",
        sessionControlPlane: "gateway",
      },
    },
  },
  sessions: { byId: {} },
  runs: { byId: {} },
  actions: {
    mergeRun: vi.fn(),
    mergeSession: vi.fn(),
  },
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useAgents: () => ["codex"],
  useGateway: () => ({
    client: { subscribeRun: vi.fn() },
    store,
  }),
}));

describe("NewSessionPage", () => {
  it("inserts Task Tag snippets into the new session prompt", async () => {
    const user = setupUser();
    render(<NewSessionPage />);

    const prompt = screen.getByPlaceholderText("Describe the task you want the agent to handle...");
    await user.type(prompt, "@bug");
    await user.click(screen.getByText("Bug Report"));

    expect(prompt).toHaveValue("Describe the bug in detail.");
  });
});
