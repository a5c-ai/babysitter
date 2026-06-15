import { auth } from "@/auth";
import type { IndexShape } from "@a5c-ai/atlas";
import { createLocalAtlasGraph, getPublicAtlasGraph, type AtlasGraphLike } from "./atlas-local";
import { getUserOverlayIndex } from "./user-graphs";
import { mergeIndexes } from "./atlas-overlay";

type AtlasView = {
  graph: AtlasGraphLike;
  index: IndexShape;
  mode: "public" | "merged";
};

export async function getAtlasViewForUser(userId?: string | null): Promise<AtlasView> {
  const publicGraph = getPublicAtlasGraph();

  if (!userId) {
    const publicIndex = publicGraph.getIndex();
    return { graph: publicGraph, index: publicIndex, mode: "public" };
  }

  const overlay = await getUserOverlayIndex(userId);
  const publicIndex = publicGraph.getIndex();
  if (!overlay) {
    return { graph: publicGraph, index: publicIndex, mode: "public" };
  }

  const merged = mergeIndexes(publicIndex, overlay);
  return { graph: createLocalAtlasGraph(merged), index: merged, mode: "merged" };
}

export async function getCurrentAtlasView(): Promise<AtlasView> {
  const session = await auth();
  return getAtlasViewForUser(session?.user?.id ?? null);
}
