// Type definitions for the Unified Plugin Format (UPF) and compilation pipeline

export interface A5cPluginManifest {
  // Identity (required)
  name: string;
  version: string;
  description: string;
  author: string | { name: string; email?: string };
  license: string;

  // Repository & Discovery (optional)
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  keywords?: string[];

  // Components — hook values:
  //   string path  = source script, copied to output and wired via registration
  //   "proxy"      = passthrough to hooks-mux with noop handler (no custom logic)
  //   true         = stub (no-op echo '{}')
  //   null         = disabled for this target
  hooks?: Record<string, string | boolean | null>;
  commands?: string[] | string;
  skills?: Array<{
    name: string;
    file: string;
  }>;
  agents?: string | string[];

  // Context Files
  contextFiles?: Record<string, string>;

  // Target-Specific Overrides
  targets?: Record<string, TargetOverride>;

  // Shared target file bundles keyed by set name. Entries may use {{target}},
  // {{targetDir}}, and target override templateVars in paths and values.
  extraFileSets?: Record<string, Record<string, string>>;

  // Shared per-harness install-surface export groups keyed by set name.
  harnessInstallSurfaceExportSets?: Record<string, string[]>;

  // SDK infrastructure — defaults to babysitter SDK if not specified
  sdk?: {
    package?: string;      // e.g. @a5c-ai/babysitter-sdk
    cli?: string;          // e.g. babysitter
    proxyPackage?: string; // e.g. @a5c-ai/hooks-mux-cli
    proxyBinary?: string;  // e.g. a5c-hooks-mux (bin name from proxyPackage)
    scope?: string;        // e.g. @a5c-ai
    envPrefix?: string;    // e.g. BABYSITTER (for env vars like BABYSITTER_STATE_DIR)
    stateDir?: string;     // e.g. .a5c (global state directory name)
  };

  // Global hook file naming pattern — applies to all targets unless overridden
  // Supports {{name}}, {{slug}} (canonical), {{native}} (target-native name)
  hookFilePattern?: string;

  // Extra files to include in output (glob patterns relative to source dir)
  include?: string[];

  // Lifecycle scripts (relative to source dir, copied to output and called by generated installer)
  postInstall?: string;

  // Path to SDK-specific install-shared surface file (appended to the generic base)
  installSurface?: string;
  // Export names contributed by the install surface file
  installSurfaceExports?: string[];

  // Hook Configuration
  hookConfig?: {
    proxyAdapter?: boolean;
    matchers?: Record<string, string>;
  };
}

export interface TargetOverride {
  npmPackageName?: string;
  type?: 'typescript-build';
  skills?: 'derive-from-commands' | Array<{ name: string; file: string }>;
  hooks?: Record<string, string | boolean | null>;
  commands?: string[] | string;
  extensionManifest?: {
    contextFileName?: string;
    settings?: unknown[];
  };
  extraFileSets?: string[];
  extraFiles?: Record<string, string>;
  templateVars?: Record<string, string>;
  // Per-harness install-shared surface (appended after base + SDK surface)
  harnessInstallSurface?: string;
  harnessInstallSurfaceExportSets?: string[];
  harnessInstallSurfaceExports?: string[];
  // Pattern for hook output filenames: {{name}}-proxied-{{slug}}-hook.sh
  // Supports {{name}}, {{slug}} (canonical), {{native}} (target-native hook name)
  hookFilePattern?: string;
  // Pattern for JS bridge filenames (programmatic targets): {{name}}-proxied-{{native}}.js
  hookJsPattern?: string;
  // Rich harness-specific manifest (e.g. codex interface metadata)
  harnessManifest?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Diagnostic {
  level: 'info' | 'warning' | 'error';
  category: 'validation' | 'compatibility' | 'compilation' | 'verification';
  message: string;
  component?: string;
  target?: string;
  source?: string;
  suggestion?: string;
}

export type HookSupport = 'native' | 'emulated' | 'unsupported';
export type CommandSupport = 'native' | 'toml' | 'derived' | 'unsupported';
export type SkillSupport = 'native' | 'derived' | 'unsupported';
export type AgentSupport = 'native' | 'unsupported';
export type ContextSupport = 'native' | 'unsupported';

export interface ComponentSupport {
  hooks: Record<string, HookSupport>;
  commands: CommandSupport;
  skills: SkillSupport;
  agents: AgentSupport;
  context: ContextSupport;
}

export interface CompilationResult {
  target: string;
  status: 'success' | 'warning' | 'error';
  outputDir: string;
  emittedFiles: string[];
  componentSupport: ComponentSupport;
  diagnostics: Diagnostic[];
  verificationChecklist: string[];
}

export interface DiffFileDifference {
  path: string;
  line: number;
  compiledLine: string | null;
  existingLine: string | null;
}

export interface DiffResult {
  target: string;
  sourceDir: string;
  existingDir: string;
  compilationStatus: CompilationResult['status'];
  diagnostics: Diagnostic[];
  status: 'match' | 'different' | 'error';
  identical: boolean;
  differenceCount: number;
  onlyInCompiled: string[];
  onlyInExisting: string[];
  differingFiles: DiffFileDifference[];
  ignoredExistingFiles: string[];
}

export interface ValidateResult {
  valid: boolean;
  manifest: A5cPluginManifest | null;
  diagnostics: Diagnostic[];
}

export interface ResolveResult {
  effectiveManifest: A5cPluginManifest;
  targetProfile: TargetProfile;
  componentSupport: ComponentSupport;
  diagnostics: Diagnostic[];
}

export interface TransformedFile {
  path: string;
  content: string;
  binaryContent?: Buffer;
  executable?: boolean;
}

export interface TransformResult {
  files: TransformedFile[];
  diagnostics: Diagnostic[];
}

export interface EmitResult {
  emittedFiles: string[];
  diagnostics: Diagnostic[];
}

export interface VerifyResult {
  diagnostics: Diagnostic[];
  verificationChecklist: string[];
}

// Derived from Atlas PluginTarget.hookRegistrationFormat — no hardcoded list.
export type HookRegistrationFormat = string;

export type AdapterFamily = 'shell-hook' | 'programmatic';
export type DistributionModel = 'marketplace' | 'npm-cli' | 'both';

export interface InstallLayoutMetadata {
  harnessHomeRelative?: string | null;
  pluginsDirRelative?: string | null;
  marketplacePathRelative?: string | null;
}

export interface PackageMetadata {
  moduleType?: 'commonjs' | 'module';
  binScriptExt?: '.js' | '.cjs';
  installLifecycle?: 'postinstall' | 'plugin-scripts' | 'none';
  activationMessage?: 'restart' | 'codex-open-plugins';
  extraPackageFiles?: string[];
  extraScripts?: Record<string, string>;
  peerDependencyPackage?: string;
  emitCjsWrappers?: boolean;
}

export interface TargetComponentSupport {
  agents: 'native' | 'unsupported';
  context: 'native' | 'unsupported';
}

export interface TargetProfile {
  name: string;
  displayName: string;
  adapterName: string;
  pluginRootEnvVar: string | null;
  supportedHooks: Map<string, string>; // canonical -> native
  commandFormat: 'markdown' | 'toml' | 'none';
  skillHandling: 'native' | 'derived-from-commands' | 'none';
  manifestFormat: 'plugin.json' | 'package.json' | 'multiple';
  hookRegistrationFormat: HookRegistrationFormat | null;
  hookRegistrationOutputPath: string | null;
  hookRegistrationAliasPaths: string[];
  harnessManifestPath: string | null;
  requiredSurfaceFile: string | null;
  scriptVariants: Array<'bash' | 'powershell' | 'javascript' | 'typescript'>;
  npmPublishable: boolean;
  npmPackageName?: string;
  extraCapabilities?: string[];
  adapterFamily: AdapterFamily;
  distribution: DistributionModel;
  pluginRootEnvVarForExtension?: string;
  marketplacePath?: string;
  installLayout?: InstallLayoutMetadata;
  packageMetadata?: PackageMetadata;
  componentSupport?: TargetComponentSupport;
}

export interface FrontmatterData {
  [key: string]: unknown;
}

export interface ParsedFrontmatter {
  data: FrontmatterData;
  body: string;
}
