// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RuntimeLogger = (...args: any[]) => void;

export interface MetricPayload extends Record<string, unknown> {
  metric: string;
}

export function emitRuntimeMetric(
  logger: RuntimeLogger | undefined,
  metric: string,
  payload: Record<string, unknown> = {}
): void {
  if (!logger) return;
  const entry: MetricPayload = { metric, ...payload };
  try {
    logger(entry);
  } catch {
    // Swallow logger failures to avoid breaking orchestrations.
  }
}
