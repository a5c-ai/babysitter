import { cn } from "@/lib/cn";

export const pageShellContainerClassName =
  "mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6";

export const pageSectionClassName = "rounded-3xl border border-border/90 bg-card/95 p-6 shadow-lg";

export const pageInsetSectionClassName = "rounded-3xl border border-border/80 bg-background/60 p-5 shadow-sm";

export function PageShell(props: {
  children: React.ReactNode;
  className?: string;
  background?: "ambient" | "none";
}) {
  const background = props.background ?? "ambient";
  return (
    <div className={cn("flex-1", background === "ambient" ? "bg-gradient-brand-subtle" : null)}>
      <div className={cn(pageShellContainerClassName, props.className)}>{props.children}</div>
    </div>
  );
}

export function PageSection(props: {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <section className={cn(props.inset ? pageInsetSectionClassName : pageSectionClassName, props.className)}>
      {props.children}
    </section>
  );
}

export function PageHeroGrid(props: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]", props.className)}>
      {props.children}
    </section>
  );
}
