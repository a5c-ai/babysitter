import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getCatalogSkillBySlug, listCatalogSkills } from '@a5c-ai/agent-catalog';
import { GET } from './route';
import type { ApiResponse } from '@/lib/api/types';

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function findDuplicatedSkillSlug(): string {
  const duplicate = listCatalogSkills().find(
    (skill) => skill.name === 'test-driven-development' && skill.slug === 'methodologies--rpikit--skills--test-driven-development',
  );

  if (!duplicate) {
    throw new Error('Expected duplicated test-driven-development skill slug to exist in the discovery catalog.');
  }

  return duplicate.slug;
}

describe('GET /api/skills/[slug] contract', () => {
  it('returns the intended duplicated skill record when addressed by stable slug', async () => {
    const slug = findDuplicatedSkillSlug();
    const expected = getCatalogSkillBySlug(slug);
    const request = new NextRequest(`http://localhost/api/skills/${slug}`);

    const response = await GET(request, { params: Promise.resolve({ slug }) });
    const body = await readJson<ApiResponse<NonNullable<typeof expected>>>(response);

    expect(expected).toBeDefined();
    expect(expected?.name).toBe('test-driven-development');
    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        id: expected!.id,
        slug: expected!.slug,
        name: expected!.name,
        description: expected!.description,
        filePath: expected!.filePath,
        directory: expected!.directory,
        specializationId: null,
        specializationName: expected!.specializationName,
        domainId: null,
        domainName: expected!.domainName,
        allowedTools: expected!.allowedTools,
        createdAt: expected!.createdAt,
        updatedAt: expected!.updatedAt,
        content: expected!.content,
        frontmatter: expected!.frontmatter,
      },
    });
  });

  it('returns a 404 when the catalog has no matching skill slug', async () => {
    const slug = 'missing-skill-slug';
    const request = new NextRequest(`http://localhost/api/skills/${slug}`);

    const response = await GET(request, { params: Promise.resolve({ slug }) });
    const body = await readJson<ApiResponse<never>>(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Skill with identifier '${slug}' not found`,
      },
    });
  });

  it('rejects blank slug input before consulting agent-catalog', async () => {
    const response = await GET(new NextRequest('http://localhost/api/skills/%20%20%20'), {
      params: Promise.resolve({ slug: '   ' }),
    });
    const body = await readJson<ApiResponse<never>>(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid or missing slug parameter',
      },
    });
  });
});
