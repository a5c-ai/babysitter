import fs from "node:fs";
import path from "node:path";

const TRANSPORT_MUX_DOC_EVIDENCE_IDS = [
  "repo-transport-mux-readme",
  "repo-transport-mux-architecture",
  "repo-transport-mux-migration",
] as const;

const TRANSPORT_MUX_SCORECARD_OVERRIDE_ENV = "A5C_AGENT_CATALOG_TRANSPORT_MUX_CUTOVER";
const TRANSPORT_MUX_RUNTIME_SUBJECT_ID = "transportRuntime:amux-proxy";
const TRANSPORT_MUX_PROVISIONAL_GAP =
  "transport-mux document-backed runtime claims stay provisional until packages/transport-mux scorecard:migration is green.";

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function repoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..", "..");
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot(), relativePath), "utf8");
}

function repoFileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(repoRoot(), relativePath));
}

function countFiles(relativeDir: string, suffix: string): number {
  const absoluteDir = path.join(repoRoot(), relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return 0;
  }
  return fs.readdirSync(absoluteDir).filter((entry) => entry.endsWith(suffix)).length;
}

function containsAll(documentText: string, snippets: string[]): boolean {
  return snippets.every((snippet) => documentText.includes(snippet));
}

function cutoverOverride(): boolean | undefined {
  const override = process.env[TRANSPORT_MUX_SCORECARD_OVERRIDE_ENV]?.trim().toLowerCase();
  if (!override) {
    return undefined;
  }
  if (["green", "ready", "current", "true", "1"].includes(override)) {
    return true;
  }
  if (["red", "provisional", "false", "0"].includes(override)) {
    return false;
  }
  return undefined;
}

function evaluateTransportMuxCutover(): boolean {
  const override = cutoverOverride();
  if (override !== undefined) {
    return override;
  }

  const requiredFiles = [
    "packages/transport-mux/README.md",
    "packages/transport-mux/migration.md",
    "packages/transport-mux/architecture.md",
    "packages/transport-mux/package.json",
    "packages/transport-mux/src/index.ts",
    "packages/agent-mux/cli/src/commands/launch.ts",
  ];
  if (!requiredFiles.every(repoFileExists)) {
    return false;
  }

  const readmeDoc = readRepoFile("packages/transport-mux/README.md");
  const migrationDoc = readRepoFile("packages/transport-mux/migration.md");
  const architectureDoc = readRepoFile("packages/transport-mux/architecture.md");
  const packageJson = JSON.parse(readRepoFile("packages/transport-mux/package.json")) as {
    private?: boolean;
    files?: unknown;
    publishConfig?: {
      access?: string;
    };
    scripts?: Record<string, string>;
  };
  const packageEntrypoint = readRepoFile("packages/transport-mux/src/index.ts");
  const launchCommand = readRepoFile("packages/agent-mux/cli/src/commands/launch.ts");

  const legacyPythonTests = countFiles("packages/agent-mux/amux-proxy/tests", ".py");
  const jsContractTests =
    countFiles("packages/transport-mux/tests", ".ts") +
    countFiles("packages/transport-mux/tests/transports", ".ts") +
    countFiles("packages/transport-mux/tests/e2e", ".ts");

  const docsHonestyChecks = [
    containsAll(readmeDoc, ["published transport/proxy runtime seam", "used by the agent-mux launcher"]),
    containsAll(readmeDoc, ["published npm deliverable", "public runtime surface"]),
    containsAll(migrationDoc, [
      "published transport/proxy runtime seam",
      "public install chain",
    ]),
    containsAll(migrationDoc, [
      "publishable and aligned with the package docs map",
      "package metadata does not advertise packable artifacts that are not present locally.",
    ]),
    containsAll(architectureDoc, [
      "`launch.ts` starts the `transport-mux` runtime",
      "`transport-mux` boots the protocol codec and provider adapter implied by that config.",
    ]),
  ];

  const scorecard = [
    legacyPythonTests === 0 ||
      migrationDoc.includes(
        "Historical archive: legacy Python tests under `packages/agent-mux/amux-proxy/tests` remain available as reference material for the still-active historical runtime path.",
      ),
    packageJson.private !== true &&
      Array.isArray(packageJson.files) &&
      packageJson.publishConfig?.access === "public",
    Boolean(packageJson.scripts?.["scorecard:migration"]) && jsContractTests > 0,
    launchCommand.includes("@a5c-ai/transport-mux") && packageEntrypoint.includes("export * from './runtime.js';"),
    docsHonestyChecks.every(Boolean),
  ];

  return scorecard.every(Boolean);
}

export function isTransportMuxDocEvidenceId(evidenceId: string): boolean {
  return TRANSPORT_MUX_DOC_EVIDENCE_IDS.includes(evidenceId as (typeof TRANSPORT_MUX_DOC_EVIDENCE_IDS)[number]);
}

export function hasTransportMuxDocEvidence(evidenceIds: string[]): boolean {
  return evidenceIds.some((evidenceId) => isTransportMuxDocEvidenceId(evidenceId));
}

export function isTransportMuxCutoverReady(): boolean {
  return evaluateTransportMuxCutover();
}

export function effectiveTransportMuxClaimStatus(status: string, evidenceIds: string[]): string {
  if (!hasTransportMuxDocEvidence(evidenceIds)) {
    return status;
  }
  if (isTransportMuxCutoverReady()) {
    return status === "scorecard-gated" ? "current" : status;
  }
  return "provisional";
}

export function effectiveTransportMuxUnresolvedGaps(unresolvedGaps: string[], evidenceIds: string[]): string[] {
  if (!hasTransportMuxDocEvidence(evidenceIds) || isTransportMuxCutoverReady()) {
    return unresolvedGaps;
  }
  return uniqueStrings([...unresolvedGaps, TRANSPORT_MUX_PROVISIONAL_GAP]);
}

export function shouldSurfaceTransportRuntime(runtimeId: string): boolean {
  if (runtimeId !== "amux-proxy") {
    return true;
  }
  return isTransportMuxCutoverReady();
}

export function shouldSurfaceTransportProtocol(evidenceIds: string[]): boolean {
  if (!hasTransportMuxDocEvidence(evidenceIds)) {
    return true;
  }
  return isTransportMuxCutoverReady();
}

export function shouldSurfaceCapabilitySupport(subjectKind: string, subjectId: string, evidenceIds: string[]): boolean {
  if (subjectKind === "TransportRuntime" && subjectId === TRANSPORT_MUX_RUNTIME_SUBJECT_ID) {
    return isTransportMuxCutoverReady();
  }
  if (hasTransportMuxDocEvidence(evidenceIds)) {
    return isTransportMuxCutoverReady() || subjectKind !== "TransportRuntime";
  }
  return true;
}
