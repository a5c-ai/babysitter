/**
 * @process specializations/security-research/threat-intelligence-research
 * @description Collection and analysis of threat intelligence including APT tracking, malware campaigns,
 * TTPs analysis, and IOC generation. Produces actionable intelligence for defensive operations using
 * MITRE ATT&CK mapping and STIX/TAXII standards.
 * @inputs { projectName: string, researchFocus: string, sources?: array }
 * @outputs { success: boolean, intelligence: object, iocs: array, ttps: array, threatReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/threat-intelligence-research', {
 *   projectName: 'APT29 Campaign Analysis',
 *   researchFocus: 'apt-tracking',
 *   sources: ['osint', 'malware-samples', 'incident-reports']
 * });
 *
 * @references
 * - MITRE ATT&CK: https://attack.mitre.org/
 * - STIX: https://oasis-open.github.io/cti-documentation/stix/intro
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    researchFocus,
    sources = ['osint', 'technical-reports'],
    outputFormat = 'stix',
    outputDir = 'threat-intel-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const iocs = [];
  const ttps = [];

  ctx.log('info', `Starting Threat Intelligence Research for ${projectName}`);
  ctx.log('info', `Focus: ${researchFocus}`);

  // ============================================================================
  // PHASE 1: SOURCE COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting intelligence from sources');

  const collection = await ctx.task(sourceCollectionTask, {
    projectName,
    researchFocus,
    sources,
    outputDir
  });

  artifacts.push(...collection.artifacts);

  // ============================================================================
  // PHASE 2: MALWARE ANALYSIS (if applicable)
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing malware samples');

  const malwareIntel = await ctx.task(malwareIntelTask, {
    projectName,
    collection,
    outputDir
  });

  iocs.push(...malwareIntel.iocs);
  artifacts.push(...malwareIntel.artifacts);

  // ============================================================================
  // PHASE 3: TTP EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Extracting TTPs and mapping to ATT&CK');

  const ttpExtraction = await ctx.task(ttpExtractionTask, {
    projectName,
    collection,
    malwareIntel,
    outputDir
  });

  ttps.push(...ttpExtraction.ttps);
  artifacts.push(...ttpExtraction.artifacts);

  // ============================================================================
  // PHASE 4: IOC GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating indicators of compromise');

  const iocGeneration = await ctx.task(iocGenerationTask, {
    projectName,
    collection,
    malwareIntel,
    outputDir
  });

  iocs.push(...iocGeneration.iocs);
  artifacts.push(...iocGeneration.artifacts);

  // ============================================================================
  // PHASE 5: ATTRIBUTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing attribution analysis');

  const attribution = await ctx.task(attributionAnalysisTask, {
    projectName,
    ttpExtraction,
    iocGeneration,
    outputDir
  });

  artifacts.push(...attribution.artifacts);

  // ============================================================================
  // PHASE 6: INTELLIGENCE PRODUCT
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating threat intelligence product');

  const intelProduct = await ctx.task(intelProductTask, {
    projectName,
    collection,
    ttpExtraction,
    iocGeneration,
    attribution,
    outputFormat,
    outputDir
  });

  artifacts.push(...intelProduct.artifacts);

  await ctx.breakpoint({
    question: `Threat intelligence research complete. ${iocs.length} IOCs, ${ttps.length} TTPs identified. Review intelligence product?`,
    title: 'Threat Intel Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        focus: researchFocus,
        iocs: iocs.length,
        ttps: ttps.length,
        attribution: attribution.confidence
      },
      files: intelProduct.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    intelligence: {
      focus: researchFocus,
      attribution: attribution.assessment,
      confidence: attribution.confidence
    },
    iocs,
    ttps,
    threatReport: {
      reportPath: intelProduct.reportPath,
      stixBundle: intelProduct.stixBundle
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/threat-intelligence-research',
      timestamp: startTime,
      researchFocus,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const sourceCollectionTask = defineTask('source-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect Sources - ${args.projectName}`,
  agent: {
    name: 'threat-intel-analyst',
    prompt: {
      role: 'Threat Intelligence Collector',
      task: 'Collect intelligence from sources',
      context: args,
      instructions: [
        '1. Query OSINT sources',
        '2. Collect technical reports',
        '3. Gather malware samples',
        '4. Collect incident reports',
        '5. Query threat feeds',
        '6. Gather dark web intel',
        '7. Document source reliability',
        '8. Create collection report'
      ],
      outputFormat: 'JSON with collected intelligence'
    },
    outputSchema: {
      type: 'object',
      required: ['collectedData', 'sources', 'artifacts'],
      properties: {
        collectedData: { type: 'array' },
        sources: { type: 'array' },
        reliability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'threat-intel', 'collection']
}));

export const malwareIntelTask = defineTask('malware-intel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Malware Intelligence - ${args.projectName}`,
  agent: {
    name: 'threat-intel-analyst',
    prompt: {
      role: 'Malware Intelligence Analyst',
      task: 'Analyze malware for intelligence',
      context: args,
      instructions: [
        '1. Analyze collected samples',
        '2. Extract configuration',
        '3. Identify C2 infrastructure',
        '4. Extract embedded strings',
        '5. Identify malware family',
        '6. Document capabilities',
        '7. Extract IOCs',
        '8. Create malware intel report'
      ],
      outputFormat: 'JSON with malware intelligence'
    },
    outputSchema: {
      type: 'object',
      required: ['malwareFamilies', 'iocs', 'artifacts'],
      properties: {
        malwareFamilies: { type: 'array' },
        iocs: { type: 'array' },
        c2Infrastructure: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'threat-intel', 'malware']
}));

export const ttpExtractionTask = defineTask('ttp-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract TTPs - ${args.projectName}`,
  agent: {
    name: 'threat-intel-analyst',
    prompt: {
      role: 'TTP Extraction Analyst',
      task: 'Extract TTPs and map to ATT&CK',
      context: args,
      instructions: [
        '1. Identify tactics used',
        '2. Map to ATT&CK techniques',
        '3. Identify sub-techniques',
        '4. Document procedures',
        '5. Create attack patterns',
        '6. Identify tool signatures',
        '7. Map kill chain stages',
        '8. Create TTP report'
      ],
      outputFormat: 'JSON with TTPs'
    },
    outputSchema: {
      type: 'object',
      required: ['ttps', 'attackPatterns', 'artifacts'],
      properties: {
        ttps: { type: 'array' },
        attackPatterns: { type: 'array' },
        toolSignatures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'threat-intel', 'ttps']
}));

export const iocGenerationTask = defineTask('ioc-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate IOCs - ${args.projectName}`,
  agent: {
    name: 'threat-intel-analyst',
    prompt: {
      role: 'IOC Generation Specialist',
      task: 'Generate indicators of compromise',
      context: args,
      instructions: [
        '1. Compile all indicators',
        '2. Categorize by type',
        '3. Validate indicators',
        '4. Set confidence levels',
        '5. Add context',
        '6. Format in STIX',
        '7. Create detection rules',
        '8. Document IOC list'
      ],
      outputFormat: 'JSON with IOCs'
    },
    outputSchema: {
      type: 'object',
      required: ['iocs', 'stixIndicators', 'artifacts'],
      properties: {
        iocs: { type: 'array' },
        stixIndicators: { type: 'array' },
        detectionRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'threat-intel', 'iocs']
}));

export const attributionAnalysisTask = defineTask('attribution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Attribution Analysis - ${args.projectName}`,
  agent: {
    name: 'threat-intel-analyst',
    prompt: {
      role: 'Attribution Analysis Specialist',
      task: 'Perform attribution analysis',
      context: args,
      instructions: [
        '1. Analyze TTP overlap',
        '2. Compare infrastructure',
        '3. Analyze code similarities',
        '4. Check historical campaigns',
        '5. Assess victimology',
        '6. Consider false flags',
        '7. Assign confidence level',
        '8. Document attribution'
      ],
      outputFormat: 'JSON with attribution'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'confidence', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        confidence: { type: 'string' },
        threatActor: { type: 'string' },
        evidence: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'threat-intel', 'attribution']
}));

export const intelProductTask = defineTask('intel-product', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Intel Product - ${args.projectName}`,
  agent: {
    name: 'threat-intel-analyst',
    prompt: {
      role: 'Threat Intelligence Producer',
      task: 'Create threat intelligence product',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document threat actor profile',
        '3. Include TTPs and IOCs',
        '4. Add detection guidance',
        '5. Create STIX bundle',
        '6. Add mitigation recommendations',
        '7. Include confidence ratings',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with intel product'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'stixBundle', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        stixBundle: { type: 'object' },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'threat-intel', 'product']
}));
