import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground-secondary ring-border",
        success: "bg-success-muted text-success ring-1 ring-success/20 shadow-glow-success/30",
        error: "bg-error-muted text-error ring-1 ring-error/20 shadow-glow-error/30",
        warning: "bg-warning-muted text-warning ring-1 ring-warning/20 shadow-neon-glow-warning-badge",
        info: "bg-info-muted text-info ring-1 ring-info/20 shadow-glow-cyan/30",
        pending: "bg-pending-muted text-pending ring-1 ring-pending/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
