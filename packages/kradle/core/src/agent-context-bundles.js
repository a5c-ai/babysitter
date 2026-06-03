import { createHash } from 'node:crypto';
import { createResource, clone } from './resource-model.js';

export const AGENT_CONTEXT_BUNDLES_BOUNDARY = {
  role: 'agent-context-bundles',
  scope: 'Context assembly, redaction, and digest computation for agent dispatch',
  owns: ['prompt layer collection', 'redaction patterns', 'size enforcement', 'digest computation'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'runtime execution', 'Agent Mux sessions']
};

const PROMPT_LAYER_MAX = 64 * 1024;  // 64 KiB
const BUNDLE_MAX = 750 * 1024;       // 750 KiB
const MAX_ATTACHMENTS = 32;

// Redaction patterns (ordered by priority)
const REDACTION_PATTERNS = [
  { kind: 'secret-key', pattern: /(?:API_KEY|API_SECRET|SECRET_KEY|ACCESS_KEY|PRIVATE_KEY|AUTH_TOKEN|PASSWORD|PASSWD|CREDENTIALS?)\s*[=:]\s*['"]?([^\s'"}{,\]]+)/gi },
  { kind: 'provider-token', pattern: /\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|gho_[a-zA-Z0-9]{36,}|glpat-[a-zA-Z0-9\-_]{20,}|xoxb-[a-zA-Z0-9\-]+|xoxp-[a-zA-Z0-9\-]+)\b/g },
  { kind: 'bearer-token', pattern: /Bearer\s+[a-zA-Z0-9\-._~+\/]+=*/gi },
  { kind: 'private-key', pattern: /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g },
  { kind: 'base64-credential', pattern: /\b[A-Za-z0-9+\/]{40,}={0,2}\b/g },
];

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function truncateToLimit(text, limit) {
  if (typeof text !== 'string') return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit);
}

function applyRedactions(text) {
  if (typeof text !== 'string' || text.length === 0) return { text, counts: {} };
  const counts = {};
  let redacted = text;
  for (const { kind, pattern } of REDACTION_PATTERNS) {
    const fresh = new RegExp(pattern.source, pattern.flags);
    const before = redacted;
    redacted = redacted.replace(fresh, (match) => {
      counts[kind] = (counts[kind] || 0) + 1;
      return `[REDACTED:${kind}]`;
    });
  }
  return { text: redacted, counts };
}

function mergeRedactionCounts(target, source) {
  for (const [kind, count] of Object.entries(source)) {
    target[kind] = (target[kind] || 0) + count;
  }
}

export function createRedactionManifest(redactionCounts) {
  const total = Object.values(redactionCounts).reduce((sum, n) => sum + n, 0);
  return { total, byKind: clone(redactionCounts) };
}

export function assembleContextBundle({ stack, repository, ref, sourceRefs = [], contextLabels = [], redactionPolicy, resources = {} }) {
  const namespace = stack?.metadata?.namespace || 'default';
  const organizationRef = stack?.spec?.organizationRef || 'default';
  const allRedactionCounts = {};

  // Step 1 — Collect prompt layers
  const rawSystem = stack?.spec?.prompt?.system || '';
  const rawDeveloper = stack?.spec?.prompt?.developer || '';
  const rawTask = stack?.spec?.prompt?.task || '';

  // Collect skill fragments
  const skillFragments = [];
  const skillRefs = stack?.spec?.skillRefs || [];
  const agentSkills = resources.AgentSkill || [];
  for (const skillRef of skillRefs) {
    const skill = agentSkills.find((s) => s.metadata?.name === skillRef);
    if (skill?.spec?.promptFragment) {
      skillFragments.push({ name: skillRef, content: skill.spec.promptFragment });
    }
  }

  // Collect label fragments
  const labelFragments = [];
  const agentContextLabels = resources.AgentContextLabel || [];
  for (const labelRef of contextLabels) {
    const label = agentContextLabels.find((l) => l.metadata?.name === labelRef);
    if (label?.spec?.promptFragment) {
      labelFragments.push({ name: labelRef, content: label.spec.promptFragment });
    }
  }

  // Step 2 — Truncate each layer and compute digests
  const system = truncateToLimit(rawSystem, PROMPT_LAYER_MAX);
  const developer = truncateToLimit(rawDeveloper, PROMPT_LAYER_MAX);
  const task = truncateToLimit(rawTask, PROMPT_LAYER_MAX);

  // Apply redaction to prompt layers
  const systemRedacted = applyRedactions(system);
  mergeRedactionCounts(allRedactionCounts, systemRedacted.counts);
  const developerRedacted = applyRedactions(developer);
  mergeRedactionCounts(allRedactionCounts, developerRedacted.counts);
  const taskRedacted = applyRedactions(task);
  mergeRedactionCounts(allRedactionCounts, taskRedacted.counts);

  const systemDigest = sha256(systemRedacted.text);
  const developerDigest = sha256(developerRedacted.text);
  const taskDigest = sha256(taskRedacted.text);

  const skillLayerDigests = [];
  const redactedSkillFragments = [];
  for (const frag of skillFragments) {
    const truncated = truncateToLimit(frag.content, PROMPT_LAYER_MAX);
    const redacted = applyRedactions(truncated);
    mergeRedactionCounts(allRedactionCounts, redacted.counts);
    const digest = sha256(redacted.text);
    skillLayerDigests.push({ role: `skill:${frag.name}`, digest, sizeBytes: redacted.text.length });
    redactedSkillFragments.push({ name: frag.name, content: redacted.text });
  }

  const labelLayerDigests = [];
  const redactedLabelFragments = [];
  for (const frag of labelFragments) {
    const truncated = truncateToLimit(frag.content, PROMPT_LAYER_MAX);
    const redacted = applyRedactions(truncated);
    mergeRedactionCounts(allRedactionCounts, redacted.counts);
    const digest = sha256(redacted.text);
    labelLayerDigests.push({ role: `label:${frag.name}`, digest, sizeBytes: redacted.text.length });
    redactedLabelFragments.push({ name: frag.name, content: redacted.text });
  }

  // Step 3 — Collect sources from sourceRefs
  const sources = [];
  const limitedSourceRefs = sourceRefs.slice(0, MAX_ATTACHMENTS);
  for (const srcRef of limitedSourceRefs) {
    const content = truncateToLimit(srcRef.content || '', PROMPT_LAYER_MAX);
    const redacted = applyRedactions(content);
    mergeRedactionCounts(allRedactionCounts, redacted.counts);
    sources.push({
      kind: srcRef.kind || 'unknown',
      ref: srcRef.ref || '',
      content: redacted.text,
      digest: sha256(redacted.text)
    });
  }

  // Step 5 — Enforce total size
  let wasTruncated = false;
  const TRUNC_MARKER = '[...truncated at 750KiB limit]';
  const TRUNC_MARKER_LEN = TRUNC_MARKER.length;

  const computeTotalSize = () =>
    systemRedacted.text.length + developerRedacted.text.length + taskRedacted.text.length +
    redactedSkillFragments.reduce((s, f) => s + f.content.length, 0) +
    redactedLabelFragments.reduce((s, f) => s + f.content.length, 0) +
    sources.reduce((s, src) => s + src.content.length, 0);

  let totalSize = computeTotalSize();

  if (totalSize > BUNDLE_MAX) {
    wasTruncated = true;
    // Build a list of truncatable items (sources first, then labels, then skills)
    // sorted by descending size so we cut the largest first
    const truncatableItems = [
      ...sources.map((s, i) => ({ type: 'source', index: i })),
      ...redactedLabelFragments.map((f, i) => ({ type: 'label', index: i })),
      ...redactedSkillFragments.map((f, i) => ({ type: 'skill', index: i }))
    ];

    const getContent = (t) => {
      if (t.type === 'source') return sources[t.index].content;
      if (t.type === 'label') return redactedLabelFragments[t.index].content;
      return redactedSkillFragments[t.index].content;
    };

    truncatableItems.sort((a, b) => getContent(b).length - getContent(a).length);

    for (const target of truncatableItems) {
      totalSize = computeTotalSize();
      if (totalSize <= BUNDLE_MAX) break;

      const currentContent = getContent(target);
      const excess = totalSize - BUNDLE_MAX;
      // We need to remove at least `excess` bytes, but also account for the marker we add
      const cutAmount = excess + TRUNC_MARKER_LEN;
      const newLen = Math.max(0, currentContent.length - cutAmount);
      const truncatedContent = currentContent.slice(0, newLen) + TRUNC_MARKER;

      if (target.type === 'source') {
        sources[target.index].content = truncatedContent;
        sources[target.index].digest = sha256(truncatedContent);
      } else if (target.type === 'label') {
        redactedLabelFragments[target.index].content = truncatedContent;
        labelLayerDigests[target.index].digest = sha256(truncatedContent);
        labelLayerDigests[target.index].sizeBytes = truncatedContent.length;
      } else if (target.type === 'skill') {
        redactedSkillFragments[target.index].content = truncatedContent;
        skillLayerDigests[target.index].digest = sha256(truncatedContent);
        skillLayerDigests[target.index].sizeBytes = truncatedContent.length;
      }
    }
  }

  // Step 6 — Compute bundle digest
  const promptLayers = [
    { role: 'system', digest: systemDigest, sizeBytes: systemRedacted.text.length },
    { role: 'developer', digest: developerDigest, sizeBytes: developerRedacted.text.length },
    { role: 'task', digest: taskDigest, sizeBytes: taskRedacted.text.length },
    ...skillLayerDigests,
    ...labelLayerDigests,
  ];

  const digestPayload = JSON.stringify({
    promptLayers,
    sources: sources.map((s) => ({ kind: s.kind, ref: s.ref, digest: s.digest }))
  });
  const digest = sha256(digestPayload);

  const redactionManifest = createRedactionManifest(allRedactionCounts);

  // Step 7 — Build the resource
  const resource = createResource('AgentContextBundle', { name: `bundle-${digest.slice(0, 12)}`, namespace }, {
    organizationRef,
    dispatchRun: '',
    digest,
    sources: limitedSourceRefs.map((s) => ({ kind: s.kind || 'unknown', ref: s.ref || '' })),
    promptLayers,
    redactions: redactionManifest,
    limits: { maxBytes: BUNDLE_MAX, truncated: wasTruncated },
  });

  // Store actual text content in _content (in-memory only, not part of resource spec)
  resource._content = {
    system: systemRedacted.text,
    developer: developerRedacted.text,
    task: taskRedacted.text,
    skillFragments: redactedSkillFragments,
    labelFragments: redactedLabelFragments,
    sources
  };

  return resource;
}
