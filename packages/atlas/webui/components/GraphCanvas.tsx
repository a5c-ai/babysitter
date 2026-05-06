"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge as RfEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type SlimEdge = { from: string; to: string; kind: string };
type GraphIdx = {
  records: Record<string, { _kind: string; displayName: string }>;
  edges: SlimEdge[];
};

interface Props {
  seed: string;
  depth: number;
  edgeKindFilter?: Set<string>;
  nodeKindFilter?: Set<string>;
}

export function GraphCanvas({ seed, depth, edgeKindFilter, nodeKindFilter }: Props) {
  const [idx, setIdx] = React.useState<GraphIdx | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/graph-index.json")
      .then((r) => r.json())
      .then(setIdx)
      .catch((e) => setError(String(e)));
  }, []);

  const adjacency = React.useMemo(() => {
    if (!idx) return null;
    const out = new Map<string, SlimEdge[]>();
    const inn = new Map<string, SlimEdge[]>();
    for (const e of idx.edges) {
      (out.get(e.from) ?? out.set(e.from, []).get(e.from)!).push(e);
      (inn.get(e.to) ?? inn.set(e.to, []).get(e.to)!).push(e);
    }
    return { out, inn };
  }, [idx]);

  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(() => {
    if (!idx || !adjacency || !idx.records[seed]) return { nodes: [], edges: [] };

    const visited = new Set<string>([seed]);
    const layer: Map<string, number> = new Map([[seed, 0]]);
    let frontier = [seed];
    const collectedEdges: SlimEdge[] = [];

    for (let d = 0; d < depth; d++) {
      const next: string[] = [];
      for (const n of frontier) {
        const neigh: SlimEdge[] = (adjacency.out.get(n) ?? []).concat(adjacency.inn.get(n) ?? []);
        for (const e of neigh) {
          if (edgeKindFilter && edgeKindFilter.size > 0 && !edgeKindFilter.has(e.kind)) continue;
          const other = e.from === n ? e.to : e.from;
          const otherKind = idx.records[other]?._kind;
          if (nodeKindFilter && nodeKindFilter.size > 0 && otherKind && !nodeKindFilter.has(otherKind)) continue;
          collectedEdges.push(e);
          if (!visited.has(other)) {
            visited.add(other);
            layer.set(other, d + 1);
            next.push(other);
          }
        }
      }
      frontier = next;
    }

    const layered: Record<number, string[]> = {};
    for (const [id, l] of layer) (layered[l] ??= []).push(id);

    const nodes: Node[] = [];
    for (const [lStr, ids] of Object.entries(layered)) {
      const l = Number(lStr);
      const radius = l * 220;
      ids.forEach((id, i) => {
        const angle = l === 0 ? 0 : (2 * Math.PI * i) / ids.length;
        const rec = idx.records[id];
        nodes.push({
          id,
          position: { x: l === 0 ? 0 : Math.cos(angle) * radius, y: l === 0 ? 0 : Math.sin(angle) * radius },
          data: { label: shortLabel(id, rec?._kind) },
          style: nodeStyle(l === 0),
        });
      });
    }

    const seenEdge = new Set<string>();
    const rfEdges: RfEdge[] = [];
    for (const e of collectedEdges) {
      const k = `${e.from}|${e.to}|${e.kind}`;
      if (seenEdge.has(k)) continue;
      if (!visited.has(e.from) || !visited.has(e.to)) continue;
      seenEdge.add(k);
      rfEdges.push({
        id: k,
        source: e.from,
        target: e.to,
        label: e.kind,
        labelStyle: { fontSize: 9, fill: "#A89980" },
        style: { stroke: "#A88557" },
      });
    }
    return { nodes, edges: rfEdges };
  }, [idx, adjacency, seed, depth, edgeKindFilter, nodeKindFilter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (error) return <div className="p-4 text-sm" style={{ color: 'var(--accent-cinnabar)' }}>Failed to load: {error}</div>;
  if (!idx) return <div className="p-4 text-sm" style={{ color: 'var(--fg-3)' }}>Loading graph...</div>;
  if (!idx.records[seed])
    return <div className="p-4 text-sm" style={{ color: 'var(--accent-cinnabar)' }}>Seed record not found: {seed}</div>;

  return (
    <div className="rounded-md" style={{ width: "100%", height: 720, border: '1px solid var(--rule)' }}>
      <div
        className="px-3 py-1.5 text-xs flex items-center justify-between"
        style={{ color: 'var(--fg-3)', borderBottom: '1px solid var(--rule)', background: 'var(--bg-2)' }}
      >
        <span>
          seed: <span className="font-mono" style={{ color: 'var(--fg)' }}>{seed}</span> · depth {depth}
        </span>
        <span className="tabular-nums">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>
      <div style={{ height: "calc(100% - 32px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={3}
        >
          <Background gap={16} size={1} color="#2B2A6B" />
          <Controls position="bottom-right" />
          <MiniMap pannable zoomable maskColor="rgba(0,0,0,0.6)" />
        </ReactFlow>
      </div>
    </div>
  );
}

function shortLabel(id: string, kind?: string) {
  const idShort = id.length > 30 ? id.slice(0, 28) + "…" : id;
  return kind ? `${idShort}\n${kind}` : idShort;
}
function nodeStyle(center: boolean): React.CSSProperties {
  return {
    background: center ? "#2F6F5E" : "#181624",
    color: center ? "#F0E6D1" : "#F0E6D1",
    border: center ? "2px solid #C98A3E" : "1px solid #6B4A22",
    borderRadius: 6,
    padding: 6,
    fontSize: 10,
    fontFamily: "ui-monospace, monospace",
    whiteSpace: "pre-line",
    minWidth: 130,
    textAlign: "center",
  };
}
