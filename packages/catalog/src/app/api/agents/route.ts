/**
 * Agents API Route
 * GET /api/agents - List agents with filtering
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import {
  parseListQueryParams,
  createPaginatedResponse,
  internalErrorResponse,
  mapSortField,
  safeJsonParse,
} from '@/lib/api/utils';
import type { AgentListItem } from '@/lib/api/types';

// Allowed sort fields mapping
const SORT_FIELDS: Record<string, string> = {
  name: 'a.name',
  domain: 'd.name',
  specialization: 's.name',
  role: 'a.role',
  createdAt: 'a.created_at',
  updatedAt: 'a.updated_at',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const { limit = 20, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const specialization = searchParams.get('specialization');
    const domain = searchParams.get('domain');
    const expertise = searchParams.get('expertise');

    // Initialize database
    const db = initializeDatabase();
    const rawDb = db.getDb();

    // Build query
    let sql = `
      SELECT
        a.id,
        a.name,
        a.description,
        a.file_path,
        a.directory,
        a.role,
        a.expertise,
        a.specialization_id,
        s.name as specialization_name,
        a.domain_id,
        d.name as domain_name,
        a.created_at,
        a.updated_at
      FROM agents a
      LEFT JOIN specializations s ON a.specialization_id = s.id
      LEFT JOIN domains d ON a.domain_id = d.id
    `;

    const conditions: string[] = [];
    const params: unknown[] = [];

    // Apply filters
    if (specialization) {
      conditions.push('s.name = ?');
      params.push(specialization);
    }

    if (domain) {
      conditions.push('d.name = ?');
      params.push(domain);
    }

    if (expertise) {
      // Search within JSON array of expertise
      conditions.push('a.expertise LIKE ?');
      params.push(`%${expertise}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Apply sorting
    const sortField = mapSortField(sort, SORT_FIELDS, 'a.name');
    sql += ` ORDER BY ${sortField} ${(order || 'asc').toUpperCase()}`;

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM agents a LEFT JOIN specializations s ON a.specialization_id = s.id LEFT JOIN domains d ON a.domain_id = d.id';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = [...params]; // Same params without limit/offset
    const countResult = rawDb.prepare(countSql).get(...countParams) as { count: number };
    const total = countResult.count;

    // Apply pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const rows = rawDb.prepare(sql).all(...params) as Array<{
      id: number;
      name: string;
      description: string;
      file_path: string;
      directory: string;
      role: string | null;
      expertise: string;
      specialization_id: number | null;
      specialization_name: string | null;
      domain_id: number | null;
      domain_name: string | null;
      created_at: string;
      updated_at: string;
    }>;

    // Transform to API response format
    const agents: AgentListItem[] = rows.map(row => ({
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
    }));

    return createPaginatedResponse(agents, total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
