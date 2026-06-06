import type { PromptContext, PromptStratum, StratumTaggedPart } from './types';
import { PART_STRATA_MAP, STRATUM_ORDER, stratumToCacheControl } from './strata';

export interface PartInspection {
  name: string;
  stratum: PromptStratum;
  volatilityScore: number;
  renderedLength: number;
  cacheHint: string | undefined;
}

export interface StratumSummary {
  stratum: PromptStratum;
  partCount: number;
  totalChars: number;
  estimatedTokens: number;
  cacheHint: string | undefined;
}

export interface InspectionResult {
  sections: PartInspection[];
  summary: {
    totalChars: number;
    estimatedTokens: number;
    perStratum: StratumSummary[];
  };
}

export function inspectPrompt(
  ctx: PromptContext,
  parts?: StratumTaggedPart[],
): InspectionResult {
  const taggedParts = parts ?? Object.values(PART_STRATA_MAP);
  const sections: PartInspection[] = [];

  for (const part of taggedParts) {
    const rendered = part.render(ctx);
    if (rendered.length === 0) continue;
    sections.push({
      name: part.name,
      stratum: part.stratum,
      volatilityScore: part.volatilityScore ?? 50,
      renderedLength: rendered.length,
      cacheHint: stratumToCacheControl(part.stratum),
    });
  }

  const perStratum: StratumSummary[] = [];
  for (const stratum of STRATUM_ORDER) {
    const stratumSections = sections.filter(s => s.stratum === stratum);
    if (stratumSections.length === 0) continue;
    const totalChars = stratumSections.reduce((sum, s) => sum + s.renderedLength, 0);
    perStratum.push({
      stratum,
      partCount: stratumSections.length,
      totalChars,
      estimatedTokens: Math.ceil(totalChars / 4),
      cacheHint: stratumToCacheControl(stratum),
    });
  }

  const totalChars = sections.reduce((sum, s) => sum + s.renderedLength, 0);

  return {
    sections,
    summary: {
      totalChars,
      estimatedTokens: Math.ceil(totalChars / 4),
      perStratum,
    },
  };
}
