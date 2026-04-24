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
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SlotComp = Slot as any;

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return <SlotComp className={classes} {...props} />;
  }
  return <button className={classes} {...props} />;
}
