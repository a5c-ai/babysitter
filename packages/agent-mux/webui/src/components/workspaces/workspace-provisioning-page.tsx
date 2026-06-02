"use client";

import { Link } from "react-router-dom-v6";
import { useNavigate } from "react-router-dom-v6";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@a5c-ai/compendium";
import { useBacklog } from "@/hooks/use-backlog";

import type { KanbanIntegrationProvider } from "@a5c-ai/agent-mux-comm/kanban";

type WorkspaceProvisionMode = "host" | "project" | "issue";

type WorkspaceProvisionResponse = {
  workspace: {
    workspacePath: string;
    workspaceName: string;
    branchName: string;
  };
};

function projectIssueHref(projectId: string, issueId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}`;
}

function projectBoardHref(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/board`;
}

function providerLabel(provider: KanbanIntegrationProvider): string {
  return provider === "azure-repos" ? "Azure Repos" : "GitHub";
}

function createDefaultWorkspaceName(input: {
  mode: WorkspaceProvisionMode;
  projectKey?: string;
  issueKey?: string;
  hostProvider?: KanbanIntegrationProvider;
}): string {
  if (input.mode === "issue" && input.issueKey) {
    return input.issueKey;
  }
  if (input.mode === "host" && input.projectKey && input.hostProvider) {
    return `${input.projectKey}-${input.hostProvider}`;
  }
  return input.projectKey ?? "workspace";
}

export function WorkspaceProvisioningPage(props: {
  mode: WorkspaceProvisionMode;
  projectId?: string;
  issueId?: string;
}) {
  const navigate = useNavigate();
  const { snapshot, loading, error } = useBacklog();
  const [selectedProjectId, setSelectedProjectId] = useState(props.projectId ?? "");
  const [selectedHostProvider, setSelectedHostProvider] = useState<KanbanIntegrationProvider | "">("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const projects = snapshot?.projects ?? [];
  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === selectedProjectId) ??
      (props.projectId ? undefined : projects[0]),
    [projects, props.projectId, selectedProjectId],
  );
  const selectedIssue = useMemo(
    () =>
      props.issueId
        ? snapshot?.issues.find(
            (issue) =>
              issue.id === props.issueId &&
              (!selectedProject || issue.projectId === selectedProject.id),
          )
        : undefined,
    [props.issueId, selectedProject, snapshot?.issues],
  );
  const availableIntegrations = selectedProject?.integrations ?? [];

  useEffect(() => {
    if (!selectedProjectId && selectedProject?.id) {
      setSelectedProjectId(selectedProject.id);
    }
  }, [selectedProject?.id, selectedProjectId]);

  useEffect(() => {
    if (availableIntegrations.length === 0) {
      setSelectedHostProvider("");
      return;
    }

    if (
      selectedHostProvider &&
      availableIntegrations.some((integration) => integration.provider === selectedHostProvider)
    ) {
      return;
    }

    const preferred =
      availableIntegrations.find((integration) =>
        integration.prerequisites.every((prerequisite) => prerequisite.satisfied),
      ) ?? availableIntegrations[0];
    setSelectedHostProvider(preferred?.provider ?? "");
  }, [availableIntegrations, selectedHostProvider]);

  useEffect(() => {
    setWorkspaceName(
      createDefaultWorkspaceName({
        mode: props.mode,
        projectKey: selectedProject?.key,
        issueKey: selectedIssue?.key,
        hostProvider: selectedHostProvider || undefined,
      }),
    );
  }, [props.mode, selectedHostProvider, selectedIssue?.key, selectedProject?.key]);

  const selectedIntegration = useMemo(
    () =>
      availableIntegrations.find((integration) => integration.provider === selectedHostProvider),
    [availableIntegrations, selectedHostProvider],
  );

  const title =
    props.mode === "issue"
      ? "Create issue-owned workspace"
      : props.mode === "project"
        ? "Create project-owned workspace"
        : "Create host-scoped workspace";
  const description =
    props.mode === "issue"
      ? "This route provisions a workspace from the current issue and redirects directly into the workspace shell."
      : props.mode === "project"
        ? "This route provisions a workspace owned by the current project without requiring an issue-first entry point."
        : "This route starts from the workspace host surface and still records the selected project and host context explicitly.";

  const cancelHref =
    props.mode === "issue" && selectedIssue
      ? projectIssueHref(selectedIssue.projectId, selectedIssue.id)
      : selectedProject
        ? projectBoardHref(selectedProject.id)
        : "/workspaces";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !workspaceName.trim()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "provision",
          scope: props.mode,
          projectId: selectedProject.id,
          issueId: props.mode === "issue" ? selectedIssue?.id : undefined,
          hostProvider:
            props.mode === "host" || props.mode === "project"
              ? selectedHostProvider || undefined
              : selectedHostProvider || undefined,
          workspaceName: workspaceName.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Workspace provisioning failed: ${response.status}`);
      }

      const payload = (await response.json()) as WorkspaceProvisionResponse;
      navigate(`/workspaces?workspace=${encodeURIComponent(payload.workspace.workspacePath)}`);
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-1 px-4 py-6 sm:px-6">
        <section className="w-full animate-pulse rounded-3xl border border-border bg-card p-6">
          <div className="h-5 w-48 rounded bg-background-secondary" />
          <div className="mt-4 h-20 rounded-2xl bg-background-secondary" />
        </section>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-1 px-4 py-6 sm:px-6">
        <section className="w-full rounded-3xl border border-error/25 bg-error-muted p-6 text-sm text-error">
          Failed to load workspace provisioning context.
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
          Workspace provisioning
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">{description}</p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {props.mode === "host" ? (
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Project
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.key} - {project.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedProject ? (
            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
              <div className="font-semibold text-foreground">{selectedProject.key}</div>
              <div className="mt-1">{selectedProject.name}</div>
              {selectedIssue ? (
                <div className="mt-3 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground-muted">
                  Issue owner: <span className="font-semibold text-foreground">{selectedIssue.key}</span> ·{" "}
                  {selectedIssue.title}
                </div>
              ) : null}
            </div>
          ) : null}

          {availableIntegrations.length > 0 ? (
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Host context
              <select
                value={selectedHostProvider}
                onChange={(event) =>
                  setSelectedHostProvider(event.target.value as KanbanIntegrationProvider | "")
                }
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                {availableIntegrations.map((integration) => (
                  <option key={integration.provider} value={integration.provider}>
                    {integration.label} · {integration.accountLabel ?? integration.status}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedIntegration ? (
            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
              <div className="font-semibold text-foreground">
                {providerLabel(selectedIntegration.provider)} ownership metadata will be attached
              </div>
              <div className="mt-1">{selectedIntegration.guidance}</div>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-foreground">
            Workspace name
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              placeholder="workspace name"
            />
          </label>

          {submitError ? (
            <div className="rounded-2xl border border-error/25 bg-error-muted px-4 py-3 text-sm text-error">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={!selectedProject || !workspaceName.trim()} loading={submitting}>
              Create workspace
            </Button>
            <Button variant="ghost" onClick={() => navigate(cancelHref)}>
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
