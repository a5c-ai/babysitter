/**
 * Agent Detail API Route
 * GET /api/agents/[slug] - Get single agent by name
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import {
  validateSlug,
  createSuccessResponse,
  notFoundResponse,
  internalErrorResponse,
  safeJsonParse,
} from '@/lib/api/utils';
import type { AgentDetail } from '@/lib/api/types';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;

    // Validate slug parameter
    const validation = validateSlug(params.slug);
    if (!validation.valid) {
      return validation.error;
    }
    const slug = validation.slug;

    // Initialize database
    const db = initializeDatabase();
    const rawDb = db.getDb();

    // Find agent by name
    const sql = `
      SELECT
        a.id,
        a.name,
        a.description,
        a.file_path,
        a.directory,
        a.role,
        a.expertise,
        a.content,
        a.frontmatter,
        a.specialization_id,
        s.name as specialization_name,
        a.domain_id,
        d.name as domain_name,
        a.created_at,
        a.updated_at
      FROM agents a
      LEFT JOIN specializations s ON a.specialization_id = s.id
      LEFT JOIN domains d ON a.domain_id = d.id
      WHERE a.name = ?
    `;

    const row = rawDb.prepare(sql).get(slug) as {
      id: number;
      name: string;
      description: string;
      file_path: string;
      directory: string;
      role: string | null;
      expertise: string;
      content: string;
      frontmatter: string;
      specialization_id: number | null;
      specialization_name: string | null;
      domain_id: number | null;
      domain_name: string | null;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) {
      return notFoundResponse('Agent', slug);
    }

    // Transform to API response format
    const agent: AgentDetail = {
      id: row.id,
      name: row.name,
      description: row.description,
      filePath: row.file_path,
      directory: row.directory,
      role: row.role,
      expertise: safeJsonParse<string[]>(row.expertise, []),
      specializationId: row.specialization_id,
      specializationName: row.specialization_name,
      domainId: row.domain_id,
      domainName: row.domain_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      content: row.content,
      frontmatter: safeJsonParse<Record<string, unknown>>(row.frontmatter, {}),
    };

    return createSuccessResponse(agent);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
