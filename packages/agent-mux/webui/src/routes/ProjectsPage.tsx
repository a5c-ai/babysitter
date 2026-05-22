"use client";

import { Link } from "react-router-dom-v6";
import { FolderGit2, ListTodo, Layers, Workflow, Users } from "lucide-react";

import { useBacklog } from "@/hooks/use-backlog";
import { PageSection, PageShell } from "@/components/shared/page-shell";

export default function ProjectsPage() {
  const { snapshot, summary, loading, error } = useBacklog();

  if (loading && !snapshot) {
    return (
      <PageShell>
        <div className="projects-page__loading">
          <div className="projects-page__loading-title" />
          <div className="projects-page__loading-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="projects-page__loading-card" />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !snapshot) {
    return (
      <PageShell>
        <div className="projects-page__error">Failed to load project planning workspace.</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageSection className="projects-page__hero">
        <p className="page-kicker">Projects</p>
        <h1 className="page-title">Planning starts from projects and board routes now</h1>
        <p className="page-copy page-copy--wide">
          The main surface is no longer a dashboard-first run list. Choose a project board, switch
          to list mode when you need linear triage, and use the routed workspace to move issues,
          filter planning state, and provision execution context.
        </p>
        <div className="page-chip-row">
          <span className="page-chip">
            <FolderGit2 className="h-4 w-4" />
            {snapshot.projects.length} project boards
          </span>
          <span className="page-chip">
            <Workflow className="h-4 w-4" />
            {summary?.issueCount ?? 0} issues tracked
          </span>
        </div>
      </PageSection>

      <section className="projects-page__grid">
        {snapshot.projects.map((project) => (
          <article key={project.id} className="projects-page__card">
            <div className="projects-page__card-header">
              <div>
                <p className="page-kicker page-kicker--compact">{project.key}</p>
                <h2 className="projects-page__card-title">{project.name}</h2>
              </div>
              <span className="page-chip page-chip--muted">
                {project.metrics.totalIssues} issues
              </span>
            </div>

            <div className="projects-page__stats">
              <div className="projects-page__stat">
                <div className="projects-page__stat-value">{project.metrics.inProgressIssues}</div>
                <div>Active work</div>
              </div>
              <div className="projects-page__stat">
                <div className="projects-page__stat-value">{project.metrics.readyIssues}</div>
                <div>Ready issues</div>
              </div>
              <div className="projects-page__stat">
                <div className="projects-page__stat-value">{project.team.members.length}</div>
                <div>Collaborators</div>
              </div>
            </div>

            <div className="projects-page__labels">
              {project.labels.slice(0, 4).map((label) => (
                <span key={label.id} className="page-chip page-chip--muted">
                  {label.name}
                </span>
              ))}
            </div>

            <div className="projects-page__actions">
              <Link to={`/projects/${project.id}/board`} className="projects-page__action projects-page__action--primary">
                <Layers className="h-4 w-4" />
                Open board
              </Link>
              <Link to={`/projects/${project.id}/list`} className="projects-page__action">
                <ListTodo className="h-4 w-4" />
                Open list
              </Link>
              <Link to={`/projects/${project.id}/workspaces/new`} className="projects-page__action">
                <FolderGit2 className="h-4 w-4" />
                Create workspace
              </Link>
              <span className="projects-page__action projects-page__action--static">
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
