/**
 * Process Detail API Route
 * GET /api/processes/[id] - Get single process by ID
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import { CatalogQueries } from '@/lib/db/queries';
import {
  validateId,
  createSuccessResponse,
  notFoundResponse,
  internalErrorResponse,
  safeJsonParse,
} from '@/lib/api/utils';
import type { ProcessDetail, ProcessIO, ProcessTask } from '@/lib/api/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;

    // Validate ID parameter
    const validation = validateId(params.id);
    if (!validation.valid) {
      return validation.error;
    }
    const processId = validation.id;

    // Initialize database and fetch process
    const db = initializeDatabase();
    const queries = new CatalogQueries(db);

    const row = queries.getProcessById(processId);
    if (!row) {
      return notFoundResponse('Process', processId);
    }

    // Parse JSON fields
    const inputs = safeJsonParse<ProcessIO[]>(row.inputs, []);
    const outputs = safeJsonParse<ProcessIO[]>(row.outputs, []);
    const tasks = safeJsonParse<ProcessTask[]>(row.tasks, []);
    const frontmatter = safeJsonParse<Record<string, unknown>>(row.frontmatter, {});

    // Transform to API response format
    const process: ProcessDetail = {
      id: row.id,
      processId: row.process_id,
      description: row.description,
      category: row.category,
      filePath: row.file_path,
      taskCount: tasks.length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      inputs,
      outputs,
      tasks,
      frontmatter,
    };

    return createSuccessResponse(process);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
