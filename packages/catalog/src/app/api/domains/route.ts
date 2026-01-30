/**
 * Domains API Route
 * GET /api/domains - List domains with hierarchy information
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
// CatalogQueries and DomainRow reserved for future use
import {
  parseListQueryParams,
  createPaginatedResponse,
  internalErrorResponse,
  mapSortField,
} from '@/lib/api/utils';
import type { DomainListItem } from '@/lib/api/types';

// Allowed sort fields mapping
const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  category: 'category',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const { limit = 50, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const category = searchParams.get('category');

    // Initialize database
    const db = initializeDatabase();
    const rawDb = db.getDb();

    // Build domain query with counts
    let sql = `
      SELECT
        d.id,
        d.name,
        d.path,
        d.category,
        d.created_at,
        d.updated_at,
        (SELECT COUNT(*) FROM specializations s WHERE s.domain_id = d.id) as specialization_count,
        (SELECT COUNT(*) FROM agents a WHERE a.domain_id = d.id) as agent_count,
        (SELECT COUNT(*) FROM skills sk WHERE sk.domain_id = d.id) as skill_count
      FROM domains d
    `;

    const params: unknown[] = [];

    // Apply category filter
    if (category) {
      sql += ' WHERE d.category = ?';
      params.push(category);
    }

    // Apply sorting
    const sortField = mapSortField(sort, SORT_FIELDS, 'name');
    sql += ` ORDER BY d.${sortField} ${(order || 'asc').toUpperCase()}`;

    // Get total count first
    const countSql = category
      ? 'SELECT COUNT(*) as count FROM domains WHERE category = ?'
      : 'SELECT COUNT(*) as count FROM domains';
    const countResult = rawDb.prepare(countSql).get(...(category ? [category] : [])) as { count: number };
    const total = countResult.count;

    // Apply pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const rows = rawDb.prepare(sql).all(...params) as Array<{
      id: number;
      name: string;
      path: string;
      category: string | null;
      created_at: string;
      updated_at: string;
      specialization_count: number;
      agent_count: number;
      skill_count: number;
    }>;

    // Transform to API response format
    const domains: DomainListItem[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      category: row.category,
      specializationCount: row.specialization_count,
      agentCount: row.agent_count,
      skillCount: row.skill_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return createPaginatedResponse(domains, total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
