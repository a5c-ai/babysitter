import { cn } from "@/lib/cn";

type ProgressVariant = "default" | "success" | "error" | "warning";

const variantStyles: Record<ProgressVariant, string> = {
  default: "bg-primary",
  success: "bg-success",
  error: "bg-error",
  warning: "bg-warning",
};

const variantGlow: Record<ProgressVariant, string> = {
  default: "shadow-progress-glow-primary",
  success: "shadow-progress-glow-success",
  error: "shadow-progress-glow-error",
  warning: "shadow-progress-glow-warning",
};

interface ProgressBarProps {
  value: number; // 0-100
  variant?: ProgressVariant;
  glow?: boolean;
  className?: string;
}

export function ProgressBar({ value, variant = "default", glow = false, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isComplete = clamped === 100;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-background-muted", className)}>
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out",
          variantStyles[variant],
          glow && variantGlow[variant],
          isComplete ? "rounded-full" : "rounded-l-full"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
