/**
 * Process Library Catalog Types
 */

export interface ProcessDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "deprecated" | "draft";
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  processId: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  inputs: SkillInput[];
  outputs: SkillOutput[];
  processId: string;
}

export interface SkillInput {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

export interface SkillOutput {
  name: string;
  type: string;
  description?: string;
}

export interface CatalogItem {
  type: "process" | "agent" | "skill";
  data: ProcessDefinition | Agent | Skill;
  path: string;
}

export interface SearchResult {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  category?: string;
  tags?: string[];
  status?: ProcessDefinition["status"];
  search?: string;
}
