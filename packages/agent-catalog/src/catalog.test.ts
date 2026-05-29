import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  AGENT_CATALOG,
  getCliNodeQuery,
  findProcessesByPath,
  getAgentVersion,
  getAgentVersionTopology,
  getCatalogGraphDocument,
  getCatalogGraphSnapshot,
  getCatalogOntologySchema,
  getCapabilitySupportAssertions,
  getFallbackHarnessMetadata,
  getHostDetectionRules,
  getHookNameMap,
  getHooksMuxDetectionRules,
  listCliAgentRelations,
  listCliCapabilitySupport,
  listCliEvidenceClaims,
  listCliEvidenceSources,
  listCliGraphEdges,
  listCliGraphNodes,
  listCliPackageRelations,
  listCliProcessRelations,
  getOntologyClaim,
  getOntologyEvidenceSource,
  getPluginTargetDescriptor,
  getPackageTopology,
  getPathDescriptor,
  getProviderTranslation,
  getProviderModelTopology,
  getSubjectProvenance,
  getOntologyEvidenceManifest,
  getOntologyEvidenceSnapshot,
  getUiAgentCards,
  listCapabilitySupportByAgentVersion,
  listClaimsForSubject,
  listEvidenceForSubject,
  listOntologyNodesByKind,
  listOntologyClaims,
  listPackageSurfaces,
  lookupHarnessImage,
  getCatalogSkillBySlug,
  listAgentVersions,
  listCatalogSkills,
  resolveCatalogEvidenceAssetPath,
  resolveCatalogGraphAssetPath,
  supportsAgentCapability,
  searchOntologyEvidence,
} from "./index";

const CATALOG_TEST_TIMEOUT_MS = 60_000;

function slugifyVersionRange(versionRange: string): string {
  return versionRange
    .replace(/>=/g, "ge-")
    .replace(/<=/g, "le-")
    .replace(/>/g, "gt-")
    .replace(/</g, "lt-")
    .replace(/=/g, "eq-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

describe("agent-catalog graph-backed ontology", () => {
  it("loads YAML graph metadata and schema", () => {
    expect(getCatalogGraphDocument().graphId).toBe("graph:agent-catalog");
    expect(getCatalogOntologySchema().version).toContain("agent-catalog-v2");
    expect(getCatalogGraphSnapshot().nodes.length).toBeGreaterThan(50);
  });

  it("resolves graph and evidence assets from the package runtime path instead of process.cwd()", () => {
    const previousCwd = process.cwd();
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-catalog-runtime-"));

    process.chdir(tempRoot);
    try {
      const graphPath = resolveCatalogGraphAssetPath("agent-catalog.graph.yaml");
      const evidenceManifestPath = resolveCatalogEvidenceAssetPath("ontology-evidence", "manifest.json");

      expect(graphPath).toBe(path.resolve(__dirname, "..", "graph", "agent-catalog.graph.yaml"));
      expect(evidenceManifestPath).toBe(path.resolve(__dirname, "..", "evidence", "ontology-evidence", "manifest.json"));
      expect(getCatalogGraphDocument().graphId).toBe("graph:agent-catalog");
      expect(getOntologyEvidenceManifest().shards.length).toBeGreaterThan(0);
    } finally {
      process.chdir(previousCwd);
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps version-scoped codex rows", () => {
    const codex = listAgentVersions().filter((agent) => agent.agentId === "codex");
    expect(codex).toHaveLength(2);
    expect(codex.map((agent) => agent.versionRange)).toContain(">=0.119.0");
  });

  it("keeps the Copilot AgentVersion id slug aligned with its versionRange slug", () => {
    const graph = getCatalogGraphSnapshot();
    const mismatches = graph.nodes
      .filter((node) => node.kind === "AgentVersion" && node.agentId === "copilot")
      .map((node) => ({
        id: String(node.id),
        expectedId: `agentVersion:${node.agentId}:${slugifyVersionRange(String(node.versionRange))}`,
      }))
      .filter((entry) => entry.id !== entry.expectedId);

    expect(mismatches).toEqual([]);
  });

  it("exposes shared fallback metadata for sdk consumers", () => {
    const metadata = getFallbackHarnessMetadata("claude-code");
    expect(metadata).toBeDefined();
    expect(metadata!.adapterName).toBe("claude");
    expect(metadata!.capabilities.supportsMCP).toBe(false);
    expect(getFallbackHarnessMetadata("agent-platform")).toBeUndefined();
  });

  it("exposes hooks-mux detection rules from discovery-signal nodes", () => {
    const rules = getHooksMuxDetectionRules();
    expect(rules.find((rule) => rule.adapter === "codex" && rule.confidence === "medium")).toBeDefined();
  });

  it("exposes host-detection argv metadata from discovery-signal nodes", () => {
    const rules = getHostDetectionRules();
    expect(rules.find((rule) => rule.agent === "claude")?.argvMatches).toContain("claude-code");
    expect(rules.find((rule) => rule.agent === "gemini")?.argvMatches).toContain("gemini-cli");
  });

  it("exposes plugin hook-name mappings from hook-mapping nodes", () => {
    const hookMap = getHookNameMap();
    expect(hookMap.SessionStart.codex).toBe("SessionStart");
    expect(hookMap.AfterAgent["gemini-cli"]).toBe("AfterAgent");
  });

  it("exposes compiler-facing plugin target descriptors from graph nodes", () => {
    const codex = getPluginTargetDescriptor("codex");
    expect(codex).toBeDefined();
    expect(codex!.adapterName).toBe("codex");
    expect(codex!.supportedHooks.Stop).toBe("Stop");
    expect(codex!.installLayout?.marketplacePathRelative).toBe(".agents/plugins/marketplace.json");
    expect(codex!.packageMetadata?.activationMessage).toBe("codex-open-plugins");
  });

  it("models Hermes non-interactive launches through oneshot prompt delivery", () => {
    const hermes = getPluginTargetDescriptor("hermes");

    expect(hermes?.defaultTransportId).toBe("openai-chat");
    expect(hermes?.launchBehavior?.promptDelivery).toBe("cli-flag");
    expect(hermes?.launchBehavior?.promptFlag).toBe("-z");
    expect(hermes?.launchBehavior?.stdinBehavior).toBe("close-after-prompt");
    expect(hermes?.launchBehavior?.selfExits).toBe(true);
    expect(hermes?.launchBehavior?.needsIdleKill).toBe(false);
  });

  it("exposes UI cards and harness images from graph-derived wrappers", () => {
    expect(getUiAgentCards().length).toBe(AGENT_CATALOG.agents.length);
    expect(getUiAgentCards()[0].filePath).toContain("graph/agent-stack/core-impls");
    expect(lookupHarnessImage("codex")?.image).toContain("codex");
  });

  it("exposes richer ontology list/detail projections for UI consumers", async () => {
    const { getUiAgentOntologyEntry, getUiAgentOntologyList } = await import("./sdk");
    const list = getUiAgentOntologyList();
    const codexCurrent = getUiAgentOntologyEntry("codex--ge-0-119-0");

    expect(list.length).toBe(AGENT_CATALOG.agents.length);
    expect(list.find((entry) => entry.slug === "codex--ge-0-0-0-lt-0-119-0")).toBeDefined();
    expect(codexCurrent).toBeDefined();
    expect(codexCurrent?.capabilityMatrix.find((entry) => entry.capabilityId === "runtime-hooks")?.versionRange).toBe(
      ">=0.119.0",
    );
    expect(codexCurrent?.lifecycleSemantics[0]?.runtimeHookMode).toContain("windows-support");
    expect(codexCurrent?.sessionSemantics.length).toBeGreaterThan(0);
    expect(codexCurrent?.evidenceSummary.corroboratedCount).toBeGreaterThan(0);
  });

  it("keeps provider catalog scoped to model providers rather than harness vendors", () => {
    const providerIds = AGENT_CATALOG.providers.map((provider) => provider.providerId);
    expect(providerIds).not.toContain("cursor");
    expect(providerIds).not.toContain("a5c-ai");
    expect(providerIds).not.toContain("opencode");
    expect(providerIds).not.toContain("openclaw");
    expect(providerIds).toContain("openai");
  });

  it("includes richer schema node kinds for packages, ci, claims, and runtime semantics", () => {
    expect(listOntologyNodesByKind("PackageSurface").length).toBeGreaterThan(3);
    expect(listOntologyNodesByKind("CiSurface").length).toBeGreaterThan(0);
    expect(listOntologyNodesByKind("Claim").length).toBeGreaterThan(5);
    expect(listOntologyNodesByKind("SessionSemantics").length).toBeGreaterThan(3);
  });

  it("assigns stable unique slugs to duplicated skill names and resolves them by slug", () => {
    const duplicates = listCatalogSkills()
      .filter((skill) => skill.name === "test-driven-development")
      .sort((left, right) => left.slug.localeCompare(right.slug));

    expect(duplicates).toHaveLength(3);
    expect(duplicates.map((skill) => skill.slug)).toEqual([
      "methodologies--cc10x--skills--test-driven-development",
      "methodologies--rpikit--skills--test-driven-development",
      "methodologies--superpowers--skills--test-driven-development",
    ]);
    expect(new Set(duplicates.map((skill) => skill.slug)).size).toBe(duplicates.length);

    for (const skill of duplicates) {
      expect(getCatalogSkillBySlug(skill.slug)).toMatchObject({
        slug: skill.slug,
        filePath: skill.filePath,
        name: "test-driven-development",
      });
    }
  }, CATALOG_TEST_TIMEOUT_MS);

  it("loads the sharded ontology evidence export through its manifest", () => {
    const manifest = getOntologyEvidenceManifest();
    const evidence = getOntologyEvidenceSnapshot();

    expect(manifest.shards.length).toBeGreaterThan(3);
    expect(manifest.shards.every((shard) => shard.entryCount > 0)).toBe(true);
    expect(evidence.evidenceSources).toHaveLength(listOntologyNodesByKind("EvidenceSource").length);
    expect(evidence.claims).toHaveLength(listOntologyNodesByKind("Claim").length);
  });

  it("records claim provenance, evidence strength, and unresolved gaps explicitly", () => {
    const claims = new Map(listOntologyClaims().map((claim) => [claim.claimId, claim]));

    expect(claims.get("repo-sdk-fallback")?.provenanceKind).toBe("repo-observation");
    expect(claims.get("repo-sdk-fallback")?.evidenceStrength).toBe("corroborated");
    expect(claims.get("repo-sdk-fallback")?.unresolvedGaps).toEqual([]);

    expect(claims.get("web-codex-session-resume")?.evidenceStrength).toBe("corroborated");
    expect(claims.get("web-codex-image-input")?.provenanceKind).toBe("vendor-inference");
    expect(claims.get("web-codex-image-input")?.evidenceStrength).toBe("inferred");
    expect(claims.get("web-codex-image-input")?.unresolvedGaps.length).toBeGreaterThan(0);
    expect(claims.get("repo-transport-mux-readme")?.status).toBe("provisional");
  });

  it("records Claude Code 2.1.153 user-facing plugin, status-line, MCP, and keybinding changes", () => {
    const version = getAgentVersion("claude-code", "2.1.153");
    const graph = getCatalogGraphSnapshot();
    const node = graph.nodes.find((entry) => entry.id === "agentVersion:claude:ge-0-0-0");

    expect(version?.versionRange).toBe(">=2.1.153");
    expect(node?.releaseNotesUrl).toContain("anthropics/claude-code/releases/tag/v2.1.153");
    expect(node?.assimilationNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("skipLfs"),
        expect.stringContaining("COLUMNS and LINES"),
        expect.stringContaining("strict-mcp-config"),
        expect.stringContaining("modelPicker:thisSessionOnly"),
      ]),
    );

    const evidence = getOntologyEvidenceSource("claude-code-2-1-153-release");
    expect(evidence?.sourcePathOrUrl).toContain("anthropics/claude-code/releases/tag/v2.1.153");

    const ui = listOntologyNodesByKind("AgentUIImpl").find((entry) => entry.id === "agent-ui-impl:claude-code.ui@current");
    expect(JSON.stringify(ui)).toContain("COLUMNS");
    expect(JSON.stringify(ui)).toContain("PR #N");
    expect(JSON.stringify(ui)).toContain("modelPicker:thisSessionOnly");

    const platform = listOntologyNodesByKind("AgentPlatformImpl").find((entry) => entry.id === "agent-platform-impl:claude-code.platform@1.x");
    expect(JSON.stringify(platform)).toContain("skipLfs");
    expect(JSON.stringify(platform)).toContain("globalNpmAutoUpdateFailureNotice");

    const runtime = listOntologyNodesByKind("AgentRuntimeImpl").find((entry) => entry.id === "agent-runtime-impl:claude-code.runtime@1.x");
    expect(JSON.stringify(runtime)).toContain("--strict-mcp-config");
    expect(JSON.stringify(runtime)).toContain("--bare");
    expect(JSON.stringify(runtime)).toContain("combinedMcpServerAndConnectorAuthNotices");
  });

  it("records OpenCode 1.15.11 upstream release assimilation", () => {
    const version = getAgentVersion("opencode", "1.15.11");
    const graph = getCatalogGraphSnapshot();
    const node = graph.nodes.find((entry) => entry.id === "agentVersion:opencode:ge-0-0-0");

    expect(version?.versionRange).toBe(">=1.15.11");
    expect(node?.currentVersion).toBe("1.15.11");
    expect(node?.releaseNotesUrl).toContain("anomalyco/opencode/releases/tag/v1.15.11");
    expect(node?.assimilationNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("headerTimeout"),
        expect.stringContaining("modalities.input"),
        expect.stringContaining("Dynamic MCP servers disconnect cleanly"),
        expect.stringContaining("DigitalOcean OAuth-token inference"),
        expect.stringContaining("plugin dispose hook"),
      ]),
    );

    const evidence = getOntologyEvidenceSource("opencode-1-15-11-release");
    expect(evidence?.sourcePathOrUrl).toContain("anomalyco/opencode/releases/tag/v1.15.11");

    const claims = listClaimsForSubject("agentVersion:opencode:ge-0-0-0");
    expect(claims.map((claim) => claim.claimId)).toContain("opencode-1-15-11-release-assimilation");
    expect(claims.find((claim) => claim.claimId === "opencode-1-15-11-release-assimilation")?.statement).toContain(
      "TUI and Desktop refinements",
    );
  });

  it("records Pi 0.76.0 session, RPC, retry, and Codex Responses header updates", () => {
    const version = getAgentVersion("pi", "0.76.0");
    const graph = getCatalogGraphSnapshot();
    const node = graph.nodes.find((entry) => entry.id === "agentVersion:pi:ge-0-75-5");
    const pluginTarget = getPluginTargetDescriptor("pi");
    const openAiTranslation = getProviderTranslation("pi", "openai");

    expect(version?.versionRange).toBe(">=0.76.0");
    expect(node?.currentVersion).toBe("0.76.0");
    expect(node?.releaseNotesUrl).toContain("earendil-works/pi/releases/tag/v0.76.0");
    expect(node?.assimilationNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("--session-id"),
        expect.stringContaining("excludeFromContext"),
        expect.stringContaining("retry.provider.maxRetries"),
        expect.stringContaining("session-id"),
      ]),
    );

    expect(pluginTarget?.launchBehavior?.sessionIdFlag).toBe("--session-id");
    expect(openAiTranslation?.notes).toContain("retry.provider.maxRetries");
    expect(JSON.stringify(graph.nodes.find((entry) => entry.id === "provider-translation:pi:openai"))).toContain("session-id");
    expect(JSON.stringify(graph.nodes.find((entry) => entry.id === "provider-translation:pi:openai"))).toContain("session_id");

    const evidence = getOntologyEvidenceSource("pi-0-76-0-release");
    expect(evidence?.sourcePathOrUrl).toContain("earendil-works/pi/releases/tag/v0.76.0");
  });
  it("records Gemini CLI 0.44.0 without splitting stable graph identity", () => {
    const version = getAgentVersion("gemini", "0.44.0");
    const graph = getCatalogGraphSnapshot();
    const node = graph.nodes.find((entry) => entry.id === "agentVersion:gemini:ge-0-43-0");

    expect(version?.versionRange).toBe(">=0.43.0");
    expect(node?.currentVersion).toBe("0.44.0");
    expect(node?.releaseNotesUrl).toContain("google-gemini/gemini-cli/releases/tag/v0.44.0");
    expect(node?.assimilationNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Auto modes were merged into a single Auto mode"),
        expect.stringContaining("Keychain auth now works for --list-sessions"),
        expect.stringContaining("agent-tui and tui-tester"),
      ]),
    );

    expect(graph.nodes.find((entry) => entry.id === "agentVersion:gemini:ge-0-44-0")).toBeUndefined();
    expect(
      listCliGraphEdges({
        fromNodeId: "agentVersion:gemini:ge-0-43-0",
        relation: "sourced_from",
      }).map((edge) => edge.toNodeId),
    ).toContain("evidence:gemini-cli-0-44-0-release");

    const evidence = getOntologyEvidenceSource("gemini-cli-0-44-0-release");
    expect(evidence?.sourcePathOrUrl).toContain("google-gemini/gemini-cli/releases/tag/v0.44.0");
  });

  it("includes agent-platform as a distinct non-harness runtime agent and records richer Claude web evidence", () => {
    const babysitterAgent = listAgentVersions().find((agent) => agent.agentId === "agent-platform");
    expect(babysitterAgent).toBeDefined();
    expect(babysitterAgent!.transportIds).toContain("terminal-cli");
    expect(babysitterAgent!.modalityIds).toContain("mcp");

    const evidenceIds = new Set(getOntologyEvidenceSnapshot().evidenceSources.map((entry) => entry.evidenceId));
    expect(evidenceIds.has("web-anthropic-claude-code-auto-mode")).toBe(true);
    expect(evidenceIds.has("web-anthropic-claude-code-sandboxing")).toBe(true);
    expect(evidenceIds.has("web-claude-code-hooks")).toBe(true);
    expect(evidenceIds.has("web-claude-code-mcp")).toBe(true);

    const graph = getCatalogGraphSnapshot();
    const runtimeHooks = graph.nodes.find((node) => node.id === "capabilitySupport:claude:ge-0-0-0:runtime-hooks");
    const toolApproval = graph.nodes.find((node) => node.id === "capabilitySupport:claude:ge-0-0-0:tool-approval");
    const sessionResume = graph.nodes.find((node) => node.id === "capabilitySupport:claude:ge-0-0-0:session-resume");

    expect(runtimeHooks?.evidenceRefs).toContain("web-claude-code-hooks");
    expect(toolApproval?.evidenceRefs).toContain("web-claude-code-permission-modes");
    expect(sessionResume?.evidenceRefs).toContain("web-claude-code-checkpointing");
  });

  it("records capability-specific external evidence for other agent vendors as well", () => {
    const evidenceIds = new Set(getOntologyEvidenceSnapshot().evidenceSources.map((entry) => entry.evidenceId));
    expect(evidenceIds.has("web-codex-hooks")).toBe(true);
    expect(evidenceIds.has("web-codex-0-134-release")).toBe(true);
    expect(evidenceIds.has("web-gemini-cli-session-management")).toBe(true);
    expect(evidenceIds.has("web-github-copilot-cli-hooks")).toBe(true);
    expect(evidenceIds.has("web-cursor-hooks")).toBe(true);
    expect(evidenceIds.has("web-opencode-plugins")).toBe(true);
    expect(evidenceIds.has("web-omp-session-resume")).toBe(true);

    const graph = getCatalogGraphSnapshot();
    const codexHooks = graph.nodes.find((node) => node.id === "capabilitySupport:codex:ge-0-119-0:runtime-hooks");
    const geminiResume = graph.nodes.find((node) => node.id === "capabilitySupport:gemini:ge-0-0-0:session-resume");
    const copilotMcp = graph.nodes.find((node) => node.id === "capabilitySupport:copilot:ge-0-0-0:mcp");
    const cursorHooks = graph.nodes.find((node) => node.id === "capabilitySupport:cursor:ge-0-0-0:runtime-hooks");
    const opencodeHooks = graph.nodes.find((node) => node.id === "capabilitySupport:opencode:ge-0-0-0:runtime-hooks");
    const ompResume = graph.nodes.find((node) => node.id === "capabilitySupport:omp:ge-0-0-0:session-resume");

    expect(codexHooks?.evidenceRefs).toContain("web-codex-hooks");
    expect(geminiResume?.evidenceRefs).toContain("web-gemini-cli-session-management");
    expect(copilotMcp?.evidenceRefs).toContain("web-github-copilot-cli-mcp");
    expect(cursorHooks?.evidenceRefs).toContain("web-cursor-hooks");
    expect(opencodeHooks?.evidenceRefs).toContain("web-opencode-plugins");
    expect(ompResume?.evidenceRefs).toContain("web-omp-session-resume");
  });

  it("summarizes external capability assertions by corroboration strength and unresolved gaps", () => {
    const graph = getCatalogGraphSnapshot();
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    const assertions = getCapabilitySupportAssertions();
    const externalAgentIds = new Set(["claude", "codex", "gemini", "copilot", "cursor", "opencode", "omp"]);
    const externalAssertions = assertions.filter((assertion) => {
      const subject = nodeById.get(assertion.subjectId);
      return subject?.kind === "AgentVersion" && externalAgentIds.has(String(subject.agentId));
    });

    expect(externalAssertions.length).toBeGreaterThan(20);

    for (const assertion of externalAssertions) {
      const vendorClaims = assertion.supportingClaims.filter((claim) => claim.provenanceKind !== "repo-observation");
      expect(assertion.hasVendorEvidence).toBe(true);
      expect(vendorClaims.length).toBeGreaterThan(0);

      if (assertion.evidenceStrength === "corroborated") {
        expect(
          vendorClaims.some((claim) => claim.evidenceStrength === "corroborated" && claim.evidenceIds.length >= 1),
        ).toBe(true);
      } else {
        expect(assertion.unresolvedGaps.length).toBeGreaterThan(0);
      }
    }

    const assertionsById = new Map(assertions.map((assertion) => [assertion.supportId, assertion]));
    expect(assertionsById.get("capabilitySupport:claude:ge-0-0-0:runtime-hooks")?.evidenceStrength).toBe("corroborated");
    expect(assertionsById.get("capabilitySupport:codex:ge-0-119-0:runtime-hooks")?.evidenceStrength).toBe("corroborated");
    expect(assertionsById.get("capabilitySupport:codex:ge-0-119-0:image-input")?.evidenceStrength).toBe("corroborated");
    expect(assertionsById.get("capabilitySupport:omp:ge-0-0-0:session-resume")?.evidenceStrength).toBe("partial");
    expect(assertionsById.get("capabilitySupport:omp:ge-0-0-0:session-resume")?.unresolvedGaps.length).toBeGreaterThan(0);
  });

  it("adds typed CLI graph traversal for node lookup, relations, and agent joins", () => {
    const codexNode = getCliNodeQuery("agentVersion:codex:ge-0-119-0");
    expect(codexNode).toBeDefined();
    expect(codexNode!.node.kind).toBe("AgentVersion");
    expect(codexNode!.outgoing.some((edge) => edge.relation === "defaults_to_model")).toBe(true);
    expect(codexNode!.outgoing.some((edge) => edge.relation === "uses_transport" && edge.relatedNodeId === "transport-runtime:terminal-cli")).toBe(true);
    expect(codexNode!.outgoing.some((edge) => edge.relation === "supports_modality" && edge.relatedNodeId === "modality:image")).toBe(true);
    expect(codexNode!.incoming.some((edge) => edge.relation === "has_version")).toBe(true);

    const codexAgentRows = listCliAgentRelations("codex");
    expect(codexAgentRows).toHaveLength(2);
    expect(codexAgentRows.find((row) => row.versionRange === ">=0.119.0")?.transportIds).toContain("terminal-cli");
    expect(codexAgentRows.find((row) => row.versionRange === ">=0.119.0")?.modalityIds).toContain("image");

    expect(listCliGraphNodes("AgentVersion").length).toBeGreaterThan(5);
    expect(listCliGraphEdges({ fromNodeId: "agentVersion:codex:ge-0-119-0", relation: "uses_transport" })).toHaveLength(4);
  });

  it("adds CLI evidence and capability-matrix queries with version-scoped support rows", () => {
    const codexHookSupport = listCliCapabilitySupport({
      capabilityId: "runtime-hooks",
      subjectIdPrefix: "agentVersion:codex:",
    });

    expect(codexHookSupport).toHaveLength(2);
    expect(codexHookSupport.map((row) => row.versionRange)).toContain(">=0.119.0");
    expect(codexHookSupport.map((row) => row.versionRange)).toContain(">=0.0.0 <0.119.0");
    expect(codexHookSupport.every((row) => row.claimIds.includes("web-codex-hooks"))).toBe(true);
    expect(codexHookSupport.every((row) => row.sourceIds.includes("web-codex-hooks"))).toBe(true);

    const supportClaims = listCliEvidenceClaims({
      nodeId: "capabilitySupport:codex:ge-0-119-0:runtime-hooks",
      evidenceId: "web-codex-hooks",
    });
    expect(supportClaims.map((claim) => claim.claimId)).toContain("web-codex-hooks");

    const supportSources = listCliEvidenceSources({
      nodeId: "capabilitySupport:codex:ge-0-119-0:runtime-hooks",
      claimId: "web-codex-hooks",
    });
    expect(supportSources.length).toBeGreaterThanOrEqual(1);
    expect(supportSources.some((source) => source.sourcePathOrUrl.includes("codex"))).toBe(true);
  });

  it("adds CLI package, process, and path relationship rows for discovery workflows", () => {
    const catalogPackage = listCliPackageRelations("@a5c-ai/catalog");
    expect(catalogPackage).toHaveLength(1);
    expect(catalogPackage[0].processIds).toContain("packages/catalog/process-library-catalog");
    expect(catalogPackage[0].paths).toContain("packages/catalog/src/app/api/agents");
    expect(catalogPackage[0].ciIds).toContain("@a5c-ai/catalog");
    expect(catalogPackage[0].graphIds).toContain("graph:agent-catalog");

    const catalogProcess = listCliProcessRelations("packages/catalog/process-library-catalog");
    expect(catalogProcess).toHaveLength(1);
    expect(catalogProcess[0].ownerPackageId).toBe("@a5c-ai/catalog");
    expect(catalogProcess[0].paths).toContain("packages/catalog/process-library-catalog.js");
    expect(catalogProcess[0].paths).toContain("packages/catalog/src/app");
    expect(catalogProcess[0].paths).toContain("packages/catalog/src/lib");
  });

  it("resolves version-scoped capability support by agent version", () => {
    const codexMatrices = listCapabilitySupportByAgentVersion("codex");
    expect(codexMatrices).toHaveLength(2);
    expect(codexMatrices.some((entry) => entry.agent.versionRange === ">=0.119.0" && entry.capabilitySupport.length > 0)).toBe(true);

    expect(getAgentVersion("codex", "0.118.0")?.versionRange).toBe(">=0.0.0 <0.119.0");
    expect(getAgentVersion("codex", "0.119.0")?.versionRange).toBe(">=0.119.0");
    expect(supportsAgentCapability("codex", "runtime-hooks", "0.119.0")).toBe(true);
    expect(supportsAgentCapability("codex", "mcp", "0.119.0")).toBe(false);
  });

  it("captures Codex 0.135.0 lifecycle, permissions, plugin discovery, goals, and websocket assimilation metadata", () => {
    const graph = getCatalogGraphSnapshot();
    const codexNode = graph.nodes.find((node) => node.id === "agentVersion:codex:ge-0-119-0");
    const adapterMetadata = codexNode?.adapterMetadata as { capabilityFlags?: Record<string, unknown> } | undefined;
    const flags = adapterMetadata?.capabilityFlags;

    expect(codexNode?.versionRange).toBe(">=0.119.0");
    expect(codexNode?.currentVersion).toBe("0.135.0");
    expect(codexNode?.releaseNotesUrl).toContain("rust-v0.135.0");
    expect(codexNode?.assimilationNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("codex doctor now reports richer environment"),
        expect.stringContaining("named permission profiles"),
        expect.stringContaining("dedicated SQLite database"),
      ]),
    );
    expect(flags?.supportsSkills).toBe(true);
    expect(flags?.supportsAgentsMd).toBe(true);
    expect(flags?.supportsPlugins).toBe(true);
    expect(codexNode?.remoteControl).toMatchObject({
      launchBehavior: "foreground-readiness",
      reportsMachineStatus: true,
    });
    expect(codexNode?.permissionProfiles).toMatchObject({
      listApi: true,
      inheritance: true,
      runtimeRefresh: true,
    });
    expect(codexNode?.pluginDiscovery).toMatchObject({
      marketplaceAwareListOutput: true,
      installedVersions: true,
      visibleMarketplaceRoots: true,
      remoteCollections: true,
    });
    expect(codexNode?.goals).toMatchObject({
      defaultEnabled: true,
      storage: "dedicated-goal-store",
    });
    expect(codexNode?.appServer).toMatchObject({
      realtimeV1WebsocketCompatible: true,
    });

    const codexWebsocketNode = graph.nodes.find((node) => node.id === "agent-version:codex-websocket@current");
    const codexAppServerNode = graph.nodes.find((node) => node.id === "agent-version:codex-app-server@current");

    expect(codexWebsocketNode?.currentVersion).toBe("0.135.0");
    expect(codexWebsocketNode?.appServer).toMatchObject({
      realtimeV1WebsocketCompatible: true,
      smokeTestedCommand: "npx -y @openai/codex@0.135.0 app-server --help",
    });
    expect(codexAppServerNode?.currentVersion).toBe("0.135.0");
    expect(codexAppServerNode?.appServer).toMatchObject({
      realtimeV1WebsocketCompatible: true,
    });

    const releaseClaim = listClaimsForSubject("agentVersion:codex:ge-0-119-0").find(
      (claim) => claim.claimId === "web-codex-0-135-release",
    );
    expect(releaseClaim?.evidenceIds).toContain("web-codex-0-135-release");
  });

  it("traverses provider, model, transport, modality, lifecycle, and session relationships for an agent version", () => {
    const topology = getAgentVersionTopology("codex", "0.119.0");
    expect(topology).toBeDefined();
    expect(topology!.providers.map((provider) => provider.providerId)).toContain("openai");
    expect(topology!.defaultModels.map((model) => model.modelId)).toContain("codex-default");
    expect(topology!.transportRuntimes.map((transport) => transport.transportId)).toContain("terminal-cli");
    expect(topology!.transportProtocols.map((transport) => transport.transportId)).toContain("shell-hook-runtime");
    expect(topology!.modalities.map((modality) => modality.modalityId)).toContain("image");
    expect(topology!.sessionSemantics.map((nuance) => nuance.nuanceId)).toContain("session-semantics:codex");
    expect(topology!.lifecycleSemantics.map((nuance) => nuance.versionRange)).toContain(">=0.119.0");
    expect(topology!.discoverySignals.map((signal) => signal.key)).toContain("codex");
    expect(topology!.pluginTargets.map((target) => target.targetId)).toContain("codex");
  });

  it("traverses provider-model relationships without rebuilding joins downstream", () => {
    const openai = getProviderModelTopology("openai");
    expect(openai).toBeDefined();
    expect(openai!.models.map((model) => model.modelId)).toContain("codex-default");
    expect(openai!.capabilities.map((capability) => capability.capabilityId)).toContain("tool-calling");
    expect(openai!.agents.map((agent) => agent.agentId)).toContain("codex");
  });

  it("exposes package, process, and path discovery helpers", () => {
    expect(listPackageSurfaces().map((pkg) => pkg.packageId)).toContain("@a5c-ai/catalog");
    expect(listPackageSurfaces().map((pkg) => pkg.packageId)).toContain("@a5c-ai/agent-catalog");

    const agentCatalogTopology = getPackageTopology("@a5c-ai/agent-catalog");
    expect(agentCatalogTopology).toBeDefined();
    expect(agentCatalogTopology!.ciSurfaces).toHaveLength(1);
    expect(agentCatalogTopology!.ciSurfaces[0].publishStrategy).toBe("internal-workspace");
    expect(agentCatalogTopology!.ciSurfaces[0].releaseChannels).toEqual(["ci"]);
    expect(agentCatalogTopology!.ciSurfaces[0].validationCommands).toContain(
      "npm run ci:test --workspace=@a5c-ai/agent-catalog",
    );

    const topology = getPackageTopology("@a5c-ai/catalog");
    expect(topology).toBeDefined();
    expect(topology!.processes.map((process) => process.processId)).toContain("packages/catalog/process-library-catalog");
    expect(topology!.processPaths.map((entry) => entry.path)).toContain("packages/catalog/src/app");
    expect(topology!.wrapsGraphIds).toContain("graph:agent-catalog");

    expect(getPathDescriptor("packages/catalog/src/app")?.ownerId).toBe("process:packages/catalog/process-library-catalog");
    expect(findProcessesByPath("packages/catalog/src/app").map((process) => process.processId)).toContain(
      "packages/catalog/process-library-catalog",
    );
  });

  it("exposes targeted provenance and evidence helpers without full-snapshot callers", () => {
    expect(getOntologyEvidenceSource("repo-sdk-fallback")?.sourcePathOrUrl).toContain("packages/sdk/src/harness");
    expect(getOntologyClaim("repo-sdk-fallback")?.statement).toContain("fallback metadata");

    const subjectId = "agentVersion:codex:ge-0-119-0";
    expect(listClaimsForSubject(subjectId).length).toBeGreaterThanOrEqual(5);
    expect(listEvidenceForSubject(subjectId).map((entry) => entry.evidenceId)).toContain("repo-sdk-fallback");
    expect(getSubjectProvenance(subjectId).claims.length).toBeGreaterThanOrEqual(5);

    const search = searchOntologyEvidence("web-codex-hooks");
    expect(search.evidence.map((entry) => entry.evidenceId)).toContain("web-codex-hooks");
    expect(search.claims.some((entry) => entry.claimId === "web-codex-hooks")).toBe(true);
  });

  it("keeps graph-backed evidence exports aligned with dedicated evidence helpers", () => {
    expect(AGENT_CATALOG.evidence).toHaveLength(getOntologyEvidenceSnapshot().evidenceSources.length);

    for (const evidence of AGENT_CATALOG.evidence) {
      expect(getOntologyEvidenceSource(evidence.evidenceId)).toEqual(evidence);
    }
  });

  it("downgrades transport-mux document claims and runtime capability surfacing when the cutover gate is red", async () => {
    const previousOverride = process.env.A5C_AGENT_CATALOG_TRANSPORT_MUX_CUTOVER;
    process.env.A5C_AGENT_CATALOG_TRANSPORT_MUX_CUTOVER = "red";
    vi.resetModules();

    try {
      const catalog = await import("./index");
      const transportMuxClaim = catalog.listOntologyClaims().find((claim) => claim.claimId === "repo-transport-mux-readme");
      const amuxProxyAssertions = catalog
        .getCapabilitySupportAssertions()
        .filter((assertion) => assertion.subjectId === "transportRuntime:amux-proxy");

      expect(transportMuxClaim?.status).toBe("provisional");
      expect(transportMuxClaim?.unresolvedGaps).toContain(
        "transport-mux document-backed runtime claims stay provisional until packages/transport-mux scorecard:migration is green.",
      );
      expect(amuxProxyAssertions).toHaveLength(0);
    } finally {
      if (previousOverride === undefined) {
        delete process.env.A5C_AGENT_CATALOG_TRANSPORT_MUX_CUTOVER;
      } else {
        process.env.A5C_AGENT_CATALOG_TRANSPORT_MUX_CUTOVER = previousOverride;
      }
      vi.resetModules();
    }
  });
});
