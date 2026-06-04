import { stripHtmlTags } from "./searchHelpers";

export function extractTextFromHtml(html: string, format: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  if (format === "markdown") {
    cleaned = cleaned.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m: string, level: string, content: string) => {
      return `\n${"#".repeat(Number(level))} ${stripHtmlTags(content).trim()}\n`;
    });
    cleaned = cleaned.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m: string, content: string) => {
      return `\n${stripHtmlTags(content).trim()}\n`;
    });
    cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m: string, content: string) => {
      return `- ${stripHtmlTags(content).trim()}\n`;
    });
    cleaned = cleaned.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m: string, content: string) => {
      return `\n\`\`\`\n${stripHtmlTags(content).trim()}\n\`\`\`\n`;
    });
    cleaned = cleaned.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m: string, content: string) => {
      return `\`${stripHtmlTags(content).trim()}\``;
    });
    cleaned = stripHtmlTags(cleaned);
  } else {
    cleaned = stripHtmlTags(cleaned);
  }

  return cleaned.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

export function filterByRelevance(content: string, prompt: string): string {
  const terms = prompt.toLowerCase().split(/\s+/).filter((term) => term.length > 1);
  if (terms.length === 0) {
    return content;
  }

  const relevant = content
    .split(/\n\n+/)
    .map((paragraph) => {
      const lower = paragraph.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
      return { text: paragraph, score };
    })
    .filter((entry) => entry.score > 0);

  if (relevant.length === 0) {
    return content;
  }

  return relevant.map((entry) => entry.text).join("\n\n");
}
