export interface SkillCommandArgs {
  pluginRoot?: string;
  runId?: string;
  cacheTtl?: number;
  sourceType?: 'github' | 'well-known';
  url?: string;
  json: boolean;
  runsDir?: string;
  includeRemote?: boolean;
  summaryOnly?: boolean;
  processPath?: string;
}

export interface SkillMetadata {
  name: string;
  description: string;
  category: string;
  source: 'local' | 'local-plugin' | 'remote';
  file?: string;
  url?: string;
}

export interface AgentMetadata {
  name: string;
  description: string;
  role?: string;
  category: string;
  source: 'local' | 'local-plugin' | 'remote';
  file?: string;
  url?: string;
}

export interface ProcessMetadata {
  name: string;
  category: string;
  source: 'library' | 'repo';
  file: string;
}

export interface DiscoveryCacheEntry {
  skills: SkillMetadata[];
  agents: AgentMetadata[];
  summary: string;
  timestamp: number;
}

export interface ProcessMarker {
  type: 'skill' | 'agent';
  name: string;
  relativePath?: string;
}

export interface ProcessMarkersResult {
  skills: ProcessMarker[];
  agents: ProcessMarker[];
  hasMarkers: boolean;
}

export interface ProcessDiscoveryResult {
  skills: Array<{ name: string; file?: string }>;
  agents: Array<{ name: string; file?: string }>;
}

export interface DiscoverSkillsResult {
  skills: SkillMetadata[];
  agents: AgentMetadata[];
  processes?: ProcessMetadata[];
  summary: string;
  cached: boolean;
}
