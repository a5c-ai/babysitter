/**
 * Analytics API Route
 * GET /api/analytics - Dashboard metrics and statistics
 */

import { NextRequest } from 'next/server';
import { initializeDatabase } from '@/lib/db/client';
import {
  createSuccessResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { AnalyticsResponse, EntityDistribution, RecentActivityItem } from '@/lib/api/types';

export async function GET(_request: NextRequest) {
  try {
    // Initialize database
    const db = initializeDatabase();
    const rawDb = db.getDb();

    // Get basic counts
    const stats = db.getStats();

    // Get distribution by domain
    const byDomainSql = `
      SELECT d.name, COUNT(DISTINCT a.id) + COUNT(DISTINCT sk.id) as count
      FROM domains d
      LEFT JOIN agents a ON a.domain_id = d.id
      LEFT JOIN skills sk ON sk.domain_id = d.id
      GROUP BY d.id, d.name
      ORDER BY count DESC
      LIMIT 10
    `;
    const byDomainRows = rawDb.prepare(byDomainSql).all() as Array<{ name: string; count: number }>;
    const byDomain: EntityDistribution[] = byDomainRows.map(row => ({
      name: row.name,
      count: row.count,
    }));

    // Get distribution by category (from processes)
    const byCategorySql = `
      SELECT category as name, COUNT(*) as count
      FROM processes
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;
    const byCategoryRows = rawDb.prepare(byCategorySql).all() as Array<{ name: string; count: number }>;
    const byCategory: EntityDistribution[] = byCategoryRows.map(row => ({
      name: row.name,
      count: row.count,
    }));

    // Get distribution by type
    const byType: EntityDistribution[] = [
      { name: 'agents', count: stats.agentsCount },
      { name: 'skills', count: stats.skillsCount },
      { name: 'processes', count: stats.processesCount },
      { name: 'domains', count: stats.domainsCount },
      { name: 'specializations', count: stats.specializationsCount },
    ];

    // Get recent activity (most recently updated items)
    const recentActivitySql = `
      SELECT 'agent' as type, id, name, updated_at FROM agents
      UNION ALL
      SELECT 'skill' as type, id, name, updated_at FROM skills
      UNION ALL
      SELECT 'process' as type, id, process_id as name, updated_at FROM processes
      ORDER BY updated_at DESC
      LIMIT 20
    `;
    const recentRows = rawDb.prepare(recentActivitySql).all() as Array<{
      type: string;
      id: number;
      name: string;
      updated_at: string;
    }>;

    const recentActivity: RecentActivityItem[] = recentRows.map(row => ({
      type: row.type as 'agent' | 'skill' | 'process' | 'domain' | 'specialization',
      id: row.id,
      name: row.name,
      updatedAt: row.updated_at,
    }));

    // Build response
    const analytics: AnalyticsResponse = {
      counts: {
        domains: stats.domainsCount,
        specializations: stats.specializationsCount,
        agents: stats.agentsCount,
        skills: stats.skillsCount,
        processes: stats.processesCount,
        total:
          stats.domainsCount +
          stats.specializationsCount +
          stats.agentsCount +
          stats.skillsCount +
          stats.processesCount,
      },
      distributions: {
        byDomain,
        byCategory,
        byType,
      },
      recentActivity,
      databaseSize: stats.databaseSize,
      lastIndexedAt: stats.lastIndexedAt,
    };

    return createSuccessResponse(analytics);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
