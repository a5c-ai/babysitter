import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]",
        warning:
          "border-transparent bg-[var(--color-attention-subtle)] text-[var(--color-attention-fg)]",
        accent:
          "border-transparent bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]",
        // Steampunk brass-framed badge variant - enhanced pill shape with brass gradient
        steampunk:
          "border-2 border-[#8B6914] rounded-full px-3 py-0.5 text-[#FFFEF0] uppercase tracking-wider",
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
  // Apply steampunk styling for steampunk variant - ENHANCED brass pill badge with highlight layer
  const steampunkStyle = variant === "steampunk" ? {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '0.6rem',
    fontWeight: 600,
    background: 'linear-gradient(180deg, #F0D060 0%, #E8C252 15%, #D4AF37 30%, #B8860B 55%, #8B6914 80%, #5A3D0A 100%)',
    boxShadow: 'inset 0 3px 4px rgba(255, 255, 255, 0.5), inset 0 -3px 4px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.15)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.4), 0 -1px 0 rgba(255, 255, 255, 0.2)',
    borderWidth: '2px',
    ...style,
  } : style;

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={steampunkStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
