import type { GraphNode, GraphRelationship } from "./models";

function valueAsString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function buildClaimsByEvidence(
  claimNodes: Iterable<GraphNode>,
  evidenceNodes: Iterable<GraphNode>,
  relationships: Iterable<Pick<GraphRelationship, "from" | "to" | "relation">>,
): Map<string, GraphNode[]> {
  const claimsByGraphId = new Map(Array.from(claimNodes, (node) => [valueAsString(node.id), node] as const));
  const evidenceByGraphId = new Map(Array.from(evidenceNodes, (node) => [valueAsString(node.id), node] as const));
  const claimsByEvidence = new Map<string, GraphNode[]>();

  for (const relationship of relationships) {
    if (relationship.relation !== "sourced_from") {
      continue;
    }

    const claimNode = claimsByGraphId.get(relationship.from);
    const evidenceNode = evidenceByGraphId.get(relationship.to);
    if (!claimNode || !evidenceNode) {
      continue;
    }

    const evidenceId = valueAsString(evidenceNode.evidenceId);
    const evidenceClaims = claimsByEvidence.get(evidenceId);
    if (evidenceClaims) {
      evidenceClaims.push(claimNode);
    } else {
      claimsByEvidence.set(evidenceId, [claimNode]);
    }
  }

  return claimsByEvidence;
}

export function getEvidenceClaimStatement(
  evidenceId: string,
  claimsByEvidence: ReadonlyMap<string, GraphNode[]>,
): string {
  return valueAsString(claimsByEvidence.get(evidenceId)?.[0]?.statement);
}
