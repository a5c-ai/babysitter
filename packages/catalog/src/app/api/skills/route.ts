/**
 * Skills API Route
 * GET /api/skills - List skills with filtering
 */

import { listCatalogSkills } from '@a5c-ai/agent-catalog';
import { NextRequest } from 'next/server';
import {
  parseListQueryParams,
  createPaginatedResponse,
  internalErrorResponse,
} from '@/lib/api/utils';
import type { SkillListItem } from '@/lib/api/types';

function sortValueFor(skill: SkillListItem, sort: string | undefined): string {
  switch (sort) {
    case 'createdAt':
      return skill.createdAt;
    case 'updatedAt':
      return skill.updatedAt;
    case 'domainName':
      return skill.domainName ?? '';
    case 'specializationName':
      return skill.specializationName ?? '';
    default:
      return skill.name;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const { limit = 20, offset = 0, sort, order } = parseListQueryParams(searchParams);
    const specialization = searchParams.get('specialization');
    const domain = searchParams.get('domain');
    const category = searchParams.get('category');

    let skills: SkillListItem[] = listCatalogSkills().map((skill) => ({
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      filePath: skill.filePath,
      directory: skill.directory,
      specializationId: null,
      specializationName: skill.specializationName,
      domainId: null,
      domainName: skill.domainName,
      allowedTools: skill.allowedTools,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    }));

    if (specialization) {
      skills = skills.filter((skill) => skill.specializationName === specialization);
    }

    if (domain) {
      skills = skills.filter((skill) => skill.domainName === domain);
    }

    if (category) {
      skills = skills.filter((skill) =>
        skill.directory.toLowerCase().includes(category.toLowerCase()),
      );
    }

    const sortKey = sort === 'createdAt' || sort === 'updatedAt'
      ? sort
      : sort === 'domain'
        ? 'domainName'
        : sort === 'specialization'
          ? 'specializationName'
          : 'name';
    const direction = order === 'desc' ? -1 : 1;
    skills.sort((left, right) => {
      const leftValue = sortValueFor(left, sortKey).toLowerCase();
      const rightValue = sortValueFor(right, sortKey).toLowerCase();
      return leftValue.localeCompare(rightValue) * direction;
    });

    const total = skills.length;
    return createPaginatedResponse(skills.slice(offset, offset + limit), total, limit, offset);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
