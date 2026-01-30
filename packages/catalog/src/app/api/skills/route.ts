/**
 * Skills API Route
 * GET /api/skills - List skills with filtering
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
import type { SkillListItem } from '@/lib/api/types';

// Allowed sort fields mapping
const SORT_FIELDS: Record<string, string> = {
  name: 'sk.name',
  domain: 'd.name',
  specialization: 's.name',
  createdAt: 'sk.created_at',
  updatedAt: 'sk.updated_at',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const { limit = 20, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const specialization = searchParams.get('specialization');
    const domain = searchParams.get('domain');
    const category = searchParams.get('category');

    // Initialize database
    const db = initializeDatabase();
    const rawDb = db.getDb();

    // Build query
    let sql = `
      SELECT
        sk.id,
        sk.name,
        sk.description,
        sk.file_path,
        sk.directory,
        sk.allowed_tools,
        sk.specialization_id,
        s.name as specialization_name,
        sk.domain_id,
        d.name as domain_name,
        sk.created_at,
        sk.updated_at
      FROM skills sk
      LEFT JOIN specializations s ON sk.specialization_id = s.id
      LEFT JOIN domains d ON sk.domain_id = d.id
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

    if (category) {
      // Category filter could check directory or frontmatter
      conditions.push('sk.directory LIKE ?');
      params.push(`%${category}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Apply sorting
    const sortField = mapSortField(sort, SORT_FIELDS, 'sk.name');
    sql += ` ORDER BY ${sortField} ${(order || 'asc').toUpperCase()}`;

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM skills sk LEFT JOIN specializations s ON sk.specialization_id = s.id LEFT JOIN domains d ON sk.domain_id = d.id';
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
      allowed_tools: string;
      specialization_id: number | null;
      specialization_name: string | null;
      domain_id: number | null;
      domain_name: string | null;
      created_at: string;
      updated_at: string;
    }>;

    // Transform to API response format
    const skills: SkillListItem[] = rows.map(row => ({
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
    }));

    return createPaginatedResponse(skills, total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
