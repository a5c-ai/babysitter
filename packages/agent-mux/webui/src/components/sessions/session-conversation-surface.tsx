"use client";

import { Link, useNavigate } from "react-router-dom-v6";
import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useStore } from "zustand";
import type { Attachment, WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import type {
  AgentFlowLane,
  AgentFlowSegment,
  SessionCost,
  SessionFlowFileRecord,
  SessionFlowModel,
  SessionTranscriptNode,
} from "@a5c-ai/agent-mux-ui/session-flow";
import { accumulateEventCost, buildSessionFlowModel } from "@a5c-ai/agent-mux-ui/session-flow";
import type { AgentRecord } from "@a5c-ai/agent-mux-ui/gateway";
import { AlertTriangle, FileImage, FileStack, Files, LoaderCircle, MessagesSquare, PlayCircle, RefreshCw, Sparkles, WandSparkles } from "lucide-react";

import { ProgressBar } from "@/components/shared/progress-bar";
import { TaskTagAutocompleteTextarea } from "@/components/task-tags/task-tag-autocomplete-textarea";
import { Button, Select } from "@a5c-ai/compendium";
import { useTaskTags } from "@/hooks/use-task-tags";
import { cx } from "@a5c-ai/compendium";
import { useGateway } from "@/lib/agent-mux-ui";

type EventBuffer = {
  events: Array<Record<string, unknown>>;
};

type ConversationViewMode = "transcript" | "flow" | "files";
type ApprovalMode = "yolo" | "prompt" | "deny";

type ComposerSubmitInput = {
  sessionId: string;
  prompt: string;
  agent?: string;
  model?: string;
  attachments?: Attachment[];
  approvalMode?: ApprovalMode;
};

type PendingAttachment = Attachment & {
  id: string;
  isImage: boolean;
  previewUrl?: string;
  size: number;
};

type SessionConversationSurfaceProps = {
  sessionId: string;
  sessionLabel: string;
  sessionAgent: string;
  sessionStatus: string;
  sessionModel?: string | null;
  runs: Array<Record<string, unknown>>;
  eventBuffers: Record<string, EventBuffer | undefined>;
  workspacePath?: string | null;
  runtime?: WorkspaceRuntimeSurface;
  disabled?: boolean;
  emptyStateTitle: string;
  emptyStateBody: string;
  openSessionHref?: string;
  submitLabel?: string;
  placeholder: string;
  flowModelOverride?: SessionFlowModel;
  sessionCostOverride?: SessionCost | null;
  onSubmit: (input: ComposerSubmitInput) => Promise<void>;
};

function formatUsd(totalUsd: number | null | undefined): string {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return "unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTimestamp(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "timestamp unavailable";
  }
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || value.startsWith("\\\\") || /^[a-zA-Z]:[\\/]/.test(value);
}

function joinWorkspacePath(workspacePath: string, filePath: string): string {
  const separator = workspacePath.includes("\\") ? "\\" : "/";
  const base = workspacePath.replace(/[\\/]+$/, "");
  const relative = filePath.replace(/^[./\\\/]+/, "");
  return `${base}${separator}${relative}`;
}

function resolveAbsoluteFilePath(workspacePath: string | null | undefined, filePath: string): string | null {
  if (!filePath.trim()) {
    return null;
  }
  if (isAbsolutePath(filePath)) {
    return filePath;
  }
  if (!workspacePath) {
    return null;
  }
  return joinWorkspacePath(workspacePath, filePath);
}

function buildEditorHref(path: string): string {
  return `vscode://file${path}`;
}

function appendToPrompt(current: string, addition: string): string {
  if (!addition.trim()) {
    return current;
  }
  if (!current.trim()) {
    return addition;
  }
  return `${current.trimEnd()}\n${addition}`;
}

function formatFileReference(path: string): string {
  return `Relevant file: ${path}`;
}

function buildAttachedFilePrompt(path: string): string {
  return `Use the attached file: ${path}`;
}

function fileNameFromPath(path: string): string {
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments.at(-1) ?? path;
}

function nodeTone(kind: SessionTranscriptNode["kind"], status?: string): string {
  if (status === "error" || kind === "error") {
    return "border-error/25 bg-error/8";
  }
  switch (kind) {
    case "user":
      return "border-primary/20 bg-primary/6";
    case "assistant":
      return "border-success/20 bg-success/6";
    case "thinking":
      return "border-warning/25 bg-warning/8";
    case "tool":
      return "border-info/25 bg-info/8";
    case "system":
      return "border-border bg-background/75";
    case "branch":
      return "border-primary/20 bg-primary/8";
    default:
      return "border-border bg-background/75";
  }
}

function badgeTone(kind: SessionTranscriptNode["kind"], status?: string): string {
  if (status === "error" || kind === "error") {
    return "border-error/25 bg-error/10 text-error";
  }
  switch (kind) {
    case "user":
      return "border-primary/20 bg-primary/10 text-primary";
    case "assistant":
      return "border-success/20 bg-success/10 text-success";
    case "thinking":
      return "border-warning/20 bg-warning/10 text-warning";
    case "tool":
      return "border-info/20 bg-info/10 text-info";
    case "branch":
      return "border-primary/20 bg-primary/10 text-primary";
    default:
      return "border-border bg-background text-foreground-muted";
  }
}

function approvalModeLabel(mode: ApprovalMode): string {
  switch (mode) {
    case "yolo":
      return "Auto approve";
    case "deny":
      return "Auto deny";
    default:
      return "Prompt";
  }
}

function readApprovalModes(record: AgentRecord | null): ApprovalMode[] {
  const values = Array.isArray(record?.approvalModes)
    ? record.approvalModes.filter(
        (mode): mode is ApprovalMode => mode === "yolo" || mode === "prompt" || mode === "deny",
      )
    : [];
  return values.length > 0 ? values : ["prompt"];
}

function computeProgress(lanes: AgentFlowLane[]): number {
  const activeLane = [...lanes].reverse().find((lane) => lane.status === "running");
  if (!activeLane) {
    return lanes.length > 0 ? 100 : 0;
  }
  const totalSegments = activeLane.segments.length;
  if (totalSegments === 0) {
    return 0;
  }
  const settledSegments = activeLane.segments.filter((segment) => segment.status !== "running").length;
  return Math.round((settledSegments / totalSegments) * 100);
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error(`Failed to read ${file.name}`));
    };
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function normalizeAttachments(files: FileList | null): Promise<PendingAttachment[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const attachments = await Promise.all(
    Array.from(files).map(async (file, index) => {
      const dataUrl = await readFileAsDataUrl(file);
      const [, base64 = ""] = dataUrl.split(",", 2);
      const mimeType = file.type || "application/octet-stream";
      const isImage = mimeType.startsWith("image/");
      return {
        id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        mimeType,
        base64,
        size: file.size,
        isImage,
        previewUrl: isImage ? dataUrl : undefined,
      } satisfies PendingAttachment;
    }),
  );

  return attachments;
}

function EmptyConversationState(props: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm">
      <div className="font-medium text-foreground">{props.title}</div>
      <p className="mt-2 leading-6 text-foreground-muted">{props.body}</p>
    </div>
  );
}

function MetricCard(props: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">{props.label}</div>
      <div className="mt-2 text-sm font-semibold text-foreground">{props.value}</div>
      {props.detail ? <div className="mt-1 text-xs text-foreground-muted">{props.detail}</div> : null}
    </div>
  );
}

function SegmentBadge(props: { segment: AgentFlowSegment }) {
  return (
    <span
      className={cx(
        "rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.16em]",
        props.segment.status === "error"
          ? "border-error/25 bg-error/10 text-error"
          : props.segment.status === "running"
            ? "border-warning/20 bg-warning/10 text-warning"
            : "border-border bg-background text-foreground-muted",
      )}
    >
      {props.segment.kind}
    </span>
  );
}

function TranscriptCard(props: {
  node: SessionTranscriptNode;
  workspacePath?: string | null;
  onReuseText: (text: string) => void;
  onMentionFile: (path: string) => void;
  mentionLabel: string;
}) {
  const filePaths = props.node.filePaths.slice(0, 6);
  const isUser = props.node.kind === "user";
  return (
    <div className={cx("flex", isUser ? "justify-end" : "justify-start")}>
      <article className={cx("w-full max-w-[96%] rounded-[24px] border p-4 shadow-sm", nodeTone(props.node.kind, props.node.status))}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cx("rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.18em]", badgeTone(props.node.kind, props.node.status))}>
              {props.node.kind}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
              {props.node.label}
            </span>
            <Link to={`/dispatches/${props.node.runId}`} className="text-xs text-primary">
              {props.node.runId}
            </Link>
            <span className="text-xs text-foreground-muted">{formatTimestamp(props.node.timestamp)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => props.onReuseText(props.node.text)}>
              {props.node.kind === "user" ? "Edit" : "Reuse"}
            </Button>
          </div>
        </div>
        <pre className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground-secondary">
          {props.node.text}
        </pre>
        {filePaths.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {filePaths.map((path) => {
              const absolutePath = resolveAbsoluteFilePath(props.workspacePath, path);
              return (
                <div
                  key={`${props.node.id}-${path}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs"
                >
                  {absolutePath ? (
                    <a href={buildEditorHref(absolutePath)} target="_blank" rel="noreferrer" className="text-primary">
                      {path}
                    </a>
                  ) : (
                    <span className="text-foreground-secondary">{path}</span>
                  )}
                  <button type="button" className="text-foreground-muted hover:text-foreground" onClick={() => props.onMentionFile(path)}>
                    {props.mentionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
      </article>
    </div>
  );
}

function FilesCard(props: {
  file: SessionFlowFileRecord;
  workspacePath?: string | null;
  onMentionFile: (path: string) => void;
  mentionLabel: string;
}) {
  const absolutePath = resolveAbsoluteFilePath(props.workspacePath, props.file.path);
  return (
    <article className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {absolutePath ? (
            <a href={buildEditorHref(absolutePath)} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">
              {props.file.path}
            </a>
          ) : (
            <div className="text-sm font-medium text-foreground">{props.file.path}</div>
          )}
          <div className="mt-1 text-xs text-foreground-muted">
            {props.file.runIds.length} runs · {props.file.tools.length} tools
          </div>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => props.onMentionFile(props.file.path)}>
          {props.mentionLabel}
        </Button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Touches" value={formatNumber(props.file.touches)} />
        <MetricCard label="Reads" value={formatNumber(props.file.reads)} />
        <MetricCard label="Writes" value={formatNumber(props.file.writes)} />
        <MetricCard label="Last event" value={formatTimestamp(props.file.lastEventAt)} />
      </div>
      {props.file.tools.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.file.tools.map((tool) => (
            <span key={`${props.file.path}-${tool}`} className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
              {tool}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export type { ComposerSubmitInput };

export function SessionConversationSurface(props: SessionConversationSurfaceProps) {
  const { store } = useGateway();
  const navigate = useNavigate();
  const { taskTags } = useTaskTags();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRegionRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<ConversationViewMode>("transcript");
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(props.sessionAgent);
  const [selectedModel, setSelectedModel] = useState(props.sessionModel ?? "");
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("prompt");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFollowTranscript, setAutoFollowTranscript] = useState(true);

  const agentRecords = useStore(store, (state) => state.agents.byId);
  const runIds = useMemo(
    () => props.runs.map((run) => String(run.runId ?? "")).filter((runId) => runId.length > 0),
    [props.runs],
  );

  const flowModel = useMemo(
    () => props.flowModelOverride ?? buildSessionFlowModel(props.runs, props.eventBuffers),
    [props.eventBuffers, props.flowModelOverride, props.runs],
  );
  const sessionCost = useMemo(
    () => props.sessionCostOverride ?? accumulateEventCost(runIds, props.eventBuffers),
    [props.eventBuffers, props.sessionCostOverride, runIds],
  );
  const progressValue = useMemo(() => computeProgress(flowModel.lanes), [flowModel.lanes]);

  const sortedAgents = useMemo(() => {
    const entries = Object.values(agentRecords);
    return entries.sort((left, right) =>
      String(left.displayName ?? left.agent).localeCompare(String(right.displayName ?? right.agent)),
    );
  }, [agentRecords]);
  const selectedAgentRecord = agentRecords[selectedAgent] as AgentRecord | undefined;
  const agentApprovalModes = useMemo(
    () => readApprovalModes(selectedAgentRecord ?? null),
    [selectedAgentRecord],
  );
  const canAttachImages = selectedAgentRecord?.supportsImageInput === true;
  const canAttachFiles = selectedAgentRecord?.supportsFileAttachments === true;
  const canAttachAny = canAttachImages || canAttachFiles;
  const fileMentionLabel = canAttachFiles ? "Attach file" : "Insert path";
  const switchesAgent = selectedAgent !== props.sessionAgent;
  const transcriptSignature = useMemo(
    () => flowModel.transcript.map((node) => `${node.id}:${node.timestamp ?? 0}:${node.text.length}`).join("|"),
    [flowModel.transcript],
  );

  useEffect(() => {
    setPrompt("");
    setError(null);
    setAttachments([]);
    setSelectedAgent(props.sessionAgent);
    setSelectedModel(props.sessionModel ?? "");
    setApprovalMode("prompt");
    setAutoFollowTranscript(true);
  }, [props.sessionAgent, props.sessionId, props.sessionModel]);

  useEffect(() => {
    if (agentApprovalModes.includes(approvalMode)) {
      return;
    }
    setApprovalMode(agentApprovalModes[0] ?? "prompt");
  }, [agentApprovalModes, approvalMode]);

  useEffect(() => {
    if (canAttachAny) {
      return;
    }
    setAttachments([]);
  }, [canAttachAny]);

  useEffect(() => {
    if (viewMode !== "transcript") {
      return;
    }
    const region = scrollRegionRef.current;
    if (!region || !autoFollowTranscript) {
      return;
    }

    const scrollToBottom = () => {
      region.scrollTop = region.scrollHeight;
    };

    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      const frame = window.requestAnimationFrame(scrollToBottom);
      return () => window.cancelAnimationFrame(frame);
    }

    scrollToBottom();
    return undefined;
  }, [autoFollowTranscript, transcriptSignature, viewMode]);

  useEffect(() => {
    if (viewMode !== "transcript") {
      return;
    }

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "PageUp" && event.key !== "Home") {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      setAutoFollowTranscript(false);
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [viewMode]);

  function isNearTranscriptBottom(element: HTMLDivElement): boolean {
    return element.scrollHeight - (element.scrollTop + element.clientHeight) <= 48;
  }

  function handleTranscriptScroll(event: UIEvent<HTMLDivElement>) {
    if (viewMode !== "transcript") {
      return;
    }
    setAutoFollowTranscript(isNearTranscriptBottom(event.currentTarget));
  }

  function reuseText(text: string) {
    setPrompt((current) => appendToPrompt(current, text));
    setError(null);
  }

  function mentionFile(path: string) {
    const absolutePath = resolveAbsoluteFilePath(props.workspacePath, path);
    if (canAttachFiles && absolutePath) {
      setAttachments((current) => {
        if (current.some((attachment) => attachment.filePath === absolutePath)) {
          return current;
        }
        return [
          ...current,
          {
            id: `file:${absolutePath}`,
            filePath: absolutePath,
            name: fileNameFromPath(path),
            size: 0,
            isImage: false,
          },
        ];
      });
      setPrompt((current) => appendToPrompt(current, buildAttachedFilePrompt(path)));
      setError(null);
      setViewMode("transcript");
      return;
    }
    setPrompt((current) => appendToPrompt(current, formatFileReference(absolutePath ?? path)));
    if (canAttachFiles && !absolutePath) {
      setError("This agent can take files, but the workspace path could not be resolved. The path was inserted into the prompt instead.");
    } else {
      setError(null);
    }
    setViewMode("transcript");
  }

  async function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const next = await normalizeAttachments(event.currentTarget.files);
      setAttachments((current) => [...current, ...next]);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      event.currentTarget.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (props.disabled || submitting || (!prompt.trim() && attachments.length === 0)) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await props.onSubmit({
        sessionId: props.sessionId,
        prompt,
        agent: selectedAgent,
        model: selectedModel.trim() || undefined,
        attachments: attachments.map(({ id: _id, isImage: _isImage, previewUrl: _previewUrl, size: _size, ...attachment }) => attachment),
        approvalMode,
      });
      setPrompt("");
      setAttachments([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: Array<{
    id: ConversationViewMode;
    label: string;
    icon: typeof MessagesSquare;
  }> = [
    { id: "transcript", label: "Chat", icon: MessagesSquare },
    { id: "flow", label: "Trace", icon: Sparkles },
    { id: "files", label: "Files", icon: Files },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="rounded-2xl border border-border bg-background/65 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">Conversation</div>
            <div className="mt-1 text-sm font-medium text-foreground">{props.sessionLabel}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground-muted">
              <span className="rounded-full border border-border px-2 py-1">{props.sessionStatus}</span>
              <span className="rounded-full border border-border px-2 py-1">{props.sessionAgent}</span>
              {props.sessionModel ? (
                <span className="rounded-full border border-border px-2 py-1">{props.sessionModel}</span>
              ) : null}
              {props.runtime?.preview?.status === "ready" ? (
                <span className="rounded-full border border-success/20 bg-success/10 px-2 py-1 text-success">
                  preview ready
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {props.openSessionHref ? (
              <Button size="sm" variant="ghost" onClick={() => navigate(props.openSessionHref!)}>
                Open session
              </Button>
            ) : null}
            {props.workspacePath ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/workspaces?workspace=${encodeURIComponent(props.workspacePath!)}`)}
              >
                Open workspace
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={viewMode === tab.id ? "default" : "ghost"}
                onClick={() => setViewMode(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
        <div className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
          Transcript first, trace on demand
        </div>
      </div>

      <div
        ref={scrollRegionRef}
        className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
        data-testid="conversation-scroll-region"
        onScroll={handleTranscriptScroll}
      >
        {viewMode === "transcript" ? (
          <div className="grid gap-3">
            {flowModel.transcript.map((node) => (
              <TranscriptCard
                key={node.id}
                node={node}
                workspacePath={props.workspacePath}
                onReuseText={reuseText}
                onMentionFile={mentionFile}
                mentionLabel={fileMentionLabel}
              />
            ))}
            {flowModel.transcript.length === 0 ? (
              <EmptyConversationState title={props.emptyStateTitle} body={props.emptyStateBody} />
            ) : null}
          </div>
        ) : null}

        {viewMode === "flow" ? (
          <div className="grid gap-4">
            {flowModel.lanes.map((lane) => (
              <article key={lane.runId} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                        {lane.status}
                      </span>
                      <span className="text-sm font-medium text-foreground">{lane.agent}</span>
                      <Link to={`/dispatches/${lane.runId}`} className="text-xs text-primary">
                        {lane.runId}
                      </Link>
                    </div>
                    <div className="mt-1 text-xs text-foreground-muted">
                      {formatTimestamp(lane.startedAt)} · {lane.segmentCount} segments · {lane.toolCount} tools
                    </div>
                  </div>
                  <div className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
                    {formatUsd(lane.totalUsd)}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lane.segments.map((segment) => (
                    <div key={segment.id} className="rounded-2xl border border-border bg-card px-3 py-2">
                      <div className="flex items-center gap-2">
                        <SegmentBadge segment={segment} />
                        <span className="text-xs font-medium text-foreground">{segment.title}</span>
                      </div>
                      <div className="mt-1 max-w-[18rem] text-xs text-foreground-muted">
                        {segment.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {flowModel.lanes.length === 0 ? (
              <EmptyConversationState
                title="No flow events"
                body="Run lanes will appear here once the session starts publishing structured events."
              />
            ) : null}
          </div>
        ) : null}

        {viewMode === "files" ? (
          <div className="grid gap-3">
            {flowModel.files.map((file) => (
              <FilesCard
                key={file.path}
                file={file}
                workspacePath={props.workspacePath}
                onMentionFile={mentionFile}
                mentionLabel={fileMentionLabel}
              />
            ))}
            {flowModel.files.length === 0 ? (
              <EmptyConversationState
                title="No file attention yet"
                body="File touches will appear once the session reads or modifies paths through tools or system events."
              />
            ) : null}
          </div>
        ) : null}

        <details className="mt-4 rounded-2xl border border-border bg-card/60" data-testid="conversation-stats-details">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            Session stats
          </summary>
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-4 text-xs text-foreground-muted">
            <span className="rounded-full border border-border px-3 py-1.5">
              {formatNumber(flowModel.transcript.length)} messages
            </span>
            <span className="rounded-full border border-border px-3 py-1.5">
              {formatNumber(flowModel.files.filter((file) => file.writes > 0).length)} files changed
            </span>
            <span className="rounded-full border border-border px-3 py-1.5">
              {formatUsd(sessionCost?.totalUsd)} total cost
            </span>
          </div>
          <div className="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Token usage" value={formatNumber((sessionCost?.inputTokens ?? 0) + (sessionCost?.outputTokens ?? 0) + (sessionCost?.thinkingTokens ?? 0))} detail={`${formatNumber(sessionCost?.inputTokens)} in · ${formatNumber(sessionCost?.outputTokens)} out`} />
            <MetricCard label="Cost" value={formatUsd(sessionCost?.totalUsd)} detail={`${formatNumber(sessionCost?.thinkingTokens)} thinking tokens`} />
            <MetricCard label="Task progress" value={`${progressValue}%`} detail={`${flowModel.summary.pendingTools} pending tools`} />
            <MetricCard label="File changes" value={formatNumber(flowModel.files.filter((file) => file.writes > 0).length)} detail={`${formatNumber(flowModel.summary.fileCount)} files touched`} />
            <MetricCard label="Tools" value={formatNumber(flowModel.summary.totalTools)} detail={`${formatNumber(flowModel.summary.pendingTools)} still running`} />
          </div>
          <div className="border-t border-border px-4 py-4">
            <ProgressBar value={progressValue} variant="default" glow />
          </div>
        </details>
      </div>

      <div
        className="sticky bottom-0 z-10 mt-4 shrink-0 rounded-3xl border border-border bg-card/95 px-4 py-4 shadow-lg supports-[backdrop-filter]:bg-card/92"
        data-testid="conversation-composer"
      >
      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Send another turn</span>
          <TaskTagAutocompleteTextarea
            taskTags={taskTags}
            value={prompt}
            onValueChange={setPrompt}
            disabled={props.disabled}
            renderTextarea={(textareaProps) => (
              <textarea
                {...textareaProps}
                rows={6}
                placeholder={props.placeholder}
                className="min-h-36 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            )}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
          <span className="rounded-full border border-border px-3 py-1.5">Task tags via `@tag`</span>
          <span className="rounded-full border border-border px-3 py-1.5">
            {canAttachAny ? "Attachments enabled" : "This agent does not advertise attachment support"}
          </span>
          {canAttachImages ? (
            <span className="rounded-full border border-border px-3 py-1.5">Image input ready</span>
            ) : null}
        </div>

        {switchesAgent ? (
          <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Switching agents continues this prompt in a new session. The new session keeps the current workspace and issue link, then becomes the focused chat.
          </div>
        ) : null}

        <details className="rounded-2xl border border-border bg-card/60" data-testid="composer-options-details">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            Dispatch options
          </summary>
          <div className="grid gap-3 border-t border-border px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.9fr)_minmax(12rem,0.7fr)]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Agent</span>
              <Select
                value={selectedAgent}
                disabled={props.disabled || sortedAgents.length === 0}
                onChange={setSelectedAgent}
                options={
                  sortedAgents.length === 0
                    ? [{ label: selectedAgent, value: selectedAgent }]
                    : sortedAgents.map((agent) => ({
                        label: String(agent.displayName ?? agent.agent),
                        value: agent.agent,
                      }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Variant / model</span>
              <input
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                disabled={props.disabled}
                placeholder="Leave blank for session default"
                className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Approvals</span>
              <Select
                value={approvalMode}
                onChange={(value) => setApprovalMode(value as ApprovalMode)}
                disabled={props.disabled}
                options={agentApprovalModes.map((mode) => ({
                  label: approvalModeLabel(mode),
                  value: mode,
                }))}
              />
            </label>
          </div>
        </details>

        {attachments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {attachments.map((attachment) => (
              <article key={attachment.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                {attachment.isImage ? (
                  <FileImage className="h-4 w-4 text-primary" />
                ) : (
                  <FileStack className="h-4 w-4 text-primary" />
                )}
                      <div className="truncate text-sm font-medium text-foreground">{attachment.name ?? "attachment"}</div>
                    </div>
                    <div className="mt-1 text-xs text-foreground-muted">
                      {attachment.filePath ? "workspace file" : `${attachment.mimeType ?? "application/octet-stream"} · ${formatBytes(attachment.size)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-foreground-muted hover:text-foreground"
                    onClick={() =>
                      setAttachments((current) => current.filter((item) => item.id !== attachment.id))
                    }
                  >
                    Remove
                  </button>
                </div>
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.name ?? "attachment preview"} className="mt-3 max-h-36 rounded-xl border border-border object-cover" />
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={canAttachFiles ? undefined : canAttachImages ? "image/*" : undefined}
            className="hidden"
            onChange={(event) => void handleAttachmentChange(event)}
          />
          <Button
            type="submit"
            disabled={props.disabled || submitting || (!prompt.trim() && attachments.length === 0)}
          >
            {submitting ? "Sending..." : props.submitLabel ?? "Send turn"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={props.disabled || !canAttachAny}
            onClick={() => fileInputRef.current?.click()}
          >
            {canAttachImages ? <FileImage className="h-4 w-4" /> : <Files className="h-4 w-4" />}
            Attach
          </Button>
          <div className="rounded-full border border-border px-3 py-2 text-xs text-foreground-muted">
            {approvalMode === "prompt" ? (
              <>
                <PlayCircle className="mr-1 inline h-3.5 w-3.5" />
                Interactive approvals
              </>
            ) : approvalMode === "yolo" ? (
              <>
                <WandSparkles className="mr-1 inline h-3.5 w-3.5" />
                Auto-approve on restart
              </>
            ) : (
              <>
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                Auto-deny on restart
              </>
            )}
          </div>
          {submitting ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-foreground-muted">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Dispatching turn
            </div>
          ) : null}
          {!submitting && flowModel.summary.pendingTools > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/8 px-3 py-2 text-xs text-warning">
              <RefreshCw className="h-3.5 w-3.5" />
              {flowModel.summary.pendingTools} tool calls still running
            </div>
          ) : null}
        </div>
      </form>
      </div>
    </div>
  );
}
