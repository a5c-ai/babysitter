import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ATLAS_GITHUB_STATE_COOKIE,
  ATLAS_SESSION_COOKIE,
  buildAppOrigin,
  createSessionToken,
  getGitHubClientConfig,
  verifyOAuthStateToken,
} from "@/auth";
import { upsertGitHubUser } from "@/lib/server/user-store";

type GitHubTokenResponse = {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserProfile = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export const dynamic = "force-dynamic";

async function exchangeCodeForToken(request: Request, code: string): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubClientConfig();
  const origin = buildAppOrigin(request);
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${origin}/api/auth/callback/github`,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with ${response.status}.`);
  }

  return response.json();
}

async function getGitHubProfile(accessToken: string): Promise<GitHubUserProfile> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "a5c-agentic-ai-atlas",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to read GitHub profile (${response.status}).`);
  }

  return response.json();
}

async function getPrimaryGitHubEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "a5c-agentic-ai-atlas",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const emails = (await response.json()) as GitHubEmail[];
  const preferred = emails.find((entry) => entry.primary && entry.verified) ?? emails.find((entry) => entry.verified);
  return preferred?.email ?? null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = buildAppOrigin(request);
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(ATLAS_GITHUB_STATE_COOKIE)?.value;
  const statePayload = verifyOAuthStateToken(expectedState);

  if (!code || !state || !statePayload || expectedState !== state) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const token = await exchangeCodeForToken(request, code);
  if (!token.access_token) {
    throw new Error(token.error_description ?? token.error ?? "GitHub OAuth sign-in failed.");
  }

  const profile = await getGitHubProfile(token.access_token);
  const email = profile.email ?? (await getPrimaryGitHubEmail(token.access_token));
  const user = await upsertGitHubUser({
    profile,
    email,
    accessToken: token.access_token,
    scope: token.scope ?? null,
    tokenType: token.token_type ?? null,
  });

  const response = NextResponse.redirect(new URL(statePayload.callbackUrl, origin));
  response.cookies.set(ATLAS_SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(ATLAS_GITHUB_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 0,
  });

  return response;
}
