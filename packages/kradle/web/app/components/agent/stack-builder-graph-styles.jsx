'use client';

// ---------------------------------------------------------------------------
// Layer / facet definitions (kept client-side so we don't import Node modules)
// ---------------------------------------------------------------------------

export const STACK_LAYERS = [
  { key: 'layer:1-model', label: 'Model', position: 1, atlasKinds: ['ModelFamily', 'ModelVersion', 'SessionModel'], description: 'LLM model family and version' },
  { key: 'layer:2-provider', label: 'Provider', position: 2, atlasKinds: ['Provider', 'ModelProviderProduct', 'ModelProviderVersion'], description: 'Model API provider (Anthropic, OpenAI, Azure, etc.)' },
  { key: 'layer:3-transport', label: 'Transport', position: 3, atlasKinds: ['TransportProtocol', 'ModelTransportProtocol'], description: 'Communication protocol (stdio, HTTP, WebSocket)' },
  { key: 'layer:4-platform', label: 'Platform', position: 4, atlasKinds: ['AgentProduct', 'AgentRuntimeImpl', 'AgentPlatformImpl', 'AgentCoreImpl', 'Platform'], description: 'Agent platform target (adapters supported)' },
  { key: 'layer:5-tools', label: 'Tools', position: 5, atlasKinds: ['Tool', 'ToolDescriptor', 'ToolServer', 'MCPPrompt', 'MCPResource'], description: 'Tools, MCP servers, and tool descriptors', subcategories: { internal: { kinds: ['Tool', 'ToolDescriptor'], label: 'Internal Platform Tools' }, external: { kinds: ['ToolServer', 'MCPPrompt', 'MCPResource'], label: 'External Tools' } } },
  { key: 'layer:6-plugins', label: 'Plugins', position: 6, atlasKinds: ['PluginArtifact', 'Plugin', 'PluginCommand', 'PluginSkill', 'PluginHook'], description: 'Plugins, commands, skills, and hooks' },
];

export const COMPOSITION_FACETS = [
  { key: 'facet:agent-role', label: 'Agent Role', atlasKinds: ['Role', 'Responsibility', 'AgentTeam', 'OrgUnit'], description: 'Role-based identity for policies and permissions' },
  { key: 'facet:skills-and-capabilities', label: 'Skills and Capabilities', atlasKinds: ['Skill', 'LibrarySkill', 'SkillArea', 'Capability'], description: 'Reusable skills and capability bundles' },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
export const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box' };
export const textareaStyle = { ...inputStyle, resize: 'vertical', fontFamily: 'inherit' };

export const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer', padding: '0.625rem 0.75rem',
  borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)',
  border: '1px solid var(--border)', userSelect: 'none',
};

export const sectionBodyStyle = { padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' };

export const cardStyle = {
  display: 'flex', flexDirection: 'column', gap: '0.25rem',
  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)', cursor: 'pointer',
  fontSize: '0.8125rem', transition: 'border-color 0.15s, background 0.15s',
};
export const cardSelectedStyle = { ...cardStyle, borderColor: 'var(--accent)', background: 'var(--surface-raised)' };

export const badgeStyle = {
  display: 'inline-block', fontSize: '0.6875rem', padding: '1px 6px',
  borderRadius: '9999px', background: 'var(--surface-overlay)', color: 'var(--accent)',
  fontWeight: 600, marginLeft: '0.375rem', verticalAlign: 'middle',
};

export const resultGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem',
};

export const subSectionHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer', padding: '0.5rem 0.625rem',
  borderRadius: 'var(--radius-sm)', background: 'var(--surface-raised)',
  border: '1px solid var(--border)', userSelect: 'none',
  fontSize: '0.8125rem', marginBottom: '0.375rem',
};

export const memoryToggleStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)', fontSize: '0.8125rem',
  transition: 'border-color 0.15s, background 0.15s',
};

export const memoryToggleSelectedStyle = {
  ...memoryToggleStyle, borderColor: 'var(--accent)', background: 'var(--surface-raised)',
};

// ---------------------------------------------------------------------------
// Jitsi meeting / video capability — curated tool + role allowlists.
// Names MUST mirror the controller's JITSI_TOOLS / JITSI_ROLES allowlists in
// packages/kradle/core/src/agent-stack-controller.js so an emitted spec passes
// the G9 JitsiCapabilityReady validator.
// ---------------------------------------------------------------------------

// Audio/chat tools available to any speaking meeting agent (voice or video).
export const JITSI_AUDIO_TOOLS = [
  'kradle_send_chat_message',
  'kradle_get_meeting_transcript',
  'kradle_get_participant_list',
  'kradle_raise_hand',
  'kradle_react',
];

// Video capability tools (G9) — avatar drive, canvas/video publish, surface share.
export const JITSI_VIDEO_TOOLS = [
  ...JITSI_AUDIO_TOOLS,
  'kradle_speak',
  'kradle_set_expression',
  'kradle_play_gesture',
  'kradle_set_posture',
  'kradle_look_at',
  'kradle_set_view',
  'kradle_draw_canvas',
  'kradle_publish_video',
  'kradle_share_surface',
  'kradle_send_video_metadata',
];

// Consequential subset that the org governs — guaranteed ⊆ JITSI_VIDEO_TOOLS.
export const JITSI_GOVERNED_DEFAULTS = [
  'kradle_draw_canvas',
  'kradle_share_surface',
  'kradle_send_video_metadata',
];

export const JITSI_MEETING_ROLES = ['observer', 'participant', 'moderator', 'agent'];
export const JITSI_AUDIO_MODES = ['none', 'receive', 'speak', 'both'];

// ---------------------------------------------------------------------------
// Resource builder — constructs the AgentStack resource from form state
// ---------------------------------------------------------------------------

export function buildStackResource({ name, displayName, systemPrompt, developerPrompt, taskPrompt, serviceAccount, role, rbacNamespace, org, selections, selectedMemoryRepos, selectedInference, meeting }) {
  // Build layer bindings from selections
  const layerBindings = [];
  for (const [layerKey, records] of Object.entries(selections)) {
    for (const record of records) {
      layerBindings.push({
        primaryLayerId: layerKey,
        atlasRecordId: record.id,
        nodeKind: record.nodeKind,
        displayName: record.displayName,
        selectionRole: 'primary',
        importance: 'primary',
      });
    }
  }

  // Derive fields from layer selections
  const modelSelections = selections['layer:1-model'] || [];
  const providerSelections = selections['layer:2-provider'] || [];
  const platformSelections = selections['layer:4-platform'] || [];
  const toolSelections = selections['layer:5-tools'] || [];
  const pluginSelections = selections['layer:6-plugins'] || [];
  const roleSelections = selections['facet:agent-role'] || [];
  const skillSelections = selections['facet:skills-and-capabilities'] || [];

  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentStack',
    metadata: {
      name,
      labels: {
        ...(displayName ? { 'kradle.a5c.ai/display-name': displayName } : {}),
      },
    },
    spec: {
      // Platform: adapters supported target (claude-code, codex, gemini-cli, etc.)
      baseAgent: platformSelections.find((r) => r.nodeKind === 'AgentProduct')?.id || 'claude-code',
      adapter: platformSelections.find((r) => r.nodeKind === 'AgentPlatformImpl')?.id || 'default',
      runtimeIdentity: {
        serviceAccountRef: serviceAccount || 'default',
        roleRef: role || 'edit',
        namespace: rbacNamespace || `kradle-org-${org}`,
      },
      // Model from model layer
      ...(modelSelections.length ? { model: modelSelections[0].id } : {}),
      // Provider from provider layer
      ...(providerSelections.length ? { provider: providerSelections[0].id } : {}),
      ...(displayName ? { displayName } : {}),
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(developerPrompt ? { developerPrompt } : {}),
      ...(taskPrompt ? { taskPrompt } : {}),
      approvalMode: 'prompt',
      // Agent role for policies and permissions
      ...(roleSelections.length ? { agentRole: { refs: roleSelections.map((r) => ({ id: r.id, nodeKind: r.nodeKind, displayName: r.displayName })) } } : {}),
      // Internal tools (Tool, ToolDescriptor) — structured filter
      ...(toolSelections.filter((r) => r.nodeKind === 'Tool' || r.nodeKind === 'ToolDescriptor').length
        ? { internalTools: { enabled: true, filter: toolSelections.filter((r) => r.nodeKind === 'Tool' || r.nodeKind === 'ToolDescriptor').map((r) => r.id) } }
        : {}),
      // External tools (ToolServer, MCPPrompt, MCPResource) — structured refs
      ...(toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt' || r.nodeKind === 'MCPResource').length
        ? {
          externalTools: {
            mcpServerRefs: toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt').map((r) => r.id),
            cliToolRefs: [],
            openApiRefs: toolSelections.filter((r) => r.nodeKind === 'MCPResource').map((r) => r.id),
          },
        }
        : {}),
      // Backward-compat flat mcpServerRefs
      ...(toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt').length
        ? { mcpServerRefs: toolSelections.filter((r) => r.nodeKind === 'ToolServer' || r.nodeKind === 'MCPPrompt').map((r) => r.id) }
        : {}),
      // Memory repository associations
      ...(selectedMemoryRepos.length
        ? { memoryRepositoryRefs: selectedMemoryRepos.map((r) => r.name) }
        : {}),
      // Plugin refs from plugins layer
      ...(pluginSelections.length
        ? { pluginRefs: pluginSelections.map((r) => r.id) }
        : {}),
      // Skill refs from skills facet
      ...(skillSelections.length
        ? { skillRefs: skillSelections.map((r) => r.id) }
        : {}),
      // Atlas layer bindings for graph-aware consumers
      atlasLayerBindings: layerBindings,
      // KServe inference service binding
      ...(selectedInference ? {
        inference: {
          provider: 'kserve',
          service: selectedInference.name,
          endpoint: selectedInference.endpoint,
          modelFormat: selectedInference.modelFormat,
        },
      } : {}),
      // Jitsi meeting / video capability (G14). Video off ⇒ no jitsi fields at
      // all (spec unchanged). Per-modality emission keeps the spec
      // self-consistent with the G9 JitsiCapabilityReady validator.
      ...buildJitsiSpec(meeting),
    },
  };
}

// ---------------------------------------------------------------------------
// Jitsi meeting spec fragment — pure, modality-driven. Returns {} when the
// meeting toggle is off so the AgentStack spec is byte-for-byte unchanged.
//   mode 'voice' → capabilities.audio only, no video, no avatarRef.
//   mode 'video' → capabilities.audio + capabilities.video:'publish' + avatarRef.
//   governedTools is always emitted as a subset of tools (the G9 invariant).
// ---------------------------------------------------------------------------

export function buildJitsiSpec(meeting) {
  if (!meeting?.enabled) return {};

  const mode = meeting.mode || 'text';
  const role = meeting.role || 'agent';
  const audioMode = meeting.audioMode || 'speak';
  const isVideo = mode === 'video' && meeting.videoPublish !== false;

  // Tool baseline per modality; explicit override (meeting.tools) wins.
  const defaultTools = isVideo
    ? JITSI_VIDEO_TOOLS
    : mode === 'voice'
      ? JITSI_AUDIO_TOOLS
      : [];
  const tools = meeting.tools?.length ? meeting.tools : defaultTools;

  // governedTools must be ⊆ tools — clamp defaults to whatever tools allow.
  const governedSource = meeting.governedTools?.length ? meeting.governedTools : JITSI_GOVERNED_DEFAULTS;
  const governedTools = governedSource.filter((t) => tools.includes(t));

  const capabilities = {
    ...(audioMode ? { audio: audioMode } : {}),
    ...(isVideo ? { video: 'publish' } : {}),
  };

  return {
    jitsiCapability: true,
    ...(meeting.providerRef ? { jitsiMeetingProviderRef: meeting.providerRef } : {}),
    jitsiConfig: {
      role,
      capabilities,
      ...(isVideo && meeting.avatarRef ? { avatarRef: meeting.avatarRef } : {}),
      ...(meeting.voiceProfileRef ? { voiceProfileRef: meeting.voiceProfileRef } : {}),
      ...(tools.length ? { tools } : {}),
      ...(governedTools.length ? { governedTools } : {}),
    },
  };
}
