import { auth } from "@/auth";
import { atlas, createAtlasGraph, type AtlasGraph, type IndexShape } from "@a5c-ai/atlas";
import { getUserOverlayIndex } from "./user-graphs";
import { mergeIndexes } from "./atlas-overlay";

type AtlasView = {
  graph: AtlasGraph;
  index: IndexShape;
  mode: "public" | "merged";
};

export async function getAtlasViewForUser(userId?: string | null): Promise<AtlasView> {
  if (!userId) {
    const publicIndex = atlas.getIndex();
    return { graph: atlas, index: publicIndex, mode: "public" };
  }

  const overlay = await getUserOverlayIndex(userId);
  const publicIndex = atlas.getIndex();
  if (!overlay) {
    return { graph: atlas, index: publicIndex, mode: "public" };
  }

  const merged = mergeIndexes(publicIndex, overlay);
  return { graph: createAtlasGraph(merged), index: merged, mode: "merged" };
}

export async function getCurrentAtlasView(): Promise<AtlasView> {
  const session = await auth();
  return getAtlasViewForUser(session?.user?.id ?? null);
}
