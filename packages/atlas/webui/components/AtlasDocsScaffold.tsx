import type { ReactNode } from "react";
import Link from "next/link";
import {
  CodexDocsChapterMark,
  CodexDocsMargin,
  CodexDocsShell,
} from "@a5c-ai/compendium/codex";

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
      <CodexDocsShell
        runningLeft={<div className="mk-docs__running-left">{toCompendiumNode(runningLeft)}</div> as never}
        title={toCompendiumNode(runningTitle) as never}
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
            <CodexDocsChapterMark
              num={toCompendiumNode(chapterMark.num) as never}
              subtitle={toCompendiumNode(chapterMark.subtitle) as never}
              context={toCompendiumNode(chapterMark.context) as never}
              readingTime={toCompendiumNode(chapterMark.readingTime) as never}
            />
            <h2>{toCompendiumNode(articleTitle)}</h2>
            <p className="lead">{toCompendiumNode(lead)}</p>
            {meta ? <div className="mk-docs__meta">{toCompendiumNode(meta)}</div> : null}
            <div className={contentClassName}>{toCompendiumNode(children)}</div>
          </article>
        }
        margin={
          <CodexDocsMargin
            sections={marginSections.map((section) => ({
              title: section.title,
              items: section.items.map((item) => toCompendiumNode(item) as never),
            }))}
          />
        }
      />
    </div>
  );
}
