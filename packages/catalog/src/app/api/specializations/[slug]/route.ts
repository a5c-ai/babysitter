/**
 * Specialization Detail API Route
 * GET /api/specializations/[slug] - Get single specialization with its skills and agents
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import {
  validateSlug,
  createSuccessResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { SpecializationDetail, AgentSummary, SkillSummary } from '@/lib/api/types';

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

    // Find specialization by name
    const specSql = `
      SELECT
        s.id,
        s.name,
        s.path,
        s.domain_id,
        d.name as domain_name,
        s.readme_path,
        s.references_path,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM agents a WHERE a.specialization_id = s.id) as agent_count,
        (SELECT COUNT(*) FROM skills sk WHERE sk.specialization_id = s.id) as skill_count
      FROM specializations s
      LEFT JOIN domains d ON s.domain_id = d.id
      WHERE s.name = ?
    `;

    const specRow = rawDb.prepare(specSql).get(slug) as {
      id: number;
      name: string;
      path: string;
      domain_id: number | null;
      domain_name: string | null;
      readme_path: string | null;
      references_path: string | null;
      created_at: string;
      updated_at: string;
      agent_count: number;
      skill_count: number;
    } | undefined;

    if (!specRow) {
      return notFoundResponse('Specialization', slug);
    }

    // Fetch agents for this specialization
    const agentsSql = `
      SELECT id, name, description, role
      FROM agents
      WHERE specialization_id = ?
      ORDER BY name ASC
    `;

    const agentRows = rawDb.prepare(agentsSql).all(specRow.id) as Array<{
      id: number;
      name: string;
      description: string;
      role: string | null;
    }>;

    // Fetch skills for this specialization
    const skillsSql = `
      SELECT id, name, description
      FROM skills
      WHERE specialization_id = ?
      ORDER BY name ASC
    `;

    const skillRows = rawDb.prepare(skillsSql).all(specRow.id) as Array<{
      id: number;
      name: string;
      description: string;
    }>;

    // Transform agents
    const agents: AgentSummary[] = agentRows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      role: row.role,
    }));

    // Transform skills
    const skills: SkillSummary[] = skillRows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
    }));

    // Transform to API response format
    const specialization: SpecializationDetail = {
      id: specRow.id,
      name: specRow.name,
      path: specRow.path,
      domainId: specRow.domain_id,
      domainName: specRow.domain_name,
      agentCount: specRow.agent_count,
      skillCount: specRow.skill_count,
      createdAt: specRow.created_at,
      updatedAt: specRow.updated_at,
      readmePath: specRow.readme_path,
      referencesPath: specRow.references_path,
      agents,
      skills,
    };

    return createSuccessResponse(specialization);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
