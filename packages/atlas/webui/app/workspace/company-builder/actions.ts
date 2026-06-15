"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createUserGraphUpload } from "@/lib/server/user-graphs";
import {
  addCompanyIntegration,
  addCompanyLayerBinding,
  addCompanyResource,
  addCompanyResourceBinding,
  addCompanySystem,
  createCompanyBlueprint,
  deleteCompanyBlueprint,
  deleteCompanyIntegration,
  deleteCompanyLayerBinding,
  deleteCompanyResource,
  deleteCompanyResourceBinding,
  deleteCompanySystem,
  exportCompanyBlueprintYaml,
  saveCompanyBlueprintMetadata,
  type CompanyLayerKey,
} from "@/lib/server/company-builder";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  return session.user.id;
}

function requiredString(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

function optionalString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function refreshBuilder() {
  revalidatePath("/workspace");
  revalidatePath("/workspace/company-builder");
}

export async function createCompanyBlueprintAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprint = await createCompanyBlueprint(userId, {
    name: requiredString(formData, "name"),
    description: optionalString(formData, "description"),
  });
  refreshBuilder();
  redirect(`/workspace/company-builder?blueprint=${encodeURIComponent(blueprint.id)}`);
}

export async function saveCompanyBlueprintMetadataAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await saveCompanyBlueprintMetadata(userId, blueprintId, {
    displayName: requiredString(formData, "displayName"),
    description: optionalString(formData, "description"),
    status: optionalString(formData, "status") || "draft",
  });
  refreshBuilder();
}

export async function addCompanySystemAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanySystem(userId, blueprintId, {
    displayName: requiredString(formData, "displayName"),
    description: optionalString(formData, "description"),
    systemKind: requiredString(formData, "systemKind"),
    outcome: optionalString(formData, "outcome"),
    lifecycleStage: optionalString(formData, "lifecycleStage") || "draft",
  });
  refreshBuilder();
}

export async function addCompanyResourceAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanyResource(userId, blueprintId, {
    displayName: requiredString(formData, "displayName"),
    resourceClass: requiredString(formData, "resourceClass"),
    provider: optionalString(formData, "provider"),
    environment: optionalString(formData, "environment"),
    atlasRecordId: optionalString(formData, "atlasRecordId"),
    externalId: optionalString(formData, "externalId"),
    notes: optionalString(formData, "notes"),
  });
  refreshBuilder();
}

export async function addCompanyLayerBindingAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  const repeatedCoverage = formData
    .getAll("coverageLayerIds")
    .map((item) => String(item).trim())
    .filter(Boolean) as CompanyLayerKey[];
  const fallbackCoverage = String(formData.get("coverageLayerIds") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) as CompanyLayerKey[];
  const coverageLayerIds = repeatedCoverage.length > 0 ? repeatedCoverage : fallbackCoverage;
  await addCompanyLayerBinding(userId, blueprintId, {
    systemId: requiredString(formData, "systemId"),
    primaryLayerId: requiredString(formData, "primaryLayerId") as CompanyLayerKey,
    atlasRecordId: requiredString(formData, "atlasRecordId"),
    selectionRole: optionalString(formData, "selectionRole"),
    rationale: optionalString(formData, "rationale"),
    coverageLayerIds,
    importance: (optionalString(formData, "importance") as "primary" | "supporting") || "primary",
  });
  refreshBuilder();
}

export async function addCompanyResourceBindingAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanyResourceBinding(userId, blueprintId, {
    systemId: requiredString(formData, "systemId"),
    resourceId: requiredString(formData, "resourceId"),
    bindingKind: requiredString(formData, "bindingKind"),
    environmentStage: optionalString(formData, "environmentStage"),
    criticality: optionalString(formData, "criticality"),
    notes: optionalString(formData, "notes"),
  });
  refreshBuilder();
}

export async function addCompanyIntegrationAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanyIntegration(userId, blueprintId, {
    sourceType: requiredString(formData, "sourceType") as "system" | "resource",
    sourceId: requiredString(formData, "sourceId"),
    targetType: requiredString(formData, "targetType") as "system" | "resource",
    targetId: requiredString(formData, "targetId"),
    integrationKind: requiredString(formData, "integrationKind"),
    triggerKind: optionalString(formData, "triggerKind"),
    interfaceKind: optionalString(formData, "interfaceKind"),
    direction: optionalString(formData, "direction") || "outbound",
    notes: optionalString(formData, "notes"),
  });
  refreshBuilder();
}

export async function exportCompanyBlueprintAction(formData: FormData) {
  const userId = await requireUserId();
  await exportCompanyBlueprintYaml(userId, requiredString(formData, "blueprintId"));
  refreshBuilder();
}

export async function saveCompanyBlueprintExportToPrivateGraphAction(formData: FormData) {
  const userId = await requireUserId();
  const yaml = await exportCompanyBlueprintYaml(userId, requiredString(formData, "blueprintId"));
  const title = requiredString(formData, "graphTitle");
  const sourceFilename = optionalString(formData, "sourceFilename") || `${title}.yaml`;

  await createUserGraphUpload({
    userId,
    title,
    description: optionalString(formData, "graphDescription") || undefined,
    sourceFilename,
    rawYaml: yaml,
  });

  refreshBuilder();
  revalidatePath("/workspace/graphs");
  redirect("/workspace/graphs");
}

export async function deleteCompanyBlueprintAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteCompanyBlueprint(userId, requiredString(formData, "blueprintId"));
  refreshBuilder();
  redirect("/workspace/company-builder");
}

export async function deleteCompanySystemAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteCompanySystem(userId, requiredString(formData, "blueprintId"), requiredString(formData, "systemId"));
  refreshBuilder();
}

export async function deleteCompanyResourceAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteCompanyResource(userId, requiredString(formData, "blueprintId"), requiredString(formData, "resourceId"));
  refreshBuilder();
}

export async function deleteCompanyLayerBindingAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteCompanyLayerBinding(
    userId,
    requiredString(formData, "blueprintId"),
    requiredString(formData, "systemId"),
    requiredString(formData, "bindingId"),
  );
  refreshBuilder();
}

export async function deleteCompanyResourceBindingAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteCompanyResourceBinding(userId, requiredString(formData, "blueprintId"), requiredString(formData, "bindingId"));
  refreshBuilder();
}

export async function deleteCompanyIntegrationAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteCompanyIntegration(userId, requiredString(formData, "blueprintId"), requiredString(formData, "integrationId"));
  refreshBuilder();
}
