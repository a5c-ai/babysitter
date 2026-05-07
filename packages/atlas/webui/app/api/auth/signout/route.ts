import { NextResponse } from "next/server";
import { ATLAS_SESSION_COOKIE, buildAppOrigin, normalizeCallbackUrl } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = normalizeCallbackUrl(url.searchParams.get("callbackUrl"), "/");
  const origin = buildAppOrigin(request);
  const response = NextResponse.redirect(new URL(callbackUrl, origin));
  response.cookies.set(ATLAS_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 0,
  });
  return response;
}
