import type { CatalogGraph, GraphDocument, GraphEdge, GraphNode, GraphRelationship, OntologySchema } from "./models";
export declare function getCatalogGraph(): CatalogGraph;
export declare function getGraphDocument(): GraphDocument;
export declare function getOntologySchema(): OntologySchema;
export declare function listGraphNodes(): GraphNode[];
export declare function listNodesByKind(kind: GraphNode["kind"]): GraphNode[];
export declare function getNodeById<TNode extends GraphNode = GraphNode>(nodeId: string): TNode | undefined;
export declare function listGraphEdges(): GraphRelationship[];
export declare function listRelationshipsForNode(nodeId: string): GraphRelationship[];
export declare function listRelationshipsByRelation(relation: string): GraphRelationship[];
export declare function listOutgoingTargets(nodeId: string, relation: string): GraphNode[];
export declare function listIncomingSources(nodeId: string, relation: string): GraphNode[];
export declare function listEdgesForNode(catalog: {
    graph: GraphEdge[];
}, nodeId: string): GraphEdge[];
export declare function listEdgesByRelation(catalog: {
    graph: GraphEdge[];
}, relation: string): GraphEdge[];
export declare function assertGraphFileCoverage(): void;
//# sourceMappingURL=graph.d.ts.map