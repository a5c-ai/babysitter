import { resilientFetch } from '@/lib/fetcher';

export interface ApproveBreakpointResult {
  success: boolean;
  error?: string;
}

export async function approveBreakpoint(
  runId: string,
  effectId: string,
  answer: string,
): Promise<ApproveBreakpointResult> {
  const trimmedAnswer = answer.trim();
  if (!runId || !effectId || !trimmedAnswer) {
    return { success: false, error: 'Run ID, effect ID, and answer are required' };
  }

  const response = await resilientFetch<{ success?: boolean; error?: string }>(
    `/api/runs/${encodeURIComponent(runId)}/tasks/${encodeURIComponent(effectId)}/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer: trimmedAnswer }),
      retries: 0,
    },
  );

  if (!response.ok) {
    return { success: false, error: response.error.message };
  }

  if (response.data.success !== true) {
    return { success: false, error: response.data.error ?? 'Breakpoint approval failed' };
  }

  return { success: true };
}
