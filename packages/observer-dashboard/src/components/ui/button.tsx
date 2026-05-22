import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Slot } from "@radix-ui/react-slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium italic tracking-[0.04em] transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 font-serif",
  {
    variants: {
      variant: {
        default: "border-primary/60 bg-primary text-primary-foreground shadow-sm hover:bg-[var(--primary-hover)] hover:shadow-md",
        neon: "border-primary/40 bg-primary-muted text-primary hover:border-primary/60 hover:bg-primary-muted/80 hover:shadow-glow-primary",
        outline: "border-border-hover bg-transparent text-foreground hover:bg-card hover:border-primary/30 hover:shadow-sm",
        ghost: "border-transparent bg-transparent text-foreground-secondary hover:bg-muted hover:text-foreground",
        destructive: "border-destructive/60 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-glow-error",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-11 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SlotComp = Slot as any;

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return <SlotComp className={classes} {...props} />;
  }
  return <button className={classes} {...props} />;
}
