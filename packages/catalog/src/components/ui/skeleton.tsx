import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm",
        "bg-[var(--scifi-surface)]",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--scifi-surface) 0%, rgba(0, 223, 223, 0.05) 50%, var(--scifi-surface) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 2s ease-in-out infinite",
      }}
      {...props}
    />
  );
}

export { Skeleton };
