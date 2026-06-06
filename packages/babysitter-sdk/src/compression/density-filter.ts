/**
 * density-filter — sentence-level compression with FNV-1a deduplication.
 *
 * Used for user-prompt compression (userPromptHook) and sdk-context
 * compression (sdkContextHook) where no query context is available.
 * Selects sentences by length-based score within a token budget.
 */

const BOILERPLATE = [
  'copyright', 'all rights reserved', 'disclaimer',
  'terms of use', 'privacy policy', 'proprietary',
  'confidential', 'trademark',
];

export function estimateTokens(text: string): number {
  return (text.match(/[\p{L}\p{N}]+|[^\s]/gu) ?? []).length;
}

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n' || ch === '.' || ch === '!' || ch === '?') {
      if (ch !== '\n') cur += ch;
      const t = cur.trim();
      if (t) out.push(t);
      cur = '';
    } else {
      cur += ch;
    }
  }
  const t = cur.trim();
  if (t) out.push(t);
  return out;
}

function fnv1a(s: string): bigint {
  let h = 14695981039346656037n;
  for (let i = 0; i < s.length; i++) {
    h = BigInt.asUintN(64, (h ^ BigInt(s.charCodeAt(i))) * 1099511628211n);
  }
  return h;
}

/**
 * Density-filter text to the target token budget.
 *
 * Scores sentences by length (longer = higher score, capped at 40 tokens).
 * Deduplicates by FNV-1a hash. Reconstructs in original document order.
 *
 * @param text            Input text to compress.
 * @param targetReduction Fraction to remove (0–1). E.g. 0.22 removes ~22%.
 * @returns Compressed text, or original if nothing could be filtered.
 */
export function densityFilterText(text: string, targetReduction: number): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text;

  const totalTokens = estimateTokens(text);
  const tokenBudget = Math.max(80, Math.round(totalTokens * (1 - targetReduction)));

  const seen = new Set<bigint>();
  const features: Array<{ index: number; tokenCount: number; score: number }> = [];
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const h = fnv1a(s.toLowerCase().replace(/\s+/g, ' ').trim());
    if (seen.has(h)) continue;
    seen.add(h);
    const tc = estimateTokens(s);
    const isBoilerplate = BOILERPLATE.some(p => s.toLowerCase().includes(p));
    features.push({ index: i, tokenCount: tc, score: Math.min(tc, 40) / 40 - (isBoilerplate ? 0.5 : 0) });
  }

  const sorted = [...features].sort((a, b) => b.score - a.score);
  const kept: number[] = [];
  let used = 0;
  for (const f of sorted) {
    if (kept.length >= 500) break;
    if (used + f.tokenCount <= tokenBudget) {
      kept.push(f.index);
      used += f.tokenCount;
    }
  }

  if (kept.length === 0) return text;

  kept.sort((a, b) => a - b);
  return kept.map(i => sentences[i]).join(' ');
}
