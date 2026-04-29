import { Bot, Columns3, FolderGit2, GitBranch, PlaySquare, Settings, Activity } from "lucide-react";

export const APP_HEADER_NAV_ITEMS = [
  { href: "/projects", label: "Projects", icon: Columns3 },
  { href: "/runs", label: "Runs", icon: Activity },
  { href: "/automations", label: "Automations", icon: Bot },
  { href: "/sessions", label: "Sessions", icon: PlaySquare },
  { href: "/workspaces", label: "Workspaces", icon: FolderGit2 },
  { href: "/inbox", label: "Inbox", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
