"use client";

import type { DispatchContextAuditRecord } from "@/lib/dispatch-context-audit";

export function DispatchContextAuditPanel(props: {
  title: string;
  audits: readonly DispatchContextAuditRecord[];
  emptyText: string;
  className?: string;
}) {
  return (
    <section className={props.className}>
      <h3 className="text-lg font-semibold tracking-tight">{props.title}</h3>
      {props.audits.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-foreground-muted">
          {props.emptyText}
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {props.audits.map((audit) => (
            <article key={`${audit.issueId}-${audit.lastDispatchedAt ?? "pending"}`} className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{audit.issueKey}</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{audit.issueTitle}</div>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                  {audit.executionContext.metadata.labelCount} label{audit.executionContext.metadata.labelCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                {audit.executionContext.appliedLabels.map((label) => (
                  <span key={`${audit.issueId}-${label.labelId}`} className="rounded-full border border-border px-2.5 py-1">
                    {label.key}
                  </span>
                ))}
              </div>

              <div className="mt-3 grid gap-2 text-xs text-foreground-muted md:grid-cols-3">
                <AuditMeta label="Source" value={audit.executionContext.source} />
                <AuditMeta label="Label ids" value={audit.executionContext.metadata.labelIds.join(", ")} />
                <AuditMeta label="Last dispatched" value={audit.lastDispatchedAt ? new Date(audit.lastDispatchedAt).toLocaleString() : "Unavailable"} />
              </div>

              <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                {audit.executionContext.renderedBlock}
              </pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AuditMeta(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/80 px-3 py-2">
      <div className="uppercase tracking-[0.18em]">{props.label}</div>
      <div className="mt-1 break-words font-mono text-[11px] text-foreground-secondary">{props.value}</div>
    </div>
  );
}
