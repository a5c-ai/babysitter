import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--scifi-cyan)] focus:ring-offset-2 focus:ring-offset-[#0a0a0f]",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(0,223,223,0.3)] bg-[rgba(0,223,223,0.15)] text-[#ffffff] shadow",
        secondary:
          "border-[rgba(255,255,255,0.15)] bg-[var(--scifi-surface)] text-[rgba(255,255,255,0.9)]",
        destructive:
          "border-[rgba(255,51,102,0.3)] bg-[rgba(255,51,102,0.15)] text-[#ffffff] shadow",
        outline: "text-[rgba(255,255,255,0.9)] border-[rgba(255,255,255,0.2)]",
        success:
          "border-[rgba(0,255,136,0.3)] bg-[rgba(0,255,136,0.15)] text-[#ffffff]",
        warning:
          "border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.15)] text-[#ffffff]",
        accent:
          "border-[rgba(0,223,223,0.3)] bg-[rgba(0,223,223,0.15)] text-[#ffffff]",
        // Neon sci-fi badge variant
        neon:
          "border-[rgba(255,0,224,0.4)] rounded-full px-3 py-0.5 text-[#ffffff] uppercase tracking-wider bg-[rgba(255,0,224,0.15)]",
        // Sci-fi cyan neon variant
        scifi:
          "border-[rgba(0,223,223,0.4)] rounded-full px-3 py-0.5 text-[#ffffff] uppercase tracking-wider bg-[rgba(0,223,223,0.15)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  // Apply neon styling for neon/scifi variants
  const neonStyle = (variant === "neon" || variant === "scifi") ? {
    fontFamily: 'var(--font-header, var(--font-scifi-header))',
    fontSize: '0.6rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    boxShadow: variant === "neon"
      ? '0 0 8px rgba(255, 0, 224, 0.2), inset 0 0 4px rgba(255, 0, 224, 0.1)'
      : variant === "scifi"
        ? '0 0 8px rgba(0, 223, 223, 0.2), inset 0 0 4px rgba(0, 223, 223, 0.1)'
        : undefined,
    ...style,
  } : style;

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={neonStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
