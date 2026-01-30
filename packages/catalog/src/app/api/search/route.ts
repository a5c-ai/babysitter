/**
 * Search API Route
 * GET /api/search - Full-text search across all entities
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import { CatalogQueries } from '@/lib/db/queries';
import type { CatalogEntryType } from '@/lib/db/types';
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
    let types: CatalogEntryType[] = ['agent', 'skill', 'process'];
    if (typeParam) {
      const validTypes: CatalogEntryType[] = ['agent', 'skill', 'process', 'domain', 'specialization'];
      if (validTypes.includes(typeParam as CatalogEntryType)) {
        types = [typeParam as CatalogEntryType];
      }
    }

    // Initialize database and run search
    const db = initializeDatabase();
    const queries = new CatalogQueries(db);

    // Perform search with pagination
    // Note: The CatalogQueries.search doesn't support offset directly,
    // so we fetch more and slice
    const allResults = queries.search(query, {
      limit: limit + offset,
      types
    });

    // Apply offset
    const paginatedResults = allResults.slice(offset, offset + limit);
    const total = allResults.length;

    // Transform to API response format
    const results: SearchResultItem[] = paginatedResults.map(result => ({
      type: result.type,
      id: result.id,
      name: result.name,
      description: result.description,
      path: result.path,
      score: result.score,
      highlights: result.highlights,
    }));

    return createPaginatedResponse(results, total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
