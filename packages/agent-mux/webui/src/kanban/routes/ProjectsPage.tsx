"use client";

import Link from "next/link";
import { FolderGit2, ListTodo, Layers, Workflow, Users } from "lucide-react";

import { useBacklog } from "@/hooks/use-backlog";
import { PageSection, PageShell } from "@/components/shared/page-shell";

export default function ProjectsPage() {
  const { snapshot, summary, loading, error } = useBacklog();

  if (loading && !snapshot) {
    return (
      <PageShell>
        <div className="w-full animate-pulse rounded-3xl border border-border bg-card p-6">
          <div className="h-5 w-48 rounded bg-background-secondary" />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-40 rounded-2xl bg-background-secondary" />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !snapshot) {
    return (
      <PageShell>
        <div className="w-full rounded-3xl border border-error/25 bg-error-muted p-6 text-sm text-error">
          Failed to load project planning workspace.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageSection>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Projects</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Planning starts from projects and board routes now
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-foreground-muted">
          The main surface is no longer a dashboard-first run list. Choose a project board, switch
          to list mode when you need linear triage, and use the routed workspace to move issues,
          filter planning state, and provision execution context.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-foreground-muted">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
            <FolderGit2 className="h-4 w-4" />
            {snapshot.projects.length} project boards
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
            <Workflow className="h-4 w-4" />
            {summary?.issueCount ?? 0} issues tracked
          </span>
        </div>
      </PageSection>

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        {snapshot.projects.map((project) => (
          <article key={project.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  {project.key}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{project.name}</h2>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
                {project.metrics.totalIssues} issues
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background p-3 text-sm text-foreground-muted">
                <div className="font-semibold text-foreground">{project.metrics.inProgressIssues}</div>
                <div>Active work</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-sm text-foreground-muted">
                <div className="font-semibold text-foreground">{project.metrics.readyIssues}</div>
                <div>Ready issues</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-sm text-foreground-muted">
                <div className="font-semibold text-foreground">{project.team.members.length}</div>
                <div>Collaborators</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground-muted">
              {project.labels.slice(0, 4).map((label) => (
                <span key={label.id} className="rounded-full border border-border px-2.5 py-1">
                  {label.name}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/projects/${project.id}/board`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary"
              >
                <Layers className="h-4 w-4" />
                Open board
              </Link>
              <Link
                href={`/projects/${project.id}/list`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
              >
                <ListTodo className="h-4 w-4" />
                Open list
              </Link>
              <Link
                href={`/projects/${project.id}/workspaces/new`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
              >
                <FolderGit2 className="h-4 w-4" />
                Create workspace
              </Link>
              <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground-muted">
                <Users className="h-4 w-4" />
                {project.team.members.length} teammates on this board
              </span>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
