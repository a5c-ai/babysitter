import Link from "next/link";
import { notFound } from "next/navigation";
import { getOutgoing, getPageBySlug, getRecord } from "@a5c-ai/atlas";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wiki", href: "/wiki" }, { label: String(page.title ?? page.id) }]} />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--fg-3)' }}>
          <Badge variant="secondary">Page</Badge>
          <Link href={`/n/${encodeURIComponent(page.id)}`} className="font-mono hover:underline">{page.id}</Link>
          <span>{String(page.articlePath ?? page._file)}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>{String(page.title ?? page.id)}</h1>
      </div>

      {documented.length > 0 && (
        <section className="rounded-md p-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)' }}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>Documents Graph Nodes</h2>
          <div className="flex flex-wrap gap-2">
            {documented.map((edge) => {
              const target = getRecord(edge.to);
              return (
                <Link
                  key={`${edge.kind}-${edge.to}`}
                  href={`/n/${encodeURIComponent(edge.to)}`}
                  className="rounded px-2 py-1 text-xs cpd-hover transition-colors"
                  style={{ background: 'var(--bg)', border: '1px solid var(--rule)' }}
                >
                  <span className="font-mono">{edge.to}</span>
                  {target ? <span className="ml-2" style={{ color: 'var(--fg-3)' }}>{target._kind}</span> : null}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <MarkdownArticle
        markdown={article}
        articlePath={typeof page.articlePath === "string" ? page.articlePath : page._file}
      />
    </div>
  );
}
