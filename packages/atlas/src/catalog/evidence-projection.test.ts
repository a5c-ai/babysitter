import { describe, expect, it } from "vitest";
import { buildClaimsByEvidence, getEvidenceClaimStatement } from "./evidence-projection";
import type { GraphNode, GraphRelationship } from "./models";

describe("evidence projection", () => {
  it("derives evidence claim text from sourced_from edges instead of matching id suffixes", () => {
    const claimNodes: GraphNode[] = [
      {
        id: "claim:agent-catalog-package-script-coverage",
        kind: "Claim",
        claimId: "agent-catalog-package-script-coverage",
        statement: "The package scripts cover build, test, graph validation, and evidence generation workflows.",
      },
    ];
    const evidenceNodes: GraphNode[] = [
      {
        id: "evidence:repo-agent-catalog-package-json",
        kind: "EvidenceSource",
        evidenceId: "repo-agent-catalog-package-json",
      },
    ];
    const relationships: GraphRelationship[] = [
      {
        id: "edge:claim-to-evidence",
        relation: "sourced_from",
        from: "claim:agent-catalog-package-script-coverage",
        to: "evidence:repo-agent-catalog-package-json",
      },
    ];

    const claimsByEvidence = buildClaimsByEvidence(claimNodes, evidenceNodes, relationships);

    expect(getEvidenceClaimStatement("repo-agent-catalog-package-json", claimsByEvidence)).toBe(
      "The package scripts cover build, test, graph validation, and evidence generation workflows.",
    );
  });
});
