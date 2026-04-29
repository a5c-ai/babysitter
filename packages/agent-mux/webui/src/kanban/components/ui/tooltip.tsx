"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cx } from "@a5c-ai/compendium";

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
      className={cx(
        "z-50 overflow-hidden rounded-[3px] border border-black bg-[var(--tkc-surface-dark)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--tkc-ink)] shadow-[0_0_0_2px_var(--tkc-brass-deep),0_6px_14px_rgba(0,0,0,.5)]",
        className
      )}
    >
      {children}
    </Content>
  );
}
