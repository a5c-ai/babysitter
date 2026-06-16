const IDENTITY_KINDS = ['AgentPersona', 'AgentSoul', 'AgentAppearance', 'AgentVoiceProfile', 'AgentDefinition', 'AgentStack'];

export function resourceItems(modelOrResources, kind) {
  if (Array.isArray(modelOrResources?.[kind])) return modelOrResources[kind];
  const resources = Array.isArray(modelOrResources)
    ? modelOrResources
    : Array.isArray(modelOrResources?.resources)
      ? modelOrResources.resources
      : [];
  if (resources.some((resource) => resource.kind === kind && !Array.isArray(resource.items))) {
    return resources.filter((resource) => resource.kind === kind);
  }
  const group = resources.find((resource) => resource.kind === kind);
  return Array.isArray(group?.items) ? group.items : [];
}

export function identityResourceMap(modelOrResources) {
  return Object.fromEntries(IDENTITY_KINDS.map((kind) => [kind, resourceItems(modelOrResources, kind)]));
}

function byName(items, name) {
  return (items || []).find((item) => item.metadata?.name === name) || null;
}

function refName(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return ref.ref || ref.name || null;
}

function fallbackInitials(value) {
  const parts = String(value || 'Agent').trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'AI';
}

export function resolveAppearanceAvatar(appearance, persona) {
  const displayName = persona?.spec?.displayName || persona?.metadata?.name || 'Agent';
  const avatar = appearance?.spec?.avatar || {};
  return {
    type: avatar.type || (avatar.url ? 'url' : appearance?.spec?.emoji ? 'emoji' : 'initials'),
    url: avatar.url || appearance?.status?.avatarUrl || null,
    emoji: appearance?.spec?.emoji || persona?.spec?.emoji || null,
    initials: avatar.fallbackInitials || fallbackInitials(displayName),
    color: avatar.fallbackColor || appearance?.spec?.theme?.primaryColor || '#b9913f',
  };
}

export function buildAgentIdentityProfiles(modelOrResources) {
  const resources = identityResourceMap(modelOrResources);
  return resources.AgentPersona.map((persona) => {
    const name = persona.metadata?.name;
    const soul = persona.spec?.soul?.ref ? byName(resources.AgentSoul, persona.spec.soul.ref) : byName(resources.AgentSoul, `${name}-soul`) || null;
    const appearance = persona.spec?.appearance?.ref ? byName(resources.AgentAppearance, persona.spec.appearance.ref) : byName(resources.AgentAppearance, `${name}-appearance`) || null;
    const voiceProfile = persona.spec?.voiceProfile?.ref ? byName(resources.AgentVoiceProfile, persona.spec.voiceProfile.ref) : byName(resources.AgentVoiceProfile, `${name}-voice`) || null;
    const definitions = resources.AgentDefinition.filter((definition) => definition.spec?.personaRef === name);
    const stacks = definitions.map((definition) => byName(resources.AgentStack, definition.spec?.stackRef)).filter(Boolean);
    return {
      name,
      persona,
      soul,
      appearance,
      voiceProfile,
      definitions,
      stacks,
      displayName: persona.spec?.displayName || name,
      tagline: persona.spec?.tagline || persona.spec?.role?.domain || '',
      roleTitle: persona.spec?.role?.title || 'Agent persona',
      roleDomain: persona.spec?.role?.domain || '',
      expertise: persona.spec?.role?.expertise || [],
      skillRefs: persona.spec?.skillRefs || [],
      avatar: resolveAppearanceAvatar(appearance, persona),
      status: persona.status || {},
    };
  });
}

export function resolveAgentIdentityForRef(ref, modelOrResources) {
  const target = refName(ref);
  if (!target) return null;
  const resources = identityResourceMap(modelOrResources);
  const definition = byName(resources.AgentDefinition, target);
  if (definition) {
    const profile = buildAgentIdentityProfiles(modelOrResources).find((item) => item.name === definition.spec?.personaRef) || null;
    return profile ? { ...profile, definition, ref: target, fallback: false } : null;
  }
  const profile = buildAgentIdentityProfiles(modelOrResources).find((item) => item.name === target);
  if (profile) return { ...profile, definition: profile.definitions[0] || null, ref: target, fallback: false };
  const stack = byName(resources.AgentStack, target);
  if (stack) {
    return {
      name: target,
      displayName: stack.spec?.displayName || target,
      roleTitle: stack.spec?.description || 'Agent stack',
      tagline: stack.spec?.adapter || stack.spec?.model || '',
      avatar: { type: 'initials', initials: fallbackInitials(target), color: '#64748b' },
      stack,
      definition: null,
      fallback: true,
      ref: target,
    };
  }
  return null;
}

export function resolveRunAgentIdentity(run, modelOrResources) {
  const ref = run?.spec?.agentDefinition || run?.spec?.agentStack || run?.spec?.stackRef || run?.spec?.targetStack;
  return resolveAgentIdentityForRef(ref, modelOrResources);
}

export function resolveSessionAgentIdentity(session, modelOrResources) {
  const ref = session?.spec?.agentDefinition || session?.spec?.agentStack || session?.spec?.stackRef || session?.spec?.targetStack;
  return resolveAgentIdentityForRef(ref, modelOrResources);
}

export function agentIdentityLabel(identity, fallback = 'unassigned') {
  if (!identity) return fallback;
  return identity.displayName || identity.name || fallback;
}

export function agentIdentityOptions(profiles = [], stacks = []) {
  const definitionOptions = profiles.flatMap((profile) => {
    const definitions = profile.definitions?.length ? profile.definitions : [];
    return definitions.map((definition) => ({
      type: 'agentDefinition',
      value: definition.metadata?.name,
      label: profile.displayName,
      hint: profile.roleTitle || definition.spec?.stackRef,
      avatar: profile.avatar,
      stackRef: definition.spec?.stackRef,
    }));
  });
  const stackOptions = stacks.map((stack) => {
    const name = typeof stack === 'string' ? stack : stack?.metadata?.name;
    return name ? { type: 'agentStack', value: name, label: name, hint: 'Legacy stack', stack, avatar: { type: 'initials', initials: fallbackInitials(name), color: '#64748b' } } : null;
  }).filter(Boolean);
  return [...definitionOptions, ...stackOptions];
}
