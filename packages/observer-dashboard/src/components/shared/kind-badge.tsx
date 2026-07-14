import { cn } from "@/lib/cn";
import type { TaskKind } from "@/types";
import { Bot, Terminal, Puzzle, Hand, Clock, Cog } from "lucide-react";

const kindConfig: Record<TaskKind, { icon: React.ReactNode; color: string; bgTint: string }> = {
  agent: {
    icon: <Bot className="h-3 w-3" />,
    color: "text-primary",
    bgTint: "bg-primary-muted",
  },
  node: {
    icon: <Cog className="h-3 w-3" />,
    color: "text-warning",
    bgTint: "bg-warning-muted",
  },
  shell: {
    icon: <Terminal className="h-3 w-3" />,
    color: "text-foreground-secondary",
    bgTint: "bg-background-secondary",
  },
  skill: {
    icon: <Puzzle className="h-3 w-3" />,
    color: "text-info",
    bgTint: "bg-info-muted",
  },
  breakpoint: {
    icon: <Hand className="h-3 w-3" />,
    color: "text-warning",
    bgTint: "bg-warning-muted",
  },
  sleep: {
    icon: <Clock className="h-3 w-3" />,
    color: "text-foreground-muted",
    bgTint: "bg-background-secondary",
  },
};

export function KindBadge({ kind, className }: { kind: TaskKind; className?: string }) {
  const config = kindConfig[kind] || kindConfig.agent;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs leading-tight font-medium uppercase tracking-wider",
      config.bgTint,
      config.color,
      className
    )}>
      {config.icon}
      {kind === "breakpoint" ? "approval" : kind}
    </span>
  );
}
