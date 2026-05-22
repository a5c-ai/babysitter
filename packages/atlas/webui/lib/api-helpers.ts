import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function jsonResponse(
  data: unknown,
  init: { status?: number; etag?: string } = {},
): NextResponse {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...CORS_HEADERS,
  };
  if (init.etag) headers["ETag"] = init.etag;
  return new NextResponse(JSON.stringify(data), {
    status: init.status ?? 200,
    headers,
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return jsonResponse({ error: { code, message } }, { status });
}

export function notFound(message = "not found"): NextResponse {
  return errorResponse(404, "not_found", message);
}

export function badRequest(message: string): NextResponse {
  return errorResponse(400, "bad_request", message);
}

export function options(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Tiny stable hash for ETag (FNV-1a 32-bit).
export function etagFor(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `"${(h >>> 0).toString(16)}"`;
}

export function paginate<T>(
  arr: T[],
  cursor: string | null,
  limit: number,
  keyOf: (x: T) => string,
): { page: T[]; nextCursor: string | null } {
  let start = 0;
  if (cursor) {
    const idx = arr.findIndex((x) => keyOf(x) === cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const page = arr.slice(start, start + limit);
  const nextCursor =
    start + limit < arr.length ? keyOf(arr[start + limit - 1]) : null;
  return { page, nextCursor };
}
