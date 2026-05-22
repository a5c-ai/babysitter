import type { ReactNode } from "react";
import Link from "next/link";

type CompendiumNode = Exclude<ReactNode, bigint>;

function toCompendiumNode(node: ReactNode): CompendiumNode {
  return (typeof node === "bigint" ? node.toString() : node) as CompendiumNode;
}

export interface AtlasDocsNavItem {
  label: ReactNode;
  href?: string;
  current?: boolean;
  disabled?: boolean;
}

export interface AtlasDocsNavChapter {
  num: string;
  title: ReactNode;
  pages: string;
  current?: boolean;
  items?: readonly AtlasDocsNavItem[];
}

export interface AtlasDocsMarginSection {
  title: string;
  items: readonly ReactNode[];
}

export function atlasLeadFromMarkdown(markdown: string, fallback: string): string {
  const line = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry && !/^(#{1,6}|\*|-|>|\|)/.test(entry));
  return line ? line.replace(/[`*_#[\]]/g, "").trim() : fallback;
}

export function atlasReadingTime(markdown: string): string {
  const words = markdown
    .replace(/[`*_#[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `Reading · ${Math.max(1, Math.ceil(words / 220))} min`;
}

function AtlasDocsShellLayout({
  runningLeft,
  title,
  runningRight,
  toc,
  article,
  margin,
}: {
  runningLeft: ReactNode;
  title: ReactNode;
  runningRight: ReactNode;
  toc: ReactNode;
  article: ReactNode;
  margin: ReactNode;
}) {
  return (
    <section className="mk-docs">
      <header className="mk-docs__running">
        <div className="mk-docs__running-left">{runningLeft}</div>
        <span>{title}</span>
        <div className="mk-docs__running-right">{runningRight}</div>
      </header>
      <div className="mk-docs__layout">
        {toc}
        {article}
        {margin}
      </div>
    </section>
  );
}

function AtlasDocsChapterMark({
  num,
  subtitle,
  context,
  readingTime,
}: {
  num: ReactNode;
  subtitle: ReactNode;
  context: ReactNode;
  readingTime: ReactNode;
}) {
  return (
    <div className="mk-docs__chapter-mark">
      <b>{num}</b>
      <div>
        <small>{subtitle}</small>
        <p>{context}</p>
      </div>
      <span>{readingTime}</span>
    </div>
  );
}

function AtlasDocsMargin({
  sections,
}: {
  sections: readonly AtlasDocsMarginSection[];
}) {
  return (
    <aside className="mk-docs__margin">
      {sections.map((section) => (
        <div key={section.title}>
          <h3>{section.title}</h3>
          {section.items.map((item, index) => (
            <div key={index}>{toCompendiumNode(item)}</div>
          ))}
        </div>
      ))}
    </aside>
  );
}

export function AtlasDocsScaffold({
  runningLeft,
  runningTitle,
  runningRight,
  tocSearchLabel,
  tocBookLabel,
  tocTitle,
  chapters,
  chapterMark,
  articleTitle,
  lead,
  meta,
  marginSections,
  children,
  articleFlow = "stack",
}: {
  runningLeft: ReactNode;
  runningTitle: ReactNode;
  runningRight: ReactNode;
  tocSearchLabel: ReactNode;
  tocBookLabel: ReactNode;
  tocTitle: ReactNode;
  chapters: readonly AtlasDocsNavChapter[];
  chapterMark: {
    num: ReactNode;
    subtitle: ReactNode;
    context: ReactNode;
    readingTime: ReactNode;
  };
  articleTitle: ReactNode;
  lead: ReactNode;
  meta?: ReactNode;
  marginSections: readonly AtlasDocsMarginSection[];
  children: ReactNode;
  articleFlow?: "stack" | "columns";
}) {
  const contentClassName =
    articleFlow === "columns"
      ? "mk-docs__columns atlas-docs-content atlas-docs-content--columns"
      : "atlas-docs-content atlas-docs-content--stack";

  return (
    <div className="atlas-docs-shell">
      <AtlasDocsShellLayout
        runningLeft={<div className="mk-docs__running-left">{toCompendiumNode(runningLeft)}</div> as never}
        title={toCompendiumNode(runningTitle)}
        runningRight={<div className="mk-docs__running-right">{toCompendiumNode(runningRight)}</div> as never}
        toc={
          <aside className="mk-docs__toc">
            <div className="mk-docs__search">
              <span>{tocSearchLabel}</span>
              <i>/</i>
            </div>
            <small>{tocBookLabel}</small>
            <h3>{tocTitle}</h3>
            {chapters.map((chapter) => (
              <div
                key={`${chapter.num}-${String(chapter.title)}`}
                className={`mk-docs__chapter ${chapter.current ? "current" : ""}`}
              >
                <div className="mk-docs__chapter-head">
                  <b>{chapter.num}</b>
                  <strong>{chapter.title}</strong>
                  <span>{chapter.pages}</span>
                </div>
                {chapter.items?.length ? (
                  <div className="mk-docs__chapter-items">
                    {chapter.items.map((item, index) =>
                      item.href ? (
                        <Link
                          key={`${String(item.label)}-${index}`}
                          href={item.href}
                          className={item.current ? "current" : undefined}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          key={`${String(item.label)}-${index}`}
                          type="button"
                          className={item.current ? "current" : undefined}
                          aria-current={item.current ? "true" : undefined}
                          disabled={item.disabled}
                        >
                          {item.label}
                        </button>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </aside>
        }
        article={
          <article className="mk-docs__article atlas-docs-article">
            <AtlasDocsChapterMark
              num={toCompendiumNode(chapterMark.num)}
              subtitle={toCompendiumNode(chapterMark.subtitle)}
              context={toCompendiumNode(chapterMark.context)}
              readingTime={toCompendiumNode(chapterMark.readingTime)}
            />
            <h2>{toCompendiumNode(articleTitle)}</h2>
            <p className="lead">{toCompendiumNode(lead)}</p>
            {meta ? <div className="mk-docs__meta">{toCompendiumNode(meta)}</div> : null}
            <div className={contentClassName}>{toCompendiumNode(children)}</div>
          </article>
        }
        margin={
          <AtlasDocsMargin sections={marginSections} />
        }
      />
    </div>
  );
}
