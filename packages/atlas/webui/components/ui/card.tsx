import * as React from "react";
import { clsx } from "clsx";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("rounded-lg", className)}
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        color: 'var(--fg)',
        ...style,
      }}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("flex flex-col space-y-1.5 p-5", className)} {...p} />
);
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx("font-semibold leading-none tracking-tight", className)} style={{ color: 'var(--fg)' }} {...p} />
);
export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx("text-sm", className)} style={{ color: 'var(--fg-2)' }} {...p} />
);
export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("p-5 pt-0", className)} {...p} />
);
export const CardFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("flex items-center p-5 pt-0", className)} {...p} />
);
