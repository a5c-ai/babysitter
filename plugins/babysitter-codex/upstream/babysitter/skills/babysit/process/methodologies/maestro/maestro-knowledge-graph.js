/**
 * @process methodologies/maestro/maestro-knowledge-graph
 * @description Maestro Knowledge Graph - Knowledge management: capture patterns, validate updates, sync across stories, query architectural decisions
 * @inputs { projectRoot?: string, operation?: string, query?: string, newPatterns?: array, newDecisions?: array }
 * @outputs { success: boolean, graph: object, queryResults?: array, validationResults?: object, syncReport?: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const loadGraphTask = defineTask('maestro-kg-load', async (args, _ctx) => {
  return { graph: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Load and Parse Knowledge Graph',
  labels: ['maestro', 'knowledge-graph', 'load'],
  io: {
    inputs: { projectRoot: 'string', graphPath: 'string' },
    outputs: { graph: 'object', nodes: 'array', edges: 'array', patterns: 'array', decisions: 'array', version: 'number' }
  }
});

const capturePatternTask = defineTask('maestro-kg-capture-pattern', async (args, _ctx) => {
  return { pattern: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Capture Architectural Pattern',
  labels: ['maestro', 'knowledge-graph', 'capture'],
  io: {
    inputs: { patternName: 'string', description: 'string', context: 'object', examples: 'array', relatedDecisions: 'array' },
    outputs: { patternNode: 'object', edges: 'array', validated: 'boolean', conflicts: 'array' }
  }
});

const captureDecisionTask = defineTask('maestro-kg-capture-decision', async (args, _ctx) => {
  return { decision: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Record Architectural Decision',
  labels: ['maestro', 'knowledge-graph', 'decision'],
  io: {
    inputs: { title: 'string', context: 'string', decision: 'string', rationale: 'string', alternatives: 'array', consequences: 'array' },
    outputs: { decisionNode: 'object', adrId: 'string', edges: 'array', supersedes: 'array' }
  }
});

const validateGraphTask = defineTask('maestro-kg-validate', async (args, _ctx) => {
  return { validation: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Validate Graph Consistency',
  labels: ['maestro', 'knowledge-graph', 'validation'],
  io: {
    inputs: { graph: 'object', codebaseState: 'object', projectRoot: 'string' },
    outputs: { isValid: 'boolean', staleNodes: 'array', brokenEdges: 'array', conflictingDecisions: 'array', orphanedPatterns: 'array', healthScore: 'number' }
  }
});

const queryGraphTask = defineTask('maestro-kg-query', async (args, _ctx) => {
  return { results: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Query Knowledge Graph',
  labels: ['maestro', 'knowledge-graph', 'query'],
  io: {
    inputs: { graph: 'object', query: 'string', queryType: 'string' },
    outputs: { results: 'array', relevantPatterns: 'array', relatedDecisions: 'array', confidence: 'number' }
  }
});

const syncGraphTask = defineTask('maestro-kg-sync', async (args, _ctx) => {
  return { sync: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Sync Graph with Codebase Reality',
  labels: ['maestro', 'knowledge-graph', 'sync'],
  io: {
    inputs: { graph: 'object', projectRoot: 'string', recentChanges: 'array' },
    outputs: { updatedGraph: 'object', addedNodes: 'array', removedNodes: 'array', updatedEdges: 'array', syncScore: 'number' }
  }
});

const exportGraphTask = defineTask('maestro-kg-export', async (args, _ctx) => {
  return { export: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Export Knowledge Graph to DOT Format',
  labels: ['maestro', 'knowledge-graph', 'export'],
  io: {
    inputs: { graph: 'object', outputPath: 'string', format: 'string' },
    outputs: { exported: 'boolean', filePath: 'string', nodeCount: 'number', edgeCount: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Maestro Knowledge Graph Process
 *
 * Manages the .maestro/knowledge.dot knowledge graph that captures
 * architectural patterns, design decisions, and institutional memory.
 *
 * Operations:
 * - capture: Add new patterns and decisions
 * - validate: Check graph consistency against codebase
 * - query: Search for relevant patterns and decisions
 * - sync: Update graph to match codebase reality
 * - full-cycle: Run all operations in sequence
 *
 * The knowledge graph uses DOT format and records:
 * - Architectural patterns discovered during development
 * - Design decisions (ADR-style) with rationale
 * - Relationships between patterns, decisions, and code
 * - Institutional memory from completed stories
 *
 * Attribution: Adapted from https://github.com/SnapdragonPartners/maestro
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectRoot - Project root (default: '.')
 * @param {string} inputs.operation - Operation: capture|validate|query|sync|full-cycle
 * @param {string} inputs.query - Query string (for query operation)
 * @param {Array} inputs.newPatterns - Patterns to capture
 * @param {Array} inputs.newDecisions - Decisions to record
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Knowledge graph operation results
 */
export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    operation = 'full-cycle',
    query = '',
    newPatterns = [],
    newDecisions = []
  } = inputs;

  ctx.log('Maestro Knowledge Graph: Starting operation', { operation });

  // ============================================================================
  // STEP 1: LOAD EXISTING GRAPH
  // ============================================================================

  ctx.log('Step 1: Loading knowledge graph');

  const loadResult = await ctx.task(loadGraphTask, {
    projectRoot,
    graphPath: '.maestro/knowledge.dot'
  });

  let currentGraph = loadResult.graph;

  // ============================================================================
  // STEP 2: EXECUTE OPERATION
  // ============================================================================

  let queryResults = null;
  let validationResults = null;
  let syncReport = null;

  if (operation === 'capture' || operation === 'full-cycle') {
    ctx.log('Capturing patterns and decisions');

    // Capture patterns in parallel
    if (newPatterns.length > 0) {
      const patternResults = await ctx.parallel.all(
        newPatterns.map(p => ctx.task(capturePatternTask, {
          patternName: p.name,
          description: p.description,
          context: p.context || {},
          examples: p.examples || [],
          relatedDecisions: p.relatedDecisions || []
        }))
      );

      for (const pr of patternResults) {
        if (pr.validated && pr.conflicts.length === 0) {
          currentGraph = { ...currentGraph, patterns: [...(currentGraph.patterns || []), pr.patternNode] };
        } else if (pr.conflicts.length > 0) {
          await ctx.breakpoint({
            question: `Pattern "${pr.patternNode?.name}" conflicts with existing entries: ${pr.conflicts.join(', ')}. Resolve conflicts.`,
            title: 'Knowledge Graph Conflict',
            context: { runId: ctx.runId }
          });
        }
      }
    }

    // Capture decisions in parallel
    if (newDecisions.length > 0) {
      const decisionResults = await ctx.parallel.all(
        newDecisions.map(d => ctx.task(captureDecisionTask, {
          title: d.title,
          context: d.context,
          decision: d.decision,
          rationale: d.rationale,
          alternatives: d.alternatives || [],
          consequences: d.consequences || []
        }))
      );

      for (const dr of decisionResults) {
        currentGraph = { ...currentGraph, decisions: [...(currentGraph.decisions || []), dr.decisionNode] };
      }
    }
  }

  if (operation === 'validate' || operation === 'full-cycle') {
    ctx.log('Validating graph consistency');

    validationResults = await ctx.task(validateGraphTask, {
      graph: currentGraph,
      codebaseState: {},
      projectRoot
    });

    if (!validationResults.isValid) {
      ctx.log('Graph validation failed', {
        staleNodes: validationResults.staleNodes.length,
        brokenEdges: validationResults.brokenEdges.length,
        conflicts: validationResults.conflictingDecisions.length
      });
    }
  }

  if (operation === 'query') {
    ctx.log('Querying knowledge graph', { query });

    queryResults = await ctx.task(queryGraphTask, {
      graph: currentGraph,
      query,
      queryType: 'semantic'
    });
  }

  if (operation === 'sync' || operation === 'full-cycle') {
    ctx.log('Syncing graph with codebase');

    const syncResult = await ctx.task(syncGraphTask, {
      graph: currentGraph,
      projectRoot,
      recentChanges: []
    });

    syncReport = {
      addedNodes: syncResult.addedNodes.length,
      removedNodes: syncResult.removedNodes.length,
      updatedEdges: syncResult.updatedEdges.length,
      syncScore: syncResult.syncScore
    };

    currentGraph = syncResult.updatedGraph || currentGraph;
  }

  // ============================================================================
  // STEP 3: EXPORT
  // ============================================================================

  ctx.log('Exporting updated knowledge graph');

  const exportResult = await ctx.task(exportGraphTask, {
    graph: currentGraph,
    outputPath: '.maestro/knowledge.dot',
    format: 'dot'
  });

  return {
    success: true,
    operation,
    graph: {
      nodeCount: exportResult.nodeCount,
      edgeCount: exportResult.edgeCount,
      patternCount: currentGraph.patterns?.length || 0,
      decisionCount: currentGraph.decisions?.length || 0
    },
    queryResults: queryResults?.results || null,
    validationResults: validationResults ? {
      isValid: validationResults.isValid,
      healthScore: validationResults.healthScore,
      staleNodes: validationResults.staleNodes.length,
      conflicts: validationResults.conflictingDecisions.length
    } : null,
    syncReport,
    exported: exportResult.exported,
    metadata: {
      processId: 'methodologies/maestro/maestro-knowledge-graph',
      attribution: 'https://github.com/SnapdragonPartners/maestro',
      author: 'SnapdragonPartners',
      license: 'MIT',
      timestamp: ctx.now()
    }
  };
}
