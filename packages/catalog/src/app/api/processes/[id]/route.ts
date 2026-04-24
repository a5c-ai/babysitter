/**
 * Process Detail API Route
 * GET /api/processes/[id] - Get single process by ID
 */

import { getCatalogProcessById } from '@a5c-ai/agent-catalog';
import { NextRequest } from 'next/server';
import {
  validateId,
  createSuccessResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { ProcessDetail } from '@/lib/api/types';

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

    const process = getCatalogProcessById(processId);
    if (!process) {
      return notFoundResponse('Process', processId);
    }

    const response: ProcessDetail = {
      id: process.id,
      processId: process.processId,
      description: process.description,
      category: process.category,
      filePath: process.filePath,
      taskCount: process.tasks.length,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
      inputs: process.inputs,
      outputs: process.outputs,
      tasks: process.tasks.map((task) => ({ ...task })),
      frontmatter: process.frontmatter,
    };

    return createSuccessResponse(response);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
