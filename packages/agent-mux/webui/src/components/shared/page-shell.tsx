import { cx } from "@a5c-ai/compendium";

export const pageShellContainerClassName = "page-shell__container";

export const pageSectionClassName = "page-section";

export const pageInsetSectionClassName = "page-section page-section--inset";

export function PageShell(props: {
  children: React.ReactNode;
  className?: string;
  background?: "ambient" | "none";
}) {
  const background = props.background ?? "ambient";
  return (
    <div className={cx("page-shell", background === "ambient" ? "page-shell--ambient" : "page-shell--plain")}>
      <div className={cx(pageShellContainerClassName, props.className)}>{props.children}</div>
    </div>
  );
}

export function PageSection(props: {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <section className={cx(props.inset ? pageInsetSectionClassName : pageSectionClassName, props.className)}>
      {props.children}
    </section>
  );
}

export function PageHeroGrid(props: { children: React.ReactNode; className?: string }) {
  return <section className={cx("page-hero-grid", props.className)}>{props.children}</section>;
}
