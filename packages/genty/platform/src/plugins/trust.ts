import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export type TrustLevel = 'verified' | 'community' | 'local' | 'unknown';

export interface PluginProvenance {
  source: 'npm' | 'git' | 'local' | 'marketplace';
  author?: string;
  signature?: string;
  publishedAt?: string;
  registryUrl?: string;
}

export function classifyTrust(provenance: PluginProvenance): TrustLevel {
  if (provenance.signature && provenance.source === 'marketplace') return 'verified';
  if (provenance.source === 'npm' && provenance.author) return 'community';
  if (provenance.source === 'local') return 'local';
  return 'unknown';
}

const BLOCKLIST_FILENAME = 'plugin-blocklist.json';

interface BlocklistData {
  blocked: Array<{ pluginId: string; reason?: string; blockedAt: string }>;
}

export function loadBlocklist(configDir: string): BlocklistData {
  const filePath = join(configDir, BLOCKLIST_FILENAME);
  if (!existsSync(filePath)) return { blocked: [] };
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return { blocked: [] };
  }
}

export function isBlocked(configDir: string, pluginId: string): boolean {
  const data = loadBlocklist(configDir);
  return data.blocked.some(b => b.pluginId === pluginId);
}

export function addToBlocklist(configDir: string, pluginId: string, reason?: string): void {
  const data = loadBlocklist(configDir);
  if (data.blocked.some(b => b.pluginId === pluginId)) return;
  data.blocked.push({ pluginId, reason, blockedAt: new Date().toISOString() });
  const filePath = join(configDir, BLOCKLIST_FILENAME);
  if (!existsSync(dirname(filePath))) mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function removeFromBlocklist(configDir: string, pluginId: string): boolean {
  const data = loadBlocklist(configDir);
  const before = data.blocked.length;
  data.blocked = data.blocked.filter(b => b.pluginId !== pluginId);
  if (data.blocked.length === before) return false;
  writeFileSync(join(configDir, BLOCKLIST_FILENAME), JSON.stringify(data, null, 2), 'utf8');
  return true;
}

export type TrustClass = 'system' | 'verified' | 'community' | 'sandboxed';

export interface PluginTrustPolicy {
  allowedPermissions: Set<string>;
}

export const DEFAULT_TRUST_POLICIES: Record<TrustClass, PluginTrustPolicy> = {
  system: { allowedPermissions: new Set(['tools:register', 'commands:register', 'keybindings:register', 'events:listen', 'statusbar:register', 'context:inject', 'filesystem:read', 'filesystem:write', 'network:outbound', 'subprocess:spawn']) },
  verified: { allowedPermissions: new Set(['tools:register', 'commands:register', 'keybindings:register', 'events:listen', 'statusbar:register', 'context:inject', 'filesystem:read', 'network:outbound']) },
  community: { allowedPermissions: new Set(['tools:register', 'commands:register', 'events:listen', 'statusbar:register', 'context:inject']) },
  sandboxed: { allowedPermissions: new Set(['tools:register', 'events:listen']) },
};

export function evaluatePluginTrust(
  requestedPermissions: string[],
  trustClass: TrustClass,
  policy = DEFAULT_TRUST_POLICIES,
): { allowed: boolean; deniedPermissions: string[] } {
  const allowed = policy[trustClass].allowedPermissions;
  const denied = requestedPermissions.filter(p => !allowed.has(p));
  return { allowed: denied.length === 0, deniedPermissions: denied };
}
