"use client";

import { useEffect, useState, type FormEvent } from "react";
import type {
  KanbanIntegrationConnection,
  KanbanPermissionGrant,
  KanbanProjectSettings,
  KanbanTaskTag,
  KanbanCollaboratorRole,
} from "@a5c-ai/agent-mux-comm/kanban";
import { LogoWordmark } from "@a5c-ai/compendium";
import { Activity, AlertTriangle, Boxes, Cpu, Network, ServerCog, ShieldCheck, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom-v6";
import { useStore } from "zustand";

import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { useNotificationContext } from "@/components/notifications/notification-provider";
import { PageSection, PageShell } from "@/components/shared/page-shell";
import { SHORTCUT_SECTION_LABELS, SHORTCUTS } from "@/components/shared/shortcuts-help";
import { useTheme } from "@/components/shared/theme-provider";
import { Button } from "@a5c-ai/compendium";
import {
  createDispatchContextLabel,
  createTaskTag,
  deleteDispatchContextLabel,
  deleteTaskTag,
  loadTaskTags,
  updateDispatchContextLabel,
  updateTaskTag,
  useBacklog,
} from "@/hooks/use-backlog";
import { resilientFetch } from "@/lib/fetcher";
import { useConnection, useGateway } from "@/lib/agent-mux-ui";

interface DispatchContextLabelFormState {
  key: string;
  label: string;
  description: string;
  instruction: string;
}

function createEmptyDispatchContextLabelForm(): DispatchContextLabelFormState {
  return {
    key: "",
    label: "",
    description: "",
    instruction: "",
  };
}

type SettingsSectionId =
  | "general"
  | "repositories-projects"
  | "organization"
  | "remote-project"
  | "agent-configuration"
  | "mcp-servers"
  | "editor-integration"
  | "git"
  | "notifications"
  | "task-tags"
  | "keyboard-shortcuts";

interface SettingsSectionDefinition {
  id: SettingsSectionId;
  title: string;
  summary: string;
  icon: typeof Boxes;
}

interface AgentConfigurationItem {
  agent: string;
  displayName: string;
  configuredModel: string;
  configuredProvider: string;
  approvalMode: "yolo" | "prompt" | "deny";
  maxTokens: string;
  availableModels: Array<{
    modelId: string;
    provider?: string;
    isDefault: boolean;
    deprecated?: boolean;
    successorModelId?: string;
  }>;
  defaultModel: string;
}

interface AgentConfigurationResponse {
  agents: AgentConfigurationItem[];
}

interface AgentConfigurationSaveInput {
  agent: string;
  model: string;
  provider: string;
  approvalMode: "yolo" | "prompt" | "deny";
  maxTokens: string;
}

interface McpServerDraft {
  name: string;
  transport: "stdio" | "sse" | "streamable-http";
  command: string;
  url: string;
  argsText: string;
  envText: string;
}

interface McpServerItem {
  agent: string;
  displayName: string;
  servers: McpServerDraft[];
}

interface McpServerResponse {
  agents: McpServerItem[];
}

interface RemoteSectionState<T> {
  status: "idle" | "loading" | "ready" | "error";
  data: T | null;
  error: string | null;
}

interface RepositorySettingsDraft {
  id: string;
  fullName: string;
  linkedIssueId: string | null;
  baseBranch: string;
  ciProvider: string;
  publishTarget: string;
  autoMerge: boolean;
  requiredApprovals: number;
}

interface RepositoriesProjectsDraft {
  reviewRequiredForDone: boolean;
  activityScope: KanbanProjectSettings["activityScope"];
  workspaceProvisioning: KanbanProjectSettings["workspaceProvisioning"];
  repositories: RepositorySettingsDraft[];
}

interface OrganizationDraft {
  teamName: string;
  visibility: "private" | "team" | "workspace-shared";
  defaultRole: KanbanCollaboratorRole;
  allowSelfAssign: boolean;
}

const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  {
    id: "general",
    title: "General",
    summary: "Local Babysitter framing, config locations, theme, gateway access, and runtime overview.",
    icon: Activity,
  },
  {
    id: "repositories-projects",
    title: "Repositories & Projects",
    summary: "Project policy, linked repositories, and dispatch-context definitions.",
    icon: Boxes,
  },
  {
    id: "organization",
    title: "Organization",
    summary: "Team, visibility, default roles, and shared permission context.",
    icon: Users,
  },
  {
    id: "remote-project",
    title: "Remote Projects",
    summary: "Host/org/project binding state and blocked-action guidance per provider.",
    icon: Network,
  },
  {
    id: "agent-configuration",
    title: "Agent Configuration",
    summary: "Default model/provider settings with validation-aware save behavior.",
    icon: Cpu,
  },
  {
    id: "mcp-servers",
    title: "MCP Servers",
    summary: "Per-agent MCP transport definitions with draft preservation and validation.",
    icon: ServerCog,
  },
  {
    id: "editor-integration",
    title: "Editor Integration",
    summary: "Workspace-first editing flow, command-bar shortcuts, and session handoff guidance.",
    icon: Boxes,
  },
  {
    id: "git",
    title: "Git",
    summary: "Branch defaults, review policy, auto-merge posture, and provider readiness context.",
    icon: ShieldCheck,
  },
  {
    id: "notifications",
    title: "Notifications",
    summary: "In-app alerts, browser permission state, and breakpoint/run attention behavior.",
    icon: Activity,
  },
  {
    id: "task-tags",
    title: "Task Tags",
    summary: "Reusable @ snippets kept as a first-class settings surface.",
    icon: Boxes,
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    summary: "Current shortcut groups for dashboard, runs, and session workspaces.",
    icon: Cpu,
  },
];

const KANBAN_CONFIG_PATH = "~/.a5c/kanban.json";
const SETTINGS_SECTION_STORAGE_PATH = "~/.a5c/kanban-settings-sections.json";

function createEmptyRemoteState<T>(): RemoteSectionState<T> {
  return {
    status: "idle",
    data: null,
    error: null,
  };
}

function extractApiErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed.startsWith("{")) {
    return message;
  }

  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown };
    return typeof parsed.error === "string" && parsed.error.length > 0 ? parsed.error : message;
  } catch {
    return message;
  }
}

function normalizeAgentConfigurationItem(item: AgentConfigurationItem): AgentConfigurationItem {
  return {
    ...item,
    configuredModel: item.configuredModel ?? "",
    configuredProvider: item.configuredProvider ?? "",
    maxTokens: item.maxTokens ?? "",
  };
}

function normalizeMcpServerDraft(draft: McpServerDraft): McpServerDraft {
  return {
    name: draft.name.trim(),
    transport: draft.transport,
    command: draft.command.trim(),
    url: draft.url.trim(),
    argsText: draft.argsText.trim(),
    envText: draft.envText.trim(),
  };
}

function sortRepositoryDrafts(repositories: readonly RepositorySettingsDraft[]): RepositorySettingsDraft[] {
  return [...repositories].sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function createRepositoriesProjectsDraft(
  project: NonNullable<ReturnType<typeof useBacklog>["snapshot"]>["projects"][number] | undefined,
  issues: NonNullable<ReturnType<typeof useBacklog>["snapshot"]>["issues"],
): RepositoriesProjectsDraft | null {
  if (!project) {
    return null;
  }

  return {
    reviewRequiredForDone: project.settings.reviewRequiredForDone,
    activityScope: project.settings.activityScope,
    workspaceProvisioning: project.settings.workspaceProvisioning,
    repositories: sortRepositoryDrafts(
      project.repositories.map((repository) => ({
        id: repository.id,
        fullName: repository.fullName,
        linkedIssueId:
          issues.find((issue) => issue.repositoryLifecycle?.repositoryId === repository.id)?.id ?? null,
        baseBranch: repository.settings.baseBranch,
        ciProvider: repository.settings.ciProvider ?? "",
        publishTarget: repository.settings.publishTarget ?? "",
        autoMerge: repository.settings.autoMerge,
        requiredApprovals: repository.settings.requiredApprovals,
      })),
    ),
  };
}

function createOrganizationDraft(
  project: NonNullable<ReturnType<typeof useBacklog>["snapshot"]>["projects"][number] | undefined,
): OrganizationDraft | null {
  if (!project) {
    return null;
  }

  return {
    teamName: project.team.name,
    visibility: project.team.settings.visibility,
    defaultRole: project.team.settings.defaultRole,
    allowSelfAssign: project.team.settings.allowSelfAssign,
  };
}

async function loadAgentConfigurationSection(): Promise<AgentConfigurationResponse> {
  const result = await resilientFetch<AgentConfigurationResponse>("/api/settings/agent-configuration");
  if (!result.ok) {
    throw new Error(extractApiErrorMessage(result.error.message));
  }
  return {
    agents: result.data.agents.map(normalizeAgentConfigurationItem),
  };
}

async function saveAgentConfiguration(input: AgentConfigurationSaveInput): Promise<AgentConfigurationResponse> {
  const result = await resilientFetch<AgentConfigurationResponse>("/api/settings/agent-configuration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!result.ok) {
    throw new Error(extractApiErrorMessage(result.error.message));
  }
  return {
    agents: result.data.agents.map(normalizeAgentConfigurationItem),
  };
}

async function loadMcpServerSection(): Promise<McpServerResponse> {
  const result = await resilientFetch<McpServerResponse>("/api/settings/mcp-servers");
  if (!result.ok) {
    throw new Error(extractApiErrorMessage(result.error.message));
  }
  return {
    agents: result.data.agents.map((item) => ({
      ...item,
      servers: item.servers.map(normalizeMcpServerDraft),
    })),
  };
}

async function saveMcpServerSection(input: {
  agent: string;
  servers: McpServerDraft[];
}): Promise<McpServerResponse> {
  const result = await resilientFetch<McpServerResponse>("/api/settings/mcp-servers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: input.agent,
      servers: input.servers.map(normalizeMcpServerDraft),
    }),
  });
  if (!result.ok) {
    throw new Error(extractApiErrorMessage(result.error.message));
  }
  return {
    agents: result.data.agents.map((item) => ({
      ...item,
      servers: item.servers.map(normalizeMcpServerDraft),
    })),
  };
}

function isDirty<T>(baseline: T | null, draft: T | null): boolean {
  return JSON.stringify(baseline) !== JSON.stringify(draft);
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { auth, logout, isAuthenticated } = useGatewayAuth();
  const { notifications, permission, requestPermission } = useNotificationContext();
  const {
    snapshot,
    refresh,
    loading: backlogLoading,
    error: backlogError,
    updateProjectCollaboration,
    updateRepositorySettings,
  } = useBacklog();
  const project = snapshot?.projects[0];
  const dispatchContextLabels = snapshot?.dispatchContextLabels ?? [];
  const issues = snapshot?.issues ?? [];
  const [selectedSection, setSelectedSection] = useState<SettingsSectionId>("general");
  const [pendingSection, setPendingSection] = useState<SettingsSectionId | null>(null);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
  const [repoProjectBaseline, setRepoProjectBaseline] = useState<RepositoriesProjectsDraft | null>(null);
  const [repoProjectDraft, setRepoProjectDraft] = useState<RepositoriesProjectsDraft | null>(null);
  const [organizationBaseline, setOrganizationBaseline] = useState<OrganizationDraft | null>(null);
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationDraft | null>(null);
  const [repoProjectSaving, setRepoProjectSaving] = useState(false);
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [repoProjectNotice, setRepoProjectNotice] = useState<string | null>(null);
  const [organizationNotice, setOrganizationNotice] = useState<string | null>(null);
  const [repoProjectError, setRepoProjectError] = useState<string | null>(null);
  const [organizationError, setOrganizationError] = useState<string | null>(null);

  const [agentSection, setAgentSection] =
    useState<RemoteSectionState<AgentConfigurationResponse>>(createEmptyRemoteState());
  const [agentBaselineById, setAgentBaselineById] = useState<Record<string, AgentConfigurationItem>>({});
  const [agentDraftById, setAgentDraftById] = useState<Record<string, AgentConfigurationItem>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentNotice, setAgentNotice] = useState<string | null>(null);

  const [mcpSection, setMcpSection] =
    useState<RemoteSectionState<McpServerResponse>>(createEmptyRemoteState());
  const [mcpBaselineByAgent, setMcpBaselineByAgent] = useState<Record<string, McpServerDraft[]>>({});
  const [mcpDraftByAgent, setMcpDraftByAgent] = useState<Record<string, McpServerDraft[]>>({});
  const [selectedMcpAgentId, setSelectedMcpAgentId] = useState<string | null>(null);
  const [mcpSaving, setMcpSaving] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [mcpNotice, setMcpNotice] = useState<string | null>(null);
  const selectedRepository =
    repoProjectDraft?.repositories.find((repository) => repository.id === selectedRepositoryId) ??
    repoProjectDraft?.repositories[0] ??
    null;
  const linkedRepositoryCount = repoProjectDraft?.repositories.length ?? project?.repositories.length ?? 0;
  const autoMergeEnabledCount =
    repoProjectDraft?.repositories.filter((repository) => repository.autoMerge).length ??
    project?.repositories.filter((repository) => repository.settings.autoMerge).length ??
    0;
  const integrationCount = project?.integrations.length ?? 0;
  const missingIntegrationCount =
    project?.integrations.filter((integration) =>
      integration.prerequisites.some((prerequisite) => !prerequisite.satisfied),
    ).length ?? 0;
  const connectedIntegrationCount =
    project?.integrations.filter((integration) => integration.status === "connected").length ?? 0;
  const shortcutGroups = Object.entries(
    SHORTCUTS.reduce<Record<string, Array<(typeof SHORTCUTS)[number]>>>((groups, shortcut) => {
      (groups[shortcut.context] ??= []).push(shortcut);
      return groups;
    }, {}),
  );
  const sessionWorkspaceShortcuts = SHORTCUTS.filter(
    (shortcut) => shortcut.context === "session-workspace",
  );
  const browserNotificationState =
    permission === "granted"
      ? "Browser notifications allowed"
      : permission === "denied"
        ? "Browser notifications blocked"
        : "Browser notification permission pending";

  useEffect(() => {
    const nextDraft = createRepositoriesProjectsDraft(project, issues);
    if (
      !isDirty(repoProjectBaseline, repoProjectDraft) &&
      isDirty(repoProjectBaseline, nextDraft)
    ) {
      setRepoProjectBaseline(nextDraft);
      setRepoProjectDraft(nextDraft);
    } else if (repoProjectBaseline === null) {
      setRepoProjectBaseline(nextDraft);
      setRepoProjectDraft(nextDraft);
    }
  }, [issues, project, repoProjectBaseline, repoProjectDraft]);

  useEffect(() => {
    const nextDraft = createOrganizationDraft(project);
    if (
      !isDirty(organizationBaseline, organizationDraft) &&
      isDirty(organizationBaseline, nextDraft)
    ) {
      setOrganizationBaseline(nextDraft);
      setOrganizationDraft(nextDraft);
    } else if (organizationBaseline === null) {
      setOrganizationBaseline(nextDraft);
      setOrganizationDraft(nextDraft);
    }
  }, [organizationBaseline, organizationDraft, project]);

  useEffect(() => {
    if (repoProjectDraft?.repositories.length && !selectedRepositoryId) {
      setSelectedRepositoryId(repoProjectDraft.repositories[0]!.id);
    }
    if (
      selectedRepositoryId &&
      repoProjectDraft?.repositories.every((repository) => repository.id !== selectedRepositoryId)
    ) {
      setSelectedRepositoryId(repoProjectDraft.repositories[0]?.id ?? null);
    }
  }, [repoProjectDraft, selectedRepositoryId]);

  useEffect(() => {
    if (selectedSection !== "agent-configuration" || agentSection.status !== "idle") {
      return;
    }

    setAgentSection({ status: "loading", data: null, error: null });
    void loadAgentConfigurationSection()
      .then((data) => {
        setAgentSection({ status: "ready", data, error: null });
        const nextBaseline = Object.fromEntries(data.agents.map((agent) => [agent.agent, agent]));
        setAgentBaselineById(nextBaseline);
        setAgentDraftById(nextBaseline);
        setSelectedAgentId((current) => current ?? data.agents[0]?.agent ?? null);
      })
      .catch((error) => {
        setAgentSection({
          status: "error",
          data: null,
          error: error instanceof Error ? error.message : "Failed to load agent configuration.",
        });
      });
  }, [agentSection.status, selectedSection]);

  useEffect(() => {
    if (selectedSection !== "mcp-servers" || mcpSection.status !== "idle") {
      return;
    }

    setMcpSection({ status: "loading", data: null, error: null });
    void loadMcpServerSection()
      .then((data) => {
        setMcpSection({ status: "ready", data, error: null });
        const nextBaseline = Object.fromEntries(
          data.agents.map((agent) => [agent.agent, agent.servers.map(normalizeMcpServerDraft)]),
        );
        setMcpBaselineByAgent(nextBaseline);
        setMcpDraftByAgent(nextBaseline);
        setSelectedMcpAgentId((current) => current ?? data.agents[0]?.agent ?? null);
      })
      .catch((error) => {
        setMcpSection({
          status: "error",
          data: null,
          error: error instanceof Error ? error.message : "Failed to load MCP servers.",
        });
      });
  }, [mcpSection.status, selectedSection]);

  const repoProjectDirty = isDirty(repoProjectBaseline, repoProjectDraft);
  const organizationDirty = isDirty(organizationBaseline, organizationDraft);
  const agentDirty = JSON.stringify(agentBaselineById) !== JSON.stringify(agentDraftById);
  const mcpDirty = JSON.stringify(mcpBaselineByAgent) !== JSON.stringify(mcpDraftByAgent);
  const activeSectionDirty =
    (selectedSection === "repositories-projects" && repoProjectDirty) ||
    (selectedSection === "organization" && organizationDirty) ||
    (selectedSection === "agent-configuration" && agentDirty) ||
    (selectedSection === "mcp-servers" && mcpDirty);

  function requestSectionChange(nextSection: SettingsSectionId) {
    if (nextSection === selectedSection) {
      return;
    }
    if (activeSectionDirty) {
      setPendingSection(nextSection);
      return;
    }
    setSelectedSection(nextSection);
    setPendingSection(null);
  }

  function discardPendingSectionDrafts() {
    if (selectedSection === "repositories-projects") {
      setRepoProjectDraft(repoProjectBaseline);
      setRepoProjectError(null);
      setRepoProjectNotice(null);
    }
    if (selectedSection === "organization") {
      setOrganizationDraft(organizationBaseline);
      setOrganizationError(null);
      setOrganizationNotice(null);
    }
    if (selectedSection === "agent-configuration") {
      setAgentDraftById(agentBaselineById);
      setAgentError(null);
      setAgentNotice(null);
    }
    if (selectedSection === "mcp-servers") {
      setMcpDraftByAgent(mcpBaselineByAgent);
      setMcpError(null);
      setMcpNotice(null);
    }
    if (pendingSection) {
      setSelectedSection(pendingSection);
      setPendingSection(null);
    }
  }

  async function handleSaveRepositoriesProjects() {
    if (!project || !repoProjectDraft || !repoProjectBaseline) {
      return;
    }

    setRepoProjectSaving(true);
    setRepoProjectError(null);
    setRepoProjectNotice(null);
    try {
      if (
        repoProjectDraft.reviewRequiredForDone !== repoProjectBaseline.reviewRequiredForDone ||
        repoProjectDraft.activityScope !== repoProjectBaseline.activityScope ||
        repoProjectDraft.workspaceProvisioning !== repoProjectBaseline.workspaceProvisioning
      ) {
        await updateProjectCollaboration({
          projectId: project.id,
          teamName: project.team.name,
          visibility: project.team.settings.visibility,
          defaultRole: project.team.settings.defaultRole,
          allowSelfAssign: project.team.settings.allowSelfAssign,
          reviewRequiredForDone: repoProjectDraft.reviewRequiredForDone,
          activityScope: repoProjectDraft.activityScope,
          workspaceProvisioning: repoProjectDraft.workspaceProvisioning,
          members: project.team.members.map((member) => ({
            id: member.id,
            displayName: member.displayName,
            email: member.email,
            role: member.role,
          })),
          permissions: project.permissions.map((permission) => ({
            action: permission.action,
            description: permission.description,
            roles: [...permission.roles],
          })),
        });
      }

      for (const repository of repoProjectDraft.repositories) {
        const baseline = repoProjectBaseline.repositories.find((candidate) => candidate.id === repository.id);
        if (!baseline) {
          continue;
        }
        if (JSON.stringify(repository) === JSON.stringify(baseline)) {
          continue;
        }
        if (!repository.linkedIssueId) {
          throw new Error(
            `Repository ${repository.fullName} is missing the linked issue/work item context required for persistence.`,
          );
        }
        await updateRepositorySettings({
          issueId: repository.linkedIssueId,
          baseBranch: repository.baseBranch,
          ciProvider: repository.ciProvider || undefined,
          publishTarget: repository.publishTarget || undefined,
          autoMerge: repository.autoMerge,
          requiredApprovals: repository.requiredApprovals,
        });
      }

      await refresh();
      setRepoProjectBaseline(repoProjectDraft);
      setRepoProjectDraft(repoProjectDraft);
      setRepoProjectNotice("Saved repositories/projects settings.");
    } catch (error) {
      setRepoProjectError(
        error instanceof Error ? error.message : "Failed to save repositories/projects settings.",
      );
    } finally {
      setRepoProjectSaving(false);
    }
  }

  async function handleSaveOrganization() {
    if (!project || !organizationDraft) {
      return;
    }

    setOrganizationSaving(true);
    setOrganizationError(null);
    setOrganizationNotice(null);
    try {
      await updateProjectCollaboration({
        projectId: project.id,
        teamName: organizationDraft.teamName,
        visibility: organizationDraft.visibility,
        defaultRole: organizationDraft.defaultRole,
        allowSelfAssign: organizationDraft.allowSelfAssign,
        reviewRequiredForDone: project.settings.reviewRequiredForDone,
        activityScope: project.settings.activityScope,
        workspaceProvisioning: project.settings.workspaceProvisioning,
        members: project.team.members.map((member) => ({
          id: member.id,
          displayName: member.displayName,
          email: member.email,
          role: member.role,
        })),
        permissions: project.permissions.map((permission) => ({
          action: permission.action,
          description: permission.description,
          roles: [...permission.roles],
        })),
      });
      await refresh();
      setOrganizationBaseline(organizationDraft);
      setOrganizationDraft(organizationDraft);
      setOrganizationNotice("Saved organization settings.");
    } catch (error) {
      setOrganizationError(
        error instanceof Error ? error.message : "Failed to save organization settings.",
      );
    } finally {
      setOrganizationSaving(false);
    }
  }

  async function handleSaveAgentConfiguration() {
    if (!selectedAgentId || !agentDraftById[selectedAgentId]) {
      return;
    }

    const draft = agentDraftById[selectedAgentId]!;
    setAgentSaving(true);
    setAgentError(null);
    setAgentNotice(null);
    try {
      const response = await saveAgentConfiguration({
        agent: selectedAgentId,
        model: draft.configuredModel,
        provider: draft.configuredProvider,
        approvalMode: draft.approvalMode,
        maxTokens: draft.maxTokens,
      });
      const nextBaseline = Object.fromEntries(response.agents.map((agent) => [agent.agent, agent]));
      setAgentSection({ status: "ready", data: response, error: null });
      setAgentBaselineById(nextBaseline);
      setAgentDraftById(nextBaseline);
      setAgentNotice(`Saved agent configuration for ${selectedAgentId}.`);
    } catch (error) {
      setAgentError(
        error instanceof Error ? error.message : "Failed to save agent configuration.",
      );
    } finally {
      setAgentSaving(false);
    }
  }

  async function handleSaveMcpServers() {
    if (!selectedMcpAgentId) {
      return;
    }

    setMcpSaving(true);
    setMcpError(null);
    setMcpNotice(null);
    try {
      const response = await saveMcpServerSection({
        agent: selectedMcpAgentId,
        servers: mcpDraftByAgent[selectedMcpAgentId] ?? [],
      });
      const nextBaseline = Object.fromEntries(
        response.agents.map((agent) => [agent.agent, agent.servers.map(normalizeMcpServerDraft)]),
      );
      setMcpSection({ status: "ready", data: response, error: null });
      setMcpBaselineByAgent(nextBaseline);
      setMcpDraftByAgent(nextBaseline);
      setMcpNotice(`Saved MCP server settings for ${selectedMcpAgentId}.`);
    } catch (error) {
      setMcpError(error instanceof Error ? error.message : "Failed to save MCP servers.");
    } finally {
      setMcpSaving(false);
    }
  }

  return (
    <PageShell>
      <PageSection>
        <p className="page-kicker">Settings</p>
        <div className="page-logo">
          <LogoWordmark className="h-6 w-auto" />
        </div>
        <h1 className="page-title">Settings breadth parity</h1>
        <p className="page-copy page-copy--wide">
          The local kanban settings surface keeps its Babysitter-specific framing while expanding
          to the broader upstream settings breadth: general preferences, repositories/projects,
          organization, remote-project bindings, agents, MCP, editor integration, git,
          notifications, task tags, and keyboard shortcuts all live as explicit sections.
        </p>
      </PageSection>

      <div className="settings-layout">
        <aside className="settings-nav">
          <div className="settings-nav__label">Settings sections</div>
          <div className="settings-nav__list">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const active = section.id === selectedSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  data-testid={`settings-nav-${section.id}`}
                  onClick={() => requestSectionChange(section.id)}
                  className={[
                    "settings-nav__button",
                    active ? "settings-nav__button--active" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="settings-nav__title">
                    <Icon className="h-4 w-4" />
                    {section.title}
                  </div>
                  <div className="settings-nav__summary">{section.summary}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="settings-stack">
          {pendingSection ? (
            <section
              className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
              data-testid="settings-dirty-switch-guard"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                <div className="flex-1">
                  <div className="font-semibold text-foreground">Unsaved changes are still open.</div>
                  <div className="mt-1 text-foreground-muted">
                    Switching sections now would drop the current draft. Discard the draft or stay
                    on the current section.
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="primary" onClick={discardPendingSectionDrafts}>
                  Discard changes
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPendingSection(null)}>
                  Keep editing
                </Button>
              </div>
            </section>
          ) : null}

          {selectedSection === "general" ? (
            <section className="space-y-6" data-testid="general-settings">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <h2 className="text-xl font-semibold tracking-tight">General settings</h2>
                    <p className="mt-2 text-sm leading-6 text-foreground-muted">
                      This local surface stays opinionated for Babysitter workflows: filesystem-backed
                      config, gateway connectivity, live runs, and app theme are treated as first-class
                      operator preferences instead of being hidden behind a runtime-only modal.
                    </p>
                  </div>
                  <div className="grid min-w-[240px] gap-3 sm:grid-cols-2">
                    <SettingCard label="Theme" value={theme} />
                    <SettingCard label="Gateway" value={auth?.gatewayUrl ?? "not connected"} />
                    <SettingCard label="Notifications" value={browserNotificationState} />
                    <SettingCard label="Config files" value="2 local files" />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="text-sm font-semibold text-foreground">Local runtime framing</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <SettingCard label="Kanban config" value={KANBAN_CONFIG_PATH} />
                      <SettingCard label="Section storage" value={SETTINGS_SECTION_STORAGE_PATH} />
                      <SettingCard
                        label="Saved access"
                        value={auth ? "configured" : "missing"}
                      />
                      <SettingCard
                        label="Linked repos"
                        value={String(linkedRepositoryCount)}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="primary" onClick={() => navigate("/login")}>
                        {isAuthenticated ? "Reconnect gateway" : "Connect gateway"}
                      </Button>
                      {isAuthenticated ? (
                        <Button onClick={() => logout()} variant="ghost" type="button">
                          Forget access
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="text-sm font-semibold text-foreground">Breadth without losing local voice</div>
                    <div className="mt-3 space-y-3 text-sm text-foreground-muted">
                      <p>
                        Repositories, organization, remote-project bindings, agent configuration,
                        MCP servers, editor integration, git, notifications, task tags, and keyboard
                        shortcuts are all navigable here.
                      </p>
                      <p>
                        The local package still centers Babysitter operations: linked repository
                        defaults, workspace-driven editing, run attention, and filesystem-backed
                        configuration remain visible instead of being flattened into generic settings copy.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <SettingsConnected />
            </section>
          ) : null}

          {selectedSection === "repositories-projects" ? (
            <section className="space-y-6" data-testid="repositories-projects-settings">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <h2 className="text-xl font-semibold tracking-tight">Repositories and projects</h2>
                    <p className="mt-2 text-sm leading-6 text-foreground-muted">
                      Shared project policy and linked repository defaults live here, alongside the
                      reusable authoring surfaces that stay tied to project execution context.
                    </p>
                  </div>
                  <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                    <SettingCard label="Projects" value={String(snapshot?.projects.length ?? 0)} />
                    <SettingCard
                      label="Linked repos"
                      value={String(repoProjectDraft?.repositories.length ?? 0)}
                    />
                  </div>
                </div>

                {backlogLoading ? (
                  <SectionLoadingState text="Loading repositories and project settings…" />
                ) : backlogError ? (
                  <SectionErrorState
                    title="Failed to load project settings"
                    message={backlogError}
                  />
                ) : !repoProjectDraft || !project ? (
                  <SectionEmptyState
                    title="Project context is missing"
                    message="No local kanban project snapshot is available yet, so repository and project settings cannot be edited."
                  />
                ) : (
                  <div className="mt-5 space-y-5">
                    {repoProjectError ? (
                      <SectionErrorBanner message={repoProjectError} />
                    ) : null}
                    {repoProjectNotice ? (
                      <SectionNoticeBanner message={repoProjectNotice} />
                    ) : null}

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="text-sm font-semibold text-foreground">Project policy</div>
                        <div className="mt-4 grid gap-4">
                          <ToggleRow
                            label="Review required before done"
                            checked={repoProjectDraft.reviewRequiredForDone}
                            onChange={(checked) =>
                              setRepoProjectDraft((current) =>
                                current ? { ...current, reviewRequiredForDone: checked } : current,
                              )
                            }
                          />
                          <SelectRow
                            label="Activity scope"
                            value={repoProjectDraft.activityScope}
                            onChange={(value) =>
                              setRepoProjectDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      activityScope: value as KanbanProjectSettings["activityScope"],
                                    }
                                  : current,
                              )
                            }
                            options={[
                              { value: "project-and-issues", label: "Project and issues" },
                              { value: "all-board-entities", label: "All board entities" },
                            ]}
                          />
                          <SelectRow
                            label="Workspace provisioning"
                            value={repoProjectDraft.workspaceProvisioning}
                            onChange={(value) =>
                              setRepoProjectDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      workspaceProvisioning:
                                        value as KanbanProjectSettings["workspaceProvisioning"],
                                    }
                                  : current,
                              )
                            }
                            options={[
                              { value: "owners-maintainers", label: "Owners and maintainers" },
                              { value: "contributors-and-up", label: "Contributors and up" },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              Repository defaults
                            </div>
                            <div className="mt-1 text-xs text-foreground-muted">
                              Each repository persists through the existing issue-linked mutation
                              seam, so missing work-item context is called out explicitly.
                            </div>
                          </div>
                          <select
                            aria-label="Repository selector"
                            value={selectedRepositoryId ?? ""}
                            onChange={(event) => setSelectedRepositoryId(event.target.value)}
                            className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                          >
                            {repoProjectDraft.repositories.map((repository) => (
                              <option key={repository.id} value={repository.id}>
                                {repository.fullName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {repoProjectDraft.repositories.length === 0 ? (
                          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-foreground-muted">
                            No linked repositories exist yet.
                          </div>
                        ) : (
                          selectedRepository ? (
                            <div key={selectedRepository.id} className="mt-4 grid gap-4">
                              {!selectedRepository.linkedIssueId ? (
                                <div
                                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
                                  data-testid="missing-project-context"
                                >
                                  This repository is visible in the snapshot, but there is no
                                  linked issue/work item available to persist repository settings
                                  through the current kanban API seam.
                                </div>
                              ) : null}

                              <TextInputRow
                                label="Base branch"
                                value={selectedRepository.baseBranch}
                                onChange={(value) =>
                                  setRepoProjectDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          repositories: current.repositories.map((candidate) =>
                                            candidate.id === selectedRepository.id
                                              ? { ...candidate, baseBranch: value }
                                              : candidate,
                                          ),
                                        }
                                      : current,
                                  )
                                }
                              />
                              <div className="grid gap-4 sm:grid-cols-2">
                                <TextInputRow
                                  label="CI provider"
                                  value={selectedRepository.ciProvider}
                                  onChange={(value) =>
                                    setRepoProjectDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            repositories: current.repositories.map((candidate) =>
                                              candidate.id === selectedRepository.id
                                                ? { ...candidate, ciProvider: value }
                                                : candidate,
                                            ),
                                          }
                                        : current,
                                    )
                                  }
                                />
                                <TextInputRow
                                  label="Publish target"
                                  value={selectedRepository.publishTarget}
                                  onChange={(value) =>
                                    setRepoProjectDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            repositories: current.repositories.map((candidate) =>
                                              candidate.id === selectedRepository.id
                                                ? { ...candidate, publishTarget: value }
                                                : candidate,
                                            ),
                                          }
                                        : current,
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <ToggleRow
                                  label="Auto merge"
                                  checked={selectedRepository.autoMerge}
                                  onChange={(checked) =>
                                    setRepoProjectDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            repositories: current.repositories.map((candidate) =>
                                              candidate.id === selectedRepository.id
                                                ? { ...candidate, autoMerge: checked }
                                                : candidate,
                                            ),
                                          }
                                        : current,
                                    )
                                  }
                                />
                                <NumberInputRow
                                  label="Required approvals"
                                  value={selectedRepository.requiredApprovals}
                                  min={0}
                                  onChange={(value) =>
                                    setRepoProjectDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            repositories: current.repositories.map((candidate) =>
                                              candidate.id === selectedRepository.id
                                                ? {
                                                    ...candidate,
                                                    requiredApprovals: Math.max(0, value),
                                                  }
                                                : candidate,
                                            ),
                                          }
                                        : current,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => void handleSaveRepositoriesProjects()}
                        disabled={repoProjectSaving || !repoProjectDirty}
                      >
                        {repoProjectSaving ? "Saving…" : "Save repositories/projects"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setRepoProjectDraft(repoProjectBaseline);
                          setRepoProjectError(null);
                          setRepoProjectNotice(null);
                        }}
                        disabled={!repoProjectDirty || repoProjectSaving}
                      >
                        Discard changes
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <DispatchContextLabelSettings
                dispatchContextLabels={dispatchContextLabels}
                issues={issues}
                onRefresh={refresh}
              />
            </section>
          ) : null}

          {selectedSection === "organization" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="organization-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Organization settings</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Team identity, visibility, default role, and roster policy are treated as a
                separate organization section instead of being buried in the default settings body.
              </p>

              {backlogLoading ? (
                <SectionLoadingState text="Loading organization settings…" />
              ) : backlogError ? (
                <SectionErrorState
                  title="Failed to load organization settings"
                  message={backlogError}
                />
              ) : !project || !organizationDraft ? (
                <SectionEmptyState
                  title="Organization context is missing"
                  message="No project/team data is available in the local backlog snapshot."
                />
              ) : (
                <>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <SettingCard
                      label="Team"
                      value={`${project.team.name} (${project.team.members.length} members)`}
                    />
                    <SettingCard
                      label="Visibility"
                      value={`${project.team.settings.visibility} / default ${project.team.settings.defaultRole}`}
                    />
                    <SettingCard
                      label="Workspace policy"
                      value={project.settings.workspaceProvisioning}
                    />
                  </div>

                  {organizationError ? (
                    <SectionErrorBanner message={organizationError} />
                  ) : null}
                  {organizationNotice ? (
                    <SectionNoticeBanner message={organizationNotice} />
                  ) : null}

                  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="text-sm font-semibold text-foreground">Organization policy</div>
                      <div className="mt-4 grid gap-4">
                        <TextInputRow
                          label="Team name"
                          value={organizationDraft.teamName}
                          onChange={(value) =>
                            setOrganizationDraft((current) =>
                              current ? { ...current, teamName: value } : current,
                            )
                          }
                        />
                        <SelectRow
                          label="Visibility"
                          value={organizationDraft.visibility}
                          onChange={(value) =>
                            setOrganizationDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    visibility: value as OrganizationDraft["visibility"],
                                  }
                                : current,
                            )
                          }
                          options={[
                            { value: "private", label: "Private" },
                            { value: "team", label: "Team" },
                            { value: "workspace-shared", label: "Workspace shared" },
                          ]}
                        />
                        <SelectRow
                          label="Default role"
                          value={organizationDraft.defaultRole}
                          onChange={(value) =>
                            setOrganizationDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    defaultRole: value as KanbanCollaboratorRole,
                                  }
                                : current,
                            )
                          }
                          options={[
                            { value: "owner", label: "Owner" },
                            { value: "maintainer", label: "Maintainer" },
                            { value: "contributor", label: "Contributor" },
                            { value: "viewer", label: "Viewer" },
                          ]}
                        />
                        <ToggleRow
                          label="Allow self assign"
                          checked={organizationDraft.allowSelfAssign}
                          onChange={(checked) =>
                            setOrganizationDraft((current) =>
                              current ? { ...current, allowSelfAssign: checked } : current,
                            )
                          }
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => void handleSaveOrganization()}
                          disabled={!organizationDirty || organizationSaving}
                        >
                          {organizationSaving ? "Saving…" : "Save organization"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setOrganizationDraft(organizationBaseline);
                            setOrganizationError(null);
                            setOrganizationNotice(null);
                          }}
                          disabled={!organizationDirty || organizationSaving}
                        >
                          Discard changes
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Users className="h-4 w-4" />
                          Team roster
                        </div>
                        <div className="mt-3 space-y-2">
                          {project.team.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                            >
                              <div>
                                <div className="font-medium text-foreground">{member.displayName}</div>
                                <div className="text-xs text-foreground-muted">
                                  {member.email ?? member.id}
                                </div>
                              </div>
                              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                                {member.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <ShieldCheck className="h-4 w-4" />
                          Permission policy
                        </div>
                        <div className="mt-3 space-y-2">
                          {project.permissions.map((permission) => (
                            <div
                              key={permission.action}
                              className="rounded-xl border border-border bg-card px-3 py-3 text-sm"
                            >
                              <div className="font-medium text-foreground">{permission.action}</div>
                              <div className="mt-1 text-xs text-foreground-muted">
                                {permission.description}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {permission.roles.map((role) => (
                                  <span
                                    key={`${permission.action}-${role}`}
                                    className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {selectedSection === "remote-project" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="remote-project-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Remote-project settings</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Remote host, organization, and project binding state is surfaced explicitly so
                linked PR and review failures are explainable before operators leave the page.
              </p>
              {backlogLoading ? (
                <SectionLoadingState text="Loading remote-project settings…" />
              ) : backlogError ? (
                <SectionErrorState
                  title="Failed to load remote-project settings"
                  message={backlogError}
                />
              ) : !project ? (
                <SectionEmptyState
                  title="Project context is missing"
                  message="Remote-project bindings depend on a loaded project snapshot."
                />
              ) : project.integrations.length === 0 ? (
                <SectionEmptyState
                  title="Host context is missing"
                  message="No remote host integrations are configured for this project yet."
                />
              ) : (
                <div className="mt-4 space-y-4">
                  {project.integrations.some((integration) =>
                    integration.prerequisites.some((prerequisite) => !prerequisite.satisfied),
                  ) ? (
                    <div
                      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
                      data-testid="missing-host-context"
                    >
                      One or more remote hosts are missing organization or project binding
                      prerequisites. Fix those prerequisites before relying on linked PR actions.
                    </div>
                  ) : null}
                  <div className="grid gap-4 xl:grid-cols-2">
                    {project.integrations.map((integration) => (
                      <IntegrationCard key={integration.provider} integration={integration} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {selectedSection === "agent-configuration" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="agent-configuration-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Agent configuration</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Default model, provider, approval mode, and token limits are validated and saved as
                a distinct section with its own loading and retry behavior.
              </p>
              {agentSection.status === "loading" || agentSection.status === "idle" ? (
                <SectionLoadingState text="Loading agent configuration…" />
              ) : agentSection.status === "error" ? (
                <SectionErrorState
                  title="Failed to load agent configuration"
                  message={agentSection.error ?? "Unknown error"}
                />
              ) : !agentSection.data || agentSection.data.agents.length === 0 ? (
                <SectionEmptyState
                  title="No agent configuration is available"
                  message="No agent definitions were returned for this settings surface."
                />
              ) : (
                <>
                  {agentError ? <SectionErrorBanner message={agentError} /> : null}
                  {agentNotice ? <SectionNoticeBanner message={agentNotice} /> : null}
                  <div className="mt-5 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      {agentSection.data.agents.map((agent) => (
                        <button
                          key={agent.agent}
                          type="button"
                          onClick={() => setSelectedAgentId(agent.agent)}
                          className={[
                            "w-full rounded-2xl border px-4 py-3 text-left",
                            selectedAgentId === agent.agent
                              ? "border-primary/30 bg-primary/10"
                              : "border-border bg-background/60",
                          ].join(" ")}
                        >
                          <div className="text-sm font-semibold text-foreground">
                            {agent.displayName}
                          </div>
                          <div className="mt-1 text-xs text-foreground-muted">
                            default {agent.defaultModel || "unconfigured"}
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedAgentId && agentDraftById[selectedAgentId] ? (
                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="grid gap-4">
                          <TextInputRow
                            label="Model"
                            value={agentDraftById[selectedAgentId]!.configuredModel}
                            onChange={(value) =>
                              setAgentDraftById((current) => ({
                                ...current,
                                [selectedAgentId]: {
                                  ...current[selectedAgentId]!,
                                  configuredModel: value,
                                },
                              }))
                            }
                            listId={`agent-models-${selectedAgentId}`}
                          />
                          <datalist id={`agent-models-${selectedAgentId}`}>
                            {agentDraftById[selectedAgentId]!.availableModels.map((model) => (
                              <option key={model.modelId} value={model.modelId} />
                            ))}
                          </datalist>
                          <TextInputRow
                            label="Provider"
                            value={agentDraftById[selectedAgentId]!.configuredProvider}
                            onChange={(value) =>
                              setAgentDraftById((current) => ({
                                ...current,
                                [selectedAgentId]: {
                                  ...current[selectedAgentId]!,
                                  configuredProvider: value,
                                },
                              }))
                            }
                          />
                          <SelectRow
                            label="Approval mode"
                            value={agentDraftById[selectedAgentId]!.approvalMode}
                            onChange={(value) =>
                              setAgentDraftById((current) => ({
                                ...current,
                                [selectedAgentId]: {
                                  ...current[selectedAgentId]!,
                                  approvalMode: value as "yolo" | "prompt" | "deny",
                                },
                              }))
                            }
                            options={[
                              { value: "prompt", label: "Prompt" },
                              { value: "yolo", label: "Yolo" },
                              { value: "deny", label: "Deny" },
                            ]}
                          />
                          <TextInputRow
                            label="Max tokens"
                            value={agentDraftById[selectedAgentId]!.maxTokens}
                            onChange={(value) =>
                              setAgentDraftById((current) => ({
                                ...current,
                                [selectedAgentId]: {
                                  ...current[selectedAgentId]!,
                                  maxTokens: value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-foreground-muted">
                          Known models:{" "}
                          {agentDraftById[selectedAgentId]!.availableModels
                            .map((model) =>
                              model.deprecated && model.successorModelId
                                ? `${model.modelId} -> ${model.successorModelId}`
                                : model.modelId,
                            )
                            .join(", ")}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => void handleSaveAgentConfiguration()}
                            disabled={!agentDirty || agentSaving}
                          >
                            {agentSaving ? "Saving…" : "Save agent configuration"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setAgentDraftById(agentBaselineById);
                              setAgentError(null);
                              setAgentNotice(null);
                            }}
                            disabled={!agentDirty || agentSaving}
                          >
                            Discard changes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {selectedSection === "mcp-servers" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="mcp-server-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">MCP server settings</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Per-agent MCP transport definitions are edited as structured drafts so invalid
                entries fail safely without wiping the current form state.
              </p>
              {mcpSection.status === "loading" || mcpSection.status === "idle" ? (
                <SectionLoadingState text="Loading MCP server settings…" />
              ) : mcpSection.status === "error" ? (
                <SectionErrorState
                  title="Failed to load MCP server settings"
                  message={mcpSection.error ?? "Unknown error"}
                />
              ) : !mcpSection.data || mcpSection.data.agents.length === 0 ? (
                <SectionEmptyState
                  title="No MCP server settings are available"
                  message="No agents were returned for the MCP settings section."
                />
              ) : (
                <>
                  {mcpError ? <SectionErrorBanner message={mcpError} /> : null}
                  {mcpNotice ? <SectionNoticeBanner message={mcpNotice} /> : null}
                  <div className="mt-5 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      {mcpSection.data.agents.map((agent) => (
                        <button
                          key={agent.agent}
                          type="button"
                          onClick={() => setSelectedMcpAgentId(agent.agent)}
                          className={[
                            "w-full rounded-2xl border px-4 py-3 text-left",
                            selectedMcpAgentId === agent.agent
                              ? "border-primary/30 bg-primary/10"
                              : "border-border bg-background/60",
                          ].join(" ")}
                        >
                          <div className="text-sm font-semibold text-foreground">
                            {agent.displayName}
                          </div>
                          <div className="mt-1 text-xs text-foreground-muted">
                            {(mcpDraftByAgent[agent.agent] ?? []).length} server(s)
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedMcpAgentId ? (
                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-foreground">
                            MCP definitions for {selectedMcpAgentId}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setMcpDraftByAgent((current) => ({
                                ...current,
                                [selectedMcpAgentId]: [
                                  ...(current[selectedMcpAgentId] ?? []),
                                  {
                                    name: "",
                                    transport: "stdio",
                                    command: "",
                                    url: "",
                                    argsText: "",
                                    envText: "",
                                  },
                                ],
                              }))
                            }
                          >
                            Add server
                          </Button>
                        </div>

                        {(mcpDraftByAgent[selectedMcpAgentId] ?? []).length === 0 ? (
                          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-foreground-muted">
                            No MCP servers configured for this agent yet.
                          </div>
                        ) : (
                          <div className="mt-4 space-y-4">
                            {(mcpDraftByAgent[selectedMcpAgentId] ?? []).map((server, index) => (
                              <div
                                key={`${selectedMcpAgentId}-${index}`}
                                className="rounded-2xl border border-border bg-card p-4"
                              >
                                <div className="grid gap-4">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <TextInputRow
                                      label="Name"
                                      value={server.name}
                                      onChange={(value) =>
                                        setMcpDraftByAgent((current) => ({
                                          ...current,
                                          [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).map(
                                            (candidate, candidateIndex) =>
                                              candidateIndex === index
                                                ? { ...candidate, name: value }
                                                : candidate,
                                          ),
                                        }))
                                      }
                                    />
                                    <SelectRow
                                      label="Transport"
                                      value={server.transport}
                                      onChange={(value) =>
                                        setMcpDraftByAgent((current) => ({
                                          ...current,
                                          [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).map(
                                            (candidate, candidateIndex) =>
                                              candidateIndex === index
                                                ? {
                                                    ...candidate,
                                                    transport: value as McpServerDraft["transport"],
                                                  }
                                                : candidate,
                                          ),
                                        }))
                                      }
                                      options={[
                                        { value: "stdio", label: "stdio" },
                                        { value: "sse", label: "sse" },
                                        { value: "streamable-http", label: "streamable-http" },
                                      ]}
                                    />
                                  </div>
                                  {server.transport === "stdio" ? (
                                    <TextInputRow
                                      label="Command"
                                      value={server.command}
                                      onChange={(value) =>
                                        setMcpDraftByAgent((current) => ({
                                          ...current,
                                          [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).map(
                                            (candidate, candidateIndex) =>
                                              candidateIndex === index
                                                ? { ...candidate, command: value }
                                                : candidate,
                                          ),
                                        }))
                                      }
                                    />
                                  ) : (
                                    <TextInputRow
                                      label="URL"
                                      value={server.url}
                                      onChange={(value) =>
                                        setMcpDraftByAgent((current) => ({
                                          ...current,
                                          [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).map(
                                            (candidate, candidateIndex) =>
                                              candidateIndex === index
                                                ? { ...candidate, url: value }
                                                : candidate,
                                          ),
                                        }))
                                      }
                                    />
                                  )}
                                  <TextAreaRow
                                    label="Args"
                                    value={server.argsText}
                                    onChange={(value) =>
                                      setMcpDraftByAgent((current) => ({
                                        ...current,
                                        [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).map(
                                          (candidate, candidateIndex) =>
                                            candidateIndex === index
                                              ? { ...candidate, argsText: value }
                                              : candidate,
                                        ),
                                      }))
                                    }
                                    placeholder="One argument per line"
                                  />
                                  <TextAreaRow
                                    label="Environment"
                                    value={server.envText}
                                    onChange={(value) =>
                                      setMcpDraftByAgent((current) => ({
                                        ...current,
                                        [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).map(
                                          (candidate, candidateIndex) =>
                                            candidateIndex === index
                                              ? { ...candidate, envText: value }
                                              : candidate,
                                        ),
                                      }))
                                    }
                                    placeholder="KEY=value"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      setMcpDraftByAgent((current) => ({
                                        ...current,
                                        [selectedMcpAgentId]: (current[selectedMcpAgentId] ?? []).filter(
                                          (_, candidateIndex) => candidateIndex !== index,
                                        ),
                                      }))
                                    }
                                  >
                                    Remove server
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => void handleSaveMcpServers()}
                            disabled={!mcpDirty || mcpSaving}
                          >
                            {mcpSaving ? "Saving…" : "Save MCP servers"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setMcpDraftByAgent(mcpBaselineByAgent);
                              setMcpError(null);
                              setMcpNotice(null);
                            }}
                            disabled={!mcpDirty || mcpSaving}
                          >
                            Discard changes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {selectedSection === "editor-integration" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="editor-integration-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Editor integration</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                The local package is workspace-first. Editing happens through sessions and workspaces,
                with keyboard-driven panels and command-bar access layered on top instead of hidden in
                a separate IDE-only integration surface.
              </p>
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SettingCard label="Workspace shortcuts" value={String(sessionWorkspaceShortcuts.length)} />
                    <SettingCard label="Primary route" value="/workspaces" />
                    <SettingCard label="Command bar" value="Ctrl/Cmd + K" />
                    <SettingCard label="Session route" value="/sessions" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => navigate("/workspaces")}>
                      Open workspaces
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/sessions")}>
                      Open sessions
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="text-sm font-semibold text-foreground">Active editor conventions</div>
                  <div className="mt-3 space-y-3 text-sm text-foreground-muted">
                    <p>
                      Session workspaces expose panel toggles for workspace, conversation, context,
                      and details alongside a command bar for fast navigation.
                    </p>
                    <p>
                      Settings breadth here keeps those local editing conventions visible instead of
                      pretending editor integration is only an external IDE handshake.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {selectedSection === "git" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="git-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Git settings</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Repository policy is still edited through project-backed seams, but the git section
                summarizes the current branch, review, merge, and provider readiness posture in one place.
              </p>
              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                <SettingCard label="Linked repos" value={String(linkedRepositoryCount)} />
                <SettingCard label="Auto-merge enabled" value={String(autoMergeEnabledCount)} />
                <SettingCard label="Connected providers" value={String(connectedIntegrationCount)} />
                <SettingCard label="Missing bindings" value={String(missingIntegrationCount)} />
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="text-sm font-semibold text-foreground">Repository defaults</div>
                  {linkedRepositoryCount === 0 ? (
                    <div className="mt-3 text-sm text-foreground-muted">
                      No linked repositories are available yet.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {(repoProjectDraft?.repositories ?? []).map((repository) => (
                        <div
                          key={repository.id}
                          className="rounded-xl border border-border bg-card px-3 py-3 text-sm"
                        >
                          <div className="font-medium text-foreground">{repository.fullName}</div>
                          <div className="mt-1 text-xs text-foreground-muted">
                            Base branch {repository.baseBranch} · approvals {repository.requiredApprovals} · auto-merge{" "}
                            {repository.autoMerge ? "on" : "off"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="text-sm font-semibold text-foreground">Remote readiness</div>
                  <div className="mt-3 space-y-3 text-sm text-foreground-muted">
                    <p>
                      Provider connectivity and missing project bindings affect linked PR workflows,
                      review sync, and approval automation.
                    </p>
                    <p>
                      Use the Repositories &amp; Projects and Remote Projects sections to change persisted
                      policy; this section keeps the current git posture visible at a glance.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {selectedSection === "notifications" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="notification-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Notification settings</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Run completion, failure, and waiting-for-review events surface in-app first, with
                browser notifications available when permission is granted and the tab is hidden.
              </p>
              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                <SettingCard label="Browser permission" value={browserNotificationState} />
                <SettingCard label="In-app queue" value={String(notifications.length)} />
                <SettingCard label="Persistent alerts" value="breakpoints stay pinned" />
                <SettingCard label="Digest polling" value="3s" />
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="text-sm font-semibold text-foreground">Current behavior</div>
                  <div className="mt-3 space-y-2 text-sm text-foreground-muted">
                    <p>New runs, completions, failures, and breakpoint attention all publish to the in-app stack.</p>
                    <p>Browser notifications only fire when permission is granted and the document is hidden.</p>
                    <p>Breakpoint notifications stay persistent until operators resolve them.</p>
                  </div>
                  {permission !== "granted" ? (
                    <div className="mt-4">
                      <Button type="button" variant="primary" onClick={requestPermission}>
                        Enable browser notifications
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="text-sm font-semibold text-foreground">Why this is explicit here</div>
                  <div className="mt-3 space-y-2 text-sm text-foreground-muted">
                    <p>
                      Upstream breadth includes notifications, but the local package needs to explain
                      the Babysitter-specific attention model: runs can require review, not just passive status updates.
                    </p>
                    <p>
                      This section keeps notification policy visible without forcing operators to infer
                      it from transient toasts alone.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {selectedSection === "task-tags" ? <TaskTagSettings /> : null}

          {selectedSection === "keyboard-shortcuts" ? (
            <section
              className="rounded-3xl border border-border bg-card p-6 shadow-lg"
              data-testid="keyboard-shortcut-settings"
            >
              <h2 className="text-xl font-semibold tracking-tight">Keyboard shortcut settings</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Shortcut visibility is explicit here so the app shell, dispatch detail view, and session
                workspace remain keyboard-driven without hiding the available commands behind memory alone.
              </p>
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <SettingCard label="Shortcut groups" value={String(shortcutGroups.length)} />
                <SettingCard label="Global shortcuts" value={String(SHORTCUTS.filter((shortcut) => shortcut.context === "global").length)} />
                <SettingCard label="Workspace shortcuts" value={String(sessionWorkspaceShortcuts.length)} />
              </div>
              <div className="mt-5 space-y-4">
                {shortcutGroups.map(([context, items]) => (
                  <section
                    key={context}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {SHORTCUT_SECTION_LABELS[context] ?? context}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {items.map((shortcut) => (
                        <div
                          key={`${context}-${shortcut.description}`}
                          className="rounded-xl border border-border bg-card px-3 py-3 text-sm"
                        >
                          <div className="font-medium text-foreground">{shortcut.description}</div>
                          <div className="mt-1 text-xs text-foreground-muted">
                            {shortcut.keys.join(" + ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

function SectionLoadingState(props: { text: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-border bg-background/60 px-4 py-4 text-sm text-foreground-muted">
      {props.text}
    </div>
  );
}

function SectionEmptyState(props: { title: string; message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/40 px-4 py-4">
      <div className="font-medium text-foreground">{props.title}</div>
      <div className="mt-1 text-sm text-foreground-muted">{props.message}</div>
    </div>
  );
}

function SectionErrorState(props: { title: string; message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-error/25 bg-error-muted px-4 py-4">
      <div className="font-medium text-error">{props.title}</div>
      <div className="mt-1 text-sm text-error">{props.message}</div>
    </div>
  );
}

function SectionErrorBanner(props: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-error/25 bg-error-muted px-4 py-3 text-sm text-error">
      {props.message}
    </div>
  );
}

function SectionNoticeBanner(props: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
      {props.message}
    </div>
  );
}

function TextInputRow(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  listId?: string;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
      {props.label}
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        list={props.listId}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
      />
    </label>
  );
}

function TextAreaRow(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
      {props.label}
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className="mt-2 min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

function NumberInputRow(props: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
      {props.label}
      <input
        type="number"
        min={props.min}
        value={props.value}
        onChange={(event) => props.onChange(Number.parseInt(event.target.value, 10) || 0)}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
      />
    </label>
  );
}

function SelectRow(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
      {props.label}
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
      <span className="font-medium text-foreground">{props.label}</span>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

const taskTagKeyPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

interface TaskTagDraft {
  key: string;
  label: string;
  content: string;
  description: string;
}

interface TaskTagFieldErrors {
  key?: string;
  label?: string;
  content?: string;
}

const emptyTaskTagDraft: TaskTagDraft = {
  key: "",
  label: "",
  content: "",
  description: "",
};

function sortTaskTags(taskTags: readonly KanbanTaskTag[]): KanbanTaskTag[] {
  return [...taskTags].sort(
    (left, right) =>
      left.order - right.order ||
      left.key.localeCompare(right.key) ||
      left.label.localeCompare(right.label),
  );
}

function validateTaskTagDraft(
  draft: TaskTagDraft,
  taskTags: readonly KanbanTaskTag[],
  editingId: string | null,
): { normalized: TaskTagDraft; errors: TaskTagFieldErrors } {
  const normalized: TaskTagDraft = {
    key: draft.key.trim(),
    label: draft.label.trim(),
    content: draft.content.trim(),
    description: draft.description.trim(),
  };

  const errors: TaskTagFieldErrors = {};

  if (!normalized.key) {
    errors.key = "Key is required.";
  } else if (!taskTagKeyPattern.test(normalized.key)) {
    errors.key = "Key must use lowercase snake_case.";
  } else if (
    taskTags.some((taskTag) => taskTag.key === normalized.key && taskTag.id !== editingId)
  ) {
    errors.key = `Key ${normalized.key} already exists.`;
  }

  if (!normalized.label) {
    errors.label = "Label is required.";
  }

  if (!normalized.content) {
    errors.content = "Snippet content is required.";
  }

  return { normalized, errors };
}

function createFieldErrorsFromMessage(message: string): TaskTagFieldErrors {
  if (message.includes("snake_case")) {
    return { key: "Key must use lowercase snake_case." };
  }

  if (message.includes("already exists")) {
    return { key: message };
  }

  return {};
}

function TaskTagSettings() {
  const [taskTags, setTaskTags] = useState<KanbanTaskTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskTagDraft>(emptyTaskTagDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<TaskTagFieldErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingTaskTagId, setPendingTaskTagId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function hydrateTaskTags() {
      setIsLoading(true);
      setLoadingError(null);

      try {
        const loadedTaskTags = await loadTaskTags();
        if (!isActive) {
          return;
        }
        setTaskTags(sortTaskTags(loadedTaskTags));
      } catch (error) {
        if (!isActive) {
          return;
        }
        setLoadingError(
          error instanceof Error ? error.message : "Failed to load Task Tags.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void hydrateTaskTags();

    return () => {
      isActive = false;
    };
  }, []);

  const orderedTaskTags = sortTaskTags(taskTags);

  function resetForm() {
    setDraft(emptyTaskTagDraft);
    setEditingId(null);
    setFieldErrors({});
  }

  function startEditing(taskTag: KanbanTaskTag) {
    setEditingId(taskTag.id);
    setDraft({
      key: taskTag.key,
      label: taskTag.label,
      content: taskTag.content,
      description: taskTag.description ?? "",
    });
    setFieldErrors({});
    setActionError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { normalized, errors } = validateTaskTagDraft(draft, orderedTaskTags, editingId);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setActionError(null);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setActionError(null);
    setNotice(null);

    try {
      const payload = {
        key: normalized.key,
        label: normalized.label,
        content: normalized.content,
        description: normalized.description || undefined,
      };

      const result = editingId
        ? await updateTaskTag(editingId, payload)
        : await createTaskTag({
            ...payload,
            order: orderedTaskTags.length,
          });

      setTaskTags(sortTaskTags(result.taskTags));
      setNotice(editingId ? `Updated @${normalized.key}.` : `Created @${normalized.key}.`);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save Task Tag.";
      const nextFieldErrors = createFieldErrorsFromMessage(message);
      setFieldErrors(nextFieldErrors);
      setActionError(Object.keys(nextFieldErrors).length > 0 ? null : message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(taskTag: KanbanTaskTag) {
    setPendingTaskTagId(taskTag.id);
    setActionError(null);
    setNotice(null);

    try {
      const result = await deleteTaskTag(taskTag.id);
      setTaskTags(sortTaskTags(result.taskTags));
      setNotice(`Deleted @${taskTag.key}.`);
      if (editingId === taskTag.id) {
        resetForm();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete Task Tag.");
    } finally {
      setPendingTaskTagId(null);
    }
  }

  async function handleMove(taskTagId: string, direction: -1 | 1) {
    const currentIndex = orderedTaskTags.findIndex((taskTag) => taskTag.id === taskTagId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedTaskTags.length) {
      return;
    }

    const reorderedTaskTags = [...orderedTaskTags];
    const [movedTaskTag] = reorderedTaskTags.splice(currentIndex, 1);
    if (!movedTaskTag) {
      return;
    }
    reorderedTaskTags.splice(targetIndex, 0, movedTaskTag);

    const nextOrder = reorderedTaskTags.map((taskTag, index) => ({
      ...taskTag,
      order: index,
    }));

    setPendingTaskTagId(taskTagId);
    setActionError(null);
    setNotice(null);

    try {
      let latestTaskTags = taskTags;

      for (const taskTag of nextOrder) {
        const currentTaskTag = orderedTaskTags.find(
          (candidate) => candidate.id === taskTag.id,
        );
        if (!currentTaskTag || currentTaskTag.order === taskTag.order) {
          continue;
        }

        const result = await updateTaskTag(taskTag.id, { order: taskTag.order });
        latestTaskTags = [...result.taskTags];
      }

      setTaskTags(sortTaskTags(latestTaskTags));
      setNotice("Updated Task Tag order.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to reorder Task Tags.",
      );
    } finally {
      setPendingTaskTagId(null);
    }
  }

  return (
    <section
      className="rounded-3xl border border-border bg-card p-6 shadow-lg"
      data-testid="task-tag-settings"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight">Task Tags</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Reusable snippet tags stay separate from issue labels and Dispatch Context Labels.
            This Settings surface manages the shared `@` library that authoring flows consume.
          </p>
        </div>
        <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
          <SettingCard label="Definitions" value={String(orderedTaskTags.length)} />
          <SettingCard
            label="Sort rule"
            value={orderedTaskTags.length > 0 ? "order then key" : "empty library"}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">
                {editingId ? "Edit Task Tag" : "Create Task Tag"}
              </div>
              <div className="mt-1 text-xs text-foreground-muted">
                Keys must be unique lowercase snake_case tokens used after `@`.
              </div>
            </div>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Key
                <input
                  aria-label="Task Tag key"
                  value={draft.key}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, key: event.target.value }))
                  }
                  placeholder="bug_report"
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 font-mono text-sm text-foreground placeholder:text-foreground-muted/60"
                />
                {fieldErrors.key ? (
                  <span className="mt-2 block text-xs normal-case tracking-normal text-error">
                    {fieldErrors.key}
                  </span>
                ) : null}
              </label>

              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Label
                <input
                  aria-label="Task Tag label"
                  value={draft.label}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, label: event.target.value }))
                  }
                  placeholder="Bug Report"
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-foreground-muted/60"
                />
                {fieldErrors.label ? (
                  <span className="mt-2 block text-xs normal-case tracking-normal text-error">
                    {fieldErrors.label}
                  </span>
                ) : null}
              </label>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Description
              <input
                aria-label="Task Tag description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Optional guidance for when this snippet should be used."
                className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-foreground-muted/60"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Snippet content
              <textarea
                aria-label="Task Tag content"
                value={draft.content}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, content: event.target.value }))
                }
                placeholder="Describe the bug, impact, expected behavior, and steps to reproduce."
                className="mt-2 min-h-28 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/60"
              />
              {fieldErrors.content ? (
                <span className="mt-2 block text-xs normal-case tracking-normal text-error">
                  {fieldErrors.content}
                </span>
              ) : null}
            </label>

            {actionError ? (
              <div className="rounded-2xl border border-error/30 bg-error-muted px-4 py-3 text-sm text-error">
                {actionError}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm text-success">
                {notice}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || pendingTaskTagId !== null}
            >
              {isSaving ? "Saving Task Tag…" : editingId ? "Save Task Tag" : "Create Task Tag"}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Reusable library</div>
              <div className="mt-1 text-xs text-foreground-muted">
                Ordering is explicit. Move controls patch stored `order` values to keep
                autocomplete deterministic.
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsLoading(true);
                setLoadingError(null);
                void loadTaskTags()
                  .then((loadedTaskTags) => setTaskTags(sortTaskTags(loadedTaskTags)))
                  .catch((error) =>
                    setLoadingError(
                      error instanceof Error
                        ? error.message
                        : "Failed to load Task Tags.",
                    ),
                  )
                  .finally(() => setIsLoading(false));
              }}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>

          {loadingError ? (
            <div className="mt-4 rounded-2xl border border-error/30 bg-error-muted px-4 py-3 text-sm text-error">
              {loadingError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-4 text-sm text-foreground-muted">
              Loading Task Tags…
            </div>
          ) : orderedTaskTags.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-foreground-muted">
              No Task Tags yet. Create one to seed the reusable snippet library.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {orderedTaskTags.map((taskTag, index) => (
                <article
                  key={taskTag.id}
                  className="rounded-2xl border border-border bg-card p-4"
                  data-testid={`task-tag-item-${taskTag.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{taskTag.label}</div>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-mono text-foreground-muted">
                          @{taskTag.key}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                          order {taskTag.order}
                        </span>
                      </div>
                      {taskTag.description ? (
                        <p className="mt-2 text-sm text-foreground-muted">
                          {taskTag.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void handleMove(taskTag.id, -1)}
                        disabled={index === 0 || pendingTaskTagId !== null || isSaving}
                        aria-label={`Move ${taskTag.label} up`}
                      >
                        Move up
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void handleMove(taskTag.id, 1)}
                        disabled={
                          index === orderedTaskTags.length - 1 ||
                          pendingTaskTagId !== null ||
                          isSaving
                        }
                        aria-label={`Move ${taskTag.label} down`}
                      >
                        Move down
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => startEditing(taskTag)}
                        disabled={pendingTaskTagId !== null || isSaving}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void handleDelete(taskTag)}
                        disabled={pendingTaskTagId !== null || isSaving}
                      >
                        {pendingTaskTagId === taskTag.id ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </div>

                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-background/80 px-3 py-3 text-xs text-foreground-secondary">
                    {taskTag.content}
                  </pre>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DispatchContextLabelSettings(props: {
  dispatchContextLabels: NonNullable<
    ReturnType<typeof useBacklog>["snapshot"]
  >["dispatchContextLabels"];
  issues: NonNullable<ReturnType<typeof useBacklog>["snapshot"]>["issues"];
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<DispatchContextLabelFormState>(
    createEmptyDispatchContextLabelForm(),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] =
    useState<DispatchContextLabelFormState | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function runAction(actionId: string, work: () => Promise<void>) {
    setPendingAction(actionId);
    setError(null);
    setNotice(null);
    try {
      await work();
      await props.onRefresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Dispatch Context Label update failed.",
      );
      throw cause;
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateLabel() {
    await runAction("create-dispatch-context-label", async () => {
      await createDispatchContextLabel({
        key: draft.key,
        label: draft.label,
        description: draft.description || undefined,
        instruction: draft.instruction,
      });
      setDraft(createEmptyDispatchContextLabelForm());
      setNotice("Created Dispatch Context Label definition.");
    });
  }

  async function handleSaveEdit() {
    if (!editingId || !editingDraft) {
      return;
    }

    await runAction(`save-${editingId}`, async () => {
      await updateDispatchContextLabel(editingId, {
        key: editingDraft.key,
        label: editingDraft.label,
        description: editingDraft.description || undefined,
        instruction: editingDraft.instruction,
      });
      setEditingId(null);
      setEditingDraft(null);
      setNotice("Updated Dispatch Context Label definition.");
    });
  }

  async function handleDeleteLabel(labelId: string) {
    await runAction(`delete-${labelId}`, async () => {
      await deleteDispatchContextLabel(labelId);
      if (editingId === labelId) {
        setEditingId(null);
        setEditingDraft(null);
      }
      setNotice("Deleted Dispatch Context Label definition.");
    });
  }

  return (
    <section
      className="rounded-3xl border border-border bg-card p-6 shadow-lg"
      data-testid="dispatch-context-label-settings"
    >
      <h2 className="text-xl font-semibold tracking-tight">Dispatch Context Labels</h2>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">
        Manage reusable execution-context definitions here. These definitions stay separate from
        board labels, Task Tags, and default agent selection so reviewers can inspect exactly
        what dispatch instructions are reusable and where they are attached.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SettingCard label="Definitions" value={String(props.dispatchContextLabels.length)} />
        <SettingCard
          label="Attached issues"
          value={String(
            props.issues.filter((issue) => issue.dispatch.contextLabels.length > 0).length,
          )}
        />
        <SettingCard
          label="Rendered projections"
          value={String(
            props.issues.filter((issue) => (issue.dispatch.renderedContext ?? "").length > 0)
              .length,
          )}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-error/25 bg-error-muted px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm text-success">
          {notice}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <form
          className="rounded-2xl border border-border bg-background/60 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateLabel().catch(() => undefined);
          }}
        >
          <div className="text-sm font-semibold text-foreground">Create reusable definition</div>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Define the reusable dispatch instruction once, then attach it by reference on the
            issue surface instead of copying prompt text into board labels or Task Tags.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Dispatch Context Label key
              <input
                aria-label="Dispatch Context Label key"
                value={draft.key}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, key: event.target.value }))
                }
                placeholder="tests_first"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Display label
              <input
                aria-label="Dispatch Context Label name"
                value={draft.label}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, label: event.target.value }))
                }
                placeholder="Tests First"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Helper description
              <textarea
                aria-label="Dispatch Context Label description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Explain when to attach this reusable context label."
                className="mt-2 min-h-20 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Dispatch instruction
              <textarea
                aria-label="Dispatch Context Label instruction"
                value={draft.instruction}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, instruction: event.target.value }))
                }
                placeholder="Write or update deterministic verification before implementation changes."
                className="mt-2 min-h-32 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={pendingAction === "create-dispatch-context-label"}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
            >
              {pendingAction === "create-dispatch-context-label"
                ? "Creating definition…"
                : "Create Dispatch Context Label"}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {props.dispatchContextLabels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/40 p-4 text-sm text-foreground-muted">
              No Dispatch Context Label definitions exist yet. Create one here, then attach it
              from the issue surface.
            </div>
          ) : null}

          {props.dispatchContextLabels.map((contextLabel) => {
            const attachedIssues = props.issues.filter((issue) =>
              issue.dispatch.contextLabels.some((ref) => ref.labelId === contextLabel.id),
            );
            const isEditing = editingId === contextLabel.id && editingDraft !== null;

            return (
              <div
                key={contextLabel.id}
                className="rounded-2xl border border-border bg-background/60 p-4"
              >
                {isEditing ? (
                  <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSaveEdit().catch(() => undefined);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-foreground">
                        Edit definition
                      </div>
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                        {attachedIssues.length} issue
                        {attachedIssues.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Dispatch Context Label key
                      <input
                        aria-label={`Dispatch Context Label key ${contextLabel.key}`}
                        value={editingDraft.key}
                        onChange={(event) =>
                          setEditingDraft((current) =>
                            current ? { ...current, key: event.target.value } : current,
                          )
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Display label
                      <input
                        aria-label={`Dispatch Context Label name ${contextLabel.key}`}
                        value={editingDraft.label}
                        onChange={(event) =>
                          setEditingDraft((current) =>
                            current ? { ...current, label: event.target.value } : current,
                          )
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Helper description
                      <textarea
                        aria-label={`Dispatch Context Label description ${contextLabel.key}`}
                        value={editingDraft.description}
                        onChange={(event) =>
                          setEditingDraft((current) =>
                            current
                              ? { ...current, description: event.target.value }
                              : current,
                          )
                        }
                        className="mt-2 min-h-20 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Dispatch instruction
                      <textarea
                        aria-label={`Dispatch Context Label instruction ${contextLabel.key}`}
                        value={editingDraft.instruction}
                        onChange={(event) =>
                          setEditingDraft((current) =>
                            current
                              ? { ...current, instruction: event.target.value }
                              : current,
                          )
                        }
                        className="mt-2 min-h-28 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={pendingAction === `save-${contextLabel.id}`}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
                      >
                        {pendingAction === `save-${contextLabel.id}`
                          ? "Saving…"
                          : "Save definition"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingDraft(null);
                          setError(null);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground-muted"
                      >
                        Cancel edit
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{contextLabel.label}</div>
                        <div className="text-xs text-foreground-muted">{contextLabel.key}</div>
                      </div>
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                        {attachedIssues.length} issue
                        {attachedIssues.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {contextLabel.description ? (
                      <p className="mt-2 text-sm text-foreground-muted">
                        {contextLabel.description}
                      </p>
                    ) : null}
                    <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-card px-3 py-3 text-xs text-foreground-secondary">
                      {contextLabel.instruction}
                    </pre>
                    {attachedIssues.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                        {attachedIssues.map((issue) => (
                          <span
                            key={`${contextLabel.id}-${issue.id}`}
                            className="rounded-full border border-border px-2.5 py-1"
                          >
                            {issue.key}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-foreground-muted">
                        Not attached to any issue yet.
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(contextLabel.id);
                          setEditingDraft({
                            key: contextLabel.key,
                            label: contextLabel.label,
                            description: contextLabel.description ?? "",
                            instruction: contextLabel.instruction,
                          });
                          setError(null);
                          setNotice(null);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground"
                      >
                        Edit definition
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteLabel(contextLabel.id).catch(() => undefined)
                        }
                        disabled={pendingAction === `delete-${contextLabel.id}`}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-error/30 bg-error-muted px-4 text-sm font-semibold text-error disabled:opacity-50"
                      >
                        {pendingAction === `delete-${contextLabel.id}`
                          ? "Deleting…"
                          : "Delete definition"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SettingsConnected() {
  const connection = useConnection();
  const { store } = useGateway();
  const agentCount = useStore(store, (state) => state.agents.items.length);
  const sessionCount = useStore(store, (state) => Object.keys(state.sessions.byId).length);
  const runCount = useStore(store, (state) => Object.keys(state.runs.byId).length);

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
      <h2 className="text-xl font-semibold tracking-tight">Live state</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SettingCard label="Socket status" value={connection.status} />
        <SettingCard label="Agents" value={String(agentCount)} />
        <SettingCard label="Sessions" value={String(sessionCount)} />
        <SettingCard label="Dispatches" value={String(runCount)} />
      </div>
      {connection.error ? (
        <div className="mt-4 rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
          {connection.error}
        </div>
      ) : null}
    </section>
  );
}

function SettingCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
        {props.label}
      </div>
      <div className="mt-2 text-sm font-medium">{props.value}</div>
    </div>
  );
}

function integrationTone(status: KanbanIntegrationConnection["status"]): string {
  switch (status) {
    case "connected":
      return "border-success/20 bg-success/10 text-success";
    case "partial-setup":
    case "missing-scopes":
      return "border-warning/20 bg-warning/10 text-warning";
    case "expired-auth":
    case "failing":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-border bg-background text-foreground-muted";
  }
}

function IntegrationCard(props: { integration: KanbanIntegrationConnection }) {
  const { integration } = props;
  const blockedActions = [
    integration.actions.canCreatePullRequest ? null : "create linked PRs",
    integration.actions.canManagePullRequest ? null : "sync linked PR state",
    integration.actions.canApproveFromReview ? null : "approve from review",
  ].filter(Boolean);

  return (
    <article className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{integration.label}</div>
          <div className="mt-1 text-xs text-foreground-muted">
            {integration.accountLabel ?? "No account selected"}
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs ${integrationTone(integration.status)}`}
        >
          {integration.status.replace(/-/g, " ")}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-foreground-muted">{integration.guidance}</p>

      {integration.failureMessage ? (
        <div className="mt-3 rounded-2xl border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">
          {integration.failureMessage}
        </div>
      ) : null}

      {integration.missingScopes?.length ? (
        <div className="mt-3 rounded-2xl border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
          Missing scopes: {integration.missingScopes.join(", ")}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {integration.prerequisites.map((prerequisite) => (
          <div
            key={prerequisite.key}
            className="rounded-xl border border-border bg-card px-3 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium text-foreground">{prerequisite.label}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  prerequisite.satisfied
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-warning/20 bg-warning/10 text-warning"
                }`}
              >
                {prerequisite.satisfied ? "ready" : "missing"}
              </span>
            </div>
            {prerequisite.guidance ? (
              <div className="mt-2 text-xs leading-5 text-foreground-muted">
                {prerequisite.guidance}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {blockedActions.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground-muted">
          Blocked actions: {blockedActions.join(", ")}.
          {integration.actions.reason ? ` ${integration.actions.reason}` : ""}
        </div>
      ) : null}
    </article>
  );
}
