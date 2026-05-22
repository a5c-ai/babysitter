import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { logger } from '@a5c-ai/agent-mux-observability';
import type { AgentMuxClient, AgentEvent, DeferredPromptTarget, RunHandle } from '@a5c-ai/agent-mux';
import { createRegistry, createContext, loadPlugins, type Registry } from './registry.js';
import type { TuiPlugin, TuiViewProps, EventRenderer } from './plugin.js';
import { EventStream } from './event-stream.js';
import {
  PromptInput,
  createEmptyPromptInputState,
  insertPromptInput,
  type PromptInputState,
} from './prompt-input.js';
import { CommandPalette, type PaletteAction } from './command-palette.js';
import { ModelPicker, type ModelOption } from './model-picker.js';
import { loadHistory, appendHistory } from './prompt-history-store.js';
import { resolveSessionDispatchPlan } from './session-dispatch.js';
import { createViewport, packSegments, type TuiSegment } from './layout.js';
import type { KanbanControlPlane } from './kanban-control-plane.js';

export interface AppProps {
  client: AgentMuxClient;
  plugins: TuiPlugin[];
  kanban?: KanbanControlPlane;
  defaultAgent?: string;
  initialViewId?: string;
  disableChatAutoPrompt?: boolean;
}

type ActiveRunCommand =
  | { kind: 'send'; prompt: string }
  | { kind: 'queue'; prompt: string; when: DeferredPromptTarget }
  | { kind: 'steer'; prompt: string; when: DeferredPromptTarget };

export function parseActiveRunCommand(prompt: string): ActiveRunCommand | null {
  if (prompt.startsWith('/queue ')) {
    const body = prompt.slice('/queue '.length).trim();
    return body ? { kind: 'queue', prompt: body, when: 'next-turn' } : null;
  }
  if (prompt.startsWith('/steer-tool ')) {
    const body = prompt.slice('/steer-tool '.length).trim();
    return body ? { kind: 'steer', prompt: body, when: 'after-tool' } : null;
  }
  if (prompt.startsWith('/steer ')) {
    const body = prompt.slice('/steer '.length).trim();
    return body ? { kind: 'steer', prompt: body, when: 'after-response' } : null;
  }
  return { kind: 'send', prompt };
}

function describeDeferredTarget(target: DeferredPromptTarget): string {
  switch (target) {
    case 'after-tool':
      return 'the next tool result';
    case 'after-response':
      return 'the next agent response';
    case 'next-turn':
      return 'the next turn';
    default:
      return 'a later event';
  }
}

export async function dispatchPromptToActiveRun(handle: RunHandle, prompt: string): Promise<string> {
  const command = parseActiveRunCommand(prompt);
  if (!command) {
    return 'Active-run command requires a message.';
  }
  if (command.kind === 'queue') {
    await handle.queue(command.prompt, { when: command.when });
    return `Queued for ${describeDeferredTarget(command.when)}…`;
  }
  if (command.kind === 'steer') {
    await handle.steer(command.prompt, { when: command.when });
    return `Steering after ${describeDeferredTarget(command.when)}…`;
  }
  await handle.send(command.prompt);
  return 'Sending to active run…';
}

function pickRenderers(renderers: EventRenderer[], ev: AgentEvent): EventRenderer | undefined {
  const specific = renderers.find((r) => r.id !== 'fallback' && r.match(ev));
  if (specific) return specific;
  return renderers.find((r) => r.id === 'fallback');
}

function SegmentLines({ lines }: { lines: TuiSegment[][] }) {
  return (
    <Box flexDirection="column">
      {lines.map((line, lineIndex) => (
        <Box key={`line:${lineIndex}`}>
          {line.map((segment, segmentIndex) => (
            <Text
              key={segment.key}
              color={segment.color}
              dimColor={segment.dimColor}
            >
              {segmentIndex > 0 ? ' · ' : ''}
              {segment.text}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

export function App({
  client,
  plugins,
  kanban,
  defaultAgent = 'claude',
  initialViewId = 'chat',
  disableChatAutoPrompt = false,
}: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [stdoutDimensions, setStdoutDimensions] = useState(() => ({
    width: stdout?.columns ?? 80,
    height: stdout?.rows ?? 24,
  }));
  useEffect(() => {
    if (!stdout) return;
    const sync = () => {
      setStdoutDimensions({
        width: stdout.columns ?? 80,
        height: stdout.rows ?? 24,
      });
    };
    sync();
    stdout.on('resize', sync);
    return () => {
      stdout.off('resize', sync);
    };
  }, [stdout]);
  const viewport = useMemo(
    () => createViewport(stdoutDimensions.width, stdoutDimensions.height),
    [stdoutDimensions.height, stdoutDimensions.width],
  );
  const [status, setStatus] = useState<string>('');
  const [pluginLoadVersion, setPluginLoadVersion] = useState(0);
  const [activeId, setActiveId] = useState<string>(initialViewId);
  const [promptMode, setPromptMode] = useState<boolean>(false);
  const [chatPromptDismissed, setChatPromptDismissed] = useState<boolean>(false);
  const [chatPromptState, setChatPromptState] = useState<PromptInputState>(() => createEmptyPromptInputState());
  const [pendingResume, setPendingResume] = useState<
    { agent: string; sessionId: string } | null
  >(null);
  const currentHandleRef = React.useRef<RunHandle | null>(null);
  const pendingApprovalRef = React.useRef<{ interactionId: string; action: string } | null>(null);
  const [pendingApproval, setPendingApproval] = useState<
    { interactionId: string; action: string; riskLevel: string } | null
  >(null);
  const [filterMode, setFilterMode] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('');
  const [paletteMode, setPaletteMode] = useState<boolean>(false);
  const [selection, setSelection] = useState<{ agent: string; sessionId: string } | undefined>(
    undefined,
  );
  const [issueSelection, setIssueSelection] = useState<{ issueId: string; projectId?: string } | undefined>(
    undefined,
  );
  const [workspaceSelection, setWorkspaceSelection] = useState<{ workspacePath: string } | undefined>(
    undefined,
  );
  const [returnViewId, setReturnViewId] = useState<string>('sessions');
  const [modelPickerMode, setModelPickerMode] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<ModelOption | undefined>(undefined);
  const [agentPickerMode, setAgentPickerMode] = useState<boolean>(false);
  const [currentAgent, setCurrentAgent] = useState<string | undefined>(undefined);
  const [profilePickerMode, setProfilePickerMode] = useState<boolean>(false);
  const [currentProfile, setCurrentProfile] = useState<string | undefined>(undefined);
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const diffLeftRef = React.useRef<{ agent: string; sessionId: string } | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>(() => loadHistory());
  const [activeSessions, setActiveSessions] = useState<ReadonlySet<string>>(() => new Set());
  function markActive(agent: string, sessionId: string) {
    setActiveSessions((prev) => {
      const next = new Set(prev);
      next.add(`${agent}:${sessionId}`);
      return next;
    });
  }
  function unmarkActive(agent: string, sessionId: string) {
    setActiveSessions((prev) => {
      const next = new Set(prev);
      next.delete(`${agent}:${sessionId}`);
      return next;
    });
  }
  const EXEC_MODES = ['normal', 'bypass', 'planning', 'deny'] as const;
  type ExecMode = (typeof EXEC_MODES)[number];
  const EXEC_MODE_COLORS: Record<ExecMode, string> = {
    normal: 'cyan',
    bypass: 'red',
    planning: 'yellow',
    deny: 'magenta',
  };
  const [execMode, setExecMode] = useState<ExecMode>('normal');
  const activeViewIdRef = React.useRef<string>(initialViewId);
  function cycleExecMode() {
    setExecMode((m) => {
      const i = EXEC_MODES.indexOf(m);
      const next = EXEC_MODES[(i + 1) % EXEC_MODES.length];
      setStatus(`Mode: ${next}`);
      return next;
    });
  }

  const availableModels = useMemo<ModelOption[]>(() => {
    try {
      const out: ModelOption[] = [];
      for (const a of client.adapters.list()) {
        for (const m of client.models.models(a.agent)) {
          out.push({ agent: a.agent, modelId: m.modelId });
        }
      }
      return out;
    } catch {
      return [];
    }
  }, [client]);

  const { registry, stream } = useMemo(() => {
    const r: Registry = createRegistry();
    const s = new EventStream();
    const ctx = createContext(
      client,
      r,
      (ev) => {
        void handleInternalEvent(ev, activeViewIdRef.current);
      },
      s,
      kanban,
    );
    void loadPlugins(plugins, ctx).then(() => {
      setPluginLoadVersion((version) => version + 1);
    });
    return { registry: r, stream: s };
  }, [client, plugins]);

  const active = registry.views.find((v) => v.id === activeId) ?? registry.views[0];
  activeViewIdRef.current = active?.id ?? activeId;

  useInput((input, key) => {
    if (promptMode || filterMode || paletteMode || modelPickerMode || profilePickerMode || agentPickerMode) return; // child input owns keys while open
    if (active?.id === 'chat' && chatPromptDismissed) {
      if (key.escape) {
        setChatPromptDismissed(false);
        setChatPromptState(createEmptyPromptInputState());
        const fallbackView = registry.views.find((view) => view.id !== 'chat');
        if (fallbackView) {
          setActiveId(fallbackView.id);
        }
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setChatPromptState((current) => insertPromptInput(current, input));
        setChatPromptDismissed(false);
        setPromptMode(true);
        return;
      }
    }
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      return;
    }
    // `p` intentionally not bound — chat view auto-focuses an inline prompt.
    if (input === '/') {
      setFilterMode(true);
      return;
    }
    if (input === ':' || (key.ctrl && input === 'k')) {
      setPaletteMode(true);
      return;
    }
    if (input === 'm' && availableModels.length > 0) {
      setModelPickerMode(true);
      return;
    }
    if (input === 'N') {
      setAgentPickerMode(true);
      return;
    }
    if (input === 'P') {
      void (async () => {
        try {
          const list = await client.profiles.list();
          setAvailableProfiles(list.map((p: { name: string }) => p.name));
          setProfilePickerMode(true);
        } catch (e) {
          setStatus(`profiles: ${(e as Error).message}`);
        }
      })();
      return;
    }
    if (input === 'i' && currentHandleRef.current) {
      void currentHandleRef.current.interrupt();
      setStatus('Interrupting current run…');
      return;
    }
    if (pendingApproval && currentHandleRef.current) {
      if (input === 'y') {
        void currentHandleRef.current.approve();
        setPendingApproval(null);
        pendingApprovalRef.current = null;
        setStatus('Approved.');
        return;
      }
      if (input === 'n') {
        void currentHandleRef.current.deny('Denied from TUI');
        setPendingApproval(null);
        pendingApprovalRef.current = null;
        setStatus('Denied.');
        return;
      }
    }
    for (const v of registry.views) {
      if (v.hotkey && input === v.hotkey) setActiveId(v.id);
    }
    for (const c of registry.commands) {
      if (input === c.hotkey) {
        void c.run({
          client,
          eventStream: stream,
          registerView: () => {},
          registerEventRenderer: () => {},
          registerCommand: () => {},
          registerPromptHandler: () => {},
          emit: (e) => void handleInternalEvent(e, activeViewIdRef.current),
        });
      }
    }
  });

  const navLines = useMemo(
    () =>
      packSegments(
        registry.views.map((v) => ({
          key: v.id,
          text: `[${v.hotkey ?? '?'}] ${v.title}`,
          color: v.id === active?.id ? 'green' : 'gray',
        })),
        viewport.width,
      ),
    [active?.id, registry.views, viewport.width],
  );
  // Chat view has an always-on inline prompt. Auto-focus when entering chat
  // and no modal is open. The draft itself lives at the app level so Esc can
  // temporarily dismiss the composer without losing the current prompt.
  useEffect(() => {
    if (
      !disableChatAutoPrompt &&
      active?.id === 'chat' &&
      !promptMode &&
      !chatPromptDismissed &&
      !filterMode &&
      !paletteMode &&
      !modelPickerMode &&
      !profilePickerMode &&
      !agentPickerMode
    ) {
      setPromptMode(true);
    }
    if (active?.id !== 'chat') {
      if (promptMode) {
        setPromptMode(false);
      }
      if (chatPromptDismissed) {
        setChatPromptDismissed(false);
      }
    }
  }, [active?.id, chatPromptDismissed, disableChatAutoPrompt, filterMode, paletteMode, modelPickerMode, profilePickerMode, agentPickerMode, promptMode]);
  const ActiveView = active?.component;

  const viewEmit = (ev: Parameters<TuiViewProps['emit']>[0]) => {
    void handleInternalEvent(ev, active?.id);
  };

  async function handleInternalEvent(
    ev: Parameters<TuiViewProps['emit']>[0],
    sourceViewId?: string,
  ) {
    if (ev.type === 'status') {
      setStatus(ev.message);
      return;
    }
    if (ev.type === 'event') {
      stream.push(ev.event);
      return;
    }
    if (ev.type === 'view:switch') {
      setActiveId(ev.id);
      return;
    }
    if (ev.type === 'issue:select') {
      setIssueSelection({ issueId: ev.issueId, projectId: ev.projectId });
      setActiveId(ev.viewId ?? 'kanban');
      return;
    }
    if (ev.type === 'workspace:select') {
      setWorkspaceSelection({ workspacePath: ev.workspacePath });
      setActiveId(ev.viewId ?? 'workspaces');
      return;
    }
    if (ev.type === 'session:select') {
      setPendingResume({ agent: ev.agent, sessionId: ev.sessionId });
      setStatus(`Resuming ${ev.agent}/${ev.sessionId} — type to send next message`);
      await loadSessionTranscript(ev.agent, ev.sessionId);
      setActiveId('chat');
      return;
    }
    if (ev.type === 'session:detail') {
      const nextReturnViewId =
        sourceViewId && sourceViewId !== 'session-detail' ? sourceViewId : activeViewIdRef.current;
      setSelection({ agent: ev.agent, sessionId: ev.sessionId });
      setReturnViewId(nextReturnViewId && nextReturnViewId !== 'session-detail' ? nextReturnViewId : 'sessions');
      return;
    }
    if (ev.type === 'session:diff') {
      await handleSessionDiff(ev.agent, ev.sessionId);
    }
  }

  async function loadSessionTranscript(agent: string, sessionId: string) {
    try {
      const full = await client.sessions.get(agent as never, sessionId);
      stream.reset();
      for (const m of full.messages) {
        if (!m.content) continue;
        stream.push({
          runId: 'transcript',
          agent,
          timestamp: new Date(m.timestamp ?? Date.now()).toISOString(),
          type: 'text_delta',
          delta: `[${m.role}] ${m.content}\n`,
        } as never);
      }
      setStatus(`Loaded ${full.messages.length} messages from ${agent}/${sessionId}`);
    } catch (e) {
      setStatus(`transcript load failed: ${(e as Error).message}`);
    }
  }

  async function handleSessionDiff(agent: string, sessionId: string) {
    const left = diffLeftRef.current;
    if (!left) {
      diffLeftRef.current = { agent, sessionId };
      setStatus(`diff: marked ${agent}/${sessionId} as A — press D on another session to compare`);
      return;
    }
    diffLeftRef.current = null;
    setStatus(`diff: computing ${left.agent}/${left.sessionId} ↔ ${agent}/${sessionId}…`);
    try {
      const result = await client.sessions.diff(
        { agent: left.agent as never, sessionId: left.sessionId },
        { agent: agent as never, sessionId },
      );
      const sum = result.summary;
      const head = result.operations
        .slice(0, 30)
        .map((o: { type: string }, i: number) => `${i + 1}. ${o.type}`)
        .join('\n');
      const text =
        `\n--- session diff ---\n` +
        `A: ${left.agent}/${left.sessionId}\n` +
        `B: ${agent}/${sessionId}\n` +
        `+${sum.added} -${sum.removed} ~${sum.modified} =${sum.unchanged}\n` +
        head +
        (result.operations.length > 30 ? `\n… ${result.operations.length - 30} more ops` : '') +
        `\n`;
      stream.push({
        runId: 'diff',
        agent: left.agent,
        timestamp: new Date().toISOString(),
        type: 'text_delta',
        delta: text,
      } as never);
      setActiveId('chat');
      setStatus('diff: done.');
    } catch (e) {
      setStatus(`diff failed: ${(e as Error).message}`);
    }
  }

  // Inject renderers+stream into whichever view is active by using a thin wrapper.
  const ViewWithRenderers = ActiveView
    ? (props: TuiViewProps) => {
        const Wrapped = ActiveView as React.ComponentType<TuiViewProps & { renderers: EventRenderer[] }>;
        return <Wrapped {...props} renderers={registry.renderers} />;
      }
    : undefined;

  async function handlePromptSubmit(prompt: string) {
    if (!prompt.trim()) return;
    setChatPromptDismissed(false);
    setPromptHistory((h) => {
      const next = h.filter((p) => p !== prompt);
      next.push(prompt);
      return next.slice(-200);
    });
    appendHistory(prompt);

    // If a plugin registered a prompt handler, it wins.
    if (registry.promptHandlers.length > 0) {
      for (const h of registry.promptHandlers) await h(prompt);
      return;
    }

    // If a run is already live, inject into its stdin rather than spawning a
    // fresh process — keeps follow-ups inside the same session & context.
    if (currentHandleRef.current) {
      try {
        setStatus(await dispatchPromptToActiveRun(currentHandleRef.current, prompt));
      } catch (e) {
        setStatus(`send failed: ${(e as Error).message}`);
      }
      return;
    }

    setStatus(`Dispatching to ${currentAgent ?? defaultAgent}…`);

    try {
      const baseOpts: Partial<{ agent: string; model: string }> = currentProfile
        ? ((await client.profiles.apply(currentProfile)) as Partial<{ agent: string; model: string }>)
        : {};
      const selectedAgent = currentModel?.agent ?? currentAgent ?? baseOpts.agent ?? defaultAgent;
      const explicitHarnessSelection = Boolean(currentModel || currentAgent);
      const requestedAgent =
        pendingResume && !explicitHarnessSelection ? pendingResume.agent : selectedAgent;
      const sessionPlan = await resolveSessionDispatchPlan({
        sessions: client.sessions,
        pendingResume,
        requestedAgent,
        prompt,
      });
      const runOpts: {
        agent: string;
        prompt: string;
        sessionId?: string;
        model?: string;
        approvalMode?: 'yolo' | 'prompt' | 'deny';
      } = {
        agent: sessionPlan.agent,
        prompt: sessionPlan.prompt,
      };
      if (sessionPlan.sessionId) runOpts.sessionId = sessionPlan.sessionId;
      if (currentModel) runOpts.model = currentModel.modelId;
      else if (baseOpts.model) runOpts.model = baseOpts.model;
      // Map TUI execMode → SDK approvalMode. "planning" has no SDK analogue
      // yet; treat it as strict prompt mode and surface a status hint so the
      // user knows the intent is advisory.
      if (execMode === 'bypass') runOpts.approvalMode = 'yolo';
      else if (execMode === 'deny') runOpts.approvalMode = 'deny';
      else if (execMode === 'planning') {
        // No SDK analogue yet — fall back to prompt approvals and flag it.
        runOpts.approvalMode = 'prompt';
        setStatus('Planning mode: adapters do not expose a plan-only flag — running with prompt approvals.');
      } else runOpts.approvalMode = 'prompt';
      if (sessionPlan.migration) {
        setStatus(
          `Forking ${sessionPlan.migration.sourceAgent}/${sessionPlan.migration.sourceSessionId} into ${sessionPlan.agent} via transcript import…`,
        );
      }
      const resumedAgent = runOpts.agent;
      let resumedSessionId = runOpts.sessionId;
      const handle = client.run(runOpts as never);
      currentHandleRef.current = handle;
      if (resumedSessionId) markActive(resumedAgent, resumedSessionId);
      for await (const ev of handle) {
        const agentEv = ev as AgentEvent;
        if (agentEv.type === 'approval_request') {
          const pending = {
            interactionId: agentEv.interactionId,
            action: agentEv.action,
            riskLevel: agentEv.riskLevel,
          };
          pendingApprovalRef.current = pending;
          setPendingApproval(pending);
        } else if (
          agentEv.type === 'approval_granted' ||
          agentEv.type === 'approval_denied'
        ) {
          pendingApprovalRef.current = null;
          setPendingApproval(null);
        } else if (agentEv.type === 'session_start') {
          const sid = (agentEv as unknown as { sessionId?: string }).sessionId;
          if (sid && !resumedSessionId) {
            resumedSessionId = sid;
            markActive(resumedAgent, sid);
            setPendingResume({ agent: resumedAgent, sessionId: sid });
          }
        }
        stream.push(agentEv);
      }
      currentHandleRef.current = null;
      if (resumedSessionId) unmarkActive(resumedAgent, resumedSessionId);
      setStatus('Run complete.');
      } catch (e) {
      logger.error({ error: e }, 'TUI run failed');
      // best-effort cleanup — we might not have started a session, but harmless

      // if the set doesn't contain the key.
      const msg = (e as Error).message;
      if (/ENOENT/.test(msg)) {
        const m = msg.match(/spawn (\S+)/);
        const bin = m?.[1] ?? 'agent CLI';
        setStatus(`Error: ${bin} is not installed. Try: amux install ${bin}`);
      } else {
        setStatus(`Error: ${msg}`);
      }
    }
  }

  const footerSegments: TuiSegment[] = [
    {
      key: 'controls',
      text: viewport.isVeryNarrow
        ? '/ filter, : palette'
        : 'shift+tab: mode, /: filter, :: palette',
      dimColor: true,
    },
    { key: 'mode', text: `mode=${execMode}`, color: EXEC_MODE_COLORS[execMode] },
    { key: 'agent', text: `agent=${currentAgent ?? defaultAgent}`, color: 'cyan' },
  ];
  if (filter) {
    footerSegments.push({
      key: 'filter',
      text: viewport.isVeryNarrow ? `filter=${filter}` : `filter="${filter}"`,
      color: 'cyan',
    });
  }
  if (currentModel) {
    footerSegments.push({
      key: 'model',
      text: `model=${currentModel.agent}/${currentModel.modelId}`,
      color: 'magenta',
    });
  }
  if (currentProfile) {
    footerSegments.push({ key: 'profile', text: `profile=${currentProfile}`, color: 'blue' });
  }
  if (currentHandleRef.current) {
    footerSegments.push({ key: 'interrupt', text: 'i: interrupt', color: 'yellow' });
    if (!viewport.isVeryNarrow) {
      footerSegments.push({
        key: 'deferred',
        text: '/queue, /steer, /steer-tool',
        color: 'yellow',
      });
    }
  }
  if (pendingApproval) {
    footerSegments.push({ key: 'approval', text: 'y/n: approve', color: 'yellow' });
  }
  footerSegments.push({ key: 'quit', text: 'q: quit', dimColor: true });
  if (!viewport.isVeryNarrow && registry.views.length > 1) {
    footerSegments.push({
      key: 'views',
      text: registry.views
        .filter((v) => v.hotkey)
        .map((v) => `${v.hotkey}:${v.title.toLowerCase()}`)
        .join(' '),
      dimColor: true,
    });
  }
  if (!viewport.isShort && !viewport.isVeryNarrow && registry.commands.length > 0) {
    footerSegments.push({
      key: 'commands',
      text: registry.commands.map((c) => `${c.hotkey}:${c.label}`).join(' '),
      dimColor: true,
    });
  }
  const footerLines = packSegments(footerSegments, viewport.width);

  return (
    <Box flexDirection="column">
      <SegmentLines lines={navLines} />
      <Box borderStyle="single" flexDirection="column" paddingX={1}>
        {ViewWithRenderers ? (
          <ViewWithRenderers
            client={client}
            kanban={kanban}
            active={true}
            eventStream={stream}
            emit={viewEmit}
            pluginEpoch={pluginLoadVersion}
            viewport={viewport}
            filter={filter || undefined}
            selection={selection}
            issueSelection={issueSelection}
            workspaceSelection={workspaceSelection}
            returnViewId={returnViewId}
            activeSessions={activeSessions}
          />
        ) : (
          <Text dimColor>No views registered.</Text>
        )}
      </Box>
      {pendingApproval ? (
        <Box>
          <Text color={pendingApproval.riskLevel === 'high' ? 'red' : 'yellow'}>
            [approval {pendingApproval.riskLevel}] {pendingApproval.action} — y: approve · n: deny
          </Text>
        </Box>
      ) : null}
      {filterMode ? (
        <PromptInput
          label="filter (substring or `type:<prefix>`)> "
          onSubmit={(v) => {
            setFilter(v);
            setFilterMode(false);
            setStatus(v ? `Filter: ${v}` : 'Filter cleared.');
          }}
          onCancel={() => setFilterMode(false)}
        />
      ) : null}
      {profilePickerMode ? (
        <ModelPicker
          models={availableProfiles.map((n) => ({ agent: 'profile', modelId: n }))}
          maxItems={viewport.overlayRowLimit}
          width={viewport.contentWidth}
          title="profile"
          onCancel={() => setProfilePickerMode(false)}
          onPick={(m) => {
            setCurrentProfile(m.modelId);
            setProfilePickerMode(false);
            setStatus(`Profile: ${m.modelId}`);
          }}
        />
      ) : null}
      {modelPickerMode ? (
        <ModelPicker
          models={availableModels}
          maxItems={viewport.overlayRowLimit}
          width={viewport.contentWidth}
          onCancel={() => setModelPickerMode(false)}
          onPick={(m) => {
            setCurrentModel(m);
            setModelPickerMode(false);
            setStatus(`Model: ${m.agent}/${m.modelId}`);
          }}
        />
      ) : null}
      {agentPickerMode ? (
        <ModelPicker
          title="agent"
          models={(() => {
            try { return client.adapters.list().map((a: { agent: string; displayName: string }) => ({ agent: a.agent, modelId: a.displayName })); }
            catch { return []; }
          })()}
          maxItems={viewport.overlayRowLimit}
          width={viewport.contentWidth}
          onCancel={() => setAgentPickerMode(false)}
          onPick={(m) => {
            setCurrentAgent(m.agent);
            setCurrentModel(undefined);
            setAgentPickerMode(false);
            setStatus(`Agent: ${m.agent}`);
          }}
        />
      ) : null}
      {paletteMode ? (
        <CommandPalette
          views={registry.views}
          commands={registry.commands}
          maxItems={viewport.overlayRowLimit}
          width={viewport.contentWidth}
          onCancel={() => setPaletteMode(false)}
          onPick={(a: PaletteAction) => {
            setPaletteMode(false);
            if (a.id.startsWith('view:')) {
              setActiveId(a.id.slice('view:'.length));
            } else if (a.id.startsWith('cmd:')) {
              const cmdId = a.id.slice('cmd:'.length);
              const cmd = registry.commands.find((c) => c.id === cmdId);
              if (cmd) {
                void cmd.run({
                  client,
                  eventStream: stream,
                  registerView: () => {},
                  registerEventRenderer: () => {},
                  registerCommand: () => {},
                  registerPromptHandler: () => {},
                  emit: (e) => void handleInternalEvent(e, activeViewIdRef.current),
                });
              }
            }
          }}
        />
      ) : null}
      <Box flexDirection="column">
        {status ? <Text dimColor>{status}</Text> : null}
        <SegmentLines lines={footerLines} />
        {promptMode ? (
          <PromptInput
            label="> "
            labelColor={EXEC_MODE_COLORS[execMode]}
            onSubmit={handlePromptSubmit}
            initialState={chatPromptState}
            onStateChange={setChatPromptState}
            onCancel={() => {
              setPromptMode(false);
              if (active?.id === 'chat') {
                setChatPromptDismissed(true);
              }
            }}
            onShiftTab={cycleExecMode}
            history={promptHistory}
          />
        ) : null}
      </Box>
    </Box>
  );
}
