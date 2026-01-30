import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          // Steampunk brass gradient button
          "text-[#F5E6C8] shadow border border-[#8B6914]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          // Steampunk outline with brass border
          "border-2 border-[#B8860B] bg-[#F9F0DC] shadow-sm hover:bg-[#F5E6C8] text-[#3D2B1F]",
        secondary:
          "bg-[#E8D5B0] text-[#3D2B1F] shadow-sm hover:bg-[#F5E6C8] border border-[#A67C00]",
        ghost: "hover:bg-[#F5E6C8] hover:text-[#3D2B1F]",
        link: "text-[#B8860B] underline-offset-4 hover:underline hover:text-[#D4AF37]",
        // New steampunk-specific variant
        brass:
          "text-[#F5E6C8] border border-[#8B6914]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
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

    // Apply brass gradient styling for default and brass variants
    const brassStyle = (variant === "default" || variant === "brass" || variant === undefined) ? {
      background: 'linear-gradient(180deg, #D4AF37 0%, #B8860B 50%, #8B6914 100%)',
      textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(61, 43, 31, 0.2)',
      fontFamily: '"Playfair Display", Georgia, serif',
      ...style,
    } : style;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={brassStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
