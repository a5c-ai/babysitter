"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";

// ============================================================================
// Types
// ============================================================================

interface LayerStats {
  eventCount: number;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
}

interface RunCompressionStats {
  runId: string;
  date: string;
  eventCount: number;
  originalTokens: number;
  compressedTokens: number;
  tokensSaved: number;
  reductionPct: number;
  byLayer: Record<string, LayerStats>;
}

interface AggregateStats {
  totalRuns: number;
  totalEvents: number;
  totalOriginalTokens: number;
  totalCompressedTokens: number;
  totalTokensSaved: number;
  overallReductionPct: number;
  runs: RunCompressionStats[];
}

// ============================================================================
// Helpers
// ============================================================================

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function pctColor(pct: number): string {
  if (pct >= 50) return "text-[#00FF88]";
  if (pct >= 20) return "text-[var(--scifi-cyan)]";
  return "text-[rgba(255,255,255,0.6)]";
}

// ============================================================================
// Components
// ============================================================================

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.5)]">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
        {sub && <p className="mt-1 text-xs text-[rgba(255,255,255,0.4)]">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function RunTable({ runs }: { runs: RunCompressionStats[] }) {
  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-[rgba(255,255,255,0.4)]">No compression events recorded yet.</p>
          <p className="mt-2 text-xs text-[rgba(255,255,255,0.3)]">
            Compression data appears when COMPRESSION_APPLIED events are written to run journals.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...runs].sort((a, b) => b.tokensSaved - a.tokensSaved);

  return (
    <div className="overflow-x-auto rounded-lg border border-[rgba(0,223,223,0.15)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(0,223,223,0.15)] bg-[rgba(0,223,223,0.05)]">
            <th className="px-4 py-3 text-left font-medium text-[rgba(255,255,255,0.5)]">Run ID</th>
            <th className="px-4 py-3 text-left font-medium text-[rgba(255,255,255,0.5)]">Date</th>
            <th className="px-4 py-3 text-right font-medium text-[rgba(255,255,255,0.5)]">Events</th>
            <th className="px-4 py-3 text-right font-medium text-[rgba(255,255,255,0.5)]">Original</th>
            <th className="px-4 py-3 text-right font-medium text-[rgba(255,255,255,0.5)]">Compressed</th>
            <th className="px-4 py-3 text-right font-medium text-[rgba(255,255,255,0.5)]">Saved</th>
            <th className="px-4 py-3 text-right font-medium text-[rgba(255,255,255,0.5)]">Reduction</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((run, idx) => (
            <tr
              key={run.runId}
              className={`border-b border-[rgba(255,255,255,0.05)] ${
                idx % 2 === 0 ? "bg-transparent" : "bg-[rgba(255,255,255,0.02)]"
              } hover:bg-[rgba(0,223,223,0.05)] transition-colors`}
            >
              <td className="px-4 py-3 font-mono text-xs text-[var(--scifi-cyan)]">{run.runId}</td>
              <td className="px-4 py-3 text-[rgba(255,255,255,0.6)]">
                {run.date ? new Date(run.date).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 text-right text-white">{fmtNum(run.eventCount)}</td>
              <td className="px-4 py-3 text-right text-[rgba(255,255,255,0.6)]">
                {fmtNum(run.originalTokens)}
              </td>
              <td className="px-4 py-3 text-right text-[rgba(255,255,255,0.6)]">
                {fmtNum(run.compressedTokens)}
              </td>
              <td className="px-4 py-3 text-right text-[#00FF88]">
                {fmtNum(run.tokensSaved)}
              </td>
              <td className={`px-4 py-3 text-right font-bold ${pctColor(run.reductionPct)}`}>
                {fmtPct(run.reductionPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function CompressionPage() {
  const [stats, setStats] = React.useState<AggregateStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/compression");
        if (!res.ok) {
          const text = await res.text();
          setError(`API error ${res.status}: ${text}`);
          return;
        }
        const json = (await res.json()) as { data: AggregateStats };
        setStats(json.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const summary = stats ?? {
    totalRuns: 0,
    totalEvents: 0,
    totalOriginalTokens: 0,
    totalCompressedTokens: 0,
    totalTokensSaved: 0,
    overallReductionPct: 0,
    runs: [],
  };

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Token Compression" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Token Compression</h1>
        <p className="mt-2 text-[rgba(255,255,255,0.5)]">
          Observability for babysitter token compression across all runs. Tracks{" "}
          <code className="rounded bg-[rgba(0,223,223,0.1)] px-1 text-xs text-[var(--scifi-cyan)]">
            COMPRESSION_APPLIED
          </code>{" "}
          journal events from Layers 1a, 1b, 2, and 3.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <p className="mt-1 text-xs text-red-300/70">
            The compression API endpoint may not be configured yet. Run{" "}
            <code className="font-mono">babysitter tokens:stats --all</code> from the CLI for
            terminal output.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
          </>
        ) : (
          <>
            <StatCard
              label="Total Tokens Saved"
              value={fmtNum(summary.totalTokensSaved)}
              sub="across all runs"
              accent="text-[#00FF88]"
            />
            <StatCard
              label="Overall Reduction"
              value={fmtPct(summary.overallReductionPct)}
              sub="tokens eliminated"
              accent={pctColor(summary.overallReductionPct)}
            />
            <StatCard
              label="Runs with Compression"
              value={fmtNum(summary.totalRuns)}
              sub="runs recorded"
            />
            <StatCard
              label="Compression Events"
              value={fmtNum(summary.totalEvents)}
              sub="COMPRESSION_APPLIED events"
            />
          </>
        )}
      </section>

      {/* Token flow */}
      {!isLoading && summary.totalOriginalTokens > 0 && (
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.5)]">
                Token Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-[rgba(255,255,255,0.4)]">Original: </span>
                  <span className="font-bold text-white">{fmtNum(summary.totalOriginalTokens)}</span>
                </div>
                <div className="text-[rgba(255,255,255,0.3)]">→</div>
                <div>
                  <span className="text-[rgba(255,255,255,0.4)]">Compressed: </span>
                  <span className="font-bold text-white">{fmtNum(summary.totalCompressedTokens)}</span>
                </div>
                <div className="text-[rgba(255,255,255,0.3)]">→</div>
                <div>
                  <span className="text-[rgba(255,255,255,0.4)]">Saved: </span>
                  <span className="font-bold text-[#00FF88]">{fmtNum(summary.totalTokensSaved)}</span>
                  <span className="ml-2 text-[rgba(255,255,255,0.4)]">
                    ({fmtPct(summary.overallReductionPct)})
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--scifi-cyan)] to-[#00FF88] transition-all"
                  style={{
                    width: `${Math.min(100, summary.overallReductionPct)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-[rgba(255,255,255,0.3)]">
                {fmtPct(summary.overallReductionPct)} reduction
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Per-run table */}
      <section>
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-white">Per-Run Breakdown</h2>
          <p className="text-sm text-[rgba(255,255,255,0.4)]">
            Runs sorted by tokens saved. Only runs with at least one{" "}
            <code className="rounded bg-[rgba(0,223,223,0.1)] px-1 text-xs text-[var(--scifi-cyan)]">
              COMPRESSION_APPLIED
            </code>{" "}
            event are shown.
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
          </div>
        ) : (
          <RunTable runs={summary.runs} />
        )}
      </section>
    </PageContainer>
  );
}
