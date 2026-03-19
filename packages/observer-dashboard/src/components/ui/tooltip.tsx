"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Provider = TooltipPrimitive.Provider as any;
  return <Provider delayDuration={200}>{children}</Provider>;
}

export function Tooltip({ children, open, defaultOpen, onOpenChange }: { children: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Root = TooltipPrimitive.Root as any;
  return <Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>{children}</Root>;
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Trigger = TooltipPrimitive.Trigger as any;
  return <Trigger asChild={asChild}>{children}</Trigger>;
}

export function TooltipContent({ className, children, sideOffset = 4 }: { className?: string; children: React.ReactNode; sideOffset?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Content = TooltipPrimitive.Content as any;
  return (
    <Content
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border border-card-border bg-card px-3 py-1.5 text-xs text-foreground-secondary shadow-md backdrop-blur-sm",
        className
      )}
    >
      {children}
    </Content>
  );
}
