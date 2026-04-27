import { cn } from "@/lib/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn(
      "inline-flex h-5 min-w-[20px] items-center justify-center rounded",
      "border border-[var(--kbd-border)] bg-background-secondary",
      "px-1.5 font-mono text-xs leading-tight text-foreground-muted",
      "shadow-kbd",
      className
    )}>
      {children}
    </kbd>
  );
}
