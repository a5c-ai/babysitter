import { getPath } from "./template.mjs";

function compareByPath(pathExpression) {
  return (left, right) => {
    const leftValue = getPath(left, pathExpression);
    const rightValue = getPath(right, pathExpression);
    if (leftValue === rightValue) return left.id.localeCompare(right.id);
    if (leftValue === undefined || leftValue === null) return 1;
    if (rightValue === undefined || rightValue === null) return -1;
    return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });
  };
}

export function createQuery(graph) {
  const nodeById = graph.nodeById ?? new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoingById = new Map();
  const incomingById = new Map();
  for (const edge of graph.edges) {
    if (!outgoingById.has(edge.source)) outgoingById.set(edge.source, []);
    if (!incomingById.has(edge.target)) incomingById.set(edge.target, []);
    outgoingById.get(edge.source).push(edge);
    incomingById.get(edge.target).push(edge);
  }

  function nodesByKind(kind) {
    return graph.nodes.filter((node) => node.nodeKind === kind).sort((left, right) => left.id.localeCompare(right.id));
  }

  function search(text) {
    const needle = text.toLowerCase();
    return graph.nodes.filter((node) => JSON.stringify(node).toLowerCase().includes(needle));
  }

  function outgoing(id, relation) {
    return (outgoingById.get(id) ?? []).filter((edge) => !relation || edge.relation === relation);
  }

  function incoming(id, relation) {
    return (incomingById.get(id) ?? []).filter((edge) => !relation || edge.relation === relation);
  }

  function related(id, options = {}) {
    const direction = options.direction ?? "both";
    const relation = options.relation;
    const edges = [
      ...(direction === "incoming" || direction === "both" ? incoming(id, relation) : []),
      ...(direction === "outgoing" || direction === "both" ? outgoing(id, relation) : []),
    ];
    return edges.map((edge) => ({
      edge,
      node: nodeById.get(edge.source === id ? edge.target : edge.source),
      direction: edge.source === id ? "outgoing" : "incoming",
    }));
  }

  function select(options = {}) {
    let result = [...graph.nodes];
    if (options.kind) result = result.filter((node) => node.nodeKind === options.kind);
    if (options.q) result = result.filter((node) => JSON.stringify(node).toLowerCase().includes(options.q.toLowerCase()));
    if (options.where) {
      const clauses = Array.isArray(options.where) ? options.where : [options.where];
      for (const clause of clauses) {
        const [pathExpression, expected] = clause.split("=", 2);
        result = result.filter((node) => String(getPath(node, pathExpression.trim())) === expected);
      }
    }
    if (options.missing) {
      const missingPaths = Array.isArray(options.missing) ? options.missing : [options.missing];
      for (const pathExpression of missingPaths) {
        result = result.filter((node) => getPath(node, pathExpression) === undefined);
      }
    }
    result.sort(compareByPath(options.sort ?? "id"));
    if (options.limit) result = result.slice(0, Number(options.limit));
    return result;
  }

  function stats() {
    const byKind = {};
    for (const node of graph.nodes) byKind[node.nodeKind] = (byKind[node.nodeKind] ?? 0) + 1;
    const byRelation = {};
    for (const edge of graph.edges) byRelation[edge.relation] = (byRelation[edge.relation] ?? 0) + 1;
    return {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      files: graph.graphFiles.length,
      kinds: Object.keys(byKind).length,
      relations: Object.keys(byRelation).length,
      diagnostics: graph.diagnostics,
      byKind: Object.fromEntries(Object.entries(byKind).sort(([left], [right]) => left.localeCompare(right))),
      byRelation: Object.fromEntries(Object.entries(byRelation).sort(([left], [right]) => left.localeCompare(right))),
    };
  }

  return {
    get: (id) => nodeById.get(id),
    nodesByKind,
    search,
    outgoing,
    incoming,
    related,
    select,
    stats,
  };
}

