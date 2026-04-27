/**
 * Skill Detail API Route
 * GET /api/skills/[slug] - Get single skill by stable slug
 */

import { getCatalogSkillBySlug } from '@a5c-ai/agent-catalog';
import { NextRequest } from 'next/server';
import {
  validateSlug,
  createSuccessResponse,
  notFoundResponse,
  internalErrorResponse,
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

    const skill = getCatalogSkillBySlug(slug);
    if (!skill) {
      return notFoundResponse('Skill', slug);
    }

    const response: SkillDetail = {
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
      content: skill.content,
      frontmatter: skill.frontmatter,
    };

    return createSuccessResponse(response);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
