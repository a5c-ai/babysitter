"use client";

import { Link, useNavigate } from "react-router-dom-v6";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Pause,
  Play,
  Power,
  RefreshCw,
  Siren,
  Webhook,
  XCircle,
} from "lucide-react";

import type {
  AutomationExecutionRecord,
  AutomationRuleSourceMetadata,
  AutomationTaskTemplate,
  AutomationTarget,
  TimerAutomationTrigger,
  WebhookAutomationTrigger,
} from "@a5c-ai/agent-mux-core/automation";
import type {
  AutomationRuleAction,
  AutomationRuleCollectionResponse,
  AutomationRuleTargetOption,
} from "@/lib/services/automation-rule-service";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, Tag, cx } from "@a5c-ai/compendium";
import { PageSection, PageShell } from "@/components/shared/page-shell";

type AutomationRuleRecord = AutomationRuleCollectionResponse["rules"][number];
type AutomationTriggerType = AutomationRuleCollectionResponse["availableTriggerTypes"][number];
type AutomationSourceKind = AutomationRuleSourceMetadata["kind"];
type AutomationPriority = NonNullable<AutomationTaskTemplate["priority"]>;

const EMPTY_SUMMARY = {
  totalCount: 0,
  visibleCount: 0,
  stateCounts: {
    draft: 0,
    active: 0,
    paused: 0,
    disabled: 0,
    archived: 0,
  },
  triggerCounts: {
    timer: 0,
    webhook: 0,
  },
  executionCount: 0,
  failureCount: 0,
  failingCount: 0,
} as const;

const PRIORITY_OPTIONS: readonly AutomationPriority[] = ["critical", "high", "medium", "low"];
const SOURCE_KIND_OPTIONS: readonly AutomationSourceKind[] = [
  "manual",
  "api",
  "external-system",
  "config-file",
];

interface AutomationFormState {
  readonly name: string;
  readonly triggerType: AutomationTriggerType;
  readonly cron: string;
  readonly timezone: string;
  readonly webhookPort: string;
  readonly webhookPath: string;
  readonly webhookAuthType: "none" | "bearer";
  readonly webhookToken: string;
  readonly webhookSourceEvent: string;
  readonly targetProjectId: string;
  readonly templateTitle: string;
  readonly templateSummary: string;
  readonly templateDescription: string;
  readonly templatePriority: AutomationPriority;
  readonly acceptanceCriteria: string;
  readonly sourceKind: AutomationSourceKind;
  readonly sourceProvider: string;
  readonly sourceExternalId: string;
  readonly sourcePath: string;
}

function createEmptyForm(targetOptions: readonly AutomationRuleTargetOption[]): AutomationFormState {
  return {
    name: "",
    triggerType: "timer",
    cron: "0 9 * * 1-5",
    timezone: "UTC",
    webhookPort: "4100",
    webhookPath: "/automations/incoming",
    webhookAuthType: "none",
    webhookToken: "",
    webhookSourceEvent: "",
    targetProjectId: targetOptions[0]?.projectId ?? "",
    templateTitle: "",
    templateSummary: "",
    templateDescription: "",
    templatePriority: "medium",
    acceptanceCriteria: "",
    sourceKind: "manual",
    sourceProvider: "",
    sourceExternalId: "",
    sourcePath: "",
  };
}

function createFormFromRule(rule: AutomationRuleRecord): AutomationFormState {
  return {
    name: rule.name,
    triggerType: rule.trigger.type,
    cron: rule.trigger.type === "timer" ? rule.trigger.cron : "0 9 * * 1-5",
    timezone: rule.trigger.type === "timer" ? rule.trigger.timezone ?? "UTC" : "UTC",
    webhookPort: rule.trigger.type === "webhook" ? String(rule.trigger.port) : "4100",
    webhookPath: rule.trigger.type === "webhook" ? rule.trigger.path ?? "" : "/automations/incoming",
    webhookAuthType:
      rule.trigger.type === "webhook" && rule.trigger.auth?.type === "bearer" ? "bearer" : "none",
    webhookToken:
      rule.trigger.type === "webhook" && rule.trigger.auth?.type === "bearer"
        ? rule.trigger.auth.token
        : "",
    webhookSourceEvent: rule.trigger.type === "webhook" ? rule.trigger.sourceEvent ?? "" : "",
    targetProjectId: rule.target.projectId,
    templateTitle: rule.template.title,
    templateSummary: rule.template.summary ?? "",
    templateDescription: rule.template.description ?? "",
    templatePriority: rule.template.priority ?? "medium",
    acceptanceCriteria: (rule.template.acceptanceCriteria ?? []).join("\n"),
    sourceKind: rule.source.kind,
    sourceProvider: rule.source.provider ?? "",
    sourceExternalId: rule.source.externalId ?? "",
    sourcePath: rule.source.path ?? "",
  };
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "Not yet triggered";
  }
  return new Date(value).toLocaleString();
}

function stateVariant(state: AutomationRuleRecord["state"]): "default" | "success" | "warning" | "error" | "info" | "pending" {
  switch (state) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "disabled":
      return "error";
    case "draft":
      return "pending";
    case "archived":
      return "default";
  }
  return "default";
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function triggerBadge(triggerType: AutomationTriggerType) {
  if (triggerType === "timer") {
    return {
      label: "Timer",
      icon: <Clock3 className="h-3.5 w-3.5" />,
      variant: "info" as const,
    };
  }

  return {
    label: "Webhook",
    icon: <Webhook className="h-3.5 w-3.5" />,
    variant: "warning" as const,
  };
}

function executionStatusVariant(
  status: AutomationExecutionRecord["status"],
): "success" | "warning" | "error" {
  switch (status) {
    case "created":
      return "success";
    case "coalesced":
      return "warning";
    case "rejected":
      return "error";
  }
  return "warning";
}

function executionStatusIcon(status: AutomationExecutionRecord["status"]) {
  switch (status) {
    case "created":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "coalesced":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "rejected":
      return <XCircle className="h-3.5 w-3.5" />;
  }
}

function readExecutionMetadataString(
  execution: AutomationExecutionRecord,
  key: string,
): string | undefined {
  const value = execution.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readExecutionSummaryLabel(execution: AutomationExecutionRecord): string {
  return (
    readExecutionMetadataString(execution, "triggerEventSummary") ??
    readExecutionMetadataString(execution, "eventName") ??
    execution.reason ??
    (execution.status === "created" ? "Created work item" : `${titleCase(execution.status)} delivery`)
  );
}

function buildBoardHref(execution: AutomationExecutionRecord): string {
  const params = new URLSearchParams();
  if (execution.issueId) {
    params.set("issueId", execution.issueId);
  }
  if (execution.issueKey) {
    params.set("issueKey", execution.issueKey);
  }
  const query = params.toString();
  const boardPath = `/projects/${encodeURIComponent(execution.boardProjectId)}/board`;
  return query ? `${boardPath}?${query}` : boardPath;
}

function readTriggerSummary(rule: AutomationRuleRecord): string {
  if (rule.trigger.type === "timer") {
    return `${rule.trigger.cron}${rule.trigger.timezone ? ` · ${rule.trigger.timezone}` : ""}`;
  }

  return [
    `POST ${rule.trigger.path || "/"}`,
    `:${rule.trigger.port}`,
    rule.trigger.sourceEvent ? `event ${rule.trigger.sourceEvent}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function readTargetOption(
  rule: AutomationRuleRecord,
  options: readonly AutomationRuleTargetOption[],
): AutomationRuleTargetOption | undefined {
  return options.find((option) => option.projectId === rule.target.projectId);
}

function readAcceptanceCriteria(value: string): string[] | undefined {
  const entries = value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : undefined;
}

function buildPayload(
  form: AutomationFormState,
  targetOptions: readonly AutomationRuleTargetOption[],
): Record<string, unknown> {
  const targetOption = targetOptions.find((option) => option.projectId === form.targetProjectId);
  if (!targetOption) {
    throw new Error("Select a target project before saving.");
  }

  const target: AutomationTarget = {
    projectId: targetOption.projectId,
    boardProjectId: targetOption.boardProjectId,
  };

  const trigger: TimerAutomationTrigger | WebhookAutomationTrigger =
    form.triggerType === "timer"
      ? {
          type: "timer",
          cron: form.cron.trim(),
          timezone: form.timezone.trim() || undefined,
        }
      : {
          type: "webhook",
          port: Number.parseInt(form.webhookPort, 10),
          path: form.webhookPath.trim() || undefined,
          method: "POST",
          auth:
            form.webhookAuthType === "bearer"
              ? {
                  type: "bearer",
                  token: form.webhookToken.trim(),
                }
              : { type: "none" },
          sourceEvent: form.webhookSourceEvent.trim() || undefined,
        };

  const template: AutomationTaskTemplate = {
    title: form.templateTitle.trim(),
    summary: form.templateSummary.trim() || undefined,
    description: form.templateDescription.trim() || undefined,
    priority: form.templatePriority,
    acceptanceCriteria: readAcceptanceCriteria(form.acceptanceCriteria),
  };

  const source = {
    kind: form.sourceKind,
    provider: form.sourceProvider.trim() || undefined,
    externalId: form.sourceExternalId.trim() || undefined,
    path: form.sourcePath.trim() || undefined,
  };

  return {
    name: form.name.trim(),
    trigger,
    target,
    routing: {
      issue: {
        action: "canonical-issue-create",
        projectId: target.projectId,
      },
      board: {
        action: "shared-board-derive",
        boardProjectId: target.boardProjectId,
      },
      mutateBoardDirectly: false,
    },
    template,
    source,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | { error?: string } | null;
  if (!response.ok) {
    throw new Error((payload as { error?: string } | null)?.error ?? `Request failed: ${response.status}`);
  }
  return payload as T;
}

export function AutomationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AutomationRuleCollectionResponse | null>(null);
  const [form, setForm] = useState<AutomationFormState>(() => createEmptyForm([]));
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function loadAutomations(options?: { preserveForm?: boolean }) {
    const preserveForm = options?.preserveForm ?? false;
    setRefreshing(true);
    setError(null);
    try {
      const payload = await readJson<AutomationRuleCollectionResponse>(await fetch("/api/automations"));
      setData(payload);
      if (!preserveForm) {
        setForm(createEmptyForm(payload.targetOptions));
        setEditingRuleId(null);
      } else if (!editingRuleId) {
        setForm((current) => ({
          ...current,
          targetProjectId: current.targetProjectId || payload.targetOptions[0]?.projectId || "",
        }));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAutomations();
  }, []);

  const rules = data?.rules ?? [];
  const targetOptions = data?.targetOptions ?? [];
  const summary = data?.summary ?? EMPTY_SUMMARY;

  const selectedTarget = useMemo(
    () => targetOptions.find((option) => option.projectId === form.targetProjectId),
    [form.targetProjectId, targetOptions],
  );

  function updateForm<Key extends keyof AutomationFormState>(key: Key, value: AutomationFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startCreate() {
    setEditingRuleId(null);
    setForm(createEmptyForm(targetOptions));
    setError(null);
  }

  function startEdit(rule: AutomationRuleRecord) {
    setEditingRuleId(rule.id);
    setForm(createFormFromRule(rule));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload(form, targetOptions);
      const response = await fetch(
        editingRuleId ? `/api/automations/${editingRuleId}` : "/api/automations",
        {
          method: editingRuleId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...payload,
            ...(editingRuleId ? { updatedBy: "operator" } : { createdBy: "operator" }),
          }),
        },
      );

      await readJson(response);
      await loadAutomations();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleLifecycleAction(rule: AutomationRuleRecord, action: AutomationRuleAction) {
    const actionKey = `${action}:${rule.id}`;
    setPendingAction(actionKey);
    setError(null);

    try {
      if (action === "delete") {
        const response = await fetch(`/api/automations/${rule.id}`, { method: "DELETE" });
        await readJson(response);
      } else {
        const response = await fetch(`/api/automations/${rule.id}/lifecycle`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, updatedBy: "operator" }),
        });
        await readJson(response);
      }

      await loadAutomations({ preserveForm: editingRuleId !== null });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <PageShell>
      <PageSection>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              Automation control plane
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Dedicated rule authoring and operational control
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
              Manage timer and webhook rules here so the board stays focused on generated work.
              This surface exposes lifecycle state, target routing, and automation authorship
              through the existing shared automation API.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void loadAutomations({ preserveForm: editingRuleId !== null })} disabled={refreshing}>
              <RefreshCw className={cx("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh rules
            </Button>
            <Button variant="ghost" onClick={() => navigate("/projects")}>
              Back to board
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-7">
          <SummaryTile label="Visible rules" value={String(summary.visibleCount)} tone="info" />
          <SummaryTile label="Active" value={String(summary.stateCounts.active)} tone="success" />
          <SummaryTile label="Paused" value={String(summary.stateCounts.paused)} tone="warning" />
          <SummaryTile label="Failing" value={String(summary.failingCount)} tone="error" />
          <SummaryTile label="Timers" value={String(summary.triggerCounts.timer)} tone="info" />
          <SummaryTile label="Webhooks" value={String(summary.triggerCounts.webhook)} tone="warning" />
          <SummaryTile label="Failures" value={String(summary.failureCount)} tone="error" />
        </div>
      </PageSection>

      {error ? (
        <section className="rounded-3xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
        <div className="rounded-3xl">
            <div className="border-b border-border/70 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                    {editingRuleId ? "Edit rule" : "Create rule"}
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {editingRuleId ? "Update an automation rule" : "Author a new automation rule"}
                  </h2>
                </div>
                {editingRuleId ? (
                  <Button variant="ghost" onClick={startCreate}>
                    New rule
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="pt-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <FormField label="Rule name">
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Daily digest triage"
                    className="tkc-input"
                    required
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Trigger type">
                    <select
                      value={form.triggerType}
                      onChange={(event) => updateForm("triggerType", event.target.value as AutomationTriggerType)}
                      className="tkc-input"
                    >
                      <option value="timer">Timer</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </FormField>

                  <FormField label="Target project">
                    <select
                      value={form.targetProjectId}
                      onChange={(event) => updateForm("targetProjectId", event.target.value)}
                      className="tkc-input"
                      required
                    >
                      {targetOptions.map((option) => (
                        <option key={option.projectId} value={option.projectId}>
                          {option.key} · {option.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {form.triggerType === "timer" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Cron schedule">
                      <input
                        value={form.cron}
                        onChange={(event) => updateForm("cron", event.target.value)}
                        placeholder="0 9 * * 1-5"
                        className="tkc-input font-mono"
                        required
                      />
                    </FormField>
                    <FormField label="Timezone">
                      <input
                        value={form.timezone}
                        onChange={(event) => updateForm("timezone", event.target.value)}
                        placeholder="UTC"
                        className="tkc-input"
                      />
                    </FormField>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Webhook port">
                        <input
                          type="number"
                          value={form.webhookPort}
                          onChange={(event) => updateForm("webhookPort", event.target.value)}
                          min={1}
                          className="tkc-input font-mono"
                          required
                        />
                      </FormField>
                      <FormField label="Webhook path">
                        <input
                          value={form.webhookPath}
                          onChange={(event) => updateForm("webhookPath", event.target.value)}
                          placeholder="/automations/incoming"
                          className="tkc-input font-mono"
                        />
                      </FormField>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField label="Auth">
                        <select
                          value={form.webhookAuthType}
                          onChange={(event) => updateForm("webhookAuthType", event.target.value as "none" | "bearer")}
                          className="tkc-input"
                        >
                          <option value="none">None</option>
                          <option value="bearer">Bearer token</option>
                        </select>
                      </FormField>
                      <FormField label="Source event">
                        <input
                          value={form.webhookSourceEvent}
                          onChange={(event) => updateForm("webhookSourceEvent", event.target.value)}
                          placeholder="github.issue.created"
                          className="tkc-input"
                        />
                      </FormField>
                      <FormField label="HTTP method">
                        <input value="POST" className="tkc-input font-mono text-foreground-muted" disabled />
                      </FormField>
                    </div>

                    {form.webhookAuthType === "bearer" ? (
                      <FormField label="Bearer token">
                        <input
                          value={form.webhookToken}
                          onChange={(event) => updateForm("webhookToken", event.target.value)}
                          placeholder="secret-token"
                          className="tkc-input font-mono"
                          required
                        />
                      </FormField>
                    ) : null}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Task title">
                    <input
                      value={form.templateTitle}
                      onChange={(event) => updateForm("templateTitle", event.target.value)}
                      placeholder="Review the daily digest"
                      className="tkc-input"
                      required
                    />
                  </FormField>
                  <FormField label="Priority">
                    <select
                      value={form.templatePriority}
                      onChange={(event) => updateForm("templatePriority", event.target.value as AutomationPriority)}
                      className="tkc-input"
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Task summary">
                  <input
                    value={form.templateSummary}
                    onChange={(event) => updateForm("templateSummary", event.target.value)}
                    placeholder="Create a triage issue on the shared board."
                    className="tkc-input"
                  />
                </FormField>

                <FormField label="Task description">
                  <textarea
                    value={form.templateDescription}
                    onChange={(event) => updateForm("templateDescription", event.target.value)}
                    placeholder="Include operator instructions, expected routing, and follow-up notes."
                    className="tkc-input min-h-28 resize-y"
                  />
                </FormField>

                <FormField label="Acceptance criteria">
                  <textarea
                    value={form.acceptanceCriteria}
                    onChange={(event) => updateForm("acceptanceCriteria", event.target.value)}
                    placeholder={"Issue lands on the correct board\nOwner sees routing metadata"}
                    className="tkc-input min-h-24 resize-y"
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Source kind">
                    <select
                      value={form.sourceKind}
                      onChange={(event) => updateForm("sourceKind", event.target.value as AutomationSourceKind)}
                      className="tkc-input"
                    >
                      {SOURCE_KIND_OPTIONS.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Source provider">
                    <input
                      value={form.sourceProvider}
                      onChange={(event) => updateForm("sourceProvider", event.target.value)}
                      placeholder="github"
                      className="tkc-input"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Source external id">
                    <input
                      value={form.sourceExternalId}
                      onChange={(event) => updateForm("sourceExternalId", event.target.value)}
                      placeholder="digest-job"
                      className="tkc-input"
                    />
                  </FormField>
                  <FormField label="Source path">
                    <input
                      value={form.sourcePath}
                      onChange={(event) => updateForm("sourcePath", event.target.value)}
                      placeholder="configs/automations.yml"
                      className="tkc-input font-mono"
                    />
                  </FormField>
                </div>

                <div className="rounded-2xl border border-border bg-background-secondary/50 p-4 text-sm text-foreground-muted">
                  <p className="font-semibold text-foreground">Resolved routing</p>
                  <p className="mt-2">
                    Canonical issue create →
                    <span className="font-mono"> {selectedTarget?.projectId ?? "select a project"}</span>
                  </p>
                  <p className="mt-1">
                    Shared board derive →
                    <span className="font-mono"> {selectedTarget?.boardProjectId ?? "select a board"}</span>
                  </p>
                  <p className="mt-1">Board mutation stays indirect so generated work still flows through issues.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="primary" disabled={saving || targetOptions.length === 0}>
                    {saving ? "Saving..." : editingRuleId ? "Save changes" : "Create rule"}
                  </Button>
                  {editingRuleId ? (
                    <Button type="button" variant="ghost" onClick={startCreate}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-3xl p-6 text-sm text-foreground-muted">Loading automation rules…</div>
            ) : rules.length === 0 ? (
              <div className="rounded-3xl p-6">
                <EmptyState
                  title="No automation rules yet"
                  description="Create a timer or webhook rule to route generated work into the board without crowding the dashboard."
                />
              </div>
            ) : (
              rules.map((rule) => {
                const trigger = triggerBadge(rule.triggerType);
                const targetMeta = readTargetOption(rule, targetOptions);

                return (
                  <div key={rule.id} className="tkc-panel rounded-3xl">
                    <div className="border-b border-border/70 pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold tracking-tight">{rule.name}</h2>
                            <Tag>{rule.state}</Tag>
                            {rule.executionSummary.isFailing ? (
                              <Tag>failing</Tag>
                            ) : null}
                            <Tag>
                              {trigger.icon}
                              {trigger.label}
                            </Tag>
                          </div>
                          <p className="mt-2 text-sm text-foreground-muted">{readTriggerSummary(rule)}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => startEdit(rule)}>
                            Edit
                          </Button>
                          {rule.allowedActions.map((action) => (
                            <ActionButton
                              key={action}
                              action={action}
                              disabled={pendingAction === `${action}:${rule.id}`}
                              onClick={() => void handleLifecycleAction(rule, action)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <DetailBlock
                        title="Target routing"
                        icon={<ArrowRightLeft className="h-4 w-4" />}
                        lines={[
                          `${targetMeta?.key ?? "UNK"} · ${targetMeta?.name ?? rule.target.projectId}`,
                          `Issue target: ${rule.routing.issue.projectId}`,
                          `Board target: ${rule.routing.board.boardProjectId}`,
                          targetMeta?.linkedRunProjectName
                            ? `Linked run project: ${targetMeta.linkedRunProjectName}`
                            : `Project id: ${rule.target.projectId}`,
                        ]}
                      />

                      <DetailBlock
                        title="Operational state"
                        icon={<Siren className="h-4 w-4" />}
                        lines={[
                          `State: ${rule.executionSummary.isFailing ? `${rule.state} · failing` : rule.state}`,
                          `Allowed actions: ${rule.allowedActions.join(", ")}`,
                          `Created: ${formatTimestamp(rule.audit.createdAt)}`,
                          `Updated: ${formatTimestamp(rule.audit.updatedAt)}`,
                          `Last triggered: ${formatTimestamp(rule.audit.lastTriggeredAt)}`,
                          `Last failure: ${formatTimestamp(rule.executionSummary.lastFailureAt)}`,
                        ]}
                      />

                      <DetailBlock
                        title="Template payload"
                        lines={[
                          rule.template.title,
                          rule.template.summary ?? "No summary",
                          `Priority: ${rule.template.priority ?? "medium"}`,
                          rule.template.acceptanceCriteria?.length
                            ? `Acceptance: ${rule.template.acceptanceCriteria.join(" · ")}`
                            : "Acceptance: none",
                        ]}
                      />

                      <DetailBlock
                        title="Source metadata"
                        lines={[
                          `Kind: ${rule.source.kind}`,
                          `Provider: ${rule.source.provider ?? "n/a"}`,
                          `External id: ${rule.source.externalId ?? "n/a"}`,
                          `Path: ${rule.source.path ?? "n/a"}`,
                        ]}
                      />

                      <ExecutionHistoryBlock rule={rule} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>
    </PageShell>
  );
}

function SummaryTile(props: {
  label: string;
  value: string;
  tone: "info" | "success" | "warning" | "error";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-4 shadow-sm",
        props.tone === "success" && "border-success/20 bg-success/10",
        props.tone === "warning" && "border-warning/20 bg-warning/10",
        props.tone === "info" && "border-info/20 bg-info/10",
        props.tone === "error" && "border-error/20 bg-error/10",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground-muted">{props.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{props.value}</p>
    </div>
  );
}

function FormField(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
        {props.label}
      </span>
      {props.children}
    </label>
  );
}

function DetailBlock(props: { title: string; lines: readonly string[]; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background-secondary/45 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-foreground-muted">
        {props.icon}
        {props.title}
      </div>
      <div className="mt-3 grid gap-2 text-sm text-foreground-muted">
        {props.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function ExecutionHistoryBlock(props: { rule: AutomationRuleRecord }) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-background-secondary/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-foreground-muted">
          <Siren className="h-4 w-4" />
          Recent deliveries
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag>{props.rule.executionSummary.totalCount} total</Tag>
          <Tag>{props.rule.executionSummary.createdCount} created</Tag>
          <Tag>{props.rule.executionSummary.coalescedCount} coalesced</Tag>
          <Tag>{props.rule.executionSummary.rejectedCount} rejected</Tag>
        </div>
      </div>

      {props.rule.recentExecutions.length === 0 ? (
        <p className="mt-3 text-sm text-foreground-muted">No deliveries have been recorded for this rule yet.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {props.rule.recentExecutions.map((execution) => (
            <div
              key={execution.id}
              className="rounded-2xl border border-border bg-card/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag>
                      {executionStatusIcon(execution.status)}
                      {execution.status}
                    </Tag>
                    <Tag>
                      {execution.triggerType === "timer" ? <Clock3 className="h-3.5 w-3.5" /> : <Webhook className="h-3.5 w-3.5" />}
                      {execution.triggerType}
                    </Tag>
                    <span className="text-xs text-foreground-muted">{formatTimestamp(execution.triggeredAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {readExecutionSummaryLabel(execution)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-foreground-muted">
                    <span>Actor: {execution.triggeredBy}</span>
                    {execution.deliveryId ? <span>Delivery: {execution.deliveryId}</span> : null}
                    {readExecutionMetadataString(execution, "triggerEventSource") ? (
                      <span>Event: {readExecutionMetadataString(execution, "triggerEventSource")}</span>
                    ) : null}
                  </div>
                </div>

                {execution.issueId ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.assign(buildBoardHref(execution));
                      }
                    }}
                  >
                    {execution.issueKey ?? execution.issueId}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              {execution.reason ? (
                <p className="mt-3 text-sm text-foreground-muted">{execution.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton(props: {
  action: AutomationRuleAction;
  disabled: boolean;
  onClick: () => void;
}) {
  const config = (() => {
    switch (props.action) {
      case "enable":
      case "resume":
        return {
          icon: <Play className="mr-2 h-4 w-4" />,
          label: props.action === "enable" ? "Enable" : "Resume",
          variant: "ghost" as const,
        };
      case "pause":
        return {
          icon: <Pause className="mr-2 h-4 w-4" />,
          label: "Pause",
          variant: "ghost" as const,
        };
      case "disable":
        return {
          icon: <Power className="mr-2 h-4 w-4" />,
          label: "Disable",
          variant: "ghost" as const,
        };
      case "delete":
        return {
          icon: <Power className="mr-2 h-4 w-4" />,
          label: "Delete",
          variant: "ghost" as const,
        };
    }
  })();

  return (
    <Button type="button" variant={config.variant} onClick={props.onClick} disabled={props.disabled}>
      {config.icon}
      {config.label}
    </Button>
  );
}
