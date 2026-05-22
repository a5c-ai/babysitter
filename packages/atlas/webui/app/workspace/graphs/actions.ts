"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createUserGraphUpload, deleteUserGraphUpload, rebuildUserGraphUpload } from "@/lib/server/user-graphs";

export async function uploadUserGraphAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("A YAML file is required.");
  }

  const rawYaml = await file.text();
  await createUserGraphUpload({
    userId: session.user.id,
    title: title || file.name,
    description: description || undefined,
    sourceFilename: file.name,
    rawYaml,
  });

  revalidatePath("/workspace");
  revalidatePath("/workspace/graphs");
}

export async function deleteUserGraphAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }

  const uploadId = String(formData.get("uploadId") ?? "").trim();
  if (!uploadId) {
    throw new Error("uploadId is required.");
  }

  await deleteUserGraphUpload(session.user.id, uploadId);
  revalidatePath("/workspace");
  revalidatePath("/workspace/graphs");
}

export async function rebuildUserGraphAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }

  const uploadId = String(formData.get("uploadId") ?? "").trim();
  if (!uploadId) {
    throw new Error("uploadId is required.");
  }

  await rebuildUserGraphUpload(session.user.id, uploadId);
  revalidatePath("/workspace");
  revalidatePath("/workspace/graphs");
}
