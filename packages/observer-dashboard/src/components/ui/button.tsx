import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Slot } from "@radix-ui/react-slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]",
        neon: "bg-transparent border border-primary text-primary hover:shadow-glow-primary hover:bg-primary-muted hover:scale-[1.02] active:scale-[0.98]",
        outline: "border border-border-hover bg-transparent hover:bg-muted hover:border-primary/30 hover:scale-[1.02]",
        ghost: "hover:bg-muted hover:text-foreground hover:border-primary/10",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-glow-error hover:scale-[1.02] active:scale-[0.98]",
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
