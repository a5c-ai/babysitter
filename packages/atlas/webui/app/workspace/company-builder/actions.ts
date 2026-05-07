"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addCompanyAsset,
  addCompanyIntegration,
  addCompanySelection,
  addCompanySystem,
  attachAssetToSystem,
  createCompanyBlueprint,
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

function refreshBuilder() {
  revalidatePath("/workspace");
  revalidatePath("/workspace/company-builder");
}

export async function createCompanyBlueprintAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprint = await createCompanyBlueprint(userId, {
    name: requiredString(formData, "name"),
    description: String(formData.get("description") ?? "").trim(),
  });
  refreshBuilder();
  redirect(`/workspace/company-builder?blueprint=${encodeURIComponent(blueprint.id)}`);
}

export async function saveCompanyBlueprintMetadataAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await saveCompanyBlueprintMetadata(userId, blueprintId, {
    displayName: requiredString(formData, "displayName"),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? "draft").trim() || "draft",
  });
  refreshBuilder();
}

export async function addCompanySystemAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanySystem(userId, blueprintId, {
    displayName: requiredString(formData, "displayName"),
    description: String(formData.get("description") ?? "").trim(),
    systemKind: requiredString(formData, "systemKind"),
  });
  refreshBuilder();
}

export async function addCompanyAssetAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanyAsset(userId, blueprintId, {
    displayName: requiredString(formData, "displayName"),
    assetKind: requiredString(formData, "assetKind"),
    environment: String(formData.get("environment") ?? "").trim(),
    provider: String(formData.get("provider") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });
  refreshBuilder();
}

export async function addCompanySelectionAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  const coversLayers = String(formData.get("coversLayers") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  await addCompanySelection(userId, blueprintId, {
    systemId: requiredString(formData, "systemId"),
    layerKey: requiredString(formData, "layerKey") as CompanyLayerKey,
    atlasRecordId: requiredString(formData, "atlasRecordId"),
    selectionRole: String(formData.get("selectionRole") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    coversLayers,
  });
  refreshBuilder();
}

export async function attachAssetToSystemAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await attachAssetToSystem(userId, blueprintId, {
    systemId: requiredString(formData, "systemId"),
    assetId: requiredString(formData, "assetId"),
  });
  refreshBuilder();
}

export async function addCompanyIntegrationAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await addCompanyIntegration(userId, blueprintId, {
    fromSystemId: requiredString(formData, "fromSystemId"),
    toType: requiredString(formData, "toType") as "system" | "asset",
    toId: requiredString(formData, "toId"),
    integrationKind: requiredString(formData, "integrationKind"),
    triggerKind: String(formData.get("triggerKind") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });
  refreshBuilder();
}

export async function exportCompanyBlueprintAction(formData: FormData) {
  const userId = await requireUserId();
  const blueprintId = requiredString(formData, "blueprintId");
  await exportCompanyBlueprintYaml(userId, blueprintId);
  refreshBuilder();
}
