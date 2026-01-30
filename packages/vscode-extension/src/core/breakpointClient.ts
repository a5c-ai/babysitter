export type BreakpointFile = {
  path: string;
  format?: string;
  language?: string;
  label?: string;
};

export type BreakpointContext = {
  runId?: string;
  files?: BreakpointFile[];
};

export type BreakpointPayload = {
  question: string;
  context: BreakpointContext;
};

export type CreateBreakpointOptions = {
  apiUrl: string;
  agentId?: string;
  title?: string;
  payload: BreakpointPayload;
  tags?: string[];
  ttlSeconds?: number;
};

export type BreakpointFeedback = {
  id: string;
  author: string;
  comment: string;
  createdAt: string;
};

export type BreakpointStatus = 'waiting' | 'released' | 'expired' | 'cancelled';

export type BreakpointDetails = {
  breakpointId: string;
  status: BreakpointStatus;
  agentId: string;
  runId: string | null;
  title: string;
  payload: BreakpointPayload;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  feedback: BreakpointFeedback[];
};

export type CreateBreakpointResult = {
  breakpointId: string;
  status: BreakpointStatus;
  createdAt: string;
};

async function httpJson<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.AGENT_TOKEN) {
    headers.Authorization = `Bearer ${process.env.AGENT_TOKEN}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      (errorBody as { error?: string }).error ||
        `Breakpoint API request failed (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export async function createBreakpoint(
  options: CreateBreakpointOptions,
): Promise<CreateBreakpointResult> {
  const body = {
    agentId: options.agentId || 'codex',
    title: options.title || 'Breakpoint',
    payload: options.payload,
    tags: options.tags || [],
    ttlSeconds: options.ttlSeconds,
  };

  return httpJson<CreateBreakpointResult>('POST', `${options.apiUrl}/api/breakpoints`, body);
}

export async function getBreakpointStatus(
  apiUrl: string,
  breakpointId: string,
): Promise<{ status: BreakpointStatus }> {
  return httpJson<{ status: BreakpointStatus }>(
    'GET',
    `${apiUrl}/api/breakpoints/${breakpointId}/status`,
  );
}

export async function getBreakpointDetails(
  apiUrl: string,
  breakpointId: string,
): Promise<BreakpointDetails> {
  return httpJson<BreakpointDetails>('GET', `${apiUrl}/api/breakpoints/${breakpointId}`);
}

export async function waitForBreakpointRelease(
  apiUrl: string,
  breakpointId: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<BreakpointDetails> {
  const intervalMs = options.intervalMs || 3000;
  const timeoutMs = options.timeoutMs || 600_000; // 10 minutes
  const startTime = Date.now();

  for (;;) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Breakpoint ${breakpointId} timed out after ${timeoutMs}ms`);
    }

    const statusResult = await getBreakpointStatus(apiUrl, breakpointId);
    if (statusResult.status !== 'waiting') {
      return getBreakpointDetails(apiUrl, breakpointId);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
