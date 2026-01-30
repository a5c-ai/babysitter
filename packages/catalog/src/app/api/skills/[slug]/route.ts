/**
 * Skill Detail API Route
 * GET /api/skills/[slug] - Get single skill by name
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
import type { SkillDetail } from '@/lib/api/types';

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

    // Find skill by name
    const sql = `
      SELECT
        sk.id,
        sk.name,
        sk.description,
        sk.file_path,
        sk.directory,
        sk.allowed_tools,
        sk.content,
        sk.frontmatter,
        sk.specialization_id,
        s.name as specialization_name,
        sk.domain_id,
        d.name as domain_name,
        sk.created_at,
        sk.updated_at
      FROM skills sk
      LEFT JOIN specializations s ON sk.specialization_id = s.id
      LEFT JOIN domains d ON sk.domain_id = d.id
      WHERE sk.name = ?
    `;

    const row = rawDb.prepare(sql).get(slug) as {
      id: number;
      name: string;
      description: string;
      file_path: string;
      directory: string;
      allowed_tools: string;
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
      return notFoundResponse('Skill', slug);
    }

    // Transform to API response format
    const skill: SkillDetail = {
      id: row.id,
      name: row.name,
      description: row.description,
      filePath: row.file_path,
      directory: row.directory,
      specializationId: row.specialization_id,
      specializationName: row.specialization_name,
      domainId: row.domain_id,
      domainName: row.domain_name,
      allowedTools: safeJsonParse<string[]>(row.allowed_tools, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      content: row.content,
      frontmatter: safeJsonParse<Record<string, unknown>>(row.frontmatter, {}),
    };

    return createSuccessResponse(skill);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
