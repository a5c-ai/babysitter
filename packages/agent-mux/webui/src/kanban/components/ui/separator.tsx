"use client";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cx } from "@a5c-ai/compendium";

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Root = SeparatorPrimitive.Root as any;
  return (
    <Root
      orientation={orientation}
      className={cx(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}
