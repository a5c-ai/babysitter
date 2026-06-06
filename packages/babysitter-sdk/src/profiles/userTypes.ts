export const USER_PROFILE_SCHEMA_VERSION = "2026.01.user-profile-v1";
export const USER_PROFILE_FILENAME = "user-profile.json";
export const USER_PROFILE_MD_FILENAME = "user-profile.md";

export type BreakpointTolerance = "minimal" | "low" | "moderate" | "high" | "maximum";
export type ExpertiseLevel = "novice" | "beginner" | "intermediate" | "advanced" | "expert";

export interface ExpertiseRating {
  level: ExpertiseLevel;
  confidence?: number;
  lastAssessed?: string;
}

export interface UserSpecialty {
  domain: string;
  subdomains?: string[];
  yearsActive?: number;
}

export interface ProfileGoal {
  id: string;
  description: string;
  category: string;
  priority?: string;
  status?: string;
}

export interface WorkingHours {
  timezone?: string;
  start?: string;
  end?: string;
}

export interface UserPreferences {
  verbosity?: string;
  autonomyLevel?: string;
  riskTolerance?: string;
  workingHours?: WorkingHours;
  learningStyle?: string;
  [key: string]: unknown;
}

export interface ToolPreferences {
  editor?: string;
  shell?: string;
  terminal?: string;
  packageManagers?: string[];
  languages?: string[];
  operatingSystem?: string;
  [key: string]: unknown;
}

export interface BreakpointConfig {
  global: BreakpointTolerance;
  perCategory?: Record<string, BreakpointTolerance>;
  skipBreakpointsForKnownPatterns?: boolean;
  alwaysBreakOn?: string[];
  postureOverrides?: Partial<Record<"read" | "write" | "execute" | "destroy" | "network" | "auth", Partial<{
    name: string;
    allowAutoApprove: boolean;
    minConsecutiveApprovalsForAutoN: number;
    requireExplicitRule: boolean;
    requiredTags: string[];
    requiredApproverLevel: string;
  }>>>;
  disablePostureEnforcement?: boolean;
}

export interface CommunicationStyle {
  tone?: string;
  language?: string;
  useEmojis?: boolean;
  explanationDepth?: string;
  preferredResponseFormat?: string;
}

export interface SocialProfile {
  platform: string;
  url: string;
  username?: string;
  isPublic?: boolean;
  lastScraped?: string;
}

export interface PreviousRole {
  title: string;
  organization?: string;
  duration?: string;
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  field?: string;
  year?: number;
}

export interface ProfessionalExperience {
  totalYearsProfessional?: number;
  currentRole?: string;
  currentOrganization?: string;
  industries?: string[];
  previousRoles?: PreviousRole[];
  education?: EducationEntry[];
  certifications?: string[];
}

export interface ExternalIntegration {
  service: string;
  category: string;
  enabled: boolean;
  configRef?: string;
}

export interface UserProfile {
  name: string;
  specialties: UserSpecialty[];
  expertiseLevels: Record<string, ExpertiseRating>;
  goals: ProfileGoal[];
  preferences: UserPreferences;
  toolPreferences: ToolPreferences;
  breakpointTolerance: BreakpointConfig;
  communicationStyle: CommunicationStyle;
  socialProfiles?: SocialProfile[];
  experience: ProfessionalExperience;
  externalIntegrations?: ExternalIntegration[];
  installedPlugins?: string[];
  installedSkills?: string[];
  installedAgents?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}
