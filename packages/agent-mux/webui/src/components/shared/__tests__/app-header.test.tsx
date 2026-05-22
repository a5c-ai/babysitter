import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { AppHeader } from "../app-header";
import { APP_HEADER_NAV_ITEMS } from "../app-header-nav";

const mockUsePathname = vi.fn(() => "/");
const toggleThemeMock = vi.fn();

vi.mock("react-router-dom-v6", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom-v6")>("react-router-dom-v6");
  return {
    ...actual,
    useLocation: () => ({ pathname: mockUsePathname(), search: "", hash: "", state: null, key: "test" }),
  };
});

vi.mock("@a5c-ai/compendium", () => ({
  Button: ({ children, ...props }: Record<string, unknown>) => <button {...props}>{children}</button>,
  LogoWordmark: (props: Record<string, unknown>) => <div {...props}>Babysitter</div>,
  cx: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/components/agent-mux/gateway-provider", () => ({
  useGatewayAuth: () => ({
    isAuthenticated: false,
  }),
}));

vi.mock("@/components/notifications/notification-provider", () => ({
  useNotificationContext: () => ({
    notifications: [],
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/components/notifications/notification-panel", () => ({
  NotificationPanel: () => null,
}));

vi.mock("@/hooks/use-event-stream", () => ({
  useEventStream: () => ({
    connected: true,
  }),
}));

vi.mock("@/hooks/use-keyboard", () => ({
  useKeyboard: () => undefined,
}));

vi.mock("@/components/shared/theme-provider", () => ({
  useTheme: () => ({
    theme: "dark",
    toggle: toggleThemeMock,
  }),
}));

vi.mock("lucide-react", () => ({
  Activity: () => <svg aria-hidden="true" />,
  Bell: () => <svg aria-hidden="true" />,
  Bot: () => <svg aria-hidden="true" />,
  Columns3: () => <svg aria-hidden="true" />,
  FolderGit2: () => <svg aria-hidden="true" />,
  GitBranch: () => <svg aria-hidden="true" />,
  Github: () => <svg aria-hidden="true" />,
  Menu: () => <svg aria-hidden="true" />,
  Moon: () => <svg aria-hidden="true" />,
  PlaySquare: () => <svg aria-hidden="true" />,
  Settings: () => <svg aria-hidden="true" />,
  Settings2: () => <svg aria-hidden="true" />,
  Sun: () => <svg aria-hidden="true" />,
  Wifi: () => <svg aria-hidden="true" />,
  WifiOff: () => <svg aria-hidden="true" />,
}));

describe("APP_HEADER_NAV_ITEMS", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    toggleThemeMock.mockReset();
  });

  it("includes the dedicated automations surface in the main navigation", () => {
    expect(APP_HEADER_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/automations",
          label: "Automations",
        }),
      ]),
    );
  });

  it("includes the workspace lifecycle surface in the main navigation", () => {
    expect(APP_HEADER_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/workspaces",
          label: "Workspaces",
        }),
      ]),
    );
  });

  it("renders settings access, theme toggle, and the main nav links", () => {
    render(<AppHeader />);

    expect(screen.getByRole("button", { name: "Open settings" })).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toHaveAttribute("aria-label", "Switch to light theme");

    for (const item of APP_HEADER_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
    }
  });
});
