import Link from "next/link";
import path from "node:path";
import { getRecord } from "@a5c-ai/atlas";

function resolveHref(href: string, articlePath?: string): { href: string; internal: boolean } {
  if (!href) return { href, internal: false };
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return { href, internal: false };
  }
  if (href.startsWith("#")) {
    return { href, internal: false };
  }

  const directRecord = getRecord(href);
  if (directRecord) {
    return { href: `/n/${encodeURIComponent(href)}`, internal: true };
  }

  const normalized = href.replace(/\\/g, "/");
  const wikiPath = normalized.startsWith("wiki/")
    ? normalized
    : normalized.endsWith(".md") && articlePath
      ? path.posix.normalize(path.posix.join(path.posix.dirname(articlePath.replace(/\\/g, "/")), normalized))
      : normalized;

  if (wikiPath.startsWith("wiki/") && wikiPath.endsWith(".md")) {
    const slug = wikiPath.replace(/^wiki\//, "").replace(/\/README\.md$/i, "").replace(/\.md$/i, "");
    return { href: `/wiki/${slug.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`, internal: true };
  }

  return { href, internal: false };
}

function inlineParts(text: string, articlePath?: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<code key={parts.length} className="rounded px-1 py-0.5 font-mono text-[0.9em]" style={{ background: 'var(--bg-2)' }}>{match[1]}</code>);
    else if (match[2] && match[3]) {
      const resolved = resolveHref(match[3], articlePath);
      if (resolved.internal) {
        parts.push(
          <Link key={parts.length} href={resolved.href} className="underline underline-offset-2" style={{ color: 'var(--brass)' }}>
            {match[2]}
          </Link>,
        );
      } else {
        parts.push(
          <a
            key={parts.length}
            href={resolved.href}
            className="underline underline-offset-2"
            style={{ color: 'var(--brass)' }}
            target={resolved.href.startsWith("#") ? undefined : "_blank"}
            rel={resolved.href.startsWith("#") ? undefined : "noreferrer"}
          >
            {match[2]}
          </a>,
        );
      }
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const cells = trimmed.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function MarkdownArticle({ markdown, articlePath }: { markdown: string; articlePath?: string }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={blocks.length} className="leading-7 text-sm" style={{ color: 'var(--fg)' }}>{inlineParts(paragraph.join(" "), articlePath)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={blocks.length} className="list-disc pl-6 space-y-1 text-sm" style={{ color: 'var(--fg)' }}>
        {list.map((item, index) => <li key={index}>{inlineParts(item, articlePath)}</li>)}
      </ul>,
    );
    list = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(
      <blockquote key={blocks.length} className="pl-4 italic text-sm space-y-2" style={{ borderLeft: '4px solid var(--edge-fade)', color: 'var(--fg-2)' }}>
        {quote.map((item, index) => (
          <p key={index}>{inlineParts(item, articlePath)}</p>
        ))}
      </blockquote>,
    );
    quote = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("```")) {
      if (code) {
        blocks.push(<pre key={blocks.length} className="overflow-x-auto rounded-md p-3 text-xs" style={{ background: 'var(--ground-ink)', border: '1px solid var(--rule)', color: 'var(--glyph-bone)' }}><code>{code.join("\n")}</code></pre>);
        code = null;
      } else {
        flushParagraph();
        flushList();
        flushQuote();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      flushParagraph();
      flushList();
      flushQuote();
      const header = parseTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length) {
        const tableLine = lines[index];
        if (!tableLine.trim() || !tableLine.includes("|")) {
          index -= 1;
          break;
        }
        rows.push(parseTableRow(tableLine));
        index += 1;
      }
      blocks.push(
        <div key={blocks.length} className="overflow-x-auto rounded-md" style={{ border: '1px solid var(--rule)' }}>
          <table className="min-w-full text-sm">
            <thead className="text-left" style={{ background: 'var(--bg-2)' }}>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex} className="px-3 py-2 font-medium" style={{ color: 'var(--fg-2)' }}>
                    {inlineParts(cell, articlePath)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderTop: '1px solid var(--rule)' }}>
                  {header.map((_, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top" style={{ color: 'var(--fg)' }}>
                      {inlineParts(row[cellIndex] ?? "", articlePath)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1) blocks.push(<h1 key={blocks.length} className="text-3xl font-semibold tracking-tight">{text}</h1>);
      else if (level === 2) blocks.push(<h2 key={blocks.length} className="mt-8 text-xl font-semibold tracking-tight">{text}</h2>);
      else if (level === 3) blocks.push(<h3 key={blocks.length} className="mt-6 text-base font-semibold">{text}</h3>);
      else blocks.push(<h4 key={blocks.length} className="mt-4 text-sm font-semibold">{text}</h4>);
      continue;
    }
    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }
    const item = /^[-*]\s+(.+)$/.exec(line);
    if (item) {
      flushParagraph();
      flushQuote();
      list.push(item[1]);
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  flushQuote();

  return <article className="space-y-4">{blocks}</article>;
}
