"use client";

import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-core/kanban";

import { cx } from "@a5c-ai/compendium";

export function ExecutionContextPanel(props: {
  contexts: readonly KanbanExecutionContextEnvelope[];
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  if (props.contexts.length === 0) {
    return null;
  }

  return (
    <section className={cx("rounded-3xl border border-border bg-card p-5 shadow-lg", props.className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Execution context</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">{props.title ?? "Attached dispatch context"}</h3>
          {props.description ? (
            <p className="mt-2 max-w-3xl text-sm text-foreground-muted">{props.description}</p>
          ) : null}
        </div>
        <span className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
          {props.contexts.length} linked issue{props.contexts.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={cx("mt-4 grid gap-4", props.compact ? "" : "xl:grid-cols-2")}>
        {props.contexts.map((context) => (
          <article key={context.issue.id} className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {context.project.key ? (
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                  {context.project.key}
                </span>
              ) : null}
              <span className="rounded-full border border-info/20 bg-info/10 px-2 py-0.5 text-xs text-info">
                {context.issue.key}
              </span>
              <span className="text-xs text-foreground-muted">{context.issue.id}</span>
            </div>

            <h4 className="mt-3 text-sm font-semibold text-foreground">{context.issue.title}</h4>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                Applied labels ({context.dispatch.labelIds.length})
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {context.dispatch.labels.map((label) => (
                  <span
                    key={label.labelId}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground-secondary"
                  >
                    {label.label} · {label.key}
                  </span>
                ))}
                {context.dispatch.labels.length === 0 && context.dispatch.labelIds.length > 0
                  ? context.dispatch.labelIds.map((labelId) => (
                    <span
                      key={labelId}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground-secondary"
                    >
                      {labelId}
                    </span>
                  ))
                  : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs text-foreground-muted">
              <span>Run IDs: {context.dispatch.runIds.length > 0 ? context.dispatch.runIds.join(", ") : "none"}</span>
              <span>Session IDs: {context.dispatch.sessionIds.length > 0 ? context.dispatch.sessionIds.join(", ") : "none"}</span>
              <span>Last dispatched: {context.dispatch.lastDispatchedAt ?? "none"}</span>
            </div>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Rendered block</div>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                {context.block}
              </pre>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
