export interface GraphNode {
  nodeKind: string;
  id: string;
  attributes: Record<string, unknown>;
  edges: Record<string, unknown>;
  sourceFile: string;
  documentIndex: number;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  attributes: Record<string, unknown>;
  sourceFile: string;
}
export interface LoadedGraph {
  rootDir: string;
  graphDir: string;
  schemaDir: string;
  graphFiles: string[];
  schemaFiles: string[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeById: Map<string, GraphNode>;
  diagnostics: Record<string, unknown>;
}
export function loadGraph(options?: { rootDir?: string; graphDir?: string; schemaDir?: string }): Promise<LoadedGraph>;
export function createQuery(graph: LoadedGraph): Record<string, Function>;
export function renderTemplate(template: string, context?: Record<string, unknown>): string;
export function slug(value: unknown): string;
export function getPath(value: unknown, pathExpression: string): unknown;
export function runGeneratorSpec(specPath: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
export function hashContent(content: string): string;
