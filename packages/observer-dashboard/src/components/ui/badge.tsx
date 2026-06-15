import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ring-1 ring-inset transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground-secondary ring-border",
        success: "bg-success-muted text-success ring-success/20 shadow-neon-glow-success-sm",
        error: "bg-error-muted text-error ring-error/20 shadow-neon-glow-error-sm",
        warning: "bg-warning-muted text-warning ring-warning/20 shadow-neon-glow-warning-badge",
        info: "bg-info-muted text-info ring-info/20 shadow-neon-glow-cyan-sm",
        pending: "bg-pending-muted text-pending ring-pending/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
