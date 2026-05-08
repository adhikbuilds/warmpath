/**
 * WarmPath Graph Engine
 *
 * Computes warm paths through the relationship graph.
 * Replaces hardcoded WarmPath[] with real BFS + warmth scoring.
 *
 * Core ideas:
 *   - Edge warmth = f(relationship_type, recency, strength_score)
 *   - Path warmth = weakest edge × length penalty
 *   - BFS from source, collect all paths ≤ maxHops, rank by warmth
 */

import type { RelationshipEdge, RelationshipType } from "@/types";

// ─── Warmth Scoring ───────────────────────────────────────────────────────────

const BASE_WARMTH: Record<RelationshipType, number> = {
  intro_history: 92,
  coworker_connection: 86,
  calendar_meeting: 82,
  email_history: 70,
  warm_path: 74,
  crm_owner: 62,
  linkedin_connection: 44,
};

function recencyFactor(lastInteractionAt: string): number {
  const days = (Date.now() - new Date(lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) return 1.0;
  if (days < 30) return 0.92;
  if (days < 90) return 0.78;
  if (days < 180) return 0.6;
  if (days < 365) return 0.42;
  return 0.25;
}

export function computeEdgeWarmth(edge: RelationshipEdge): number {
  const base = BASE_WARMTH[edge.relationship_type] ?? 50;
  const recency = recencyFactor(edge.last_interaction_at);
  // strength_score (0–100) scales the final score between 40%–100% of base×recency
  const strength = 0.4 + (edge.strength_score / 100) * 0.6;
  return Math.min(100, Math.round(base * recency * strength));
}

function lengthPenalty(hops: number): number {
  if (hops === 1) return 1.0;
  if (hops === 2) return 0.94;
  if (hops === 3) return 0.84;
  return 0.7;
}

// ─── Path Types ───────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  name: string;
  type: "user" | "team_member" | "contact" | "account";
}

export interface ComputedPathEdge {
  from: GraphNode;
  to: GraphNode;
  edge: RelationshipEdge;
  warmth: number;
}

export interface ComputedPath {
  nodes: GraphNode[];
  edges: ComputedPathEdge[];
  warmth: number; // weakest link × length penalty
  avgWarmth: number;
  weakestLink: ComputedPathEdge;
  explanation: string;
}

// ─── Graph Engine ─────────────────────────────────────────────────────────────

export class RelationshipGraph {
  private nodeMap = new Map<string, GraphNode>();
  // adjacency: nodeId → [{neighborId, edge}]
  private adj = new Map<
    string,
    Array<{ neighborId: string; edge: RelationshipEdge; warmth: number }>
  >();

  addNode(node: GraphNode): this {
    this.nodeMap.set(node.id, node);
    return this;
  }

  addEdge(edge: RelationshipEdge, bidirectional = true): this {
    const warmth = computeEdgeWarmth(edge);

    const fromNode: GraphNode = { id: edge.from_id, name: edge.from_name, type: edge.from_type };
    const toNode: GraphNode = { id: edge.to_id, name: edge.to_name, type: edge.to_type };
    this.nodeMap.set(edge.from_id, fromNode);
    this.nodeMap.set(edge.to_id, toNode);

    const addDir = (fromId: string, toId: string) => {
      if (!this.adj.has(fromId)) this.adj.set(fromId, []);
      this.adj.get(fromId)!.push({ neighborId: toId, edge, warmth });
    };

    addDir(edge.from_id, edge.to_id);
    if (bidirectional) addDir(edge.to_id, edge.from_id);
    return this;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodeMap.get(id);
  }

  neighbors(nodeId: string) {
    return this.adj.get(nodeId) ?? [];
  }

  /**
   * Find all paths from `fromId` to `toId` up to `maxHops` hops.
   * Returns top `maxResults` paths ranked by warmth (weakest-link × length penalty).
   */
  findPaths(fromId: string, toId: string, maxHops = 3, maxResults = 3): ComputedPath[] {
    const results: ComputedPath[] = [];

    type Frame = {
      nodeId: string;
      visited: Set<string>;
      pathNodes: GraphNode[];
      pathEdges: ComputedPathEdge[];
    };

    const queue: Frame[] = [
      {
        nodeId: fromId,
        visited: new Set([fromId]),
        pathNodes: [this.nodeMap.get(fromId) ?? { id: fromId, name: fromId, type: "user" }],
        pathEdges: [],
      },
    ];

    while (queue.length > 0) {
      const frame = queue.shift()!;

      if (frame.nodeId === toId && frame.pathEdges.length > 0) {
        const warmths = frame.pathEdges.map((e) => e.warmth);
        const minWarmth = Math.min(...warmths);
        const avgWarmth = Math.round(warmths.reduce((a, b) => a + b, 0) / warmths.length);
        const hops = frame.pathEdges.length;
        const score = Math.round(minWarmth * lengthPenalty(hops));
        const weakestLink = frame.pathEdges.reduce((a, b) => (a.warmth < b.warmth ? a : b));

        results.push({
          nodes: frame.pathNodes,
          edges: frame.pathEdges,
          warmth: score,
          avgWarmth,
          weakestLink,
          explanation: buildExplanation(frame.pathNodes, frame.pathEdges),
        });
        continue;
      }

      if (frame.pathEdges.length >= maxHops) continue;

      for (const { neighborId, edge, warmth } of this.neighbors(frame.nodeId)) {
        if (frame.visited.has(neighborId)) continue;

        const neighborNode = this.nodeMap.get(neighborId) ?? {
          id: neighborId,
          name: neighborId,
          type: "contact" as const,
        };
        const fromNode = this.nodeMap.get(frame.nodeId)!;

        queue.push({
          nodeId: neighborId,
          visited: new Set([...frame.visited, neighborId]),
          pathNodes: [...frame.pathNodes, neighborNode],
          pathEdges: [...frame.pathEdges, { from: fromNode, to: neighborNode, edge, warmth }],
        });
      }
    }

    return results.sort((a, b) => b.warmth - a.warmth).slice(0, maxResults);
  }

  /**
   * For a given target contact, find the best path from ANY source node
   * in `sourceIds` (usually: user + all team members).
   */
  findBestPathToContact(sourceIds: string[], targetId: string, maxHops = 3): ComputedPath | null {
    let best: ComputedPath | null = null;

    for (const sourceId of sourceIds) {
      const paths = this.findPaths(sourceId, targetId, maxHops, 1);
      if (paths.length > 0 && (!best || paths[0].warmth > best.warmth)) {
        best = paths[0];
      }
    }

    return best;
  }
}

// ─── Path Explanation Builder ─────────────────────────────────────────────────

function buildExplanation(nodes: GraphNode[], edges: ComputedPathEdge[]): string {
  if (edges.length === 0) return "Direct connection.";

  const parts: string[] = [];

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const relLabel = e.edge.relationship_type.replace(/_/g, " ");
    if (i === 0 && nodes[0].type === "user") {
      parts.push(`${nodes[0].name} → ${e.to.name} via ${relLabel}`);
    } else {
      parts.push(`${e.from.name} → ${e.to.name} via ${relLabel}`);
    }
  }

  return parts.join(" → ");
}

// ─── Factory: build graph from demo data ─────────────────────────────────────

export function buildRelationshipGraph(
  edges: RelationshipEdge[],
  teamNodes?: GraphNode[],
): RelationshipGraph {
  const graph = new RelationshipGraph();

  // Add all team nodes explicitly so they show up even without edges
  if (teamNodes) {
    for (const node of teamNodes) graph.addNode(node);
  }

  for (const edge of edges) {
    graph.addEdge(edge, true);
  }

  return graph;
}
