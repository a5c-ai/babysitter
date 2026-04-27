import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[color:var(--tkc-rule)] bg-[var(--tkc-surface)] text-[var(--tkc-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_var(--tkc-rule-m)] transition-all duration-200 hover:-translate-y-px hover:bg-[var(--tkc-surface-hover)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}
