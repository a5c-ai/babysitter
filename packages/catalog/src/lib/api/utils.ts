/**
 * API utility functions for request/response handling
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, ApiError, PaginationMeta, ListQueryParams } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_OFFSET = 0;

// =============================================================================
// QUERY PARSING
// =============================================================================

/**
 * Parse common list query parameters from URL search params
 */
export function parseListQueryParams(searchParams: URLSearchParams): ListQueryParams {
  const limit = parseIntParam(searchParams.get('limit'), DEFAULT_LIMIT);
  const offset = parseIntParam(searchParams.get('offset'), DEFAULT_OFFSET);
  const sort = searchParams.get('sort') || undefined;
  const order = parseOrderParam(searchParams.get('order'));

  return {
    limit: Math.min(Math.max(1, limit), MAX_LIMIT),
    offset: Math.max(0, offset),
    sort,
    order,
  };
}

/**
 * Parse an integer parameter with a default value
 */
export function parseIntParam(value: string | null, defaultValue: number): number {
  if (value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse order parameter (asc/desc)
 */
export function parseOrderParam(value: string | null): 'asc' | 'desc' | undefined {
  if (value === 'asc' || value === 'desc') return value;
  return undefined;
}

/**
 * Parse a comma-separated string into an array
 */
export function parseArrayParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

// =============================================================================
// RESPONSE CREATION
// =============================================================================

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: PaginationMeta,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): NextResponse<ApiResponse<T[]>> {
  const meta: PaginationMeta = {
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };

  return createSuccessResponse(data, meta);
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  const error: ApiError = {
    code,
    message,
  };

  if (details) {
    error.details = details;
  }

  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

// =============================================================================
// ERROR HANDLERS
// =============================================================================

/**
 * Handle not found error
 */
export function notFoundResponse(resource: string, identifier: string | number): NextResponse<ApiResponse<never>> {
  return createErrorResponse(
    'NOT_FOUND',
    `${resource} with identifier '${identifier}' not found`,
    404
  );
}

/**
 * Handle bad request error
 */
export function badRequestResponse(message: string, details?: Record<string, unknown>): NextResponse<ApiResponse<never>> {
  return createErrorResponse('BAD_REQUEST', message, 400, details);
}

/**
 * Handle internal server error
 */
export function internalErrorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  console.error('Internal server error:', error);
  return createErrorResponse('INTERNAL_ERROR', message, 500);
}

/**
 * Handle validation error
 */
export function validationErrorResponse(
  field: string,
  message: string
): NextResponse<ApiResponse<never>> {
  return createErrorResponse('VALIDATION_ERROR', message, 400, { field });
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

/**
 * Validate required query parameter
 */
export function requireQueryParam(
  searchParams: URLSearchParams,
  name: string
): { value: string } | { error: NextResponse<ApiResponse<never>> } {
  const value = searchParams.get(name);
  if (!value || value.trim() === '') {
    return {
      error: validationErrorResponse(name, `Query parameter '${name}' is required`),
    };
  }
  return { value: value.trim() };
}

/**
 * Validate slug/ID parameter
 */
export function validateSlug(slug: string | undefined): { valid: true; slug: string } | { valid: false; error: NextResponse<ApiResponse<never>> } {
  if (!slug || slug.trim() === '') {
    return {
      valid: false,
      error: badRequestResponse('Invalid or missing slug parameter'),
    };
  }
  return { valid: true, slug: slug.trim() };
}

/**
 * Validate numeric ID parameter
 */
export function validateId(id: string | undefined): { valid: true; id: number } | { valid: false; error: NextResponse<ApiResponse<never>> } {
  if (!id) {
    return {
      valid: false,
      error: badRequestResponse('Invalid or missing ID parameter'),
    };
  }
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId < 1) {
    return {
      valid: false,
      error: badRequestResponse('ID must be a positive integer'),
    };
  }
  return { valid: true, id: numId };
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Safely parse JSON string, returning default value on failure
 */
export function safeJsonParse<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert snake_case database row to camelCase API response
 */
export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Extract URL parameters from Next.js dynamic route
 */
export function getRouteParams(
  _request: NextRequest,
  params: Record<string, string | string[]>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = Array.isArray(value) ? value[0] || '' : value;
  }
  return result;
}

// =============================================================================
// SORTING HELPERS
// =============================================================================

/**
 * Map API sort field to database column
 */
export function mapSortField(
  field: string | undefined,
  allowedFields: Record<string, string>,
  defaultField: string
): string {
  if (!field) return defaultField;
  return allowedFields[field] || defaultField;
}

/**
 * Build ORDER BY clause
 */
export function buildOrderClause(
  sort: string | undefined,
  order: 'asc' | 'desc' | undefined,
  allowedFields: Record<string, string>,
  defaultField: string
): string {
  const sortField = mapSortField(sort, allowedFields, defaultField);
  const sortOrder = (order || 'asc').toUpperCase();
  return `${sortField} ${sortOrder}`;
}
