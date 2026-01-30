import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border text-card-foreground shadow-sm relative",
      // Steampunk parchment background and brass border with enhanced styling
      "bg-[#F9F0DC] border-[#A67C00] border-2",
      className
    )}
    style={{
      boxShadow: `
        0 1px 3px rgba(61, 43, 31, 0.15),
        0 2px 4px rgba(61, 43, 31, 0.1),
        0 4px 8px rgba(61, 43, 31, 0.08),
        inset 0 1px 3px rgba(61, 43, 31, 0.08),
        inset 0 -1px 2px rgba(255, 255, 255, 0.3)
      `,
    }}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight",
      // Steampunk header typography
      "text-[#3D2B1F]"
    )}
    style={{
      fontFamily: '"Playfair Display", Georgia, serif',
    }}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm", className)}
    style={{
      fontFamily: 'Georgia, serif',
      color: '#4A3728',
    }}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
