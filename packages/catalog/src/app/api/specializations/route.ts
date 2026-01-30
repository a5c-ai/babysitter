/**
 * Specializations API Route
 * GET /api/specializations - List specializations with optional domain filter
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import {
  parseListQueryParams,
  createPaginatedResponse,
  internalErrorResponse,
  mapSortField,
} from '@/lib/api/utils';
import type { SpecializationListItem } from '@/lib/api/types';

// Allowed sort fields mapping
const SORT_FIELDS: Record<string, string> = {
  name: 's.name',
  domain: 'd.name',
  createdAt: 's.created_at',
  updatedAt: 's.updated_at',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const { limit = 50, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const domain = searchParams.get('domain');

    // Initialize database
    const db = initializeDatabase();
    const rawDb = db.getDb();

    // Build query with counts
    let sql = `
      SELECT
        s.id,
        s.name,
        s.path,
        s.domain_id,
        d.name as domain_name,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM agents a WHERE a.specialization_id = s.id) as agent_count,
        (SELECT COUNT(*) FROM skills sk WHERE sk.specialization_id = s.id) as skill_count
      FROM specializations s
      LEFT JOIN domains d ON s.domain_id = d.id
    `;

    const params: unknown[] = [];

    // Apply domain filter
    if (domain) {
      sql += ' WHERE d.name = ?';
      params.push(domain);
    }

    // Apply sorting
    const sortField = mapSortField(sort, SORT_FIELDS, 's.name');
    sql += ` ORDER BY ${sortField} ${(order || 'asc').toUpperCase()}`;

    // Get total count first
    let countSql = 'SELECT COUNT(*) as count FROM specializations s';
    if (domain) {
      countSql += ' LEFT JOIN domains d ON s.domain_id = d.id WHERE d.name = ?';
    }
    const countResult = rawDb.prepare(countSql).get(...(domain ? [domain] : [])) as { count: number };
    const total = countResult.count;

    // Apply pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const rows = rawDb.prepare(sql).all(...params) as Array<{
      id: number;
      name: string;
      path: string;
      domain_id: number | null;
      domain_name: string | null;
      created_at: string;
      updated_at: string;
      agent_count: number;
      skill_count: number;
    }>;

    // Transform to API response format
    const specializations: SpecializationListItem[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      domainId: row.domain_id,
      domainName: row.domain_name,
      agentCount: row.agent_count,
      skillCount: row.skill_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return createPaginatedResponse(specializations, total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
