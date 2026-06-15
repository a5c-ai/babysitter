import { randomUUID } from "node:crypto";
import { dump } from "js-yaml";
import type { AtlasRecord } from "@a5c-ai/atlas";
import { execute, isDatabaseConfigured, queryRow, queryRows } from "./db";
import { getAtlasViewForUser } from "./atlas-view";
import { getLocalDevelopmentSqlite } from "./local-dev-sqlite";

export const COMPANY_STACK_LAYERS = [
  { key: "layer:1-model", label: "Model", kind: "stack-layer", position: 1, atlasKinds: ["ModelFamily", "ModelVersion", "SessionModel"] },
  { key: "layer:2-provider", label: "Provider", kind: "stack-layer", position: 2, atlasKinds: ["Provider", "ModelProviderProduct", "ModelProviderVersion"] },
  { key: "layer:3-transport", label: "Transport", kind: "stack-layer", position: 3, atlasKinds: ["TransportProtocol", "ModelTransportProtocol", "ProtocolMessage", "JournalEvent"] },
  { key: "layer:4-agent-core", label: "Agent Core", kind: "stack-layer", position: 4, atlasKinds: ["AgentCoreImpl", "Capability", "CapabilitySupport"] },
  { key: "layer:5-agent-runtime", label: "Agent Runtime", kind: "stack-layer", position: 5, atlasKinds: ["AgentProduct", "AgentRuntimeImpl", "AgentVersion", "Subagent"] },
  { key: "layer:6-agent-platform", label: "Agent Platform", kind: "stack-layer", position: 6, atlasKinds: ["AgentPlatformImpl", "Platform", "PlatformService"] },
  { key: "layer:7-workspace", label: "Workspace", kind: "stack-layer", position: 7, atlasKinds: ["Workspace", "Project", "SharedContextSpec"] },
  { key: "layer:8-execution", label: "Execution", kind: "stack-layer", position: 8, atlasKinds: ["Workflow", "LibraryProcess", "Phase", "HookSurface", "HookMapping"] },
  { key: "layer:9-sandbox", label: "Sandbox", kind: "stack-layer", position: 9, atlasKinds: ["PermissionMode", "DeploymentTarget"] },
  {
    key: "layer:10-interaction",
    label: "Interaction",
    kind: "stack-layer",
    position: 10,
    atlasKinds: ["InteractionPrimitive", "Tool", "ToolDescriptor", "ToolServer", "PluginArtifact", "MCPPrompt", "MCPResource"],
  },
  { key: "layer:11-presentation", label: "Presentation", kind: "stack-layer", position: 11, atlasKinds: ["AgentUIImpl", "Page", "APIEndpoint", "Presentation"] },
] as const;

export const COMPANY_COMPOSITION_FACETS = [
  { key: "facet:roles-and-teams", label: "Roles and Teams", kind: "composition-facet", atlasKinds: ["Role", "Responsibility", "OrgUnit", "AgentTeam"] },
  { key: "facet:skills-and-capabilities", label: "Skills and Capabilities", kind: "composition-facet", atlasKinds: ["Skill", "LibrarySkill", "SkillArea", "Capability"] },
  { key: "facet:evaluation-and-governance", label: "Evaluation and Governance", kind: "composition-facet", atlasKinds: ["Benchmark", "TestSet", "EvalRun", "EvalResult", "ScopeBoundary"] },
  {
    key: "facet:environment-and-data",
    label: "Environment and Data",
    kind: "composition-facet",
    atlasKinds: ["StackPart", "VectorStore", "MemoryStore", "KnowledgeBase", "Dataset", "PlatformService", "DeploymentTarget", "EnvVar"],
  },
] as const;

export const COMPANY_LAYER_DEFS = [...COMPANY_STACK_LAYERS, ...COMPANY_COMPOSITION_FACETS] as const;

export type CompanyLayerKey = (typeof COMPANY_LAYER_DEFS)[number]["key"];

export type CompanyLayerBindingDraft = {
  id: string;
  primaryLayerId: CompanyLayerKey;
  atlasRecordId: string;
  selectionRole: string;
  rationale: string;
  coverageLayerIds: CompanyLayerKey[];
  importance: "primary" | "supporting";
};

export type CompanySystemDraft = {
  id: string;
  displayName: string;
  description: string;
  systemKind: string;
  outcome: string;
  lifecycleStage: string;
  layerBindings: CompanyLayerBindingDraft[];
};

export type CompanyEnvironmentResourceDraft = {
  id: string;
  displayName: string;
  resourceClass: string;
  provider: string;
  environment: string;
  atlasRecordId: string;
  externalId: string;
  notes: string;
};

export type CompanyResourceBindingDraft = {
  id: string;
  systemId: string;
  resourceId: string;
  bindingKind: string;
  environmentStage: string;
  criticality: string;
  notes: string;
};

export type CompanyIntegrationDraft = {
  id: string;
  sourceType: "system" | "resource";
  sourceId: string;
  targetType: "system" | "resource";
  targetId: string;
  integrationKind: string;
  triggerKind: string;
  interfaceKind: string;
  direction: string;
  notes: string;
};

export type CompanyTeamCellDraft = {
  id: string;
  displayName: string;
  teamKind: string;
  scope: string;
  notes: string;
};

export type CompanyRoleAssignmentDraft = {
  id: string;
  subjectType: "system" | "team-cell";
  subjectId: string;
  atlasRecordId: string;
  assignmentKind: string;
  notes: string;
};

export type CompanyBlueprintDraft = {
  company: {
    displayName: string;
    description: string;
    slug: string;
    status: string;
  };
  systems: CompanySystemDraft[];
  resources: CompanyEnvironmentResourceDraft[];
  resourceBindings: CompanyResourceBindingDraft[];
  integrations: CompanyIntegrationDraft[];
  teamCells: CompanyTeamCellDraft[];
  roleAssignments: CompanyRoleAssignmentDraft[];
};

export type CompanyBlueprintSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyBlueprint = CompanyBlueprintSummary & {
  draft: CompanyBlueprintDraft;
  lastExportYaml: string | null;
};

type BlueprintRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  draft_json: CompanyBlueprintDraft | null;
  last_export_yaml: string | null;
  created_at: string;
  updated_at: string;
};

type LegacyCompanyBlueprintDraft = {
  company?: { displayName?: string; description?: string; slug?: string; status?: string };
  systems?: Array<{
    id: string;
    displayName: string;
    description: string;
    systemKind: string;
    selections?: Array<{
      id: string;
      layerKey: string;
      atlasRecordId: string;
      selectionRole: string;
      notes: string;
      coversLayers?: string[];
    }>;
    assetIds?: string[];
  }>;
  assets?: Array<{
    id: string;
    displayName: string;
    assetKind: string;
    environment: string;
    provider: string;
    notes: string;
  }>;
  integrations?: Array<{
    id: string;
    fromSystemId: string;
    toType: "system" | "asset";
    toId: string;
    integrationKind: string;
    triggerKind: string;
    notes: string;
  }>;
};

export type LayerOption = {
  id: string;
  label: string;
  kind: string;
  description: string;
};

export type CompanyLayerPalette = {
  key: CompanyLayerKey;
  label: string;
  kind: "stack-layer" | "composition-facet";
  options: LayerOption[];
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || `company-${Date.now()}`;
}

function localBlueprintRowFromSql(row: Record<string, unknown>): BlueprintRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description == null ? null : String(row.description),
    status: String(row.status),
    draft_json: typeof row.draft_json === "string" && row.draft_json.length > 0 ? (JSON.parse(row.draft_json) as CompanyBlueprintDraft) : null,
    last_export_yaml: row.last_export_yaml == null ? null : String(row.last_export_yaml),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function localBlueprintDb() {
  return getLocalDevelopmentSqlite();
}

async function listLocalBlueprintRows(userId: string): Promise<BlueprintRow[]> {
  const rows = localBlueprintDb()
    .prepare(`
      SELECT id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at
      FROM atlas_company_blueprints_local
      WHERE user_id = ?
      ORDER BY updated_at DESC, created_at DESC
    `)
    .all(userId);
  return rows.map(localBlueprintRowFromSql);
}

async function getLocalBlueprintRow(userId: string, blueprintId: string): Promise<BlueprintRow | null> {
  const row = localBlueprintDb()
    .prepare(`
      SELECT id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at
      FROM atlas_company_blueprints_local
      WHERE user_id = ? AND id = ?
    `)
    .get(userId, blueprintId);
  return row ? localBlueprintRowFromSql(row) : null;
}

async function createLocalBlueprintRow(userId: string, row: BlueprintRow): Promise<void> {
  localBlueprintDb()
    .prepare(`
      INSERT INTO atlas_company_blueprints_local
        (id, user_id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      row.id,
      userId,
      row.slug,
      row.name,
      row.description,
      row.status,
      row.draft_json ? JSON.stringify(row.draft_json) : null,
      row.last_export_yaml,
      row.created_at,
      row.updated_at,
    );
}

async function updateLocalBlueprintRow(
  userId: string,
  blueprintId: string,
  mutate: (row: BlueprintRow) => BlueprintRow,
): Promise<BlueprintRow> {
  const currentRow = await getLocalBlueprintRow(userId, blueprintId);
  if (!currentRow) {
    throw new Error("Blueprint not found.");
  }
  const nextRow = mutate(currentRow);
  localBlueprintDb()
    .prepare(`
      UPDATE atlas_company_blueprints_local
      SET slug = ?, name = ?, description = ?, status = ?, draft_json = ?, last_export_yaml = ?, updated_at = ?
      WHERE user_id = ? AND id = ?
    `)
    .run(
      nextRow.slug,
      nextRow.name,
      nextRow.description,
      nextRow.status,
      nextRow.draft_json ? JSON.stringify(nextRow.draft_json) : null,
      nextRow.last_export_yaml,
      nextRow.updated_at,
      userId,
      blueprintId,
    );
  return nextRow;
}

async function deleteLocalBlueprintRow(userId: string, blueprintId: string): Promise<void> {
  localBlueprintDb()
    .prepare(`
      DELETE FROM atlas_company_blueprints_local
      WHERE user_id = ? AND id = ?
    `)
    .run(userId, blueprintId);
}

function createEmptyDraft(summary: Pick<BlueprintRow, "slug" | "name" | "description" | "status">): CompanyBlueprintDraft {
  return {
    company: {
      displayName: summary.name,
      description: summary.description ?? "",
      slug: summary.slug,
      status: summary.status ?? "draft",
    },
    systems: [],
    resources: [],
    resourceBindings: [],
    integrations: [],
    teamCells: [],
    roleAssignments: [],
  };
}

function isCompanyLayerKey(value: string): value is CompanyLayerKey {
  return COMPANY_LAYER_DEFS.some((entry) => entry.key === value);
}

function uniqueLayerCoverage(primary: CompanyLayerKey, rawCoverage: string[] | undefined): CompanyLayerKey[] {
  const values = new Set<CompanyLayerKey>([primary]);
  for (const item of rawCoverage ?? []) {
    if (isCompanyLayerKey(item)) {
      values.add(item);
    }
  }
  return Array.from(values);
}

function migrateLegacyDraft(
  summary: Pick<BlueprintRow, "slug" | "name" | "description" | "status" | "draft_json">,
  rawDraft: LegacyCompanyBlueprintDraft,
): CompanyBlueprintDraft {
  const nextDraft = createEmptyDraft(summary);
  nextDraft.company = {
    displayName: rawDraft.company?.displayName ?? summary.name,
    description: rawDraft.company?.description ?? summary.description ?? "",
    slug: rawDraft.company?.slug ?? summary.slug,
    status: rawDraft.company?.status ?? summary.status ?? "draft",
  };

  nextDraft.systems = (rawDraft.systems ?? []).map((system) => ({
    id: system.id,
    displayName: system.displayName,
    description: system.description ?? "",
    systemKind: system.systemKind ?? "system",
    outcome: "",
    lifecycleStage: "draft",
    layerBindings: (system.selections ?? []).map((selection) => {
      const primaryLayerId = isCompanyLayerKey(selection.layerKey) ? selection.layerKey : "facet:skills-and-capabilities";
      return {
        id: selection.id,
        primaryLayerId,
        atlasRecordId: selection.atlasRecordId,
        selectionRole: selection.selectionRole ?? "",
        rationale: selection.notes ?? "",
        coverageLayerIds: uniqueLayerCoverage(primaryLayerId, selection.coversLayers),
        importance: "primary" as const,
      };
    }),
  }));

  nextDraft.resources = (rawDraft.assets ?? []).map((asset) => ({
    id: asset.id,
    displayName: asset.displayName,
    resourceClass: asset.assetKind,
    provider: asset.provider ?? "",
    environment: asset.environment ?? "",
    atlasRecordId: "",
    externalId: "",
    notes: asset.notes ?? "",
  }));

  nextDraft.resourceBindings = (rawDraft.systems ?? []).flatMap((system) =>
    (system.assetIds ?? []).map((assetId) => ({
      id: `company-resource-binding:${randomUUID().slice(0, 8)}`,
      systemId: system.id,
      resourceId: assetId,
      bindingKind: "uses",
      environmentStage: "",
      criticality: "",
      notes: "",
    })),
  );

  nextDraft.integrations = (rawDraft.integrations ?? []).map((integration) => ({
    id: integration.id,
    sourceType: "system" as const,
    sourceId: integration.fromSystemId,
    targetType: integration.toType === "asset" ? ("resource" as const) : ("system" as const),
    targetId: integration.toId,
    integrationKind: integration.integrationKind,
    triggerKind: integration.triggerKind ?? "",
    interfaceKind: "",
    direction: "outbound",
    notes: integration.notes ?? "",
  }));

  return nextDraft;
}

function normalizeDraft(summary: Pick<BlueprintRow, "slug" | "name" | "description" | "status" | "draft_json">): CompanyBlueprintDraft {
  if (!summary.draft_json) {
    return createEmptyDraft(summary);
  }

  const rawDraft = summary.draft_json as unknown as Record<string, unknown>;
  if (Array.isArray(rawDraft.resources) || Array.isArray(rawDraft.resourceBindings)) {
    const draft = summary.draft_json as CompanyBlueprintDraft;
    return {
      company: {
        displayName: draft.company?.displayName ?? summary.name,
        description: draft.company?.description ?? summary.description ?? "",
        slug: draft.company?.slug ?? summary.slug,
        status: draft.company?.status ?? summary.status ?? "draft",
      },
      systems: Array.isArray(draft.systems) ? draft.systems : [],
      resources: Array.isArray(draft.resources) ? draft.resources : [],
      resourceBindings: Array.isArray(draft.resourceBindings) ? draft.resourceBindings : [],
      integrations: Array.isArray(draft.integrations) ? draft.integrations : [],
      teamCells: Array.isArray(draft.teamCells) ? draft.teamCells : [],
      roleAssignments: Array.isArray(draft.roleAssignments) ? draft.roleAssignments : [],
    };
  }

  return migrateLegacyDraft(summary, summary.draft_json as unknown as LegacyCompanyBlueprintDraft);
}

function toSummary(row: BlueprintRow): CompanyBlueprintSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBlueprint(row: BlueprintRow): CompanyBlueprint {
  return {
    ...toSummary(row),
    draft: normalizeDraft(row),
    lastExportYaml: row.last_export_yaml,
  };
}

function recordLabel(record: AtlasRecord): string {
  return String(record.displayName ?? record.title ?? record.id);
}

function recordDescription(record: AtlasRecord): string {
  return typeof record.description === "string" ? record.description : "";
}

async function updateBlueprintDraft(
  userId: string,
  blueprintId: string,
  mutate: (draft: CompanyBlueprintDraft, row: BlueprintRow) => CompanyBlueprintDraft,
) {
  if (!isDatabaseConfigured()) {
    await updateLocalBlueprintRow(userId, blueprintId, (row) => {
      const nextDraft = mutate(normalizeDraft(row), row);
      return {
        ...row,
        slug: nextDraft.company.slug,
        name: nextDraft.company.displayName,
        description: nextDraft.company.description || null,
        status: nextDraft.company.status,
        draft_json: nextDraft,
        updated_at: new Date().toISOString(),
      };
    });
    return;
  }

  const row = await queryRow<BlueprintRow>(
    `SELECT id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at
       FROM atlas_company_blueprints
      WHERE user_id = $1 AND id = $2`,
    [userId, blueprintId],
  );
  if (!row) {
    throw new Error("Blueprint not found.");
  }

  const nextDraft = mutate(normalizeDraft(row), row);
  await execute(
    `UPDATE atlas_company_blueprints
        SET name = $3,
            description = $4,
            status = $5,
            draft_json = $6::jsonb,
            updated_at = NOW()
      WHERE user_id = $1 AND id = $2`,
    [userId, blueprintId, nextDraft.company.displayName, nextDraft.company.description || null, nextDraft.company.status, JSON.stringify(nextDraft)],
  );
}

export async function listCompanyBlueprints(userId: string): Promise<CompanyBlueprintSummary[]> {
  if (!isDatabaseConfigured()) {
    return (await listLocalBlueprintRows(userId)).map(toSummary);
  }

  const rows = await queryRows<BlueprintRow>(
    `SELECT id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at
       FROM atlas_company_blueprints
      WHERE user_id = $1
      ORDER BY updated_at DESC, created_at DESC`,
    [userId],
  );
  return rows.map(toSummary);
}

export async function getCompanyBlueprint(userId: string, blueprintId: string): Promise<CompanyBlueprint | null> {
  if (!isDatabaseConfigured()) {
    const row = await getLocalBlueprintRow(userId, blueprintId);
    return row ? toBlueprint(row) : null;
  }

  const row = await queryRow<BlueprintRow>(
    `SELECT id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at
       FROM atlas_company_blueprints
      WHERE user_id = $1 AND id = $2`,
    [userId, blueprintId],
  );
  return row ? toBlueprint(row) : null;
}

export async function createCompanyBlueprint(
  userId: string,
  input: { name: string; description?: string },
): Promise<CompanyBlueprintSummary> {
  const id = randomUUID();
  const slug = slugify(input.name);
  const now = new Date().toISOString();
  const draft = createEmptyDraft({ slug, name: input.name, description: input.description ?? null, status: "draft" });

  if (!isDatabaseConfigured()) {
    const row: BlueprintRow = {
      id,
      slug,
      name: input.name,
      description: input.description ?? null,
      status: "draft",
      draft_json: draft,
      last_export_yaml: null,
      created_at: now,
      updated_at: now,
    };
    await createLocalBlueprintRow(userId, row);
    return toSummary(row);
  }

  await execute(
    `INSERT INTO atlas_company_blueprints
      (id, user_id, slug, name, description, status, draft_json)
     VALUES
      ($1, $2, $3, $4, $5, 'draft', $6::jsonb)`,
    [id, userId, slug, input.name, input.description ?? null, JSON.stringify(draft)],
  );

  const row = await queryRow<BlueprintRow>(
    `SELECT id, slug, name, description, status, draft_json, last_export_yaml, created_at, updated_at
       FROM atlas_company_blueprints
      WHERE id = $1`,
    [id],
  );
  if (!row) {
    throw new Error("Failed to create company blueprint.");
  }
  return toSummary(row);
}

export async function saveCompanyBlueprintMetadata(
  userId: string,
  blueprintId: string,
  input: { displayName: string; description: string; status: string },
) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    company: {
      ...draft.company,
      displayName: input.displayName,
      description: input.description,
      status: input.status || "draft",
      slug: slugify(input.displayName),
    },
  }));
}

export async function addCompanySystem(
  userId: string,
  blueprintId: string,
  input: { displayName: string; description: string; systemKind: string; outcome?: string; lifecycleStage?: string },
) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: [
      ...draft.systems,
      {
        id: `company-system:${slugify(input.displayName)}-${randomUUID().slice(0, 8)}`,
        displayName: input.displayName,
        description: input.description,
        systemKind: input.systemKind,
        outcome: input.outcome ?? "",
        lifecycleStage: input.lifecycleStage ?? "draft",
        layerBindings: [],
      },
    ],
  }));
}

export async function addCompanyResource(
  userId: string,
  blueprintId: string,
  input: {
    displayName: string;
    resourceClass: string;
    provider: string;
    environment: string;
    atlasRecordId: string;
    externalId: string;
    notes: string;
  },
) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    resources: [
      ...draft.resources,
      {
        id: `company-resource:${slugify(input.displayName)}-${randomUUID().slice(0, 8)}`,
        displayName: input.displayName,
        resourceClass: input.resourceClass,
        provider: input.provider,
        environment: input.environment,
        atlasRecordId: input.atlasRecordId,
        externalId: input.externalId,
        notes: input.notes,
      },
    ],
  }));
}

export async function addCompanyLayerBinding(
  userId: string,
  blueprintId: string,
  input: {
    systemId: string;
    primaryLayerId: CompanyLayerKey;
    atlasRecordId: string;
    selectionRole: string;
    rationale: string;
    coverageLayerIds: CompanyLayerKey[];
    importance?: "primary" | "supporting";
  },
) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.map((system) => {
      if (system.id !== input.systemId) {
        return system;
      }
      const baseBindings =
        input.importance === "primary"
          ? system.layerBindings.filter((binding) => binding.primaryLayerId !== input.primaryLayerId)
          : system.layerBindings;
      return {
        ...system,
        layerBindings: [
          ...baseBindings,
          {
            id: `company-layer-binding:${slugify(`${system.displayName}-${input.primaryLayerId}`)}-${randomUUID().slice(0, 8)}`,
            primaryLayerId: input.primaryLayerId,
            atlasRecordId: input.atlasRecordId,
            selectionRole: input.selectionRole,
            rationale: input.rationale,
            coverageLayerIds: uniqueLayerCoverage(input.primaryLayerId, input.coverageLayerIds),
            importance: input.importance ?? "primary",
          },
        ],
      };
    }),
  }));
}

export async function addCompanyResourceBinding(
  userId: string,
  blueprintId: string,
  input: { systemId: string; resourceId: string; bindingKind: string; environmentStage: string; criticality: string; notes: string },
) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => {
    const exists = draft.resourceBindings.some(
      (binding) => binding.systemId === input.systemId && binding.resourceId === input.resourceId && binding.bindingKind === input.bindingKind,
    );
    if (exists) {
      return draft;
    }
    return {
      ...draft,
      resourceBindings: [
        ...draft.resourceBindings,
        {
          id: `company-resource-binding:${slugify(`${input.bindingKind}-${input.resourceId}`)}-${randomUUID().slice(0, 8)}`,
          systemId: input.systemId,
          resourceId: input.resourceId,
          bindingKind: input.bindingKind,
          environmentStage: input.environmentStage,
          criticality: input.criticality,
          notes: input.notes,
        },
      ],
    };
  });
}

export async function addCompanyIntegration(
  userId: string,
  blueprintId: string,
  input: {
    sourceType: "system" | "resource";
    sourceId: string;
    targetType: "system" | "resource";
    targetId: string;
    integrationKind: string;
    triggerKind: string;
    interfaceKind: string;
    direction: string;
    notes: string;
  },
) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    integrations: [
      ...draft.integrations,
      {
        id: `company-integration:${slugify(input.integrationKind || "link")}-${randomUUID().slice(0, 8)}`,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        targetType: input.targetType,
        targetId: input.targetId,
        integrationKind: input.integrationKind,
        triggerKind: input.triggerKind,
        interfaceKind: input.interfaceKind,
        direction: input.direction,
        notes: input.notes,
      },
    ],
  }));
}

export async function deleteCompanyBlueprint(userId: string, blueprintId: string) {
  if (!isDatabaseConfigured()) {
    await deleteLocalBlueprintRow(userId, blueprintId);
    return;
  }

  await execute(
    `DELETE FROM atlas_company_blueprints
      WHERE user_id = $1 AND id = $2`,
    [userId, blueprintId],
  );
}

export async function deleteCompanySystem(userId: string, blueprintId: string, systemId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.filter((system) => system.id !== systemId),
    resourceBindings: draft.resourceBindings.filter((binding) => binding.systemId !== systemId),
    integrations: draft.integrations.filter(
      (integration) =>
        !(integration.sourceType === "system" && integration.sourceId === systemId) &&
        !(integration.targetType === "system" && integration.targetId === systemId),
    ),
    roleAssignments: draft.roleAssignments.filter(
      (assignment) => !(assignment.subjectType === "system" && assignment.subjectId === systemId),
    ),
  }));
}

export async function deleteCompanyResource(userId: string, blueprintId: string, resourceId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    resources: draft.resources.filter((resource) => resource.id !== resourceId),
    resourceBindings: draft.resourceBindings.filter((binding) => binding.resourceId !== resourceId),
    integrations: draft.integrations.filter(
      (integration) =>
        !(integration.sourceType === "resource" && integration.sourceId === resourceId) &&
        !(integration.targetType === "resource" && integration.targetId === resourceId),
    ),
  }));
}

export async function deleteCompanyLayerBinding(userId: string, blueprintId: string, systemId: string, bindingId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.map((system) =>
      system.id !== systemId
        ? system
        : {
            ...system,
            layerBindings: system.layerBindings.filter((binding) => binding.id !== bindingId),
          },
    ),
  }));
}

export async function deleteCompanyResourceBinding(userId: string, blueprintId: string, bindingId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    resourceBindings: draft.resourceBindings.filter((binding) => binding.id !== bindingId),
  }));
}

export async function deleteCompanyIntegration(userId: string, blueprintId: string, integrationId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    integrations: draft.integrations.filter((integration) => integration.id !== integrationId),
  }));
}

export async function addCompanyAsset(
  userId: string,
  blueprintId: string,
  input: { displayName: string; assetKind: string; environment: string; provider: string; notes: string },
) {
  await addCompanyResource(userId, blueprintId, {
    displayName: input.displayName,
    resourceClass: input.assetKind,
    environment: input.environment,
    provider: input.provider,
    atlasRecordId: "",
    externalId: "",
    notes: input.notes,
  });
}

export async function addCompanySelection(
  userId: string,
  blueprintId: string,
  input: { systemId: string; layerKey: CompanyLayerKey; atlasRecordId: string; selectionRole: string; notes: string; coversLayers: string[] },
) {
  await addCompanyLayerBinding(userId, blueprintId, {
    systemId: input.systemId,
    primaryLayerId: input.layerKey,
    atlasRecordId: input.atlasRecordId,
    selectionRole: input.selectionRole,
    rationale: input.notes,
    coverageLayerIds: input.coversLayers.filter(isCompanyLayerKey),
  });
}

export async function attachAssetToSystem(userId: string, blueprintId: string, input: { systemId: string; assetId: string }) {
  await addCompanyResourceBinding(userId, blueprintId, {
    systemId: input.systemId,
    resourceId: input.assetId,
    bindingKind: "uses",
    environmentStage: "",
    criticality: "",
    notes: "",
  });
}

export async function removeAssetFromSystem(userId: string, blueprintId: string, systemId: string, assetId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    resourceBindings: draft.resourceBindings.filter((binding) => !(binding.systemId === systemId && binding.resourceId === assetId)),
  }));
}

function buildYamlDocuments(blueprint: CompanyBlueprintDraft): string {
  const docs: Array<Record<string, unknown>> = [];
  const graphId = `company-graph:${blueprint.company.slug}`;

  docs.push({
    nodeKind: "CompanyGraph",
    id: graphId,
    attributes: {
      displayName: blueprint.company.displayName,
      description: blueprint.company.description,
      status: blueprint.company.status,
      slug: blueprint.company.slug,
    },
    edges: {
      contains_system: blueprint.systems.map((system) => system.id),
      contains_resource: blueprint.resources.map((resource) => resource.id),
      contains_team_cell: blueprint.teamCells.map((team) => team.id),
    },
  });

  for (const system of blueprint.systems) {
    docs.push({
      nodeKind: "CompanySystem",
      id: system.id,
      attributes: {
        displayName: system.displayName,
        description: system.description,
        systemKind: system.systemKind,
        outcome: system.outcome,
        lifecycleStage: system.lifecycleStage,
      },
      edges: {
        has_layer_binding: system.layerBindings.map((binding) => binding.id),
      },
    });

    for (const binding of system.layerBindings) {
      docs.push({
        nodeKind: "CompanyLayerBinding",
        id: binding.id,
        attributes: {
          primaryLayerId: binding.primaryLayerId,
          selectionRole: binding.selectionRole,
          coverageLayerIds: binding.coverageLayerIds,
          rationale: binding.rationale,
          importance: binding.importance,
        },
        edges: {
          references_atlas_entity: [binding.atlasRecordId],
          covers_layer: binding.coverageLayerIds,
        },
      });
    }
  }

  for (const resource of blueprint.resources) {
    docs.push({
      nodeKind: "CompanyEnvironmentResource",
      id: resource.id,
      attributes: {
        displayName: resource.displayName,
        resourceClass: resource.resourceClass,
        provider: resource.provider,
        environment: resource.environment,
        externalId: resource.externalId,
        notes: resource.notes,
      },
      edges: resource.atlasRecordId ? { reflects_atlas_entity: [resource.atlasRecordId] } : {},
    });
  }

  for (const binding of blueprint.resourceBindings) {
    docs.push({
      nodeKind: "CompanyResourceBinding",
      id: binding.id,
      attributes: {
        bindingKind: binding.bindingKind,
        environmentStage: binding.environmentStage,
        criticality: binding.criticality,
        notes: binding.notes,
      },
      edges: {
        bound_from_system: [binding.systemId],
        binds_resource: [binding.resourceId],
      },
    });
  }

  for (const integration of blueprint.integrations) {
    docs.push({
      nodeKind: "CompanyIntegration",
      id: integration.id,
      attributes: {
        integrationKind: integration.integrationKind,
        triggerKind: integration.triggerKind,
        interfaceKind: integration.interfaceKind,
        direction: integration.direction,
        notes: integration.notes,
      },
      edges: {
        integrates_from: [integration.sourceId],
        integrates_to: [integration.targetId],
      },
    });
  }

  for (const team of blueprint.teamCells) {
    docs.push({
      nodeKind: "CompanyTeamCell",
      id: team.id,
      attributes: {
        displayName: team.displayName,
        teamKind: team.teamKind,
        scope: team.scope,
        notes: team.notes,
      },
    });
  }

  for (const assignment of blueprint.roleAssignments) {
    docs.push({
      nodeKind: "CompanyRoleAssignment",
      id: assignment.id,
      attributes: {
        assignmentKind: assignment.assignmentKind,
        subjectType: assignment.subjectType,
        notes: assignment.notes,
      },
      edges: {
        references_role_entity: [assignment.atlasRecordId],
        assigned_to_subject: [assignment.subjectId],
      },
    });
  }

  return docs.map((doc) => dump(doc, { noRefs: true, lineWidth: 120 }).trim()).join("\n---\n\n");
}

export async function exportCompanyBlueprintYaml(userId: string, blueprintId: string): Promise<string> {
  const blueprint = await getCompanyBlueprint(userId, blueprintId);
  if (!blueprint) {
    throw new Error("Blueprint not found.");
  }

  const yaml = buildYamlDocuments(blueprint.draft);
  if (!isDatabaseConfigured()) {
    await updateLocalBlueprintRow(userId, blueprintId, (row) => ({
      ...row,
      last_export_yaml: yaml,
      updated_at: new Date().toISOString(),
    }));
    return yaml;
  }

  await execute(
    `UPDATE atlas_company_blueprints
        SET last_export_yaml = $3,
            updated_at = NOW()
      WHERE user_id = $1 AND id = $2`,
    [userId, blueprintId, yaml],
  );
  await execute(
    `INSERT INTO atlas_company_blueprint_exports
      (id, blueprint_id, export_format, payload)
     VALUES
      ($1, $2, 'yaml', $3)`,
    [randomUUID(), blueprintId, yaml],
  );
  return yaml;
}

export async function getCompanyLayerPalette(userId: string): Promise<CompanyLayerPalette[]> {
  const { index } = await getAtlasViewForUser(userId);
  const records = Object.values(index.records);

  return COMPANY_LAYER_DEFS.map((layer) => ({
    key: layer.key,
    label: layer.label,
    kind: layer.kind,
    options: records
      .filter((record) => (layer.atlasKinds as readonly string[]).includes(record._kind))
      .sort((a, b) => recordLabel(a).localeCompare(recordLabel(b)))
      .slice(0, 60)
      .map((record) => ({
        id: record.id,
        label: recordLabel(record),
        kind: record._kind,
        description: recordDescription(record),
      })),
  }));
}
