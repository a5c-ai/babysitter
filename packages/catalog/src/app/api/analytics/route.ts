/**
 * Analytics API Route
 * GET /api/analytics - Dashboard metrics and statistics
 */

import { getCatalogDiscoverySnapshot } from '@a5c-ai/agent-catalog';
import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { AnalyticsResponse, EntityDistribution, RecentActivityItem } from '@/lib/api/types';

export async function GET(_request: NextRequest) {
  try {
    const snapshot = getCatalogDiscoverySnapshot();

    const byDomain: EntityDistribution[] = snapshot.domains
      .map((domain) => ({
        name: domain.name,
        count: domain.agentCount + domain.skillCount,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10);

    const byCategoryCounts = new Map<string, number>();
    for (const process of snapshot.processes) {
      if (!process.category) {
        continue;
      }
      byCategoryCounts.set(process.category, (byCategoryCounts.get(process.category) ?? 0) + 1);
    }
    const byCategory: EntityDistribution[] = Array.from(byCategoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10);

    const byType: EntityDistribution[] = [
      { name: 'agents', count: snapshot.counts.agents },
      { name: 'skills', count: snapshot.counts.skills },
      { name: 'processes', count: snapshot.counts.processes },
      { name: 'domains', count: snapshot.counts.domains },
      { name: 'specializations', count: snapshot.counts.specializations },
    ];

    const recentActivity: RecentActivityItem[] = [
      ...snapshot.agents.map((agent) => ({ type: 'agent' as const, id: agent.id, name: agent.name, updatedAt: agent.updatedAt })),
      ...snapshot.skills.map((skill) => ({
        type: 'skill' as const,
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        updatedAt: skill.updatedAt,
      })),
      ...snapshot.processes.map((process) => ({ type: 'process' as const, id: process.id, name: process.processId, updatedAt: process.updatedAt })),
      ...snapshot.domains.map((domain) => ({ type: 'domain' as const, id: domain.id, name: domain.name, updatedAt: domain.updatedAt })),
      ...snapshot.specializations.map((specialization) => ({ type: 'specialization' as const, id: specialization.id, name: specialization.name, updatedAt: specialization.updatedAt })),
    ]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 20);

    const analytics: AnalyticsResponse = {
      counts: {
        domains: snapshot.counts.domains,
        specializations: snapshot.counts.specializations,
        agents: snapshot.counts.agents,
        skills: snapshot.counts.skills,
        processes: snapshot.counts.processes,
        total:
          snapshot.counts.domains +
          snapshot.counts.specializations +
          snapshot.counts.agents +
          snapshot.counts.skills +
          snapshot.counts.processes,
      },
      distributions: {
        byDomain,
        byCategory,
        byType,
      },
      recentActivity,
      databaseSize: snapshot.databaseSize,
      lastIndexedAt: snapshot.generatedAt,
    };

    return createSuccessResponse(analytics);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
