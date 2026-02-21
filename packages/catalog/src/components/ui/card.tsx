import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, onMouseEnter, onMouseLeave, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-sm text-card-foreground shadow-sm relative",
      // Sci-fi dark card with neon border
      "bg-[#12121a] border border-[rgba(255,0,224,0.15)]",
      "hover:border-[rgba(0,223,223,0.4)]",
      className
    )}
    style={{
      boxShadow: '0 0 12px rgba(0, 0, 0, 0.3), 0 0 4px rgba(255, 0, 224, 0.05)',
      transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      ...style,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(0,223,223,0.3), 0 0 12px rgba(0, 0, 0, 0.3)';
      onMouseEnter?.(e);
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px rgba(0, 0, 0, 0.3), 0 0 4px rgba(255, 0, 224, 0.05)';
      onMouseLeave?.(e);
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
      // Sci-fi header text
      "text-white"
    )}
    style={{
      fontFamily: 'var(--font-header, var(--font-scifi-header))',
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
    className={cn("text-sm text-[rgba(255,255,255,0.5)]", className)}
    style={{
      fontFamily: 'var(--font-body, var(--font-scifi-body))',
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
