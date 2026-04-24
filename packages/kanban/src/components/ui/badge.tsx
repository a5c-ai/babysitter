import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "tkc-tag border font-mono uppercase shadow-none",
  {
    variants: {
      variant: {
        default: "bg-[var(--tkc-surface-muted)] text-[var(--tkc-ink-quiet)] border-[color:var(--tkc-rule)]",
        success: "bg-success/10 text-success border-success/30",
        error: "bg-error/10 text-error border-error/30",
        warning: "bg-warning/10 text-warning border-warning/30",
        info: "bg-info/10 text-info border-info/30",
        pending: "bg-[var(--tkc-panel-muted)] text-[var(--tkc-cinnabar)] border-[color:var(--tkc-rule-m)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
