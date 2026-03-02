/**
 * Profile Types for Babysitter SDK
 *
 * This module defines the TypeScript interfaces for user and project profiles.
 * Profiles store persistent configuration, preferences, and contextual information
 * that the babysitter runtime uses to tailor its behavior.
 */

/**
 * Schema version for user profile serialization.
 * Used to detect and migrate older profile formats.
 */
export const USER_PROFILE_SCHEMA_VERSION = "2026.01.user-profile-v1";

/**
 * Schema version for project profile serialization.
 * Used to detect and migrate older project profile formats.
 */
export const PROJECT_PROFILE_SCHEMA_VERSION = "2026.01.project-profile-v1";

/**
 * Filename for the JSON-serialized user profile.
 */
export const USER_PROFILE_FILENAME = "user-profile.json";

/**
 * Filename for the human-readable markdown user profile summary.
 */
export const USER_PROFILE_MD_FILENAME = "user-profile.md";

/**
 * Filename for the JSON-serialized project profile.
 */
export const PROJECT_PROFILE_FILENAME = "project-profile.json";

/**
 * Filename for the human-readable markdown project profile summary.
 */
export const PROJECT_PROFILE_MD_FILENAME = "project-profile.md";

/**
 * How tolerant the user is of breakpoint interruptions during process execution.
 *
 * - `minimal` — Only break for critical safety/security issues
 * - `low` — Break for important decisions only
 * - `moderate` — Standard breakpoint behavior
 * - `high` — Break frequently for review and approval
 * - `maximum` — Break at every possible checkpoint
 */
export type BreakpointTolerance = "minimal" | "low" | "moderate" | "high" | "maximum";

/**
 * Self-reported or assessed expertise level in a given domain.
 */
export type ExpertiseLevel = "novice" | "beginner" | "intermediate" | "advanced" | "expert";

/**
 * An expertise rating for a specific skill or domain, with optional
 * confidence score and assessment timestamp.
 */
export interface ExpertiseRating {
  /** The assessed expertise level */
  level: ExpertiseLevel;
  /** Confidence in the assessment, from 0.0 (no confidence) to 1.0 (certain) */
  confidence?: number;
  /** ISO 8601 timestamp of when this expertise was last assessed */
  lastAssessed?: string;
}

/**
 * A specialty domain that the user has experience in.
 */
export interface UserSpecialty {
  /** Primary domain name (e.g., "backend", "machine-learning") */
  domain: string;
  /** More specific areas within the domain */
  subdomains?: string[];
  /** Approximate years of active work in this domain */
  yearsActive?: number;
}

/**
 * A goal with tracking metadata.
 */
export interface ProfileGoal {
  /** Unique identifier for the goal */
  id: string;
  /** Human-readable description of the goal */
  description: string;
  /** Category grouping (e.g., "learning", "delivery", "architecture") */
  category: string;
  /** Priority level (e.g., "high", "medium", "low") */
  priority?: string;
  /** Current status (e.g., "active", "completed", "paused") */
  status?: string;
}

/**
 * Working hours configuration for time-aware scheduling.
 */
export interface WorkingHours {
  /** IANA timezone identifier (e.g., "America/New_York") */
  timezone?: string;
  /** Start time in HH:MM format */
  start?: string;
  /** End time in HH:MM format */
  end?: string;
}

/**
 * User preferences for babysitter interaction behavior.
 */
export interface UserPreferences {
  /** Desired output verbosity (e.g., "concise", "normal", "verbose") */
  verbosity?: string;
  /** How much autonomy the babysitter should exercise (e.g., "supervised", "semi-autonomous", "autonomous") */
  autonomyLevel?: string;
  /** Tolerance for risky operations (e.g., "conservative", "moderate", "aggressive") */
  riskTolerance?: string;
  /** Preferred working hours for time-sensitive operations */
  workingHours?: WorkingHours;
  /** Preferred learning style (e.g., "visual", "hands-on", "reading") */
  learningStyle?: string;
  /** Additional preference key-value pairs */
  [key: string]: unknown;
}

/**
 * User preferences for development tools and environment.
 */
export interface ToolPreferences {
  /** Preferred code editor (e.g., "vscode", "neovim", "intellij") */
  editor?: string;
  /** Preferred shell (e.g., "bash", "zsh", "fish") */
  shell?: string;
  /** Preferred terminal emulator */
  terminal?: string;
  /** Preferred package managers in order of preference */
  packageManagers?: string[];
  /** Programming languages the user works with */
  languages?: string[];
  /** Primary operating system */
  operatingSystem?: string;
  /** Additional tool preference key-value pairs */
  [key: string]: unknown;
}

/**
 * Configuration for breakpoint behavior during process execution.
 */
export interface BreakpointConfig {
  /** Global breakpoint tolerance level */
  global: BreakpointTolerance;
  /** Per-category overrides for breakpoint tolerance */
  perCategory?: Record<string, BreakpointTolerance>;
  /** Whether to skip breakpoints for patterns the user has previously approved */
  skipBreakpointsForKnownPatterns?: boolean;
  /** Categories or patterns that should always trigger a breakpoint */
  alwaysBreakOn?: string[];
}

/**
 * Communication style preferences for babysitter responses.
 */
export interface CommunicationStyle {
  /** Desired tone (e.g., "professional", "casual", "technical") */
  tone?: string;
  /** Preferred language for responses (e.g., "en", "es", "ja") */
  language?: string;
  /** Whether to include emojis in output */
  useEmojis?: boolean;
  /** Depth of explanations (e.g., "brief", "standard", "detailed") */
  explanationDepth?: string;
  /** Preferred format for responses (e.g., "markdown", "plain", "structured") */
  preferredResponseFormat?: string;
}

/**
 * A linked social or professional profile.
 */
export interface SocialProfile {
  /** Platform name (e.g., "github", "linkedin", "twitter") */
  platform: string;
  /** URL to the profile */
  url: string;
  /** Username on the platform */
  username?: string;
  /** Whether the profile is publicly visible */
  isPublic?: boolean;
  /** ISO 8601 timestamp of the last time profile data was fetched */
  lastScraped?: string;
}

/**
 * Professional experience details.
 */
export interface PreviousRole {
  /** Job title */
  title: string;
  /** Organization name */
  organization?: string;
  /** Duration description (e.g., "2 years", "2019-2022") */
  duration?: string;
}

/**
 * Education entry.
 */
export interface EducationEntry {
  /** Institution name */
  institution?: string;
  /** Degree type (e.g., "BS", "MS", "PhD") */
  degree?: string;
  /** Field of study */
  field?: string;
  /** Graduation year */
  year?: number;
}

/**
 * Professional experience and background.
 */
export interface ProfessionalExperience {
  /** Total years of professional experience */
  totalYearsProfessional?: number;
  /** Current job title */
  currentRole?: string;
  /** Current employer or organization */
  currentOrganization?: string;
  /** Industries the user has worked in */
  industries?: string[];
  /** Previous professional roles */
  previousRoles?: PreviousRole[];
  /** Educational background */
  education?: EducationEntry[];
  /** Professional certifications */
  certifications?: string[];
}

/**
 * An external service integration reference.
 */
export interface ExternalIntegration {
  /** Service name (e.g., "jira", "slack", "github") */
  service: string;
  /** Integration category (e.g., "project-management", "communication", "vcs") */
  category: string;
  /** Whether the integration is currently enabled */
  enabled: boolean;
  /** Path or reference to the integration configuration */
  configRef?: string;
}

/**
 * Complete user profile containing personal preferences, expertise,
 * and configuration for the babysitter runtime.
 *
 * Stored at `~/.config/babysitter/user-profile.json`.
 */
export interface UserProfile {
  /** Display name for the user */
  name: string;
  /** Domains of specialization */
  specialties: UserSpecialty[];
  /** Expertise ratings keyed by skill/technology name */
  expertiseLevels: Record<string, ExpertiseRating>;
  /** Personal and professional goals */
  goals: ProfileGoal[];
  /** General interaction preferences */
  preferences: UserPreferences;
  /** Development tool preferences */
  toolPreferences: ToolPreferences;
  /** Breakpoint interruption tolerance settings */
  breakpointTolerance: BreakpointConfig;
  /** Communication style preferences */
  communicationStyle: CommunicationStyle;
  /** Linked social and professional profiles */
  socialProfiles?: SocialProfile[];
  /** Professional experience and background */
  experience: ProfessionalExperience;
  /** Connected external service integrations */
  externalIntegrations?: ExternalIntegration[];
  /** IDs of installed babysitter plugins */
  installedPlugins?: string[];
  /** IDs of installed babysitter skills */
  installedSkills?: string[];
  /** IDs of installed babysitter agents */
  installedAgents?: string[];
  /** ISO 8601 timestamp of profile creation */
  createdAt: string;
  /** ISO 8601 timestamp of last profile update */
  updatedAt: string;
  /** Monotonically increasing version number for optimistic concurrency */
  version: number;
}

// ─── Project Profile Types ────────────────────────────────────────────

/**
 * A programming language entry in the tech stack.
 */
export interface TechStackLanguage {
  /** Language name */
  name: string;
  /** Version or version range */
  version?: string;
  /** Role in the project (e.g., "primary", "scripting", "build") */
  role?: string;
}

/**
 * A framework entry in the tech stack.
 */
export interface TechStackFramework {
  /** Framework name */
  name: string;
  /** Version or version range */
  version?: string;
  /** Category (e.g., "web", "testing", "orm") */
  category?: string;
}

/**
 * A database entry in the tech stack.
 */
export interface TechStackDatabase {
  /** Database name */
  name: string;
  /** Database type (e.g., "relational", "document", "graph") */
  type?: string;
  /** Version */
  version?: string;
}

/**
 * An infrastructure component in the tech stack.
 */
export interface TechStackInfrastructure {
  /** Component name */
  name: string;
  /** Category (e.g., "hosting", "cdn", "container") */
  category?: string;
}

/**
 * Complete technology stack description for a project.
 */
export interface TechStack {
  /** Programming languages used */
  languages?: TechStackLanguage[];
  /** Frameworks and libraries */
  frameworks?: TechStackFramework[];
  /** Databases and data stores */
  databases?: TechStackDatabase[];
  /** Infrastructure components */
  infrastructure?: TechStackInfrastructure[];
  /** Build tool names */
  buildTools?: string[];
  /** Package manager names */
  packageManagers?: string[];
}

/**
 * A module or component in the project architecture.
 */
export interface ArchitectureModule {
  /** Module name */
  name: string;
  /** Filesystem path relative to project root */
  path: string;
  /** Human-readable description */
  description?: string;
  /** Names of other modules this depends on */
  dependencies?: string[];
}

/**
 * Project architecture description.
 */
export interface ProjectArchitecture {
  /** Architectural pattern (e.g., "monorepo", "microservices", "monolith") */
  pattern?: string;
  /** Major modules or components */
  modules?: ArchitectureModule[];
  /** Main entry point files */
  entryPoints?: string[];
  /** Description of data flow through the system */
  dataFlow?: string;
}

/**
 * A team member associated with the project.
 */
export interface TeamMember {
  /** Team member name */
  name: string;
  /** Role on the project */
  role: string;
  /** Specific responsibilities */
  responsibilities?: string[];
}

/**
 * A defined workflow in the project.
 */
export interface ProjectWorkflow {
  /** Workflow name */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Ordered list of step descriptions */
  steps?: string[];
  /** Events or conditions that trigger this workflow */
  triggers?: string[];
}

/**
 * A process definition reference.
 */
export interface ProcessReference {
  /** Unique process identifier */
  id: string;
  /** Human-readable process name */
  name: string;
  /** Process type (e.g., "build", "deploy", "review") */
  type: string;
  /** Human-readable description */
  description?: string;
  /** Path to the process configuration file */
  configPath?: string;
}

/**
 * A tool configuration reference.
 */
export interface ToolConfig {
  /** Tool name */
  name: string;
  /** Path to the tool's configuration file */
  configPath?: string;
  /** Command to invoke the tool */
  command?: string;
}

/**
 * Project tooling configuration grouped by category.
 */
export interface ProjectTools {
  /** Linting tools */
  linting?: ToolConfig[];
  /** Testing tools */
  testing?: ToolConfig[];
  /** Code formatting tools */
  formatting?: ToolConfig[];
  /** Additional tool categories */
  [key: string]: unknown;
}

/**
 * An external service used by the project.
 */
export interface ProjectService {
  /** Service name */
  name: string;
  /** Service type (e.g., "api", "database", "queue") */
  type: string;
  /** Service URL or endpoint */
  url?: string;
}

/**
 * Babysitter-specific CI/CD integration settings.
 */
export interface BabysitterCicdIntegration {
  /** Whether babysitter CI/CD integration is enabled */
  enabled?: boolean;
  /** Events that trigger babysitter processes */
  triggerOn?: string[];
  /** Process IDs to run in CI/CD */
  processIds?: string[];
}

/**
 * A CI/CD pipeline definition.
 */
export interface CicdPipeline {
  /** Pipeline name */
  name: string;
  /** Trigger event or condition */
  trigger?: string;
  /** Pipeline stages in order */
  stages?: string[];
}

/**
 * CI/CD configuration for the project.
 */
export interface CicdConfig {
  /** CI/CD provider (e.g., "github-actions", "gitlab-ci", "jenkins") */
  provider?: string;
  /** Paths to CI/CD configuration files */
  configPaths?: string[];
  /** Defined pipelines */
  pipelines?: CicdPipeline[];
  /** Babysitter-specific CI/CD integration */
  babysitterIntegration?: BabysitterCicdIntegration;
}

/**
 * A known pain point in the project.
 */
export interface PainPoint {
  /** Unique identifier */
  id: string;
  /** Description of the pain point */
  description: string;
  /** Severity level (e.g., "critical", "high", "medium", "low") */
  severity: string;
  /** Category (e.g., "performance", "dx", "reliability") */
  category?: string;
  /** How this pain point was discovered */
  discoveredVia?: string;
  /** Suggested fix or mitigation */
  suggestedRemediation?: string;
}

/**
 * A known bottleneck in the project.
 */
export interface Bottleneck {
  /** Unique identifier */
  id: string;
  /** Description of the bottleneck */
  description: string;
  /** Impact description (e.g., "blocks deploys", "slows CI by 10min") */
  impact: string;
  /** Where in the project this occurs */
  location?: string;
  /** How often this is encountered (e.g., "every PR", "weekly", "rarely") */
  frequency?: string;
}

/**
 * Project coding and development conventions.
 */
export interface ProjectConventions {
  /** Naming conventions keyed by entity type (e.g., "files", "variables", "components") */
  naming?: Record<string, string>;
  /** Git workflow conventions (e.g., "branchPrefix", "commitFormat") */
  git?: Record<string, string>;
  /** Code style rules */
  codeStyle?: Record<string, unknown>;
  /** Import ordering rules */
  importOrder?: string[];
  /** Error handling conventions description */
  errorHandling?: string;
  /** Testing conventions description */
  testingConventions?: string;
  /** Additional convention rules */
  additionalRules?: string[];
}

/**
 * A repository associated with the project.
 */
export interface ProjectRepository {
  /** Repository name */
  name: string;
  /** Remote URL */
  url?: string;
  /** Local filesystem path */
  path?: string;
  /** Whether this is the primary repository */
  isPrimary?: boolean;
}

/**
 * Complete project profile containing technical context, architecture,
 * tooling, and workflow information for babysitter to use.
 *
 * Stored at `{projectRoot}/.a5c/project-profile.json`.
 */
export interface ProjectProfile {
  /** Project name */
  projectName: string;
  /** Human-readable project description */
  description: string;
  /** Project-level goals */
  goals: ProfileGoal[];
  /** Technology stack details */
  techStack: TechStack;
  /** Architectural overview */
  architecture: ProjectArchitecture;
  /** Team members */
  team?: TeamMember[];
  /** Defined workflows */
  workflows: ProjectWorkflow[];
  /** Registered process definitions */
  processes?: ProcessReference[];
  /** Development tooling configuration */
  tools?: ProjectTools;
  /** External services the project depends on */
  services?: ProjectService[];
  /** External service integrations */
  externalIntegrations?: ExternalIntegration[];
  /** CI/CD configuration */
  cicd?: CicdConfig;
  /** Known pain points */
  painPoints?: PainPoint[];
  /** Known bottlenecks */
  bottlenecks?: Bottleneck[];
  /** Coding and development conventions */
  conventions: ProjectConventions;
  /** Associated repositories */
  repositories?: ProjectRepository[];
  /** Instructions extracted from or for CLAUDE.md */
  claudeMdInstructions?: string[];
  /** IDs of installed babysitter skills */
  installedSkills?: string[];
  /** IDs of installed babysitter agents */
  installedAgents?: string[];
  /** IDs of installed babysitter processes */
  installedProcesses?: string[];
  /** ISO 8601 timestamp of profile creation */
  createdAt: string;
  /** ISO 8601 timestamp of last profile update */
  updatedAt: string;
  /** Monotonically increasing version number for optimistic concurrency */
  version: number;
}
