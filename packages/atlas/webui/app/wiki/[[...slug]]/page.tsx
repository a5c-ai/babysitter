import Link from "next/link";
import { notFound } from "next/navigation";
import { getOutgoing, getPageBySlug, getRecord } from "@a5c-ai/atlas";
import {
  AtlasDocsScaffold,
  atlasLeadFromMarkdown,
  atlasReadingTime,
} from "@/components/AtlasDocsScaffold";
import { MarkdownArticle } from "@/components/MarkdownArticle";
import { Badge } from "@/components/ui/badge";

export const dynamicParams = true;

type Params = { slug?: string[] };

export default async function WikiPage({ params }: { params: Promise<Params> }) {
  const { slug: parts = [] } = await params;
  const slug = parts.length ? parts.join("/") : "index";
  const page = getPageBySlug(slug);
  if (!page) notFound();

  const article = typeof page.article === "string" ? page.article : "";
  const documented = getOutgoing(page.id).filter((edge) => edge.kind === "documents");
  const pageTitle = String(page.title ?? page.id);
  const pagePath = typeof page.articlePath === "string" ? page.articlePath : page._file;
  const tocItems = documented.slice(0, 5).map((edge) => {
    const target = getRecord(edge.to);
    return {
      label: target ? `${String(target.displayName ?? edge.to)} · ${target._kind}` : edge.to,
      href: `/n/${encodeURIComponent(edge.to)}`,
    };
  });

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
      tocBookLabel="Wiki · linked records"
      tocTitle="Article and documented nodes"
      chapters={[
        {
          num: "I.",
          title: "Current article",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: pageTitle, current: true },
            ...tocItems,
          ],
        },
      ]}
      chapterMark={{
        num: "I.",
        subtitle: "Wiki article",
        context: slug,
        readingTime: atlasReadingTime(article),
      }}
      articleTitle={
        <>
          {pageTitle} <em>reference</em>
        </>
      }
      lead={atlasLeadFromMarkdown(article, "Reference writing for this atlas page and the graph records it documents.")}
      meta={
        <>
          <Badge variant="secondary">Page node</Badge>
          <span>{pagePath}</span>
          <span>Documents · {documented.length}</span>
        </>
      }
      marginSections={[
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
                const target = getRecord(edge.to);
                return (
                  <Link key={edge.to} href={`/n/${encodeURIComponent(edge.to)}`}>
                    {target ? `${String(target.displayName ?? edge.to)} · ${target._kind}` : edge.to}
                  </Link>
                );
              })
            : [<p key="no-docs" className="atlas-docs-note">No documented graph nodes on this page.</p>],
        },
      ]}
      articleFlow="columns"
    >
      <MarkdownArticle markdown={article} articlePath={pagePath} variant="docs" />
    </AtlasDocsScaffold>
  );
}
