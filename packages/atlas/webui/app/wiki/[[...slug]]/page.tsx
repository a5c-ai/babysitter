import Link from "next/link";
import { notFound } from "next/navigation";
import type { AtlasRecord } from "@a5c-ai/atlas";
import {
  AtlasDocsScaffold,
  atlasLeadFromMarkdown,
  atlasReadingTime,
} from "@/components/AtlasDocsScaffold";
import { MarkdownArticle } from "@/components/MarkdownArticle";
import { getReusableViewType, renderReusableView } from "@/components/reusable-views/render";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamicParams = true;

type Params = { slug?: string[] };

type WikiPageSummary = {
  id: string;
  slug: string;
  title: string;
  pagePath: string;
  lead: string;
};

function pageHref(slug: string) {
  if (slug === "index") return "/wiki";
  return `/wiki/${slug.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
}

function parentSlug(slug: string): string | null {
  if (slug === "index") return null;
  const parts = slug.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : null;
}

function isNavigableWikiPage(page: AtlasRecord) {
  const slug = typeof page.slug === "string" ? page.slug : "";
  return Boolean(slug) && !slug.includes("/_") && !slug.endsWith("/_template");
}

function sortWikiPages(a: WikiPageSummary, b: WikiPageSummary) {
  const priority: Record<string, number> = {
    process: 0,
    qa: 1,
    generators: 2,
    "agent-generate": 3,
    "00-wiki-architecture": 4,
    "01-derivation-mapping": 5,
  };
  const scoreA = priority[a.slug] ?? 100;
  const scoreB = priority[b.slug] ?? 100;
  if (scoreA !== scoreB) return scoreA - scoreB;
  return a.slug.localeCompare(b.slug);
}

function toSummary(page: AtlasRecord & { slug?: string; title?: string; article?: string; articlePath?: string; _file: string }): WikiPageSummary {
  const article = typeof page.article === "string" ? page.article : "";
  return {
    id: page.id,
    slug: String(page.slug ?? page.id),
    title: String(page.title ?? page.id),
    pagePath: typeof page.articlePath === "string" ? page.articlePath : page._file,
    lead: atlasLeadFromMarkdown(article, "Graph-backed Atlas wiki page."),
  };
}

function getDirectChildren(baseSlug: string | null, pages: WikiPageSummary[]) {
  return pages
    .filter((page) => {
      if (page.slug === "index") return false;
      if (baseSlug === null) return !page.slug.includes("/");
      if (!page.slug.startsWith(`${baseSlug}/`)) return false;
      const remainder = page.slug.slice(baseSlug.length + 1);
      return Boolean(remainder) && !remainder.includes("/");
    })
    .sort(sortWikiPages);
}

function prettifySegment(segment: string) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function WikiNavCards({
  title,
  note,
  pages,
}: {
  title: string;
  note: string;
  pages: WikiPageSummary[];
}) {
  if (pages.length === 0) return null;
  return (
    <section className="atlas-docs-full atlas-docs-stack">
      <div>
        <h3>{title}</h3>
        <p className="atlas-docs-note">{note}</p>
      </div>
      <div className="atlas-docs-grid atlas-docs-grid--2">
        {pages.map((entry) => (
          <Card key={entry.slug}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">
                  <Link href={pageHref(entry.slug)} className="hover:underline" style={{ color: "var(--brass)" }}>
                    {entry.title}
                  </Link>
                </CardTitle>
                <Badge variant="secondary">Page</Badge>
              </div>
              <CardDescription className="line-clamp-3 text-xs">
                {entry.lead}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="atlas-docs-note">{entry.pagePath}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default async function WikiPage({ params }: { params: Promise<Params> }) {
  const { slug: parts = [] } = await params;
  const slug = parts.length ? parts.join("/") : "index";
  const { graph, index } = await getCurrentAtlasView();
  const page = graph.getPageBySlug(slug);
  if (!page) notFound();

  const article = typeof page.article === "string" ? page.article : "";
  const documented = graph.getOutgoing(page.id).filter((edge) => edge.kind === "documents");
  const reusableViewType = getReusableViewType(page);
  const reusableView = renderReusableView(page, graph);

  if (reusableView) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 10, overflow: "hidden" }}>
        {reusableView}
      </div>
    );
  }

  const pageTitle = String(page.title ?? page.id);
  const pagePath = typeof page.articlePath === "string" ? page.articlePath : page._file;
  const allPages = graph.getPages().filter(isNavigableWikiPage).map(toSummary);
  const pagesBySlug = new Map(allPages.map((entry) => [entry.slug, entry]));
  const currentPage = pagesBySlug.get(slug) ?? toSummary(page);
  const parent = parentSlug(slug);
  const childPages = getDirectChildren(slug === "index" ? null : slug, allPages);
  const siblingPages = slug === "index" ? [] : getDirectChildren(parent, allPages).filter((entry) => entry.slug !== slug);
  const nearbyPages = childPages.length ? childPages : siblingPages;
  const breadcrumbs = [
    { label: "Wiki", href: "/wiki", current: slug === "index" },
    ...(
      slug === "index"
        ? []
        : slug.split("/").map((segment, index, source) => {
            const partial = source.slice(0, index + 1).join("/");
            const target = pagesBySlug.get(partial);
            return {
              label: target?.title ?? prettifySegment(segment),
              href: target ? pageHref(partial) : undefined,
              current: partial === slug,
            };
          })
    ),
  ];

  const documentedItems = documented.slice(0, 8).map((edge) => {
    const target = graph.getRecord(edge.to);
    return {
      label: target ? `${String(target.displayName ?? edge.to)} · ${target._kind}` : edge.to,
      href: `/n/${encodeURIComponent(edge.to)}`,
    };
  });
  const chapterItems = [
    { label: pageTitle, current: true },
    ...nearbyPages.slice(0, 6).map((entry) => ({
      label: entry.title,
      href: pageHref(entry.slug),
    })),
  ];

  return (
    <AtlasDocsScaffold
      runningLeft={
        <>
          <span className="folio">{parts.length === 0 ? "i" : `i.${parts.length}`}</span>
          <span>Wiki</span>
        </>
      }
      runningTitle={
        <>
          Agentic AI Atlas · <em>{pageTitle}</em>
        </>
      }
      runningRight={
        <>
          <span>{slug}</span>
          <span>a5c.ai</span>
        </>
      }
      tocSearchLabel="Search the atlas"
      tocBookLabel={childPages.length || slug === "index" ? "Wiki · section map" : "Wiki · linked records"}
      tocTitle={childPages.length || slug === "index" ? "Trail and section pages" : "Article and nearby pages"}
      chapters={[
        {
          num: "I.",
          title: childPages.length ? "In this section" : slug === "index" ? "Start here" : "Current article",
          pages: "pp. 1 - 1",
          current: true,
          items: chapterItems,
        },
        ...(documentedItems.length
          ? [{
              num: "II.",
              title: "Documented nodes",
              pages: `refs · ${documentedItems.length}`,
              items: documentedItems,
            }]
          : []),
      ]}
      chapterMark={{
        num: "I.",
        subtitle: slug === "index" ? "Wiki hub" : "Wiki article",
        context: slug === "index" ? "start-here" : slug,
        readingTime: atlasReadingTime(article),
      }}
      articleTitle={
        <>
          {pageTitle} <em>{childPages.length || slug === "index" ? "guide" : "reference"}</em>
        </>
      }
      lead={currentPage.lead}
      meta={
        <>
          <Badge variant="secondary">Page node</Badge>
          <span>{pagePath}</span>
          <span>{childPages.length ? `Section pages · ${childPages.length}` : `Nearby pages · ${siblingPages.length}`}</span>
          <span>Documents · {documented.length}</span>
          {reusableViewType ? <span>View · {reusableViewType}</span> : null}
        </>
      }
      marginSections={[
        {
          title: "Trail",
          items: breadcrumbs.map((entry, index) =>
            entry.href && !entry.current ? (
              <Link key={`${entry.label}-${index}`} href={entry.href}>
                {entry.label}
              </Link>
            ) : (
              <p key={`${entry.label}-${index}`} className="atlas-docs-note">{entry.label}</p>
            ),
          ),
        },
        ...(nearbyPages.length
          ? [{
              title: childPages.length ? "In this section" : "Continue reading",
              items: nearbyPages.slice(0, 8).map((entry) => (
                <Link key={entry.slug} href={pageHref(entry.slug)}>
                  {entry.title}
                </Link>
              )),
            }]
          : []),
        ...(slug === "index"
          ? [{
              title: "Atlas routes",
              items: [
                <Link key="overview" href="/">Atlas overview</Link>,
                <Link key="search" href="/search">Search records</Link>,
                <Link key="graph" href="/graph">Graph explorer</Link>,
                <Link key="edges" href="/edges">Edge kinds</Link>,
              ],
            }]
          : []),
        {
          title: "Page record",
          items: [
            <Link key="page-record" href={`/n/${encodeURIComponent(page.id)}`}>
              Open node ledger
            </Link>,
            <p key="page-path" className="atlas-docs-note">{pagePath}</p>,
          ],
        },
        {
          title: "Documents",
          items: documented.length
            ? documented.slice(0, 8).map((edge) => {
                const target = graph.getRecord(edge.to);
                return (
                  <Link key={edge.to} href={`/n/${encodeURIComponent(edge.to)}`}>
                    {target ? `${String(target.displayName ?? edge.to)} · ${target._kind}` : edge.to}
                  </Link>
                );
              })
            : [<p key="no-docs" className="atlas-docs-note">No documented graph nodes on this page.</p>],
        },
      ]}
      articleFlow={childPages.length || slug === "index" ? "stack" : "columns"}
    >
      <div className="atlas-docs-body">
        <WikiNavCards
          title={slug === "index" ? "Browse the wiki" : "Pages in this section"}
          note={
            slug === "index"
              ? "Section hubs and foundational reference pages derived from the Atlas graph."
              : "Start with the section hub, then move sideways into adjacent pages when you need more detail."
          }
          pages={childPages.length ? childPages : slug === "index" ? getDirectChildren(null, allPages) : []}
        />
        {!childPages.length && siblingPages.length ? (
          <section className="atlas-docs-full atlas-docs-panel atlas-docs-stack">
            <div>
              <h3>Continue reading</h3>
              <p className="atlas-docs-note">Nearby pages in the same section.</p>
            </div>
            <div className="atlas-docs-link-list">
              {siblingPages.map((entry) => (
                <Link key={entry.slug} href={pageHref(entry.slug)}>
                  {entry.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {documentedItems.length ? (
          <section className="atlas-docs-full atlas-docs-panel atlas-docs-stack">
            <div>
              <h3>Documented graph nodes</h3>
              <p className="atlas-docs-note">Records linked directly from this page’s Page node.</p>
            </div>
            <div className="atlas-docs-link-list">
              {documentedItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <section className="atlas-docs-full atlas-docs-stack">
          <MarkdownArticle markdown={article} articlePath={pagePath} recordsById={index.records} variant="docs" />
        </section>
      </div>
    </AtlasDocsScaffold>
  );
}
