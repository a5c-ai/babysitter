import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dump } from "js-yaml";
import type { AtlasRecord } from "@a5c-ai/atlas";
import { execute, isDatabaseConfigured, queryRow, queryRows } from "./db";
import { getAtlasViewForUser } from "./atlas-view";

export const COMPANY_LAYER_DEFS = [
  { key: "models", label: "Models", nodeKinds: ["ModelVersion", "ModelProviderProduct", "ModelFamily", "SessionModel"] },
  { key: "agents", label: "Agents", nodeKinds: ["AgentProduct", "AgentCoreImpl", "AgentRuntimeImpl", "AgentPlatformImpl", "AgentUIImpl", "LibraryAgent", "Subagent"] },
  { key: "tools", label: "Tools", nodeKinds: ["Tool", "ToolDescriptor", "ToolServer", "Plugin", "MCPPrompt", "MCPResource"] },
  { key: "roles", label: "Roles", nodeKinds: ["Role", "Responsibility", "OrgUnit", "AgentTeam"] },
  { key: "skills", label: "Skills", nodeKinds: ["Skill", "LibrarySkill", "SkillArea", "Capability"] },
  { key: "processes", label: "Processes", nodeKinds: ["LibraryProcess", "Workflow", "WorkflowDefinition", "ProcessDescriptor", "Phase"] },
  { key: "platforms", label: "Platforms", nodeKinds: ["Platform", "PlatformService", "Provider", "ProviderVersion", "Workspace"] },
  { key: "infrastructure", label: "Infrastructure", nodeKinds: ["DeploymentTarget", "PlatformService", "Provider", "VCSHost", "VectorStore", "TransportRuntime"] },
  { key: "data", label: "Data", nodeKinds: ["VectorStore", "MemoryStore", "Project", "Customer", "Dataset", "KnowledgeBase"] },
] as const;

export type CompanyLayerKey = (typeof COMPANY_LAYER_DEFS)[number]["key"];

export type CompanySelectionDraft = {
  id: string;
  layerKey: CompanyLayerKey;
  atlasRecordId: string;
  selectionRole: string;
  notes: string;
  coversLayers: string[];
};

export type CompanySystemDraft = {
  id: string;
  displayName: string;
  description: string;
  systemKind: string;
  selections: CompanySelectionDraft[];
  assetIds: string[];
};

export type CompanyAssetDraft = {
  id: string;
  displayName: string;
  assetKind: string;
  environment: string;
  provider: string;
  notes: string;
};

export type CompanyIntegrationDraft = {
  id: string;
  fromSystemId: string;
  toType: "system" | "asset";
  toId: string;
  integrationKind: string;
  triggerKind: string;
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
  assets: CompanyAssetDraft[];
  integrations: CompanyIntegrationDraft[];
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

type LocalCompanyBlueprintStore = {
  version: 1;
  users: Record<string, { blueprints: BlueprintRow[] }>;
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
  options: LayerOption[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `company-${Date.now()}`;
}

function localCompanyBuilderStoreDir(): string {
  const configured = process.env.ATLAS_LOCAL_STORAGE_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), ".atlas-local", "atlas-webui");
}

async function localCompanyBuilderStorePath(): Promise<string> {
  const dir = localCompanyBuilderStoreDir();
  await mkdir(dir, { recursive: true });
  return path.join(dir, "company-builder.json");
}

async function readLocalCompanyBuilderStore(): Promise<LocalCompanyBlueprintStore> {
  const storePath = await localCompanyBuilderStorePath();
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalCompanyBlueprintStore>;
    return {
      version: 1,
      users: parsed.users ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, users: {} };
    }
    throw error;
  }
}

async function writeLocalCompanyBuilderStore(store: LocalCompanyBlueprintStore): Promise<void> {
  const storePath = await localCompanyBuilderStorePath();
  const tempPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, storePath);
}

function localUserBlueprints(
  store: LocalCompanyBlueprintStore,
  userId: string,
): BlueprintRow[] {
  const userEntry = store.users[userId];
  if (!userEntry) {
    store.users[userId] = { blueprints: [] };
    return store.users[userId].blueprints;
  }
  if (!Array.isArray(userEntry.blueprints)) {
    userEntry.blueprints = [];
  }
  return userEntry.blueprints;
}

function sortBlueprintRows(rows: BlueprintRow[]): BlueprintRow[] {
  return [...rows].sort((a, b) => {
    const updatedCompare = b.updated_at.localeCompare(a.updated_at);
    if (updatedCompare !== 0) {
      return updatedCompare;
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

async function listLocalBlueprintRows(userId: string): Promise<BlueprintRow[]> {
  const store = await readLocalCompanyBuilderStore();
  return sortBlueprintRows(localUserBlueprints(store, userId));
}

async function getLocalBlueprintRow(userId: string, blueprintId: string): Promise<BlueprintRow | null> {
  const store = await readLocalCompanyBuilderStore();
  return localUserBlueprints(store, userId).find((row) => row.id === blueprintId) ?? null;
}

async function createLocalBlueprintRow(userId: string, row: BlueprintRow): Promise<void> {
  const store = await readLocalCompanyBuilderStore();
  localUserBlueprints(store, userId).push(row);
  await writeLocalCompanyBuilderStore(store);
}

async function updateLocalBlueprintRow(
  userId: string,
  blueprintId: string,
  mutate: (row: BlueprintRow) => BlueprintRow,
): Promise<BlueprintRow> {
  const store = await readLocalCompanyBuilderStore();
  const blueprints = localUserBlueprints(store, userId);
  const index = blueprints.findIndex((row) => row.id === blueprintId);
  if (index === -1) {
    throw new Error("Blueprint not found.");
  }
  const nextRow = mutate(blueprints[index]);
  blueprints[index] = nextRow;
  await writeLocalCompanyBuilderStore(store);
  return nextRow;
}

async function deleteLocalBlueprintRow(userId: string, blueprintId: string): Promise<void> {
  const store = await readLocalCompanyBuilderStore();
  store.users[userId] = {
    blueprints: localUserBlueprints(store, userId).filter((row) => row.id !== blueprintId),
  };
  await writeLocalCompanyBuilderStore(store);
}

function normalizeDraft(summary: Pick<BlueprintRow, "slug" | "name" | "description" | "status" | "draft_json">): CompanyBlueprintDraft {
  const draft = summary.draft_json ?? {} as CompanyBlueprintDraft;
  return {
    company: {
      displayName: draft.company?.displayName ?? summary.name,
      description: draft.company?.description ?? summary.description ?? "",
      slug: draft.company?.slug ?? summary.slug,
      status: draft.company?.status ?? summary.status ?? "draft",
    },
    systems: Array.isArray(draft.systems) ? draft.systems : [],
    assets: Array.isArray(draft.assets) ? draft.assets : [],
    integrations: Array.isArray(draft.integrations) ? draft.integrations : [],
  };
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
    [
      userId,
      blueprintId,
      nextDraft.company.displayName,
      nextDraft.company.description || null,
      nextDraft.company.status,
      JSON.stringify(nextDraft),
    ],
  );
}

export async function listCompanyBlueprints(userId: string): Promise<CompanyBlueprintSummary[]> {
  if (!isDatabaseConfigured()) {
    const rows = await listLocalBlueprintRows(userId);
    return rows.map(toSummary);
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

export async function createCompanyBlueprint(userId: string, input: {
  name: string;
  description?: string;
}): Promise<CompanyBlueprintSummary> {
  const id = randomUUID();
  const slug = slugify(input.name);
  const now = new Date().toISOString();
  const draft: CompanyBlueprintDraft = {
    company: {
      displayName: input.name,
      description: input.description ?? "",
      slug,
      status: "draft",
    },
    systems: [],
    assets: [],
    integrations: [],
  };

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

export async function saveCompanyBlueprintMetadata(userId: string, blueprintId: string, input: {
  displayName: string;
  description: string;
  status: string;
}) {
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

export async function addCompanySystem(userId: string, blueprintId: string, input: {
  displayName: string;
  description: string;
  systemKind: string;
}) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: [
      ...draft.systems,
      {
        id: `company-system:${slugify(input.displayName)}-${randomUUID().slice(0, 8)}`,
        displayName: input.displayName,
        description: input.description,
        systemKind: input.systemKind,
        selections: [],
        assetIds: [],
      },
    ],
  }));
}

export async function addCompanyAsset(userId: string, blueprintId: string, input: {
  displayName: string;
  assetKind: string;
  environment: string;
  provider: string;
  notes: string;
}) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    assets: [
      ...draft.assets,
      {
        id: `company-asset:${slugify(input.displayName)}-${randomUUID().slice(0, 8)}`,
        displayName: input.displayName,
        assetKind: input.assetKind,
        environment: input.environment,
        provider: input.provider,
        notes: input.notes,
      },
    ],
  }));
}

export async function addCompanySelection(userId: string, blueprintId: string, input: {
  systemId: string;
  layerKey: CompanyLayerKey;
  atlasRecordId: string;
  selectionRole: string;
  notes: string;
  coversLayers: string[];
}) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.map((system) => system.id !== input.systemId
      ? system
      : {
          ...system,
          selections: [
            ...system.selections,
            {
              id: `company-selection:${slugify(`${system.displayName}-${input.layerKey}`)}-${randomUUID().slice(0, 8)}`,
              layerKey: input.layerKey,
              atlasRecordId: input.atlasRecordId,
              selectionRole: input.selectionRole,
              notes: input.notes,
              coversLayers: input.coversLayers,
            },
          ],
        }),
  }));
}

export async function attachAssetToSystem(userId: string, blueprintId: string, input: {
  systemId: string;
  assetId: string;
}) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.map((system) => {
      if (system.id !== input.systemId || system.assetIds.includes(input.assetId)) {
        return system;
      }
      return { ...system, assetIds: [...system.assetIds, input.assetId] };
    }),
  }));
}

export async function addCompanyIntegration(userId: string, blueprintId: string, input: {
  fromSystemId: string;
  toType: "system" | "asset";
  toId: string;
  integrationKind: string;
  triggerKind: string;
  notes: string;
}) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    integrations: [
      ...draft.integrations,
      {
        id: `company-integration:${slugify(input.integrationKind || "link")}-${randomUUID().slice(0, 8)}`,
        fromSystemId: input.fromSystemId,
        toType: input.toType,
        toId: input.toId,
        integrationKind: input.integrationKind,
        triggerKind: input.triggerKind,
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
    integrations: draft.integrations.filter((integration) => integration.fromSystemId !== systemId && !(integration.toType === "system" && integration.toId === systemId)),
  }));
}

export async function deleteCompanyAsset(userId: string, blueprintId: string, assetId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    assets: draft.assets.filter((asset) => asset.id !== assetId),
    systems: draft.systems.map((system) => ({
      ...system,
      assetIds: system.assetIds.filter((id) => id !== assetId),
    })),
    integrations: draft.integrations.filter((integration) => !(integration.toType === "asset" && integration.toId === assetId)),
  }));
}

export async function deleteCompanySelection(userId: string, blueprintId: string, systemId: string, selectionId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.map((system) => system.id !== systemId
      ? system
      : {
          ...system,
          selections: system.selections.filter((selection) => selection.id !== selectionId),
        }),
  }));
}

export async function removeAssetFromSystem(userId: string, blueprintId: string, systemId: string, assetId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    systems: draft.systems.map((system) => system.id !== systemId
      ? system
      : {
          ...system,
          assetIds: system.assetIds.filter((id) => id !== assetId),
        }),
  }));
}

export async function deleteCompanyIntegration(userId: string, blueprintId: string, integrationId: string) {
  await updateBlueprintDraft(userId, blueprintId, (draft) => ({
    ...draft,
    integrations: draft.integrations.filter((integration) => integration.id !== integrationId),
  }));
}

function buildYamlDocuments(blueprint: CompanyBlueprintDraft): string {
  const docs: Array<Record<string, unknown>> = [];
  const blueprintId = `company:${blueprint.company.slug}`;

  docs.push({
    nodeKind: "CompanyBlueprint",
    id: blueprintId,
    attributes: {
      displayName: blueprint.company.displayName,
      description: blueprint.company.description,
      status: blueprint.company.status,
    },
    edges: {
      contains_system: blueprint.systems.map((system) => system.id),
      owns_asset: blueprint.assets.map((asset) => asset.id),
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
      },
      edges: {
        has_selection: system.selections.map((selection) => selection.id),
        uses_asset: system.assetIds,
      },
    });

    for (const selection of system.selections) {
      docs.push({
        nodeKind: "CompanySelection",
        id: selection.id,
        attributes: {
          layerKey: selection.layerKey,
          selectionRole: selection.selectionRole,
          notes: selection.notes,
          coversLayers: selection.coversLayers,
        },
        edges: {
          selects_entity: [selection.atlasRecordId],
        },
      });
    }
  }

  for (const asset of blueprint.assets) {
    docs.push({
      nodeKind: "CompanyAsset",
      id: asset.id,
      attributes: {
        displayName: asset.displayName,
        assetKind: asset.assetKind,
        environment: asset.environment,
        provider: asset.provider,
        notes: asset.notes,
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
        notes: integration.notes,
      },
      edges: {
        implemented_by: [integration.fromSystemId],
        integrates_with: [integration.toId],
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
    options: records
      .filter((record) => (layer.nodeKinds as readonly string[]).includes(record._kind))
      .sort((a, b) => recordLabel(a).localeCompare(recordLabel(b)))
      .slice(0, 24)
      .map((record) => ({
        id: record.id,
        label: recordLabel(record),
        kind: record._kind,
        description: recordDescription(record),
      })),
  }));
}
