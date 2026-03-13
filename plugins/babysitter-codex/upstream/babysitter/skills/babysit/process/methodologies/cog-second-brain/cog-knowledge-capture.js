/**
 * @process methodologies/cog-second-brain/cog-knowledge-capture
 * @description COG Second Brain - Knowledge capture: braindump, URL dump, meeting transcript processing
 * @inputs { vaultPath: string, captureType: string, content?: string, urls?: array, transcriptPath?: string, targetQuality?: number }
 * @outputs { success: boolean, captured: object, classifications: array, artifacts: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * COG Knowledge Capture Process
 *
 * Adapted from COG Second Brain (https://github.com/huytieu/COG-second-brain)
 * Handles three capture modes:
 * 1. Braindump - Raw thought capture with automatic classification
 * 2. URL Dump - Save URLs with auto-extracted insights
 * 3. Meeting Transcript - Process recordings into structured decisions
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.vaultPath - Path to COG vault
 * @param {string} inputs.captureType - Type: 'braindump', 'url-dump', 'meeting-transcript'
 * @param {string} inputs.content - Raw content for braindump mode
 * @param {Array<string>} inputs.urls - URLs for url-dump mode
 * @param {string} inputs.transcriptPath - Path to meeting recording/transcript
 * @param {string} inputs.meetingTitle - Meeting title (for transcript mode)
 * @param {Array<string>} inputs.participants - Meeting participants (for transcript mode)
 * @param {number} inputs.targetQuality - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Capture results with classifications
 */
export async function process(inputs, ctx) {
  const {
    vaultPath,
    captureType,
    content = '',
    urls = [],
    transcriptPath = null,
    meetingTitle = 'Untitled Meeting',
    participants = [],
    targetQuality = 80
  } = inputs;

  const results = {
    captureType,
    captured: {},
    classifications: [],
    artifacts: {}
  };

  ctx.log('Starting knowledge capture', { captureType, vaultPath });

  // ============================================================================
  // BRAINDUMP MODE
  // ============================================================================

  if (captureType === 'braindump') {
    ctx.log('Processing braindump capture');

    // Step 1: Classify raw content by domain
    const classification = await ctx.task(classifyContentTask, {
      content,
      vaultPath
    });

    results.classifications = classification.domains;

    // Step 2: Route classified items to vault directories in parallel
    const routingTasks = classification.domains.map((domain) =>
      ctx.task(routeToVaultTask, {
        content: domain.content,
        domain: domain.name,
        vaultPath,
        metadata: domain.metadata
      })
    );

    const routingResults = await ctx.parallel.all(routingTasks);

    results.captured.braindump = {
      totalItems: classification.domains.length,
      routed: routingResults,
      domainBreakdown: classification.domains.map((d) => ({
        domain: d.name,
        itemCount: d.items?.length || 1,
        confidence: d.confidence
      }))
    };

    // Step 3: Extract and queue URLs found in braindump
    if (classification.extractedUrls && classification.extractedUrls.length > 0) {
      const urlResults = await ctx.task(extractUrlInsightsTask, {
        urls: classification.extractedUrls,
        vaultPath,
        targetQuality
      });

      results.captured.extractedUrls = urlResults;
    }

    // Quality gate
    const qualityCheck = await ctx.task(assessCaptureQualityTask, {
      captureType: 'braindump',
      results: results.captured.braindump,
      targetQuality
    });

    let qualityScore = qualityCheck.score;
    let iteration = 0;

    while (qualityScore < targetQuality && iteration < 3) {
      ctx.log('Braindump quality below threshold, refining', {
        current: qualityScore,
        target: targetQuality
      });

      const refined = await ctx.task(refineCaptureTask, {
        captureType: 'braindump',
        previousResults: results.captured.braindump,
        qualityFeedback: qualityCheck.feedback,
        vaultPath,
        targetQuality
      });

      results.captured.braindump = refined;
      qualityScore = refined.qualityScore || qualityScore + 10;
      iteration++;
    }

    ctx.log('Braindump capture complete', {
      domains: results.classifications.length,
      qualityScore
    });
  }

  // ============================================================================
  // URL DUMP MODE
  // ============================================================================

  if (captureType === 'url-dump') {
    ctx.log('Processing URL dump capture', { urlCount: urls.length });

    // Process all URLs in parallel for insight extraction
    const urlTasks = urls.map((url) =>
      ctx.task(extractUrlInsightsTask, {
        urls: [url],
        vaultPath,
        targetQuality
      })
    );

    const urlResults = await ctx.parallel.all(urlTasks);

    // Classify and route extracted insights
    const classifiedInsights = await ctx.task(classifyUrlInsightsTask, {
      urlResults,
      vaultPath
    });

    results.captured.urlDump = {
      totalUrls: urls.length,
      processed: urlResults,
      classifications: classifiedInsights.domains
    };

    // Route to appropriate vault sections
    const routeTasks = classifiedInsights.domains.map((domain) =>
      ctx.task(routeToVaultTask, {
        content: domain.content,
        domain: domain.name,
        vaultPath,
        metadata: { ...domain.metadata, sourceType: 'url-extraction' }
      })
    );

    await ctx.parallel.all(routeTasks);

    ctx.log('URL dump capture complete', {
      urlsProcessed: urls.length,
      insightsExtracted: classifiedInsights.totalInsights
    });
  }

  // ============================================================================
  // MEETING TRANSCRIPT MODE
  // ============================================================================

  if (captureType === 'meeting-transcript') {
    ctx.log('Processing meeting transcript', { meetingTitle, participants });

    // Step 1: Process transcript into structured data
    const transcriptResult = await ctx.task(processTranscriptTask, {
      transcriptPath,
      meetingTitle,
      participants,
      vaultPath
    });

    // Step 2: Extract decisions and action items in parallel
    const [decisions, actionItems, teamDynamics] = await ctx.parallel.all([
      ctx.task(extractDecisionsTask, {
        transcript: transcriptResult,
        vaultPath
      }),
      ctx.task(extractActionItemsTask, {
        transcript: transcriptResult,
        participants,
        vaultPath
      }),
      ctx.task(analyzeTeamDynamicsTask, {
        transcript: transcriptResult,
        participants,
        vaultPath
      })
    ]);

    results.captured.meetingTranscript = {
      meetingTitle,
      participants,
      decisions: decisions.items,
      actionItems: actionItems.items,
      teamDynamics: teamDynamics.analysis,
      summary: transcriptResult.summary
    };

    // Human review gate for meeting outputs
    await ctx.breakpoint({
      title: 'Review Meeting Processing Results',
      description: `Meeting "${meetingTitle}" processed. Review decisions (${decisions.items?.length || 0}), action items (${actionItems.items?.length || 0}), and team dynamics analysis.`,
      context: results.captured.meetingTranscript
    });

    // Route meeting artifacts to vault
    await ctx.task(routeToVaultTask, {
      content: results.captured.meetingTranscript,
      domain: 'professional',
      vaultPath,
      metadata: {
        type: 'meeting-transcript',
        meetingTitle,
        date: new Date().toISOString(),
        participants
      }
    });

    ctx.log('Meeting transcript processing complete', {
      decisions: decisions.items?.length || 0,
      actionItems: actionItems.items?.length || 0
    });
  }

  results.success = true;
  return results;
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

const classifyContentTask = defineTask('cog-classify-content', {
  kind: 'agent',
  title: 'Classify Raw Content by Domain',
  labels: ['cog', 'capture', 'classification'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Classify raw braindump content into domains: personal, professional, project-specific',
    'Extract embedded URLs for separate processing',
    'Assign confidence levels to each classification',
    'Maintain strict domain separation',
    'Tag with metadata: date, domain, confidence, topics'
  ]
});

const routeToVaultTask = defineTask('cog-route-to-vault', {
  kind: 'agent',
  title: 'Route Content to Vault Directory',
  labels: ['cog', 'capture', 'routing'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'object' },
        domain: { type: 'string' },
        vaultPath: { type: 'string' },
        metadata: { type: 'object' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Route content to the appropriate vault directory based on domain:',
    '  personal -> 02-personal/',
    '  professional -> 03-professional/',
    '  project -> 04-projects/<project-name>/',
    '  knowledge -> 05-knowledge/',
    'Create markdown file with proper frontmatter and cross-references',
    'Ensure pure markdown format with no vendor lock-in',
    'Update cross-reference index'
  ]
});

const extractUrlInsightsTask = defineTask('cog-extract-url-insights', {
  kind: 'agent',
  title: 'Extract Insights from URLs',
  labels: ['cog', 'capture', 'url', 'extraction'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        urls: { type: 'array', items: { type: 'string' } },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Fetch and analyze each URL for key insights',
    'Extract: title, summary, key takeaways, relevant quotes',
    'Classify domain relevance and tag appropriately',
    'Verify source credibility and assign confidence level',
    'Store extracted insights in markdown format',
    'Include original URL as source attribution'
  ]
});

const classifyUrlInsightsTask = defineTask('cog-classify-url-insights', {
  kind: 'agent',
  title: 'Classify URL-Extracted Insights',
  labels: ['cog', 'capture', 'url', 'classification'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        urlResults: { type: 'array' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Classify extracted URL insights by domain and topic',
    'Group related insights for routing',
    'Identify potential connections to existing vault knowledge',
    'Output domain-classified content ready for vault routing'
  ]
});

const processTranscriptTask = defineTask('cog-process-transcript', {
  kind: 'agent',
  title: 'Process Meeting Transcript',
  labels: ['cog', 'capture', 'meeting', 'transcript'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        transcriptPath: { type: 'string' },
        meetingTitle: { type: 'string' },
        participants: { type: 'array' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/meeting-analyst'
  },
  instructions: [
    'Parse meeting transcript or recording',
    'Identify speakers and map to participants',
    'Generate executive summary',
    'Segment transcript into topics and discussion threads',
    'Flag key moments: decisions, disagreements, action commitments'
  ]
});

const extractDecisionsTask = defineTask('cog-extract-decisions', {
  kind: 'agent',
  title: 'Extract Meeting Decisions',
  labels: ['cog', 'capture', 'meeting', 'decisions'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        transcript: { type: 'object' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/meeting-analyst'
  },
  instructions: [
    'Extract all decisions made during the meeting',
    'Include context, rationale, and stakeholders for each decision',
    'Assign confidence level to decision extraction',
    'Link decisions to relevant projects in 04-projects/'
  ]
});

const extractActionItemsTask = defineTask('cog-extract-action-items', {
  kind: 'agent',
  title: 'Extract Meeting Action Items',
  labels: ['cog', 'capture', 'meeting', 'actions'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        transcript: { type: 'object' },
        participants: { type: 'array' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/meeting-analyst'
  },
  instructions: [
    'Extract all action items and commitments',
    'Assign owners from participant list',
    'Set priority and estimated due dates where mentioned',
    'Link to relevant projects and existing tasks'
  ]
});

const analyzeTeamDynamicsTask = defineTask('cog-analyze-team-dynamics', {
  kind: 'agent',
  title: 'Analyze Meeting Team Dynamics',
  labels: ['cog', 'capture', 'meeting', 'dynamics'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        transcript: { type: 'object' },
        participants: { type: 'array' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Analyze team dynamics from meeting transcript',
    'Identify engagement levels per participant',
    'Detect alignment and disagreement patterns',
    'Note communication style and collaboration quality',
    'Provide actionable suggestions for team improvement'
  ]
});

const assessCaptureQualityTask = defineTask('cog-assess-capture-quality', {
  kind: 'agent',
  title: 'Assess Capture Quality',
  labels: ['cog', 'capture', 'quality'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        captureType: { type: 'string' },
        results: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Assess quality of captured content against target threshold',
    'Check classification accuracy and completeness',
    'Verify domain separation is strict',
    'Evaluate metadata completeness',
    'Return score and specific feedback for improvement'
  ]
});

const refineCaptureTask = defineTask('cog-refine-capture', {
  kind: 'agent',
  title: 'Refine Capture Quality',
  labels: ['cog', 'capture', 'refinement'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        captureType: { type: 'string' },
        previousResults: { type: 'object' },
        qualityFeedback: { type: 'object' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Address quality feedback from previous assessment',
    'Improve classification accuracy where flagged',
    'Enhance metadata completeness',
    'Strengthen cross-references',
    'Re-score and return improved results'
  ]
});
