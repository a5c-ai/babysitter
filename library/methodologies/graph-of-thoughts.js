/**
 * @process methodologies/graph-of-thoughts
 * @description Graph of Thoughts - Explore solution space as a graph with branching, merging, and backtracking
 * @inputs { task: string, explorationDepth: number, branchingFactor: number, evaluationCriteria: array }
 * @outputs { success: boolean, solutionPath: array, explorationGraph: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Graph of Thoughts Process
 *
 * Methodology: Build directed graph of thought → Branch at decision points → Evaluate branches → Prune weak paths → Merge strong paths → Find optimal solution
 *
 * This process implements graph-based exploration where:
 * 1. Start with initial thought/approach node
 * 2. At each step, generate multiple branches (alternative approaches)
 * 3. Evaluate each branch independently
 * 4. Prune low-scoring branches
 * 5. Allow branches to merge when they converge to similar solutions
 * 6. Support backtracking to explore alternative paths
 * 7. Navigate the graph to find the optimal solution path
 *
 * Key differences from tree-of-thoughts:
 * - Nodes can have multiple parents (merging)
 * - Can revisit nodes (cycles allowed for iterative refinement)
 * - More flexible navigation (not just depth-first or breadth-first)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to solve
 * @param {number} inputs.explorationDepth - Maximum depth to explore (default: 4)
 * @param {number} inputs.branchingFactor - Number of branches per node (default: 3)
 * @param {number} inputs.pruningThreshold - Score below which to prune branches (default: 40)
 * @param {Array<string>} inputs.evaluationCriteria - Criteria for evaluating branches
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with solution path and full graph
 */
export async function process(inputs, ctx) {
  const {
    task,
    explorationDepth = 4,
    branchingFactor = 3,
    pruningThreshold = 40,
    evaluationCriteria = ['Feasibility', 'Quality', 'Efficiency', 'Completeness']
  } = inputs;

  // Initialize graph structure
  const graph = {
    nodes: new Map(),
    edges: [],
    metrics: {
      totalNodes: 0,
      prunedNodes: 0,
      mergedNodes: 0,
      backtrackCount: 0
    }
  };

  // Create root node
  const rootNode = await ctx.task(agentGenerateThoughtTask, {
    task,
    parentThoughts: [],
    depth: 0,
    context: 'initial exploration'
  });

  const rootId = 'node-0';
  graph.nodes.set(rootId, {
    id: rootId,
    depth: 0,
    thought: rootNode,
    score: null,
    children: [],
    parents: [],
    pruned: false
  });
  graph.metrics.totalNodes++;

  // Exploration queue (BFS with scoring)
  const explorationQueue = [{ nodeId: rootId, depth: 0 }];
  const completeSolutionNodes = [];

  // Graph exploration loop
  while (explorationQueue.length > 0) {
    // Sort queue by node score (explore promising branches first)
    explorationQueue.sort((a, b) => {
      const scoreA = graph.nodes.get(a.nodeId).score || 50;
      const scoreB = graph.nodes.get(b.nodeId).score || 50;
      return scoreB - scoreA;
    });

    const current = explorationQueue.shift();
    const currentNode = graph.nodes.get(current.nodeId);

    // Skip pruned nodes
    if (currentNode.pruned) continue;

    // Check if we've reached exploration depth
    if (current.depth >= explorationDepth) {
      // Evaluate if this is a complete solution
      const isSolution = await ctx.task(agentEvaluateSolutionTask, {
        task,
        thoughtPath: getPathToNode(graph, current.nodeId),
        evaluationCriteria
      });

      if (isSolution.isComplete) {
        completeSolutionNodes.push({
          nodeId: current.nodeId,
          score: isSolution.score,
          path: getPathToNode(graph, current.nodeId)
        });
      }
      continue;
    }

    // Generate branches from current node
    const branches = await ctx.task(agentGenerateBranchesTask, {
      task,
      currentThought: currentNode.thought,
      parentPath: getPathToNode(graph, current.nodeId),
      branchingFactor,
      depth: current.depth + 1
    });

    // Process each branch
    for (let i = 0; i < branches.branches.length; i++) {
      const branch = branches.branches[i];
      const newNodeId = `node-${graph.metrics.totalNodes}`;

      // Check for merge opportunity (similar to existing nodes)
      const similarNode = findSimilarNode(graph, branch, current.depth + 1);

      if (similarNode) {
        // Merge: add edge to existing node
        graph.edges.push({
          from: current.nodeId,
          to: similarNode.id,
          type: 'merge'
        });
        similarNode.parents.push(current.nodeId);
        currentNode.children.push(similarNode.id);
        graph.metrics.mergedNodes++;
      } else {
        // Create new node
        const newNode = {
          id: newNodeId,
          depth: current.depth + 1,
          thought: branch,
          score: null,
          children: [],
          parents: [current.nodeId],
          pruned: false
        };

        graph.nodes.set(newNodeId, newNode);
        graph.metrics.totalNodes++;

        graph.edges.push({
          from: current.nodeId,
          to: newNodeId,
          type: 'branch'
        });
        currentNode.children.push(newNodeId);

        // Evaluate the branch
        const evaluation = await ctx.task(agentEvaluateThoughtTask, {
          task,
          thought: branch,
          thoughtPath: getPathToNode(graph, newNodeId),
          evaluationCriteria
        });

        newNode.score = evaluation.score;
        newNode.evaluation = evaluation;

        // Prune if below threshold
        if (evaluation.score < pruningThreshold) {
          newNode.pruned = true;
          newNode.pruneReason = evaluation.weaknesses.join('; ');
          graph.metrics.prunedNodes++;
        } else {
          // Add to exploration queue
          explorationQueue.push({
            nodeId: newNodeId,
            depth: current.depth + 1
          });
        }
      }
    }

    // Optional: Backtrack if all children pruned and parent has unexplored siblings
    if (currentNode.children.every(childId => graph.nodes.get(childId).pruned)) {
      if (currentNode.parents.length > 0 && current.depth > 0) {
        const parent = graph.nodes.get(currentNode.parents[0]);
        const unexploredSiblings = parent.children.filter(siblingId => {
          const sibling = graph.nodes.get(siblingId);
          return !sibling.pruned && sibling.children.length === 0;
        });

        if (unexploredSiblings.length > 0) {
          explorationQueue.unshift({
            nodeId: unexploredSiblings[0],
            depth: current.depth
          });
          graph.metrics.backtrackCount++;
        }
      }
    }
  }

  // Select best solution path
  let bestSolution = null;
  if (completeSolutionNodes.length > 0) {
    bestSolution = completeSolutionNodes.reduce((best, curr) =>
      curr.score > best.score ? curr : best
    );
  } else {
    // No complete solution found - select highest scoring leaf node
    const leafNodes = Array.from(graph.nodes.values())
      .filter(n => !n.pruned && n.children.length === 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    if (leafNodes.length > 0) {
      bestSolution = {
        nodeId: leafNodes[0].id,
        score: leafNodes[0].score || 0,
        path: getPathToNode(graph, leafNodes[0].id),
        incomplete: true
      };
    }
  }

  return {
    success: bestSolution !== null && !bestSolution.incomplete,
    task,
    solutionPath: bestSolution?.path || [],
    bestScore: bestSolution?.score || 0,
    explorationGraph: {
      nodes: Array.from(graph.nodes.values()),
      edges: graph.edges,
      metrics: graph.metrics
    },
    alternativePaths: completeSolutionNodes.slice(0, 3),
    summary: {
      totalNodesExplored: graph.metrics.totalNodes,
      nodesPruned: graph.metrics.prunedNodes,
      nodesMerged: graph.metrics.mergedNodes,
      backtrackCount: graph.metrics.backtrackCount,
      completeSolutions: completeSolutionNodes.length,
      bestScore: bestSolution?.score || 0
    },
    metadata: {
      processId: 'methodologies/graph-of-thoughts',
      timestamp: ctx.now()
    }
  };
}

/**
 * Helper: Get path from root to node
 */
function getPathToNode(graph, nodeId) {
  const path = [];
  let currentId = nodeId;

  while (currentId) {
    const node = graph.nodes.get(currentId);
    path.unshift(node.thought);
    currentId = node.parents[0]; // Follow first parent (primary path)
  }

  return path;
}

/**
 * Helper: Find similar existing node (for merging)
 */
function findSimilarNode(graph, newThought, depth) {
  const nodesAtDepth = Array.from(graph.nodes.values())
    .filter(n => n.depth === depth && !n.pruned);

  // Simplified similarity check (in real implementation, use embedding similarity)
  for (const node of nodesAtDepth) {
    const similarity = calculateSimilarity(node.thought, newThought);
    if (similarity > 0.85) {
      return node;
    }
  }

  return null;
}

/**
 * Helper: Calculate thought similarity (simplified)
 */
function calculateSimilarity(thought1, thought2) {
  // Simplified: check for key overlapping concepts
  // In real implementation: use embeddings or semantic similarity
  const str1 = JSON.stringify(thought1).toLowerCase();
  const str2 = JSON.stringify(thought2).toLowerCase();

  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Generate initial thought or refinement
 */
export const agentGenerateThoughtTask = defineTask('agent-generate-thought', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate thought - Depth ${args.depth}`,
  description: 'Generate initial approach or thought',

  agent: {
    name: 'thought-generator',
    prompt: {
      role: 'creative problem solver',
      task: 'Generate a thought/approach for the task',
      context: {
        task: args.task,
        parentThoughts: args.parentThoughts,
        depth: args.depth,
        context: args.context
      },
      instructions: [
        'Analyze the task and parent thoughts',
        'Generate a clear, specific approach or thought',
        'Be creative but grounded in feasibility',
        'Consider different angles and perspectives',
        'Provide rationale for this approach'
      ],
      outputFormat: 'JSON with approach, description, rationale, and key decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'description', 'rationale'],
      properties: {
        approach: { type: 'string' },
        description: { type: 'string' },
        rationale: { type: 'string' },
        keyDecisions: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'graph-of-thoughts', 'generate', `depth-${args.depth}`]
}));

/**
 * Generate branches from current thought
 */
export const agentGenerateBranchesTask = defineTask('agent-generate-branches', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate ${args.branchingFactor} branches - Depth ${args.depth}`,
  description: 'Explore alternative paths from current thought',

  agent: {
    name: 'branch-generator',
    prompt: {
      role: 'divergent thinker',
      task: `Generate ${args.branchingFactor} distinct alternative approaches`,
      context: {
        task: args.task,
        currentThought: args.currentThought,
        parentPath: args.parentPath,
        branchingFactor: args.branchingFactor,
        depth: args.depth
      },
      instructions: [
        `Generate exactly ${args.branchingFactor} different approaches`,
        'Each branch should explore a distinct direction',
        'Consider trade-offs and alternatives',
        'Think divergently - explore the solution space',
        'Make each branch concrete and actionable'
      ],
      outputFormat: `JSON with array of ${args.branchingFactor} branches`
    },
    outputSchema: {
      type: 'object',
      required: ['branches'],
      properties: {
        branches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' },
              keyDecisions: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'graph-of-thoughts', 'branch', `depth-${args.depth}`]
}));

/**
 * Evaluate thought quality
 */
export const agentEvaluateThoughtTask = defineTask('agent-evaluate-thought', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate thought',
  description: 'Score thought against evaluation criteria',

  agent: {
    name: 'thought-evaluator',
    prompt: {
      role: 'critical evaluator',
      task: 'Evaluate the thought against criteria',
      context: {
        task: args.task,
        thought: args.thought,
        thoughtPath: args.thoughtPath,
        evaluationCriteria: args.evaluationCriteria
      },
      instructions: [
        'Evaluate the thought objectively',
        'Score against each criterion (0-100)',
        'Calculate overall score',
        'Identify strengths and weaknesses',
        'Be critical but fair'
      ],
      outputFormat: 'JSON with scores, overall score, strengths, and weaknesses'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'score', 'strengths', 'weaknesses'],
      properties: {
        scores: { type: 'object', additionalProperties: { type: 'number' } },
        score: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'graph-of-thoughts', 'evaluate']
}));

/**
 * Evaluate if thought path is complete solution
 */
export const agentEvaluateSolutionTask = defineTask('agent-evaluate-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate solution completeness',
  description: 'Determine if thought path solves the task',

  agent: {
    name: 'solution-evaluator',
    prompt: {
      role: 'solution validator',
      task: 'Determine if the thought path represents a complete solution',
      context: {
        task: args.task,
        thoughtPath: args.thoughtPath,
        evaluationCriteria: args.evaluationCriteria
      },
      instructions: [
        'Review the entire thought path',
        'Determine if it completely solves the task',
        'Check against all criteria',
        'Assign a completeness score',
        'Identify any gaps or missing elements'
      ],
      outputFormat: 'JSON with isComplete, score, and gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['isComplete', 'score'],
      properties: {
        isComplete: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'graph-of-thoughts', 'solution']
}));
