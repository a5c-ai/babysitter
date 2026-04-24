"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { RequireGatewayAuth } from "@/components/agent-mux/require-gateway-auth";
import { Button } from "@/components/ui/button";
import { useRun } from "@/lib/agent-mux-ui";

export default function SessionPendingPage() {
  return (
    <RequireGatewayAuth>
      <SessionPendingContent />
    </RequireGatewayAuth>
  );
}

function SessionPendingContent() {
  const router = useRouter();
  const params = useParams<{ runId: string }>();
  const runId = params.runId ?? "";
  const run = useRun(runId);

  useEffect(() => {
    if (typeof run?.sessionId === "string" && run.sessionId.length > 0) {
      router.replace(`/sessions/${run.sessionId}`);
    }
  }, [router, run?.sessionId]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Creating session</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{runId || "pending session"}</h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          The harness has started the run but has not emitted the session id yet. This page will redirect
          into the live session as soon as agent-mux exposes it.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Agent</div>
            <div className="mt-2 text-sm font-medium">{String(run?.agent ?? "unknown")}</div>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">State</div>
            <div className="mt-2 text-sm font-medium">{String(run?.status ?? "starting")}</div>
          </div>
        </div>
        <div className="mt-6">
          <Button asChild size="sm" variant="ghost">
            <Link href="/sessions">Back to sessions</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
