import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-sm px-3 py-1 text-base shadow-sm transition-all",
          "bg-[var(--scifi-surface)] text-white",
          "border border-[rgba(255,0,224,0.15)]",
          "placeholder:text-[rgba(255,255,255,0.3)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          "focus-visible:outline-none focus-visible:border-[rgba(0,223,223,0.5)]",
          "focus-visible:ring-1 focus-visible:ring-[rgba(0,223,223,0.3)]",
          "focus-visible:shadow-[0_0_8px_rgba(0,223,223,0.2)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
