import { describe, it, expect } from "vitest";
import {
  stripHtmlTags,
  extractTextFromHtml,
  filterByRelevance,
  parseSearchResults,
} from "../agenticTools";

describe("GAP-TOOLS-008: stripHtmlTags", () => {
  it("removes HTML tags", () => {
    expect(stripHtmlTags("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("decodes common named entities", () => {
    expect(stripHtmlTags("A &amp; B &lt; C &gt; D")).toBe("A & B < C > D");
    expect(stripHtmlTags("&quot;quoted&quot;")).toBe('"quoted"');
    expect(stripHtmlTags("it&#39;s")).toBe("it's");
    expect(stripHtmlTags("&nbsp;space")).toBe(" space");
  });

  it("decodes mdash, ndash, hellip, copy", () => {
    expect(stripHtmlTags("a&mdash;b")).toBe("a\u2014b");
    expect(stripHtmlTags("1&ndash;2")).toBe("1\u20132");
    expect(stripHtmlTags("wait&hellip;")).toBe("wait\u2026");
    expect(stripHtmlTags("&copy; 2026")).toBe("\u00A9 2026");
  });

  it("decodes numeric entities", () => {
    expect(stripHtmlTags("&#8212;")).toBe("\u2014"); // em dash
    expect(stripHtmlTags("&#65;")).toBe("A");
  });

  it("decodes hex entities", () => {
    expect(stripHtmlTags("&#x41;")).toBe("A");
    expect(stripHtmlTags("&#x2014;")).toBe("\u2014");
  });

  it("handles empty string", () => {
    expect(stripHtmlTags("")).toBe("");
  });
});

describe("GAP-TOOLS-037: extractTextFromHtml", () => {
  it("strips scripts, styles, nav, footer, header, aside", () => {
    const html = `
      <header>Site Header</header>
      <nav>Navigation</nav>
      <main><p>Content here</p></main>
      <aside>Sidebar</aside>
      <footer>Footer</footer>
      <script>alert("x")</script>
      <style>.a{color:red}</style>
    `;
    const result = extractTextFromHtml(html, "text");
    expect(result).not.toContain("Site Header");
    expect(result).not.toContain("Navigation");
    expect(result).not.toContain("Sidebar");
    expect(result).not.toContain("Footer");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("color:red");
    expect(result).toContain("Content here");
  });

  it("converts headings to markdown", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2><p>Text</p>";
    const result = extractTextFromHtml(html, "markdown");
    expect(result).toContain("# Title");
    expect(result).toContain("## Subtitle");
    expect(result).toContain("Text");
  });

  it("converts list items to markdown", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const result = extractTextFromHtml(html, "markdown");
    expect(result).toContain("- Item 1");
    expect(result).toContain("- Item 2");
  });

  it("converts code blocks to markdown", () => {
    const html = "<pre>const x = 1;</pre>";
    const result = extractTextFromHtml(html, "markdown");
    expect(result).toContain("```");
    expect(result).toContain("const x = 1;");
  });

  it("text format strips all tags", () => {
    const html = "<div><p>Hello <em>world</em></p></div>";
    const result = extractTextFromHtml(html, "text");
    expect(result).toBe("Hello world");
  });
});

describe("GAP-TOOLS-037: filterByRelevance", () => {
  const content = "Introduction paragraph.\n\nReact hooks are powerful.\n\nVue composition API.\n\nConclusion paragraph.";

  it("filters paragraphs by matching terms", () => {
    const result = filterByRelevance(content, "React hooks");
    expect(result).toContain("React hooks are powerful");
    expect(result).not.toContain("Vue composition");
  });

  it("returns original content when no terms match", () => {
    const result = filterByRelevance(content, "xyznonexistent");
    expect(result).toBe(content);
  });

  it("returns original content when prompt is empty", () => {
    const result = filterByRelevance(content, "");
    expect(result).toBe(content);
  });

  it("matches short terms (2+ chars)", () => {
    const result = filterByRelevance("Go is great.\n\nPython too.", "Go");
    expect(result).toContain("Go is great");
  });

  it("does not keep first/last paragraph automatically", () => {
    const result = filterByRelevance(content, "Vue");
    expect(result).not.toContain("Introduction");
    expect(result).not.toContain("Conclusion");
    expect(result).toContain("Vue composition");
  });
});

describe("GAP-TOOLS-008: parseSearchResults", () => {
  it("parses DuckDuckGo-style HTML", () => {
    const html = `
      <a class="result__a" href="https://example.com">Example Title</a>
      <a class="result__snippet">This is a snippet about example</a>
      <a class="result__a" href="https://other.com">Other Page</a>
      <a class="result__snippet">Another snippet</a>
    `;
    const results = parseSearchResults(html, 10);
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Example Title");
    expect(results[0].snippet).toContain("snippet about example");
  });

  it("respects maxResults", () => {
    const html = `
      <a class="result__a" href="https://a.com">A</a>
      <a class="result__snippet">Snippet A</a>
      <a class="result__a" href="https://b.com">B</a>
      <a class="result__snippet">Snippet B</a>
      <a class="result__a" href="https://c.com">C</a>
      <a class="result__snippet">Snippet C</a>
    `;
    const results = parseSearchResults(html, 2);
    expect(results).toHaveLength(2);
  });

  it("returns empty for non-matching HTML", () => {
    const results = parseSearchResults("<html><body>no results</body></html>", 10);
    expect(results).toEqual([]);
  });

  it("strips HTML from titles", () => {
    const html = `<a class="result__a" href="https://x.com"><b>Bold</b> Title</a><a class="result__snippet">snippet</a>`;
    const results = parseSearchResults(html, 10);
    expect(results[0].title).toBe("Bold Title");
  });
});
