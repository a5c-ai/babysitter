"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      style={{
        background:
          orientation === "horizontal"
            ? "linear-gradient(90deg, transparent 0%, var(--scifi-magenta) 15%, var(--scifi-cyan) 50%, var(--scifi-magenta) 85%, transparent 100%)"
            : "linear-gradient(180deg, transparent 0%, var(--scifi-magenta) 15%, var(--scifi-cyan) 50%, var(--scifi-magenta) 85%, transparent 100%)",
        boxShadow: "0 0 4px rgba(0, 223, 223, 0.2)",
      }}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
