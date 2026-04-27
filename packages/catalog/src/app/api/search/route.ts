/**
 * Search API Route
 * GET /api/search - Full-text search across all entities
 */

import { searchCatalogDiscovery, type CatalogDiscoverySearchType } from '@a5c-ai/agent-catalog';
import { NextRequest } from 'next/server';
import {
  parseListQueryParams,
  requireQueryParam,
  createPaginatedResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { SearchResultItem } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate required 'q' parameter
    const qResult = requireQueryParam(searchParams, 'q');
    if ('error' in qResult) {
      return qResult.error;
    }
    const query = qResult.value;

    // Parse optional parameters
    const { limit = 20, offset = 0 } = parseListQueryParams(searchParams);
    const typeParam = searchParams.get('type');

    // Parse type filter
    let types: CatalogDiscoverySearchType[] = ['agent', 'skill', 'process'];
    if (typeParam) {
      const validTypes: CatalogDiscoverySearchType[] = ['agent', 'skill', 'process', 'domain', 'specialization'];
      if (validTypes.includes(typeParam as CatalogDiscoverySearchType)) {
        types = [typeParam as CatalogDiscoverySearchType];
      }
    }

    const allResults = searchCatalogDiscovery(query, types);
    const results: SearchResultItem[] = allResults.slice(offset, offset + limit).map(result => ({
      type: result.type,
      id: result.id,
      name: result.name,
      description: result.description,
      path: result.path,
      slug: result.slug,
      score: result.score,
    }));

    return createPaginatedResponse(results, allResults.length, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
