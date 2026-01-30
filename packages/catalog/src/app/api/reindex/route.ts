/**
 * Reindex API Route
 * POST /api/reindex - Trigger database rebuild/reindex
 */

import { NextRequest } from 'next/server';
// path module unused - baseDir computed from cwd
import { runFullIndex, runIncrementalIndex } from '@/lib/db/indexer';
import {
  createSuccessResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { ReindexResponse } from '@/lib/api/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let force = false;
    try {
      const body = await request.json();
      force = body?.force === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Determine base directory (project root)
    // In Next.js, process.cwd() gives us the project root
    const baseDir = process.cwd();

    // Run indexer
    const result = force
      ? await runFullIndex(baseDir)
      : await runIncrementalIndex(baseDir);

    // Transform to API response
    const response: ReindexResponse = {
      success: result.success,
      statistics: result.statistics,
      errors: result.errors,
    };

    return createSuccessResponse(response, undefined, result.success ? 200 : 500);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

// Also support GET for simple trigger (useful for testing)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    const baseDir = process.cwd();

    const result = force
      ? await runFullIndex(baseDir)
      : await runIncrementalIndex(baseDir);

    const response: ReindexResponse = {
      success: result.success,
      statistics: result.statistics,
      errors: result.errors,
    };

    return createSuccessResponse(response, undefined, result.success ? 200 : 500);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
