import type { AtlasRecord } from "@a5c-ai/atlas";
import type { AtlasGraphLike } from "@/lib/server/atlas-local";
import { ServiceTowerView } from "./ServiceTowerView";
import { buildServiceTowerView } from "./service-tower-data";

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function getReusableViewType(page: AtlasRecord): string | null {
  const reusableView = objectValue(page.reusableView);
  if (typeof reusableView?.type === "string") return reusableView.type;
  if (typeof page.reusableView === "string") return page.reusableView;
  if (typeof page.view === "string") return page.view;
  return null;
}

export function renderReusableView(page: AtlasRecord, graph: AtlasGraphLike): React.ReactNode | null {
  const reusableView = objectValue(page.reusableView);
  const type = getReusableViewType(page);
  if (type === "service-tower") {
    return <ServiceTowerView data={buildServiceTowerView(graph, reusableView?.options)} />;
  }
  return null;
}
