import { queryRow } from "./db";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type AccountRow = {
  userId: string;
};

type GitHubUserProfile = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type AtlasStoredUser = {
  id: string;
  login: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
};

function toSessionUser(user: UserRow, login: string | null): AtlasStoredUser {
  return {
    id: user.id,
    login,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

export async function upsertGitHubUser(input: {
  profile: GitHubUserProfile;
  email: string | null;
  accessToken: string;
  scope: string | null;
  tokenType: string | null;
}): Promise<AtlasStoredUser> {
  const providerAccountId = String(input.profile.id);
  const existingAccount = await queryRow<AccountRow>(
    `SELECT "userId"
       FROM accounts
      WHERE provider = 'github' AND "providerAccountId" = $1`,
    [providerAccountId],
  );

  const existingUserByEmail =
    !existingAccount && input.email
      ? await queryRow<UserRow>(
          `SELECT id, name, email, image
             FROM users
            WHERE email = $1`,
          [input.email],
        )
      : null;

  const userId = existingAccount?.userId ?? existingUserByEmail?.id ?? `github:${providerAccountId}`;
  const displayName = input.profile.name?.trim() || input.profile.login;

  await queryRow(
    `INSERT INTO users (id, name, email, "emailVerified", image)
     VALUES ($1, $2, $3, NOW(), $4)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           email = EXCLUDED.email,
           "emailVerified" = EXCLUDED."emailVerified",
           image = EXCLUDED.image`,
    [userId, displayName, input.email, input.profile.avatar_url],
  );

  await queryRow(
    `INSERT INTO accounts
      ("userId", type, provider, "providerAccountId", access_token, token_type, scope)
     VALUES
      ($1, 'oauth', 'github', $2, $3, $4, $5)
     ON CONFLICT (provider, "providerAccountId") DO UPDATE
       SET "userId" = EXCLUDED."userId",
           access_token = EXCLUDED.access_token,
           token_type = EXCLUDED.token_type,
           scope = EXCLUDED.scope`,
    [userId, providerAccountId, input.accessToken, input.tokenType, input.scope],
  );

  const user = await queryRow<UserRow>(
    `SELECT id, name, email, image
       FROM users
      WHERE id = $1`,
    [userId],
  );

  if (!user) {
    throw new Error("Failed to persist Atlas user.");
  }

  return toSessionUser(user, input.profile.login);
}
