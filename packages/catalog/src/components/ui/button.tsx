import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scifi-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          // Neon cyan outline button
          "text-[var(--scifi-cyan)] shadow border border-[rgba(0,223,223,0.4)] bg-[rgba(0,223,223,0.08)] hover:bg-[rgba(0,223,223,0.15)]",
        destructive:
          "bg-[rgba(255,51,102,0.15)] text-[#FF3366] border border-[rgba(255,51,102,0.3)] shadow-sm hover:bg-[rgba(255,51,102,0.25)]",
        outline:
          // Neon outline with subtle bg
          "border border-[rgba(255,255,255,0.15)] bg-transparent shadow-sm hover:bg-[var(--scifi-surface)] text-[rgba(255,255,255,0.7)] hover:text-white",
        secondary:
          "bg-[var(--scifi-surface)] text-[rgba(255,255,255,0.7)] shadow-sm hover:bg-[var(--scifi-surface-light)] border border-[rgba(255,255,255,0.1)]",
        ghost: "hover:bg-[var(--scifi-surface)] hover:text-[var(--scifi-cyan)]",
        link: "text-[var(--scifi-cyan)] underline-offset-4 hover:underline hover:text-[var(--scifi-bright-cyan)]",
        // Magenta neon variant
        magenta:
          "text-[var(--scifi-magenta)] border border-[rgba(255,0,224,0.4)] bg-[rgba(255,0,224,0.08)] hover:bg-[rgba(255,0,224,0.15)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-10 rounded-sm px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Apply neon glow styling for default and magenta variants
    const neonStyle = (variant === "default" || variant === "magenta" || variant === undefined) ? {
      fontFamily: 'var(--font-header, var(--font-scifi-header))',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      fontSize: '0.8em',
      boxShadow: variant === "magenta"
        ? '0 0 8px rgba(255, 0, 224, 0.15), inset 0 0 4px rgba(255, 0, 224, 0.05)'
        : '0 0 8px rgba(0, 223, 223, 0.15), inset 0 0 4px rgba(0, 223, 223, 0.05)',
      ...style,
    } : style;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={neonStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
