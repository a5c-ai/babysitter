import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  AtlasDocsScaffold,
  atlasLeadFromMarkdown,
  atlasReadingTime,
} from "@/components/AtlasDocsScaffold";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AttributeTable } from "@/components/AttributeTable";
import { EdgeList } from "@/components/EdgeList";
import { MiniGraph } from "@/components/MiniGraph";
import { MarkdownArticle } from "@/components/MarkdownArticle";
import { CopyableText } from "@/components/CopyableText";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamicParams = true;

type SearchParams = { tab?: string };

export default async function RecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id: rawId } = await params;
  const { tab } = await searchParams;
  const id = decodeURIComponent(rawId);
  const { graph, index } = await getCurrentAtlasView();
  const rec = graph.getRecord(id);
  if (!rec) notFound();

  const out = graph.getOutgoing(id);
  const inc = graph.getIncoming(id);
  const relatedPages = graph.getPagesForRecord(id)
    .slice()
    .sort((a, b) => String(a.slug ?? a.id).localeCompare(String(b.slug ?? b.id)));
  const selfArticlePage = rec._kind === "Page" && typeof rec.article === "string" ? rec : null;
  const relatedArticlePage = relatedPages.find((page) => typeof page.article === "string") ?? null;
  const articlePage = selfArticlePage ?? relatedArticlePage;
  const hasArticle = Boolean(articlePage);
  const tabActive = tab === "json"
    ? "json"
    : tab === "graph"
      ? "graph"
      : tab === "overview"
        ? "overview"
        : tab === "article" && hasArticle
          ? "article"
          : hasArticle
            ? "article"
            : "overview";

  const basePath = `/n/${encodeURIComponent(id)}`;
  const baseTabHref = (t: string) => {
    if (hasArticle) {
      return t === "article" ? basePath : `${basePath}?tab=${t}`;
    }
    return t === "overview" ? basePath : `${basePath}?tab=${t}`;
  };
  const tabItems = (["overview", ...(hasArticle ? ["article"] : []), "json", "graph"] as const).map((t) => ({
    label: t,
    href: baseTabHref(t),
    current: tabActive === t,
  }));
  const recordTitle = graph.getDisplayName(rec);
  const overviewLead =
    typeof rec.description === "string" && rec.description.trim()
      ? rec.description.trim()
      : `Inspect the raw attributes, linked wiki pages, and inbound or outbound graph edges for ${id}.`;

  return (
    <>
      {tabActive === "overview" && (
        <AtlasDocsScaffold
          runningLeft={<><span className="folio">ii</span><span>Record</span></>}
          runningTitle={<>Agentic AI Atlas · <em>{recordTitle}</em></>}
          runningRight={<><span>{id}</span><span>a5c.ai</span></>}
          tocSearchLabel="Search record views"
          tocBookLabel="Record · tabs"
          tocTitle="Available views"
          chapters={[{ num: "II.", title: "Record views", pages: "pp. 1 - 1", current: true, items: tabItems }]}
          chapterMark={{ num: "II.", subtitle: `${rec._kind} overview`, context: id, readingTime: "Reference · live" }}
          articleTitle={<>{recordTitle} <em>overview</em></>}
          lead={overviewLead}
          meta={<><Badge variant="secondary">{rec._kind}</Badge><span>Outgoing · {out.length}</span><span>Incoming · {inc.length}</span></>}
          marginSections={[
            {
              title: "Related pages",
              items: relatedPages.length
                ? relatedPages.slice(0, 8).map((page) => (
                    <Link key={page.id} href={`/wiki/${String(page.slug ?? "").split("/").map(encodeURIComponent).join("/")}`}>
                      {String(page.title ?? page.id)}
                    </Link>
                  ))
                : [<p key="no-pages" className="atlas-docs-note">No related wiki pages for this record.</p>],
            },
            {
              title: "Shortcuts",
              items: [
                <Link key="graph" href={`/graph?seed=${encodeURIComponent(id)}`}>Open in graph</Link>,
                <Link key="kind" href={`/kind/${encodeURIComponent(rec._kind)}`}>Browse node kind</Link>,
              ],
            },
          ]}
        >
          <div className="atlas-docs-body">
            <div className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
                <section className="atlas-docs-panel">
                  <h3>Attributes</h3>
                  <AttributeTable attributes={rec as Record<string, unknown>} />
                </section>
              <section className="atlas-docs-stack">
                <div className="atlas-docs-panel">
                  <h3>Outgoing edges</h3>
                  <EdgeList edges={out} direction="outgoing" recordsById={index.records} />
                </div>
                <div className="atlas-docs-panel">
                  <h3>Incoming edges</h3>
                  <EdgeList edges={inc} direction="incoming" recordsById={index.records} />
                </div>
              </section>
            </div>
          </div>
        </AtlasDocsScaffold>
      )}

      {tabActive === "article" && articlePage && (
        <AtlasDocsScaffold
          runningLeft={
            <>
              <span className="folio">ii</span>
              <span>Record</span>
            </>
          }
          runningTitle={
            <>
              Agentic AI Atlas · <em>{graph.getDisplayName(rec)}</em>
            </>
          }
          runningRight={
            <>
              <span>{id}</span>
              <span>a5c.ai</span>
            </>
          }
          tocSearchLabel="Search record views"
          tocBookLabel="Record · tabs"
          tocTitle="Available views"
          chapters={[
            {
              num: "II.",
              title: "Record views",
              pages: "pp. 1 - 1",
              current: true,
              items: tabItems,
            },
            {
              num: "III.",
              title: "Related pages",
              pages: "pp. 1 - 1",
              items: [
                { label: String(articlePage.title ?? articlePage.id), current: true },
                ...relatedPages
                  .filter((page) => page.id !== articlePage.id)
                  .slice(0, 5)
                  .map((page) => ({
                    label: String(page.title ?? page.id),
                    href: `/wiki/${String(page.slug ?? "").split("/").map(encodeURIComponent).join("/")}`,
                  })),
              ],
            },
          ]}
          chapterMark={{
            num: "II.",
            subtitle: `${rec._kind} reference`,
            context: id,
            readingTime: atlasReadingTime(String(articlePage.article)),
          }}
          articleTitle={
            <>
              {graph.getDisplayName(rec)} <em>reference</em>
            </>
          }
          lead={atlasLeadFromMarkdown(String(articlePage.article), `Reference article for ${id} and its linked atlas edges.`)}
          meta={
            <>
              <Badge variant="secondary">{rec._kind}</Badge>
              <span>{typeof articlePage.articlePath === "string" ? articlePage.articlePath : articlePage._file}</span>
              <span>Outgoing · {out.length}</span>
              <span>Incoming · {inc.length}</span>
            </>
          }
          marginSections={[
            {
              title: "Article source",
              items: articlePage.id !== rec.id
                ? [
                    <Link
                      key="article-source"
                      href={`/wiki/${String(articlePage.slug ?? "").split("/").map(encodeURIComponent).join("/")}`}
                    >
                      {String(articlePage.title ?? articlePage.id)}
                    </Link>,
                    <p key="article-note" className="atlas-docs-note">This record inherits its article from a related Page node.</p>,
                  ]
                : [<p key="self-article" className="atlas-docs-note">The article body is owned directly by this record.</p>],
            },
            {
              title: "Related pages",
              items: relatedPages.length
                ? relatedPages.slice(0, 8).map((page) => (
                    <Link
                      key={page.id}
                      href={`/wiki/${String(page.slug ?? "").split("/").map(encodeURIComponent).join("/")}`}
                    >
                      {String(page.title ?? page.id)}
                    </Link>
                  ))
                : [<p key="no-pages" className="atlas-docs-note">No related wiki pages for this record.</p>],
            },
            {
              title: "Shortcuts",
              items: [
                <Link key="overview" href={baseTabHref("overview")}>Open overview</Link>,
                <Link key="json" href={baseTabHref("json")}>Open JSON</Link>,
                <Link key="graph" href={baseTabHref("graph")}>Open graph</Link>,
              ],
            },
          ]}
          articleFlow="columns"
        >
          <MarkdownArticle
            markdown={String(articlePage.article)}
            articlePath={typeof articlePage.articlePath === "string" ? articlePage.articlePath : articlePage._file}
            recordsById={index.records}
            variant="docs"
          />
        </AtlasDocsScaffold>
      )}

      {tabActive === "json" && (
        <AtlasDocsScaffold
          runningLeft={<><span className="folio">ii</span><span>Record</span></>}
          runningTitle={<>Agentic AI Atlas · <em>{recordTitle}</em></>}
          runningRight={<><span>{id}</span><span>a5c.ai</span></>}
          tocSearchLabel="Search record views"
          tocBookLabel="Record · tabs"
          tocTitle="Available views"
          chapters={[{ num: "II.", title: "Record views", pages: "pp. 1 - 1", current: true, items: tabItems }]}
          chapterMark={{ num: "II.", subtitle: `${rec._kind} JSON`, context: id, readingTime: "Structured · live" }}
          articleTitle={<>{recordTitle} <em>json</em></>}
          lead="Inspect the normalized record payload exactly as the atlas UI reads it."
          meta={<><span>File · {rec._file}</span><span>Cluster · {rec._cluster}</span></>}
          marginSections={[
            {
              title: "Shortcuts",
              items: [
                <Link key="overview" href={baseTabHref("overview")}>Back to overview</Link>,
                <Link key="graph" href={baseTabHref("graph")}>Open graph tab</Link>,
              ],
            },
          ]}
        >
          <div className="atlas-docs-body">
            <CopyableText
              text={JSON.stringify(
                {
                  id,
                  _kind: rec._kind,
                  _file: rec._file,
                  _cluster: rec._cluster,
                  attributes: Object.fromEntries(
                    Object.entries(rec).filter(([key]) => !key.startsWith("_") && key !== "id")
                  ),
                  outgoingEdges: out,
                  incomingEdges: inc,
                },
                null,
                2
              )}
              copyLabel="Copy JSON"
              languageLabel="Record JSON"
              preClassName="atlas-docs-pre atlas-docs-full"
            />
          </div>
        </AtlasDocsScaffold>
      )}

      {tabActive === "graph" && (
        <AtlasDocsScaffold
          runningLeft={<><span className="folio">ii</span><span>Record</span></>}
          runningTitle={<>Agentic AI Atlas · <em>{recordTitle}</em></>}
          runningRight={<><span>{id}</span><span>a5c.ai</span></>}
          tocSearchLabel="Search record views"
          tocBookLabel="Record · tabs"
          tocTitle="Available views"
          chapters={[{ num: "II.", title: "Record views", pages: "pp. 1 - 1", current: true, items: tabItems }]}
          chapterMark={{ num: "II.", subtitle: `${rec._kind} graph`, context: id, readingTime: "Neighborhood · live" }}
          articleTitle={<>{recordTitle} <em>graph</em></>}
          lead="View the immediate incoming and outgoing neighborhood around this record without leaving the record detail surface."
          meta={<><span>Outgoing · {out.length}</span><span>Incoming · {inc.length}</span></>}
          marginSections={[
            {
              title: "Shortcuts",
              items: [
                <Link key="full-graph" href={`/graph?seed=${encodeURIComponent(id)}`}>Open full graph explorer</Link>,
                <Link key="article" href={hasArticle ? baseTabHref("article") : baseTabHref("overview")}>Open reference article</Link>,
              ],
            },
          ]}
        >
          <div className="atlas-docs-body">
            <div className="atlas-docs-full">
              <MiniGraph
                centerId={id}
                centerKind={rec._kind}
                outgoing={out.map((e) => ({ to: e.to, kind: e.kind, toKind: graph.getRecord(e.to)?._kind }))}
                incoming={inc.map((e) => ({ from: e.from, kind: e.kind, fromKind: graph.getRecord(e.from)?._kind }))}
              />
            </div>
          </div>
        </AtlasDocsScaffold>
      )}
    </>
  );
}
