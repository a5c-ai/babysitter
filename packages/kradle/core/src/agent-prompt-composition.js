function addPart(parts, value) {
  if (typeof value === 'string' && value.trim()) parts.push(value.trim());
}

function joinList(values) {
  return Array.isArray(values) && values.length > 0 ? values.join(', ') : null;
}

export function composeAgentSystemPrompt({ soul = null, persona = null, definition = null, stack = null } = {}) {
  const parts = [];
  addPart(parts, soul?.spec?.content);

  const personaSpec = persona?.spec || {};
  const personaParts = [];
  addPart(personaParts, personaSpec.displayName);
  addPart(personaParts, personaSpec.tagline);

  const personality = personaSpec.personality || {};
  const personalityParts = [];
  if (personality.communicationStyle) personalityParts.push(`Communication style: ${personality.communicationStyle}`);
  if (personality.tone) personalityParts.push(`Tone: ${personality.tone}`);
  if (personality.explanationDepth) personalityParts.push(`Explanation depth: ${personality.explanationDepth}`);
  if (personality.humorLevel) personalityParts.push(`Humor level: ${personality.humorLevel}`);
  if (personality.language) personalityParts.push(`Language: ${personality.language}`);
  const traits = joinList(personality.traits);
  if (traits) personalityParts.push(`Traits: ${traits}`);
  addPart(personaParts, personalityParts.join('. '));

  const role = personaSpec.role || {};
  const roleParts = [];
  if (role.title) roleParts.push(`Role: ${role.title}`);
  if (role.domain) roleParts.push(`Domain: ${role.domain}`);
  const expertise = joinList(role.expertise);
  if (expertise) roleParts.push(`Expertise: ${expertise}`);
  addPart(personaParts, roleParts.join('. '));

  const skills = joinList(personaSpec.skillRefs);
  if (skills) personaParts.push(`Skills: ${skills}`);
  const knowledge = joinList(personaSpec.knowledgeRefs);
  if (knowledge) personaParts.push(`Knowledge: ${knowledge}`);
  addPart(parts, personaParts.join('\n'));

  addPart(parts, definition?.spec?.roleContext);
  addPart(parts, stack?.spec?.systemPrompt);
  return parts.join('\n\n');
}

export function composeAgentPrompt({ soul = null, persona = null, definition = null, stack = null } = {}) {
  const legacyPrompts = persona?.spec?.legacyPrompts || {};
  return {
    system: composeAgentSystemPrompt({ soul, persona, definition, stack }) || null,
    developer: legacyPrompts.developerPrompt || stack?.spec?.developerPrompt || null,
    task: legacyPrompts.taskPrompt || stack?.spec?.taskPrompt || null,
  };
}
