/**
 * Domain Detail API Route
 * GET /api/domains/[slug] - Get single domain with its specializations
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import {
  validateSlug,
  createSuccessResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { DomainDetail, SpecializationSummary } from '@/lib/api/types';

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

    // Try to find domain by name (slug is the domain name)
    const domainSql = `
      SELECT
        d.id,
        d.name,
        d.path,
        d.category,
        d.readme_path,
        d.references_path,
        d.created_at,
        d.updated_at,
        (SELECT COUNT(*) FROM specializations s WHERE s.domain_id = d.id) as specialization_count,
        (SELECT COUNT(*) FROM agents a WHERE a.domain_id = d.id) as agent_count,
        (SELECT COUNT(*) FROM skills sk WHERE sk.domain_id = d.id) as skill_count
      FROM domains d
      WHERE d.name = ?
    `;

    const domainRow = rawDb.prepare(domainSql).get(slug) as {
      id: number;
      name: string;
      path: string;
      category: string | null;
      readme_path: string | null;
      references_path: string | null;
      created_at: string;
      updated_at: string;
      specialization_count: number;
      agent_count: number;
      skill_count: number;
    } | undefined;

    if (!domainRow) {
      return notFoundResponse('Domain', slug);
    }

    // Fetch specializations for this domain
    const specsSql = `
      SELECT
        s.id,
        s.name,
        s.path,
        (SELECT COUNT(*) FROM agents a WHERE a.specialization_id = s.id) as agent_count,
        (SELECT COUNT(*) FROM skills sk WHERE sk.specialization_id = s.id) as skill_count
      FROM specializations s
      WHERE s.domain_id = ?
      ORDER BY s.name ASC
    `;

    const specRows = rawDb.prepare(specsSql).all(domainRow.id) as Array<{
      id: number;
      name: string;
      path: string;
      agent_count: number;
      skill_count: number;
    }>;

    // Transform specializations
    const specializations: SpecializationSummary[] = specRows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      agentCount: row.agent_count,
      skillCount: row.skill_count,
    }));

    // Transform to API response format
    const domain: DomainDetail = {
      id: domainRow.id,
      name: domainRow.name,
      path: domainRow.path,
      category: domainRow.category,
      specializationCount: domainRow.specialization_count,
      agentCount: domainRow.agent_count,
      skillCount: domainRow.skill_count,
      createdAt: domainRow.created_at,
      updatedAt: domainRow.updated_at,
      readmePath: domainRow.readme_path,
      referencesPath: domainRow.references_path,
      specializations,
    };

    return createSuccessResponse(domain);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
