/**
 * Base parsed CLI arguments -- mirrors the SDK ParsedArgs interface
 * locally so genty-cli does not import from @a5c-ai/babysitter-sdk.
 */
export type HelpSurface = "agent" | "human";

export interface CoreParsedArgs {
  command?: string;
  /**
   * The resolved runs dir used by READ commands (tui/jsonl/resume/cleanup) to
   * discover existing runs. Defaults to the global/repo runs dir.
   */
  runsDir: string;
  /**
   * Only set when `--runs-dir` is passed explicitly. CREATE commands (yolo/call/
   * create-run) use this so that, when absent, the run defaults to
   * <workspace>/.a5c/runs (resolveWorkspaceRunsDir) instead of the global default.
   * #936: a non-undefined eager default here previously defeated the workspace anchor.
   */
  runsDirOverride?: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
  helpRequested: boolean;
  helpSurface: HelpSurface;
  pendingOnly: boolean;
  compressOutputArgs?: string[];
  compressionLayer?: string;
  compressionToggleValue?: boolean;
  compressionSetKey?: string;
  compressionSetValue?: string;
  kindFilter?: string;
  limit?: number;
  reverseOrder: boolean;
  filterType?: string;
  runDirArg?: string;
  effectId?: string;
  taskStatus?: "ok" | "error";
  valuePath?: string;
  valueInline?: string;
  errorPath?: string;
  stdoutRef?: string;
  stderrRef?: string;
  stdoutFile?: string;
  stderrFile?: string;
  startedAt?: string;
  finishedAt?: string;
  metadataPath?: string;
  invocationKey?: string;
  processId?: string;
  entrySpecifier?: string;
  inputsPath?: string;
  runIdOverride?: string;
  processRevision?: string;
  requestId?: string;
  iteration?: number;
  showConfig: boolean;
  showStrata: boolean;
  tree: boolean;
  rich: boolean;
  defaultsOnly: boolean;
  configureSubcommand?: string;
  sessionId?: string;
  stateDir?: string;
  maxIterations?: number;
  prompt?: string;
  lastIterationAt?: string;
  iterationTimes?: string;
  timeout?: number;
  transcriptPath?: string;
  hookType?: string;
  harness?: string;
  logFile?: string;
  pluginRoot?: string;
  cacheTtl?: number;
  sourceType?: "github" | "well-known";
  url?: string;
  includeRemote?: boolean;
  summaryOnly?: boolean;
  processPath?: string;
  processLibraryRepo?: string;
  processLibraryDir?: string;
  processLibraryRef?: string;
  profileUser?: boolean;
  profileProject?: boolean;
  profileInputPath?: string;
  profileDir?: string;
  pluginName?: string;
  pluginVersion?: string;
  marketplaceName?: string;
  marketplaceUrl?: string;
  marketplacePath?: string;
  marketplaceBranch?: string;
  pluginScope?: "global" | "project";
  pluginForce?: boolean;
  sessionForce?: boolean;
  logType?: string;
  logMessage?: string;
  logLabel?: string;
  logLevel?: string;
  logSource?: string;
  tokensAll?: boolean;
  tokensRunId?: string;
  costAll?: boolean;
  costRunId?: string;
  positional?: string[];
  workspace?: string;
  tag?: string;
  model?: string;
  interactive?: boolean;
  retrospectAll?: boolean;
  runIds?: string[];
  keepDays?: number;
  breakpointPattern?: string;
  breakpointRuleId?: string;
  breakpointIdArg?: string;
  breakpointAction?: string;
  breakpointSource?: string;
  breakpointNote?: string;
  breakpointTags?: string;
  breakpointExpert?: string;
  cancelReason?: string;
  patchEffect?: string;
  verbosity?: string;
  tuiFlag?: boolean;
  daemonDir?: string;
  configPath?: string;
  foreground?: boolean;
  gracePeriodMs?: number;
  transport?: string;
  port?: number;
  host?: string;
  authToken?: string;
  wsPingInterval?: number;
  wsGracePeriod?: number;
  wsMaxMps?: number;
}

/** Supported output formats for harness invocation results. */
export type HarnessOutputFormat = "json" | "text" | "adapters-events";

export interface HarnessParsedArgs extends CoreParsedArgs {
  anycliService?: string;
  anycliScope?: string;
  anycliMcp?: boolean;
  anycliAuthFile?: string;
  anycliTransport?: string;
  /** Output format for genty invoke results. */
  outputFormat?: HarnessOutputFormat;
}
