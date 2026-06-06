import type { ExternalIntegration, ProfileGoal } from "./userTypes";

export const PROJECT_PROFILE_SCHEMA_VERSION = "2026.01.project-profile-v1";
export const PROJECT_PROFILE_FILENAME = "project-profile.json";
export const PROJECT_PROFILE_MD_FILENAME = "project-profile.md";

export interface TechStackLanguage {
  name: string;
  version?: string;
  role?: string;
}

export interface TechStackFramework {
  name: string;
  version?: string;
  category?: string;
}

export interface TechStackDatabase {
  name: string;
  type?: string;
  version?: string;
}

export interface TechStackInfrastructure {
  name: string;
  category?: string;
}

export interface TechStack {
  languages?: TechStackLanguage[];
  frameworks?: TechStackFramework[];
  databases?: TechStackDatabase[];
  infrastructure?: TechStackInfrastructure[];
  buildTools?: string[];
  packageManagers?: string[];
}

export interface ArchitectureModule {
  name: string;
  path: string;
  description?: string;
  dependencies?: string[];
}

export interface ProjectArchitecture {
  pattern?: string;
  modules?: ArchitectureModule[];
  entryPoints?: string[];
  dataFlow?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  responsibilities?: string[];
}

export interface ProjectWorkflow {
  name: string;
  description?: string;
  steps?: string[];
  triggers?: string[];
}

export interface ProcessReference {
  id: string;
  name: string;
  type: string;
  description?: string;
  configPath?: string;
}

export interface ToolConfig {
  name: string;
  configPath?: string;
  command?: string;
}

export interface ProjectTools {
  linting?: ToolConfig[];
  testing?: ToolConfig[];
  formatting?: ToolConfig[];
  [key: string]: unknown;
}

export interface ProjectService {
  name: string;
  type: string;
  url?: string;
}

export interface BabysitterCicdIntegration {
  enabled?: boolean;
  triggerOn?: string[];
  processIds?: string[];
}

export interface CicdPipeline {
  name: string;
  trigger?: string;
  stages?: string[];
}

export interface CicdConfig {
  provider?: string;
  configPaths?: string[];
  pipelines?: CicdPipeline[];
  babysitterIntegration?: BabysitterCicdIntegration;
}

export interface PainPoint {
  id: string;
  description: string;
  severity: string;
  category?: string;
  discoveredVia?: string;
  suggestedRemediation?: string;
}

export interface Bottleneck {
  id: string;
  description: string;
  impact: string;
  location?: string;
  frequency?: string;
}

export interface ProjectConventions {
  naming?: Record<string, string>;
  git?: Record<string, string>;
  codeStyle?: Record<string, unknown>;
  importOrder?: string[];
  errorHandling?: string;
  testingConventions?: string;
  additionalRules?: string[];
}

export interface ProjectRepository {
  name: string;
  url?: string;
  path?: string;
  isPrimary?: boolean;
}

export interface ProjectProfile {
  projectName: string;
  description: string;
  goals: ProfileGoal[];
  techStack: TechStack;
  architecture: ProjectArchitecture;
  team?: TeamMember[];
  workflows: ProjectWorkflow[];
  processes?: ProcessReference[];
  tools?: ProjectTools;
  services?: ProjectService[];
  externalIntegrations?: ExternalIntegration[];
  cicd?: CicdConfig;
  painPoints?: PainPoint[];
  bottlenecks?: Bottleneck[];
  conventions: ProjectConventions;
  repositories?: ProjectRepository[];
  claudeMdInstructions?: string[];
  installedSkills?: string[];
  installedAgents?: string[];
  installedProcesses?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}
