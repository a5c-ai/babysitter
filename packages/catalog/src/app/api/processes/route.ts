/**
 * Processes API Route
 * GET /api/processes - List processes with filtering
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import { QueryBuilder } from '@/lib/db/queries';
import type { ProcessRow } from '@/lib/db/types';
import {
  parseListQueryParams,
  createPaginatedResponse,
  internalErrorResponse,
  safeJsonParse,
  mapSortField,
} from '@/lib/api/utils';
import type { ProcessListItem } from '@/lib/api/types';

// Allowed sort fields mapping
const SORT_FIELDS: Record<string, string> = {
  id: 'process_id',
  processId: 'process_id',
  category: 'category',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const { limit = 20, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const category = searchParams.get('category');

    // Initialize database
    const db = initializeDatabase();
    const builder = new QueryBuilder<ProcessRow>(db.getDb(), 'processes');

    // Apply category filter
    if (category) {
      builder.where('category', 'eq', category);
    }

    // Apply sorting
    const sortField = mapSortField(sort, SORT_FIELDS, 'process_id');
    builder.orderBy(sortField, order || 'asc');

    // Get total count
    const total = builder.count();

    // Apply pagination
    builder.limit(limit).offset(offset);

    // Execute query
    const rows = builder.all();

    // Transform to API response format
    const processes: ProcessListItem[] = rows.map(row => {
      const tasks = safeJsonParse<unknown[]>(row.tasks, []);
      return {
        id: row.id,
        processId: row.process_id,
        description: row.description,
        category: row.category,
        filePath: row.file_path,
        taskCount: tasks.length,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return createPaginatedResponse(processes, total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
