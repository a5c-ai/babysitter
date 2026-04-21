import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointBrowserSession,
  BreakpointSessionView,
  Project,
  ProjectSummary,
  GitHubRepo,
  KnownUser,
  Team,
} from "../types.js";
import type { User, AuthToken, SSHKeyPair } from "../auth/types.js";

import { ServerClient, ServerError } from "./server-client.js";

// -- Types --------------------------------------------------------------------

/**
 * Information about an SSH key stored on the server.
 */
export interface SSHKeyInfo {
  id: string;
  fingerprint: string;
  algorithm: string;
  createdAt: string;
  label?: string;
}

/**
 * Options for constructing an AuthClient.
 */
export interface AuthClientOptions {
  /** Base URL of the BMUX server (defaults to https://breakpoints-mux.a5c.ai/api/v1). */
  serverUrl?: string;
  /** Static access token. */
  token?: string;
  /** Async function that provides a fresh access token on each call. */
  tokenProvider?: () => Promise<string>;
  /** Refresh token used to automatically renew expired access tokens. */
  refreshToken?: string;
  /** Callback invoked when tokens are refreshed (e.g. to persist them). */
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
}

// -- AuthClient ---------------------------------------------------------------

/**
 * Authenticated client that wraps ServerClient, automatically injecting
 * Authorization headers and handling token refresh on 401 responses.
 */
export class AuthClient {
  private serverClient: ServerClient;
  private token: string | null;
  private refreshTokenValue: string | null;
  private tokenProvider: (() => Promise<string>) | null;
  private onTokenRefresh: ((tokens: { accessToken: string; refreshToken: string }) => void) | null;

  constructor(options: AuthClientOptions) {
    this.serverClient = new ServerClient(options.serverUrl);
    this.token = options.token ?? null;
    this.refreshTokenValue = options.refreshToken ?? null;
    this.tokenProvider = options.tokenProvider ?? null;
    this.onTokenRefresh = options.onTokenRefresh ?? null;
  }

  // -- Auth state -------------------------------------------------------------

  /**
   * Returns true if a token or token provider is available.
   */
  isAuthenticated(): boolean {
    return this.token !== null || this.tokenProvider !== null;
  }

  // -- Auth methods -----------------------------------------------------------

  /**
   * Fetch the authenticated user's profile.
   */
  async getUser(): Promise<User> {
    return this.authenticatedGet<User>("/auth/me");
  }

  /**
   * Exchange an OAuth authorization code for auth tokens.
   */
  async login(code: string, codeVerifier?: string): Promise<AuthToken> {
    const body: Record<string, string> = { code };
    if (codeVerifier) {
      body.codeVerifier = codeVerifier;
    }
    const result = await this.serverClient.post<AuthToken>("/auth/login", body);
    this.token = result.accessToken;
    this.refreshTokenValue = result.refreshToken;
    return result;
  }

  /**
   * Log out, clearing local token state.
   */
  async logout(): Promise<void> {
    try {
      await this.authenticatedPost<void>("/auth/logout", {});
    } finally {
      this.token = null;
      this.refreshTokenValue = null;
    }
  }

  // -- Delegated breakpoint methods -------------------------------------------

  /**
   * List breakpoints with optional filters, authenticated.
   */
  async listBreakpoints(filters?: Record<string, string>): Promise<Breakpoint[]> {
    const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return this.authenticatedGet<Breakpoint[]>(`/breakpoints${qs}`);
  }

  /**
   * Get a single breakpoint by ID, authenticated.
   */
  async getBreakpoint(id: string): Promise<Breakpoint> {
    return this.authenticatedGet<Breakpoint>(`/breakpoints/${id}`);
  }

  /**
   * Submit a new breakpoint, authenticated.
   */
  async submitBreakpoint(
    text: string,
    context: Breakpoint["context"],
    routing: Breakpoint["routing"],
    options: { projectId: string; repoId: string },
  ): Promise<Breakpoint> {
    return this.authenticatedPost<Breakpoint>("/breakpoints", {
      text,
      context,
      routing,
      projectId: options.projectId,
      repoId: options.repoId,
    });
  }

  /**
   * Submit an answer to a breakpoint, authenticated.
   */
  async submitAnswer(
    breakpointId: string,
    answer: {
      responderId: string;
      responderName: string;
      text: string;
      confidence?: number;
      references?: string[];
      followUpQuestions?: string[];
    },
  ): Promise<BreakpointAnswer> {
    return this.authenticatedPost<BreakpointAnswer>(`/breakpoints/${breakpointId}/answers`, answer);
  }

  async createBrowserSession(
    breakpointId: string,
    options?: {
      mode?: "same-user" | "responder";
      responderId?: string;
      responderName?: string;
    },
  ): Promise<BreakpointBrowserSession> {
    return this.authenticatedPost<BreakpointBrowserSession>(`/breakpoints/${breakpointId}/browser-session`, {
      mode: options?.mode ?? "same-user",
      responderId: options?.responderId,
      responderName: options?.responderName,
    });
  }

  async getBreakpointSession(authToken: string): Promise<BreakpointSessionView> {
    return this.serverClient.get<BreakpointSessionView>(`/breakpoints/session/${authToken}`);
  }

  async submitSessionAnswer(
    authToken: string,
    answer: {
      text: string;
      confidence?: number;
      references?: string[];
      followUpQuestions?: string[];
    },
  ): Promise<BreakpointAnswer> {
    return this.serverClient.post<BreakpointAnswer>(`/breakpoints/session/${authToken}/answer`, answer);
  }

  // -- SSH key methods --------------------------------------------------------

  /**
   * Generate a new SSH key pair on the server.
   */
  async generateKey(): Promise<SSHKeyPair> {
    return this.authenticatedPost<SSHKeyPair>("/keys/generate", {});
  }

  /**
   * List SSH keys associated with the authenticated user.
   */
  async listKeys(): Promise<SSHKeyInfo[]> {
    return this.authenticatedGet<SSHKeyInfo[]>("/keys");
  }

  /**
   * Push an SSH public key to a repository via pull request.
   */
  async pushKey(keyId: string, owner: string, repo: string): Promise<{ prUrl: string }> {
    return this.authenticatedPost<{ prUrl: string }>(`/keys/${keyId}/push`, { owner, repo });
  }

  // -- Projects ---------------------------------------------------------------

  /**
   * List all projects the authenticated user has access to.
   */
  async listProjects(): Promise<ProjectSummary[]> {
    return this.authenticatedGet<ProjectSummary[]>("/projects");
  }

  async listTeams(): Promise<Team[]> {
    return this.authenticatedGet<Team[]>("/teams");
  }

  async getTeam(id: string): Promise<Team> {
    return this.authenticatedGet<Team>(`/teams/${id}`);
  }

  async createTeam(name: string, description: string): Promise<Team> {
    return this.authenticatedPost<Team>("/teams", { name, description });
  }

  async listTeamProjects(teamId: string): Promise<Project[]> {
    return this.authenticatedGet<Project[]>(`/teams/${teamId}/projects`);
  }

  async inviteTeamMember(teamId: string, login: string): Promise<Team> {
    return this.authenticatedPost<Team>(`/teams/${teamId}/invitations`, { login });
  }

  async acceptTeamInvitation(token: string): Promise<Team> {
    return this.authenticatedPost<Team>(`/teams/invitations/${token}/accept`, {});
  }

  /**
   * Find known users for project membership and sharing flows.
   */
  async searchUsers(query?: string, limit?: number): Promise<KnownUser[]> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (typeof limit === "number") params.set("limit", String(limit));
    const qs = params.toString();
    return this.authenticatedGet<KnownUser[]>(`/auth/users${qs ? `?${qs}` : ""}`);
  }

  /**
   * Get a single project by ID.
   */
  async getProject(id: string): Promise<Project> {
    return this.authenticatedGet<Project>(`/projects/${id}`);
  }

  /**
   * Create a new project.
   */
  async createProject(name: string, description: string, options?: { teamId?: string }): Promise<Project> {
    return this.authenticatedPost<Project>("/projects", {
      name,
      description,
      teamId: options?.teamId,
    });
  }

  /**
   * Update an existing project.
   */
  async updateProject(id: string, updates: { name?: string; description?: string; teamId?: string }): Promise<Project> {
    return this.authenticatedPut<Project>(`/projects/${id}`, updates);
  }

  /**
   * Delete a project by ID.
   */
  async deleteProject(id: string): Promise<void> {
    return this.authenticatedDelete<void>(`/projects/${id}`);
  }

  /**
   * Add a GitHub repository to a project.
   */
  async addRepoToProject(
    projectId: string,
    repo: {
      owner: string;
      name: string;
      fullName?: string;
      description?: string;
      url?: string;
      defaultBranch?: string;
      language?: string | null;
      isPrivate?: boolean;
      repoRoot?: string;
      configRoot?: string;
      responderDir?: string;
      isConfigSource?: boolean;
    },
  ): Promise<Project> {
    return this.authenticatedPost<Project>(`/projects/${projectId}/repos`, repo);
  }

  /**
   * Remove a repository from a project.
   */
  async removeRepoFromProject(projectId: string, repoId: string): Promise<Project> {
    return this.authenticatedDelete<Project>(`/projects/${projectId}/repos/${repoId}`);
  }

  /**
   * List breakpoints associated with a project.
   */
  async listProjectBreakpoints(projectId: string): Promise<Breakpoint[]> {
    return this.authenticatedGet<Breakpoint[]>(`/projects/${projectId}/breakpoints`);
  }

  /**
   * List GitHub repositories available to the authenticated user.
   */
  async listGitHubRepos(): Promise<GitHubRepo[]> {
    return this.authenticatedGet<GitHubRepo[]>("/auth/github/repos");
  }

  // -- Internal helpers -------------------------------------------------------

  /**
   * Build the Authorization header from the current token or provider.
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    let accessToken = this.token;

    if (this.tokenProvider) {
      accessToken = await this.tokenProvider();
      this.token = accessToken;
    }

    if (!accessToken) {
      return {};
    }

    return { Authorization: `Bearer ${accessToken}` };
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshTokenValue) {
      throw new ServerError(401, "Unauthorized", "No refresh token available");
    }

    const result = await this.serverClient.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { refreshToken: this.refreshTokenValue },
    );

    this.token = result.accessToken;
    this.refreshTokenValue = result.refreshToken;

    if (this.onTokenRefresh) {
      this.onTokenRefresh(result);
    }
  }

  /**
   * Perform an authenticated GET request with automatic 401 retry.
   */
  private async authenticatedGet<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    try {
      return await this.serverClient.get<T>(path, headers);
    } catch (err) {
      if (err instanceof ServerError && err.status === 401 && this.refreshTokenValue) {
        await this.refreshAccessToken();
        const newHeaders = await this.getAuthHeaders();
        return this.serverClient.get<T>(path, newHeaders);
      }
      throw err;
    }
  }

  /**
   * Perform an authenticated POST request with automatic 401 retry.
   */
  private async authenticatedPost<T>(path: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    try {
      return await this.serverClient.post<T>(path, body, headers);
    } catch (err) {
      if (err instanceof ServerError && err.status === 401 && this.refreshTokenValue) {
        await this.refreshAccessToken();
        const newHeaders = await this.getAuthHeaders();
        return this.serverClient.post<T>(path, body, newHeaders);
      }
      throw err;
    }
  }

  /**
   * Perform an authenticated PUT request with automatic 401 retry.
   */
  private async authenticatedPut<T>(path: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    try {
      return await this.serverClient.put<T>(path, body, headers);
    } catch (err) {
      if (err instanceof ServerError && err.status === 401 && this.refreshTokenValue) {
        await this.refreshAccessToken();
        const newHeaders = await this.getAuthHeaders();
        return this.serverClient.put<T>(path, body, newHeaders);
      }
      throw err;
    }
  }

  /**
   * Perform an authenticated DELETE request with automatic 401 retry.
   */
  private async authenticatedDelete<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    try {
      return await this.serverClient.delete<T>(path, headers);
    } catch (err) {
      if (err instanceof ServerError && err.status === 401 && this.refreshTokenValue) {
        await this.refreshAccessToken();
        const newHeaders = await this.getAuthHeaders();
        return this.serverClient.delete<T>(path, newHeaders);
      }
      throw err;
    }
  }
}
