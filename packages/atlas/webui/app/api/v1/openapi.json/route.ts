import { openapiSpec } from "@/lib/openapi";
import { etagFor, jsonResponse, options } from "@/lib/api-helpers";

export const dynamic = "force-static";

export async function OPTIONS() {
  return options();
}

export async function GET() {
  const body = JSON.stringify(openapiSpec);
  return jsonResponse(openapiSpec, { etag: etagFor(body) });
}
