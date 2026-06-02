/**
 * SpanTree — builds a parent/child tree from a flat list of TelemetrySpans.
 *
 * Useful for rendering trace waterfalls, computing subtree durations, and
 * serializing trace hierarchies to JSON for the observer UI.
 */

import type { TelemetrySpan } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A tree node wrapping a span with its children. */
export interface SpanTreeNode {
  readonly span: TelemetrySpan;
  readonly children: SpanTreeNode[];
}

/** Serializable representation of a SpanTreeNode. */
export interface SerializedSpanTreeNode {
  readonly spanId: string;
  readonly name: string;
  readonly traceId: string;
  readonly parentSpanId?: string;
  readonly startTime: string;
  readonly endTime?: string;
  readonly status: string;
  readonly attributes: Record<string, string | number | boolean>;
  readonly events: Array<{
    readonly name: string;
    readonly timestamp: string;
    readonly attributes?: Record<string, string | number | boolean>;
  }>;
  readonly children: SerializedSpanTreeNode[];
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/** Tree built from a flat span list. */
export class SpanTree {
  /** All nodes keyed by spanId for O(1) lookup. */
  private readonly nodes = new Map<string, SpanTreeNode>();
  /** Root node ids (spans with no parent or whose parent is unknown). */
  private readonly rootIds: string[] = [];

  /** Insert a span into the tree, linking it to its parent if present. */
  addSpan(span: TelemetrySpan): void {
    // Create or retrieve the node for this span.
    let node = this.nodes.get(span.spanId);
    if (node) {
      // Node was pre-created as a placeholder by a child — update the span.
      (node as { span: TelemetrySpan }).span = span;
    } else {
      node = { span, children: [] };
      this.nodes.set(span.spanId, node);
    }

    if (span.parentSpanId) {
      let parentNode = this.nodes.get(span.parentSpanId);
      if (!parentNode) {
        // Parent hasn't been added yet — create a placeholder.
        parentNode = {
          span: undefined as unknown as TelemetrySpan,
          children: [],
        };
        this.nodes.set(span.parentSpanId, parentNode);
      }
      // Avoid duplicate children on re-add.
      if (!parentNode.children.some((c) => c.span?.spanId === span.spanId)) {
        (parentNode.children as SpanTreeNode[]).push(node);
      }
    } else {
      if (!this.rootIds.includes(span.spanId)) {
        this.rootIds.push(span.spanId);
      }
    }
  }

  /** Get direct children of a span. */
  getChildren(spanId: string): TelemetrySpan[] {
    const node = this.nodes.get(spanId);
    if (!node) return [];
    return node.children.map((c) => c.span);
  }

  /** Get top-level spans (those with no parent). */
  getRoots(): TelemetrySpan[] {
    return this.rootIds
      .map((id) => this.nodes.get(id))
      .filter((n): n is SpanTreeNode => n != null && n.span != null)
      .map((n) => n.span);
  }

  /** Serialize the full tree to a JSON-safe structure. */
  toJSON(): SerializedSpanTreeNode[] {
    return this.getRoots()
      .map((root) => this.nodes.get(root.spanId))
      .filter((n): n is SpanTreeNode => n != null)
      .map((n) => this.serializeNode(n));
  }

  private serializeNode(node: SpanTreeNode): SerializedSpanTreeNode {
    const { span } = node;
    return {
      spanId: span.spanId,
      name: span.name,
      traceId: span.traceId,
      parentSpanId: span.parentSpanId,
      startTime: span.startTime,
      endTime: span.endTime,
      status: span.status,
      attributes: { ...span.attributes },
      events: span.events.map((e) => ({
        name: e.name,
        timestamp: e.timestamp,
        ...(e.attributes ? { attributes: { ...e.attributes } } : {}),
      })),
      children: node.children.map((c) => this.serializeNode(c)),
    };
  }
}
