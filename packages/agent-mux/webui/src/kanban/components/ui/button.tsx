import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/cn";

const buttonVariants = cva("tkc-btn whitespace-nowrap", {
  variants: {
    variant: {
      default: "",
      primary: "tkc-btn--primary",
      neon: "tkc-btn--primary",
      outline: "bg-transparent text-[var(--tkc-ink)] border-[color:var(--tkc-rule-m)] hover:bg-[var(--tkc-panel-muted)]",
      ghost: "tkc-btn--ghost",
      destructive: "tkc-btn--primary",
    },
    size: {
      default: "",
      sm: "tkc-btn--sm min-h-11",
      lg: "px-5 py-2.5 text-base",
      icon: "tkc-btn--icon h-10 w-10 justify-center p-0",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({ className, variant, size, asChild = false, loading = false, disabled, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const Comp = asChild ? Slot : "button";
  return <Comp aria-busy={loading || undefined} className={classes} disabled={loading || disabled} {...props} />;
}
