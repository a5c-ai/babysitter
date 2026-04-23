export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export function parseSearchResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];
  const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetPattern = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const urls: string[] = [];
  const titles: string[] = [];
  const snippets: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = resultPattern.exec(html)) !== null) {
    try {
      const rawUrl = match[1].replace(/.*uddg=/, "").split("&")[0] ?? match[1];
      urls.push(decodeURIComponent(rawUrl));
    } catch {
      urls.push(match[1]);
    }
    titles.push(stripHtmlTags(match[2]).trim());
  }

  while ((match = snippetPattern.exec(html)) !== null) {
    snippets.push(stripHtmlTags(match[1]).trim());
  }

  for (let index = 0; index < Math.min(urls.length, maxResults); index += 1) {
    results.push({
      title: titles[index] ?? "",
      url: urls[index] ?? "",
      snippet: snippets[index] ?? "",
    });
  }

  return results;
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&copy;/g, "\u00A9")
    .replace(/&#(\d+);/g, (_match: string, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}
