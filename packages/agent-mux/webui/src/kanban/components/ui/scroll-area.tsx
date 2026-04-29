"use client";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cx } from "@a5c-ai/compendium";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea({ className, children, ...props }, ref) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Root = ScrollAreaPrimitive.Root as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Viewport = ScrollAreaPrimitive.Viewport as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Scrollbar = ScrollAreaPrimitive.Scrollbar as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Thumb = ScrollAreaPrimitive.Thumb as any;
    return (
      <Root ref={ref} className={cx("relative overflow-hidden", className)} {...props}>
        <Viewport className="h-full w-full rounded-[inherit]">
          {children}
        </Viewport>
        <Scrollbar
          orientation="vertical"
          className="flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:w-2"
        >
          <Thumb className="relative flex-1 rounded-full bg-[var(--tkc-rule-m)] hover:bg-[var(--tkc-brass-deep)] transition-colors duration-200" />
        </Scrollbar>
      </Root>
    );
  }
);
