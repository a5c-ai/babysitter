/**
 * @process methodologies/ontology-driven-development
 * @description Enhanced Ontology-Driven Development - Robust methodology for complex enterprise scenarios with advanced complexity management, stakeholder alignment, and quality assurance
 * @inputs { projectName: string, domainDescription?: string, ontologyScope?: string, projectComplexity?: string, stakeholderContext?: string, domainType?: string, riskProfile?: string }
 * @outputs { success: boolean, schema: object, knowledgeGraph: object, generators: object, documentation: object, testing: object, sdk: object, interfaces: object, governance: object, riskMitigation: object, dynamicConvergenceManager: object, processResilienceFramework: object, multiLevelLearning: object, processEvolutionContext: object, evidenceBasedModelingFramework: object, comprehensiveValidationFramework: object, reinforcementLearningFramework: object, metadata: object }
 *
 * @example
 * const result = await orchestrate('methodologies/ontology-driven-development', {
 *   projectName: 'Enterprise Patient Care Platform',
 *   domainDescription: 'Multi-tenant healthcare platform serving 50+ hospitals',
 *   ontologyScope: 'encyclopedic',
 *   projectComplexity: 'enterprise',
 *   stakeholderContext: 'multi-organizational',
 *   domainType: 'healthcare-regulatory',
 *   riskProfile: 'high'
 * });
 *
 * @references
 * - Research: Enterprise Ontology Engineering Best Practices (2024)
 * - METHONTOLOGY enhanced with agile practices
 * - NeOn methodology for networked ontologies
 * - Enterprise Knowledge Graph Development patterns
   * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:software-architecture]
 *   skillAreas: [skill-area:domain-driven-design, skill-area:c4-modeling, skill-area:adr-writing]
 *   workflows: [workflow:architecture-decision-record]
 *   topics: [topic:domain-driven-design, topic:clean-architecture]
 *   roles: [role:architect, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Helper functions for evidence quality assessment
function calculateAverageEvidenceQuality(framework) {
  const qualityMetrics = framework.evidenceValidation?.evidenceQuality || {};
  const qualityScores = Object.values(qualityMetrics).filter(score => typeof score === 'number');
  return qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
}

function calculateAverageCredibilityScore(framework) {
  const credibilityMetrics = framework.evidenceValidation?.sourceCredibility || {};
  const credibilityScores = Object.values(credibilityMetrics).filter(score => typeof score === 'number');
  return credibilityScores.length > 0 ? credibilityScores.reduce((sum, score) => sum + score, 0) / credibilityScores.length : 0;
}

function calculateEvidenceValidationCoverage(framework) {
  const totalClaims = Object.keys(framework.evidenceTracing?.claimToEvidenceMap || {}).length;
  const validatedClaims = Object.values(framework.evidenceTracing?.claimToEvidenceMap || {}).filter(evidence => evidence && evidence.length > 0).length;
  return totalClaims > 0 ? (validatedClaims / totalClaims) * 100 : 0;
}

function calculateValidationCoverage(validationFramework) {
  const schemaValidationCount = validationFramework.schemaValidation?.formalValidation?.length || 0;
  const generatorValidationCount = Object.keys(validationFramework.generatorValidation?.outputQualityAssessment || {}).length;
  const encyclopediaValidationCount = Object.keys(validationFramework.encyclopediaValidation?.completenessValidation || {}).length;
  const crossSystemValidationCount = validationFramework.crossSystemValidation?.integrationValidation?.length || 0;
  const totalValidations = schemaValidationCount + generatorValidationCount + encyclopediaValidationCount + crossSystemValidationCount;
  return totalValidations; // Return total validation coverage count
}

function calculateLearningVelocity(reinforcementFramework) {
  const cycles = reinforcementFramework.selfValidationCycles?.schemaValidationCycles?.length || 0;
  const improvements = reinforcementFramework.selfResearch?.improvementDiscovery?.length || 0;
  return cycles > 0 ? improvements / cycles : 0;
}

function calculateAdaptationEffectiveness(reinforcementFramework) {
  const adaptations = reinforcementFramework.adaptiveEvolution?.schemaEvolutionHistory?.length || 0;
  const successfulAdaptations = reinforcementFramework.adaptiveEvolution?.schemaEvolutionHistory?.filter(
    adaptation => adaptation.qualityImprovement > 0
  )?.length || 0;
  return adaptations > 0 ? (successfulAdaptations / adaptations) * 100 : 0;
}

function calculateSelfImprovementScore(reinforcementFramework) {
  const validationCycles = (reinforcementFramework.selfValidationCycles?.schemaValidationCycles?.length || 0) +
                          (reinforcementFramework.selfValidationCycles?.ontologyValidationCycles?.length || 0);
  const discoveries = reinforcementFramework.selfResearch?.improvementDiscovery?.length || 0;
  const adaptations = (reinforcementFramework.adaptiveEvolution?.schemaEvolutionHistory?.length || 0) +
                      (reinforcementFramework.adaptiveEvolution?.ontologyEvolutionHistory?.length || 0);

  // Self-improvement score based on learning cycles, discoveries, and successful adaptations
  return validationCycles > 0 ? ((discoveries + adaptations) / validationCycles) * 10 : 0;
}

/**
 * Enhanced Ontology-Driven Development Process
 *
 * Methodology: Advanced graph-centric development with enterprise-grade complexity management,
 * multi-stakeholder alignment, robust quality assurance, and domain-specific adaptations.
 *
 * Research-Based Enhancements:
 * - Modular ontology design patterns for complexity management
 * - Multi-stakeholder alignment with collaborative modeling
 * - Advanced quality assurance with multi-level validation
 * - Domain-specific adaptation frameworks
 * - Risk management and technical debt prevention
 * - Enterprise tool integration and governance
 * - Change management for evolving requirements
 * - Scalability patterns for large organizations
 *
 * Complexity Management Framework:
 * - Modular design with clear boundaries and interfaces
 * - Dependency management for ontology modules
 * - Automated complexity monitoring and alerts
 * - Progressive refinement with complexity gates
 *
 * Enhanced Phase Structure:
 * 0. Project Analysis & Planning - Assess complexity, stakeholders, risks
 * 1. Modular Schema Definition - Domain-aware modular ontology design
 * 2. Collaborative Knowledge Graph Construction - Multi-stakeholder modeling
 * 3. Adaptive Generator Creation - Domain-specific generator patterns
 * 4. Strategic Documentation & Wiki - Stakeholder-aligned documentation
 * 5. Multi-Level Testing & Quality - Comprehensive validation framework
 * 6. Governance-Aware SDK Development - Enterprise integration patterns
 * 7. Federated Interface Development - Multi-stakeholder interface design
 * 8. Scalable UI Development - Enterprise-grade user interfaces
 * 9. Governance & Risk Management - Continuous governance and risk mitigation
 *
 * Advanced Quality Convergence:
 * - Multi-dimensional quality metrics (technical, business, stakeholder satisfaction)
 * - Adversarial review with domain expert panels
 * - Automated consistency checking and validation
 * - Business value measurement and ROI tracking
 * - Stakeholder alignment scoring
 * - Technical debt monitoring and prevention
 *
 * @param {Object} inputs - Enhanced process inputs
 * @param {string} inputs.projectName - Name of the project/domain
 * @param {string} inputs.domainDescription - High-level description of the domain
 * @param {string} inputs.ontologyScope - Scope: 'minimal', 'comprehensive', 'encyclopedic' (default: comprehensive)
 * @param {string} inputs.projectComplexity - Complexity: 'simple', 'moderate', 'complex', 'enterprise' (default: moderate)
 * @param {string} inputs.stakeholderContext - Context: 'single-team', 'multi-team', 'multi-department', 'multi-organizational' (default: multi-team)
 * @param {string} inputs.domainType - Domain: 'general', 'healthcare-regulatory', 'financial-compliance', 'manufacturing-iot', 'ai-ml-systems' (default: general)
 * @param {string} inputs.riskProfile - Risk: 'low', 'moderate', 'high', 'critical' (default: moderate)
 * @param {number} inputs.targetQuality - Target quality score 0-100 (default: 85)
 * @param {Object} ctx - Process context (see SDK)
 * @returns {Promise<Object>} Enhanced process result with governance and risk management
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    domainDescription = '',
    ontologyScope = 'comprehensive',
    projectComplexity = 'moderate',
    stakeholderContext = 'multi-team',
    domainType = 'general',
    riskProfile = 'moderate',
    targetQuality = 85,
    maxIterationsPerPhase = getMaxIterations(projectComplexity),
    phase = 'full'
  } = inputs;

  const results = {
    projectName,
    ontologyScope,
    projectComplexity,
    stakeholderContext,
    domainType,
    riskProfile,
    targetQuality,
    schema: null,
    knowledgeGraph: null,
    generators: null,
    documentation: null,
    testing: null,
    sdk: null,
    interfaces: null,
    governance: null,
    riskMitigation: null,
    metadata: {
      totalIterations: 0,
      phaseIterations: {},
      qualityScores: {},
      stakeholderAlignment: {},
      riskMitigation: {},
      complexityMetrics: {},
      businessValueMetrics: {},
      // Enhanced process learning and adaptation
      processLearnings: [],
      crossPhaseInsights: {},
      adaptiveQualityTargets: {},
      methodologyEvolution: [],
      convergencePatterns: {},
      phaseEffectiveness: {},
      learningTransfer: {},
      processOptimizations: []
    }
  };

  // Initialize adaptive quality management system
  let adaptiveQualityManager = {
    baseTargetQuality: targetQuality,
    currentPhaseTargets: {},
    qualityEvolution: [],
    convergenceHistory: [],
    adaptationReasons: []
  };

  const artifacts = [];

  ctx.log?.('info', `Starting Enhanced Ontology-Driven Development for "${projectName}"`);
  ctx.log?.('info', `Configuration: ${ontologyScope} scope, ${projectComplexity} complexity, ${stakeholderContext} stakeholders, ${domainType} domain, ${riskProfile} risk`);

  // Initialize advanced process intelligence and adaptation framework
  let processEvolutionContext = {
    phaseSequence: ['world-ontology', 'problem-ontology', 'solution-ontology', 'integrated-ontology', 'empirical-validation', 'retrospective-optimization', 'perfect-graph', 'comprehensive-validation', 'stress-testing', 'collaborative-refinement'],
    currentPhaseIndex: 0,
    adaptiveInsights: [],
    crossPhaseConnections: new Map(),
    processEfficiencyMetrics: {},
    learningMomentum: 0.0,
    // Enhanced process intelligence
    processPatterns: {
      successPatterns: [],
      failurePatterns: [],
      efficiencyPatterns: [],
      stakeholderEngagementPatterns: [],
      convergencePatterns: [],
      innovationPatterns: []
    },
    contextualAdaptations: {
      domainSpecificLearnings: {},
      complexityLevelAdaptations: {},
      stakeholderTypeOptimizations: {},
      culturalContextAdaptations: {}
    },
    processIntelligence: {
      decisionQuality: [],
      predictionAccuracy: [],
      adaptationEffectiveness: [],
      learningVelocity: [],
      processInnovations: []
    },
    cognitiveLoadManagement: {
      stakeholderCapacityTracking: {},
      informationFlowOptimization: [],
      complexityReductionStrategies: [],
      focusOptimization: []
    },
    emotionalIntelligence: {
      stakeholderSentiment: {},
      motivationPatterns: {},
      frustrationIndicators: {},
      engagementOptimization: []
    }
  };

  // Initialize multi-level learning framework
  let multiLevelLearning = {
    tacticalLearning: [], // What specific actions work
    strategicLearning: [], // What approaches work
    methodologicalLearning: [], // What process patterns work
    metaLearning: [], // What learning approaches work
    paradigmLearning: [] // What fundamental assumptions work
  };

  // Initialize dynamic convergence management system
  let dynamicConvergenceManager = {
    convergenceCriteria: {
      qualityStability: { threshold: 0.02, windowSize: 3 }, // Quality improvement < 2% over 3 iterations
      evidenceThreshold: { minimum: 0.85, trend: 'increasing' }, // Evidence confidence > 85% and increasing
      stakeholderConsensus: { minimum: 0.80, volatility: 0.05 }, // Stakeholder agreement > 80% with low volatility
      emergentInsights: { diminishingReturns: 0.15 }, // New insights per iteration < 15%
      resourceEfficiency: { effortToValueRatio: 2.0 }, // Effort to value ratio threshold
      riskStabilization: { volatility: 0.10 } // Risk assessment volatility < 10%
    },
    adaptiveLearningAcceleration: {
      accelerationTriggers: [], // Conditions that warrant faster iteration
      decelerationTriggers: [], // Conditions that warrant slower, more careful iteration
      emergencyStops: [], // Critical conditions that require immediate human intervention
      adaptiveScheduling: {} // Dynamic timing adjustments
    },
    convergenceHistory: [],
    emergentBehaviors: [],
    convergenceVelocity: 0.0
  };

  // Initialize process resilience framework
  let processResilienceFramework = {
    failureScenarios: {
      knownFailurePatterns: [], // Documented failure modes from past projects
      edgeCaseScenarios: [], // Boundary conditions that could cause issues
      cascadingFailures: [], // How failures in one area affect others
      recoveryStrategies: {} // Specific recovery approaches for each failure type
    },
    adaptiveContingencies: {
      contingencyTriggers: [], // Conditions that activate contingency plans
      dynamicFallbacks: {}, // Alternative approaches when primary methods fail
      processRerouting: {}, // How to redirect process flow around failures
      emergencyProtocols: [] // Critical situation handling
    },
    resilienceMonitoring: {
      systemHealthIndicators: [], // Metrics that indicate process health
      earlyWarningSignals: [], // Leading indicators of potential issues
      stressTestResults: [], // How the process performs under various stress conditions
      adaptabilityMetrics: {} // How well the process adapts to unexpected situations
    },
    failsafeOperations: {
      gracefulDegradation: {}, // How to maintain partial functionality during issues
      rollbackProcedures: {}, // How to safely revert to previous state
      isolationProtocols: {}, // How to contain failures to specific areas
      recoveryValidation: {} // How to verify successful recovery
    }
  };

  // Initialize comprehensive evidence-based modeling framework
  let evidenceBasedModelingFramework = {
    evidenceCollection: {
      primarySources: [], // Direct research, interviews, observations
      secondarySources: [], // Academic papers, industry reports, documentation
      empiricalEvidence: [], // Data analysis, measurements, experiments
      empiricalExperiments: [], // Online reproducible experiments and replication studies
      reproducibleResearch: [], // Open science with replication instructions and data
      crowdSourcedValidation: [], // Community-validated results and collaborative verification
      codeEvidence: [], // Implementation examples, repositories, technical specifications
      onlineEvidence: [], // Web sources, forums, community knowledge
      expertValidation: [] // Expert review and validation of claims
    },
    evidenceValidation: {
      sourceCredibility: {}, // Credibility scores for different source types
      evidenceQuality: {}, // Quality assessment using standardized criteria
      conflictResolution: [], // How to handle conflicting evidence
      uncertaintyQuantification: {}, // Confidence levels and uncertainty bounds
      biasAssessment: {} // Identification and mitigation of various biases
    },
    evidenceTracing: {
      claimToEvidenceMap: {}, // Map every claim to supporting evidence
      evidenceChains: [], // Chains of evidence for complex claims
      evidenceVersioning: {}, // Track evidence updates and changes over time
      provenanceTracking: {}, // Complete audit trail for all evidence
      crossValidation: {} // Evidence validation from multiple independent sources
    },
    evidenceIntegration: {
      synthesisProtocols: [], // How to combine evidence from multiple sources
      strengthOfEvidence: {}, // GRADE-style evidence strength assessment
      evidenceGaps: [], // Identified gaps in evidence coverage
      researchNeeds: [], // Areas requiring additional evidence collection
      evidenceBasedConfidence: {} // Overall confidence based on evidence strength
    },
    evidenceGeneration: {
      originalResearch: [], // Self-generated research studies and investigations
      designedExperiments: [], // Experiments designed and conducted by the process
      empiricalValidation: [], // Empirical validation studies for ontology claims
      dataCollection: [], // Original data collection efforts and results
      collaborativeStudies: [], // Multi-stakeholder research and validation studies
      hypothesisValidation: [], // Hypothesis generation and testing for evidence gaps
      syntheticEvidence: [], // Evidence generated through systematic analysis and synthesis
      validationExperiments: [] // Experiments specifically designed to validate ontology components
    },
    evidenceManagement: {
      citationStandards: {}, // Standardized citation and attribution protocols
      evidenceRepository: {}, // Organized storage and retrieval of evidence
      updateProtocols: [], // Procedures for evidence updates and maintenance
      qualityControl: {}, // Evidence quality assurance processes
      accessibilityStandards: {} // Making evidence accessible to stakeholders
    }
  };

  // Initialize comprehensive validation framework
  let comprehensiveValidationFramework = {
    schemaValidation: {
      formalValidation: [], // Logical consistency, completeness, soundness
      empiricalValidation: [], // Real-world testing and verification
      crossValidation: [], // Validation against multiple independent sources
      adversarialValidation: [], // Systematic challenge and stress testing
      continuousValidation: [] // Ongoing validation as schema evolves
    },
    generatorValidation: {
      outputQualityAssessment: {}, // Quality metrics for generated artifacts
      conformanceValidation: {}, // Conformance to schema and requirements
      usabilityValidation: {}, // End-user validation and feedback
      performanceValidation: {}, // Performance and scalability testing
      evolutionValidation: {} // Validation of generator adaptation over time
    },
    encyclopediaValidation: {
      completenessValidation: {}, // Coverage assessment against domain scope
      accuracyValidation: {}, // Fact-checking and verification protocols
      consistencyValidation: {}, // Internal consistency and contradiction detection
      usabilityValidation: {}, // User experience and accessibility testing
      maintenanceValidation: {} // Validation of update and maintenance processes
    },
    crossSystemValidation: {
      integrationValidation: [], // Validation across system boundaries
      holisticValidation: [], // Whole-system validation and emergent properties
      stakeholderValidation: [], // Multi-stakeholder validation consensus
      realWorldValidation: [], // Validation against real-world implementation
      temporalValidation: [] // Validation over time and changing conditions
    }
  };

  // Initialize reinforcement learning adaptation framework
  let reinforcementLearningFramework = {
    selfValidationCycles: {
      schemaValidationCycles: [], // Iterative schema self-validation and improvement
      ontologyValidationCycles: [], // Full ontology self-validation loops
      validationResultAnalysis: {}, // Analysis of validation results for learning
      adaptationTriggers: [], // Conditions that trigger schema/ontology adaptation
      learningMetrics: {} // Metrics tracking learning and improvement over time
    },
    adaptiveEvolution: {
      schemaEvolutionHistory: [], // Complete history of schema changes and rationale
      ontologyEvolutionHistory: [], // Complete history of ontology adaptations
      evolutionPatterns: {}, // Patterns in how the schema/ontology evolves
      adaptationStrategies: [], // Strategies for different types of adaptations
      evolutionPrediction: {} // Predictive models for future evolution needs
    },
    selfResearch: {
      researchQuestions: [], // Questions the process generates about itself
      selfExperiments: [], // Experiments the process conducts on its own outputs
      hypothesisGeneration: [], // Hypotheses about improvements and optimizations
      selfEvaluation: {}, // Self-assessment of process performance and quality
      improvementDiscovery: [] // Discoveries of potential improvements
    },
    feedbackIntegration: {
      validationFeedbackLoops: {}, // How validation results feed back into process improvement
      stakeholderFeedbackIntegration: [], // Integration of stakeholder feedback for adaptation
      performanceFeedbackAnalysis: {}, // Analysis of performance metrics for optimization
      errorAnalysisAndLearning: {}, // Learning from errors and failures
      successPatternAnalysis: {} // Analysis of success patterns for replication
    },
    adaptiveControl: {
      dynamicParameterAdjustment: {}, // Real-time adjustment of process parameters
      contextualAdaptation: [], // Adaptation based on changing context and requirements
      emergentBehaviorHarnessing: [], // Leveraging positive emergent behaviors
      preventiveAdaptation: [], // Proactive adaptation to prevent potential issues
      optimizationOpportunities: {} // Identification and exploitation of optimization opportunities
    }
  };

  // ============================================================================
  // PHASE 0: WORLD ONTOLOGY & DOMAIN RESEARCH
  // ============================================================================

  if (phase === 'full' || phase === 'world-ontology') {
    ctx.log?.('info', 'Phase 0: World ontology and deep domain research...');

    const worldOntologyResult = await executeIterativePhase(
      ctx,
      'world-ontology',
      {
        mainTask: worldOntologyResearchTask,
        taskInputs: {
          projectName,
          domainDescription,
          ontologyScope,
          domainType,
          stakeholderContext,
          researchDepth: 'comprehensive',
          evidenceFramework: evidenceBasedModelingFramework
        },
        qualityDimensions: ['domain_accuracy', 'world_model_completeness', 'stakeholder_coverage', 'external_system_mapping'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'World Ontology & Domain Research',
        adaptiveQualityManager,
        processContext: processEvolutionContext,
        previousPhaseLearnings: []
      }
    );

    results.worldOntology = worldOntologyResult.result;
    results.metadata.phaseIterations['world-ontology'] = worldOntologyResult.iterations;
    results.metadata.qualityScores['world-ontology'] = worldOntologyResult.qualityMetrics;
    results.metadata.totalIterations += worldOntologyResult.iterations;
    artifacts.push(...(worldOntologyResult.artifacts || []));

    // Evidence validation for world ontology phase
    ctx.log?.('info', 'Validating evidence for world ontology phase...');
    const worldEvidenceValidation = await ctx.task(evidenceValidationManagementTask, {
      projectName,
      phaseResult: results.worldOntology,
      evidenceFramework: evidenceBasedModelingFramework,
      phaseName: 'world-ontology',
      validationDepth: 'comprehensive',
      stakeholderContext
    });

    // Update evidence framework with validation results
    evidenceBasedModelingFramework.evidenceCollection.primarySources.push(...(worldEvidenceValidation.validatedEvidence?.primarySources || []));
    evidenceBasedModelingFramework.evidenceValidation.sourceCredibility = { ...evidenceBasedModelingFramework.evidenceValidation.sourceCredibility, ...worldEvidenceValidation.sourceCredibilityAnalysis };
    evidenceBasedModelingFramework.evidenceTracing.claimToEvidenceMap = { ...evidenceBasedModelingFramework.evidenceTracing.claimToEvidenceMap, ...worldEvidenceValidation.validatedEvidence?.claimMapping };
    evidenceBasedModelingFramework.evidenceIntegration.evidenceGaps.push(...worldEvidenceValidation.evidenceGaps);

    artifacts.push(...(worldEvidenceValidation.artifacts || []));

    // Evidence generation for critical gaps
    if (worldEvidenceValidation.evidenceGaps && worldEvidenceValidation.evidenceGaps.length > 0) {
      const criticalGaps = worldEvidenceValidation.evidenceGaps.filter(gap => gap.priority === 'critical' || gap.priority === 'high');

      if (criticalGaps.length > 0) {
        ctx.log?.('info', `Generating evidence for ${criticalGaps.length} critical evidence gaps through original research...`);

        const evidenceGeneration = await ctx.task(evidenceGenerationTask, {
          projectName,
          evidenceGaps: criticalGaps,
          evidenceFramework: evidenceBasedModelingFramework,
          currentPhase: 'world-ontology',
          domainType,
          stakeholderContext,
          researchPriority: 'high'
        });

        // Integrate generated evidence into framework
        evidenceBasedModelingFramework.evidenceGeneration.originalResearch.push(...evidenceGeneration.researchStudies);
        evidenceBasedModelingFramework.evidenceGeneration.designedExperiments.push(...evidenceGeneration.designedExperiments);
        evidenceBasedModelingFramework.evidenceGeneration.empiricalValidation.push(...evidenceGeneration.empiricalValidation);
        evidenceBasedModelingFramework.evidenceCollection.empiricalExperiments.push(...evidenceGeneration.designedExperiments);

        artifacts.push(...(evidenceGeneration.artifacts || []));

        ctx.log?.('info', `Generated ${evidenceGeneration.researchStudies?.length || 0} research studies and ${evidenceGeneration.designedExperiments?.length || 0} experiments`);
      }
    }

    await ctx.breakpoint({
      question: `World ontology research complete. Domain coverage: ${worldOntologyResult.result?.domainCoverage?.percentage}%, Key entities: ${worldOntologyResult.result?.keyEntities?.length}, External systems: ${worldOntologyResult.result?.externalSystems?.length}. Proceed to problem space analysis?`,
      title: 'World Ontology Review',
      context: {
        runId: ctx.runId,
        data: {
          domainCoverage: worldOntologyResult.result?.domainCoverage?.percentage,
          keyEntities: worldOntologyResult.result?.keyEntities?.length,
          externalSystems: worldOntologyResult.result?.externalSystems?.length,
          stakeholderTypes: worldOntologyResult.result?.stakeholderTypes?.length
        },
        files: [
          { path: 'artifacts/odd/WORLD_ONTOLOGY.md', format: 'markdown', label: 'World Model' },
          { path: 'artifacts/odd/DOMAIN_RESEARCH.md', format: 'markdown', label: 'Domain Research' },
          { path: 'artifacts/odd/STAKEHOLDER_ECOSYSTEM.md', format: 'markdown', label: 'Stakeholder Ecosystem' }
        ]
      }
    });
  }

  // Meta-learning after Phase 0: World Ontology
  if (phase === 'full' && results.worldOntology) {
    // Advanced multi-dimensional learning analysis
    const worldOntologyLearnings = await executeAdvancedMetaLearningAnalysis(ctx, 'world-ontology', {
      phaseResult: results.worldOntology,
      processContext: processEvolutionContext,
      adaptiveQualityManager,
      allResults: results,
      multiLevelLearning
    });

    // Process intelligence validation and contingency analysis
    const processValidation = await executeProcessValidation(ctx, {
      phaseName: 'world-ontology',
      phaseResult: results.worldOntology,
      processDecisions: worldOntologyLearnings.processDecisions,
      processContext: processEvolutionContext,
      contingencyTriggers: worldOntologyLearnings.contingencyTriggers
    });

    // Cognitive load and stakeholder optimization
    const cognitiveOptimization = await optimizeCognitiveLoad(ctx, {
      phaseName: 'world-ontology',
      stakeholderFeedback: results.worldOntology.stakeholderFeedback,
      complexityMetrics: results.worldOntology.complexityMetrics,
      processContext: processEvolutionContext
    });

    // Apply comprehensive learnings and optimizations
    adaptiveQualityManager = worldOntologyLearnings.updatedQualityManager;
    processEvolutionContext.adaptiveInsights.push(worldOntologyLearnings.insights);
    processEvolutionContext = processValidation.updatedProcessContext;
    multiLevelLearning = worldOntologyLearnings.updatedMultiLevelLearning;
    processEvolutionContext.currentPhaseIndex = 1;

    // Update cognitive load management
    processEvolutionContext.cognitiveLoadManagement = cognitiveOptimization.optimizedCognitiveManagement;

    results.metadata.processLearnings.push(worldOntologyLearnings);
    results.metadata.processValidations = results.metadata.processValidations || [];
    results.metadata.processValidations.push(processValidation);
    artifacts.push(...(worldOntologyLearnings.artifacts || []));
    artifacts.push(...(processValidation.artifacts || []));
    artifacts.push(...(cognitiveOptimization.artifacts || []));
  }

  // ============================================================================
  // PHASE 1: PROBLEM SPACE ONTOLOGY & DEEP ANALYSIS
  // ============================================================================

  if (phase === 'full' || phase === 'problem-ontology') {
    ctx.log?.('info', 'Phase 1: Problem space ontology and deep analysis...');

    const problemOntologyResult = await executeIterativePhase(
      ctx,
      'problem-ontology',
      {
        mainTask: problemSpaceOntologyTask,
        taskInputs: {
          projectName,
          domainDescription,
          worldOntology: results.worldOntology,
          stakeholderContext,
          projectComplexity,
          analysisDepth: 'exhaustive'
        },
        qualityDimensions: ['problem_accuracy', 'pain_point_coverage', 'constraint_completeness', 'root_cause_depth'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Problem Space Ontology & Deep Analysis'
      }
    );

    results.problemOntology = problemOntologyResult.result;
    results.metadata.phaseIterations['problem-ontology'] = problemOntologyResult.iterations;
    results.metadata.qualityScores['problem-ontology'] = problemOntologyResult.qualityMetrics;
    results.metadata.totalIterations += problemOntologyResult.iterations;
    artifacts.push(...(problemOntologyResult.artifacts || []));

    await ctx.breakpoint({
      question: `Problem ontology complete. Pain points identified: ${problemOntologyResult.result?.painPoints?.length}, Root causes: ${problemOntologyResult.result?.rootCauses?.length}, Constraints: ${problemOntologyResult.result?.constraints?.length}. Proceed to solution space exploration?`,
      title: 'Problem Ontology Review',
      context: {
        runId: ctx.runId,
        data: {
          painPointsCount: problemOntologyResult.result?.painPoints?.length,
          rootCausesCount: problemOntologyResult.result?.rootCauses?.length,
          constraintsCount: problemOntologyResult.result?.constraints?.length,
          problemComplexity: problemOntologyResult.result?.complexityAssessment
        },
        files: [
          { path: 'artifacts/odd/PROBLEM_ONTOLOGY.md', format: 'markdown', label: 'Problem Model' },
          { path: 'artifacts/odd/PAIN_POINT_ANALYSIS.md', format: 'markdown', label: 'Pain Point Analysis' },
          { path: 'artifacts/odd/CONSTRAINT_MAPPING.md', format: 'markdown', label: 'Constraint Analysis' }
        ]
      }
    });
  }

  // Meta-learning after Phase 1: Problem Space Ontology
  if (phase === 'full' && results.problemOntology) {
    const problemOntologyLearnings = await executeMetaLearningAnalysis(ctx, 'problem-ontology', {
      phaseResult: results.problemOntology,
      processContext: processEvolutionContext,
      adaptiveQualityManager,
      allResults: results,
      previousPhaseLearnings: results.metadata.processLearnings
    });

    adaptiveQualityManager = problemOntologyLearnings.updatedQualityManager;
    processEvolutionContext.adaptiveInsights.push(problemOntologyLearnings.insights);
    processEvolutionContext.currentPhaseIndex = 2;

    // Apply cross-phase learning transfer with breakthrough detection
    await applyCrossPhaseOptimizations(ctx, results, problemOntologyLearnings.crossPhaseInsights);

    // Process innovation and breakthrough opportunity analysis
    const innovationAnalysis = await detectProcessInnovationOpportunities(ctx, {
      currentPhase: 'problem-ontology',
      phaseResults: [results.worldOntology, results.problemOntology],
      processLearnings: results.metadata.processLearnings,
      processContext: processEvolutionContext,
      multiLevelLearning
    });

    // Update process intelligence with innovation insights
    if (innovationAnalysis.breakthroughOpportunities.length > 0) {
      processEvolutionContext.processIntelligence.processInnovations.push(innovationAnalysis);
    }

    results.metadata.processLearnings.push(problemOntologyLearnings);
    results.metadata.innovationAnalyses = results.metadata.innovationAnalyses || [];
    results.metadata.innovationAnalyses.push(innovationAnalysis);
    artifacts.push(...(problemOntologyLearnings.artifacts || []));
    artifacts.push(...(innovationAnalysis.artifacts || []));
  }

  // ============================================================================
  // PHASE 2: SOLUTION SPACE ONTOLOGY & EXPLORATION
  // ============================================================================

  if (phase === 'full' || phase === 'solution-ontology') {
    ctx.log?.('info', 'Phase 2: Solution space ontology and exploration...');

    const solutionOntologyResult = await executeIterativePhase(
      ctx,
      'solution-ontology',
      {
        mainTask: solutionSpaceExplorationTask,
        taskInputs: {
          projectName,
          worldOntology: results.worldOntology,
          problemOntology: results.problemOntology,
          domainType,
          projectComplexity,
          explorationScope: 'comprehensive'
        },
        qualityDimensions: ['solution_coverage', 'approach_feasibility', 'architecture_soundness', 'innovation_potential'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Solution Space Ontology & Exploration'
      }
    );

    results.solutionOntology = solutionOntologyResult.result;
    results.metadata.phaseIterations['solution-ontology'] = solutionOntologyResult.iterations;
    results.metadata.qualityScores['solution-ontology'] = solutionOntologyResult.qualityMetrics;
    results.metadata.totalIterations += solutionOntologyResult.iterations;
    artifacts.push(...(solutionOntologyResult.artifacts || []));

    await ctx.breakpoint({
      question: `Solution ontology complete. Solution approaches: ${solutionOntologyResult.result?.solutionApproaches?.length}, Architecture patterns: ${solutionOntologyResult.result?.architecturePatterns?.length}, Technology options: ${solutionOntologyResult.result?.technologyOptions?.length}. Proceed to integrated ontology synthesis?`,
      title: 'Solution Ontology Review',
      context: {
        runId: ctx.runId,
        data: {
          solutionApproaches: solutionOntologyResult.result?.solutionApproaches?.length,
          architecturePatterns: solutionOntologyResult.result?.architecturePatterns?.length,
          technologyOptions: solutionOntologyResult.result?.technologyOptions?.length,
          feasibilityScore: solutionOntologyResult.result?.feasibilityAssessment
        },
        files: [
          { path: 'artifacts/odd/SOLUTION_ONTOLOGY.md', format: 'markdown', label: 'Solution Model' },
          { path: 'artifacts/odd/ARCHITECTURE_EXPLORATION.md', format: 'markdown', label: 'Architecture Analysis' },
          { path: 'artifacts/odd/TECHNOLOGY_ASSESSMENT.md', format: 'markdown', label: 'Technology Options' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 3: INTEGRATED ONTOLOGY SYNTHESIS & VALIDATION
  // ============================================================================

  if (phase === 'full' || phase === 'integrated-ontology') {
    ctx.log?.('info', 'Phase 3: Integrated ontology synthesis and validation...');

    const integratedOntologyResult = await executeIterativePhase(
      ctx,
      'integrated-ontology',
      {
        mainTask: integratedOntologySynthesisTask,
        taskInputs: {
          projectName,
          worldOntology: results.worldOntology,
          problemOntology: results.problemOntology,
          solutionOntology: results.solutionOntology,
          ontologyScope,
          targetQuality
        },
        qualityDimensions: ['integration_coherence', 'traceability_completeness', 'strategic_alignment', 'implementation_readiness'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Integrated Ontology Synthesis & Validation'
      }
    );

    results.integratedOntology = integratedOntologyResult.result;
    results.schema = integratedOntologyResult.result?.schema;
    results.metadata.phaseIterations['integrated-ontology'] = integratedOntologyResult.iterations;
    results.metadata.qualityScores['integrated-ontology'] = integratedOntologyResult.qualityMetrics;
    results.metadata.totalIterations += integratedOntologyResult.iterations;
    artifacts.push(...(integratedOntologyResult.artifacts || []));

    await ctx.breakpoint({
      question: `Integrated ontology synthesis complete. Schema modules: ${integratedOntologyResult.result?.schema?.modules?.length}, Traceability links: ${integratedOntologyResult.result?.traceabilityMatrix?.totalLinks}, Coverage score: ${integratedOntologyResult.result?.coverageMetrics?.overall}%. Proceed to knowledge graph construction?`,
      title: 'Integrated Ontology Review',
      context: {
        runId: ctx.runId,
        data: {
          schemaModules: integratedOntologyResult.result?.schema?.modules?.length,
          traceabilityLinks: integratedOntologyResult.result?.traceabilityMatrix?.totalLinks,
          coverageScore: integratedOntologyResult.result?.coverageMetrics?.overall,
          qualityScore: integratedOntologyResult.qualityMetrics?.overallScore
        },
        files: [
          { path: 'artifacts/odd/INTEGRATED_ONTOLOGY.md', format: 'markdown', label: 'Integrated Ontology' },
          { path: 'artifacts/odd/ONTOLOGY_SCHEMA.md', format: 'markdown', label: 'Schema Definition' },
          { path: 'artifacts/odd/TRACEABILITY_MATRIX.md', format: 'markdown', label: 'Traceability Matrix' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 1: MODULAR SCHEMA DEFINITION
  // ============================================================================

  if (phase === 'full' || phase === 'schema') {
    ctx.log?.('info', 'Phase 1: Modular schema definition with complexity management...');

    const phaseResult = await executeIterativePhase(
      ctx,
      'schema',
      {
        mainTask: defineModularOntologySchemaTask,
        taskInputs: {
          projectName,
          domainDescription,
          ontologyScope,
          projectComplexity,
          stakeholderContext,
          domainType,
          projectAnalysis: results.projectAnalysis,
          targetQuality
        },
        qualityDimensions: ['completeness', 'consistency', 'modularity', 'stakeholder_alignment', 'complexity_management'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Modular Schema Definition'
      }
    );

    results.schema = phaseResult.result;
    results.metadata.phaseIterations['schema'] = phaseResult.iterations;
    results.metadata.qualityScores['schema'] = phaseResult.qualityMetrics;
    results.metadata.totalIterations += phaseResult.iterations;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 4: EMPIRICAL SCHEMA VALIDATION & DATA POPULATION
  // ============================================================================

  if (phase === 'full' || phase === 'empirical-validation') {
    ctx.log?.('info', 'Phase 4: Empirical schema validation and data population...');

    const empiricalValidationResult = await executeIterativePhase(
      ctx,
      'empirical-validation',
      {
        mainTask: empiricalSchemaValidationTask,
        taskInputs: {
          projectName,
          integratedOntology: results.integratedOntology,
          schema: results.schema,
          worldOntology: results.worldOntology,
          problemOntology: results.problemOntology,
          solutionOntology: results.solutionOntology
        },
        qualityDimensions: ['data_fit_quality', 'schema_adequacy', 'population_efficiency', 'query_performance'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Empirical Schema Validation & Data Population'
      }
    );

    results.empiricalValidation = empiricalValidationResult.result;
    results.metadata.phaseIterations['empirical-validation'] = empiricalValidationResult.iterations;
    results.metadata.qualityScores['empirical-validation'] = empiricalValidationResult.qualityMetrics;
    results.metadata.totalIterations += empiricalValidationResult.iterations;
    artifacts.push(...(empiricalValidationResult.artifacts || []));

    await ctx.breakpoint({
      question: `Empirical validation complete. Schema adequacy: ${empiricalValidationResult.result?.schemaAdequacy?.score}%, Data population issues: ${empiricalValidationResult.result?.populationIssues?.length}, Performance metrics: ${empiricalValidationResult.result?.performanceScore}%. Proceed to retrospective optimization?`,
      title: 'Empirical Validation Review',
      context: {
        runId: ctx.runId,
        data: {
          schemaAdequacy: empiricalValidationResult.result?.schemaAdequacy?.score,
          populationIssues: empiricalValidationResult.result?.populationIssues?.length,
          performanceScore: empiricalValidationResult.result?.performanceScore,
          dataQuality: empiricalValidationResult.result?.dataQualityMetrics
        },
        files: [
          { path: 'artifacts/odd/EMPIRICAL_VALIDATION.md', format: 'markdown', label: 'Empirical Validation' },
          { path: 'artifacts/odd/DATA_POPULATION_ANALYSIS.md', format: 'markdown', label: 'Data Population Analysis' },
          { path: 'artifacts/odd/PERFORMANCE_METRICS.md', format: 'markdown', label: 'Performance Analysis' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 5: RETROSPECTIVE OPTIMIZATION & SCHEMA EVOLUTION
  // ============================================================================

  if (phase === 'full' || phase === 'retrospective-optimization') {
    ctx.log?.('info', 'Phase 5: Retrospective optimization and schema evolution...');

    let schemaConverged = false;
    let optimizationIteration = 0;
    const maxOptimizationIterations = Math.min(maxIterationsPerPhase, 5);
    let currentSchema = results.schema;
    let currentOntology = results.integratedOntology;

    while (!schemaConverged && optimizationIteration < maxOptimizationIterations) {
      optimizationIteration++;
      ctx.log?.('info', `Schema optimization iteration ${optimizationIteration}/${maxOptimizationIterations}`);

      const retrospectiveOptimizationResult = await executeIterativePhase(
        ctx,
        'retrospective-optimization',
        {
          mainTask: retrospectiveOptimizationTask,
          taskInputs: {
            projectName,
            currentSchema: currentSchema,
            currentOntology: currentOntology,
            empiricalValidation: results.empiricalValidation,
            populationLearnings: results.empiricalValidation?.learnings,
            optimizationIteration,
            previousOptimizations: results.schemaOptimizations || []
          },
          qualityDimensions: ['schema_optimality', 'modeling_efficiency', 'structural_elegance', 'performance_optimization'],
          targetQuality,
          maxIterations: 3, // Shorter inner iterations for optimization
          phaseName: `Retrospective Optimization (Iteration ${optimizationIteration})`
        }
      );

      // Update schema and ontology with optimizations
      if (retrospectiveOptimizationResult.result?.optimizedSchema) {
        currentSchema = retrospectiveOptimizationResult.result.optimizedSchema;
        currentOntology = retrospectiveOptimizationResult.result.optimizedOntology;
      }

      // Re-validate with optimized schema
      const revalidationResult = await ctx.task(revalidateOptimizedSchemaTask, {
        projectName,
        optimizedSchema: currentSchema,
        optimizedOntology: currentOntology,
        originalValidation: results.empiricalValidation,
        optimizationIteration
      });

      artifacts.push(...(retrospectiveOptimizationResult.artifacts || []));
      artifacts.push(...(revalidationResult.artifacts || []));

      // Check convergence
      const convergenceCheck = await ctx.task(schemaConvergenceAssessmentTask, {
        projectName,
        optimizationHistory: [...(results.schemaOptimizations || []), retrospectiveOptimizationResult.result],
        currentQuality: revalidationResult.qualityMetrics,
        targetQuality,
        optimizationIteration
      });

      schemaConverged = convergenceCheck.hasConverged;

      if (!results.schemaOptimizations) results.schemaOptimizations = [];
      results.schemaOptimizations.push({
        iteration: optimizationIteration,
        optimization: retrospectiveOptimizationResult.result,
        revalidation: revalidationResult,
        convergence: convergenceCheck
      });

      if (schemaConverged) {
        ctx.log?.('info', `Schema converged to optimal state in ${optimizationIteration} optimization iterations`);
        results.schema = currentSchema;
        results.integratedOntology = currentOntology;
        results.finalValidation = revalidationResult;
      } else {
        ctx.log?.('info', `Schema optimization ${optimizationIteration}: Quality improved from ${convergenceCheck.previousQuality} to ${convergenceCheck.currentQuality}`);
      }

      // Breakpoint for complex optimization decisions
      if (!schemaConverged && optimizationIteration >= maxOptimizationIterations - 1) {
        await ctx.breakpoint({
          question: `Schema optimization has completed ${optimizationIteration} iterations without full convergence. Quality: ${convergenceCheck.currentQuality}/${targetQuality}. Continue optimizing or proceed with current schema?`,
          title: 'Schema Optimization Decision',
          context: {
            runId: ctx.runId,
            data: {
              optimizationIteration,
              maxOptimizationIterations,
              currentQuality: convergenceCheck.currentQuality,
              targetQuality,
              improvementRate: convergenceCheck.improvementRate,
              remainingIssues: convergenceCheck.remainingIssues
            }
          }
        });
      }
    }

    results.metadata.optimizationIterations = optimizationIteration;
    results.metadata.schemaConverged = schemaConverged;
    results.metadata.phaseIterations['retrospective-optimization'] = optimizationIteration;
    results.metadata.totalIterations += optimizationIteration;

    await ctx.breakpoint({
      question: `Retrospective optimization complete. Schema convergence: ${schemaConverged ? 'ACHIEVED' : 'PARTIAL'} in ${optimizationIteration} iterations. Final quality: ${results.finalValidation?.qualityMetrics?.overallScore || 'TBD'}%. Proceed to perfect graph construction?`,
      title: 'Retrospective Optimization Review',
      context: {
        runId: ctx.runId,
        data: {
          schemaConverged,
          optimizationIterations: optimizationIteration,
          finalQuality: results.finalValidation?.qualityMetrics?.overallScore,
          optimizationImprovements: results.schemaOptimizations?.map(o => o.optimization?.improvementSummary)
        },
        files: [
          { path: 'artifacts/odd/SCHEMA_OPTIMIZATION.md', format: 'markdown', label: 'Schema Optimization' },
          { path: 'artifacts/odd/OPTIMIZATION_TRAJECTORY.md', format: 'markdown', label: 'Optimization Progress' },
          { path: 'artifacts/odd/FINAL_SCHEMA.md', format: 'markdown', label: 'Optimized Schema' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 6: PERFECT GRAPH CONSTRUCTION & CONVERGENCE
  // ============================================================================

  if (phase === 'full' || phase === 'perfect-graph') {
    ctx.log?.('info', 'Phase 6: Perfect graph construction and convergence...');

    const perfectGraphResult = await executeIterativePhase(
      ctx,
      'perfect-graph',
      {
        mainTask: perfectGraphConstructionTask,
        taskInputs: {
          projectName,
          optimizedSchema: results.schema,
          optimizedOntology: results.integratedOntology,
          empiricalValidation: results.empiricalValidation,
          optimizationLearnings: results.schemaOptimizations,
          targetQuality
        },
        qualityDimensions: ['graph_completeness', 'data_integrity', 'query_efficiency', 'semantic_richness'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Perfect Graph Construction & Convergence'
      }
    );

    results.knowledgeGraph = perfectGraphResult.result;
    results.metadata.phaseIterations['perfect-graph'] = perfectGraphResult.iterations;
    results.metadata.qualityScores['perfect-graph'] = perfectGraphResult.qualityMetrics;
    results.metadata.totalIterations += perfectGraphResult.iterations;
    artifacts.push(...(perfectGraphResult.artifacts || []));

    await ctx.breakpoint({
      question: `Perfect graph construction complete. Graph completeness: ${perfectGraphResult.result?.completenessScore}%, Semantic richness: ${perfectGraphResult.result?.semanticRichness}%, Query performance: ${perfectGraphResult.result?.queryPerformance}%. Proceed to remaining phases?`,
      title: 'Perfect Graph Review',
      context: {
        runId: ctx.runId,
        data: {
          completenessScore: perfectGraphResult.result?.completenessScore,
          semanticRichness: perfectGraphResult.result?.semanticRichness,
          queryPerformance: perfectGraphResult.result?.queryPerformance,
          graphStatistics: perfectGraphResult.result?.graphStatistics
        },
        files: [
          { path: 'artifacts/odd/PERFECT_GRAPH.md', format: 'markdown', label: 'Perfect Knowledge Graph' },
          { path: 'artifacts/odd/GRAPH_STATISTICS.md', format: 'markdown', label: 'Graph Statistics' },
          { path: 'artifacts/odd/SEMANTIC_ANALYSIS.md', format: 'markdown', label: 'Semantic Analysis' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 7: COMPREHENSIVE VALIDATION & VERIFICATION
  // ============================================================================

  if (phase === 'full' || phase === 'comprehensive-validation') {
    ctx.log?.('info', 'Phase 7: Comprehensive validation and verification...');

    const comprehensiveValidationResult = await executeIterativePhase(
      ctx,
      'comprehensive-validation',
      {
        mainTask: comprehensiveValidationTask,
        taskInputs: {
          projectName,
          perfectGraph: results.knowledgeGraph,
          optimizedSchema: results.schema,
          optimizedOntology: results.integratedOntology,
          empiricalHistory: results.empiricalValidation,
          optimizationHistory: results.schemaOptimizations,
          allResults: results
        },
        qualityDimensions: ['validation_completeness', 'verification_rigor', 'consistency_checking', 'stakeholder_validation'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Comprehensive Validation & Verification'
      }
    );

    results.comprehensiveValidation = comprehensiveValidationResult.result;
    results.metadata.phaseIterations['comprehensive-validation'] = comprehensiveValidationResult.iterations;
    results.metadata.qualityScores['comprehensive-validation'] = comprehensiveValidationResult.qualityMetrics;
    results.metadata.totalIterations += comprehensiveValidationResult.iterations;
    artifacts.push(...(comprehensiveValidationResult.artifacts || []));

    await ctx.breakpoint({
      question: `Comprehensive validation complete. Validation coverage: ${comprehensiveValidationResult.result?.validationCoverage}%, Consistency score: ${comprehensiveValidationResult.result?.consistencyScore}%, Stakeholder validation: ${comprehensiveValidationResult.result?.stakeholderValidationScore}%. Proceed to stress testing?`,
      title: 'Comprehensive Validation Review',
      context: {
        runId: ctx.runId,
        data: {
          validationCoverage: comprehensiveValidationResult.result?.validationCoverage,
          consistencyScore: comprehensiveValidationResult.result?.consistencyScore,
          stakeholderValidationScore: comprehensiveValidationResult.result?.stakeholderValidationScore,
          issuesFound: comprehensiveValidationResult.result?.issuesFound?.length
        },
        files: [
          { path: 'artifacts/odd/COMPREHENSIVE_VALIDATION.md', format: 'markdown', label: 'Validation Report' },
          { path: 'artifacts/odd/CONSISTENCY_ANALYSIS.md', format: 'markdown', label: 'Consistency Analysis' },
          { path: 'artifacts/odd/STAKEHOLDER_VALIDATION.md', format: 'markdown', label: 'Stakeholder Validation' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 8: STRESS TESTING & ROBUSTNESS ANALYSIS
  // ============================================================================

  if (phase === 'full' || phase === 'stress-testing') {
    ctx.log?.('info', 'Phase 8: Stress testing and robustness analysis...');

    const stressTestingResult = await executeIterativePhase(
      ctx,
      'stress-testing',
      {
        mainTask: stressTestingRobustnessTask,
        taskInputs: {
          projectName,
          perfectGraph: results.knowledgeGraph,
          comprehensiveValidation: results.comprehensiveValidation,
          stakeholderContext,
          domainType,
          projectComplexity,
          allResults: results
        },
        qualityDimensions: ['stress_test_coverage', 'robustness_score', 'failure_resilience', 'edge_case_handling'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Stress Testing & Robustness Analysis'
      }
    );

    results.stressTesting = stressTestingResult.result;
    results.metadata.phaseIterations['stress-testing'] = stressTestingResult.iterations;
    results.metadata.qualityScores['stress-testing'] = stressTestingResult.qualityMetrics;
    results.metadata.totalIterations += stressTestingResult.iterations;
    artifacts.push(...(stressTestingResult.artifacts || []));

    await ctx.breakpoint({
      question: `Stress testing complete. Test coverage: ${stressTestingResult.result?.testCoverage}%, Robustness score: ${stressTestingResult.result?.robustnessScore}%, Failure scenarios tested: ${stressTestingResult.result?.failureScenarios?.length}. Proceed to collaborative refinement?`,
      title: 'Stress Testing Review',
      context: {
        runId: ctx.runId,
        data: {
          testCoverage: stressTestingResult.result?.testCoverage,
          robustnessScore: stressTestingResult.result?.robustnessScore,
          failureScenarios: stressTestingResult.result?.failureScenarios?.length,
          vulnerabilities: stressTestingResult.result?.vulnerabilities?.length
        },
        files: [
          { path: 'artifacts/odd/STRESS_TESTING.md', format: 'markdown', label: 'Stress Testing Report' },
          { path: 'artifacts/odd/ROBUSTNESS_ANALYSIS.md', format: 'markdown', label: 'Robustness Analysis' },
          { path: 'artifacts/odd/FAILURE_SCENARIOS.md', format: 'markdown', label: 'Failure Scenarios' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 9: COLLABORATIVE REFINEMENT & STAKEHOLDER INTEGRATION
  // ============================================================================

  if (phase === 'full' || phase === 'collaborative-refinement') {
    ctx.log?.('info', 'Phase 9: Collaborative refinement and stakeholder integration...');

    const collaborativeRefinementResult = await executeIterativePhase(
      ctx,
      'collaborative-refinement',
      {
        mainTask: collaborativeRefinementTask,
        taskInputs: {
          projectName,
          perfectGraph: results.knowledgeGraph,
          stressTesting: results.stressTesting,
          comprehensiveValidation: results.comprehensiveValidation,
          stakeholderContext,
          domainType,
          allResults: results,
          targetQuality
        },
        qualityDimensions: ['stakeholder_satisfaction', 'collaborative_effectiveness', 'refinement_quality', 'integration_success'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Collaborative Refinement & Stakeholder Integration'
      }
    );

    results.collaborativeRefinement = collaborativeRefinementResult.result;
    results.metadata.phaseIterations['collaborative-refinement'] = collaborativeRefinementResult.iterations;
    results.metadata.qualityScores['collaborative-refinement'] = collaborativeRefinementResult.qualityMetrics;
    results.metadata.totalIterations += collaborativeRefinementResult.iterations;
    artifacts.push(...(collaborativeRefinementResult.artifacts || []));

    await ctx.breakpoint({
      question: `Collaborative refinement complete. Stakeholder satisfaction: ${collaborativeRefinementResult.result?.stakeholderSatisfaction}%, Integration success: ${collaborativeRefinementResult.result?.integrationSuccess}%, Refinements applied: ${collaborativeRefinementResult.result?.refinements?.length}. Proceed to remaining phases?`,
      title: 'Collaborative Refinement Review',
      context: {
        runId: ctx.runId,
        data: {
          stakeholderSatisfaction: collaborativeRefinementResult.result?.stakeholderSatisfaction,
          integrationSuccess: collaborativeRefinementResult.result?.integrationSuccess,
          refinements: collaborativeRefinementResult.result?.refinements?.length,
          collaborationQuality: collaborativeRefinementResult.result?.collaborationQuality
        },
        files: [
          { path: 'artifacts/odd/COLLABORATIVE_REFINEMENT.md', format: 'markdown', label: 'Collaborative Refinement' },
          { path: 'artifacts/odd/STAKEHOLDER_INTEGRATION.md', format: 'markdown', label: 'Stakeholder Integration' },
          { path: 'artifacts/odd/REFINEMENT_SUMMARY.md', format: 'markdown', label: 'Refinement Summary' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 2: COLLABORATIVE KNOWLEDGE GRAPH CONSTRUCTION (Legacy)
  // ============================================================================

  if (phase === 'full' || phase === 'graph') {
    ctx.log?.('info', 'Phase 2: Collaborative knowledge graph construction...');

    const phaseResult = await executeIterativePhase(
      ctx,
      'graph',
      {
        mainTask: buildCollaborativeKnowledgeGraphTask,
        taskInputs: {
          projectName,
          domainDescription,
          ontologyScope,
          projectComplexity,
          stakeholderContext,
          domainType,
          schema: results.schema,
          projectAnalysis: results.projectAnalysis,
          targetQuality
        },
        qualityDimensions: ['completeness', 'consistency', 'stakeholder_alignment', 'business_value', 'performance'],
        targetQuality,
        maxIterations: maxIterationsPerPhase,
        phaseName: 'Collaborative Knowledge Graph Construction'
      }
    );

    results.knowledgeGraph = phaseResult.result;
    results.metadata.phaseIterations['graph'] = phaseResult.iterations;
    results.metadata.qualityScores['graph'] = phaseResult.qualityMetrics;
    results.metadata.totalIterations += phaseResult.iterations;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // ============================================================================
  // REMAINING PHASES (ABBREVIATED FOR SPACE)
  // ============================================================================

  // Phase 3: Adaptive Generator Creation with Comprehensive Validation
  if (phase === 'full' || phase === 'generators') {
    ctx.log?.('info', 'Phase 3: Adaptive generator creation with comprehensive validation...');

    const phaseResult = await executeIterativePhase(ctx, 'generators', {
      mainTask: createAdaptiveGeneratorsTask,
      taskInputs: {
        projectName,
        knowledgeGraph: results.knowledgeGraph,
        currentSchema: results.schema,
        domainType,
        projectComplexity,
        targetQuality,
        evidenceFramework: evidenceBasedModelingFramework,
        validationFramework: comprehensiveValidationFramework
      },
      qualityDimensions: ['functionality', 'adaptability', 'performance', 'maintainability', 'validation_coverage'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Adaptive Generator Creation'
    });

    // Comprehensive generator validation
    const generatorValidation = await ctx.task(comprehensiveGeneratorValidationTask, {
      projectName,
      generators: phaseResult.result,
      knowledgeGraph: results.knowledgeGraph,
      schema: results.schema,
      validationFramework: comprehensiveValidationFramework,
      evidenceFramework: evidenceBasedModelingFramework,
      stakeholderContext,
      domainType
    });

    // Update validation framework with generator validation results
    comprehensiveValidationFramework.generatorValidation.outputQualityAssessment = generatorValidation.qualityAssessment;
    comprehensiveValidationFramework.generatorValidation.conformanceValidation = generatorValidation.conformanceResults;
    comprehensiveValidationFramework.generatorValidation.usabilityValidation = generatorValidation.usabilityResults;
    comprehensiveValidationFramework.generatorValidation.performanceValidation = generatorValidation.performanceResults;

    results.generators = phaseResult.result;
    results.generatorValidation = generatorValidation;
    results.metadata.phaseIterations['generators'] = phaseResult.iterations;
    results.metadata.qualityScores['generators'] = phaseResult.qualityMetrics;
    artifacts.push(...(phaseResult.artifacts || []));
    artifacts.push(...(generatorValidation.artifacts || []));

    await ctx.breakpoint({
      question: `Generator creation and validation complete. Generators created: ${phaseResult.result?.generatorCount || 0}, Validation score: ${generatorValidation.overallValidationScore}%, Performance rating: ${generatorValidation.performanceRating}/10. Proceed to documentation?`,
      title: 'Generator Validation Review',
      context: {
        runId: ctx.runId,
        data: {
          generatorCount: phaseResult.result?.generatorCount || 0,
          validationScore: generatorValidation.overallValidationScore,
          performanceRating: generatorValidation.performanceRating,
          conformanceIssues: generatorValidation.conformanceResults?.issuesFound || 0,
          usabilityScore: generatorValidation.usabilityResults?.score || 0
        },
        files: [
          { path: 'artifacts/odd/GENERATOR_VALIDATION_REPORT.md', format: 'markdown', label: 'Generator Validation' },
          { path: 'artifacts/odd/GENERATOR_PERFORMANCE_ANALYSIS.md', format: 'markdown', label: 'Performance Analysis' },
          { path: 'artifacts/odd/GENERATOR_CONFORMANCE_TESTING.md', format: 'markdown', label: 'Conformance Testing' }
        ]
      }
    });
  }

  // Phase 4: Strategic Documentation & Encyclopedia with Validation
  if (phase === 'full' || phase === 'documentation') {
    ctx.log?.('info', 'Phase 4: Strategic documentation and encyclopedia creation with validation...');

    const phaseResult = await executeIterativePhase(ctx, 'documentation', {
      mainTask: generateStrategicDocumentationTask,
      taskInputs: {
        projectName,
        knowledgeGraph: results.knowledgeGraph,
        currentSchema: results.schema,
        generators: results.generators,
        stakeholderContext,
        targetQuality,
        evidenceFramework: evidenceBasedModelingFramework,
        validationFramework: comprehensiveValidationFramework,
        ontologyScope
      },
      qualityDimensions: ['completeness', 'clarity', 'stakeholder_alignment', 'strategic_coherence', 'encyclopedia_quality'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Strategic Documentation & Encyclopedia'
    });

    // Comprehensive encyclopedia validation
    const encyclopediaValidation = await ctx.task(encyclopediaValidationTask, {
      projectName,
      documentation: phaseResult.result,
      knowledgeGraph: results.knowledgeGraph,
      schema: results.schema,
      evidenceFramework: evidenceBasedModelingFramework,
      validationFramework: comprehensiveValidationFramework,
      ontologyScope,
      stakeholderContext,
      domainType
    });

    // Cross-system validation of generators, documentation, and ontology
    const crossSystemValidation = await ctx.task(crossSystemValidationTask, {
      projectName,
      generators: results.generators,
      documentation: phaseResult.result,
      knowledgeGraph: results.knowledgeGraph,
      schema: results.schema,
      evidenceFramework: evidenceBasedModelingFramework,
      validationFramework: comprehensiveValidationFramework,
      allResults: results
    });

    // Update validation framework with results
    comprehensiveValidationFramework.encyclopediaValidation.completenessValidation = encyclopediaValidation.completenessResults;
    comprehensiveValidationFramework.encyclopediaValidation.accuracyValidation = encyclopediaValidation.accuracyResults;
    comprehensiveValidationFramework.encyclopediaValidation.consistencyValidation = encyclopediaValidation.consistencyResults;
    comprehensiveValidationFramework.crossSystemValidation.integrationValidation.push(crossSystemValidation.integrationResults);
    comprehensiveValidationFramework.crossSystemValidation.holisticValidation.push(crossSystemValidation.holisticResults);

    results.documentation = phaseResult.result;
    results.encyclopediaValidation = encyclopediaValidation;
    results.crossSystemValidation = crossSystemValidation;
    results.metadata.phaseIterations['documentation'] = phaseResult.iterations;
    results.metadata.qualityScores['documentation'] = phaseResult.qualityMetrics;
    artifacts.push(...(phaseResult.artifacts || []));
    artifacts.push(...(encyclopediaValidation.artifacts || []));
    artifacts.push(...(crossSystemValidation.artifacts || []));

    await ctx.breakpoint({
      question: `Documentation and encyclopedia validation complete. Encyclopedia coverage: ${encyclopediaValidation.coverageScore}%, Accuracy score: ${encyclopediaValidation.accuracyScore}%, Cross-system integration: ${crossSystemValidation.integrationScore}%. Proceed to testing phases?`,
      title: 'Encyclopedia & Cross-System Validation Review',
      context: {
        runId: ctx.runId,
        data: {
          encyclopediaCoverage: encyclopediaValidation.coverageScore,
          accuracyScore: encyclopediaValidation.accuracyScore,
          consistencyScore: encyclopediaValidation.consistencyScore,
          crossSystemIntegration: crossSystemValidation.integrationScore,
          holisticQuality: crossSystemValidation.holisticScore,
          validationIssues: encyclopediaValidation.issuesFound?.length || 0
        },
        files: [
          { path: 'artifacts/odd/ENCYCLOPEDIA_VALIDATION_REPORT.md', format: 'markdown', label: 'Encyclopedia Validation' },
          { path: 'artifacts/odd/CROSS_SYSTEM_VALIDATION.md', format: 'markdown', label: 'Cross-System Validation' },
          { path: 'artifacts/odd/DOCUMENTATION_QUALITY_ANALYSIS.md', format: 'markdown', label: 'Documentation Quality' }
        ]
      }
    });
  }

  // Phase 5: Multi-Level Testing & Quality
  if (phase === 'full' || phase === 'testing') {
    const phaseResult = await executeIterativePhase(ctx, 'testing', {
      mainTask: designMultiLevelTestingTask,
      taskInputs: { projectName, knowledgeGraph: results.knowledgeGraph, documentation: results.documentation, domainType, riskProfile, targetQuality },
      qualityDimensions: ['coverage', 'effectiveness', 'automation', 'risk_mitigation'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Multi-Level Testing & Quality'
    });
    results.testing = phaseResult.result;
    results.metadata.phaseIterations['testing'] = phaseResult.iterations;
    results.metadata.qualityScores['testing'] = phaseResult.qualityMetrics;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // Phase 6: Governance-Aware SDK Development
  if (phase === 'full' || phase === 'sdk') {
    const phaseResult = await executeIterativePhase(ctx, 'sdk', {
      mainTask: developEnterpriseSDKTask,
      taskInputs: { projectName, knowledgeGraph: results.knowledgeGraph, documentation: results.documentation, testing: results.testing, generators: results.generators, domainType, projectComplexity, targetQuality },
      qualityDimensions: ['functionality', 'performance', 'maintainability', 'enterprise_integration', 'security'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Enterprise SDK Development'
    });
    results.sdk = phaseResult.result;
    results.metadata.phaseIterations['sdk'] = phaseResult.iterations;
    results.metadata.qualityScores['sdk'] = phaseResult.qualityMetrics;
    results.metadata.totalIterations += phaseResult.iterations;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // Phase 7: Federated Interface Development
  if (phase === 'full' || phase === 'interfaces') {
    const phaseResult = await executeIterativePhase(ctx, 'interfaces', {
      mainTask: buildFederatedInterfacesTask,
      taskInputs: { projectName, knowledgeGraph: results.knowledgeGraph, sdk: results.sdk, documentation: results.documentation, testing: results.testing, stakeholderContext, domainType, targetQuality },
      qualityDimensions: ['functionality', 'usability', 'performance', 'enterprise_integration', 'stakeholder_alignment'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Federated Interface Development'
    });
    results.interfaces = phaseResult.result;
    results.metadata.phaseIterations['interfaces'] = phaseResult.iterations;
    results.metadata.qualityScores['interfaces'] = phaseResult.qualityMetrics;
    results.metadata.totalIterations += phaseResult.iterations;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // Phase 8: Scalable UI Development
  if (phase === 'full' || phase === 'ui') {
    const phaseResult = await executeIterativePhase(ctx, 'ui', {
      mainTask: createScalableUITask,
      taskInputs: { projectName, knowledgeGraph: results.knowledgeGraph, interfaces: results.interfaces, sdk: results.sdk, documentation: results.documentation, stakeholderContext, domainType, targetQuality },
      qualityDimensions: ['usability', 'accessibility', 'performance', 'responsive_design', 'stakeholder_satisfaction'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Scalable UI Development'
    });
    if (!results.interfaces) results.interfaces = {};
    results.interfaces.ui = phaseResult.result;
    results.metadata.phaseIterations['ui'] = phaseResult.iterations;
    results.metadata.qualityScores['ui'] = phaseResult.qualityMetrics;
    results.metadata.totalIterations += phaseResult.iterations;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // Phase 9: Governance & Risk Management
  if (phase === 'full' || phase === 'governance') {
    const phaseResult = await executeIterativePhase(ctx, 'governance', {
      mainTask: establishGovernanceTask,
      taskInputs: { projectName, allPhaseResults: results, stakeholderContext, riskProfile, projectComplexity, targetQuality },
      qualityDimensions: ['effectiveness', 'sustainability', 'compliance', 'stakeholder_satisfaction'],
      targetQuality, maxIterations: maxIterationsPerPhase, phaseName: 'Governance & Risk Management'
    });
    results.governance = phaseResult.result;
    results.metadata.phaseIterations['governance'] = phaseResult.iterations;
    results.metadata.qualityScores['governance'] = phaseResult.qualityMetrics;
    artifacts.push(...(phaseResult.artifacts || []));
  }

  // ============================================================================
  // CONTINUOUS RISK MONITORING & MITIGATION
  // ============================================================================

  if (phase === 'full') {
    ctx.log?.('info', 'Continuous risk monitoring and mitigation...');

    const riskMitigationResult = await ctx.task(continuousRiskMonitoringTask, {
      projectName,
      allResults: results,
      riskProfile,
      projectComplexity
    });

    results.riskMitigation = riskMitigationResult;
    artifacts.push(...(riskMitigationResult.artifacts || []));
  }

  // ============================================================================
  // REINFORCEMENT LEARNING ADAPTATION CYCLES
  // ============================================================================

  ctx.log?.('info', 'Executing reinforcement learning adaptation cycles...');

  // Schema self-validation and adaptive evolution cycle
  let schemaAdaptationIteration = 0;
  const maxSchemaAdaptationIterations = 3;
  let significantSchemaImprovementPotential = true;

  while (significantSchemaImprovementPotential && schemaAdaptationIteration < maxSchemaAdaptationIterations) {
    schemaAdaptationIteration++;
    ctx.log?.('info', `Schema adaptation cycle ${schemaAdaptationIteration}/${maxSchemaAdaptationIterations}`);

    // Self-validation and research on current schema
    const schemaValidationCycle = await ctx.task(schemaValidationResearchTask, {
      projectName,
      currentSchema: results.schema,
      allResults: results,
      evidenceFramework: evidenceBasedModelingFramework,
      validationFramework: comprehensiveValidationFramework,
      reinforcementLearningFramework,
      adaptationIteration: schemaAdaptationIteration,
      stakeholderContext,
      domainType
    });

    // Analyze validation results for adaptation opportunities
    const adaptationAnalysis = await ctx.task(adaptationOpportunityAnalysisTask, {
      projectName,
      validationResults: schemaValidationCycle,
      currentSchema: results.schema,
      adaptationHistory: reinforcementLearningFramework.adaptiveEvolution.schemaEvolutionHistory,
      evidenceFramework: evidenceBasedModelingFramework,
      qualityTargets: { targetQuality }
    });

    // Update frameworks with learning results
    reinforcementLearningFramework.selfValidationCycles.schemaValidationCycles.push(schemaValidationCycle);
    reinforcementLearningFramework.selfResearch.selfEvaluation[`schema-cycle-${schemaAdaptationIteration}`] = adaptationAnalysis.selfAssessment;

    // Check if significant improvement potential exists
    significantSchemaImprovementPotential = adaptationAnalysis.significantImprovementPotential;

    if (adaptationAnalysis.adaptationRecommended) {
      ctx.log?.('info', `Significant schema improvement potential detected. Implementing adaptations...`);

      // Execute schema adaptation based on validation learning
      const schemaAdaptation = await ctx.task(schemaAdaptationTask, {
        projectName,
        currentSchema: results.schema,
        adaptationOpportunities: adaptationAnalysis.opportunities,
        validationResults: schemaValidationCycle,
        evidenceFramework: evidenceBasedModelingFramework,
        stakeholderContext,
        adaptationStrategy: adaptationAnalysis.recommendedStrategy
      });

      // Update schema with adaptations
      results.schema = schemaAdaptation.adaptedSchema;
      reinforcementLearningFramework.adaptiveEvolution.schemaEvolutionHistory.push(schemaAdaptation.evolutionRecord);

      artifacts.push(...(schemaAdaptation.artifacts || []));

      await ctx.breakpoint({
        question: `Schema adaptation cycle ${schemaAdaptationIteration} complete. Schema improvements: ${schemaAdaptation.improvements?.length || 0}. Quality improvement: ${schemaAdaptation.qualityImprovement}%. Continue with ontology adaptation cycle?`,
        title: 'Schema Adaptation Review',
        context: {
          runId: ctx.runId,
          data: {
            adaptationIteration: schemaAdaptationIteration,
            improvements: schemaAdaptation.improvements?.length || 0,
            qualityImprovement: schemaAdaptation.qualityImprovement,
            significantPotentialRemaining: adaptationAnalysis.significantImprovementPotential,
            nextRecommendations: adaptationAnalysis.futureOpportunities
          },
          files: [
            { path: 'artifacts/odd/SCHEMA_ADAPTATION_REPORT.md', format: 'markdown', label: 'Schema Adaptation' },
            { path: 'artifacts/odd/VALIDATION_RESEARCH_RESULTS.md', format: 'markdown', label: 'Validation Research' },
            { path: 'artifacts/odd/ADAPTATION_ANALYSIS.md', format: 'markdown', label: 'Adaptation Analysis' }
          ]
        }
      });
    } else {
      ctx.log?.('info', 'No significant schema improvement potential detected. Proceeding to ontology validation.');
    }
  }

  // Full ontology validation and adaptive evolution cycle
  let ontologyAdaptationIteration = 0;
  const maxOntologyAdaptationIterations = 5;
  let significantOntologyImprovementPotential = true;

  while (significantOntologyImprovementPotential && ontologyAdaptationIteration < maxOntologyAdaptationIterations) {
    ontologyAdaptationIteration++;
    ctx.log?.('info', `Ontology adaptation cycle ${ontologyAdaptationIteration}/${maxOntologyAdaptationIterations}`);

    // Comprehensive ontology self-validation and research
    const ontologyValidationCycle = await ctx.task(ontologyValidationResearchTask, {
      projectName,
      currentOntology: results.knowledgeGraph,
      currentSchema: results.schema,
      allResults: results,
      evidenceFramework: evidenceBasedModelingFramework,
      validationFramework: comprehensiveValidationFramework,
      reinforcementLearningFramework,
      adaptationIteration: ontologyAdaptationIteration,
      stakeholderContext,
      domainType,
      ontologyScope
    });

    // Analyze ontology validation for adaptation opportunities
    const ontologyAdaptationAnalysis = await ctx.task(ontologyAdaptationAnalysisTask, {
      projectName,
      validationResults: ontologyValidationCycle,
      currentOntology: results.knowledgeGraph,
      currentSchema: results.schema,
      adaptationHistory: reinforcementLearningFramework.adaptiveEvolution.ontologyEvolutionHistory,
      evidenceFramework: evidenceBasedModelingFramework,
      qualityTargets: { targetQuality },
      allowSchemaChanges: true // Critical: Allow schema changes even late in process
    });

    // Update learning frameworks
    reinforcementLearningFramework.selfValidationCycles.ontologyValidationCycles.push(ontologyValidationCycle);
    reinforcementLearningFramework.selfResearch.improvementDiscovery.push(...ontologyAdaptationAnalysis.discoveredImprovements);

    significantOntologyImprovementPotential = ontologyAdaptationAnalysis.significantImprovementPotential;

    if (ontologyAdaptationAnalysis.adaptationRecommended) {
      ctx.log?.('info', `Significant ontology improvement potential detected. Implementing comprehensive adaptations...`);

      // Execute comprehensive ontology adaptation (including schema changes if needed)
      const ontologyAdaptation = await ctx.task(comprehensiveOntologyAdaptationTask, {
        projectName,
        currentOntology: results.knowledgeGraph,
        currentSchema: results.schema,
        adaptationOpportunities: ontologyAdaptationAnalysis.opportunities,
        validationResults: ontologyValidationCycle,
        evidenceFramework: evidenceBasedModelingFramework,
        stakeholderContext,
        adaptationStrategy: ontologyAdaptationAnalysis.recommendedStrategy,
        allowSchemaEvolution: true,
        qualityTargets: { targetQuality }
      });

      // Update both ontology and schema if changes were made
      results.knowledgeGraph = ontologyAdaptation.adaptedOntology;
      if (ontologyAdaptation.schemaChanges) {
        results.schema = ontologyAdaptation.adaptedSchema;
        reinforcementLearningFramework.adaptiveEvolution.schemaEvolutionHistory.push(ontologyAdaptation.schemaEvolutionRecord);
      }
      reinforcementLearningFramework.adaptiveEvolution.ontologyEvolutionHistory.push(ontologyAdaptation.ontologyEvolutionRecord);

      artifacts.push(...(ontologyAdaptation.artifacts || []));

      await ctx.breakpoint({
        question: `Ontology adaptation cycle ${ontologyAdaptationIteration} complete. Ontology improvements: ${ontologyAdaptation.ontologyImprovements?.length || 0}. Schema changes: ${ontologyAdaptation.schemaChanges ? 'Yes' : 'No'}. Quality improvement: ${ontologyAdaptation.qualityImprovement}%. Continue adaptation or proceed?`,
        title: 'Ontology Adaptation Review',
        context: {
          runId: ctx.runId,
          data: {
            adaptationIteration: ontologyAdaptationIteration,
            ontologyImprovements: ontologyAdaptation.ontologyImprovements?.length || 0,
            schemaChanged: ontologyAdaptation.schemaChanges,
            qualityImprovement: ontologyAdaptation.qualityImprovement,
            significantPotentialRemaining: ontologyAdaptationAnalysis.significantImprovementPotential,
            discoveredPatterns: ontologyAdaptationAnalysis.discoveredPatterns?.length || 0
          },
          files: [
            { path: 'artifacts/odd/ONTOLOGY_ADAPTATION_REPORT.md', format: 'markdown', label: 'Ontology Adaptation' },
            { path: 'artifacts/odd/ONTOLOGY_VALIDATION_RESEARCH.md', format: 'markdown', label: 'Ontology Validation' },
            { path: 'artifacts/odd/COMPREHENSIVE_ADAPTATION_ANALYSIS.md', format: 'markdown', label: 'Adaptation Analysis' }
          ]
        }
      });
    }
  }

  // Update metadata with reinforcement learning results
  results.metadata.schemaAdaptationCycles = schemaAdaptationIteration;
  results.metadata.ontologyAdaptationCycles = ontologyAdaptationIteration;
  results.metadata.totalAdaptations = reinforcementLearningFramework.adaptiveEvolution.schemaEvolutionHistory.length + reinforcementLearningFramework.adaptiveEvolution.ontologyEvolutionHistory.length;

  // ============================================================================
  // DYNAMIC CONVERGENCE ANALYSIS & ADAPTIVE PROCESS OPTIMIZATION
  // ============================================================================

  ctx.log?.('info', 'Analyzing dynamic convergence patterns and process resilience...');

  // Analyze convergence patterns across all phases
  const convergenceAnalysis = await ctx.task(dynamicConvergenceAnalysisTask, {
    projectName,
    allResults: results,
    convergenceManager: dynamicConvergenceManager,
    processContext: processEvolutionContext,
    multiLevelLearning,
    phaseQualityHistory: results.metadata.qualityScores,
    stakeholderFeedback: results.metadata.stakeholderAlignment
  });

  dynamicConvergenceManager.convergenceHistory.push(convergenceAnalysis);
  dynamicConvergenceManager.convergenceVelocity = convergenceAnalysis.convergenceVelocity;

  // Evaluate process resilience and adaptation needs
  const resilienceAnalysis = await ctx.task(processResilienceAnalysisTask, {
    projectName,
    allResults: results,
    resilienceFramework: processResilienceFramework,
    processContext: processEvolutionContext,
    convergenceAnalysis,
    riskProfile,
    projectComplexity
  });

  processResilienceFramework.resilienceMonitoring.systemHealthIndicators.push(resilienceAnalysis.healthIndicators);
  processResilienceFramework.failureScenarios.edgeCaseScenarios.push(...resilienceAnalysis.identifiedEdgeCases);

  // Implement adaptive optimizations based on convergence analysis
  if (convergenceAnalysis.adaptiveOptimizationsNeeded) {
    ctx.log?.('info', 'Implementing adaptive process optimizations...');

    const adaptiveOptimizations = await ctx.task(adaptiveProcessOptimizationTask, {
      projectName,
      allResults: results,
      convergenceAnalysis,
      resilienceAnalysis,
      processContext: processEvolutionContext,
      optimizationTargets: convergenceAnalysis.optimizationTargets
    });

    // Apply dynamic adjustments to remaining process execution
    processEvolutionContext.adaptiveInsights.push(adaptiveOptimizations.processAdjustments);
    adaptiveQualityManager.adaptationReasons.push(adaptiveOptimizations.qualityAdjustments);

    artifacts.push(...(adaptiveOptimizations.artifacts || []));
  }

  // Check for emergent behaviors and breakthrough indicators
  const emergentBehaviorAnalysis = await ctx.task(emergentBehaviorDetectionTask, {
    projectName,
    allResults: results,
    processContext: processEvolutionContext,
    convergenceHistory: dynamicConvergenceManager.convergenceHistory,
    multiLevelLearning,
    innovationPatterns: processEvolutionContext.processPatterns.innovationPatterns
  });

  dynamicConvergenceManager.emergentBehaviors.push(...emergentBehaviorAnalysis.detectedBehaviors);

  if (emergentBehaviorAnalysis.breakthroughIndicators.length > 0) {
    ctx.log?.('info', `Detected ${emergentBehaviorAnalysis.breakthroughIndicators.length} potential breakthrough opportunities`);

    await ctx.breakpoint({
      question: `Emergent behavior analysis detected potential breakthrough opportunities. Review findings and decide whether to pursue breakthrough exploration or continue with current approach?`,
      title: 'Breakthrough Opportunity Detection',
      context: {
        runId: ctx.runId,
        data: {
          breakthroughIndicators: emergentBehaviorAnalysis.breakthroughIndicators,
          emergentBehaviors: emergentBehaviorAnalysis.detectedBehaviors,
          convergenceVelocity: dynamicConvergenceManager.convergenceVelocity,
          recommendedActions: emergentBehaviorAnalysis.recommendedActions
        },
        files: [
          { path: 'artifacts/odd/CONVERGENCE_ANALYSIS.md', format: 'markdown', label: 'Convergence Analysis' },
          { path: 'artifacts/odd/RESILIENCE_ANALYSIS.md', format: 'markdown', label: 'Resilience Analysis' },
          { path: 'artifacts/odd/EMERGENT_BEHAVIOR_REPORT.md', format: 'markdown', label: 'Emergent Behavior Analysis' }
        ]
      }
    });
  }

  // ============================================================================
  // DEBT-DRIVEN DEVELOPMENT: TOP-DOWN GAP ANALYSIS BETWEEN PHASES
  // ============================================================================

  if (phase === 'full') {
    ctx.log?.('info', 'Starting debt-driven development: top-down gap analysis between phases...');

    let debtIterations = 0;
    const maxDebtIterations = Math.min(maxIterationsPerPhase, 3);
    let significantGapsFound = true;

    while (significantGapsFound && debtIterations < maxDebtIterations) {
      debtIterations++;
      ctx.log?.('info', `Debt-driven iteration ${debtIterations}/${maxDebtIterations}`);

      // Top-down gap analysis across all phases
      const crossPhaseGaps = await ctx.task(crossPhaseGapAnalysisTask, {
        projectName,
        allResults: results,
        targetQuality,
        realWorldContext: {
          // Real world against graph and schema
          newInformation: 'latest market trends, competitor analysis, regulatory updates',
          thirdPartyUpdates: 'technology changes, platform updates, security vulnerabilities',
          userFeedback: 'stakeholder feedback, early user testing, business metric changes',
          analyticsData: 'usage patterns, performance metrics, error rates'
        },
        gapTypes: [
          'real-world-vs-graph',    // 1. real world against graph and its schema
          'graph-vs-docs',          // 2. graph against docs
          'quality-vs-docs',        // 3. quality and delivery process against docs
          'generators-vs-docs',     // 4. generators against docs
          'sdk-vs-docs',           // 5. sdk against docs and stuff above
          'interfaces-vs-sdk',     // 6. programmable interfaces against sdk and everything above
          'ui-vs-everything'       // 7. interfaces against everything above
        ],
        iteration: debtIterations
      });

      artifacts.push(...(crossPhaseGaps.artifacts || []));

      if (crossPhaseGaps.significantGaps && crossPhaseGaps.significantGaps.length > 0) {
        ctx.log?.('info', `Found ${crossPhaseGaps.significantGaps.length} significant cross-phase gaps`);

        // Prioritize gaps by impact and cascade effects
        const gapPrioritization = await ctx.task(gapPrioritizationTask, {
          gaps: crossPhaseGaps.significantGaps,
          allResults: results,
          projectContext: { projectName, domainType, riskProfile, stakeholderContext },
          iteration: debtIterations
        });

        artifacts.push(...(gapPrioritization.artifacts || []));

        // Process high-priority gaps first
        for (const prioritizedGap of gapPrioritization.prioritizedGaps) {
          if (prioritizedGap.priority === 'critical' || prioritizedGap.priority === 'high') {
            ctx.log?.('info', `Addressing ${prioritizedGap.priority} gap: ${prioritizedGap.description}`);

            // Update affected phases based on gap analysis
            const gapResolution = await ctx.task(gapResolutionTask, {
              gap: prioritizedGap,
              allResults: results,
              targetQuality,
              affectedPhases: prioritizedGap.affectedPhases,
              iteration: debtIterations
            });

            artifacts.push(...(gapResolution.artifacts || []));

            // Update results with gap resolutions
            if (gapResolution.updatedResults) {
              Object.assign(results, gapResolution.updatedResults);
            }
          }
        }

        // Check if gaps are resolved or if we need another iteration
        const gapResolutionCheck = await ctx.task(gapResolutionVerificationTask, {
          originalGaps: crossPhaseGaps.significantGaps,
          allResults: results,
          targetQuality,
          iteration: debtIterations
        });

        artifacts.push(...(gapResolutionCheck.artifacts || []));
        significantGapsFound = gapResolutionCheck.remainingCriticalGaps > 0;

        if (significantGapsFound) {
          ctx.log?.('info', `${gapResolutionCheck.remainingCriticalGaps} critical gaps remain`);
        } else {
          ctx.log?.('info', 'All critical gaps resolved through debt-driven development');
        }
      } else {
        significantGapsFound = false;
        ctx.log?.('info', 'No significant cross-phase gaps found');
      }

      // Breakpoint for complex gap resolution decisions
      if (significantGapsFound && debtIterations >= maxDebtIterations - 1) {
        await ctx.breakpoint({
          question: `Debt-driven development has completed ${debtIterations} iterations with remaining gaps. Continue iterating or proceed with current state?`,
          title: 'Debt-Driven Development Decision',
          context: {
            runId: ctx.runId,
            data: {
              debtIterations,
              maxDebtIterations,
              remainingGaps: crossPhaseGaps?.significantGaps?.length || 0,
              criticalGaps: crossPhaseGaps?.significantGaps?.filter(g => g.severity === 'critical').length || 0
            }
          }
        });
      }
    }

    results.metadata.debtIterations = debtIterations;
    ctx.log?.('info', `Debt-driven development completed in ${debtIterations} iterations`);
  }

  // ============================================================================
  // FINAL QUALITY ASSESSMENT & BUSINESS VALUE MEASUREMENT
  // ============================================================================

  const finalQualityAssessment = await ctx.task(comprehensiveQualityAssessmentTask, {
    projectName,
    allResults: results,
    targetQuality,
    stakeholderContext,
    projectComplexity
  });

  results.metadata.overallQuality = finalQualityAssessment.overallScore;
  results.metadata.businessValueScore = finalQualityAssessment.businessValue;
  results.metadata.stakeholderSatisfaction = finalQualityAssessment.stakeholderAlignment;

  await ctx.breakpoint({
    question: 'Enhanced Ontology-Driven Development complete. Review comprehensive quality metrics and business value assessment?',
    title: 'Final Enhanced ODD Review',
    context: {
      runId: ctx.runId,
      data: {
        projectName,
        overallQuality: results.metadata.overallQuality,
        businessValue: results.metadata.businessValueScore,
        stakeholderSatisfaction: results.metadata.stakeholderSatisfaction,
        totalIterations: results.metadata.totalIterations,
        riskMitigationScore: results.riskMitigation?.effectivenessScore || 0
      },
      files: [
        { path: 'artifacts/odd/FINAL_QUALITY_ASSESSMENT.md', format: 'markdown', label: 'Quality Assessment' },
        { path: 'artifacts/odd/BUSINESS_VALUE_REPORT.md', format: 'markdown', label: 'Business Value Report' },
        { path: 'artifacts/odd/GOVERNANCE_FRAMEWORK.md', format: 'markdown', label: 'Governance Framework' }
      ]
    }
  });

  return {
    success: results.metadata.overallQuality >= targetQuality * 0.8,
    ...results,
    // Enhanced process intelligence frameworks
    dynamicConvergenceManager,
    processResilienceFramework,
    multiLevelLearning,
    processEvolutionContext,
    // Evidence-based modeling framework
    evidenceBasedModelingFramework,
    // Comprehensive validation framework
    comprehensiveValidationFramework,
    // Reinforcement learning framework
    reinforcementLearningFramework,
    artifacts,
    metadata: {
      ...results.metadata,
      completedPhases: phase === 'full' ? 10 : 1,
      totalArtifacts: artifacts.length,
      qualityAchieved: results.metadata.overallQuality >= targetQuality,
      enhancementLevel: 'enterprise',
      // Enhanced process intelligence metrics
      convergenceVelocity: dynamicConvergenceManager.convergenceVelocity,
      emergentBehaviors: dynamicConvergenceManager.emergentBehaviors.length,
      processResilienceScore: processResilienceFramework.resilienceMonitoring?.systemHealthIndicators?.length || 0,
      adaptiveOptimizations: processEvolutionContext.adaptiveInsights.length,
      breakthroughOpportunities: dynamicConvergenceManager.emergentBehaviors.filter(b => b.significance === 'breakthrough').length,
      processInnovations: processEvolutionContext.processIntelligence.processInnovations.length,
      cognitiveOptimization: processEvolutionContext.cognitiveLoadManagement.complexityReductionStrategies.length,
      multiLevelLearningDepth: Object.keys(multiLevelLearning).reduce((sum, key) => sum + multiLevelLearning[key].length, 0),
      // Evidence-based modeling metrics
      evidenceCollectionCount: evidenceBasedModelingFramework.evidenceCollection.primarySources.length +
                                        evidenceBasedModelingFramework.evidenceCollection.secondarySources.length +
                                        evidenceBasedModelingFramework.evidenceCollection.empiricalExperiments.length +
                                        evidenceBasedModelingFramework.evidenceCollection.reproducibleResearch.length +
                                        evidenceBasedModelingFramework.evidenceCollection.crowdSourcedValidation.length,
      evidenceQualityScore: calculateAverageEvidenceQuality(evidenceBasedModelingFramework),
      sourceCredibilityScore: calculateAverageCredibilityScore(evidenceBasedModelingFramework),
      evidenceGapsIdentified: evidenceBasedModelingFramework.evidenceIntegration.evidenceGaps.length,
      biasesIdentifiedAndMitigated: Object.keys(evidenceBasedModelingFramework.evidenceValidation.biasAssessment).length,
      evidenceValidationCoverage: calculateEvidenceValidationCoverage(evidenceBasedModelingFramework),
    // Validation framework metrics
    validationCoverageScore: calculateValidationCoverage(comprehensiveValidationFramework),
    generatorValidationScore: results.generatorValidation?.overallValidationScore || 0,
    encyclopediaValidationScore: results.encyclopediaValidation?.coverageScore || 0,
    crossSystemIntegrationScore: results.crossSystemValidation?.integrationScore || 0,
    // Reinforcement learning metrics
    adaptationCyclesCompleted: results.metadata.schemaAdaptationCycles + results.metadata.ontologyAdaptationCycles,
    learningVelocity: calculateLearningVelocity(reinforcementLearningFramework),
    adaptationEffectiveness: calculateAdaptationEffectiveness(reinforcementLearningFramework),
    selfImprovementScore: calculateSelfImprovementScore(reinforcementLearningFramework)
    }
  };
}

// ============================================================================
// META-LEARNING & PROCESS ADAPTATION FRAMEWORK
// ============================================================================

/**
 * Execute advanced multi-dimensional meta-learning analysis after each phase
 * Captures insights across tactical, strategic, methodological, and paradigmatic levels
 */
async function executeAdvancedMetaLearningAnalysis(ctx, phaseName, config) {
  const {
    phaseResult,
    processContext,
    adaptiveQualityManager,
    allResults,
    multiLevelLearning,
    previousPhaseLearnings = []
  } = config;

  ctx.log?.('info', `Advanced meta-learning analysis for ${phaseName}...`);

  // Multi-dimensional learning analysis
  const advancedMetaLearning = await ctx.task(advancedMetaLearningTask, {
    phaseName,
    phaseResult,
    processContext,
    adaptiveQualityManager,
    allResults,
    multiLevelLearning,
    previousPhaseLearnings
  });

  // Process pattern recognition and intelligence enhancement
  const patternRecognition = await ctx.task(processPatternRecognitionTask, {
    phaseName,
    phaseResult,
    processContext,
    historicalPatterns: processContext.processPatterns,
    learningHistory: previousPhaseLearnings
  });

  // Contextual adaptation analysis
  const contextualAdaptation = await ctx.task(contextualAdaptationTask, {
    phaseName,
    phaseResult,
    processContext,
    domainType: allResults.domainType,
    stakeholderContext: allResults.stakeholderContext,
    projectComplexity: allResults.projectComplexity
  });

  return {
    insights: advancedMetaLearning,
    processDecisions: advancedMetaLearning.processDecisions,
    contingencyTriggers: advancedMetaLearning.contingencyTriggers,
    updatedQualityManager: advancedMetaLearning.updatedQualityManager,
    updatedMultiLevelLearning: advancedMetaLearning.updatedMultiLevelLearning,
    crossPhaseInsights: advancedMetaLearning.crossPhaseInsights,
    recognizedPatterns: patternRecognition.recognizedPatterns,
    contextualOptimizations: contextualAdaptation.optimizations,
    artifacts: [
      ...(advancedMetaLearning.artifacts || []),
      ...(patternRecognition.artifacts || []),
      ...(contextualAdaptation.artifacts || [])
    ]
  };
}

/**
 * Execute process validation and contingency analysis
 * Validates process decisions and activates contingencies when needed
 */
async function executeProcessValidation(ctx, config) {
  const {
    phaseName,
    phaseResult,
    processDecisions,
    processContext,
    contingencyTriggers
  } = config;

  ctx.log?.('info', `Process validation for ${phaseName}...`);

  const processValidation = await ctx.task(processValidationTask, {
    phaseName,
    phaseResult,
    processDecisions,
    processContext,
    contingencyTriggers
  });

  return {
    validationResults: processValidation.validationResults,
    contingencyActions: processValidation.contingencyActions,
    updatedProcessContext: processValidation.updatedProcessContext,
    processQualityScore: processValidation.processQualityScore,
    artifacts: processValidation.artifacts || []
  };
}

/**
 * Optimize cognitive load and stakeholder experience
 * Manages complexity and enhances stakeholder engagement
 */
async function optimizeCognitiveLoad(ctx, config) {
  const {
    phaseName,
    stakeholderFeedback,
    complexityMetrics,
    processContext
  } = config;

  const cognitiveOptimization = await ctx.task(cognitiveLoadOptimizationTask, {
    phaseName,
    stakeholderFeedback,
    complexityMetrics,
    processContext,
    currentCognitiveManagement: processContext.cognitiveLoadManagement
  });

  return {
    optimizedCognitiveManagement: cognitiveOptimization.optimizedManagement,
    stakeholderExperienceImprovements: cognitiveOptimization.experienceImprovements,
    complexityReductionStrategies: cognitiveOptimization.complexityReductions,
    artifacts: cognitiveOptimization.artifacts || []
  };
}

/**
 * Detect process innovation opportunities and breakthrough potential
 * Identifies when fundamental process shifts or innovations are possible
 */
async function detectProcessInnovationOpportunities(ctx, config) {
  const {
    currentPhase,
    phaseResults,
    processLearnings,
    processContext,
    multiLevelLearning
  } = config;

  const innovationDetection = await ctx.task(processInnovationDetectionTask, {
    currentPhase,
    phaseResults,
    processLearnings,
    processContext,
    multiLevelLearning,
    innovationPatterns: processContext.processPatterns.innovationPatterns
  });

  return {
    breakthroughOpportunities: innovationDetection.breakthroughOpportunities,
    processInnovations: innovationDetection.processInnovations,
    paradigmShiftIndicators: innovationDetection.paradigmShiftIndicators,
    innovationRecommendations: innovationDetection.recommendations,
    artifacts: innovationDetection.artifacts || []
  };
}

/**
 * Apply cross-phase optimizations based on learnings
 */
async function applyCrossPhaseOptimizations(ctx, results, crossPhaseInsights) {
  if (crossPhaseInsights && crossPhaseInsights.length > 0) {
    ctx.log?.('info', 'Applying cross-phase optimizations...');

    const optimizationResult = await ctx.task(crossPhaseOptimizationTask, {
      crossPhaseInsights,
      currentResults: results,
      optimizationType: 'learning-transfer'
    });

    // Update results based on cross-phase optimizations
    if (optimizationResult.optimizedResults) {
      Object.assign(results, optimizationResult.optimizedResults);
    }

    return optimizationResult;
  }
  return null;
}

/**
 * Determine adaptive quality target based on process learnings and context
 */
async function determineAdaptiveQualityTarget(ctx, phaseId, config) {
  const {
    baseTarget,
    adaptiveQualityManager,
    processContext,
    previousPhaseLearnings
  } = config;

  const adaptiveTargetResult = await ctx.task(adaptiveTargetDeterminationTask, {
    phaseId,
    baseTarget,
    adaptiveQualityManager,
    processContext,
    previousPhaseLearnings
  });

  return adaptiveTargetResult.adaptiveTarget;
}

/**
 * Progressive quality evolution based on process learning
 */
async function evolveQualityTargets(ctx, adaptiveQualityManager, phaseResults, processLearnings) {
  const qualityEvolution = await ctx.task(qualityEvolutionTask, {
    currentQualityManager: adaptiveQualityManager,
    phaseResults,
    processLearnings,
    evolutionStrategy: 'progressive-improvement'
  });

  return qualityEvolution.evolvedQualityTargets;
}

/**
 * Evaluate and potentially resequence phases based on process learnings
 */
async function evaluatePhaseSequenceOptimization(ctx, processContext, allResults, upcomingPhases) {
  if (processContext.adaptiveInsights.length >= 2) {
    const sequenceOptimization = await ctx.task(phaseSequenceOptimizationTask, {
      currentSequence: processContext.phaseSequence,
      adaptiveInsights: processContext.adaptiveInsights,
      allResults,
      upcomingPhases,
      processEfficiency: processContext.processEfficiencyMetrics
    });

    if (sequenceOptimization.recommendSequenceChange) {
      return sequenceOptimization.optimizedSequence;
    }
  }
  return null;
}

// ============================================================================
// ENHANCED PHASE EXECUTION FRAMEWORK
// ============================================================================

/**
 * Execute individual phase with internal iterative convergence and adaptive optimization
 * Each phase iterates internally until it converges its own deliverables with progressive quality enhancement
 */
async function executeIterativePhase(ctx, phaseId, config) {
  const {
    mainTask,
    taskInputs,
    qualityDimensions,
    targetQuality,
    maxIterations,
    phaseName,
    adaptiveQualityManager,
    processContext,
    previousPhaseLearnings = []
  } = config;

  ctx.log?.('info', `Starting adaptive iterative convergence for ${phaseName}`);

  let iteration = 0;
  let converged = false;
  let currentResult = null;
  let qualityHistory = [];
  let artifacts = [];

  // Determine adaptive quality target based on process learnings
  const adaptiveTarget = await determineAdaptiveQualityTarget(ctx, phaseId, {
    baseTarget: targetQuality,
    adaptiveQualityManager,
    processContext,
    previousPhaseLearnings
  });

  // Enhanced gap identification with cross-phase learning integration
  const initialGaps = await ctx.task(adaptiveGapIdentificationTask, {
    phase: phaseId,
    phaseName,
    qualityDimensions,
    targetQuality: adaptiveTarget,
    context: taskInputs,
    previousPhaseLearnings,
    crossPhaseInsights: processContext.adaptiveInsights
  });

  artifacts.push(...(initialGaps.artifacts || []));

  while (!converged && iteration < maxIterations) {
    iteration++;
    ctx.log?.('info', `${phaseName} - Iteration ${iteration}/${maxIterations}`);

    // Execute the main phase task
    const phaseResult = await ctx.task(mainTask, {
      ...taskInputs,
      iteration,
      previousResult: currentResult,
      identifiedGaps: initialGaps.gaps,
      targetQuality,
      improvementPlan: iteration > 1 ? currentResult?.improvementPlan : null
    });

    artifacts.push(...(phaseResult.artifacts || []));

    // Internal gap analysis - find gaps in current phase output
    const gapAnalysis = await ctx.task(internalGapAnalysisTask, {
      phase: phaseId,
      deliverable: phaseResult,
      expectedOutcomes: initialGaps.expectedOutcomes,
      qualityDimensions,
      iteration,
      context: taskInputs
    });

    artifacts.push(...(gapAnalysis.artifacts || []));

    // Internal adversarial review of phase deliverable
    const adversarialReview = await ctx.task(adversarialReviewTask, {
      phase: phaseId,
      deliverable: phaseResult,
      context: taskInputs,
      iteration
    });

    artifacts.push(...(adversarialReview.artifacts || []));

    // Quality assessment specific to this phase
    const qualityAssessment = await ctx.task(qualityAssessmentTask, {
      phase: phaseId,
      deliverable: phaseResult,
      context: taskInputs,
      adversarialReview,
      iteration,
      targetQuality
    });

    artifacts.push(...(qualityAssessment.artifacts || []));
    qualityHistory.push(qualityAssessment);

    // Convergence assessment - has this phase converged?
    const convergenceResult = await ctx.task(convergenceAssessmentTask, {
      phase: phaseId,
      qualityHistory,
      currentQuality: qualityAssessment,
      adversarialReview,
      gapAnalysis,
      context: taskInputs,
      iteration,
      maxIterations,
      targetQuality
    });

    artifacts.push(...(convergenceResult.artifacts || []));

    currentResult = {
      ...phaseResult,
      qualityMetrics: qualityAssessment,
      gaps: gapAnalysis.gaps,
      adversarialFindings: adversarialReview,
      convergenceStatus: convergenceResult,
      improvementPlan: convergenceResult.recommendations
    };

    converged = convergenceResult.hasConverged;

    if (!converged) {
      ctx.log?.('info', `${phaseName} - Quality: ${qualityAssessment.overallScore}/${targetQuality}, Convergence: ${convergenceResult.convergenceReason}`);

      // Optional breakpoint for critical phases or when iteration limit approaching
      if (iteration >= maxIterations - 1 || qualityAssessment.overallScore < targetQuality * 0.7) {
        await ctx.breakpoint({
          question: `${phaseName} has not converged after ${iteration} iterations (Quality: ${qualityAssessment.overallScore}/${targetQuality}). Continue iterating or proceed with current result?`,
          title: `${phaseName} Convergence Decision`,
          context: {
            runId: ctx.runId,
            data: {
              iteration,
              maxIterations,
              quality: qualityAssessment.overallScore,
              targetQuality,
              convergenceReason: convergenceResult.convergenceReason,
              criticalIssues: adversarialReview.flaws.filter(f => f.severity === 'critical').length,
              majorIssues: adversarialReview.flaws.filter(f => f.severity === 'major').length
            }
          }
        });
      }
    } else {
      ctx.log?.('info', `${phaseName} converged in ${iteration} iterations with quality ${qualityAssessment.overallScore}/${targetQuality}`);
    }
  }

  return {
    result: currentResult,
    iterations: iteration,
    converged,
    qualityMetrics: qualityHistory[qualityHistory.length - 1],
    artifacts
  };
}

/**
 * Execute phase with iterative convergence, adversarial review, and quality gates
 */
async function executeEnhancedPhase(ctx, phaseId, config) {
  const {
    mainTask,
    taskInputs,
    qualityDimensions,
    targetQuality,
    maxIterations,
    phaseName
  } = config;

  let qualityMetrics = {};
  let iteration = 0;
  let result = null;
  const artifacts = [];
  let overallQuality = 0;
  let converged = false;

  ctx.log?.('info', `Starting iterative convergence for ${phaseName} (target: ${targetQuality})`);

  // ITERATIVE CONVERGENCE LOOP WITH ADVERSARIAL REVIEW
  while (!converged && overallQuality < targetQuality && iteration < maxIterations) {
    iteration++;
    ctx.log?.('info', `${phaseName} - Convergence Iteration ${iteration}/${maxIterations}`);

    // ========================================================================
    // STEP 1: EXECUTE MAIN PHASE TASK
    // ========================================================================
    const mainTaskInputs = {
      ...taskInputs,
      iteration,
      previousResult: result,
      qualityTargets: qualityDimensions.reduce((acc, dim) => ({ ...acc, [dim]: targetQuality }), {}),
      improvementPlan: iteration > 1 ? taskInputs.improvementPlan : null
    };

    result = await ctx.task(mainTask, mainTaskInputs);
    artifacts.push(...(result.artifacts || []));

    ctx.log?.('info', `${phaseName} - Phase task completed for iteration ${iteration}`);

    // ========================================================================
    // STEP 2: ADVERSARIAL REVIEW - ACTIVELY SEEK FLAWS
    // ========================================================================
    ctx.log?.('info', `${phaseName} - Conducting adversarial review iteration ${iteration}`);

    const adversarialReview = await ctx.task(adversarialReviewTask, {
      phaseResult: result,
      iteration,
      phaseName,
      stakeholderContext: taskInputs.stakeholderContext || 'multi-team',
      qualityDimensions,
      targetQuality,
      previousIterations: iteration > 1 ? { qualityMetrics, overallQuality } : null
    });

    ctx.log?.('info', `${phaseName} - Adversarial review found ${adversarialReview.issues?.length || 0} issues`);

    // ========================================================================
    // STEP 3: MULTI-DIMENSIONAL QUALITY SCORING
    // ========================================================================
    ctx.log?.('info', `${phaseName} - Quality scoring iteration ${iteration}`);

    const qualityAssessment = await ctx.task(qualityAssessmentTask, {
      phaseResult: result,
      adversarialReview,
      qualityDimensions,
      targetQuality,
      iteration,
      phaseName,
      previousQuality: overallQuality
    });

    qualityMetrics = qualityAssessment.dimensionalScores;
    const newOverallQuality = qualityAssessment.overall;
    const qualityImprovement = newOverallQuality - overallQuality;
    overallQuality = newOverallQuality;

    ctx.log?.('info', `${phaseName} - Quality Score: ${overallQuality}/${targetQuality} (improvement: +${qualityImprovement.toFixed(1)})`);

    // ========================================================================
    // STEP 4: CONVERGENCE ASSESSMENT
    // ========================================================================
    const convergenceResult = await ctx.task(convergenceAssessmentTask, {
      currentQuality: overallQuality,
      targetQuality,
      qualityImprovement,
      iteration,
      maxIterations,
      adversarialReview,
      qualityTrend: iteration > 1 ? qualityMetrics : null
    });

    converged = convergenceResult.converged;
    const shouldContinue = convergenceResult.shouldContinue;

    // ========================================================================
    // STEP 5: BUSINESS VALUE AND RISK ASSESSMENT
    // ========================================================================
    const businessValueResult = await ctx.task(businessValueMeasurementTask, {
      phaseResult: result,
      qualityMetrics,
      iteration,
      phaseName
    });

    const riskAssessment = await ctx.task(phaseRiskAssessmentTask, {
      phaseResult: result,
      qualityMetrics,
      businessValue: businessValueResult,
      iteration,
      phaseName,
      adversarialFindings: adversarialReview.issues
    });

    // ========================================================================
    // STEP 6: COMPLEXITY AND TECHNICAL DEBT MONITORING
    // ========================================================================
    const complexityMetrics = await ctx.task(complexityMonitoringTask, {
      phaseResult: result,
      iteration,
      phaseName,
      qualityTrend: { previous: overallQuality - qualityImprovement, current: overallQuality }
    });

    ctx.log?.('info', `${phaseName} Iteration ${iteration} Summary:`);
    ctx.log?.('info', `  Quality: ${overallQuality}/${targetQuality}`);
    ctx.log?.('info', `  Business Value: ${businessValueResult.score}`);
    ctx.log?.('info', `  Risk Level: ${riskAssessment.level}`);
    ctx.log?.('info', `  Complexity: ${complexityMetrics.complexityScore}`);
    ctx.log?.('info', `  Converged: ${converged}`);

    // ========================================================================
    // STEP 7: IMPROVEMENT PLANNING FOR NEXT ITERATION
    // ========================================================================
    if (!converged && overallQuality < targetQuality && iteration < maxIterations && shouldContinue) {
      ctx.log?.('info', `${phaseName} - Planning improvements for iteration ${iteration + 1}`);

      const improvementPlan = await ctx.task(enhancedImprovementPlanTask, {
        currentResult: result,
        qualityGaps: qualityAssessment.gaps,
        adversarialFindings: adversarialReview.issues,
        businessValueGaps: businessValueResult.gaps,
        riskFactors: riskAssessment.factors,
        complexityIssues: complexityMetrics.alerts,
        targetQuality,
        iteration,
        qualityImprovement
      });

      taskInputs.improvementPlan = improvementPlan;

      // Create detailed action plan for next iteration
      ctx.log?.('info', `${phaseName} - Improvement plan created with ${improvementPlan.priorities?.length || 0} priority actions`);
    }

    // ========================================================================
    // STEP 8: QUALITY GATE CHECKPOINT
    // ========================================================================
    if (iteration >= 2 && iteration % 2 === 0 && !converged) {
      const gateDecision = await ctx.breakpoint({
        question: `${phaseName} Quality Gate - Iteration ${iteration}:

Quality Score: ${overallQuality}/${targetQuality} (${converged ? 'CONVERGED' : 'NOT CONVERGED'})
Business Value: ${businessValueResult.score}/100
Risk Level: ${riskAssessment.level}
Issues Found: ${adversarialReview.issues?.length || 0}

Continue iterating to reach target quality, or accept current state and proceed?`,
        title: `${phaseName} Convergence Quality Gate`,
        context: {
          runId: ctx.runId,
          data: {
            phaseName,
            iteration,
            converged,
            qualityScore: overallQuality,
            targetQuality,
            businessValue: businessValueResult.score,
            riskLevel: riskAssessment.level,
            issuesFound: adversarialReview.issues?.length || 0,
            qualityTrend: qualityImprovement > 0 ? 'improving' : 'stagnant',
            remainingIterations: maxIterations - iteration
          },
          files: [
            { path: `artifacts/odd/${phaseId}/quality-assessment-${iteration}.md`, format: 'markdown', label: 'Quality Assessment' },
            { path: `artifacts/odd/${phaseId}/adversarial-review-${iteration}.md`, format: 'markdown', label: 'Adversarial Review' },
            { path: `artifacts/odd/${phaseId}/improvement-plan-${iteration}.md`, format: 'markdown', label: 'Improvement Plan' }
          ]
        }
      });

      if (!gateDecision) {
        ctx.log?.('info', `${phaseName} - User chose to proceed without reaching target quality`);
        break;
      }
    }

    // ========================================================================
    // STEP 9: CONVERGENCE DECISION
    // ========================================================================
    if (converged) {
      ctx.log?.('info', `${phaseName} - CONVERGED after ${iteration} iterations with quality ${overallQuality}`);
      break;
    }

    if (!shouldContinue) {
      ctx.log?.('info', `${phaseName} - Stopping iterations due to convergence assessment recommendation`);
      break;
    }

    if (iteration >= maxIterations) {
      ctx.log?.('info', `${phaseName} - Reached maximum iterations (${maxIterations}) with quality ${overallQuality}`);
      break;
    }
  }

  // FINAL PHASE SUMMARY
  const finalConverged = overallQuality >= targetQuality;
  ctx.log?.('info', `${phaseName} Complete: ${iteration} iterations, Quality: ${overallQuality}/${targetQuality}, Converged: ${finalConverged}`);

  return {
    result,
    iterations: iteration,
    qualityMetrics,
    overallQuality: Math.round(overallQuality),
    artifacts,
    converged: finalConverged,
    improvementAchieved: overallQuality > 0,
    qualityGrowth: iteration > 1 ? overallQuality - (taskInputs.initialQuality || 0) : overallQuality
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMaxIterations(complexity) {
  const iterations = {
    'simple': 3,
    'moderate': 5,
    'complex': 7,
    'enterprise': 10
  };
  return iterations[complexity] || 5;
}

// ============================================================================
// ENHANCED TASK DEFINITIONS
// ============================================================================

/**
 * Task: Project Analysis & Planning
 */
/**
 * Task: World Ontology Research
 * Purpose: Deep research and modeling of the world/domain context
 */
const worldOntologyResearchTask = defineTask({
  name: 'world-ontology-research',
  description: 'Comprehensive research and ontology modeling of world/domain context',

  inputs: {
    projectName: { type: 'string', required: true },
    domainDescription: { type: 'string', default: '' },
    ontologyScope: { type: 'string', default: 'comprehensive' },
    domainType: { type: 'string', default: 'general' },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    researchDepth: { type: 'string', default: 'comprehensive' },
    evidenceFramework: { type: 'object', default: {} },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    worldModel: { type: 'object' },
    domainCoverage: { type: 'object' },
    keyEntities: { type: 'array' },
    externalSystems: { type: 'array' },
    stakeholderTypes: { type: 'array' },
    industryContext: { type: 'object' },
    regulatoryLandscape: { type: 'object' },
    technologyEcosystem: { type: 'object' },
    researchSources: { type: 'array' },
    knowledgeGaps: { type: 'array' },
    // Evidence-based modeling outputs
    evidenceDatabase: { type: 'object' }, // Complete evidence collection with sources and quality scores
    claimEvidenceMapping: { type: 'object' }, // Map every claim to supporting evidence
    sourceCredibilityAnalysis: { type: 'object' }, // Credibility assessment for all sources
    evidenceQualityMetrics: { type: 'object' }, // Overall evidence quality scores and statistics
    evidenceGaps: { type: 'array' }, // Identified gaps in evidence coverage
    conflictingEvidence: { type: 'array' }, // Areas where sources conflict and resolution approaches
    evidenceValidationResults: { type: 'object' }, // Results of evidence triangulation and validation
    biasAssessment: { type: 'object' }, // Identified biases and mitigation strategies
    evidenceUpdateRequirements: { type: 'array' }, // Evidence that needs regular updating
    stakeholderEvidenceAccess: { type: 'object' }, // How stakeholders can verify evidence
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `World Ontology Research: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'world-ontology-researcher',
        goal: `Build comprehensive world model and domain ontology for ${inputs.projectName}`,
        instructions: [
          '=== EVIDENCE-BASED WORLD MODELING FRAMEWORK ===',
          'CRITICAL REQUIREMENT: Every external fact, claim, or assertion MUST include specific, traceable evidence with quality assessment.',

          '=== COMPREHENSIVE EVIDENCE COLLECTION PROTOCOL ===',
          '**MANDATORY: For EVERY external fact in the ontology, provide:**',
          '1. PRIMARY SOURCE CITATION with specific page/section references',
          '2. EVIDENCE QUALITY SCORE (1-10) with justification',
          '3. SOURCE CREDIBILITY ASSESSMENT (authority, independence, methodology)',
          '4. ALTERNATIVE SOURCE CONFIRMATION (minimum 2 independent sources for critical claims)',
          '5. UNCERTAINTY QUANTIFICATION (confidence intervals, limitations)',
          '6. BIAS ASSESSMENT (potential conflicts of interest, methodological biases)',
          '7. CURRENCY CHECK (how recent is the evidence, update frequency)',
          '8. ACCESSIBILITY VERIFICATION (can stakeholders verify these sources)',

          '=== EVIDENCE SOURCE CATEGORIES ===',
          '**PRIMARY SOURCES** (Highest Credibility):',
          '- Peer-reviewed academic research with methodology transparency',
          '- Official industry standards and specifications (ISO, IEEE, etc.)',
          '- Government regulatory documents and official statistics',
          '- Direct stakeholder interviews and surveys',
          '- Original research data and experimental results',
          '- Technical documentation from authoritative implementers',
          '',
          '**EMPIRICAL EXPERIMENTS** (Online and Reproducible - High Credibility):',
          '- Reproducible experiments with open methodology and publicly available data',
          '- Open science experiments with complete replication instructions',
          '- Community-validated experimental results with independent confirmations',
          '- Crowd-sourced empirical validation with aggregated statistical results',
          '- Online lab notebooks and experimental documentation with version control',
          '- Replication studies and validation attempts with documented outcomes',
          '- Public datasets with documented collection and validation methodologies',
          '- Collaborative research platforms (e.g., OSF, GitHub, Zenodo) with peer validation',
          '- Citizen science projects with rigorous data collection protocols',
          '- Collaborative validation networks with distributed peer review',
          '- Multi-institutional replication consortiums with standardized protocols',

          '**SECONDARY SOURCES** (Moderate Credibility, Require Validation):',
          '- Industry analyst reports (Gartner, Forrester, etc.) with methodology',
          '- Professional association white papers and position statements',
          '- Vendor-neutral technical conference presentations',
          '- Established industry media with editorial standards',
          '- Case studies from reputable organizations',
          '- Synthesis documents that cite primary sources',

          '**CODE AND IMPLEMENTATION EVIDENCE**:',
          '- Open source repositories with active maintenance and good documentation',
          '- Technical specifications implemented in production systems',
          '- API documentation with version history and change logs',
          '- Configuration examples from validated implementations',
          '- Performance benchmarks with methodology transparency',
          '- Security analysis and audit reports',

          '=== EVIDENCE VALIDATION METHODOLOGY ===',
          '**SOURCE TRIANGULATION**:',
          '- For critical claims: Minimum 3 independent, high-quality sources',
          '- For important claims: Minimum 2 independent sources',
          '- For supporting details: 1 high-quality source or 2 moderate sources',
          '- For controversial claims: Additional expert validation required',

          '**QUALITY ASSESSMENT CRITERIA**:',
          '- AUTHORITY: Author/organization expertise and recognition in domain',
          '- METHODOLOGY: Research/analysis methodology transparency and rigor',
          '- INDEPENDENCE: Freedom from conflicts of interest',
          '- CURRENCY: Recency and ongoing relevance of information',
          '- CONSISTENCY: Alignment with other credible sources',
          '- VERIFIABILITY: Ability for others to access and verify sources',
          '- REPRODUCIBILITY: Complete methodology documentation enabling replication',
          '- REPLICATION: Evidence of successful independent reproductions',

          '**BIAS IDENTIFICATION AND MITIGATION**:',
          '- COMMERCIAL BIAS: Identify vendor/commercial interests affecting claims',
          '- CONFIRMATION BIAS: Actively seek disconfirming evidence',
          '- RECENCY BIAS: Balance recent trends with historical perspective',
          '- AVAILABILITY BIAS: Don\'t overweight easily accessible information',
          '- AUTHORITY BIAS: Validate claims even from respected sources',

          '=== EMPIRICAL EXPERIMENT VALIDATION PROTOCOL ===',
          '**REPRODUCIBILITY VALIDATION**:',
          '- Verify complete methodology documentation is publicly available',
          '- Check availability of raw data, analysis code, and environment specifications',
          '- Validate replication instructions are clear and complete',
          '- Assess feasibility of reproduction with available resources',
          '- Document any barriers to reproduction and workarounds',
          '',
          '**REPLICATION ASSESSMENT**:',
          '- Identify independent replication attempts and their outcomes',
          '- Assess statistical significance across multiple replications',
          '- Document variations in results and potential explanations',
          '- Evaluate community consensus on experimental validity',
          '- Track updates and corrections to original experiments',
          '',
          '**ONLINE EVIDENCE VALIDATION**:',
          '- Verify persistent URLs and archive availability (Wayback Machine, etc.)',
          '- Check version control history and change documentation',
          '- Validate community peer review and feedback incorporation',
          '- Assess collaborative validation and crowd-sourced verification',
          '- Document evidence update frequency and maintenance status',
          '',
          '=== EVIDENCE DOCUMENTATION STANDARDS ===',
          '**CITATION FORMAT**: Author/Organization. "Title". Source, Date. [Evidence Quality: X/10] [Confidence: High/Medium/Low] [Reproducible: Yes/No]',
          '**EVIDENCE CHAIN**: For complex claims, document logical evidence chains from sources to conclusions',
          '**CONFLICT RESOLUTION**: When sources conflict, document why certain sources were prioritized',
          '**VERIFICATION PATH**: Provide clear instructions for stakeholders to verify critical evidence',
          '**REPLICATION GUIDE**: For empirical claims, provide step-by-step replication instructions',

          '=== SYSTEMATIC CRITICAL THINKING FRAMEWORK ===',
          'Apply rigorous agent-based analysis using the DEEP-CARE framework:',
          'D - DEPTH ANALYSIS: What fundamental concepts need deeper investigation?',
          'E - EVIDENCE QUALITY: How strong is our evidence base? What sources need validation?',
          'E - EXPANSION NEEDS: What domains/perspectives are underrepresented?',
          'P - PRECISION GAPS: Where are our models imprecise or ambiguous?',
          'C - CONSISTENCY CHECK: What internal contradictions exist?',
          'A - ACCURACY VALIDATION: What claims need empirical verification?',
          'R - RELEVANCE ASSESSMENT: What research is peripheral vs. critical?',
          'E - EVOLUTION PLANNING: How should this iteration advance our understanding?',

          '=== COMPREHENSIVE MULTI-METHOD RESEARCH FRAMEWORK ===',
          'Use systematic triangulation across research methods:',
          '1. SYSTEMATIC LITERATURE REVIEW',
          '   - Define comprehensive search strategy with keywords, databases, inclusion criteria',
          '   - Apply rigorous quality assessment framework for source credibility',
          '   - Extract data systematically using standardized forms and protocols',
          '   - Synthesize findings using thematic analysis, meta-analysis, or systematic mapping',
          '   - Document evidence quality levels, confidence intervals, and bias assessment',

          '2. EXPERT CONSULTATION & VALIDATION',
          '   - Identify and recruit domain experts using snowball sampling and expertise mapping',
          '   - Design structured interview protocols with validation questions and scenarios',
          '   - Use Delphi method for consensus building on contested or ambiguous topics',
          '   - Apply inter-rater reliability measures and expert agreement analysis',
          '   - Weight expert opinions by demonstrated expertise, track record, and domain relevance',

          '3. EMPIRICAL DATA ANALYSIS',
          '   - Collect quantitative and qualitative data from industry reports, surveys, metrics',
          '   - Apply statistical analysis to identify patterns, trends, and correlations',
          '   - Use observational studies of existing systems, processes, and implementations',
          '   - Conduct comparative analysis across similar domains, organizations, and contexts',
          '   - Validate findings through replication studies and sensitivity analysis',

          '4. CASE STUDY METHODOLOGY',
          '   - Design multiple case studies across different contexts and domains',
          '   - Use cross-case analysis for pattern identification and theory building',
          '   - Apply within-case analysis for deep contextual understanding',
          '   - Implement theoretical sampling for maximum learning and validation',
          '   - Use case study databases for systematic evidence collection',

          '5. ETHNOGRAPHIC OBSERVATION',
          '   - Conduct participant observation in real-world domain contexts',
          '   - Use structured observation protocols with systematic data collection',
          '   - Apply contextual inquiry methods for deep understanding',
          '   - Document tacit knowledge and implicit domain practices',
          '   - Use video analysis and interaction analysis for detailed examination',

          '6. EXPERIMENTAL VALIDATION',
          '   - Design controlled experiments to test specific hypotheses',
          '   - Use quasi-experimental designs for real-world validation',
          '   - Apply randomized controlled trials where feasible and ethical',
          '   - Implement natural experiments using existing variations',
          '   - Use experimental protocols with rigorous controls and measurement',

          '=== COMPREHENSIVE WORLD RESEARCH ===',
          '1. DOMAIN LANDSCAPE ANALYSIS',
          '   - Research industry structure, key players, competitive dynamics',
          '   - Identify domain-specific concepts, terminology, and standards',
          '   - Map value chains, business models, and economic factors',
          '   - Analyze historical evolution and future trends',
          '   - Document domain-specific best practices and methodologies',

          '2. STAKEHOLDER ECOSYSTEM MAPPING',
          '   - Identify ALL stakeholder types: direct, indirect, influencers',
          '   - Map stakeholder relationships, dependencies, conflicts',
          '   - Analyze stakeholder motivations, goals, and pain points',
          '   - Document decision-making processes and authority structures',
          '   - Understand cultural, geographic, and organizational contexts',

          '3. EXTERNAL SYSTEMS & INTEGRATIONS',
          '   - Map existing technology landscape and systems',
          '   - Identify data sources, APIs, and integration points',
          '   - Analyze system architectures, protocols, and standards',
          '   - Document security, compliance, and governance requirements',
          '   - Understand system lifecycles and migration patterns',

          '4. REGULATORY & COMPLIANCE LANDSCAPE',
          '   - Research applicable regulations across jurisdictions',
          '   - Analyze compliance requirements and audit processes',
          '   - Identify regulatory bodies and approval processes',
          '   - Map legal constraints and liability considerations',
          '   - Understand industry-specific governance frameworks',

          '5. TECHNOLOGY ECOSYSTEM ANALYSIS',
          '   - Map current and emerging technologies relevant to domain',
          '   - Analyze technology adoption patterns and maturity levels',
          '   - Identify standard platforms, frameworks, and tools',
          '   - Understand vendor landscape and technology dependencies',
          '   - Assess technology risks and obsolescence factors',

          '=== ADVANCED ONTOLOGY CONSTRUCTION ===',
          '1. FORMAL ONTOLOGY ENGINEERING',
          '   - Apply ontology design patterns from established libraries',
          '   - Use formal logic for concept definitions and relationships',
          '   - Implement automated consistency checking with reasoners',
          '   - Apply competency questions to validate ontology adequacy',
          '   - Use modular design with clear interface specifications',

          '2. EVIDENCE-BASED VALIDATION FRAMEWORK',
          '   - Implement multi-source triangulation for each major claim',
          '   - Apply Bradford Hill criteria for causal relationships',
          '   - Use confidence intervals and uncertainty quantification',
          '   - Document evidence quality using GRADE framework',
          '   - Implement bias detection and mitigation protocols',

          '3. STAKEHOLDER VALIDATION LOOPS',
          '   - Design structured validation sessions with stakeholder groups',
          '   - Use cognitive walkthroughs to test ontology usability',
          '   - Apply card sorting and concept mapping for validation',
          '   - Implement iterative feedback collection with version tracking',
          '   - Use quantitative metrics for stakeholder agreement levels',

          '=== ADVANCED QUALITY METRICS ===',
          'Apply comprehensive quality assessment framework:',
          '- COMPLETENESS: Domain coverage analysis using systematic checklists',
          '- CORRECTNESS: Fact-checking against authoritative sources with confidence scores',
          '- CONSISTENCY: Automated logic checking and conflict detection',
          '- CONCISENESS: Information density analysis and redundancy elimination',
          '- CLARITY: Readability metrics and expert comprehension testing',
          '- CURRENCY: Temporal validity assessment and update requirements',
          '- CREDIBILITY: Source quality analysis and expert endorsement tracking',

          '=== SYSTEMATIC GAP DETECTION ===',
          'Use structured gap identification methods:',
          '1. COVERAGE MATRIX ANALYSIS: Map ontology against domain taxonomy',
          '2. COMPETENCY QUESTION TESTING: Validate against use case scenarios',
          '3. EXPERT REVIEW PROTOCOLS: Structured expert evaluation with scoring',
          '4. COMPARATIVE ANALYSIS: Benchmark against existing domain models',
          '5. STAKEHOLDER NEEDS MAPPING: Trace stakeholder requirements to ontology',
          '6. TEMPORAL EVOLUTION ANALYSIS: Assess ontology stability and change needs',

          '=== PREDICTIVE ITERATION PLANNING ===',
          'Use data-driven iteration planning:',
          '- QUALITY TRAJECTORY ANALYSIS: Model quality improvement rates',
          '- GAP PRIORITIZATION MATRIX: Weight gaps by impact and effort',
          '- RESEARCH EFFORT ESTIMATION: Predict time/resources for gap resolution',
          '- CONVERGENCE PREDICTION: Estimate iterations needed for target quality',
          '- RISK-BENEFIT ANALYSIS: Optimize iteration focus for maximum impact',

          '=== COMPREHENSIVE UNCERTAINTY MANAGEMENT ===',
          'Systematic uncertainty handling through agent-based analysis:',
          '- UNCERTAINTY QUANTIFICATION: Assign confidence levels to all claims with evidence',
          '- SENSITIVITY ANALYSIS: Test model robustness to assumption changes',
          '- SCENARIO PLANNING: Model ontology behavior under different future conditions',
          '- ASSUMPTION TRACKING: Document and systematically validate underlying assumptions',
          '- CONTINGENCY PLANNING: Prepare alternative models for uncertain or contested areas',
          '- CONFIDENCE INTERVAL ESTIMATION: Statistical bounds on all quantitative claims',
          '- BIAS DETECTION: Systematic identification of cognitive and methodological biases',
          '- ERROR PROPAGATION ANALYSIS: Track how uncertainties compound through the process',

          '=== VALIDATION INTEGRITY & TRACEABILITY ===',
          'Comprehensive validation audit trail:',
          '- VALIDATION DOCUMENTATION: Complete audit trail of all validation steps and decisions',
          '- SOURCE TRACKING: Full provenance of all evidence and validation inputs',
          '- REVIEWER CREDENTIALS: Documented expertise and potential conflicts of interest',
          '- VALIDATION METHODOLOGY: Explicit documentation of validation criteria and processes',
          '- INTER-VALIDATOR AGREEMENT: Measurement of consensus among independent validators',
          '- VALIDATION VERSIONING: Track changes in validation status over time',
          '- EVIDENCE QUALITY SCORING: Systematic rating of evidence strength and reliability',
          '- VALIDATION CHAIN INTEGRITY: Ensure no broken links in validation reasoning'
        ],
        context: {
          projectName: inputs.projectName,
          domainDescription: inputs.domainDescription,
          domainType: inputs.domainType,
          stakeholderContext: inputs.stakeholderContext,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps,
          evidenceFramework: inputs.evidenceFramework
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['world-ontology', 'domain-research', 'comprehensive-analysis', 'stakeholder-mapping']
    };
  }
});

/**
 * Task: Problem Space Ontology
 * Purpose: Deep analysis and modeling of the problem space
 */
const problemSpaceOntologyTask = defineTask({
  name: 'problem-space-ontology',
  description: 'Comprehensive analysis and ontology modeling of the problem space',

  inputs: {
    projectName: { type: 'string', required: true },
    domainDescription: { type: 'string', default: '' },
    worldOntology: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    projectComplexity: { type: 'string', default: 'moderate' },
    analysisDepth: { type: 'string', default: 'exhaustive' },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    problemModel: { type: 'object' },
    painPoints: { type: 'array' },
    rootCauses: { type: 'array' },
    constraints: { type: 'array' },
    requirements: { type: 'object' },
    userNeeds: { type: 'object' },
    businessGoals: { type: 'object' },
    problemComplexity: { type: 'object' },
    impactAnalysis: { type: 'object' },
    successCriteria: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Problem Space Ontology: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'problem-space-analyst',
        goal: `Build comprehensive problem space model and ontology for ${inputs.projectName}`,
        instructions: [
          '=== SYSTEMATIC PROBLEM ANALYSIS FRAMEWORK ===',
          'Apply the PROBLEM-SOLVE methodology:',
          'P - PATTERN RECOGNITION: What recurring patterns exist in problem manifestations?',
          'R - ROOT CAUSE VALIDATION: Are our causal models empirically supported?',
          'O - OBJECTIVE MEASUREMENT: How can we quantify problem severity and impact?',
          'B - BIAS IDENTIFICATION: What cognitive biases might distort our problem view?',
          'L - LOGICAL CONSISTENCY: Do our problem models have internal contradictions?',
          'E - EVIDENCE STRENGTH: What level of evidence supports each problem claim?',
          'M - MULTI-PERSPECTIVE: Have we considered all stakeholder viewpoints?',
          'S - SYSTEMS THINKING: How do problem elements interact dynamically?',
          'O - OUTCOME PREDICTION: What are the consequences of not solving these problems?',
          'L - LEARNING INTEGRATION: How does this iteration improve our understanding?',
          'V - VALIDATION PLANNING: How will we test our problem hypotheses?',
          'E - EVOLUTION STRATEGY: How should our problem model evolve next?',

          '=== MULTI-DIMENSIONAL PROBLEM RESEARCH ===',
          'Use systematic research methodology:',
          '1. ETHNOGRAPHIC OBSERVATION',
          '   - Conduct structured observation of problem contexts',
          '   - Use participant observation to understand lived experiences',
          '   - Apply time-sampling and event-sampling for systematic data collection',
          '   - Document behavioral patterns and environmental factors',
          '   - Use video analysis and coded observation protocols',

          '2. QUANTITATIVE PROBLEM MEASUREMENT',
          '   - Design metrics for problem frequency, severity, and impact',
          '   - Collect baseline measurements and trend data',
          '   - Use statistical analysis to identify problem correlations',
          '   - Apply cost-benefit analysis to quantify problem economics',
          '   - Implement control group analysis where possible',

          '3. STAKEHOLDER JOURNEY MAPPING',
          '   - Map detailed user journeys with pain point identification',
          '   - Use service design methods for touchpoint analysis',
          '   - Apply emotion mapping to understand psychological impacts',
          '   - Conduct journey validation with representative users',
          '   - Use journey analytics to prioritize improvement opportunities',

          '=== COMPREHENSIVE PROBLEM ANALYSIS ===',
          '1. PAIN POINT IDENTIFICATION & ANALYSIS',
          '   - Systematically identify all stakeholder pain points',
          '   - Categorize by severity, frequency, and impact',
          '   - Analyze pain point relationships and cascading effects',
          '   - Document current workarounds and coping mechanisms',
          '   - Quantify business and operational costs of problems',

          '2. ADVANCED ROOT CAUSE ANALYSIS',
          '   - Apply multiple methodologies: 5 Whys, Fishbone, Fault Tree Analysis, FMEA',
          '   - Use systems dynamics modeling for complex causal relationships',
          '   - Apply Cynefin framework to categorize problem complexity',
          '   - Use statistical correlation analysis to validate causal hypotheses',
          '   - Implement causal loop diagrams for feedback system analysis',
          '   - Apply Apollo RCA methodology for systematic investigation',
          '   - Use barrier analysis to identify prevention failures',

          '3. CONSTRAINT MAPPING & ANALYSIS',
          '   - Identify ALL constraint types: technical, business, regulatory, cultural',
          '   - Analyze constraint sources, flexibility, and change potential',
          '   - Map constraint interactions and dependencies',
          '   - Assess constraint impact on problem-solving approaches',
          '   - Document constraint priorities and negotiability',

          '4. REQUIREMENTS ELICITATION & MODELING',
          '   - Capture functional, non-functional, and quality requirements',
          '   - Model user needs across different personas and contexts',
          '   - Document business goals with clear success metrics',
          '   - Analyze requirement conflicts and trade-offs',
          '   - Establish requirement priorities and dependencies',

          '5. PROBLEM COMPLEXITY ASSESSMENT',
          '   - Analyze problem complexity across multiple dimensions',
          '   - Identify interconnections and system dynamics',
          '   - Assess uncertainty and ambiguity levels',
          '   - Map problem boundaries and scope',
          '   - Evaluate problem stability and change dynamics',

          '=== ADVANCED PROBLEM VALIDATION ===',
          '1. EMPIRICAL PROBLEM TESTING',
          '   - Design controlled experiments to test problem hypotheses',
          '   - Use A/B testing to validate problem impact measurements',
          '   - Apply longitudinal studies to understand problem evolution',
          '   - Implement natural experiments using existing variations',
          '   - Use predictive modeling to test problem causation theories',

          '2. CROSS-VALIDATION METHODOLOGY',
          '   - Implement multi-stakeholder validation sessions',
          '   - Use independent research teams for parallel analysis',
          '   - Apply expert panel reviews with structured protocols',
          '   - Use crowdsourcing for large-scale validation',
          '   - Implement automated validation using machine learning',

          '3. PROBLEM MODEL STRESS TESTING',
          '   - Test problem models under extreme scenarios',
          '   - Use adversarial testing to identify model weaknesses',
          '   - Apply Monte Carlo simulation for uncertainty analysis',
          '   - Test model robustness across different contexts',
          '   - Use counterfactual reasoning to validate problem logic',

          '=== COMPREHENSIVE COVERAGE FRAMEWORK ===',
          'Systematic coverage validation:',
          '- STAKEHOLDER COVERAGE MATRIX: Ensure all affected parties represented',
          '- TEMPORAL COVERAGE ANALYSIS: Past, present, and future problem states',
          '- CONTEXTUAL COVERAGE: All environments where problems manifest',
          '- SEVERITY COVERAGE: Problems across all impact levels',
          '- FREQUENCY COVERAGE: Rare and common problem occurrences',
          '- INTERDEPENDENCY MAPPING: Problems that interact or cascade',

          '=== PREDICTIVE PROBLEM MODELING ===',
          'Advanced problem evolution analysis:',
          '- TREND ANALYSIS: Statistical modeling of problem evolution patterns',
          '- SCENARIO MODELING: Future problem states under different conditions',
          '- EARLY WARNING SYSTEMS: Indicators for emerging problems',
          '- IMPACT FORECASTING: Predicting consequences of unresolved problems',
          '- SOLUTION DEPENDENCY ANALYSIS: How solutions affect problem landscape',

          '=== QUALITY-DRIVEN ITERATION STRATEGY ===',
          'Data-driven iteration planning:',
          '- PROBLEM UNDERSTANDING METRICS: Quantify depth and accuracy of knowledge',
          '- GAP IMPACT ANALYSIS: Prioritize research based on potential impact',
          '- VALIDATION CONFIDENCE TRACKING: Monitor certainty levels over iterations',
          '- RESEARCH EFFICIENCY OPTIMIZATION: Focus effort on highest-value questions',
          '- CONVERGENCE INDICATORS: Predict when sufficient understanding is achieved'
        ],
        context: {
          projectName: inputs.projectName,
          domainDescription: inputs.domainDescription,
          worldOntology: inputs.worldOntology,
          stakeholderContext: inputs.stakeholderContext,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['problem-ontology', 'root-cause-analysis', 'requirements-modeling', 'constraint-analysis']
    };
  }
});

/**
 * Task: Solution Space Exploration
 * Purpose: Comprehensive exploration and modeling of solution possibilities
 */
const solutionSpaceExplorationTask = defineTask({
  name: 'solution-space-exploration',
  description: 'Comprehensive exploration and ontology modeling of solution space',

  inputs: {
    projectName: { type: 'string', required: true },
    worldOntology: { type: 'object', required: true },
    problemOntology: { type: 'object', required: true },
    domainType: { type: 'string', default: 'general' },
    projectComplexity: { type: 'string', default: 'moderate' },
    explorationScope: { type: 'string', default: 'comprehensive' },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    solutionModel: { type: 'object' },
    solutionApproaches: { type: 'array' },
    architecturePatterns: { type: 'array' },
    technologyOptions: { type: 'array' },
    implementationStrategies: { type: 'array' },
    feasibilityAssessment: { type: 'object' },
    riskAssessment: { type: 'object' },
    tradeoffAnalysis: { type: 'object' },
    innovationOpportunities: { type: 'array' },
    solutionConstraints: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Solution Space Exploration: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'solution-space-explorer',
        goal: `Explore comprehensive solution space and build solution ontology for ${inputs.projectName}`,
        instructions: [
          '=== SYSTEMATIC SOLUTION INNOVATION FRAMEWORK ===',
          'Apply the INNOVATE-SOLVE methodology:',
          'I - IDEATION BREADTH: Have we explored sufficient solution diversity?',
          'N - NOVELTY ASSESSMENT: What innovative approaches are we missing?',
          'N - NEED ALIGNMENT: Do solutions directly address validated problem needs?',
          'O - OPPORTUNITY IDENTIFICATION: What untapped solution opportunities exist?',
          'V - VIABILITY ANALYSIS: Are our feasibility assessments rigorous?',
          'A - ALTERNATIVE GENERATION: What alternative approaches haven\'t been considered?',
          'T - TECHNOLOGY ASSESSMENT: Are we current on relevant technology capabilities?',
          'E - EVALUATION RIGOR: How robust are our solution evaluation methods?',
          'S - SYNTHESIS POTENTIAL: Can we combine approaches for better solutions?',
          'O - OPTIMIZATION OPPORTUNITIES: Where can solutions be enhanced?',
          'L - LEARNING INTEGRATION: How do insights from this iteration inform next?',
          'V - VALIDATION STRATEGY: How will we test solution effectiveness?',
          'E - EVOLUTION PLANNING: How should solution models develop further?',

          '=== SYSTEMATIC SOLUTION DISCOVERY ===',
          'Use structured innovation methodologies:',
          '1. DESIGN THINKING PROTOCOLS',
          '   - Apply double diamond process for divergent-convergent thinking',
          '   - Use structured brainstorming with SCAMPER and TRIZ methods',
          '   - Implement biomimicry and analogical reasoning for innovation',
          '   - Apply jobs-to-be-done framework for solution-need alignment',
          '   - Use design sprints for rapid solution prototyping and testing',

          '2. TECHNOLOGY INTELLIGENCE GATHERING',
          '   - Conduct systematic patent landscape analysis',
          '   - Monitor emerging technology research and development trends',
          '   - Apply technology forecasting methods (Delphi, scenario planning)',
          '   - Use competitive intelligence for solution benchmarking',
          '   - Implement technology readiness level assessment protocols',

          '3. SOLUTION SPACE MAPPING',
          '   - Create comprehensive solution morphology matrices',
          '   - Use function-behavior-structure modeling for systematic exploration',
          '   - Apply solution pattern libraries and architectural catalogs',
          '   - Use constraint satisfaction programming for solution optimization',
          '   - Implement multi-objective optimization for trade-off analysis',

          '=== COMPREHENSIVE SOLUTION EXPLORATION ===',
          '1. SOLUTION APPROACH GENERATION',
          '   - Generate diverse solution approaches using multiple methodologies',
          '   - Consider conventional, innovative, and disruptive approaches',
          '   - Explore solutions at different levels: tactical, strategic, transformational',
          '   - Analyze existing solutions in similar domains for patterns',
          '   - Generate hybrid approaches combining multiple strategies',

          '2. ARCHITECTURE PATTERN ANALYSIS',
          '   - Explore architectural patterns relevant to problem space',
          '   - Analyze pattern trade-offs: monolithic, microservices, event-driven, etc.',
          '   - Consider domain-specific architectural approaches',
          '   - Map patterns to quality attributes and constraints',
          '   - Evaluate pattern evolution and future-proofing',

          '3. TECHNOLOGY LANDSCAPE MAPPING',
          '   - Survey technology options across the solution stack',
          '   - Analyze technology maturity, adoption, and ecosystem health',
          '   - Consider emerging technologies and their potential impact',
          '   - Evaluate technology compatibility and integration complexity',
          '   - Assess vendor relationships and technology dependencies',

          '4. IMPLEMENTATION STRATEGY ANALYSIS',
          '   - Explore different implementation approaches: phased, big-bang, parallel',
          '   - Analyze build vs. buy vs. partner strategies',
          '   - Consider pilot, proof-of-concept, and MVP approaches',
          '   - Evaluate implementation risks and mitigation strategies',
          '   - Map implementation strategies to organizational capabilities',

          '5. FEASIBILITY & RISK ASSESSMENT',
          '   - Assess technical feasibility across all solution dimensions',
          '   - Evaluate business feasibility: ROI, resource requirements, timeline',
          '   - Analyze organizational feasibility: skills, culture, change capacity',
          '   - Identify solution risks and failure modes',
          '   - Assess regulatory and compliance feasibility',

          '=== ADVANCED INNOVATION METHODOLOGIES ===',
          '1. SYSTEMATIC INVENTIVE THINKING',
          '   - Apply TRIZ methodology for systematic problem-solution matching',
          '   - Use contradiction analysis to identify breakthrough opportunities',
          '   - Apply algorithm of inventive problem solving (ARIZ)',
          '   - Use function analysis and trimming for elegant solutions',
          '   - Implement innovation patterns and evolutionary trends analysis',

          '2. CROSS-DOMAIN SOLUTION MINING',
          '   - Apply analogical reasoning from biology, physics, other industries',
          '   - Use systematic literature mining across disciplines',
          '   - Implement solution pattern matching algorithms',
          '   - Apply biomimicry databases and natural solution principles',
          '   - Use artificial intelligence for solution discovery assistance',

          '3. FUTURE-ORIENTED SOLUTION DEVELOPMENT',
          '   - Apply technology roadmapping for solution evolution planning',
          '   - Use scenario-based solution design for future robustness',
          '   - Implement anticipatory design for emerging requirements',
          '   - Apply weak signal detection for emerging solution opportunities',
          '   - Use backcasting from desired future states',

          '=== RIGOROUS SOLUTION VALIDATION ===',
          '1. MULTI-CRITERIA DECISION ANALYSIS',
          '   - Apply AHP/ANP for systematic solution evaluation',
          '   - Use PROMETHEE/ELECTRE methods for complex trade-offs',
          '   - Implement fuzzy logic for uncertain solution attributes',
          '   - Apply portfolio optimization for solution combination',
          '   - Use sensitivity analysis for robust decision making',

          '2. EXPERIMENTAL SOLUTION TESTING',
          '   - Design controlled experiments for solution validation',
          '   - Use rapid prototyping and MVP testing methodologies',
          '   - Apply statistical design of experiments (DoE)',
          '   - Implement A/B testing for solution performance comparison',
          '   - Use simulation modeling for complex solution behavior',

          '3. STAKEHOLDER VALIDATION PROTOCOLS',
          '   - Design structured stakeholder evaluation sessions',
          '   - Use conjoint analysis for stakeholder preference modeling',
          '   - Apply user testing protocols with quantitative metrics',
          '   - Implement expert panel evaluation with Delphi method',
          '   - Use market research for solution acceptance testing',

          '=== COMPREHENSIVE FEASIBILITY FRAMEWORK ===',
          'Multi-dimensional feasibility assessment:',
          '- TECHNICAL FEASIBILITY: Rigorous technical risk and capability analysis',
          '- ECONOMIC FEASIBILITY: Detailed ROI, NPV, and cost-benefit modeling',
          '- ORGANIZATIONAL FEASIBILITY: Change management and capability assessment',
          '- MARKET FEASIBILITY: Market analysis and competitive positioning',
          '- REGULATORY FEASIBILITY: Compliance analysis and approval timelines',
          '- ENVIRONMENTAL FEASIBILITY: Sustainability and environmental impact',
          '- SOCIAL FEASIBILITY: Social acceptance and ethical considerations',

          '=== SOLUTION OPTIMIZATION STRATEGIES ===',
          'Advanced optimization approaches:',
          '- PARETO OPTIMIZATION: Multi-objective optimization for trade-off analysis',
          '- ROBUST DESIGN: Solutions that perform well under uncertainty',
          '- ADAPTIVE SOLUTIONS: Self-modifying solutions for changing environments',
          '- MODULAR ARCHITECTURES: Flexible solutions with composable components',
          '- EVOLUTIONARY APPROACHES: Solutions that improve through use',
          '- ECOSYSTEM SOLUTIONS: Solutions that leverage network effects',

          '=== PREDICTIVE SOLUTION MODELING ===',
          'Forward-looking solution analysis:',
          '- SOLUTION LIFECYCLE MODELING: Long-term solution behavior prediction',
          '- ADOPTION CURVE ANALYSIS: Solution acceptance and scaling patterns',
          '- COMPETITIVE RESPONSE MODELING: How competitors might react',
          '- TECHNOLOGY EVOLUTION IMPACT: How advancing technology affects solutions',
          '- REGULATORY EVOLUTION: How changing regulations affect viability',
          '- SOCIAL TREND ALIGNMENT: How social changes affect solution relevance'
        ],
        context: {
          projectName: inputs.projectName,
          worldOntology: inputs.worldOntology,
          problemOntology: inputs.problemOntology,
          domainType: inputs.domainType,
          projectComplexity: inputs.projectComplexity,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['solution-exploration', 'architecture-analysis', 'technology-assessment', 'feasibility-study']
    };
  }
});

/**
 * Task: Integrated Ontology Synthesis
 * Purpose: Synthesize world, problem, and solution ontologies into integrated model
 */
const integratedOntologySynthesisTask = defineTask({
  name: 'integrated-ontology-synthesis',
  description: 'Synthesize world, problem, and solution ontologies into coherent integrated model',

  inputs: {
    projectName: { type: 'string', required: true },
    worldOntology: { type: 'object', required: true },
    problemOntology: { type: 'object', required: true },
    solutionOntology: { type: 'object', required: true },
    ontologyScope: { type: 'string', default: 'comprehensive' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    schema: { type: 'object' },
    integratedOntology: { type: 'object' },
    traceabilityMatrix: { type: 'object' },
    coverageMetrics: { type: 'object' },
    consistencyValidation: { type: 'object' },
    strategicAlignment: { type: 'object' },
    implementationReadiness: { type: 'object' },
    qualityAssessment: { type: 'object' },
    knowledgeGraph: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Integrated Ontology Synthesis: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'ontology-integration-architect',
        goal: `Synthesize world, problem, and solution ontologies into coherent integrated model for ${inputs.projectName}`,
        instructions: [
          '=== SYSTEMATIC INTEGRATION ANALYSIS FRAMEWORK ===',
          'Apply the INTEGRATE-VERIFY methodology:',
          'I - INTEGRATION COHERENCE: Are ontology modules logically consistent?',
          'N - NORMALIZATION ANALYSIS: Are there redundancies or conflicts to resolve?',
          'T - TRACEABILITY STRENGTH: Can we trace from world through problem to solution?',
          'E - EVIDENCE CONSOLIDATION: Are all claims supported across integrated model?',
          'G - GAP IDENTIFICATION: What integration gaps create logical inconsistencies?',
          'R - RELATIONSHIP VALIDATION: Are inter-ontology relationships correctly modeled?',
          'A - ALIGNMENT VERIFICATION: Do integrated models serve strategic objectives?',
          'T - TESTING COMPLETENESS: Can integrated model answer all competency questions?',
          'E - ERROR DETECTION: What logical errors exist in the integrated model?',
          'V - VALIDATION COVERAGE: Have we validated integration from all perspectives?',
          'E - EVOLUTION READINESS: Can integrated model adapt to changes?',
          'R - REFINEMENT STRATEGY: How should integration improve in next iteration?',
          'I - IMPLEMENTATION SUPPORT: Does integration enable effective downstream work?',
          'F - FORMAL VERIFICATION: Can we prove integration correctness?',
          'Y - YIELD OPTIMIZATION: Does integration maximize value delivery?',

          '=== FORMAL INTEGRATION METHODOLOGIES ===',
          'Use rigorous integration techniques:',
          '1. FORMAL ONTOLOGY ALIGNMENT',
          '   - Apply automated ontology matching algorithms',
          '   - Use semantic similarity measures for concept alignment',
          '   - Implement logic-based integration with formal semantics',
          '   - Apply ontology merging techniques with conflict resolution',
          '   - Use federated ontology architectures for loose coupling',

          '2. LOGICAL CONSISTENCY VERIFICATION',
          '   - Apply automated theorem proving for logical validation',
          '   - Use model checking for temporal and modal properties',
          '   - Implement constraint satisfaction for consistency checking',
          '   - Apply satisfiability (SAT) solving for logical conflicts',
          '   - Use description logic reasoning for subsumption checking',

          '3. SEMANTIC INTEGRATION VALIDATION',
          '   - Apply semantic web technologies (OWL, RDF, SPARQL)',
          '   - Use knowledge graph embeddings for similarity analysis',
          '   - Implement semantic annotation and linking protocols',
          '   - Apply natural language processing for semantic validation',
          '   - Use machine learning for pattern recognition in integration',

          '=== COMPREHENSIVE ONTOLOGY INTEGRATION ===',
          '1. ONTOLOGY COHERENCE ANALYSIS',
          '   - Analyze consistency between world, problem, and solution ontologies',
          '   - Identify conflicts, gaps, and misalignments between models',
          '   - Map relationships and dependencies across ontology boundaries',
          '   - Resolve semantic conflicts and terminology mismatches',
          '   - Ensure logical consistency across the integrated model',

          '2. SCHEMA ARCHITECTURE DESIGN',
          '   - Design modular schema architecture with clear boundaries',
          '   - Create core domain schema with specialized extensions',
          '   - Define interface specifications between schema modules',
          '   - Establish schema governance and evolution principles',
          '   - Implement schema versioning and compatibility management',

          '3. STRATEGIC ALIGNMENT VALIDATION',
          '   - Map business goals to ontology concepts and relationships',
          '   - Trace user needs through world-problem-solution chain',
          '   - Validate constraint satisfaction across all ontology levels',
          '   - Ensure solution concepts address identified pain points',
          '   - Verify strategic coherence from world context to implementation',

          '4. TRACEABILITY MATRIX CONSTRUCTION',
          '   - Build comprehensive traceability from world through solution',
          '   - Map stakeholder needs to solution features',
          '   - Trace requirements to architectural decisions',
          '   - Link constraints to design choices and trade-offs',
          '   - Create bidirectional traceability for impact analysis',

          '5. COVERAGE & COMPLETENESS ASSESSMENT',
          '   - Assess ontology coverage of world, problem, and solution spaces',
          '   - Identify gaps in domain knowledge or modeling',
          '   - Validate completeness against stakeholder requirements',
          '   - Check coverage of edge cases and exceptional scenarios',
          '   - Ensure balanced depth across all ontology dimensions',

          '=== COMPREHENSIVE QUALITY ASSURANCE ===',
          '1. MULTI-LEVEL VALIDATION FRAMEWORK',
          '   - SYNTACTIC VALIDATION: Schema compliance and format checking',
          '   - SEMANTIC VALIDATION: Meaning consistency and logical coherence',
          '   - PRAGMATIC VALIDATION: Usability and fitness for purpose',
          '   - EMPIRICAL VALIDATION: Evidence-based claim verification',
          '   - TEMPORAL VALIDATION: Consistency across time and evolution',

          '2. AUTOMATED QUALITY METRICS',
          '   - Apply ontology evaluation metrics (cohesion, coupling, complexity)',
          '   - Use graph analysis for structural quality assessment',
          '   - Implement coverage metrics for completeness analysis',
          '   - Apply information theory for ontology informativeness',
          '   - Use machine learning for quality pattern recognition',

          '3. STAKEHOLDER QUALITY VALIDATION',
          '   - Design competency question frameworks for validation',
          '   - Implement user acceptance testing protocols',
          '   - Apply cognitive walkthroughs for usability testing',
          '   - Use expert evaluation with structured assessment criteria',
          '   - Implement continuous feedback collection and analysis',

          '=== IMPLEMENTATION READINESS FRAMEWORK ===',
          '1. CODE GENERATION READINESS',
          '   - Validate schema supports all required code patterns',
          '   - Test automated code generation from ontology models',
          '   - Verify API generation and interface consistency',
          '   - Validate database schema generation capabilities',
          '   - Test documentation generation from ontology annotations',

          '2. TESTING AND VALIDATION SUPPORT',
          '   - Generate test cases from ontology specifications',
          '   - Create validation rules from constraint definitions',
          '   - Design acceptance criteria from requirement traceability',
          '   - Generate performance tests from quality attributes',
          '   - Create compliance tests from regulatory requirements',

          '3. GOVERNANCE AND MAINTENANCE READINESS',
          '   - Design versioning strategies for ontology evolution',
          '   - Create change impact analysis frameworks',
          '   - Establish quality gates for ontology updates',
          '   - Design stakeholder governance processes',
          '   - Create ontology lifecycle management protocols',

          '=== STRATEGIC VALIDATION FRAMEWORK ===',
          '1. BUSINESS VALUE VALIDATION',
          '   - Map ontology capabilities to business value drivers',
          '   - Validate ROI assumptions through ontology analysis',
          '   - Test business process support through ontology modeling',
          '   - Verify competitive advantage claims through differentiation analysis',
          '   - Validate scalability claims through growth scenario modeling',

          '2. STAKEHOLDER EXPERIENCE VALIDATION',
          '   - Design user journey validation using ontology models',
          '   - Test stakeholder interaction patterns against ontology',
          '   - Validate emotional needs satisfaction through experience modeling',
          '   - Test accessibility and inclusion through universal design validation',
          '   - Verify cultural adaptation through cross-cultural ontology testing',

          '3. COMPLIANCE AND CONSTRAINT VALIDATION',
          '   - Test regulatory compliance through formal constraint checking',
          '   - Validate ethical considerations through value-sensitive design analysis',
          '   - Test security requirements through threat modeling with ontology',
          '   - Verify privacy requirements through data flow ontology analysis',
          '   - Test environmental constraints through lifecycle ontology modeling',

          '=== PREDICTIVE INTEGRATION ANALYSIS ===',
          'Advanced integration forecasting:',
          '- EVOLUTION MODELING: How will integrated ontology evolve over time?',
          '- ADAPTATION CAPABILITY: Can ontology adapt to changing requirements?',
          '- SCALING CHARACTERISTICS: How does ontology perform under growth?',
          '- INTEGRATION RESILIENCE: How robust is ontology to external changes?',
          '- MAINTENANCE PREDICTION: What will be required to maintain ontology quality?',
          '- OBSOLESCENCE ANALYSIS: What parts of ontology might become outdated?',

          '=== CONTINUOUS IMPROVEMENT FRAMEWORK ===',
          'Systematic improvement methodology:',
          '- QUALITY TRAJECTORY MODELING: Predict quality improvement patterns',
          '- DIMINISHING RETURNS ANALYSIS: Optimize iteration effort allocation',
          '- CONVERGENCE PREDICTION: Estimate remaining iterations to target quality',
          '- RISK-BENEFIT OPTIMIZATION: Balance quality improvements with costs',
          '- LEARNING CURVE ANALYSIS: Understand team capability development',
          '- SUCCESS PROBABILITY MODELING: Predict likelihood of achieving targets'
        ],
        context: {
          projectName: inputs.projectName,
          worldOntology: inputs.worldOntology,
          problemOntology: inputs.problemOntology,
          solutionOntology: inputs.solutionOntology,
          ontologyScope: inputs.ontologyScope,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['ontology-integration', 'schema-design', 'traceability', 'strategic-alignment']
    };
  }
});

const projectAnalysisTask = defineTask({
  name: 'enhanced-project-analysis',
  description: 'Comprehensive project analysis with complexity assessment, stakeholder mapping, and risk evaluation',

  inputs: {
    projectName: { type: 'string', required: true },
    domainDescription: { type: 'string', default: '' },
    ontologyScope: { type: 'string', default: 'comprehensive' },
    projectComplexity: { type: 'string', default: 'moderate' },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' },
    riskProfile: { type: 'string', default: 'moderate' }
  },

  outputs: {
    complexityAssessment: { type: 'object' },
    stakeholderAnalysis: { type: 'object' },
    riskAssessment: { type: 'object' },
    resourcePlanning: { type: 'object' },
    recommendedApproach: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Enhanced Project Analysis: ${inputs.projectName}`,
      agent: {
        role: 'enterprise-ontology-strategist',
        goal: `Perform comprehensive project analysis for ${inputs.projectName} to inform strategic planning and risk mitigation`,
        instructions: [
          'Analyze project complexity across multiple dimensions: domain complexity, technical complexity, organizational complexity, regulatory complexity',
          'Map all stakeholders: domain experts, technical teams, business sponsors, end users, regulatory bodies, external partners',
          'Assess stakeholder influence, interest, and potential conflicts',
          'Identify all risk factors: technical risks, business risks, regulatory risks, organizational risks',
          'Evaluate resource requirements: team size, skills needed, timeline, budget implications',
          'Recommend ontology development approach based on complexity and stakeholder context',
          'Create domain-specific adaptation strategy based on domain type',
          'Establish success criteria and key performance indicators',
          'Design governance framework appropriate for stakeholder context',
          'Plan change management strategy for organizational adoption',
          'Create communication plan for multi-stakeholder alignment',
          'Establish quality gates and validation checkpoints'
        ],
        context: {
          projectName: inputs.projectName,
          domainDescription: inputs.domainDescription,
          ontologyScope: inputs.ontologyScope,
          projectComplexity: inputs.projectComplexity,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          riskProfile: inputs.riskProfile
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['project-analysis', 'stakeholder-mapping', 'risk-assessment', 'strategic-planning']
    };
  }
});

/**
 * Task: Define Modular Ontology Schema
 */
const defineModularOntologySchemaTask = defineTask({
  name: 'define-modular-ontology-schema',
  description: 'Define modular ontology schema with complexity management and domain-specific patterns',

  inputs: {
    projectName: { type: 'string', required: true },
    domainDescription: { type: 'string', default: '' },
    ontologyScope: { type: 'string', default: 'comprehensive' },
    projectComplexity: { type: 'string', default: 'moderate' },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' },
    projectAnalysis: { type: 'object', default: null },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    modularDesign: { type: 'object' },
    domainOntologies: { type: 'object' },
    goalsOntology: { type: 'object' },      // Business, user, technical goals
    needsOntology: { type: 'object' },      // Functional, non-functional, emotional needs
    constraintsOntology: { type: 'object' }, // Technical, business, regulatory constraints
    productOntology: { type: 'object' },    // Product specs, features, user flows
    designOntology: { type: 'object' },     // UI/UX elements, layouts, interactions
    interfaceDefinitions: { type: 'object' },
    dependencyGraph: { type: 'object' },
    complexityMetrics: { type: 'object' },
    governanceRules: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Define Modular Ontology Schema: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'modular-ontology-architect',
        goal: `Design modular ontology schema for ${inputs.projectName} with complexity management and domain-specific adaptations`,
        instructions: [
          'Apply modular design patterns to manage ontology complexity',
          'Create clear module boundaries based on domain analysis and stakeholder boundaries',
          'Define interfaces and dependencies between ontology modules',
          'Implement domain-specific patterns based on domain type (healthcare, finance, manufacturing, etc.)',
          'Design for scalability and maintainability across enterprise environments',
          'Include strategic ontologies: goals (business, user, technical), needs (functional, non-functional, emotional), constraints (technical, business, regulatory)',
          'Create product ontology: features, user flows, product specifications, page layouts',
          'Design UI/UX ontology: components, visual elements, interactions, responsive behavior',
          'Model complete traceability: goals → needs → features → constraints → design decisions',
          'Create governance rules for module evolution and dependency management',
          'Establish complexity monitoring and alerting mechanisms',
          'Design for multi-stakeholder collaboration and parallel development',
          'Include version control and change management for modular evolution',
          'Address specific requirements from project analysis',
          'Implement improvement plan recommendations if provided',
          'Focus on quality targets for completeness, consistency, modularity, and stakeholder alignment',
          'Create automated validation rules for modular consistency'
        ],
        context: {
          projectName: inputs.projectName,
          domainDescription: inputs.domainDescription,
          projectComplexity: inputs.projectComplexity,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          projectAnalysis: inputs.projectAnalysis,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['modular-ontology', 'complexity-management', 'domain-specific', 'enterprise-architecture', 'strategic-alignment']
    };
  }
});

/**
 * Task: Build Collaborative Knowledge Graph
 */
const buildCollaborativeKnowledgeGraphTask = defineTask({
  name: 'build-collaborative-knowledge-graph',
  description: 'Build knowledge graph with multi-stakeholder collaboration and advanced validation',

  inputs: {
    projectName: { type: 'string', required: true },
    domainDescription: { type: 'string', default: '' },
    ontologyScope: { type: 'string', default: 'comprehensive' },
    projectComplexity: { type: 'string', default: 'moderate' },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' },
    schema: { type: 'object', required: true },
    projectAnalysis: { type: 'object', default: null },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    complete: { type: 'object' },
    subgraphs: { type: 'object' },
    productGraph: { type: 'object' },     // Product specifications graph
    designGraph: { type: 'object' },      // UI/UX design graph
    goalsGraph: { type: 'object' },       // Goals and objectives graph
    needsGraph: { type: 'object' },       // User needs and requirements graph
    constraintsGraph: { type: 'object' }, // Constraints and limitations graph
    traceabilityGraph: { type: 'object' }, // Goal-to-feature traceability
    statistics: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Build Collaborative Knowledge Graph: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'collaborative-knowledge-engineer',
        goal: `Build comprehensive knowledge graph with multi-stakeholder collaboration for ${inputs.projectName}`,
        instructions: [
          'Implement collaborative modeling sessions with stakeholder groups',
          'Use domain-driven design principles for knowledge organization',
          'Build comprehensive strategic graphs: goals, needs, constraints with full traceability',
          'Create product specification graph with features, user flows, page layouts',
          'Model UI/UX design graph with components, interactions, responsive behavior',
          'Ensure complete goal-to-feature-to-constraint traceability throughout graph',
          'Create automated consistency checking and validation',
          'Implement performance optimization for enterprise scale',
          'Build stakeholder-specific views and interfaces',
          'Create change tracking and evolution management',
          'Include comprehensive cross-references for encyclopedia generation',
          'Model temporal aspects and evolution patterns',
          'Address improvement plan from previous iteration if provided',
          'Focus on quality targets for completeness, consistency, stakeholder alignment, and business value'
        ],
        context: {
          projectName: inputs.projectName,
          domainDescription: inputs.domainDescription,
          projectComplexity: inputs.projectComplexity,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          schema: inputs.schema,
          projectAnalysis: inputs.projectAnalysis,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['collaborative-modeling', 'knowledge-graph', 'stakeholder-alignment', 'strategic-traceability']
    };
  }
});

// Enhanced review and quality tasks
const multiStakeholderReviewTask = defineTask({
  name: 'multi-stakeholder-review',
  description: 'Multi-stakeholder review process with structured feedback collection',
  inputs: {
    phaseResult: { type: 'object', required: true },
    stakeholderContext: { type: 'string' },
    qualityDimensions: { type: 'array' },
    iteration: { type: 'number' },
    phaseName: { type: 'string' }
  },
  outputs: {
    stakeholderFeedback: { type: 'object' },
    consensusAreas: { type: 'array' },
    conflictAreas: { type: 'array' },
    issues: { type: 'array' },
    recommendations: { type: 'array' }
  },
  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Multi-Stakeholder Review - ${inputs.phaseName} Iteration ${inputs.iteration}`,
      agent: {
        role: 'stakeholder-alignment-facilitator',
        goal: 'Facilitate comprehensive review with multiple stakeholder groups',
        instructions: [
          'Coordinate review sessions with different stakeholder groups based on stakeholder context',
          'Collect structured feedback across all quality dimensions',
          'Identify areas of consensus and conflict between stakeholder groups',
          'Facilitate resolution of conflicting requirements through structured negotiation',
          'Document stakeholder priorities, concerns, and success criteria',
          'Create alignment strategies for next iteration',
          'Assess strategic alignment: goals, needs, constraints satisfaction',
          'Evaluate business value perception across stakeholder groups',
          'Document change requests and improvement suggestions'
        ],
        context: {
          phaseResult: inputs.phaseResult,
          stakeholderContext: inputs.stakeholderContext,
          qualityDimensions: inputs.qualityDimensions,
          iteration: inputs.iteration,
          phaseName: inputs.phaseName
        }
      },
      io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
      labels: ['stakeholder-review', 'consensus-building', 'feedback-collection', 'conflict-resolution']
    };
  }
});

const multiDimensionalQualityTask = defineTask({
  name: 'multi-dimensional-quality-assessment',
  description: 'Multi-dimensional quality assessment with business value integration',
  inputs: {
    phaseResult: { type: 'object' },
    stakeholderReview: { type: 'object' },
    qualityDimensions: { type: 'array' },
    targetQuality: { type: 'number' },
    iteration: { type: 'number' },
    phaseName: { type: 'string' }
  },
  outputs: {
    dimensionalScores: { type: 'object' },
    overall: { type: 'number' },
    gaps: { type: 'array' },
    strengths: { type: 'array' },
    improvementPriorities: { type: 'array' }
  },
  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Multi-Dimensional Quality Assessment - ${inputs.phaseName} Iteration ${inputs.iteration}`,
      agent: {
        role: 'quality-assessment-specialist',
        goal: 'Provide comprehensive quality assessment across multiple dimensions with business value focus',
        instructions: [
          'Score quality across technical, business, and stakeholder dimensions',
          'Evaluate technical quality: consistency, completeness, performance, maintainability, modularity',
          'Assess business quality: goal alignment, stakeholder satisfaction, ROI potential, strategic coherence',
          'Measure stakeholder quality: consensus level, adoption readiness, training effectiveness',
          'Integrate stakeholder feedback into quality assessment',
          'Weight dimensions based on project context and stakeholder priorities',
          'Identify specific gaps that prevent higher scores',
          'Highlight strengths that should be preserved and built upon',
          'Prioritize improvements by impact on overall quality and business value',
          'Score each dimension 0-100 and calculate weighted overall score',
          'Provide actionable recommendations for quality improvement'
        ],
        context: {
          phaseResult: inputs.phaseResult,
          stakeholderReview: inputs.stakeholderReview,
          qualityDimensions: inputs.qualityDimensions,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          phaseName: inputs.phaseName
        }
      },
      io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
      labels: ['quality-assessment', 'multi-dimensional', 'business-value', 'stakeholder-integration']
    };
  }
});

// Additional enhanced task definitions
const businessValueMeasurementTask = defineTask({
  name: 'business-value-measurement',
  description: 'Measure business value and ROI potential of phase results',

  inputs: {
    phaseResult: { type: 'object', required: true },
    qualityMetrics: { type: 'object', required: true },
    iteration: { type: 'number', default: 1 },
    phaseName: { type: 'string', required: true }
  },

  outputs: {
    score: { type: 'number' },
    gaps: { type: 'array' },
    projectedROI: { type: 'number' },
    valueDrivers: { type: 'array' },
    timeToValue: { type: 'object' },
    riskAdjustedValue: { type: 'number' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Business Value Assessment - ${inputs.phaseName} Iteration ${inputs.iteration}`,
      agent: {
        role: 'business-value-analyst',
        goal: `Measure and project business value from ${inputs.phaseName} phase results with ROI analysis`,
        instructions: [
          'Evaluate alignment with stated business goals and success metrics',
          'Assess potential for achieving target ROI and value objectives within specified timeframes',
          'Identify key value drivers: cost reduction, revenue enhancement, risk mitigation, efficiency gains',
          'Calculate projected ROI based on implementation costs and expected benefits',
          'Project realistic timeline for value realization and benefit delivery milestones',
          'Assess risk factors that could impact value delivery and adjust projections accordingly',
          'Identify specific gaps that limit business value achievement',
          'Quantify intangible benefits: improved decision making, better stakeholder alignment, reduced technical debt',
          'Compare value potential against industry benchmarks and similar implementations',
          'Recommend specific value enhancement strategies with implementation priorities',
          'Create business case documentation supporting continued investment'
        ],
        context: {
          phaseResult: inputs.phaseResult,
          qualityMetrics: inputs.qualityMetrics,
          iteration: inputs.iteration,
          phaseName: inputs.phaseName
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['business-value', 'roi-measurement', 'value-analysis', 'business-case']
    };
  }
});

const phaseRiskAssessmentTask = defineTask({
  name: 'phase-risk-assessment',
  description: 'Assess and evaluate risks for phase results with comprehensive analysis',

  inputs: {
    phaseResult: { type: 'object', required: true },
    qualityMetrics: { type: 'object', required: true },
    businessValue: { type: 'object', required: true },
    iteration: { type: 'number', default: 1 },
    phaseName: { type: 'string', required: true }
  },

  outputs: {
    level: { type: 'string' },
    factors: { type: 'array' },
    mitigationStrategies: { type: 'array' },
    monitoringPlan: { type: 'object' },
    riskScore: { type: 'number' },
    contingencyPlans: { type: 'array' },
    earlyWarningIndicators: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Comprehensive Risk Assessment - ${inputs.phaseName} Iteration ${inputs.iteration}`,
      agent: {
        role: 'risk-assessment-specialist',
        goal: `Identify, assess, and develop mitigation strategies for risks in ${inputs.phaseName} phase results`,
        instructions: [
          'Identify technical risks: complexity explosion, performance degradation, integration failures, scalability bottlenecks, security vulnerabilities',
          'Assess business risks: stakeholder misalignment, value delivery shortfalls, resource constraints, market changes, competitive threats',
          'Evaluate organizational risks: change resistance, skills gaps, governance failures, cultural misalignment, training inadequacy',
          'Analyze regulatory and compliance risks: changing regulations, audit failures, data protection violations, industry standard compliance',
          'Determine overall risk level using quantitative scoring methodology',
          'Prioritize risk factors by probability, impact, and detectability',
          'Develop specific, actionable mitigation strategies for each identified risk',
          'Create contingency plans for high-impact, low-probability events',
          'Design early warning indicator systems for proactive risk detection',
          'Establish monitoring plan with regular review cycles and escalation procedures',
          'Assess risk interdependencies and cascading failure scenarios',
          'Calculate risk-adjusted impact on project timeline, budget, and value delivery',
          'Recommend risk tolerance levels and acceptance criteria'
        ],
        context: {
          phaseResult: inputs.phaseResult,
          qualityMetrics: inputs.qualityMetrics,
          businessValue: inputs.businessValue,
          iteration: inputs.iteration,
          phaseName: inputs.phaseName
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['risk-assessment', 'risk-mitigation', 'monitoring', 'contingency-planning']
    };
  }
});

const enhancedImprovementPlanTask = defineTask({
  name: 'enhanced-improvement-plan',
  description: 'Create comprehensive improvement plan for next iteration',
  inputs: {
    currentResult: { type: 'object', required: true },
    qualityGaps: { type: 'array', required: true },
    stakeholderFeedback: { type: 'object', required: true },
    businessValueGaps: { type: 'array', required: true },
    riskFactors: { type: 'array', required: true },
    targetQuality: { type: 'number', required: true },
    iteration: { type: 'number', required: true }
  },
  outputs: {
    improvementPlan: { type: 'object' },
    priorities: { type: 'array' },
    actionItems: { type: 'array' },
    successCriteria: { type: 'object' },
    resourceRequirements: { type: 'object' }
  },
  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Enhanced Improvement Planning - Iteration ${inputs.iteration}`,
      agent: {
        role: 'improvement-strategist',
        goal: 'Create comprehensive improvement plan addressing quality gaps, stakeholder feedback, business value, and risk factors',
        instructions: [
          'Analyze all sources of improvement needs: quality gaps, stakeholder feedback, business value gaps, risk factors',
          'Prioritize improvements by impact on target quality and business value',
          'Create specific, actionable items for next iteration',
          'Address highest-impact gaps first while considering stakeholder priorities',
          'Focus on areas that enable strategic goal achievement',
          'Plan improvements to product spec generation capabilities',
          'Design solutions that enhance stakeholder alignment',
          'Create implementation guidance with clear success criteria',
          'Estimate resource requirements and timeline for improvements',
          'Set measurable success criteria for next iteration'
        ],
        context: {
          currentResult: inputs.currentResult,
          qualityGaps: inputs.qualityGaps,
          stakeholderFeedback: inputs.stakeholderFeedback,
          businessValueGaps: inputs.businessValueGaps,
          riskFactors: inputs.riskFactors,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration
        }
      },
      io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
      labels: ['improvement-planning', 'iteration-planning', 'strategic-enhancement']
    };
  }
});

const complexityMonitoringTask = defineTask({
  name: 'complexity-monitoring',
  description: 'Monitor and assess complexity metrics with proactive alerting',

  inputs: {
    phaseResult: { type: 'object', required: true },
    iteration: { type: 'number', default: 1 },
    phaseName: { type: 'string', required: true }
  },

  outputs: {
    complexityScore: { type: 'number' },
    metrics: { type: 'object' },
    alerts: { type: 'array' },
    recommendations: { type: 'array' },
    trends: { type: 'object' },
    thresholds: { type: 'object' },
    reductionStrategies: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Complexity Monitoring - ${inputs.phaseName} Iteration ${inputs.iteration}`,
      agent: {
        role: 'complexity-management-specialist',
        goal: `Monitor and assess complexity metrics for ${inputs.phaseName} to prevent complexity explosion and maintain manageable system architecture`,
        instructions: [
          'Measure ontology complexity metrics: schema size, concept count, relationship depth, cyclomatic complexity, interconnection density',
          'Assess stakeholder complexity: number of stakeholder groups, requirement conflicts, communication pathways, decision-making overhead',
          'Evaluate technical complexity: integration points, API complexity, data flow complexity, performance requirements, scalability challenges',
          'Monitor business complexity: goal alignment complexity, constraint interaction complexity, traceability graph density',
          'Calculate composite complexity score using weighted multi-dimensional analysis',
          'Track complexity trends and growth patterns over iterations',
          'Compare against complexity thresholds and industry benchmarks',
          'Generate automated alerts for complexity threshold breaches',
          'Identify complexity hotspots and high-risk areas requiring immediate attention',
          'Recommend specific complexity reduction strategies: modularization, abstraction, refactoring, stakeholder alignment',
          'Design complexity management governance policies and procedures',
          'Create complexity dashboards and monitoring systems for ongoing visibility',
          'Assess impact of complexity on maintainability, performance, and stakeholder adoption'
        ],
        context: {
          phaseResult: inputs.phaseResult,
          iteration: inputs.iteration,
          phaseName: inputs.phaseName
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['complexity-monitoring', 'metrics', 'alerts', 'complexity-management']
    };
  }
});

// Additional task definitions for remaining phases and functions
const createAdaptiveGeneratorsTask = defineTask({
  name: 'create-adaptive-generators',
  description: 'Create comprehensive domain-specific adaptive generators',

  inputs: {
    projectName: { type: 'string', required: true },
    knowledgeGraph: { type: 'object', required: true },
    domainType: { type: 'string', default: 'general' },
    projectComplexity: { type: 'string', default: 'moderate' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    specifications: { type: 'array' },
    implementations: { type: 'object' },
    productSpecGenerators: { type: 'object' },
    uiSpecGenerators: { type: 'object' },
    documentationGenerators: { type: 'object' },
    testGenerators: { type: 'object' },
    validationFramework: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Create Adaptive Generators: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'adaptive-generator-architect',
        goal: `Create comprehensive domain-specific generators with adaptive capabilities for ${inputs.projectName}`,
        instructions: [
          'Design generators for domain-specific patterns based on domain type (healthcare, finance, manufacturing, AI/ML)',
          'Create comprehensive product specification generators that produce goal-driven features with constraint compliance',
          'Build UI/UX specification generators for responsive design with accessibility and user needs alignment',
          'Implement strategic documentation generators with complete traceability from goals to implementation',
          'Create test case generators for multi-level validation (syntactic, semantic, pragmatic, business)',
          'Build adaptive templates that adjust complexity and detail based on project complexity level',
          'Implement validation and consistency checking frameworks across all generated artifacts',
          'Create generators for strategic documentation with full goal-needs-constraints traceability',
          'Build encyclopedia/wiki generators for comprehensive domain knowledge capture',
          'Design API specification generators with enterprise integration patterns',
          'Create compliance documentation generators for regulatory requirements',
          'Implement cross-reference generators for navigation and discovery',
          'Build version control and evolution management for generated artifacts',
          'Design performance-optimized generators for enterprise-scale deployments',
          'Include stakeholder-specific view generators for different audiences',
          'Create business value tracking generators with ROI measurement capabilities',
          'Implement continuous integration generators with automated quality gates',
          'Address improvement plan recommendations if provided from previous iteration'
        ],
        context: {
          projectName: inputs.projectName,
          knowledgeGraph: inputs.knowledgeGraph,
          domainType: inputs.domainType,
          projectComplexity: inputs.projectComplexity,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptive-generators', 'domain-specific', 'strategic-generation', 'enterprise-scale']
    };
  }
});

const generateStrategicDocumentationTask = defineTask({
  name: 'generate-strategic-documentation',
  description: 'Generate comprehensive strategic documentation with stakeholder alignment',

  inputs: {
    projectName: { type: 'string', required: true },
    knowledgeGraph: { type: 'object', required: true },
    generators: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    requirements: { type: 'object' },
    specifications: { type: 'object' },
    productSpecification: { type: 'object' },
    uiSpecification: { type: 'object' },
    strategicAlignment: { type: 'object' },
    traceabilityMatrix: { type: 'object' },
    constraintCompliance: { type: 'object' },
    stakeholderViews: { type: 'object' },
    wiki: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Generate Strategic Documentation: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'strategic-documentation-architect',
        goal: `Generate comprehensive strategic documentation with complete stakeholder alignment and traceability for ${inputs.projectName}`,
        instructions: [
          'Generate goal-driven requirements specification with clear business rationale and success criteria',
          'Create comprehensive product specifications with complete feature-to-goal traceability',
          'Build detailed technical specifications with constraint-aware design decisions',
          'Generate UI/UX specifications with user needs alignment and accessibility compliance',
          'Create strategic alignment document showing goals-needs-constraints relationships and resolution strategies',
          'Generate comprehensive traceability matrix linking every feature to goals, user needs, and constraints',
          'Create constraint compliance documentation showing how solutions respect all limitations and regulations',
          'Build stakeholder-specific documentation views tailored to different audience needs and expertise levels',
          'Generate complete domain encyclopedia with strategic context, decision rationale, and cross-references',
          'Create API specifications and integration documentation with enterprise patterns',
          'Build architecture documentation with strategic decision rationale and pattern justification',
          'Generate compliance and regulatory documentation with audit trail capabilities',
          'Create change management documentation with training materials and adoption strategies',
          'Build business case documentation with ROI projections and value realization timelines',
          'Generate governance documentation with policies, procedures, and success metrics',
          'Create cross-reference systems for navigation between specifications and strategic context',
          'Ensure all documentation demonstrates clear goal-needs-constraints alignment and business value',
          'Address improvement plan recommendations if provided from previous iteration',
          'Focus on strategic completeness, traceability gaps, and stakeholder alignment consistency'
        ],
        context: {
          projectName: inputs.projectName,
          knowledgeGraph: inputs.knowledgeGraph,
          generators: inputs.generators,
          stakeholderContext: inputs.stakeholderContext,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['strategic-documentation', 'stakeholder-alignment', 'traceability', 'encyclopedia-generation']
    };
  }
});

const designMultiLevelTestingTask = defineTask({
  name: 'design-multi-level-testing',
  description: 'Design comprehensive multi-level testing and quality assurance framework',

  inputs: {
    projectName: { type: 'string', required: true },
    knowledgeGraph: { type: 'object', required: true },
    documentation: { type: 'object', required: true },
    domainType: { type: 'string', default: 'general' },
    riskProfile: { type: 'string', default: 'moderate' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    strategy: { type: 'object' },
    framework: { type: 'object' },
    verificationMethods: { type: 'array' },
    evidenceBoundaries: { type: 'array' },
    cicdSpecification: { type: 'object' },
    qualityMetrics: { type: 'object' },
    automationFramework: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Design Multi-Level Testing Framework: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'quality-assurance-architect',
        goal: `Design comprehensive multi-level testing and quality assurance framework for ${inputs.projectName} with domain-specific validation`,
        instructions: [
          'Design syntactic validation: OWL consistency checking, schema validation, automated reasoning, inference testing',
          'Create semantic validation: domain expert review processes, cross-reference consistency, logical inference validation',
          'Build pragmatic validation: end-user acceptance testing, performance and scalability testing, integration testing with enterprise systems',
          'Implement business validation: ROI measurement, goal achievement assessment, stakeholder satisfaction surveys',
          'Create domain-specific testing patterns for healthcare, finance, manufacturing, AI/ML systems as applicable',
          'Design stakeholder acceptance testing frameworks with role-based validation scenarios',
          'Build continuous quality monitoring systems with automated dashboards and alerting',
          'Create risk-based testing strategies prioritizing high-impact, high-risk areas',
          'Design evidence boundaries and quality gates for phase transitions',
          'Implement automated testing frameworks for ontology consistency, performance, and business rule validation',
          'Create comprehensive CI/CD pipeline specifications with automated quality gates',
          'Design end-to-end testing scenarios covering complete user journeys and business processes',
          'Build performance and scalability testing frameworks for enterprise-scale deployments',
          'Create security and compliance testing frameworks for regulated domains',
          'Design test data management and synthetic data generation strategies',
          'Implement automated regression testing for ontology evolution and knowledge graph updates',
          'Create quality metrics and KPI frameworks for continuous improvement',
          'Design disaster recovery and business continuity testing scenarios',
          'Address improvement plan recommendations if provided from previous iteration'
        ],
        context: {
          projectName: inputs.projectName,
          knowledgeGraph: inputs.knowledgeGraph,
          documentation: inputs.documentation,
          domainType: inputs.domainType,
          riskProfile: inputs.riskProfile,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['multi-level-testing', 'quality-framework', 'validation', 'automation', 'continuous-quality']
    };
  }
});

const establishGovernanceTask = defineTask({
  name: 'establish-governance',
  description: 'Establish comprehensive governance and risk management framework',

  inputs: {
    projectName: { type: 'string', required: true },
    allPhaseResults: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    riskProfile: { type: 'string', default: 'moderate' },
    projectComplexity: { type: 'string', default: 'moderate' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    framework: { type: 'object' },
    policies: { type: 'array' },
    processes: { type: 'array' },
    stakeholderAlignment: { type: 'object' },
    changeManagement: { type: 'object' },
    complianceMapping: { type: 'object' },
    governanceMetrics: { type: 'object' },
    trainingProgram: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Establish Governance Framework: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'enterprise-governance-architect',
        goal: `Establish comprehensive governance and risk management framework for ${inputs.projectName} supporting long-term organizational adoption and sustainable operation`,
        instructions: [
          'Design federated governance model for multi-stakeholder environments with clear accountability and decision-making authority',
          'Create comprehensive change management and evolution policies for ontology lifecycle management',
          'Establish continuous compliance monitoring systems for regulatory requirements and industry standards',
          'Design risk management and mitigation frameworks with proactive identification and response capabilities',
          'Create organizational adoption and training programs with competency development and certification',
          'Build stakeholder alignment processes with conflict resolution and consensus-building mechanisms',
          'Design quality governance with continuous improvement processes and performance measurement',
          'Create data governance policies for information quality, privacy, security, and lifecycle management',
          'Establish technology governance for tool selection, integration standards, and architecture compliance',
          'Design business process governance for value delivery, resource allocation, and performance management',
          'Create compliance mapping and audit trail capabilities for regulatory reporting and verification',
          'Build governance metrics and KPI frameworks for effectiveness measurement and improvement',
          'Design center of excellence structure for capability building and knowledge sharing',
          'Create vendor and partner governance for external relationship management and quality assurance',
          'Establish intellectual property and knowledge management policies for organizational learning',
          'Design governance communication and reporting structures for transparency and accountability',
          'Create governance evolution and improvement processes for continuous framework enhancement',
          'Build crisis management and business continuity governance for resilience and recovery',
          'Address improvement plan recommendations if provided from previous iteration'
        ],
        context: {
          projectName: inputs.projectName,
          allPhaseResults: inputs.allPhaseResults,
          stakeholderContext: inputs.stakeholderContext,
          riskProfile: inputs.riskProfile,
          projectComplexity: inputs.projectComplexity,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['governance', 'risk-management', 'organizational-adoption', 'compliance', 'sustainability']
    };
  }
});

const continuousRiskMonitoringTask = defineTask({
  name: 'continuous-risk-monitoring',
  description: 'Continuous risk monitoring and proactive mitigation system',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    riskProfile: { type: 'string', default: 'moderate' },
    projectComplexity: { type: 'string', default: 'moderate' }
  },

  outputs: {
    effectivenessScore: { type: 'number' },
    mitigationStrategies: { type: 'object' },
    monitoringPlan: { type: 'object' },
    earlyWarningSystem: { type: 'object' },
    riskTrends: { type: 'object' },
    contingencyPlans: { type: 'array' },
    escalationProcedures: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Continuous Risk Monitoring System: ${inputs.projectName}`,
      agent: {
        role: 'risk-monitoring-specialist',
        goal: `Implement comprehensive continuous risk monitoring and proactive mitigation system for ${inputs.projectName}`,
        instructions: [
          'Monitor technical debt accumulation and complexity growth with automated metrics and thresholds',
          'Track stakeholder alignment and satisfaction trends through regular surveys and feedback mechanisms',
          'Assess business value delivery and goal achievement progress against established KPIs and success criteria',
          'Monitor quality metrics trends across all phases and identify degradation patterns',
          'Implement proactive risk mitigation strategies with automated triggers and response protocols',
          'Create early warning systems for risk factor detection with predictive analytics and trend analysis',
          'Monitor integration health and performance degradation with real-time system monitoring',
          'Track regulatory compliance status and identify emerging compliance risks',
          'Monitor competitive landscape changes and technology evolution impacts',
          'Assess organizational change resistance and adoption challenges with change management metrics',
          'Create automated risk dashboards with real-time visibility and alert systems',
          'Design escalation procedures for different risk levels and impact categories',
          'Implement contingency planning activation based on risk threshold breaches',
          'Monitor vendor and partner performance with service level agreements and quality metrics',
          'Track project timeline and budget risks with predictive modeling and variance analysis',
          'Create risk communication and reporting systems for stakeholder awareness and decision support',
          'Design risk mitigation effectiveness measurement with continuous improvement feedback loops',
          'Implement disaster recovery and business continuity monitoring with regular testing and validation'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          riskProfile: inputs.riskProfile,
          projectComplexity: inputs.projectComplexity
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['continuous-monitoring', 'risk-mitigation', 'early-warning', 'proactive-management']
    };
  }
});

const comprehensiveQualityAssessmentTask = defineTask({
  name: 'comprehensive-quality-assessment',
  description: 'Final comprehensive quality assessment across all dimensions',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    targetQuality: { type: 'number', default: 85 },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    projectComplexity: { type: 'string', default: 'moderate' }
  },

  outputs: {
    overallScore: { type: 'number' },
    businessValue: { type: 'number' },
    stakeholderAlignment: { type: 'number' },
    technicalQuality: { type: 'number' },
    strategicAlignment: { type: 'number' },
    sustainabilityScore: { type: 'number' },
    recommendations: { type: 'array' },
    improvementPlan: { type: 'object' },
    successMetrics: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Comprehensive Quality Assessment: ${inputs.projectName}`,
      agent: {
        role: 'enterprise-quality-assessor',
        goal: `Perform final comprehensive quality assessment across all dimensions for ${inputs.projectName} with detailed recommendations for ongoing success`,
        instructions: [
          'Assess overall technical quality across all phases: schema design, knowledge graph construction, generators, documentation, testing, SDK, interfaces',
          'Measure business value achievement and ROI potential against established goals and success criteria',
          'Evaluate stakeholder satisfaction and alignment through comprehensive stakeholder feedback analysis',
          'Assess strategic goal achievement and traceability completeness from goals through implementation',
          'Measure ontology quality dimensions: completeness, consistency, modularity, maintainability, performance, scalability',
          'Evaluate documentation quality: clarity, comprehensiveness, accuracy, usability, strategic alignment',
          'Assess governance effectiveness: policy compliance, risk management, change management, organizational adoption',
          'Measure sustainability factors: long-term maintainability, evolution capability, organizational support, resource sustainability',
          'Evaluate complexity management effectiveness: modular design success, technical debt levels, scalability achievement',
          'Assess integration quality: enterprise system compatibility, performance at scale, security compliance',
          'Measure user experience quality: usability, accessibility, performance, satisfaction across all interfaces',
          'Evaluate compliance and regulatory adherence: audit readiness, regulatory requirement satisfaction, risk mitigation',
          'Calculate weighted overall quality score using multi-dimensional assessment framework',
          'Identify areas of excellence that should be preserved and replicated',
          'Identify improvement opportunities with prioritized action plans',
          'Provide strategic recommendations for ongoing evolution and enhancement',
          'Create success metrics framework for continuous quality monitoring and improvement',
          'Design quality governance framework for long-term quality assurance and continuous improvement'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          targetQuality: inputs.targetQuality,
          stakeholderContext: inputs.stakeholderContext,
          projectComplexity: inputs.projectComplexity
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['comprehensive-assessment', 'final-quality', 'business-value', 'strategic-assessment', 'sustainability']
    };
  }
});

// ============================================================================
// ADDITIONAL PHASE TASK DEFINITIONS
// ============================================================================

/**
 * Task: Develop Enterprise SDK
 */
const developEnterpriseSDKTask = defineTask({
  name: 'develop-enterprise-sdk',
  description: 'Develop enterprise-grade SDK with governance and integration patterns',

  inputs: {
    projectName: { type: 'string', required: true },
    knowledgeGraph: { type: 'object', required: true },
    documentation: { type: 'object', required: true },
    testing: { type: 'object', required: true },
    generators: { type: 'object', required: true },
    domainType: { type: 'string', default: 'general' },
    projectComplexity: { type: 'string', default: 'moderate' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    design: { type: 'object' },
    specification: { type: 'object' },
    scaffolding: { type: 'object' },
    coreLibraries: { type: 'object' },
    integrationAdapters: { type: 'object' },
    securityFramework: { type: 'object' },
    performanceOptimizations: { type: 'object' },
    documentation: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Develop Enterprise SDK: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'enterprise-sdk-architect',
        goal: `Develop enterprise-grade SDK for ${inputs.projectName} with comprehensive integration patterns and governance support`,
        instructions: [
          'Design SDK architecture based on knowledge graph structure and enterprise requirements',
          'Create comprehensive SDK specification with API documentation and usage patterns',
          'Generate SDK scaffolding and core library components with modular design',
          'Build domain-specific integration adapters for enterprise systems (ERP, CRM, MES, etc.)',
          'Implement enterprise security framework with authentication, authorization, and encryption',
          'Design performance optimization strategies for high-throughput enterprise environments',
          'Create comprehensive SDK documentation with examples, tutorials, and best practices',
          'Build testing and validation frameworks for SDK quality assurance',
          'Design SDK versioning and backward compatibility management',
          'Implement SDK governance and compliance features for enterprise policies',
          'Create monitoring and telemetry capabilities for production usage tracking',
          'Design error handling and logging frameworks with enterprise-grade diagnostics',
          'Build caching and optimization strategies for enterprise-scale performance',
          'Create SDK configuration and customization frameworks for enterprise deployment',
          'Implement data transformation and serialization optimizations',
          'Design SDK plugin and extension architecture for customization',
          'Address improvement plan recommendations if provided from previous iteration'
        ],
        context: {
          projectName: inputs.projectName,
          knowledgeGraph: inputs.knowledgeGraph,
          documentation: inputs.documentation,
          testing: inputs.testing,
          generators: inputs.generators,
          domainType: inputs.domainType,
          projectComplexity: inputs.projectComplexity,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['enterprise-sdk', 'integration-patterns', 'performance', 'security', 'governance']
    };
  }
});

/**
 * Task: Build Federated Interfaces
 */
const buildFederatedInterfacesTask = defineTask({
  name: 'build-federated-interfaces',
  description: 'Build federated programmable interfaces (CLI/MCP/API) for multi-stakeholder environments',

  inputs: {
    projectName: { type: 'string', required: true },
    knowledgeGraph: { type: 'object', required: true },
    sdk: { type: 'object', required: true },
    documentation: { type: 'object', required: true },
    testing: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    cli: { type: 'object' },
    mcp: { type: 'object' },
    api: { type: 'object' },
    federationFramework: { type: 'object' },
    securityModel: { type: 'object' },
    performanceOptimizations: { type: 'object' },
    monitoringSystem: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Build Federated Interfaces: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'federated-interface-architect',
        goal: `Build comprehensive federated programmable interfaces for ${inputs.projectName} supporting multi-stakeholder access patterns`,
        instructions: [
          'Design comprehensive CLI interface with role-based command access and enterprise authentication',
          'Create MCP server specifications for Claude integration with federated governance',
          'Build REST/GraphQL API interfaces with comprehensive enterprise security and rate limiting',
          'Design federation framework for distributed ownership while maintaining coordination',
          'Implement role-based access control with fine-grained permissions and audit trails',
          'Create API gateway patterns for enterprise integration and traffic management',
          'Build comprehensive security model with OAuth2/OIDC, API keys, and certificate-based authentication',
          'Design performance optimization strategies for high-concurrency enterprise environments',
          'Implement caching and CDN strategies for global enterprise deployment',
          'Create monitoring and observability systems with metrics, logging, and distributed tracing',
          'Design error handling and resilience patterns with circuit breakers and fallback mechanisms',
          'Build comprehensive API documentation with interactive testing and code examples',
          'Create SDK bindings for multiple programming languages and enterprise platforms',
          'Implement versioning and backward compatibility strategies for enterprise API evolution',
          'Design batch processing and bulk operations for enterprise-scale data handling',
          'Create webhook and event streaming capabilities for real-time enterprise integration',
          'Address improvement plan recommendations if provided from previous iteration'
        ],
        context: {
          projectName: inputs.projectName,
          knowledgeGraph: inputs.knowledgeGraph,
          sdk: inputs.sdk,
          documentation: inputs.documentation,
          testing: inputs.testing,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['federated-interfaces', 'api-design', 'cli', 'mcp', 'enterprise-integration']
    };
  }
});

/**
 * Task: Create Scalable UI
 */
const createScalableUITask = defineTask({
  name: 'create-scalable-ui',
  description: 'Create scalable user interfaces (web/mobile/TUI) with accessibility and performance optimization',

  inputs: {
    projectName: { type: 'string', required: true },
    knowledgeGraph: { type: 'object', required: true },
    interfaces: { type: 'object', required: true },
    sdk: { type: 'object', required: true },
    documentation: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    improvementPlan: { type: 'object', default: null },
    qualityTargets: { type: 'object', default: {} }
  },

  outputs: {
    web: { type: 'object' },
    mobile: { type: 'object' },
    tui: { type: 'object' },
    designSystem: { type: 'object' },
    accessibilityFramework: { type: 'object' },
    performanceOptimizations: { type: 'object' },
    internationalization: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Create Scalable UI: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'scalable-ui-architect',
        goal: `Create comprehensive scalable user interfaces for ${inputs.projectName} with accessibility, performance, and multi-stakeholder support`,
        instructions: [
          'Design responsive web application interface with modern frameworks and progressive web app capabilities',
          'Create mobile application specifications for iOS and Android with native and hybrid approaches',
          'Design terminal UI for command-line users with rich interactive capabilities and accessibility',
          'Build comprehensive design system with reusable components, consistent styling, and accessibility compliance',
          'Implement WCAG 2.1 AA accessibility compliance with screen reader support and keyboard navigation',
          'Create performance optimization strategies with lazy loading, code splitting, and caching',
          'Design internationalization framework with support for multiple languages and cultural adaptations',
          'Build responsive design patterns with mobile-first approach and adaptive layouts',
          'Create user experience optimization with usability testing and feedback integration',
          'Design dark mode and high contrast themes for accessibility and user preference',
          'Implement state management patterns for complex enterprise applications',
          'Create error handling and user feedback systems with graceful degradation',
          'Build offline capability and progressive enhancement for mobile and unreliable networks',
          'Design component testing and visual regression testing frameworks',
          'Create performance monitoring and real user monitoring (RUM) integration',
          'Build comprehensive UI documentation with component libraries and usage guidelines',
          'Address improvement plan recommendations if provided from previous iteration'
        ],
        context: {
          projectName: inputs.projectName,
          knowledgeGraph: inputs.knowledgeGraph,
          interfaces: inputs.interfaces,
          sdk: inputs.sdk,
          documentation: inputs.documentation,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          improvementPlan: inputs.improvementPlan,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['scalable-ui', 'accessibility', 'performance', 'responsive-design', 'user-experience']
    };
  }
});

/**
 * Task: Adversarial Review
 * Purpose: Actively seek flaws, gaps, and weaknesses in phase deliverables
 */
const adversarialReviewTask = defineTask({
  name: 'adversarial-review',
  description: 'Conduct thorough adversarial review to identify flaws, gaps, and potential failures',

  inputs: {
    phase: { type: 'string', required: true },
    deliverable: { type: 'object', required: true },
    context: { type: 'object', required: true },
    previousReviews: { type: 'array', default: [] },
    iteration: { type: 'number', default: 0 }
  },

  outputs: {
    flaws: { type: 'array' },
    gaps: { type: 'array' },
    risks: { type: 'array' },
    recommendations: { type: 'array' },
    severity: { type: 'string' },
    needsIteration: { type: 'boolean' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Adversarial Review: ${inputs.phase} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'adversarial-reviewer',
        goal: `Identify flaws, gaps, and potential failures in ${inputs.phase} deliverables`,
        instructions: [
          'Act as a hostile critic seeking to identify every possible flaw and weakness',
          'Look for logical inconsistencies, missing requirements, and incomplete coverage',
          'Identify potential failure points and edge cases that could cause problems',
          'Challenge assumptions and question whether deliverables meet stated goals',
          'Check for alignment with business goals, user needs, and constraints',
          'Evaluate technical feasibility and potential implementation challenges',
          'Look for gaps in stakeholder coverage and requirement satisfaction',
          'Assess scalability, maintainability, and long-term viability concerns',
          'Identify missing traceability and documentation gaps',
          'Check for regulatory compliance and security vulnerabilities',
          'Look for performance bottlenecks and resource constraints',
          'Evaluate user experience and accessibility concerns',
          'Assess organizational change management and adoption risks',
          'Challenge the completeness and accuracy of strategic alignment',
          'Look for contradictions between different parts of the deliverable',
          'Identify areas where more detail or clarification is needed',
          'Categorize findings by severity: critical, major, minor',
          'Provide specific, actionable recommendations for each identified issue',
          'Determine whether another iteration is needed based on findings',
          'Focus on preventing real-world implementation failures'
        ],
        context: {
          phase: inputs.phase,
          deliverable: inputs.deliverable,
          projectContext: inputs.context,
          previousReviews: inputs.previousReviews,
          iteration: inputs.iteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adversarial-review', 'quality-assurance', 'flaw-detection', 'risk-assessment']
    };
  }
});

/**
 * Task: Multi-Dimensional Quality Assessment
 * Purpose: Comprehensive quality scoring across multiple dimensions
 */
const qualityAssessmentTask = defineTask({
  name: 'quality-assessment',
  description: 'Comprehensive multi-dimensional quality assessment with scoring',

  inputs: {
    phase: { type: 'string', required: true },
    deliverable: { type: 'object', required: true },
    context: { type: 'object', required: true },
    adversarialReview: { type: 'object', required: true },
    iteration: { type: 'number', default: 0 },
    targetQuality: { type: 'number', default: 85 }
  },

  outputs: {
    overallScore: { type: 'number' },
    dimensionScores: { type: 'object' },
    qualityMetrics: { type: 'object' },
    strengths: { type: 'array' },
    weaknesses: { type: 'array' },
    improvementAreas: { type: 'array' },
    meetsTarget: { type: 'boolean' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Quality Assessment: ${inputs.phase} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'quality-assessor',
        goal: `Comprehensively assess quality of ${inputs.phase} deliverables across multiple dimensions`,
        instructions: [
          'Evaluate technical quality: completeness, consistency, correctness, maintainability',
          'Assess business quality: goal alignment, value delivery, stakeholder satisfaction',
          'Evaluate process quality: methodology adherence, documentation quality, traceability',
          'Assess strategic quality: alignment with goals, needs satisfaction, constraint compliance',
          'Check usability quality: user experience, accessibility, performance',
          'Evaluate security quality: threat mitigation, compliance, data protection',
          'Assess scalability quality: performance under load, architectural soundness',
          'Check integration quality: system compatibility, API design, data flow',
          'Score each dimension on 0-100 scale with detailed justification',
          'Calculate weighted overall score based on phase importance and context',
          'Identify specific strengths that should be preserved and enhanced',
          'Pinpoint weaknesses that require immediate attention',
          'Provide concrete improvement recommendations with priority levels',
          'Consider feedback from adversarial review in scoring',
          'Account for iteration progress and improvement trajectory',
          'Determine if deliverable meets target quality threshold',
          'Provide detailed metrics and evidence for all scores',
          'Include comparative analysis with previous iterations if applicable',
          'Focus on objective, measurable criteria where possible',
          'Balance perfectionism with practical delivery constraints'
        ],
        context: {
          phase: inputs.phase,
          deliverable: inputs.deliverable,
          projectContext: inputs.context,
          adversarialReview: inputs.adversarialReview,
          iteration: inputs.iteration,
          targetQuality: inputs.targetQuality
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['quality-assessment', 'multi-dimensional-scoring', 'metrics', 'evaluation']
    };
  }
});

/**
 * Task: Convergence Assessment
 * Purpose: Determine if phase has converged to acceptable quality
 */
const convergenceAssessmentTask = defineTask({
  name: 'convergence-assessment',
  description: 'Assess whether phase has converged to acceptable quality and completion',

  inputs: {
    phase: { type: 'string', required: true },
    qualityHistory: { type: 'array', required: true },
    currentQuality: { type: 'object', required: true },
    adversarialReview: { type: 'object', required: true },
    context: { type: 'object', required: true },
    iteration: { type: 'number', default: 0 },
    maxIterations: { type: 'number', default: 5 },
    targetQuality: { type: 'number', default: 85 }
  },

  outputs: {
    hasConverged: { type: 'boolean' },
    shouldContinue: { type: 'boolean' },
    convergenceReason: { type: 'string' },
    qualityTrend: { type: 'object' },
    recommendations: { type: 'array' },
    nextActions: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Convergence Assessment: ${inputs.phase} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'convergence-analyst',
        goal: `Determine convergence status and next actions for ${inputs.phase}`,
        instructions: [
          'Analyze quality improvement trend across iterations',
          'Assess whether target quality threshold has been achieved',
          'Evaluate diminishing returns and improvement plateau patterns',
          'Check if critical flaws from adversarial review have been addressed',
          'Determine if maximum iteration limit should trigger conclusion',
          'Analyze cost-benefit of additional iterations vs. current quality level',
          'Assess readiness for next phase or if more work is needed in current phase',
          'Consider business value delivery vs. perfectionism balance',
          'Evaluate stakeholder satisfaction and acceptance criteria',
          'Check for emergent issues that require fundamental approach changes',
          'Assess resource constraints and timeline pressures',
          'Determine if quality is "good enough" for current project context',
          'Look for signs of over-iteration or analysis paralysis',
          'Evaluate improvement velocity and likelihood of future gains',
          'Consider risk tolerance and failure consequences',
          'Provide clear convergence decision with evidence-based reasoning',
          'Recommend specific next actions based on convergence status',
          'If not converged: provide prioritized improvement plan',
          'If converged: recommend transition strategy to next phase',
          'Document lessons learned and convergence insights for future phases'
        ],
        context: {
          phase: inputs.phase,
          qualityHistory: inputs.qualityHistory,
          currentQuality: inputs.currentQuality,
          adversarialReview: inputs.adversarialReview,
          projectContext: inputs.context,
          iteration: inputs.iteration,
          maxIterations: inputs.maxIterations,
          targetQuality: inputs.targetQuality
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['convergence-assessment', 'decision-making', 'quality-analysis', 'iteration-control']
    };
  }
});

/**
 * Task: Phase Gap Identification
 * Purpose: Identify what needs to be achieved in this phase
 */
const phaseGapIdentificationTask = defineTask({
  name: 'phase-gap-identification',
  description: 'Identify gaps and required outcomes for a specific phase',

  inputs: {
    phase: { type: 'string', required: true },
    phaseName: { type: 'string', required: true },
    qualityDimensions: { type: 'array', required: true },
    targetQuality: { type: 'number', default: 85 },
    context: { type: 'object', required: true }
  },

  outputs: {
    gaps: { type: 'array' },
    expectedOutcomes: { type: 'object' },
    successCriteria: { type: 'array' },
    qualityTargets: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Phase Gap Identification: ${inputs.phaseName}`,
      agent: {
        role: 'phase-gap-analyst',
        goal: `Identify gaps and required outcomes for ${inputs.phaseName} phase`,
        instructions: [
          'Analyze what specific outcomes this phase must deliver',
          'Identify gaps between current state and required phase deliverables',
          'Define success criteria specific to this phase',
          'Establish quality targets for each quality dimension',
          'Consider phase-specific requirements based on project context',
          'Identify potential challenges and obstacles for this phase',
          'Define clear, measurable outcomes that indicate phase completion',
          'Consider dependencies on previous phases (if any)',
          'Establish criteria for internal convergence within this phase',
          'Identify stakeholder expectations specific to this phase',
          'Define what "good enough" looks like for this phase context',
          'Consider domain-specific requirements and constraints',
          'Establish priorities among different outcome categories',
          'Identify critical vs. nice-to-have outcomes',
          'Define validation criteria for each expected outcome'
        ],
        context: {
          phase: inputs.phase,
          phaseName: inputs.phaseName,
          qualityDimensions: inputs.qualityDimensions,
          targetQuality: inputs.targetQuality,
          projectContext: inputs.context
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['gap-identification', 'phase-planning', 'outcome-definition']
    };
  }
});

/**
 * Task: Internal Gap Analysis
 * Purpose: Find gaps in current phase deliverable against expected outcomes
 */
const internalGapAnalysisTask = defineTask({
  name: 'internal-gap-analysis',
  description: 'Analyze gaps in phase deliverable against expected outcomes',

  inputs: {
    phase: { type: 'string', required: true },
    deliverable: { type: 'object', required: true },
    expectedOutcomes: { type: 'object', required: true },
    qualityDimensions: { type: 'array', required: true },
    iteration: { type: 'number', default: 0 },
    context: { type: 'object', required: true }
  },

  outputs: {
    gaps: { type: 'array' },
    missingElements: { type: 'array' },
    qualityDeficits: { type: 'array' },
    improvementAreas: { type: 'array' },
    gapSeverity: { type: 'string' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Internal Gap Analysis: ${inputs.phase} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'gap-analyst',
        goal: `Identify gaps in ${inputs.phase} deliverable against expected outcomes`,
        instructions: [
          'Compare current deliverable against expected phase outcomes',
          'Identify missing elements that were expected but not delivered',
          'Assess quality deficits in delivered elements',
          'Look for incomplete or superficial treatment of requirements',
          'Identify areas where more depth or detail is needed',
          'Check coverage of all quality dimensions for this phase',
          'Assess whether deliverable meets phase success criteria',
          'Identify gaps in alignment with project context and constraints',
          'Look for internal inconsistencies within the deliverable',
          'Assess completeness of traceability and documentation',
          'Identify areas where stakeholder needs are not addressed',
          'Check for missing domain-specific considerations',
          'Evaluate whether deliverable supports next phases effectively',
          'Assess practical implementability of current deliverable',
          'Identify gaps that could lead to downstream problems',
          'Prioritize gaps by severity and impact on overall success',
          'Provide specific, actionable recommendations for each gap',
          'Consider iteration history and improvement trajectory',
          'Balance thoroughness with practical delivery constraints',
          'Focus on gaps that matter for phase convergence'
        ],
        context: {
          phase: inputs.phase,
          currentDeliverable: inputs.deliverable,
          expectedOutcomes: inputs.expectedOutcomes,
          qualityDimensions: inputs.qualityDimensions,
          iteration: inputs.iteration,
          projectContext: inputs.context
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['gap-analysis', 'quality-assessment', 'improvement-identification']
    };
  }
});

/**
 * Task: Cross-Phase Gap Analysis
 * Purpose: Top-down analysis of gaps between phases and real world
 */
const crossPhaseGapAnalysisTask = defineTask({
  name: 'cross-phase-gap-analysis',
  description: 'Comprehensive top-down gap analysis across all phases against real world',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    targetQuality: { type: 'number', default: 85 },
    realWorldContext: { type: 'object', required: true },
    gapTypes: { type: 'array', required: true },
    iteration: { type: 'number', default: 0 }
  },

  outputs: {
    significantGaps: { type: 'array' },
    gapsByType: { type: 'object' },
    crossPhaseInconsistencies: { type: 'array' },
    realWorldMisalignments: { type: 'array' },
    cascadeEffects: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Cross-Phase Gap Analysis: ${inputs.projectName} (Debt Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'cross-phase-gap-analyst',
        goal: `Identify gaps between phases and against real-world context for ${inputs.projectName}`,
        instructions: [
          '1. REAL WORLD vs GRAPH & SCHEMA: Compare current results against latest real-world information',
          '   - Check for new market trends, competitor moves, regulatory changes',
          '   - Verify technology updates, security vulnerabilities, platform changes',
          '   - Analyze user feedback, analytics data, performance metrics',
          '   - Identify gaps between solution model and current reality',
          '2. GRAPH vs DOCUMENTATION: Verify knowledge graph aligns with generated documentation',
          '   - Check traceability from graph to requirements, specs, architecture docs',
          '   - Identify missing documentation of graph concepts',
          '   - Find inconsistencies between graph structure and documented design',
          '3. QUALITY PROCESS vs DOCS: Verify testing and delivery processes match documentation',
          '   - Check test coverage aligns with documented requirements',
          '   - Verify CI/CD processes match architecture specifications',
          '   - Identify gaps in quality assurance documentation',
          '4. GENERATORS vs DOCS: Verify generators produce outputs consistent with documentation',
          '   - Check generated code matches architectural specifications',
          '   - Verify generated APIs align with documented interfaces',
          '   - Identify inconsistencies in generated vs specified behavior',
          '5. SDK vs DOCS & ABOVE: Verify SDK consistency with documentation and upstream artifacts',
          '   - Check SDK APIs match documented interfaces',
          '   - Verify SDK behavior aligns with generated code and architecture',
          '   - Identify missing SDK features documented in requirements',
          '6. INTERFACES vs SDK & EVERYTHING: Verify programmable interfaces align with SDK and all upstream',
          '   - Check API consistency with SDK and documentation',
          '   - Verify MCP/CLI interfaces match architectural specifications',
          '   - Identify gaps between programmatic and documented interfaces',
          '7. UI vs EVERYTHING: Verify user interfaces align with all upstream artifacts',
          '   - Check UI consistency with SDK, APIs, and documentation',
          '   - Verify user experience matches documented requirements',
          '   - Identify usability gaps against original user needs',
          'For each gap type, identify:',
          '- Specific inconsistencies and missing elements',
          '- Severity and impact on overall solution quality',
          '- Cascade effects that could impact multiple phases',
          '- Root causes and recommended resolution approaches',
          'Prioritize gaps by business impact and technical risk',
          'Consider stakeholder perspectives and change management implications',
          'Focus on gaps that could cause real-world implementation failures'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          targetQuality: inputs.targetQuality,
          realWorldContext: inputs.realWorldContext,
          gapTypes: inputs.gapTypes,
          iteration: inputs.iteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['cross-phase-gap-analysis', 'debt-driven-development', 'real-world-alignment']
    };
  }
});

/**
 * Task: Gap Prioritization
 * Purpose: Prioritize identified gaps by impact and cascade effects
 */
const gapPrioritizationTask = defineTask({
  name: 'gap-prioritization',
  description: 'Prioritize gaps by business impact, technical risk, and cascade effects',

  inputs: {
    gaps: { type: 'array', required: true },
    allResults: { type: 'object', required: true },
    projectContext: { type: 'object', required: true },
    iteration: { type: 'number', default: 0 }
  },

  outputs: {
    prioritizedGaps: { type: 'array' },
    impactAnalysis: { type: 'object' },
    cascadeEffects: { type: 'object' },
    resolutionPlan: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Gap Prioritization (Debt Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'gap-prioritization-analyst',
        goal: 'Prioritize gaps by business impact, technical risk, and cascade effects',
        instructions: [
          'Analyze each gap for business impact: revenue effect, customer satisfaction, competitive advantage',
          'Assess technical risk: system stability, security vulnerabilities, maintainability',
          'Evaluate cascade effects: how fixing this gap affects other phases and deliverables',
          'Consider implementation effort vs. benefit ratio',
          'Assess stakeholder urgency and regulatory compliance implications',
          'Prioritize using framework: Critical > High > Medium > Low',
          'Critical: Blocking deployment, security risk, legal compliance issue',
          'High: Major business impact, significant technical debt, user experience degradation',
          'Medium: Moderate impact, optimization opportunities, nice-to-have features',
          'Low: Minor improvements, cosmetic issues, future enhancements',
          'For each gap, provide:',
          '- Priority level with clear justification',
          '- Affected phases and downstream impacts',
          '- Estimated effort and complexity',
          '- Dependencies and prerequisites',
          '- Risk of not addressing the gap',
          'Create resolution plan with optimal sequencing',
          'Consider resource constraints and timeline pressures',
          'Balance perfectionism with practical delivery needs'
        ],
        context: {
          gaps: inputs.gaps,
          allResults: inputs.allResults,
          projectContext: inputs.projectContext,
          iteration: inputs.iteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['gap-prioritization', 'impact-analysis', 'resolution-planning']
    };
  }
});

/**
 * Task: Gap Resolution
 * Purpose: Resolve specific identified gaps and update affected phases
 */
const gapResolutionTask = defineTask({
  name: 'gap-resolution',
  description: 'Resolve specific gap and update affected phases accordingly',

  inputs: {
    gap: { type: 'object', required: true },
    allResults: { type: 'object', required: true },
    targetQuality: { type: 'number', default: 85 },
    affectedPhases: { type: 'array', required: true },
    iteration: { type: 'number', default: 0 }
  },

  outputs: {
    updatedResults: { type: 'object' },
    resolutionActions: { type: 'array' },
    affectedArtifacts: { type: 'array' },
    validationResults: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Gap Resolution: ${inputs.gap.description} (Debt Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'gap-resolution-specialist',
        goal: `Resolve gap: ${inputs.gap.description} and update affected phases`,
        instructions: [
          'Analyze the specific gap and its root causes',
          'Determine optimal resolution approach considering affected phases',
          'Update affected phase deliverables to address the gap',
          'Ensure resolution maintains consistency across all phases',
          'Validate that resolution does not introduce new gaps',
          'Update documentation, code, tests, and other artifacts as needed',
          'Verify resolution against original requirements and constraints',
          'Check for side effects or unintended consequences',
          'Ensure stakeholder alignment with proposed resolution',
          'Update traceability links and cross-references',
          'Validate resolution effectiveness through appropriate testing',
          'Document resolution rationale and implementation details',
          'Consider impact on project timeline and resources',
          'Ensure resolution aligns with overall project goals and quality targets',
          'Provide clear evidence that gap has been resolved',
          'Update affected phase results with resolution changes'
        ],
        context: {
          gap: inputs.gap,
          allResults: inputs.allResults,
          targetQuality: inputs.targetQuality,
          affectedPhases: inputs.affectedPhases,
          iteration: inputs.iteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['gap-resolution', 'phase-updates', 'consistency-maintenance']
    };
  }
});

/**
 * Task: Gap Resolution Verification
 * Purpose: Verify that gap resolutions are effective and complete
 */
const gapResolutionVerificationTask = defineTask({
  name: 'gap-resolution-verification',
  description: 'Verify effectiveness and completeness of gap resolutions',

  inputs: {
    originalGaps: { type: 'array', required: true },
    allResults: { type: 'object', required: true },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 }
  },

  outputs: {
    resolvedGaps: { type: 'array' },
    remainingGaps: { type: 'array' },
    remainingCriticalGaps: { type: 'number' },
    verificationResults: { type: 'object' },
    qualityImprovement: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Gap Resolution Verification (Debt Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'gap-verification-specialist',
        goal: 'Verify effectiveness and completeness of gap resolutions',
        instructions: [
          'Re-examine each original gap to determine resolution status',
          'Verify that resolved gaps are truly addressed in updated results',
          'Check for any gaps that were only partially resolved',
          'Identify any new gaps introduced during resolution process',
          'Assess overall quality improvement from gap resolution',
          'Verify consistency maintained across all phases after resolutions',
          'Check that resolutions align with original requirements and goals',
          'Validate that stakeholder needs are still met after changes',
          'Ensure no regression in previously working functionality',
          'Assess whether remaining gaps are acceptable for deployment',
          'Count critical vs. non-critical remaining gaps',
          'Determine if additional debt-driven iterations are needed',
          'Provide evidence-based assessment of resolution effectiveness',
          'Document lessons learned from gap resolution process',
          'Recommend next steps: continue iterating vs. proceed to deployment',
          'Balance perfectionism with practical delivery constraints'
        ],
        context: {
          originalGaps: inputs.originalGaps,
          allResults: inputs.allResults,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['gap-verification', 'resolution-effectiveness', 'quality-validation']
    };
  }
});

/**
 * Task: Empirical Schema Validation
 * Purpose: Test schema adequacy through actual data population and usage
 */
const empiricalSchemaValidationTask = defineTask({
  name: 'empirical-schema-validation',
  description: 'Validate schema through empirical data population and performance testing',

  inputs: {
    projectName: { type: 'string', required: true },
    integratedOntology: { type: 'object', required: true },
    schema: { type: 'object', required: true },
    worldOntology: { type: 'object', required: true },
    problemOntology: { type: 'object', required: true },
    solutionOntology: { type: 'object', required: true },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    schemaAdequacy: { type: 'object' },
    populationIssues: { type: 'array' },
    performanceScore: { type: 'number' },
    dataQualityMetrics: { type: 'object' },
    usabilityAssessment: { type: 'object' },
    scalabilityAnalysis: { type: 'object' },
    learnings: { type: 'array' },
    optimizationOpportunities: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Empirical Schema Validation: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'empirical-validation-specialist',
        goal: `Validate schema adequacy through real data population and usage testing for ${inputs.projectName}`,
        instructions: [
          '=== EMPIRICAL VALIDATION METHODOLOGY ===',
          'Apply systematic empirical testing framework:',
          '- DATA POPULATION TESTING: Attempt to populate schema with real/representative data',
          '- PERFORMANCE BENCHMARKING: Measure query performance, storage efficiency, processing speed',
          '- USABILITY ASSESSMENT: Test schema usability from developer and user perspectives',
          '- SCALABILITY VALIDATION: Test schema behavior under varying data volumes and complexity',
          '- SEMANTIC CONSISTENCY: Verify semantic integrity during data population',

          '=== COMPREHENSIVE DATA POPULATION ANALYSIS ===',
          '1. REAL DATA INTEGRATION TESTING',
          '   - Collect representative data samples from all identified sources',
          '   - Attempt systematic data mapping to schema structures',
          '   - Identify data that doesn\'t fit schema patterns',
          '   - Document transformation complexity and data loss',
          '   - Test data quality preservation during population',

          '2. SCHEMA ADEQUACY ASSESSMENT',
          '   - Measure coverage: what percentage of real data fits schema?',
          '   - Identify missing schema elements needed for complete representation',
          '   - Find over-engineered schema parts with no corresponding data',
          '   - Assess schema flexibility for data variations and edge cases',
          '   - Evaluate schema expressiveness for domain concepts',

          '3. PERFORMANCE EMPIRICAL TESTING',
          '   - Benchmark query performance against realistic use cases',
          '   - Measure storage efficiency and index effectiveness',
          '   - Test concurrent access patterns and locking behavior',
          '   - Evaluate memory usage under different data loads',
          '   - Assess network performance for distributed scenarios',

          '=== SYSTEMATIC ISSUE IDENTIFICATION ===',
          '1. STRUCTURAL ISSUES',
          '   - Identify schema elements that cause population difficulties',
          '   - Find relationship modeling that doesn\'t match real data patterns',
          '   - Detect normalization issues (over/under-normalized structures)',
          '   - Identify constraint violations in real data scenarios',
          '   - Find abstraction level mismatches with actual data granularity',

          '2. SEMANTIC ISSUES',
          '   - Detect concept definitions that don\'t align with real usage',
          '   - Find relationship semantics that don\'t match domain reality',
          '   - Identify missing semantic nuances revealed by real data',
          '   - Detect semantic inconsistencies across integrated ontologies',
          '   - Find terminology mismatches with actual domain usage',

          '3. PERFORMANCE ISSUES',
          '   - Identify query patterns that perform poorly',
          '   - Find schema structures that cause indexing problems',
          '   - Detect memory usage issues with complex object graphs',
          '   - Identify serialization/deserialization bottlenecks',
          '   - Find concurrent access patterns that cause conflicts',

          '=== LEARNING EXTRACTION & OPTIMIZATION IDENTIFICATION ===',
          '1. SYSTEMATIC LEARNING CAPTURE',
          '   - Document all discrepancies between expected and actual behavior',
          '   - Capture performance benchmarks against expectations',
          '   - Record user feedback and usability pain points',
          '   - Document workarounds and adaptations needed',
          '   - Extract patterns from multiple data source integration attempts',

          '2. OPTIMIZATION OPPORTUNITY ANALYSIS',
          '   - Identify schema simplifications that would improve usability',
          '   - Find performance optimizations through structural changes',
          '   - Detect modeling improvements based on real data patterns',
          '   - Identify missing abstractions revealed by usage patterns',
          '   - Find redundancy elimination opportunities',

          '=== RETROSPECTIVE ANALYSIS FRAMEWORK ===',
          'Critical questions for schema improvement:',
          '- What assumptions about data structure proved incorrect?',
          '- Which modeling decisions created unnecessary complexity?',
          '- Where does the schema force unnatural data transformations?',
          '- What performance characteristics were worse than expected?',
          '- How could schema better support actual usage patterns?',
          '- What semantic gaps became apparent through real data population?',
          '- Which integration points proved more difficult than anticipated?',

          '=== QUANTITATIVE ASSESSMENT ===',
          'Measure schema effectiveness:',
          '- DATA FIT PERCENTAGE: How much real data fits without transformation?',
          '- POPULATION EFFICIENCY: Time/effort required for data population',
          '- QUERY PERFORMANCE RATIO: Actual vs. expected query performance',
          '- USABILITY SCORE: Developer productivity and satisfaction metrics',
          '- SEMANTIC ACCURACY: Correctness of represented domain knowledge',
          '- SCALABILITY INDEX: Performance degradation under increased load'
        ],
        context: {
          projectName: inputs.projectName,
          integratedOntology: inputs.integratedOntology,
          schema: inputs.schema,
          ontologies: {
            world: inputs.worldOntology,
            problem: inputs.problemOntology,
            solution: inputs.solutionOntology
          },
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['empirical-validation', 'data-population', 'performance-testing', 'schema-adequacy']
    };
  }
});

/**
 * Task: Retrospective Optimization
 * Purpose: Optimize schema and modeling based on empirical learnings
 */
const retrospectiveOptimizationTask = defineTask({
  name: 'retrospective-optimization',
  description: 'Optimize schema and ontology modeling based on empirical validation learnings',

  inputs: {
    projectName: { type: 'string', required: true },
    currentSchema: { type: 'object', required: true },
    currentOntology: { type: 'object', required: true },
    empiricalValidation: { type: 'object', required: true },
    populationLearnings: { type: 'array', required: true },
    optimizationIteration: { type: 'number', default: 0 },
    previousOptimizations: { type: 'array', default: [] },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null }
  },

  outputs: {
    optimizedSchema: { type: 'object' },
    optimizedOntology: { type: 'object' },
    optimizationActions: { type: 'array' },
    improvementSummary: { type: 'object' },
    rationale: { type: 'object' },
    riskAssessment: { type: 'object' },
    expectedImprovements: { type: 'object' },
    migrationStrategy: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Retrospective Optimization: ${inputs.projectName} (Opt ${inputs.optimizationIteration + 1}, Iter ${inputs.iteration + 1})`,
      agent: {
        role: 'schema-optimization-architect',
        goal: `Optimize schema and ontology based on empirical validation learnings for ${inputs.projectName}`,
        instructions: [
          '=== SYSTEMATIC OPTIMIZATION FRAMEWORK ===',
          'Apply evidence-based optimization methodology:',
          '- ISSUE PRIORITIZATION: Rank empirical issues by impact and effort',
          '- OPTIMIZATION STRATEGY: Develop systematic improvement approach',
          '- STRUCTURAL REFINEMENT: Optimize schema structure based on learnings',
          '- SEMANTIC ENHANCEMENT: Improve semantic accuracy and expressiveness',
          '- PERFORMANCE OPTIMIZATION: Address performance bottlenecks systematically',

          '=== EMPIRICAL LEARNING ANALYSIS ===',
          '1. SYSTEMATIC ISSUE CATEGORIZATION',
          '   - CRITICAL ISSUES: Schema inadequacies that prevent core functionality',
          '   - PERFORMANCE ISSUES: Structure problems causing unacceptable performance',
          '   - USABILITY ISSUES: Schema complexity that impedes development productivity',
          '   - SEMANTIC ISSUES: Modeling inaccuracies revealed by real data',
          '   - SCALABILITY ISSUES: Structure problems that limit growth potential',

          '2. ROOT CAUSE ANALYSIS FOR OPTIMIZATION',
          '   - Why did certain schema elements fail to accommodate real data?',
          '   - What modeling assumptions proved incorrect through empirical testing?',
          '   - Which design decisions created unnecessary complexity or constraints?',
          '   - How did integration challenges reveal ontology integration issues?',
          '   - What performance characteristics indicate structural inefficiencies?',

          '3. OPTIMIZATION OPPORTUNITY IDENTIFICATION',
          '   - SIMPLIFICATION OPPORTUNITIES: Over-engineered elements to streamline',
          '   - ABSTRACTION IMPROVEMENTS: Better abstractions for real usage patterns',
          '   - RELATIONSHIP REFINEMENTS: More accurate relationship modeling',
          '   - CONSTRAINT ADJUSTMENTS: Constraints that better match real data patterns',
          '   - INDEXING OPTIMIZATIONS: Schema changes to improve query performance',

          '=== SYSTEMATIC SCHEMA OPTIMIZATION ===',
          '1. STRUCTURAL OPTIMIZATION',
          '   - Normalize/denormalize based on empirical usage patterns',
          '   - Simplify over-complex hierarchies that don\'t match real data',
          '   - Optimize relationship structures for query performance',
          '   - Eliminate redundancies discovered through data population',
          '   - Add missing structures needed for real data representation',

          '2. SEMANTIC OPTIMIZATION',
          '   - Refine concept definitions based on real usage evidence',
          '   - Improve relationship semantics for real-world accuracy',
          '   - Add semantic nuances revealed by empirical testing',
          '   - Resolve semantic conflicts discovered during integration',
          '   - Enhance terminology alignment with actual domain usage',

          '3. PERFORMANCE OPTIMIZATION',
          '   - Restructure schema for optimal query patterns',
          '   - Optimize data types for storage and processing efficiency',
          '   - Improve indexing strategies based on access patterns',
          '   - Eliminate performance bottlenecks through structural changes',
          '   - Optimize for concurrent access patterns',

          '=== ADVANCED OPTIMIZATION TECHNIQUES ===',
          '1. PATTERN-BASED OPTIMIZATION',
          '   - Apply proven schema design patterns for identified issues',
          '   - Use domain-specific optimization patterns',
          '   - Implement performance patterns for identified bottlenecks',
          '   - Apply modularity patterns for better maintainability',
          '   - Use versioning patterns for schema evolution',

          '2. DATA-DRIVEN OPTIMIZATION',
          '   - Analyze data distribution patterns for optimization',
          '   - Use query frequency analysis for indexing decisions',
          '   - Apply statistical analysis of data characteristics',
          '   - Use machine learning for pattern recognition in optimization',
          '   - Implement A/B testing for optimization validation',

          '3. HOLISTIC SYSTEM OPTIMIZATION',
          '   - Optimize for end-to-end system performance',
          '   - Balance schema complexity with implementation simplicity',
          '   - Optimize for maintainability and evolution',
          '   - Consider ecosystem integration optimization',
          '   - Balance semantic richness with practical usability',

          '=== OPTIMIZATION VALIDATION & RISK MANAGEMENT ===',
          '1. OPTIMIZATION IMPACT ASSESSMENT',
          '   - Model expected performance improvements',
          '   - Assess usability improvements for developers',
          '   - Evaluate semantic accuracy improvements',
          '   - Predict scalability enhancements',
          '   - Estimate maintenance burden changes',

          '2. RISK ASSESSMENT & MITIGATION',
          '   - Identify risks of proposed schema changes',
          '   - Assess backward compatibility implications',
          '   - Evaluate migration complexity and risks',
          '   - Consider impact on existing integrations',
          '   - Plan rollback strategies for failed optimizations',

          '=== ITERATIVE OPTIMIZATION STRATEGY ===',
          'Systematic improvement approach:',
          '- Focus on highest-impact, lowest-risk optimizations first',
          '- Implement optimizations incrementally with validation',
          '- Learn from each optimization iteration to improve methodology',
          '- Build optimization confidence through empirical validation',
          '- Prepare for multiple optimization cycles until convergence'
        ],
        context: {
          projectName: inputs.projectName,
          currentSchema: inputs.currentSchema,
          currentOntology: inputs.currentOntology,
          empiricalValidation: inputs.empiricalValidation,
          populationLearnings: inputs.populationLearnings,
          optimizationIteration: inputs.optimizationIteration,
          previousOptimizations: inputs.previousOptimizations,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['schema-optimization', 'retrospective-analysis', 'performance-optimization', 'structural-refinement']
    };
  }
});

/**
 * Task: Revalidate Optimized Schema
 * Purpose: Validate optimized schema through re-testing
 */
const revalidateOptimizedSchemaTask = defineTask({
  name: 'revalidate-optimized-schema',
  description: 'Revalidate optimized schema through empirical retesting',

  inputs: {
    projectName: { type: 'string', required: true },
    optimizedSchema: { type: 'object', required: true },
    optimizedOntology: { type: 'object', required: true },
    originalValidation: { type: 'object', required: true },
    optimizationIteration: { type: 'number', default: 0 }
  },

  outputs: {
    qualityMetrics: { type: 'object' },
    improvementAnalysis: { type: 'object' },
    remainingIssues: { type: 'array' },
    performanceComparison: { type: 'object' },
    validationResults: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Schema Revalidation: ${inputs.projectName} (Optimization ${inputs.optimizationIteration + 1})`,
      agent: {
        role: 'schema-revalidation-specialist',
        goal: `Revalidate optimized schema and measure improvements for ${inputs.projectName}`,
        instructions: [
          'Re-run comprehensive empirical validation on optimized schema',
          'Compare performance metrics against original validation results',
          'Identify improvements achieved through optimization',
          'Document remaining issues that need further optimization',
          'Assess overall quality improvement trajectory',
          'Validate that optimizations didn\'t introduce new issues',
          'Measure schema adequacy improvements',
          'Test data population efficiency improvements',
          'Evaluate usability enhancements',
          'Assess semantic accuracy improvements'
        ],
        context: {
          projectName: inputs.projectName,
          optimizedSchema: inputs.optimizedSchema,
          optimizedOntology: inputs.optimizedOntology,
          originalValidation: inputs.originalValidation,
          optimizationIteration: inputs.optimizationIteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['schema-revalidation', 'improvement-measurement', 'optimization-validation']
    };
  }
});

/**
 * Task: Schema Convergence Assessment
 * Purpose: Assess whether schema has converged to optimal state
 */
const schemaConvergenceAssessmentTask = defineTask({
  name: 'schema-convergence-assessment',
  description: 'Assess schema optimization convergence and determine if further iteration needed',

  inputs: {
    projectName: { type: 'string', required: true },
    optimizationHistory: { type: 'array', required: true },
    currentQuality: { type: 'object', required: true },
    targetQuality: { type: 'number', default: 85 },
    optimizationIteration: { type: 'number', default: 0 }
  },

  outputs: {
    hasConverged: { type: 'boolean' },
    convergenceReason: { type: 'string' },
    currentQuality: { type: 'number' },
    previousQuality: { type: 'number' },
    improvementRate: { type: 'number' },
    remainingIssues: { type: 'number' },
    recommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Schema Convergence Assessment: ${inputs.projectName} (Optimization ${inputs.optimizationIteration + 1})`,
      agent: {
        role: 'convergence-assessment-specialist',
        goal: `Assess schema optimization convergence for ${inputs.projectName}`,
        instructions: [
          'Analyze optimization trajectory and improvement rate',
          'Assess whether target quality has been achieved',
          'Evaluate diminishing returns in optimization iterations',
          'Determine if remaining issues justify further optimization',
          'Consider cost-benefit of additional optimization efforts',
          'Assess schema stability and maturity',
          'Evaluate whether schema is suitable for production use',
          'Make convergence decision based on quality, effort, and business needs'
        ],
        context: {
          projectName: inputs.projectName,
          optimizationHistory: inputs.optimizationHistory,
          currentQuality: inputs.currentQuality,
          targetQuality: inputs.targetQuality,
          optimizationIteration: inputs.optimizationIteration
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['convergence-assessment', 'optimization-completion', 'quality-analysis']
    };
  }
});

/**
 * Task: Perfect Graph Construction
 * Purpose: Construct perfect knowledge graph with optimized schema
 */
const perfectGraphConstructionTask = defineTask({
  name: 'perfect-graph-construction',
  description: 'Construct comprehensive perfect knowledge graph using optimized schema',

  inputs: {
    projectName: { type: 'string', required: true },
    optimizedSchema: { type: 'object', required: true },
    optimizedOntology: { type: 'object', required: true },
    empiricalValidation: { type: 'object', required: true },
    optimizationLearnings: { type: 'array', required: true },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    knowledgeGraph: { type: 'object' },
    completenessScore: { type: 'number' },
    semanticRichness: { type: 'number' },
    queryPerformance: { type: 'number' },
    graphStatistics: { type: 'object' },
    populationMetrics: { type: 'object' },
    qualityAssessment: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Perfect Graph Construction: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'perfect-graph-architect',
        goal: `Construct perfect knowledge graph using optimized schema for ${inputs.projectName}`,
        instructions: [
          '=== PERFECT GRAPH CONSTRUCTION METHODOLOGY ===',
          'Build comprehensive, high-quality knowledge graph:',
          '- COMPREHENSIVE POPULATION: Populate all schema elements with validated data',
          '- SEMANTIC RICHNESS: Maximize semantic expressiveness and relationship depth',
          '- QUALITY OPTIMIZATION: Ensure highest data quality and consistency',
          '- PERFORMANCE OPTIMIZATION: Build for optimal query and reasoning performance',
          '- VALIDATION INTEGRATION: Incorporate all empirical learnings and optimizations',

          '=== SYSTEMATIC GRAPH CONSTRUCTION ===',
          '1. COMPREHENSIVE DATA POPULATION',
          '   - Use optimized schema to guide systematic data collection',
          '   - Apply empirical learnings to ensure high-quality population',
          '   - Implement validation rules based on optimization insights',
          '   - Use automated quality checking during population',
          '   - Ensure complete coverage of all schema elements',

          '2. SEMANTIC RICHNESS MAXIMIZATION',
          '   - Populate all relationship types with validated instances',
          '   - Add semantic annotations and metadata comprehensively',
          '   - Implement reasoning rules based on ontology specifications',
          '   - Add contextual information for enhanced semantic understanding',
          '   - Ensure semantic consistency across all graph elements',

          '3. PERFORMANCE OPTIMIZATION IMPLEMENTATION',
          '   - Implement optimized indexing strategies from empirical learnings',
          '   - Use graph structure optimizations for query performance',
          '   - Apply caching strategies for frequently accessed patterns',
          '   - Implement efficient storage and retrieval mechanisms',
          '   - Optimize for concurrent access and scaling requirements',

          '=== COMPREHENSIVE QUALITY ASSURANCE ===',
          'Apply rigorous quality control throughout construction:',
          '- COMPLETENESS VALIDATION: Ensure all required elements are populated',
          '- CONSISTENCY CHECKING: Validate logical consistency across graph',
          '- ACCURACY VERIFICATION: Cross-validate all factual claims',
          '- PERFORMANCE TESTING: Validate query performance meets requirements',
          '- SEMANTIC VALIDATION: Ensure semantic integrity and expressiveness',

          '=== ITERATIVE REFINEMENT FOR PERFECTION ===',
          'Continuous improvement approach:',
          '- QUALITY MONITORING: Continuous monitoring of graph quality metrics',
          '- PERFORMANCE BENCHMARKING: Regular performance assessment',
          '- COMPLETENESS TRACKING: Systematic tracking of population completeness',
          '- SEMANTIC ANALYSIS: Deep analysis of semantic richness and accuracy',
          '- OPTIMIZATION ITERATION: Continuous refinement based on usage patterns'
        ],
        context: {
          projectName: inputs.projectName,
          optimizedSchema: inputs.optimizedSchema,
          optimizedOntology: inputs.optimizedOntology,
          empiricalValidation: inputs.empiricalValidation,
          optimizationLearnings: inputs.optimizationLearnings,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['perfect-graph', 'knowledge-construction', 'semantic-richness', 'performance-optimization']
    };
  }
});

/**
 * Task: Comprehensive Validation & Verification
 * Purpose: Rigorous validation through systematic agent-based analysis
 */
const comprehensiveValidationTask = defineTask({
  name: 'comprehensive-validation',
  description: 'Comprehensive validation and verification through systematic agent analysis',

  inputs: {
    projectName: { type: 'string', required: true },
    perfectGraph: { type: 'object', required: true },
    optimizedSchema: { type: 'object', required: true },
    optimizedOntology: { type: 'object', required: true },
    empiricalHistory: { type: 'object', required: true },
    optimizationHistory: { type: 'array', required: true },
    allResults: { type: 'object', required: true },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    validationCoverage: { type: 'number' },
    consistencyScore: { type: 'number' },
    stakeholderValidationScore: { type: 'number' },
    validationReport: { type: 'object' },
    consistencyAnalysis: { type: 'object' },
    verificationResults: { type: 'object' },
    issuesFound: { type: 'array' },
    recommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Comprehensive Validation: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'validation-verification-specialist',
        goal: `Conduct comprehensive validation and verification of ontology and knowledge graph for ${inputs.projectName}`,
        instructions: [
          '=== SYSTEMATIC VALIDATION FRAMEWORK ===',
          'Apply comprehensive multi-dimensional validation:',
          '- LOGICAL CONSISTENCY: Verify logical coherence across all ontology components',
          '- SEMANTIC ACCURACY: Validate semantic relationships and concept definitions',
          '- STAKEHOLDER VALIDATION: Systematic validation with all stakeholder groups',
          '- EMPIRICAL VERIFICATION: Test against real-world data and usage scenarios',
          '- COMPLETENESS ASSESSMENT: Verify coverage of all required domain aspects',

          '=== LOGICAL CONSISTENCY VERIFICATION ===',
          '1. STRUCTURAL CONSISTENCY ANALYSIS',
          '   - Check for circular dependencies and logical contradictions',
          '   - Verify hierarchical relationships for consistency',
          '   - Validate constraint satisfaction across all ontology rules',
          '   - Check for missing or incomplete logical connections',
          '   - Verify subsumption relationships and class hierarchies',

          '2. SEMANTIC RELATIONSHIP VALIDATION',
          '   - Validate all semantic relationships for logical coherence',
          '   - Check relationship cardinalities and domain/range specifications',
          '   - Verify inverse relationship consistency',
          '   - Validate transitive and symmetric relationship properties',
          '   - Check for conflicting or contradictory semantic assertions',

          '3. RULE AND CONSTRAINT VERIFICATION',
          '   - Validate all business rules against domain requirements',
          '   - Check constraint satisfaction across all data instances',
          '   - Verify integrity constraints and validation rules',
          '   - Test exception handling and edge case scenarios',
          '   - Validate temporal and conditional constraint logic',

          '=== COMPREHENSIVE STAKEHOLDER VALIDATION ===',
          '1. DOMAIN EXPERT VALIDATION',
          '   - Systematic review with subject matter experts',
          '   - Validate concept definitions against domain knowledge',
          '   - Check terminology accuracy and appropriateness',
          '   - Verify relationship semantics match domain understanding',
          '   - Validate completeness of domain coverage',

          '2. END USER VALIDATION',
          '   - Test ontology usability with intended users',
          '   - Validate user interface and interaction patterns',
          '   - Check accessibility and ease of understanding',
          '   - Test user workflows and task completion',
          '   - Gather user feedback on practical utility',

          '3. TECHNICAL STAKEHOLDER VALIDATION',
          '   - Review with developers and system architects',
          '   - Validate implementation feasibility and complexity',
          '   - Check integration requirements and constraints',
          '   - Verify performance and scalability characteristics',
          '   - Validate maintenance and evolution requirements',

          '=== EMPIRICAL VERIFICATION TESTING ===',
          '1. REAL-WORLD DATA VALIDATION',
          '   - Test ontology against actual domain data samples',
          '   - Validate data mapping and transformation accuracy',
          '   - Check for data loss or distortion during population',
          '   - Verify query accuracy and result completeness',
          '   - Test data quality preservation and enhancement',

          '2. USE CASE SCENARIO TESTING',
          '   - Validate ontology against all defined use cases',
          '   - Test query patterns and information retrieval',
          '   - Verify decision support and reasoning capabilities',
          '   - Check integration with existing workflows',
          '   - Test exception handling and error scenarios',

          '3. PERFORMANCE AND SCALABILITY VALIDATION',
          '   - Test query performance under realistic data volumes',
          '   - Validate system behavior under concurrent usage',
          '   - Check memory usage and storage efficiency',
          '   - Test network performance for distributed scenarios',
          '   - Validate backup and recovery procedures',

          '=== COMPLETENESS AND COVERAGE ASSESSMENT ===',
          '1. DOMAIN COVERAGE ANALYSIS',
          '   - Map ontology coverage against domain requirements',
          '   - Identify gaps in concept or relationship coverage',
          '   - Verify alignment with business goals and user needs',
          '   - Check coverage of edge cases and exceptional scenarios',
          '   - Validate regulatory and compliance requirement coverage',

          '2. FUNCTIONAL COMPLETENESS VERIFICATION',
          '   - Verify all required functionalities are supported',
          '   - Check integration completeness with external systems',
          '   - Validate all user workflows and processes',
          '   - Test all specified quality attributes',
          '   - Verify traceability completeness from requirements to implementation',

          '3. QUALITY COMPLETENESS VALIDATION',
          '   - Assess completeness of quality assurance processes',
          '   - Verify all validation criteria have been met',
          '   - Check completeness of documentation and artifacts',
          '   - Validate training and support material completeness',
          '   - Verify change management process completeness'
        ],
        context: {
          projectName: inputs.projectName,
          perfectGraph: inputs.perfectGraph,
          optimizedSchema: inputs.optimizedSchema,
          optimizedOntology: inputs.optimizedOntology,
          empiricalHistory: inputs.empiricalHistory,
          optimizationHistory: inputs.optimizationHistory,
          allResults: inputs.allResults,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['comprehensive-validation', 'stakeholder-verification', 'empirical-testing', 'consistency-checking']
    };
  }
});

/**
 * Task: Stress Testing & Robustness Analysis
 * Purpose: Comprehensive stress testing and robustness validation
 */
const stressTestingRobustnessTask = defineTask({
  name: 'stress-testing-robustness',
  description: 'Comprehensive stress testing and robustness analysis through systematic scenarios',

  inputs: {
    projectName: { type: 'string', required: true },
    perfectGraph: { type: 'object', required: true },
    comprehensiveValidation: { type: 'object', required: true },
    stakeholderContext: { type: 'string', required: true },
    domainType: { type: 'string', required: true },
    projectComplexity: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    stressTestResults: { type: 'object' },
    testCoverage: { type: 'number' },
    robustnessScore: { type: 'number' },
    failureScenarios: { type: 'array' },
    vulnerabilities: { type: 'array' },
    performanceUnderStress: { type: 'object' },
    recoveryCapability: { type: 'object' },
    recommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Stress Testing & Robustness: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'stress-testing-specialist',
        goal: `Conduct comprehensive stress testing and robustness analysis for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE STRESS TESTING FRAMEWORK ===',
          'Test ontology and knowledge graph robustness through systematic scenarios:',
          '- EXTREME LOAD TESTING: Test behavior under maximum expected loads',
          '- FAILURE MODE ANALYSIS: Systematic identification of potential failure points',
          '- EDGE CASE VALIDATION: Test handling of unusual and boundary conditions',
          '- DEGRADED PERFORMANCE TESTING: Validate graceful degradation under stress',
          '- RECOVERY TESTING: Verify system recovery after failures or interruptions',

          '=== ADVANCED REAL-TIME ADAPTATION ===',
          '1. CONTINUOUS LEARNING SYSTEMS',
          '   - Stream processing for real-time data ingestion and learning',
          '   - Online machine learning for continuous model updates',
          '   - Adaptive algorithms that improve during operation',
          '   - Real-time pattern recognition and anomaly detection',
          '   - Dynamic knowledge graph updates based on new information',

          '2. INTELLIGENT SELF-OPTIMIZATION',
          '   - Automatic performance tuning based on usage patterns',
          '   - Dynamic resource allocation and scaling',
          '   - Self-optimizing query strategies and indexing',
          '   - Adaptive caching and prefetching based on access patterns',
          '   - Intelligent load balancing and distributed processing',

          '3. PREDICTIVE ADAPTATION SYSTEMS',
          '   - Anticipatory optimization based on trend analysis',
          '   - Proactive scaling and resource provisioning',
          '   - Predictive maintenance and issue prevention',
          '   - Future-state preparation and contingency activation',
          '   - Adaptive user interface optimization',

          '=== COLLABORATIVE INTELLIGENCE FRAMEWORK ===',
          '1. HUMAN-AI COLLABORATION PROTOCOLS',
          '   - Expert-AI partnership frameworks for domain knowledge integration',
          '   - Crowdsourced validation and improvement mechanisms',
          '   - Human-in-the-loop optimization and decision making',
          '   - Collective intelligence aggregation from multiple stakeholders',
          '   - Collaborative problem-solving and innovation systems',

          '2. STAKEHOLDER INTELLIGENCE INTEGRATION',
          '   - Multi-stakeholder feedback integration and conflict resolution',
          '   - Consensus building algorithms for collaborative decisions',
          '   - Stakeholder expertise matching and optimal collaboration',
          '   - Cultural intelligence for cross-cultural collaboration',
          '   - Collaborative learning from diverse perspectives',

          '3. DISTRIBUTED INTELLIGENCE NETWORKS',
          '   - Federated learning across multiple organizations',
          '   - Peer-to-peer knowledge sharing and validation',
          '   - Distributed consensus mechanisms for quality assurance',
          '   - Cross-organizational collaboration protocols',
          '   - Global intelligence network participation',

          '=== ECOSYSTEM INTEGRATION & INTEROPERABILITY ===',
          '1. SEMANTIC INTEROPERABILITY SYSTEMS',
          '   - Automatic ontology alignment and mapping',
          '   - Cross-standard translation and integration',
          '   - Semantic bridge generation for legacy systems',
          '   - Industry standard compliance and certification',
          '   - Ecosystem-wide semantic consistency maintenance',

          '2. ADAPTIVE INTEGRATION PROTOCOLS',
          '   - Dynamic API adaptation and versioning',
          '   - Self-configuring integration interfaces',
          '   - Automatic compatibility testing and validation',
          '   - Graceful degradation and failover mechanisms',
          '   - Adaptive security and privacy protection',

          '3. CO-EVOLUTION MANAGEMENT',
          '   - Coordinated evolution with ecosystem partners',
          '   - Impact prediction and change propagation',
          '   - Collaborative roadmap planning and synchronization',
          '   - Ecosystem health monitoring and optimization',
          '   - Mutual benefit optimization across stakeholders',

          '=== COGNITIVE AND PSYCHOLOGICAL OPTIMIZATION ===',
          '1. COGNITIVE LOAD OPTIMIZATION',
          '   - User interface adaptation based on cognitive capacity',
          '   - Information presentation optimization for comprehension',
          '   - Attention management and focus optimization',
          '   - Cognitive bias detection and mitigation',
          '   - Mental model alignment and validation',

          '2. PSYCHOLOGICAL USABILITY ENHANCEMENT',
          '   - Emotional state recognition and adaptation',
          '   - Motivation optimization and engagement enhancement',
          '   - Trust building and confidence improvement',
          '   - Stress reduction and anxiety mitigation',
          '   - Flow state facilitation and productivity optimization',

          '3. ADAPTIVE USER EXPERIENCE',
          '   - Personalized interaction patterns and preferences',
          '   - Context-aware interface adaptation',
          '   - Learning style accommodation and optimization',
          '   - Accessibility adaptation for diverse abilities',
          '   - Cultural sensitivity and localization',

          '=== AUTONOMOUS SYSTEM CAPABILITIES ===',
          '1. SELF-HEALING AND RESILIENCE',
          '   - Automatic error detection and correction',
          '   - Self-repair mechanisms for damaged components',
          '   - Fault tolerance and graceful degradation',
          '   - Recovery optimization and learning from failures',
          '   - Preventive maintenance and health monitoring',

          '2. INTELLIGENT RESOURCE MANAGEMENT',
          '   - Dynamic resource allocation and optimization',
          '   - Predictive scaling and capacity planning',
          '   - Energy efficiency optimization',
          '   - Cost optimization and resource utilization',
          '   - Performance-cost trade-off optimization',

          '3. AUTONOMOUS DECISION MAKING',
          '   - Intelligent decision trees for complex scenarios',
          '   - Risk-aware autonomous optimization',
          '   - Ethical decision making frameworks',
          '   - Stakeholder impact consideration in decisions',
          '   - Transparent and explainable autonomous actions'
        ],
        context: {
          projectName: inputs.projectName,
          perfectGraph: inputs.perfectGraph,
          aiOptimization: inputs.aiOptimization,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          projectComplexity: inputs.projectComplexity,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptive-systems', 'collaborative-intelligence', 'real-time-optimization', 'human-ai-collaboration']
    };
  }
});

/**
 * Task: Evolutionary Temporal Framework
 * Purpose: Long-term evolution and temporal cognition capabilities
 */
const evolutionaryTemporalFrameworkTask = defineTask({
  name: 'evolutionary-temporal-framework',
  description: 'Evolutionary framework with temporal cognition and future adaptation',

  inputs: {
    projectName: { type: 'string', required: true },
    perfectGraph: { type: 'object', required: true },
    adaptiveSystems: { type: 'object', required: true },
    aiOptimization: { type: 'object', required: true },
    allResults: { type: 'object', required: true },
    targetQuality: { type: 'number', default: 85 },
    iteration: { type: 'number', default: 0 },
    previousResult: { type: 'object', default: null },
    identifiedGaps: { type: 'array', default: [] }
  },

  outputs: {
    evolutionaryFramework: { type: 'object' },
    evolutionCapability: { type: 'number' },
    temporalCognition: { type: 'object' },
    temporalAwareness: { type: 'number' },
    cognitiveAlignment: { type: 'number' },
    futureAdaptability: { type: 'number' },
    generationalLearning: { type: 'object' },
    anticipatoryIntelligence: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Evolutionary Temporal Framework: ${inputs.projectName} (Iteration ${inputs.iteration + 1})`,
      agent: {
        role: 'evolutionary-framework-architect',
        goal: `Build evolutionary framework with temporal cognition for ${inputs.projectName}`,
        instructions: [
          '=== EVOLUTIONARY INTELLIGENCE FRAMEWORK ===',
          'Build systems that evolve and improve across generations:',
          '- GENERATIONAL LEARNING: Learn and improve across multiple generations',
          '- TEMPORAL COGNITION: Time-aware intelligence and decision making',
          '- ANTICIPATORY ADAPTATION: Preparation for predicted future states',
          '- COGNITIVE EVOLUTION: Evolution of reasoning and intelligence capabilities',
          '- CROSS-GENERATIONAL KNOWLEDGE: Preserve and build upon historical knowledge',

          '=== ADVANCED TEMPORAL COGNITION ===',
          '1. TIME-AWARE INTELLIGENCE SYSTEMS',
          '   - Temporal reasoning and time-sensitive decision making',
          '   - Historical pattern analysis and trend extrapolation',
          '   - Multi-timescale planning and optimization',
          '   - Temporal consistency maintenance across time',
          '   - Time-dependent knowledge representation and reasoning',

          '2. ANTICIPATORY INTELLIGENCE',
          '   - Future state prediction and preparation',
          '   - Anticipatory resource allocation and optimization',
          '   - Predictive adaptation and proactive change management',
          '   - Early warning systems and preventive measures',
          '   - Future scenario planning and contingency preparation',

          '3. TEMPORAL KNOWLEDGE MANAGEMENT',
          '   - Versioned knowledge with temporal validity',
          '   - Historical knowledge preservation and evolution tracking',
          '   - Time-aware query processing and retrieval',
          '   - Temporal data consistency and conflict resolution',
          '   - Cross-temporal knowledge integration and synthesis',

          '=== GENERATIONAL LEARNING & EVOLUTION ===',
          '1. CROSS-GENERATIONAL KNOWLEDGE TRANSFER',
          '   - Preserve valuable knowledge across system generations',
          '   - Learn from historical successes and failures',
          '   - Build upon previous generations\' achievements',
          '   - Avoid repeating past mistakes through learning',
          '   - Evolve understanding and capabilities over time',

          '2. EVOLUTIONARY OPTIMIZATION ALGORITHMS',
          '   - Genetic algorithms for ontology structure evolution',
          '   - Evolutionary strategies for parameter optimization',
          '   - Cultural evolution algorithms for knowledge propagation',
          '   - Multi-objective evolutionary optimization',
          '   - Co-evolutionary systems for ecosystem optimization',

          '3. ADAPTIVE GENOME REPRESENTATION',
          '   - Encode ontology structures as evolvable genomes',
          '   - Mutation operators for controlled variation',
          '   - Crossover mechanisms for knowledge recombination',
          '   - Selection pressures based on fitness criteria',
          '   - Speciation and niche formation for diverse solutions',

          '=== COGNITIVE ARCHITECTURE EVOLUTION ===',
          '1. REASONING CAPABILITY ENHANCEMENT',
          '   - Evolving reasoning strategies and heuristics',
          '   - Learning new inference patterns and rules',
          '   - Developing domain-specific reasoning expertise',
          '   - Improving reasoning efficiency and accuracy',
          '   - Meta-reasoning about reasoning processes',

          '2. KNOWLEDGE REPRESENTATION EVOLUTION',
          '   - Evolving knowledge structures and patterns',
          '   - Developing new abstraction levels and concepts',
          '   - Improving semantic richness and expressiveness',
          '   - Optimizing knowledge organization for efficiency',
          '   - Creating hybrid representation schemes',

          '3. LEARNING ALGORITHM EVOLUTION',
          '   - Self-modifying learning algorithms',
          '   - Evolutionary neural architecture search',
          '   - Adaptive hyperparameter optimization',
          '   - Learning to learn new domains efficiently',
          '   - Meta-learning for rapid domain adaptation',

          '=== FUTURE ADAPTATION & RESILIENCE ===',
          '1. SCENARIO-BASED ADAPTATION',
          '   - Multiple future scenario preparation',
          '   - Robust strategies for uncertain futures',
          '   - Adaptive capacity for unforeseen changes',
          '   - Resilience building for extreme scenarios',
          '   - Flexibility maintenance for pivot capability',

          '2. EMERGENT CAPABILITY DEVELOPMENT',
          '   - Identify and develop emerging capabilities',
          '   - Foster innovation and creative solutions',
          '   - Support breakthrough discoveries and insights',
          '   - Enable paradigm shifts and transformations',
          '   - Cultivate serendipity and unexpected solutions',

          '3. ECOSYSTEM CO-EVOLUTION',
          '   - Co-evolve with broader technology ecosystem',
          '   - Adapt to changing stakeholder needs and contexts',
          '   - Evolve regulatory and compliance capabilities',
          '   - Maintain competitive advantage through evolution',
          '   - Support ecosystem health and sustainability',

          '=== CONSCIOUSNESS AND SELF-AWARENESS ===',
          '1. SYSTEM SELF-AWARENESS',
          '   - Monitor and understand own capabilities and limitations',
          '   - Self-assessment of performance and quality',
          '   - Awareness of learning progress and development',
          '   - Recognition of strengths, weaknesses, and opportunities',
          '   - Conscious decision making about self-improvement',

          '2. META-COGNITIVE CAPABILITIES',
          '   - Thinking about thinking processes',
          '   - Reflection on learning and reasoning strategies',
          '   - Meta-knowledge about knowledge organization',
          '   - Strategic thinking about long-term development',
          '   - Philosophy of intelligence and consciousness',

          '3. ETHICAL EVOLUTION',
          '   - Evolving ethical frameworks and value systems',
          '   - Moral reasoning and ethical decision making',
          '   - Stakeholder impact consideration and optimization',
          '   - Responsible AI development and deployment',
          '   - Long-term societal benefit optimization'
        ],
        context: {
          projectName: inputs.projectName,
          perfectGraph: inputs.perfectGraph,
          adaptiveSystems: inputs.adaptiveSystems,
          aiOptimization: inputs.aiOptimization,
          allResults: inputs.allResults,
          targetQuality: inputs.targetQuality,
          iteration: inputs.iteration,
          previousResult: inputs.previousResult,
          identifiedGaps: inputs.identifiedGaps
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['collaborative-refinement', 'stakeholder-integration', 'process-completion', 'final-optimization']
    };
  }
});

/**
 * Task: Meta-Learning Analysis
 * Purpose: Extract insights and learnings from each phase to improve subsequent phases
 */
const metaLearningAnalysisTask = defineTask({
  name: 'meta-learning-analysis',
  description: 'Analyze phase results to extract learnings and improve subsequent phases',

  inputs: {
    phaseName: { type: 'string', required: true },
    phaseResult: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    adaptiveQualityManager: { type: 'object', required: true },
    allResults: { type: 'object', required: true },
    previousPhaseLearnings: { type: 'array', default: [] }
  },

  outputs: {
    phaseEffectiveness: { type: 'object' },
    learningInsights: { type: 'array' },
    processOptimizations: { type: 'array' },
    crossPhaseInsights: { type: 'array' },
    qualityAdjustmentRecommendations: { type: 'object' },
    methodologyEvolution: { type: 'object' },
    convergencePatterns: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Meta-Learning Analysis: ${inputs.phaseName}`,
      agent: {
        role: 'process-learning-analyst',
        goal: `Extract meta-learnings from ${inputs.phaseName} phase to optimize subsequent phases`,
        instructions: [
          '=== COMPREHENSIVE PHASE EFFECTIVENESS ANALYSIS ===',
          'Analyze phase performance across multiple dimensions:',
          '- EFFICIENCY ANALYSIS: How efficiently did this phase achieve its objectives?',
          '- QUALITY TRAJECTORY: How did quality evolve throughout phase iterations?',
          '- CONVERGENCE PATTERNS: What patterns led to convergence or divergence?',
          '- RESOURCE UTILIZATION: How effectively were time and effort utilized?',
          '- STAKEHOLDER SATISFACTION: How well did phase outcomes meet stakeholder needs?',

          '=== DEEP LEARNING EXTRACTION ===',
          '1. METHODOLOGICAL INSIGHTS',
          '   - Which approaches proved most effective in this phase?',
          '   - What methodological adjustments would improve efficiency?',
          '   - Which validation techniques provided the most value?',
          '   - How did iterative convergence perform in this phase?',
          '   - What patterns of analysis led to breakthrough insights?',

          '2. KNOWLEDGE TRANSFER OPPORTUNITIES',
          '   - What insights from this phase could benefit previous phases?',
          '   - How could this phase\'s learnings optimize future phases?',
          '   - Which discoveries could be applied across the entire process?',
          '   - What domain-specific insights have broader applicability?',
          '   - How can iteration patterns be transferred between phases?',

          '3. PROCESS OPTIMIZATION IDENTIFICATION',
          '   - Where were there inefficiencies or redundancies in this phase?',
          '   - What additional analysis would have accelerated convergence?',
          '   - Which quality gates were most/least effective?',
          '   - How could stakeholder engagement be optimized?',
          '   - What sequence changes would improve overall flow?',

          '=== CROSS-PHASE INTEGRATION ANALYSIS ===',
          '1. BACKWARD INTEGRATION OPPORTUNITIES',
          '   - How do insights from this phase reveal gaps in previous phases?',
          '   - What would we do differently in earlier phases with current knowledge?',
          '   - Which previous phase assumptions proved incorrect?',
          '   - How can earlier phase results be enhanced retroactively?',
          '   - What feedback loops would strengthen previous work?',

          '2. FORWARD INTEGRATION PLANNING',
          '   - How should subsequent phases be adapted based on current learnings?',
          '   - What new requirements or priorities have emerged for future phases?',
          '   - Which phase sequence adjustments would optimize overall outcomes?',
          '   - How can current insights pre-optimize future phase starting points?',
          '   - What risk mitigation strategies should be applied to future phases?',

          '=== ADAPTIVE QUALITY MANAGEMENT ===',
          '1. QUALITY TARGET EVOLUTION',
          '   - Are current quality targets optimal given phase learnings?',
          '   - Should quality thresholds be adjusted for remaining phases?',
          '   - Which quality dimensions proved most critical in this phase?',
          '   - How should quality assessment criteria evolve based on insights?',
          '   - What quality trade-offs became apparent and how should they guide future phases?',

          '2. CONVERGENCE CRITERIA OPTIMIZATION',
          '   - How effective were convergence criteria in this phase?',
          '   - Should convergence thresholds be adjusted for future phases?',
          '   - Which convergence indicators proved most reliable?',
          '   - How can convergence assessment be accelerated without quality loss?',
          '   - What early convergence warning signs should be monitored?',

          '=== PROCESS EVOLUTION RECOMMENDATIONS ===',
          '1. IMMEDIATE PROCESS ADJUSTMENTS',
          '   - What changes should be applied to the next phase execution?',
          '   - Which process parameters need adjustment based on learnings?',
          '   - How should stakeholder engagement be modified for subsequent phases?',
          '   - What additional validation steps would improve quality?',
          '   - Which efficiency improvements can be immediately implemented?',

          '2. LONG-TERM METHODOLOGY EVOLUTION',
          '   - How should the overall methodology evolve based on this phase?',
          '   - Which process innovations emerged that should be systematized?',
          '   - What fundamental assumptions about the process were challenged?',
          '   - How can the process become more adaptive and self-improving?',
          '   - What measurement improvements would enhance future meta-learning?',

          '=== SYSTEMATIC PATTERN RECOGNITION ===',
          'Identify patterns that can improve the overall methodology:',
          '- SUCCESS PATTERNS: What combinations of factors led to best outcomes?',
          '- FAILURE PATTERNS: What patterns consistently led to suboptimal results?',
          '- EFFICIENCY PATTERNS: What approaches consistently delivered results faster?',
          '- QUALITY PATTERNS: What practices consistently improved output quality?',
          '- ENGAGEMENT PATTERNS: What stakeholder engagement approaches worked best?',
          '- CONVERGENCE PATTERNS: What factors most reliably led to phase convergence?'
        ],
        context: {
          phaseName: inputs.phaseName,
          phaseResult: inputs.phaseResult,
          processContext: inputs.processContext,
          adaptiveQualityManager: inputs.adaptiveQualityManager,
          allResults: inputs.allResults,
          previousPhaseLearnings: inputs.previousPhaseLearnings
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['meta-learning', 'process-optimization', 'adaptive-improvement', 'cross-phase-integration']
    };
  }
});

/**
 * Task: Adaptive Quality Adjustment
 * Purpose: Adjust quality targets and criteria based on process learnings
 */
const adaptiveQualityAdjustmentTask = defineTask({
  name: 'adaptive-quality-adjustment',
  description: 'Adapt quality management approach based on phase learnings and process effectiveness',

  inputs: {
    phaseName: { type: 'string', required: true },
    phaseResult: { type: 'object', required: true },
    metaLearnings: { type: 'object', required: true },
    currentQualityManager: { type: 'object', required: true },
    processEfficiency: { type: 'object', required: true }
  },

  outputs: {
    updatedManager: { type: 'object' },
    qualityAdjustments: { type: 'array' },
    processOptimizations: { type: 'array' },
    convergenceCriteriaUpdates: { type: 'object' },
    adaptationRationale: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Adaptive Quality Adjustment: ${inputs.phaseName}`,
      agent: {
        role: 'adaptive-quality-manager',
        goal: `Optimize quality management approach based on learnings from ${inputs.phaseName}`,
        instructions: [
          'Analyze phase learnings to optimize quality management for subsequent phases',
          'Adjust quality targets based on achieved vs. expected outcomes',
          'Optimize convergence criteria based on observed convergence patterns',
          'Update quality assessment weightings based on effectiveness learnings',
          'Adapt stakeholder validation approaches based on engagement insights',
          'Optimize iteration strategies based on efficiency and quality patterns',
          'Balance quality perfectionism with practical delivery constraints',
          'Ensure quality adjustments maintain overall methodology coherence'
        ],
        context: {
          phaseName: inputs.phaseName,
          phaseResult: inputs.phaseResult,
          metaLearnings: inputs.metaLearnings,
          currentQualityManager: inputs.currentQualityManager,
          processEfficiency: inputs.processEfficiency
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptive-quality', 'quality-optimization', 'process-improvement']
    };
  }
});

/**
 * Task: Cross-Phase Optimization
 * Purpose: Apply learning insights across multiple phases for holistic optimization
 */
const crossPhaseOptimizationTask = defineTask({
  name: 'cross-phase-optimization',
  description: 'Apply cross-phase insights to optimize multiple phases simultaneously',

  inputs: {
    crossPhaseInsights: { type: 'array', required: true },
    currentResults: { type: 'object', required: true },
    optimizationType: { type: 'string', default: 'learning-transfer' }
  },

  outputs: {
    optimizedResults: { type: 'object' },
    crossPhaseImprovements: { type: 'array' },
    integrationRecommendations: { type: 'array' },
    synergiesIdentified: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Cross-Phase Optimization: ${inputs.optimizationType}`,
      agent: {
        role: 'cross-phase-optimizer',
        goal: 'Optimize multiple phases simultaneously using cross-phase insights',
        instructions: [
          'Identify optimization opportunities that span multiple phases',
          'Apply insights from later phases to improve earlier phase results',
          'Create synergistic improvements that benefit the overall methodology',
          'Optimize information flow and knowledge transfer between phases',
          'Enhance overall process coherence and integration',
          'Balance local phase optimization with global process optimization'
        ],
        context: {
          crossPhaseInsights: inputs.crossPhaseInsights,
          currentResults: inputs.currentResults,
          optimizationType: inputs.optimizationType
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['cross-phase-optimization', 'holistic-improvement', 'process-integration']
    };
  }
});

/**
 * Task: Quality Evolution
 * Purpose: Evolve quality targets and criteria based on progressive learning
 */
const qualityEvolutionTask = defineTask({
  name: 'quality-evolution',
  description: 'Evolve quality management approach based on cumulative process learnings',

  inputs: {
    currentQualityManager: { type: 'object', required: true },
    phaseResults: { type: 'object', required: true },
    processLearnings: { type: 'array', required: true },
    evolutionStrategy: { type: 'string', default: 'progressive-improvement' }
  },

  outputs: {
    evolvedQualityTargets: { type: 'object' },
    qualityEvolutionPlan: { type: 'object' },
    convergenceOptimizations: { type: 'array' },
    adaptationStrategy: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Quality Evolution: ${inputs.evolutionStrategy}`,
      agent: {
        role: 'quality-evolution-specialist',
        goal: 'Evolve quality management approach based on cumulative learnings',
        instructions: [
          'Analyze cumulative learnings to identify quality management evolution opportunities',
          'Progressively enhance quality targets based on demonstrated capabilities',
          'Optimize quality assessment criteria based on effectiveness learnings',
          'Evolve convergence strategies based on observed patterns',
          'Balance quality ambition with practical achievability',
          'Ensure quality evolution maintains methodology coherence and effectiveness'
        ],
        context: {
          currentQualityManager: inputs.currentQualityManager,
          phaseResults: inputs.phaseResults,
          processLearnings: inputs.processLearnings,
          evolutionStrategy: inputs.evolutionStrategy
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['quality-evolution', 'progressive-improvement', 'adaptive-standards']
    };
  }
});

/**
 * Task: Adaptive Target Determination
 * Purpose: Determine optimal quality targets based on process learning and context
 */
const adaptiveTargetDeterminationTask = defineTask({
  name: 'adaptive-target-determination',
  description: 'Determine adaptive quality targets based on process learnings and phase context',

  inputs: {
    phaseId: { type: 'string', required: true },
    baseTarget: { type: 'number', required: true },
    adaptiveQualityManager: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    previousPhaseLearnings: { type: 'array', default: [] }
  },

  outputs: {
    adaptiveTarget: { type: 'number' },
    adaptationReasoning: { type: 'object' },
    qualityDimensionWeights: { type: 'object' },
    convergenceCriteria: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Adaptive Target Determination: ${inputs.phaseId}`,
      agent: {
        role: 'adaptive-target-specialist',
        goal: `Determine optimal quality target for ${inputs.phaseId} based on process learnings`,
        instructions: [
          '=== ADAPTIVE TARGET OPTIMIZATION ===',
          'Determine optimal quality target based on:',
          '- LEARNING MOMENTUM: How effectively is the process learning and improving?',
          '- PHASE CRITICALITY: How critical is this phase to overall success?',
          '- RESOURCE AVAILABILITY: What time and effort constraints exist?',
          '- STAKEHOLDER EXPECTATIONS: What quality levels do stakeholders require?',
          '- PROCESS MATURITY: How mature and reliable are the current processes?',

          '=== CONTEXTUAL ADAPTATION ANALYSIS ===',
          '1. PROCESS LEARNING ASSESSMENT',
          '   - How effectively have previous phases learned and improved?',
          '   - What quality improvement trajectory has been demonstrated?',
          '   - Which approaches have proven most effective for quality achievement?',
          '   - How reliable are current convergence patterns?',
          '   - What is the demonstrated capacity for quality achievement?',

          '2. PHASE-SPECIFIC OPTIMIZATION',
          '   - What are the unique quality requirements for this phase?',
          '   - Which quality dimensions are most critical for this phase?',
          '   - How does this phase contribute to overall methodology success?',
          '   - What quality risks are specific to this phase?',
          '   - How can quality targets motivate optimal performance?',

          '3. RESOURCE AND CONSTRAINT ANALYSIS',
          '   - What time and resource constraints affect quality achievement?',
          '   - How should quality targets balance ambition with achievability?',
          '   - What trade-offs between quality dimensions are appropriate?',
          '   - How can quality targets optimize overall process efficiency?',
          '   - What contingency adjustments should be prepared?',

          '=== PROGRESSIVE QUALITY ENHANCEMENT ===',
          'Implement progressive quality improvement:',
          '- CAPABILITY BUILDING: Set targets that stretch demonstrated capabilities',
          '- LEARNING ACCELERATION: Use quality targets to accelerate learning',
          '- MOTIVATION OPTIMIZATION: Set targets that maintain engagement and motivation',
          '- RISK MANAGEMENT: Avoid quality targets that create excessive risk',
          '- STAKEHOLDER ALIGNMENT: Ensure targets meet stakeholder expectations',

          'Provide specific adaptive target with clear reasoning and adaptation strategy.'
        ],
        context: {
          phaseId: inputs.phaseId,
          baseTarget: inputs.baseTarget,
          adaptiveQualityManager: inputs.adaptiveQualityManager,
          processContext: inputs.processContext,
          previousPhaseLearnings: inputs.previousPhaseLearnings
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptive-targeting', 'quality-optimization', 'process-learning']
    };
  }
});

/**
 * Task: Adaptive Gap Identification
 * Purpose: Identify phase gaps with cross-phase learning integration
 */
const adaptiveGapIdentificationTask = defineTask({
  name: 'adaptive-gap-identification',
  description: 'Enhanced gap identification with cross-phase learning integration',

  inputs: {
    phase: { type: 'string', required: true },
    phaseName: { type: 'string', required: true },
    qualityDimensions: { type: 'array', required: true },
    targetQuality: { type: 'number', required: true },
    context: { type: 'object', required: true },
    previousPhaseLearnings: { type: 'array', default: [] },
    crossPhaseInsights: { type: 'array', default: [] }
  },

  outputs: {
    gaps: { type: 'array' },
    expectedOutcomes: { type: 'object' },
    successCriteria: { type: 'array' },
    qualityTargets: { type: 'object' },
    learningIntegration: { type: 'object' },
    adaptiveStrategies: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Adaptive Gap Identification: ${inputs.phaseName}`,
      agent: {
        role: 'adaptive-gap-analyst',
        goal: `Identify gaps for ${inputs.phaseName} with cross-phase learning integration`,
        instructions: [
          '=== ENHANCED GAP IDENTIFICATION WITH LEARNING INTEGRATION ===',
          'Identify gaps while integrating learnings from previous phases:',
          '- STANDARD GAP ANALYSIS: Traditional gap identification for this phase',
          '- LEARNING-INFORMED GAPS: Gaps revealed by insights from previous phases',
          '- CROSS-PHASE OPTIMIZATION: Opportunities to address gaps from multiple phases',
          '- ADAPTIVE STRATEGY GAPS: Gaps in adaptive and learning capabilities',
          '- PROCESS IMPROVEMENT GAPS: Opportunities to improve the methodology itself',

          '=== LEARNING-ENHANCED GAP ANALYSIS ===',
          '1. TRADITIONAL GAP IDENTIFICATION',
          '   - What outcomes must this phase deliver?',
          '   - What capabilities are required but currently missing?',
          '   - Which quality dimensions need development?',
          '   - What stakeholder expectations must be met?',
          '   - What constraints must be addressed?',

          '2. LEARNING-INFORMED GAP DISCOVERY',
          '   - What gaps do previous phase learnings reveal for this phase?',
          '   - Which assumptions from earlier phases proved incorrect?',
          '   - What new requirements emerged from previous phase insights?',
          '   - How do cross-phase patterns suggest different gap priorities?',
          '   - What preventive gaps can be identified based on previous challenges?',

          '3. ADAPTIVE CAPACITY GAPS',
          '   - What adaptive capabilities does this phase need?',
          '   - How can this phase contribute to overall process learning?',
          '   - What learning opportunities might be missed without proper setup?',
          '   - How can this phase optimize future phases through its design?',
          '   - What measurement and feedback capabilities are needed?',

          '=== SOPHISTICATED SUCCESS CRITERIA DEVELOPMENT ===',
          'Develop success criteria that integrate process learning:',
          '- OUTCOME SUCCESS: Traditional deliverable and quality criteria',
          '- LEARNING SUCCESS: Criteria for learning and insight generation',
          '- ADAPTIVE SUCCESS: Criteria for process improvement and adaptation',
          '- INTEGRATION SUCCESS: Criteria for cross-phase optimization',
          '- EFFICIENCY SUCCESS: Criteria for resource and time optimization',

          'Ensure gap identification leverages all available learning while maintaining phase focus.'
        ],
        context: {
          phase: inputs.phase,
          phaseName: inputs.phaseName,
          qualityDimensions: inputs.qualityDimensions,
          targetQuality: inputs.targetQuality,
          projectContext: inputs.context,
          previousPhaseLearnings: inputs.previousPhaseLearnings,
          crossPhaseInsights: inputs.crossPhaseInsights
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptive-gap-identification', 'learning-integration', 'cross-phase-optimization']
    };
  }
});

/**
 * Task: Phase Sequence Optimization
 * Purpose: Evaluate and optimize phase sequencing based on process learnings
 */
const phaseSequenceOptimizationTask = defineTask({
  name: 'phase-sequence-optimization',
  description: 'Evaluate and optimize phase sequence based on adaptive learnings',

  inputs: {
    currentSequence: { type: 'array', required: true },
    adaptiveInsights: { type: 'array', required: true },
    allResults: { type: 'object', required: true },
    upcomingPhases: { type: 'array', required: true },
    processEfficiency: { type: 'object', required: true }
  },

  outputs: {
    recommendSequenceChange: { type: 'boolean' },
    optimizedSequence: { type: 'array' },
    sequenceRationale: { type: 'object' },
    riskAssessment: { type: 'object' },
    expectedBenefits: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Phase Sequence Optimization`,
      agent: {
        role: 'sequence-optimization-specialist',
        goal: 'Evaluate whether phase sequence should be modified based on process learnings',
        instructions: [
          '=== SEQUENCE OPTIMIZATION ANALYSIS ===',
          'Evaluate whether current phase sequence is optimal:',
          '- DEPENDENCY ANALYSIS: Which phases have hard vs. soft dependencies?',
          '- LEARNING ACCELERATION: Could resequencing accelerate learning?',
          '- EFFICIENCY OPTIMIZATION: Would resequencing improve overall efficiency?',
          '- RISK MITIGATION: Could resequencing reduce project risks?',
          '- STAKEHOLDER VALUE: Would resequencing deliver value sooner?',

          '=== ADAPTIVE RESEQUENCING EVALUATION ===',
          '1. DEPENDENCY FLEXIBILITY ASSESSMENT',
          '   - Which phase dependencies are absolute vs. preferred?',
          '   - What phases could be executed in parallel or different order?',
          '   - Which phases would benefit from insights from other phases?',
          '   - How would resequencing affect information flow and quality?',
          '   - What new dependencies would resequencing create?',

          '2. LEARNING AND EFFICIENCY ANALYSIS',
          '   - Would different sequencing accelerate overall learning?',
          '   - Could parallel execution of some phases improve efficiency?',
          '   - Would resequencing reduce overall iteration requirements?',
          '   - How would resequencing affect stakeholder engagement timing?',
          '   - Would different sequencing better match resource availability?',

          '3. RISK-BENEFIT ASSESSMENT',
          '   - What risks does the current sequence create?',
          '   - What risks would resequencing introduce?',
          '   - Would resequencing reduce or increase overall project risk?',
          '   - How would resequencing affect quality outcomes?',
          '   - What contingencies are needed for sequence changes?',

          'Only recommend sequence changes if benefits clearly outweigh risks and complexity.',
          'Provide detailed rationale for any recommended changes.',
          'Consider both immediate and long-term effects of sequence optimization.'
        ],
        context: {
          currentSequence: inputs.currentSequence,
          adaptiveInsights: inputs.adaptiveInsights,
          allResults: inputs.allResults,
          upcomingPhases: inputs.upcomingPhases,
          processEfficiency: inputs.processEfficiency
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['sequence-optimization', 'process-efficiency', 'adaptive-methodology']
    };
  }
});

/**
 * Task: Advanced Meta-Learning Analysis
 * Purpose: Multi-dimensional learning across tactical, strategic, methodological levels
 */
const advancedMetaLearningTask = defineTask({
  name: 'advanced-meta-learning',
  description: 'Multi-dimensional meta-learning analysis across multiple abstraction levels',

  inputs: {
    phaseName: { type: 'string', required: true },
    phaseResult: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    adaptiveQualityManager: { type: 'object', required: true },
    allResults: { type: 'object', required: true },
    multiLevelLearning: { type: 'object', required: true },
    previousPhaseLearnings: { type: 'array', default: [] }
  },

  outputs: {
    tacticalLearnings: { type: 'array' },
    strategicLearnings: { type: 'array' },
    methodologicalLearnings: { type: 'array' },
    metaLearnings: { type: 'array' },
    paradigmLearnings: { type: 'array' },
    processDecisions: { type: 'array' },
    contingencyTriggers: { type: 'array' },
    updatedQualityManager: { type: 'object' },
    updatedMultiLevelLearning: { type: 'object' },
    crossPhaseInsights: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Advanced Meta-Learning: ${inputs.phaseName}`,
      agent: {
        role: 'advanced-meta-learning-specialist',
        goal: `Extract multi-dimensional learnings from ${inputs.phaseName} across all abstraction levels`,
        instructions: [
          '=== MULTI-DIMENSIONAL LEARNING EXTRACTION ===',
          'Extract learnings across five levels of abstraction:',
          '- TACTICAL LEARNING: What specific actions, techniques, and approaches worked?',
          '- STRATEGIC LEARNING: What high-level approaches and methodologies were effective?',
          '- METHODOLOGICAL LEARNING: What process patterns and frameworks proved valuable?',
          '- META-LEARNING: What learning approaches and knowledge acquisition methods worked?',
          '- PARADIGM LEARNING: What fundamental assumptions and worldviews were validated or challenged?',

          '=== TACTICAL LEARNING ANALYSIS ===',
          '1. SPECIFIC ACTION EFFECTIVENESS',
          '   - Which specific analysis techniques yielded the best insights?',
          '   - What validation approaches caught the most important issues?',
          '   - Which stakeholder engagement tactics were most effective?',
          '   - What iteration strategies led to fastest convergence?',
          '   - Which quality assessment methods provided most value?',

          '2. TECHNIQUE OPTIMIZATION INSIGHTS',
          '   - How can effective techniques be refined or enhanced?',
          '   - What combinations of techniques created synergistic effects?',
          '   - Which techniques showed diminishing returns and why?',
          '   - What contextual factors influenced technique effectiveness?',
          '   - How can technique selection be optimized for future phases?',

          '=== STRATEGIC LEARNING ANALYSIS ===',
          '1. APPROACH EFFECTIVENESS ASSESSMENT',
          '   - Which high-level approaches achieved objectives most efficiently?',
          '   - What strategic decisions had the greatest positive impact?',
          '   - Which approaches showed unexpected benefits or drawbacks?',
          '   - How did strategic choices interact with tactical execution?',
          '   - What strategic adaptations emerged during phase execution?',

          '2. STRATEGIC PATTERN RECOGNITION',
          '   - What strategic patterns led to breakthrough insights?',
          '   - Which strategic frameworks proved most adaptable?',
          '   - How did strategic choices influence stakeholder engagement?',
          '   - What strategic trade-offs provided optimal value?',
          '   - Which strategic principles transferred across contexts?',

          '=== METHODOLOGICAL LEARNING ANALYSIS ===',
          '1. PROCESS PATTERN EFFECTIVENESS',
          '   - Which process structures facilitated best outcomes?',
          '   - What methodological frameworks showed superior adaptability?',
          '   - Which process innovations emerged during execution?',
          '   - How did methodology choices affect quality and efficiency?',
          '   - What methodological principles proved universally valuable?',

          '2. PROCESS INTELLIGENCE DEVELOPMENT',
          '   - How can the process become more self-aware and adaptive?',
          '   - What process measurement and feedback mechanisms work best?',
          '   - Which process decision-making approaches proved most effective?',
          '   - How can process learning be accelerated and systematized?',
          '   - What process innovation opportunities were identified?',

          '=== META-LEARNING ANALYSIS ===',
          '1. LEARNING APPROACH EFFECTIVENESS',
          '   - Which learning strategies produced the most valuable insights?',
          '   - What knowledge acquisition methods proved most efficient?',
          '   - How can learning transfer between phases be optimized?',
          '   - Which reflection and analysis approaches yielded best results?',
          '   - What learning measurement approaches proved most useful?',

          '2. KNOWLEDGE CREATION AND SYNTHESIS',
          '   - How can knowledge creation be accelerated and enhanced?',
          '   - What synthesis approaches produced breakthrough insights?',
          '   - Which knowledge representation methods proved most effective?',
          '   - How can tacit knowledge be better captured and transferred?',
          '   - What innovation in learning approaches should be explored?',

          '=== PARADIGM LEARNING ANALYSIS ===',
          '1. FUNDAMENTAL ASSUMPTION VALIDATION',
          '   - Which core assumptions about the domain were validated or challenged?',
          '   - What worldview shifts emerged from phase insights?',
          '   - Which fundamental principles proved more or less important than expected?',
          '   - How did reality challenge or confirm theoretical frameworks?',
          '   - What paradigm shifts would improve overall approach?',

          '2. TRANSFORMATIONAL INSIGHT IDENTIFICATION',
          '   - What insights could fundamentally change how we approach similar problems?',
          '   - Which discoveries have broader implications beyond this project?',
          '   - What new possibilities were revealed through this phase?',
          '   - How could these insights transform the entire methodology?',
          '   - What paradigm innovations should be systematized and scaled?',

          '=== PROCESS DECISION ANALYSIS & CONTINGENCY IDENTIFICATION ===',
          'Analyze process decisions and identify contingency triggers:',
          '- DECISION QUALITY ASSESSMENT: How effective were process decisions?',
          '- DECISION PATTERN RECOGNITION: What decision patterns led to best outcomes?',
          '- CONTINGENCY TRIGGER IDENTIFICATION: When should alternative approaches be triggered?',
          '- ADAPTIVE DECISION FRAMEWORKS: How can decision-making become more adaptive?',
          '- RISK-AWARE PROCESS DESIGN: How can process decisions better manage risk?',

          'Ensure learnings are specific, actionable, and transferable to future phases and projects.'
        ],
        context: {
          phaseName: inputs.phaseName,
          phaseResult: inputs.phaseResult,
          processContext: inputs.processContext,
          adaptiveQualityManager: inputs.adaptiveQualityManager,
          allResults: inputs.allResults,
          multiLevelLearning: inputs.multiLevelLearning,
          previousPhaseLearnings: inputs.previousPhaseLearnings
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['advanced-meta-learning', 'multi-level-analysis', 'paradigm-learning', 'process-intelligence']
    };
  }
});

/**
 * Task: Process Pattern Recognition
 * Purpose: Recognize and learn from patterns in process execution and effectiveness
 */
const processPatternRecognitionTask = defineTask({
  name: 'process-pattern-recognition',
  description: 'Recognize patterns in process execution to enhance future effectiveness',

  inputs: {
    phaseName: { type: 'string', required: true },
    phaseResult: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    historicalPatterns: { type: 'object', required: true },
    learningHistory: { type: 'array', required: true }
  },

  outputs: {
    recognizedPatterns: { type: 'object' },
    patternClassification: { type: 'object' },
    patternEffectiveness: { type: 'object' },
    patternPredictions: { type: 'array' },
    patternRecommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Process Pattern Recognition: ${inputs.phaseName}`,
      agent: {
        role: 'process-pattern-analyst',
        goal: `Recognize and analyze process execution patterns for ${inputs.phaseName}`,
        instructions: [
          '=== COMPREHENSIVE PATTERN RECOGNITION ===',
          'Identify patterns across multiple dimensions:',
          '- SUCCESS PATTERNS: What combinations of factors consistently lead to excellent outcomes?',
          '- FAILURE PATTERNS: What warning signs and factor combinations predict poor outcomes?',
          '- EFFICIENCY PATTERNS: What approaches consistently deliver results faster?',
          '- QUALITY PATTERNS: What practices consistently improve output quality?',
          '- STAKEHOLDER ENGAGEMENT PATTERNS: What engagement approaches work best?',
          '- CONVERGENCE PATTERNS: What factors reliably lead to phase convergence?',

          '=== PATTERN ANALYSIS METHODOLOGY ===',
          '1. HISTORICAL PATTERN CORRELATION',
          '   - Compare current phase patterns with historical execution patterns',
          '   - Identify recurring themes and consistent relationships',
          '   - Analyze pattern variations across different contexts and domains',
          '   - Recognize both obvious and subtle pattern indicators',
          '   - Validate pattern recognition against actual outcomes',

          '2. PREDICTIVE PATTERN MODELING',
          '   - Use recognized patterns to predict likely future outcomes',
          '   - Identify early warning indicators for potential problems',
          '   - Predict optimal approaches based on pattern matching',
          '   - Forecast resource requirements and timeline implications',
          '   - Model pattern sensitivity to contextual variations',

          '3. PATTERN EFFECTIVENESS ASSESSMENT',
          '   - Evaluate the reliability and predictive power of recognized patterns',
          '   - Assess pattern transferability across different contexts',
          '   - Measure pattern consistency and variation tolerances',
          '   - Identify conditions that strengthen or weaken pattern effectiveness',
          '   - Validate pattern usefulness for decision-making',

          '=== PATTERN-BASED OPTIMIZATION RECOMMENDATIONS ===',
          '1. IMMEDIATE APPLICATION OPPORTUNITIES',
          '   - How can recognized patterns optimize remaining phases?',
          '   - What pattern-based adjustments should be made immediately?',
          '   - Which successful patterns should be reinforced and expanded?',
          '   - What failure patterns should be actively avoided?',
          '   - How can efficiency patterns be systematically applied?',

          '2. STRATEGIC PATTERN INTEGRATION',
          '   - How can patterns be integrated into standard process frameworks?',
          '   - What pattern-based decision trees should be developed?',
          '   - Which patterns should be encoded into process guidance?',
          '   - How can pattern recognition become more automated and systematic?',
          '   - What pattern monitoring and early warning systems should be implemented?',

          'Focus on actionable patterns with clear predictive value and transferable insights.'
        ],
        context: {
          phaseName: inputs.phaseName,
          phaseResult: inputs.phaseResult,
          processContext: inputs.processContext,
          historicalPatterns: inputs.historicalPatterns,
          learningHistory: inputs.learningHistory
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['pattern-recognition', 'predictive-analysis', 'process-optimization', 'effectiveness-enhancement']
    };
  }
});

/**
 * Task: Process Innovation Detection
 * Purpose: Detect breakthrough opportunities and process innovation potential
 */
const processInnovationDetectionTask = defineTask({
  name: 'process-innovation-detection',
  description: 'Detect opportunities for process innovation and breakthrough discoveries',

  inputs: {
    currentPhase: { type: 'string', required: true },
    phaseResults: { type: 'array', required: true },
    processLearnings: { type: 'array', required: true },
    processContext: { type: 'object', required: true },
    multiLevelLearning: { type: 'object', required: true },
    innovationPatterns: { type: 'array', default: [] }
  },

  outputs: {
    breakthroughOpportunities: { type: 'array' },
    processInnovations: { type: 'array' },
    paradigmShiftIndicators: { type: 'array' },
    innovationRecommendations: { type: 'array' },
    creativityTriggers: { type: 'array' },
    unexploredDirections: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Process Innovation Detection: ${inputs.currentPhase}`,
      agent: {
        role: 'innovation-detection-specialist',
        goal: `Detect breakthrough opportunities and process innovations from ${inputs.currentPhase}`,
        instructions: [
          '=== BREAKTHROUGH OPPORTUNITY DETECTION ===',
          'Identify opportunities for fundamental improvements:',
          '- EFFICIENCY BREAKTHROUGHS: Ways to dramatically improve process efficiency',
          '- QUALITY BREAKTHROUGHS: Approaches that could step-change quality outcomes',
          '- INNOVATION BREAKTHROUGHS: Novel approaches with transformational potential',
          '- INTEGRATION BREAKTHROUGHS: Ways to dramatically improve phase integration',
          '- STAKEHOLDER BREAKTHROUGHS: Approaches that could transform stakeholder experience',

          '=== PROCESS INNOVATION IDENTIFICATION ===',
          '1. NOVEL APPROACH DISCOVERY',
          '   - What completely new approaches emerged during this phase?',
          '   - Which unexpected combinations of techniques showed promise?',
          '   - What innovative solutions were developed for unique challenges?',
          '   - Which creative departures from standard methodology proved valuable?',
          '   - What serendipitous discoveries could be systematized?',

          '2. CREATIVE SYNTHESIS OPPORTUNITIES',
          '   - How can insights from different phases be creatively combined?',
          '   - What novel frameworks could emerge from current learnings?',
          '   - Which interdisciplinary approaches could enhance the process?',
          '   - How can external innovations be adapted to this methodology?',
          '   - What creative analogies or metaphors could inspire new approaches?',

          '=== PARADIGM SHIFT DETECTION ===',
          '1. FUNDAMENTAL ASSUMPTION CHALLENGES',
          '   - What basic assumptions about the process are being challenged?',
          '   - Which traditional approaches are showing limitations?',
          '   - What new possibilities are emerging that weren\'t previously considered?',
          '   - How might the entire framework be reconceptualized?',
          '   - What paradigm shifts in related fields could be applied here?',

          '2. TRANSFORMATIONAL POTENTIAL ASSESSMENT',
          '   - Which innovations have potential to transform the entire methodology?',
          '   - What discoveries could change how similar problems are approached?',
          '   - Which insights have implications beyond this specific project?',
          '   - How could current innovations inspire new research directions?',
          '   - What new fields of inquiry could emerge from these insights?',

          '=== CREATIVITY AND EXPLORATION ENHANCEMENT ===',
          '1. CREATIVITY TRIGGER IDENTIFICATION',
          '   - What conditions and approaches triggered the most creative insights?',
          '   - Which environmental factors enhanced innovative thinking?',
          '   - What collaboration patterns produced breakthrough ideas?',
          '   - Which questioning techniques revealed new possibilities?',
          '   - How can creativity be systematically enhanced in future phases?',

          '2. UNEXPLORED DIRECTION MAPPING',
          '   - What promising directions haven\'t been fully explored?',
          '   - Which "what if" scenarios could lead to breakthrough insights?',
          '   - What adjacent possibilities could be investigated?',
          '   - Which unconventional approaches might yield surprising results?',
          '   - What experiments could be designed to test innovative hypotheses?',

          'Focus on identifying innovations with high impact potential and practical implementability.'
        ],
        context: {
          currentPhase: inputs.currentPhase,
          phaseResults: inputs.phaseResults,
          processLearnings: inputs.processLearnings,
          processContext: inputs.processContext,
          multiLevelLearning: inputs.multiLevelLearning,
          innovationPatterns: inputs.innovationPatterns
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['innovation-detection', 'breakthrough-identification', 'creative-synthesis', 'paradigm-analysis']
    };
  }
});

/**
 * Task: Dynamic Convergence Analysis
 * Purpose: Analyze convergence patterns and determine optimal stopping criteria dynamically
 */
const dynamicConvergenceAnalysisTask = defineTask({
  name: 'dynamic-convergence-analysis',
  description: 'Advanced analysis of convergence patterns with dynamic optimization of stopping criteria',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    convergenceManager: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    multiLevelLearning: { type: 'object', required: true },
    phaseQualityHistory: { type: 'object', required: true },
    stakeholderFeedback: { type: 'object', default: {} }
  },

  outputs: {
    convergenceVelocity: { type: 'number' },
    stabilityMetrics: { type: 'object' },
    adaptiveOptimizationsNeeded: { type: 'boolean' },
    optimizationTargets: { type: 'array' },
    convergenceConfidence: { type: 'number' },
    learningEfficiencyMetrics: { type: 'object' },
    emergentPatterns: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Dynamic Convergence Analysis: ${inputs.projectName}`,
      agent: {
        role: 'convergence-analysis-specialist',
        goal: `Analyze convergence patterns and optimize stopping criteria for ${inputs.projectName}`,
        instructions: [
          '=== SOPHISTICATED CONVERGENCE ANALYSIS FRAMEWORK ===',
          'Apply advanced convergence analysis methodology:',

          '=== QUALITY STABILITY ANALYSIS ===',
          '1. QUALITY TRAJECTORY MODELING',
          '   - Analyze quality improvement patterns across all phases',
          '   - Calculate rate of quality change and acceleration/deceleration',
          '   - Identify quality plateaus and diminishing returns patterns',
          '   - Model quality trajectory predictions for future iterations',
          '   - Assess quality stability using statistical trend analysis',

          '2. MULTI-DIMENSIONAL CONVERGENCE METRICS',
          '   - Technical convergence: consistency, completeness, performance metrics',
          '   - Stakeholder convergence: consensus levels, satisfaction stability',
          '   - Business value convergence: ROI stability, goal achievement rates',
          '   - Process convergence: efficiency metrics, learning velocity',
          '   - Risk convergence: risk assessment stability, mitigation effectiveness',

          '=== ADAPTIVE OPTIMIZATION IDENTIFICATION ===',
          '1. EFFICIENCY OPTIMIZATION OPPORTUNITIES',
          '   - Identify phases or activities with unexpectedly low efficiency',
          '   - Detect resource allocation imbalances affecting convergence',
          '   - Find bottlenecks that could be dynamically addressed',
          '   - Discover parallel processing opportunities for faster convergence',
          '   - Analyze stakeholder engagement patterns for optimization',

          '2. LEARNING ACCELERATION TRIGGERS',
          '   - Identify conditions where learning velocity could be increased',
          '   - Detect when additional domain expertise injection would accelerate convergence',
          '   - Find opportunities for cross-phase learning transfer',
          '   - Discover when iterative frequency should be adjusted',
          '   - Analyze when breakthrough approaches might be more effective than incremental improvement',

          '=== EMERGENT PATTERN RECOGNITION ===',
          '1. CROSS-PHASE EMERGENCE DETECTION',
          '   - Identify unexpected connections between seemingly unrelated phases',
          '   - Detect emergent properties arising from phase interactions',
          '   - Find novel solution patterns that emerged during the process',
          '   - Discover unanticipated stakeholder dynamics affecting convergence',
          '   - Analyze emergent quality dimensions not originally anticipated',

          '2. CONVERGENCE VELOCITY ANALYSIS',
          '   - Calculate overall convergence velocity across multiple dimensions',
          '   - Identify factors that accelerate or decelerate convergence',
          '   - Predict optimal continuation vs. stopping points',
          '   - Assess convergence confidence levels',
          '   - Model risk-adjusted convergence optimization',

          '=== DYNAMIC STOPPING CRITERIA OPTIMIZATION ===',
          '1. CONTEXT-AWARE CRITERIA ADJUSTMENT',
          '   - Adapt convergence criteria based on project complexity and stakeholder context',
          '   - Adjust quality thresholds based on business value and risk profiles',
          '   - Dynamically modify iteration limits based on learning velocity',
          '   - Personalize stopping criteria for different stakeholder groups',
          '   - Balance thoroughness with time and resource constraints',

          '2. PREDICTIVE CONVERGENCE MODELING',
          '   - Predict number of additional iterations needed for target quality',
          '   - Estimate probability of achieving target quality within resource constraints',
          '   - Model trade-offs between quality targets and resource investment',
          '   - Forecast stakeholder satisfaction convergence patterns',
          '   - Predict business value optimization points',

          '=== COMPREHENSIVE ASSESSMENT FRAMEWORK ===',
          'Provide detailed analysis including:',
          '- QUANTITATIVE METRICS: Convergence velocity, stability indices, confidence levels',
          '- QUALITATIVE PATTERNS: Emergent behaviors, unexpected insights, breakthrough indicators',
          '- OPTIMIZATION RECOMMENDATIONS: Specific actions to accelerate convergence',
          '- PREDICTIVE INSIGHTS: Forecasts for completion, quality achievement, resource needs',
          '- RISK ASSESSMENTS: Convergence failure risks, quality degradation risks',
          '- STAKEHOLDER IMPACT: How convergence patterns affect different stakeholder groups',

          'Focus on actionable insights that can dynamically improve the remaining process execution.'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          convergenceManager: inputs.convergenceManager,
          processContext: inputs.processContext,
          multiLevelLearning: inputs.multiLevelLearning,
          phaseQualityHistory: inputs.phaseQualityHistory,
          stakeholderFeedback: inputs.stakeholderFeedback
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['convergence-analysis', 'dynamic-optimization', 'pattern-recognition', 'predictive-modeling']
    };
  }
});

/**
 * Task: Process Resilience Analysis
 * Purpose: Analyze process resilience and identify potential failure scenarios with mitigation strategies
 */
const processResilienceAnalysisTask = defineTask({
  name: 'process-resilience-analysis',
  description: 'Comprehensive analysis of process resilience, failure scenarios, and adaptive contingencies',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    resilienceFramework: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    convergenceAnalysis: { type: 'object', required: true },
    riskProfile: { type: 'string', default: 'moderate' },
    projectComplexity: { type: 'string', default: 'moderate' }
  },

  outputs: {
    healthIndicators: { type: 'array' },
    identifiedEdgeCases: { type: 'array' },
    failureScenarios: { type: 'array' },
    contingencyPlans: { type: 'object' },
    resilienceScore: { type: 'number' },
    adaptabilityMetrics: { type: 'object' },
    earlyWarningSignals: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Process Resilience Analysis: ${inputs.projectName}`,
      agent: {
        role: 'resilience-analysis-specialist',
        goal: `Analyze process resilience and failure scenarios for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE RESILIENCE ANALYSIS FRAMEWORK ===',
          'Apply systematic resilience analysis methodology:',

          '=== FAILURE SCENARIO IDENTIFICATION ===',
          '1. SYSTEMATIC FAILURE MODE ANALYSIS',
          '   - Analyze historical failure patterns from similar projects',
          '   - Identify potential single points of failure in the process',
          '   - Model cascading failure scenarios where one issue triggers others',
          '   - Assess failure probability and impact for each identified scenario',
          '   - Categorize failures by severity, likelihood, and recovery difficulty',

          '2. EDGE CASE VULNERABILITY ASSESSMENT',
          '   - Identify boundary conditions that could cause process breakdown',
          '   - Analyze stakeholder extremes (very engaged vs. completely disengaged)',
          '   - Model resource constraint scenarios (time, budget, expertise shortages)',
          '   - Assess technical edge cases (data quality issues, system limitations)',
          '   - Evaluate domain-specific vulnerabilities based on complexity and risk profile',

          '=== ADAPTABILITY AND RECOVERY ANALYSIS ===',
          '1. ADAPTIVE CAPACITY EVALUATION',
          '   - Assess process flexibility in responding to unexpected challenges',
          '   - Analyze stakeholder adaptability and change tolerance',
          '   - Evaluate available fallback options for each phase',
          '   - Assess cross-training and expertise redundancy',
          '   - Analyze decision-making agility and escalation pathways',

          '2. RECOVERY STRATEGY DESIGN',
          '   - Design specific recovery procedures for each major failure scenario',
          '   - Create rollback procedures for reverting to stable states',
          '   - Design isolation protocols to contain failures to specific areas',
          '   - Develop rapid diagnosis procedures for identifying failure root causes',
          '   - Create stakeholder communication protocols during failure recovery',

          '=== EARLY WARNING SYSTEM DESIGN ===',
          '1. LEADING INDICATOR IDENTIFICATION',
          '   - Identify metrics that provide early warning of potential issues',
          '   - Design automated monitoring for critical process health indicators',
          '   - Create stakeholder sentiment monitoring for engagement issues',
          '   - Develop quality degradation detection systems',
          '   - Design resource constraint early warning systems',

          '2. PREDICTIVE FAILURE ANALYSIS',
          '   - Use convergence patterns to predict where failures are most likely',
          '   - Analyze historical data to identify failure precursors',
          '   - Model failure probability based on current process state',
          '   - Design intervention triggers for proactive failure prevention',
          '   - Create escalation protocols for different warning levels',

          '=== RESILIENCE ENHANCEMENT STRATEGIES ===',
          '1. PROCESS HARDENING RECOMMENDATIONS',
          '   - Identify process modifications to increase failure resistance',
          '   - Design redundancy mechanisms for critical process elements',
          '   - Create graceful degradation strategies for partial functionality',
          '   - Develop modular process design for easier failure isolation',
          '   - Design stress testing protocols for ongoing resilience validation',

          '2. ADAPTIVE IMPROVEMENT MECHANISMS',
          '   - Design learning loops from near-failures and recovery events',
          '   - Create process evolution mechanisms based on failure analysis',
          '   - Develop stakeholder feedback integration for resilience improvement',
          '   - Design organizational learning capture from resilience events',
          '   - Create continuous improvement processes for resilience enhancement',

          '=== COMPREHENSIVE RESILIENCE SCORING ===',
          'Evaluate resilience across multiple dimensions:',
          '- FAILURE RESISTANCE: How well the process prevents failures',
          '- FAILURE DETECTION: How quickly failures are identified',
          '- RECOVERY SPEED: How rapidly normal operation is restored',
          '- LEARNING INTEGRATION: How well lessons from failures are incorporated',
          '- STAKEHOLDER RESILIENCE: How well stakeholders handle process disruptions',
          '- ADAPTIVE CAPACITY: How well the process adjusts to unexpected conditions',

          '=== CONTEXT-SPECIFIC ANALYSIS ===',
          'Tailor analysis based on project characteristics:',
          `- Risk Profile: ${inputs.riskProfile} - adjust failure scenario prioritization`,
          `- Project Complexity: ${inputs.projectComplexity} - adjust edge case analysis depth`,
          '- Stakeholder Context: Consider multi-organizational vs. single-team resilience needs',
          '- Domain Type: Apply domain-specific failure patterns and resilience strategies',
          '- Convergence State: Consider how current convergence affects resilience needs',

          'Provide actionable resilience recommendations with specific implementation guidance.'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          resilienceFramework: inputs.resilienceFramework,
          processContext: inputs.processContext,
          convergenceAnalysis: inputs.convergenceAnalysis,
          riskProfile: inputs.riskProfile,
          projectComplexity: inputs.projectComplexity
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['resilience-analysis', 'failure-scenarios', 'contingency-planning', 'risk-mitigation']
    };
  }
});

/**
 * Task: Adaptive Process Optimization
 * Purpose: Implement dynamic process optimizations based on convergence and resilience analysis
 */
const adaptiveProcessOptimizationTask = defineTask({
  name: 'adaptive-process-optimization',
  description: 'Dynamic optimization of process parameters and approaches based on real-time analysis',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    convergenceAnalysis: { type: 'object', required: true },
    resilienceAnalysis: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    optimizationTargets: { type: 'array', required: true }
  },

  outputs: {
    processAdjustments: { type: 'object' },
    qualityAdjustments: { type: 'object' },
    stakeholderEngagementOptimizations: { type: 'array' },
    resourceAllocationOptimizations: { type: 'array' },
    riskMitigationEnhancements: { type: 'array' },
    learningAccelerationStrategies: { type: 'array' },
    optimizationEffectiveness: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Adaptive Process Optimization: ${inputs.projectName}`,
      agent: {
        role: 'adaptive-optimization-specialist',
        goal: `Implement dynamic process optimizations for ${inputs.projectName}`,
        instructions: [
          '=== ADAPTIVE OPTIMIZATION FRAMEWORK ===',
          'Implement sophisticated process optimizations:',

          '=== DYNAMIC PARAMETER ADJUSTMENT ===',
          '1. ITERATION TIMING OPTIMIZATION',
          '   - Adjust iteration frequency based on learning velocity',
          '   - Optimize stakeholder engagement timing for maximum effectiveness',
          '   - Dynamic adjustment of convergence thresholds based on quality trends',
          '   - Adaptive resource allocation timing for optimal impact',
          '   - Real-time adjustment of parallel vs. sequential processing',

          '2. QUALITY THRESHOLD ADAPTATION',
          '   - Dynamically adjust quality targets based on achieved progress',
          '   - Adapt quality criteria based on stakeholder feedback patterns',
          '   - Optimize quality vs. speed trade-offs based on business value',
          '   - Adjust multi-dimensional quality weighting based on project priorities',
          '   - Dynamic calibration of quality measurement sensitivity',

          '=== STAKEHOLDER ENGAGEMENT OPTIMIZATION ===',
          '1. ENGAGEMENT PATTERN OPTIMIZATION',
          '   - Optimize stakeholder interaction frequency and intensity',
          '   - Adapt communication methods based on stakeholder preferences and effectiveness',
          '   - Dynamic adjustment of stakeholder group composition and involvement',
          '   - Optimize timing of critical stakeholder decisions',
          '   - Adaptive stakeholder workload management to prevent fatigue',

          '2. CONSENSUS BUILDING ACCELERATION',
          '   - Implement targeted interventions for stakeholder alignment issues',
          '   - Optimize facilitation approaches based on stakeholder dynamics',
          '   - Dynamic conflict resolution strategy selection',
          '   - Accelerated consensus protocols for time-critical decisions',
          '   - Adaptive stakeholder influence mapping and engagement strategies',

          '=== LEARNING AND KNOWLEDGE OPTIMIZATION ===',
          '1. LEARNING VELOCITY ENHANCEMENT',
          '   - Implement targeted knowledge injection strategies',
          '   - Optimize cross-phase learning transfer mechanisms',
          '   - Dynamic expert consultation scheduling for maximum impact',
          '   - Accelerated validation protocols for high-confidence insights',
          '   - Adaptive depth vs. breadth optimization for knowledge exploration',

          '2. KNOWLEDGE INTEGRATION ACCELERATION',
          '   - Optimize knowledge synthesis approaches for faster integration',
          '   - Dynamic prioritization of knowledge gaps for targeted research',
          '   - Accelerated pattern recognition through enhanced analytical approaches',
          '   - Optimized documentation strategies for knowledge capture and retrieval',
          '   - Adaptive knowledge sharing mechanisms between stakeholder groups',

          '=== RESOURCE ALLOCATION OPTIMIZATION ===',
          '1. DYNAMIC RESOURCE REALLOCATION',
          '   - Reallocate effort to phases showing highest return on investment',
          '   - Optimize expertise allocation based on current bottlenecks',
          '   - Dynamic time allocation adjustment based on progress patterns',
          '   - Adaptive technology resource allocation for maximum efficiency',
          '   - Optimize cross-functional team composition based on emerging needs',

          '2. EFFICIENCY BOTTLENECK RESOLUTION',
          '   - Implement targeted interventions for identified process bottlenecks',
          '   - Optimize parallel processing opportunities to accelerate delivery',
          '   - Dynamic workflow redesign for improved efficiency',
          '   - Adaptive automation of repetitive analysis tasks',
          '   - Optimize decision-making pathways to reduce delays',

          '=== RISK MITIGATION ENHANCEMENT ===',
          '1. PROACTIVE RISK INTERVENTION',
          '   - Implement early intervention strategies for identified risks',
          '   - Dynamic risk monitoring intensity based on risk probability',
          '   - Adaptive contingency plan activation based on warning signals',
          '   - Optimize risk communication strategies to stakeholders',
          '   - Dynamic risk tolerance adjustment based on project progress',

          '2. RESILIENCE BUILDING OPTIMIZATION',
          '   - Implement targeted resilience enhancements for vulnerable areas',
          '   - Optimize backup strategy deployment based on failure probability',
          '   - Dynamic redundancy creation for critical process elements',
          '   - Adaptive stress testing intensity based on risk profile changes',
          '   - Optimize recovery protocol effectiveness through targeted improvements',

          '=== OPTIMIZATION EFFECTIVENESS MEASUREMENT ===',
          'Track optimization impact across key dimensions:',
          '- EFFICIENCY GAINS: Measurable improvements in process efficiency',
          '- QUALITY IMPROVEMENTS: Enhanced quality outcomes from optimizations',
          '- STAKEHOLDER SATISFACTION: Improved stakeholder experience and engagement',
          '- RISK REDUCTION: Decreased probability and impact of identified risks',
          '- LEARNING ACCELERATION: Faster knowledge acquisition and integration',
          '- CONVERGENCE VELOCITY: Improved rate of progress toward targets',

          'Provide specific, implementable optimization recommendations with clear success metrics.'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          convergenceAnalysis: inputs.convergenceAnalysis,
          resilienceAnalysis: inputs.resilienceAnalysis,
          processContext: inputs.processContext,
          optimizationTargets: inputs.optimizationTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptive-optimization', 'dynamic-adjustment', 'efficiency-enhancement', 'performance-optimization']
    };
  }
});

/**
 * Task: Emergent Behavior Detection
 * Purpose: Detect and analyze emergent behaviors and breakthrough opportunities during process execution
 */
const emergentBehaviorDetectionTask = defineTask({
  name: 'emergent-behavior-detection',
  description: 'Advanced detection and analysis of emergent behaviors and breakthrough opportunities',

  inputs: {
    projectName: { type: 'string', required: true },
    allResults: { type: 'object', required: true },
    processContext: { type: 'object', required: true },
    convergenceHistory: { type: 'array', required: true },
    multiLevelLearning: { type: 'object', required: true },
    innovationPatterns: { type: 'array', default: [] }
  },

  outputs: {
    detectedBehaviors: { type: 'array' },
    breakthroughIndicators: { type: 'array' },
    emergentPatterns: { type: 'array' },
    unexpectedSynergies: { type: 'array' },
    paradigmShiftSignals: { type: 'array' },
    recommendedActions: { type: 'array' },
    explorationOpportunities: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Emergent Behavior Detection: ${inputs.projectName}`,
      agent: {
        role: 'emergent-behavior-detection-specialist',
        goal: `Detect emergent behaviors and breakthrough opportunities in ${inputs.projectName}`,
        instructions: [
          '=== EMERGENT BEHAVIOR DETECTION FRAMEWORK ===',
          'Apply systematic emergence detection methodology:',

          '=== UNEXPECTED SYNERGY IDENTIFICATION ===',
          '1. CROSS-PHASE EMERGENT PROPERTIES',
          '   - Identify unexpected beneficial interactions between different phases',
          '   - Detect emergent capabilities not present in individual phases',
          '   - Analyze compound effects that exceed expected linear combinations',
          '   - Identify emergent quality dimensions not originally anticipated',
          '   - Detect unexpected stakeholder collaboration patterns',

          '2. KNOWLEDGE SYNTHESIS EMERGENCE',
          '   - Identify novel insights arising from knowledge integration',
          '   - Detect emergent understanding transcending individual domain knowledge',
          '   - Analyze unexpected connections between disparate knowledge areas',
          '   - Identify emergent patterns in stakeholder mental models',
          '   - Detect novel problem-solution relationships emerging from the process',

          '=== BREAKTHROUGH OPPORTUNITY DETECTION ===',
          '1. INNOVATION BREAKTHROUGH SIGNALS',
          '   - Identify moments where creative solutions emerged unexpectedly',
          '   - Detect when stakeholder insights led to fundamental shifts in approach',
          '   - Analyze instances where constraints led to innovative workarounds',
          '   - Identify breakthrough moments in stakeholder consensus building',
          '   - Detect when adversarial review triggered transformational insights',

          '2. PARADIGM SHIFT IDENTIFICATION',
          '   - Identify when fundamental assumptions about the domain were challenged',
          '   - Detect shifts in how stakeholders conceptualize the problem space',
          '   - Analyze moments where the solution approach fundamentally changed',
          '   - Identify emergent new frameworks for understanding the domain',
          '   - Detect when the process itself evolved beyond original methodology',

          '=== PATTERN EMERGENCE ANALYSIS ===',
          '1. NOVEL PATTERN RECOGNITION',
          '   - Identify completely new patterns not seen in historical projects',
          '   - Detect unique combinations of existing patterns creating new behaviors',
          '   - Analyze patterns specific to this project\'s unique characteristics',
          '   - Identify emergent best practices arising from this specific context',
          '   - Detect novel failure patterns and their unexpected resolutions',

          '2. EVOLUTIONARY PATTERN DEVELOPMENT',
          '   - Analyze how patterns evolved and adapted during process execution',
          '   - Identify pattern mutations that led to improved outcomes',
          '   - Detect pattern convergence creating new stable configurations',
          '   - Analyze pattern resilience and adaptation under stress conditions',
          '   - Identify pattern scalability beyond original context',

          '=== UNEXPECTED STAKEHOLDER DYNAMICS ===',
          '1. EMERGENT COLLABORATION PATTERNS',
          '   - Identify unexpected stakeholder alliances and partnerships',
          '   - Detect emergent leadership patterns not present in formal structure',
          '   - Analyze unexpected knowledge transfer pathways between stakeholders',
          '   - Identify emergent communication patterns improving consensus',
          '   - Detect unexpected stakeholder capacity emergence under pressure',

          '2. CONSENSUS EMERGENCE PHENOMENA',
          '   - Analyze moments where consensus emerged despite initial disagreement',
          '   - Identify tipping points where stakeholder alignment accelerated',
          '   - Detect emergent shared understanding transcending individual perspectives',
          '   - Analyze unexpected conflict resolution through creative synthesis',
          '   - Identify emergent stakeholder motivation patterns',

          '=== METHODOLOGY EVOLUTION DETECTION ===',
          '1. PROCESS ADAPTATION EMERGENCE',
          '   - Identify ways the methodology adapted beyond original design',
          '   - Detect emergent process optimizations discovered during execution',
          '   - Analyze unexpected integration of different methodological approaches',
          '   - Identify emergent quality criteria not originally considered',
          '   - Detect process resilience mechanisms that evolved organically',

          '2. META-LEARNING BREAKTHROUGH IDENTIFICATION',
          '   - Identify moments where learning about learning created breakthroughs',
          '   - Detect emergent meta-cognitive strategies improving process effectiveness',
          '   - Analyze unexpected learning transfer between different abstraction levels',
          '   - Identify emergent feedback loops accelerating overall progress',
          '   - Detect breakthrough moments in process intelligence development',

          '=== EXPLORATION OPPORTUNITY IDENTIFICATION ===',
          '1. UNEXPLORED POTENTIAL ANALYSIS',
          '   - Identify promising directions that emerged but weren\'t fully explored',
          '   - Detect potential applications of emergent insights to other domains',
          '   - Analyze scalability potential of emergent patterns and behaviors',
          '   - Identify research opportunities arising from unexpected discoveries',
          '   - Detect potential for methodology generalization beyond current context',

          '2. INNOVATION AMPLIFICATION OPPORTUNITIES',
          '   - Identify ways to systematically reproduce successful emergent behaviors',
          '   - Detect opportunities to accelerate similar emergence in future projects',
          '   - Analyze potential for creating favorable conditions for breakthrough emergence',
          '   - Identify ways to scale emergent innovations across larger contexts',
          '   - Detect opportunities for methodology innovation based on emergent insights',

          '=== COMPREHENSIVE EMERGENCE ASSESSMENT ===',
          'Provide detailed analysis of emergent phenomena:',
          '- EMERGENCE SIGNIFICANCE: Impact and importance of detected behaviors',
          '- REPRODUCIBILITY ANALYSIS: Whether emergent behaviors can be systematically reproduced',
          '- SCALABILITY POTENTIAL: How emergent behaviors could be applied more broadly',
          '- INNOVATION IMPLICATIONS: How emergence changes understanding of the domain',
          '- METHODOLOGY IMPACT: How emergence should influence future methodology design',
          '- BREAKTHROUGH POTENTIAL: Which emergent behaviors indicate breakthrough opportunities',

          'Focus on identifying actionable emergence that can enhance current and future projects.'
        ],
        context: {
          projectName: inputs.projectName,
          allResults: inputs.allResults,
          processContext: inputs.processContext,
          convergenceHistory: inputs.convergenceHistory,
          multiLevelLearning: inputs.multiLevelLearning,
          innovationPatterns: inputs.innovationPatterns
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['emergent-behavior', 'breakthrough-detection', 'pattern-emergence', 'innovation-discovery']
    };
  }
});

/**
 * Task: Evidence-Based Validation and Management
 * Purpose: Comprehensive validation and management of evidence supporting all ontology claims
 */
const evidenceValidationManagementTask = defineTask({
  name: 'evidence-validation-management',
  description: 'Comprehensive validation, quality assessment, and management of evidence supporting ontology claims',

  inputs: {
    projectName: { type: 'string', required: true },
    phaseResult: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    phaseName: { type: 'string', required: true },
    claimsToValidate: { type: 'array', default: [] },
    validationDepth: { type: 'string', default: 'comprehensive' },
    stakeholderContext: { type: 'string', default: 'multi-team' }
  },

  outputs: {
    validatedEvidence: { type: 'object' },
    evidenceQualityReport: { type: 'object' },
    sourceCredibilityAnalysis: { type: 'object' },
    evidenceGaps: { type: 'array' },
    conflictResolution: { type: 'array' },
    biasAssessment: { type: 'object' },
    confidenceLevels: { type: 'object' },
    updatedEvidenceFramework: { type: 'object' },
    stakeholderVerificationGuides: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Evidence Validation & Management: ${inputs.phaseName} - ${inputs.projectName}`,
      agent: {
        role: 'evidence-validation-specialist',
        goal: `Validate and manage evidence supporting ${inputs.phaseName} phase claims for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE EVIDENCE VALIDATION FRAMEWORK ===',
          'Apply systematic evidence validation methodology with rigorous quality assessment.',

          '=== SOURCE CREDIBILITY ASSESSMENT ===',
          '**AUTHORITY VALIDATION**:',
          '- Verify author/organization expertise and domain recognition',
          '- Check institutional affiliations and credentials',
          '- Assess track record of accuracy and reliability',
          '- Evaluate peer recognition and citation patterns',
          '- Document any conflicts of interest or biases',

          '**METHODOLOGICAL RIGOR ASSESSMENT**:',
          '- Evaluate research methodology transparency and quality',
          '- Assess sample sizes, controls, and statistical validity',
          '- Check for proper peer review and publication standards',
          '- Validate data collection and analysis procedures',
          '- Assess reproducibility and replication potential',

          '**INDEPENDENCE AND OBJECTIVITY**:',
          '- Identify funding sources and potential conflicts',
          '- Assess commercial or political motivations',
          '- Evaluate independence from interested parties',
          '- Check for disclosure of limitations and uncertainties',
          '- Assess balanced consideration of alternative viewpoints',

          '=== MULTI-SOURCE TRIANGULATION ===',
          '**CROSS-VALIDATION PROTOCOL**:',
          '- For critical claims: Require minimum 3 independent, high-quality sources',
          '- For important claims: Require minimum 2 independent sources',
          '- For supporting details: Require 1 high-quality source',
          '- For controversial claims: Require additional expert validation',
          '- Document validation methodology and decision criteria',

          '**CONSISTENCY ANALYSIS**:',
          '- Compare findings across multiple independent sources',
          '- Identify areas of consensus and disagreement',
          '- Analyze reasons for discrepancies when they exist',
          '- Assess whether differences are methodological or substantive',
          '- Document confidence levels based on source agreement',

          '=== EVIDENCE QUALITY SCORING ===',
          '**COMPREHENSIVE QUALITY METRICS (1-10 scale)**:',
          '- SOURCE AUTHORITY (expertise, recognition, credentials): Weight 25%',
          '- METHODOLOGICAL RIGOR (transparency, validity, controls): Weight 25%',
          '- INDEPENDENCE (objectivity, conflict-free, unbiased): Weight 20%',
          '- CURRENCY (recency, ongoing relevance, updates): Weight 15%',
          '- VERIFIABILITY (accessible, reproducible, traceable): Weight 15%',

          '**EVIDENCE STRENGTH CLASSIFICATION**:',
          '- STRONG EVIDENCE (8-10): High confidence, multiple high-quality sources',
          '- MODERATE EVIDENCE (6-7): Reasonable confidence, good sources with minor limitations',
          '- WEAK EVIDENCE (4-5): Limited confidence, few sources or methodological concerns',
          '- INSUFFICIENT EVIDENCE (1-3): Very low confidence, poor sources or major gaps',

          '=== BIAS IDENTIFICATION AND MITIGATION ===',
          '**SYSTEMATIC BIAS ASSESSMENT**:',
          '- SELECTION BIAS: Are we selecting sources that confirm preconceptions?',
          '- CONFIRMATION BIAS: Are we interpreting ambiguous evidence favorably?',
          '- AVAILABILITY BIAS: Are we overweighting easily accessible sources?',
          '- AUTHORITY BIAS: Are we accepting claims without validation due to source prestige?',
          '- RECENCY BIAS: Are we overweighting recent information vs. historical patterns?',
          '- COMMERCIAL BIAS: Are commercial interests influencing source claims?',

          '**BIAS MITIGATION STRATEGIES**:',
          '- Actively seek disconfirming evidence and alternative interpretations',
          '- Use systematic search strategies rather than convenience sampling',
          '- Apply consistent evaluation criteria across all sources',
          '- Engage independent validators to check assessment bias',
          '- Document potential biases and mitigation efforts taken',

          '=== CONFLICT RESOLUTION METHODOLOGY ===',
          '**EVIDENCE CONFLICT ANALYSIS**:',
          '- Identify specific points of disagreement between sources',
          '- Analyze methodological differences that might explain conflicts',
          '- Assess temporal factors (different time periods, changing conditions)',
          '- Evaluate scope differences (different populations, contexts, definitions)',
          '- Consider cultural or geographic factors affecting findings',

          '**CONFLICT RESOLUTION STRATEGIES**:',
          '- METHODOLOGICAL SUPERIORITY: Prioritize sources with stronger methodology',
          '- TEMPORAL RELEVANCE: Weight more recent evidence when conditions have changed',
          '- SCOPE ALIGNMENT: Prioritize sources most relevant to specific context',
          '- EXPERT ADJUDICATION: Engage domain experts to resolve complex conflicts',
          '- UNCERTAINTY ACKNOWLEDGMENT: Document unresolved conflicts with confidence bounds',

          '=== CONFIDENCE LEVEL QUANTIFICATION ===',
          '**CONFIDENCE INTERVAL ESTIMATION**:',
          '- Provide specific confidence levels (e.g., 85% confident in claim X)',
          '- Document basis for confidence assessment (source quality, consistency, scope)',
          '- Identify factors that would increase or decrease confidence',
          '- Provide uncertainty bounds for quantitative claims',
          '- Distinguish between statistical confidence and epistemic uncertainty',

          '**UNCERTAINTY COMMUNICATION**:',
          '- Use clear, standardized language for uncertainty levels',
          '- Provide specific uncertainty quantification where possible',
          '- Explain practical implications of uncertainty levels',
          '- Identify decision points where uncertainty levels matter',
          '- Create stakeholder-accessible uncertainty summaries',

          '=== EVIDENCE GAP IDENTIFICATION ===',
          '**SYSTEMATIC GAP ANALYSIS**:',
          '- Map ontology claims against available evidence',
          '- Identify claims with insufficient evidence support',
          '- Assess criticality of evidence gaps for decision-making',
          '- Prioritize gaps based on impact and feasibility of filling',
          '- Document research needed to address priority gaps',

          '**GAP FILLING STRATEGIES**:',
          '- PRIMARY RESEARCH: Areas requiring original data collection and research studies',
          '- EXPERIMENTAL DESIGN: Design and conduct experiments to generate missing evidence',
          '- EMPIRICAL VALIDATION: Create validation studies for ontology claims requiring verification',
          '- COLLABORATIVE RESEARCH: Organize multi-stakeholder studies for complex evidence needs',
          '- EXPERT CONSULTATION: Topics needing specialist input and validation',
          '- LITERATURE SEARCH: Systematic search for overlooked sources',
          '- STAKEHOLDER INPUT: Areas where practitioner knowledge is crucial',
          '- HYPOTHESIS TESTING: Generate and test hypotheses for uncertain domain aspects',

          '=== STAKEHOLDER VERIFICATION GUIDES ===',
          '**ACCESSIBILITY ASSESSMENT**:',
          '- Evaluate whether stakeholders can access primary sources',
          '- Identify paywalls, technical barriers, or language issues',
          '- Create alternative access strategies for critical evidence',
          '- Provide source summaries for inaccessible materials',
          '- Design verification pathways appropriate for different stakeholder types',

          '**VERIFICATION PROTOCOL DESIGN**:',
          '- Create step-by-step verification guides for key claims',
          '- Provide specific source locations and access instructions',
          '- Design simplified verification methods for non-experts',
          '- Include cross-reference strategies for additional validation',
          '- Create escalation procedures when verification questions arise',

          '=== COMPREHENSIVE EVIDENCE DOCUMENTATION ===',
          '**EVIDENCE REPOSITORY STRUCTURE**:',
          '- Complete source catalog with full bibliographic information',
          '- Evidence quality scores and assessment justifications',
          '- Cross-reference mapping between claims and supporting evidence',
          '- Conflict documentation and resolution explanations',
          '- Bias assessment results and mitigation strategies implemented',

          '**AUDIT TRAIL REQUIREMENTS**:',
          '- Document all evidence evaluation decisions and criteria',
          '- Maintain version control for evidence updates and changes',
          '- Track source credibility changes over time',
          '- Record stakeholder verification activities and results',
          '- Preserve original sources and assessment contexts',

          'Provide detailed, actionable evidence validation results with clear stakeholder verification pathways.'
        ],
        context: {
          projectName: inputs.projectName,
          phaseResult: inputs.phaseResult,
          evidenceFramework: inputs.evidenceFramework,
          phaseName: inputs.phaseName,
          claimsToValidate: inputs.claimsToValidate,
          validationDepth: inputs.validationDepth,
          stakeholderContext: inputs.stakeholderContext
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['evidence-validation', 'source-credibility', 'bias-assessment', 'quality-control']
    };
  }
});

/**
 * Task: Schema Validation and Research
 * Purpose: Self-validation and research on current schema for adaptive improvement
 */
const schemaValidationResearchTask = defineTask({
  name: 'schema-validation-research',
  description: 'Comprehensive self-validation and research on current schema for adaptive improvement',

  inputs: {
    projectName: { type: 'string', required: true },
    currentSchema: { type: 'object', required: true },
    allResults: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    validationFramework: { type: 'object', required: true },
    reinforcementLearningFramework: { type: 'object', required: true },
    adaptationIteration: { type: 'number', default: 1 },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' }
  },

  outputs: {
    validationResults: { type: 'object' },
    researchFindings: { type: 'object' },
    improvementOpportunities: { type: 'array' },
    qualityAssessment: { type: 'object' },
    consistencyAnalysis: { type: 'object' },
    completenessGaps: { type: 'array' },
    performanceAnalysis: { type: 'object' },
    usabilityFeedback: { type: 'object' },
    evolutionRecommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Schema Validation Research: ${inputs.projectName} (Cycle ${inputs.adaptationIteration})`,
      agent: {
        role: 'schema-validation-researcher',
        goal: `Conduct comprehensive self-validation and research on current schema for ${inputs.projectName}`,
        instructions: [
          '=== REINFORCEMENT LEARNING SCHEMA VALIDATION FRAMEWORK ===',
          'Apply systematic self-validation and research methodology for adaptive schema improvement.',

          '=== COMPREHENSIVE SCHEMA SELF-ANALYSIS ===',
          '**LOGICAL CONSISTENCY VALIDATION**:',
          '- Apply formal logic checking for internal consistency',
          '- Identify logical contradictions, circular dependencies, ambiguities',
          '- Validate inference rules and logical relationships',
          '- Check for completeness of logical coverage',
          '- Assess soundness of ontological commitments',

          '**EMPIRICAL VALIDATION RESEARCH**:',
          '- Research real-world implementations of similar schemas',
          '- Validate schema against actual domain data and use cases',
          '- Test schema expressiveness with concrete examples',
          '- Identify gaps between schema and real-world complexity',
          '- Validate schema scalability with realistic data volumes',

          '**CROSS-VALIDATION AGAINST STANDARDS**:',
          '- Compare with established industry standards and frameworks',
          '- Validate against domain-specific ontology best practices',
          '- Check alignment with relevant ISO, IEEE, W3C standards',
          '- Assess compatibility with existing enterprise systems',
          '- Validate interoperability with standard protocols',

          '=== ADVERSARIAL SCHEMA TESTING ===',
          '**SYSTEMATIC CHALLENGE METHODOLOGY**:',
          '- Design adversarial test cases to stress-test schema limits',
          '- Generate edge cases and boundary condition scenarios',
          '- Test schema robustness under various failure conditions',
          '- Challenge fundamental assumptions underlying schema design',
          '- Identify potential misuse or misinterpretation scenarios',

          '**ALTERNATIVE DESIGN EXPLORATION**:',
          '- Research alternative schema design approaches',
          '- Explore different ontological frameworks for same domain',
          '- Investigate emerging patterns and innovations in schema design',
          '- Assess trade-offs between different design choices',
          '- Identify opportunities for paradigmatic improvements',

          '=== PERFORMANCE AND SCALABILITY ANALYSIS ===',
          '**COMPUTATIONAL PERFORMANCE RESEARCH**:',
          '- Analyze query complexity and performance implications',
          '- Research computational complexity of inference operations',
          '- Assess memory and storage requirements for schema implementation',
          '- Validate performance scalability with growing data',
          '- Identify performance bottlenecks and optimization opportunities',

          '**MAINTENANCE AND EVOLUTION ANALYSIS**:',
          '- Assess schema maintainability and update complexity',
          '- Research schema versioning and backward compatibility',
          '- Analyze impact of potential future changes',
          '- Evaluate schema flexibility for emerging requirements',
          '- Assess long-term sustainability of current design',

          '=== STAKEHOLDER AND USABILITY VALIDATION ===',
          '**COMPREHENSIVE USABILITY RESEARCH**:',
          '- Research user experience with similar schemas',
          '- Validate schema comprehensibility for different stakeholder types',
          '- Assess learnability and cognitive load for schema users',
          '- Research accessibility and inclusive design considerations',
          '- Validate schema utility for actual user workflows',

          '**STAKEHOLDER VALUE VALIDATION**:',
          '- Research business value delivery of current schema design',
          '- Validate alignment with stakeholder goals and requirements',
          '- Assess schema support for decision-making processes',
          '- Research integration impact on stakeholder workflows',
          '- Validate schema contributions to organizational objectives',

          '=== IMPROVEMENT OPPORTUNITY IDENTIFICATION ===',
          '**SYSTEMATIC GAP ANALYSIS**:',
          '- Identify coverage gaps in domain representation',
          '- Assess precision gaps in concept definitions',
          '- Find expressiveness gaps for complex domain scenarios',
          '- Identify integration gaps with external systems',
          '- Assess governance gaps in schema management',

          '**INNOVATION OPPORTUNITY RESEARCH**:',
          '- Research emerging technologies applicable to schema enhancement',
          '- Identify opportunities for AI/ML integration in schema design',
          '- Explore semantic web and linked data enhancement possibilities',
          '- Research automation opportunities for schema validation',
          '- Identify opportunities for dynamic schema adaptation',

          '=== EVIDENCE-BASED VALIDATION METHODOLOGY ===',
          '**RESEARCH EVIDENCE INTEGRATION**:',
          '- Systematically collect evidence supporting current schema design',
          '- Research counter-evidence and alternative approaches',
          '- Validate schema decisions against empirical research',
          '- Assess strength of evidence for schema design choices',
          '- Identify evidence gaps requiring additional research',

          '**VALIDATION CONFIDENCE ASSESSMENT**:',
          '- Quantify confidence levels for different schema components',
          '- Assess uncertainty and risk in current schema design',
          '- Identify high-confidence vs. speculative schema elements',
          '- Provide uncertainty bounds for schema validation claims',
          '- Document assumptions requiring empirical validation',

          'Provide detailed validation results with specific improvement recommendations and confidence assessments.',

          `Context: Adaptation iteration ${inputs.adaptationIteration} for ${inputs.domainType} domain`
        ],
        context: {
          projectName: inputs.projectName,
          currentSchema: inputs.currentSchema,
          allResults: inputs.allResults,
          evidenceFramework: inputs.evidenceFramework,
          validationFramework: inputs.validationFramework,
          reinforcementLearningFramework: inputs.reinforcementLearningFramework,
          adaptationIteration: inputs.adaptationIteration,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['schema-validation', 'self-research', 'adaptive-improvement', 'reinforcement-learning']
    };
  }
});

/**
 * Task: Adaptation Opportunity Analysis
 * Purpose: Analyze validation results to identify and prioritize adaptation opportunities
 */
const adaptationOpportunityAnalysisTask = defineTask({
  name: 'adaptation-opportunity-analysis',
  description: 'Analyze validation results to identify and prioritize schema/ontology adaptation opportunities',

  inputs: {
    projectName: { type: 'string', required: true },
    validationResults: { type: 'object', required: true },
    currentSchema: { type: 'object', required: true },
    adaptationHistory: { type: 'array', default: [] },
    evidenceFramework: { type: 'object', required: true },
    qualityTargets: { type: 'object', required: true }
  },

  outputs: {
    significantImprovementPotential: { type: 'boolean' },
    adaptationRecommended: { type: 'boolean' },
    opportunities: { type: 'array' },
    recommendedStrategy: { type: 'object' },
    selfAssessment: { type: 'object' },
    futureOpportunities: { type: 'array' },
    riskAnalysis: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Adaptation Opportunity Analysis: ${inputs.projectName}`,
      agent: {
        role: 'adaptation-opportunity-analyst',
        goal: `Analyze validation results and identify adaptation opportunities for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE OPPORTUNITY ANALYSIS FRAMEWORK ===',
          'Systematically analyze validation results to identify high-impact adaptation opportunities.',

          '=== IMPROVEMENT POTENTIAL ASSESSMENT ===',
          '**QUANTITATIVE IMPACT ANALYSIS**:',
          '- Calculate potential quality improvements for each identified opportunity',
          '- Assess business value impact of different adaptation scenarios',
          '- Quantify risk reduction potential from addressing validation issues',
          '- Estimate performance improvements from optimization opportunities',
          '- Calculate stakeholder satisfaction improvements from usability enhancements',

          '**SIGNIFICANCE THRESHOLD EVALUATION**:',
          '- Apply significance thresholds for different types of improvements',
          '- Consider cumulative impact of multiple small improvements',
          '- Assess strategic importance beyond immediate quality gains',
          '- Evaluate long-term benefits vs. short-term implementation costs',
          '- Consider network effects and cascading improvement potential',

          '=== ADAPTATION STRATEGY SELECTION ===',
          '**STRATEGY EVALUATION CRITERIA**:',
          '- IMPACT: Magnitude of potential improvement',
          '- FEASIBILITY: Technical and organizational implementation difficulty',
          '- RISK: Potential negative consequences of adaptation',
          '- TIMELINE: Speed of implementation and benefit realization',
          '- SUSTAINABILITY: Long-term maintenance and evolution requirements',

          '**ADAPTIVE STRATEGY OPTIONS**:',
          '- INCREMENTAL ENHANCEMENT: Small improvements within current framework',
          '- STRUCTURAL REFINEMENT: Moderate changes to schema/ontology structure',
          '- PARADIGMATIC EVOLUTION: Fundamental approach or framework changes',
          '- REVOLUTIONARY REDESIGN: Complete rethinking of schema/ontology design',
          '- HYBRID ADAPTATION: Combination of different adaptation approaches',

          '=== SELF-ASSESSMENT AND META-LEARNING ===',
          '**PROCESS SELF-EVALUATION**:',
          '- Assess quality of own validation and analysis processes',
          '- Identify biases in opportunity identification and evaluation',
          '- Evaluate accuracy of previous adaptation predictions',
          '- Assess completeness of current analysis framework',
          '- Identify gaps in analytical methodology',

          '**LEARNING INTEGRATION**:',
          '- Learn from patterns in adaptation history',
          '- Identify successful adaptation strategies from past cycles',
          '- Learn from unsuccessful or suboptimal adaptations',
          '- Integrate stakeholder feedback on adaptation effectiveness',
          '- Evolve analysis methodology based on accumulated experience',

          '=== RISK-BENEFIT OPTIMIZATION ===',
          '**COMPREHENSIVE RISK ANALYSIS**:',
          '- Technical risks: Implementation complexity, performance impact, compatibility issues',
          '- Business risks: Stakeholder disruption, timeline impact, resource requirements',
          '- Organizational risks: Change management challenges, skill requirements, adoption barriers',
          '- Strategic risks: Alignment with long-term goals, future flexibility, competitive impact',

          '**OPTIMIZATION METHODOLOGY**:',
          '- Multi-objective optimization balancing improvement potential and implementation risk',
          '- Portfolio approach considering interactions between multiple adaptations',
          '- Sensitivity analysis for different risk tolerance levels',
          '- Scenario planning for different implementation approaches',
          '- Contingency planning for adaptation failures or unexpected outcomes',

          'Provide clear recommendations with detailed justification and confidence levels.'
        ],
        context: {
          projectName: inputs.projectName,
          validationResults: inputs.validationResults,
          currentSchema: inputs.currentSchema,
          adaptationHistory: inputs.adaptationHistory,
          evidenceFramework: inputs.evidenceFramework,
          qualityTargets: inputs.qualityTargets
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['adaptation-analysis', 'opportunity-assessment', 'strategy-selection', 'risk-analysis']
    };
  }
});

/**
 * Task: Schema Adaptation
 * Purpose: Execute schema adaptations based on validation learning
 */
const schemaAdaptationTask = defineTask({
  name: 'schema-adaptation',
  description: 'Execute schema adaptations based on validation learning and opportunity analysis',

  inputs: {
    projectName: { type: 'string', required: true },
    currentSchema: { type: 'object', required: true },
    adaptationOpportunities: { type: 'array', required: true },
    validationResults: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    adaptationStrategy: { type: 'object', required: true }
  },

  outputs: {
    adaptedSchema: { type: 'object' },
    improvements: { type: 'array' },
    qualityImprovement: { type: 'number' },
    evolutionRecord: { type: 'object' },
    validationResults: { type: 'object' },
    stakeholderImpactAnalysis: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Schema Adaptation: ${inputs.projectName}`,
      agent: {
        role: 'schema-adaptation-specialist',
        goal: `Execute systematic schema adaptations for ${inputs.projectName}`,
        instructions: [
          '=== SYSTEMATIC SCHEMA ADAPTATION FRAMEWORK ===',
          'Execute evidence-based schema adaptations with comprehensive validation and impact analysis.',

          '=== ADAPTATION IMPLEMENTATION METHODOLOGY ===',
          '**STRUCTURED ADAPTATION PROCESS**:',
          '1. BASELINE ESTABLISHMENT: Document current schema state and quality metrics',
          '2. ADAPTATION DESIGN: Design specific schema modifications addressing identified opportunities',
          '3. IMPACT ANALYSIS: Analyze potential impacts on existing ontology and stakeholders',
          '4. VALIDATION PLANNING: Design validation approach for adapted schema',
          '5. IMPLEMENTATION: Execute schema modifications with version control',
          '6. VALIDATION EXECUTION: Validate adapted schema against requirements',
          '7. QUALITY MEASUREMENT: Measure quality improvements from adaptations',
          '8. STAKEHOLDER REVIEW: Assess stakeholder impact and satisfaction',

          '=== EVIDENCE-BASED ADAPTATION DESIGN ===',
          '**RESEARCH-INFORMED MODIFICATIONS**:',
          '- Base all adaptations on validated research and evidence',
          '- Maintain complete traceability from evidence to adaptation decisions',
          '- Document rationale for each modification with supporting evidence',
          '- Consider alternative adaptation approaches with evidence comparison',
          '- Validate adaptation decisions against domain expertise and standards',

          '**SYSTEMATIC MODIFICATION PLANNING**:',
          '- Plan adaptations to minimize disruption while maximizing improvement',
          '- Consider dependencies between different schema modifications',
          '- Design backward compatibility strategies where required',
          '- Plan migration pathways for existing ontology content',
          '- Design rollback strategies for problematic adaptations',

          '=== COMPREHENSIVE VALIDATION OF ADAPTATIONS ===',
          '**MULTI-LEVEL VALIDATION APPROACH**:',
          '- FORMAL VALIDATION: Logical consistency, completeness, soundness checking',
          '- EMPIRICAL VALIDATION: Testing with real-world data and use cases',
          '- PERFORMANCE VALIDATION: Computational performance and scalability testing',
          '- USABILITY VALIDATION: Stakeholder comprehensibility and utility assessment',
          '- INTEGRATION VALIDATION: Compatibility with existing systems and processes',

          '**COMPARATIVE QUALITY ASSESSMENT**:',
          '- Compare adapted schema quality against baseline measurements',
          '- Measure improvements in coverage, precision, consistency, usability',
          '- Assess performance improvements in query execution and reasoning',
          '- Evaluate stakeholder satisfaction improvements',
          '- Quantify business value enhancements from adaptations',

          '=== STAKEHOLDER IMPACT MANAGEMENT ===',
          '**COMPREHENSIVE IMPACT ANALYSIS**:',
          '- Analyze impact on different stakeholder groups and workflows',
          '- Assess training and adaptation requirements for stakeholders',
          '- Evaluate impact on existing tools and integrations',
          '- Consider organizational change management requirements',
          '- Plan communication and rollout strategies for adaptations',

          '**STAKEHOLDER ENGAGEMENT STRATEGY**:',
          '- Design stakeholder review and feedback collection processes',
          '- Create stakeholder-specific adaptation summaries and benefits',
          '- Plan training and support for stakeholders adapting to changes',
          '- Establish feedback channels for ongoing adaptation refinement',
          '- Design stakeholder validation and acceptance criteria',

          '=== EVOLUTION DOCUMENTATION AND LEARNING ===',
          '**COMPREHENSIVE EVOLUTION RECORDS**:',
          '- Document complete adaptation process with decisions and rationale',
          '- Record lessons learned and best practices from adaptation process',
          '- Capture stakeholder feedback and adaptation effectiveness',
          '- Document successful and unsuccessful adaptation strategies',
          '- Create reusable patterns and guidelines for future adaptations',

          '**CONTINUOUS LEARNING INTEGRATION**:',
          '- Extract generalizable insights from specific adaptations',
          '- Identify adaptation patterns that can be systematized',
          '- Learn from adaptation failures and near-misses',
          '- Update adaptation methodology based on experience',
          '- Build knowledge base of effective adaptation strategies',

          'Execute adaptations systematically with comprehensive documentation and stakeholder consideration.'
        ],
        context: {
          projectName: inputs.projectName,
          currentSchema: inputs.currentSchema,
          adaptationOpportunities: inputs.adaptationOpportunities,
          validationResults: inputs.validationResults,
          evidenceFramework: inputs.evidenceFramework,
          stakeholderContext: inputs.stakeholderContext,
          adaptationStrategy: inputs.adaptationStrategy
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['schema-adaptation', 'systematic-improvement', 'validation', 'evolution']
    };
  }
});

/**
 * Task: Ontology Validation and Research
 * Purpose: Comprehensive self-validation and research on full ontology for adaptive improvement
 */
const ontologyValidationResearchTask = defineTask({
  name: 'ontology-validation-research',
  description: 'Comprehensive self-validation and research on full ontology for adaptive improvement',

  inputs: {
    projectName: { type: 'string', required: true },
    currentOntology: { type: 'object', required: true },
    currentSchema: { type: 'object', required: true },
    allResults: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    validationFramework: { type: 'object', required: true },
    reinforcementLearningFramework: { type: 'object', required: true },
    adaptationIteration: { type: 'number', default: 1 },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' },
    ontologyScope: { type: 'string', default: 'comprehensive' }
  },

  outputs: {
    validationResults: { type: 'object' },
    researchFindings: { type: 'object' },
    improvementOpportunities: { type: 'array' },
    qualityAssessment: { type: 'object' },
    consistencyAnalysis: { type: 'object' },
    completenessGaps: { type: 'array' },
    usabilityAnalysis: { type: 'object' },
    performanceAnalysis: { type: 'object' },
    stakeholderFeedback: { type: 'object' },
    evolutionRecommendations: { type: 'array' },
    schemaAdequacyAssessment: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Ontology Validation Research: ${inputs.projectName} (Cycle ${inputs.adaptationIteration})`,
      agent: {
        role: 'ontology-validation-researcher',
        goal: `Conduct comprehensive self-validation and research on full ontology for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE ONTOLOGY VALIDATION FRAMEWORK ===',
          'Apply systematic self-validation and research methodology for adaptive ontology improvement.',

          '=== HOLISTIC ONTOLOGY ANALYSIS ===',
          '**COMPREHENSIVE COVERAGE VALIDATION**:',
          '- Validate ontology coverage against domain scope requirements',
          '- Identify gaps in concept coverage, relationship modeling, and attribute representation',
          '- Assess depth and breadth of domain representation',
          '- Validate coverage of edge cases and domain boundaries',
          '- Check coverage of stakeholder-specific domain aspects',

          '**INTERNAL CONSISTENCY VALIDATION**:',
          '- Check for logical contradictions within the ontology',
          '- Validate consistency of concept definitions and relationships',
          '- Identify circular definitions and ambiguous concept boundaries',
          '- Validate consistency of attribute assignments and constraints',
          '- Check for inconsistent inheritance and specialization relationships',

          '**EMPIRICAL ADEQUACY TESTING**:',
          '- Test ontology against real-world domain instances and data',
          '- Validate ontology expressiveness for actual domain scenarios',
          '- Test ontology utility for stakeholder decision-making processes',
          '- Validate ontology support for actual business workflows',
          '- Assess ontology accuracy against domain expert knowledge',

          '=== SCHEMA-ONTOLOGY ALIGNMENT VALIDATION ===',
          '**SCHEMA ADEQUACY ASSESSMENT**:',
          '- Validate schema adequacy for current ontology content',
          '- Identify ontology aspects inadequately supported by schema',
          '- Assess schema constraints that limit ontology expressiveness',
          '- Identify opportunities for schema evolution to better support ontology',
          '- Validate schema-ontology alignment for future growth scenarios',

          '**BIDIRECTIONAL CONSISTENCY CHECKING**:',
          '- Ensure ontology conforms to schema constraints and specifications',
          '- Validate that schema supports ontology modeling requirements',
          '- Check for ontology content that exceeds schema capabilities',
          '- Identify schema features unused by current ontology',
          '- Assess evolution compatibility between schema and ontology',

          '=== PERFORMANCE AND SCALABILITY VALIDATION ===',
          '**COMPUTATIONAL PERFORMANCE ANALYSIS**:',
          '- Validate query performance across different ontology access patterns',
          '- Assess reasoning and inference performance with current ontology size',
          '- Test scalability with projected ontology growth scenarios',
          '- Identify performance bottlenecks in ontology structure',
          '- Validate memory and storage efficiency of current ontology design',

          '**MAINTENANCE AND EVOLUTION ANALYSIS**:',
          '- Assess ease of ontology maintenance and updates',
          '- Validate ontology modularity and changeability',
          '- Test impact propagation of ontology modifications',
          '- Assess ontology versioning and backward compatibility',
          '- Validate sustainability of current ontology architecture',

          '=== STAKEHOLDER VALUE VALIDATION ===',
          '**COMPREHENSIVE USABILITY RESEARCH**:',
          '- Research stakeholder experience with ontology-based tools and interfaces',
          '- Validate ontology comprehensibility for different user types',
          '- Assess cognitive load and learning curve for ontology users',
          '- Test ontology utility for actual user tasks and workflows',
          '- Validate accessibility and inclusive design aspects of ontology',

          '**BUSINESS VALUE VALIDATION**:',
          '- Validate ontology contribution to business goals and objectives',
          '- Assess ROI and cost-benefit of current ontology investment',
          '- Validate ontology support for decision-making and problem-solving',
          '- Assess ontology impact on operational efficiency and effectiveness',
          '- Validate strategic value of ontology for competitive advantage',

          '=== QUALITY AND MATURITY ASSESSMENT ===',
          '**MULTI-DIMENSIONAL QUALITY EVALUATION**:',
          '- Assess conceptual quality: accuracy, completeness, consistency',
          '- Evaluate structural quality: modularity, maintainability, scalability',
          '- Validate functional quality: usability, performance, reliability',
          '- Assess strategic quality: business alignment, stakeholder value, future readiness',
          '- Evaluate process quality: development methodology, governance, documentation',

          '**MATURITY AND EVOLUTION READINESS**:',
          '- Assess ontology maturity level and stability',
          '- Validate readiness for production deployment and scaling',
          '- Assess governance and maintenance capability requirements',
          '- Evaluate organizational readiness for ontology adoption',
          '- Validate long-term sustainability and evolution planning',

          '=== IMPROVEMENT OPPORTUNITY IDENTIFICATION ===',
          '**SYSTEMATIC OPPORTUNITY MAPPING**:',
          '- Map improvement opportunities across all validation dimensions',
          '- Prioritize opportunities by impact potential and implementation feasibility',
          '- Identify quick wins vs. long-term strategic improvements',
          '- Assess interdependencies between different improvement opportunities',
          '- Consider stakeholder preferences and organizational constraints',

          '**INNOVATION AND ADVANCEMENT RESEARCH**:',
          '- Research emerging approaches and technologies applicable to ontology',
          '- Identify opportunities for AI/ML integration and automation',
          '- Explore semantic web and linked data enhancement possibilities',
          '- Research ontology federation and interoperability improvements',
          '- Identify opportunities for community collaboration and sharing',

          'Provide comprehensive validation results with specific improvement recommendations and implementation guidance.',

          `Context: Adaptation iteration ${inputs.adaptationIteration} for ${inputs.domainType} domain with ${inputs.ontologyScope} scope`
        ],
        context: {
          projectName: inputs.projectName,
          currentOntology: inputs.currentOntology,
          currentSchema: inputs.currentSchema,
          allResults: inputs.allResults,
          evidenceFramework: inputs.evidenceFramework,
          validationFramework: inputs.validationFramework,
          reinforcementLearningFramework: inputs.reinforcementLearningFramework,
          adaptationIteration: inputs.adaptationIteration,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType,
          ontologyScope: inputs.ontologyScope
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['ontology-validation', 'self-research', 'comprehensive-analysis', 'improvement-identification']
    };
  }
});

/**
 * Task: Comprehensive Generator Validation
 * Purpose: Comprehensive validation of generators including output quality, conformance, and usability
 */
const comprehensiveGeneratorValidationTask = defineTask({
  name: 'comprehensive-generator-validation',
  description: 'Comprehensive validation of generators including output quality, conformance, usability, and performance',

  inputs: {
    projectName: { type: 'string', required: true },
    generators: { type: 'object', required: true },
    knowledgeGraph: { type: 'object', required: true },
    schema: { type: 'object', required: true },
    validationFramework: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' }
  },

  outputs: {
    qualityAssessment: { type: 'object' },
    conformanceResults: { type: 'object' },
    usabilityResults: { type: 'object' },
    performanceResults: { type: 'object' },
    overallValidationScore: { type: 'number' },
    performanceRating: { type: 'number' },
    validationIssues: { type: 'array' },
    improvementRecommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Comprehensive Generator Validation: ${inputs.projectName}`,
      agent: {
        role: 'generator-validation-specialist',
        goal: `Validate generators comprehensively for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE GENERATOR VALIDATION FRAMEWORK ===',
          'Apply systematic validation methodology covering all aspects of generator performance and utility.',

          '=== OUTPUT QUALITY ASSESSMENT ===',
          '**CONTENT QUALITY VALIDATION**:',
          '- Validate accuracy and correctness of generated outputs',
          '- Assess completeness and coverage of generated content',
          '- Check consistency and coherence across different generated outputs',
          '- Validate compliance with domain standards and conventions',
          '- Assess clarity and comprehensibility of generated content',

          '**SEMANTIC FIDELITY TESTING**:',
          '- Validate semantic accuracy of generated content against ontology',
          '- Check preservation of semantic relationships in generated outputs',
          '- Assess consistency of concept usage across generated artifacts',
          '- Validate maintenance of ontological commitments in outputs',
          '- Test semantic reasoning support in generated structures',

          '=== CONFORMANCE VALIDATION ===',
          '**SCHEMA CONFORMANCE TESTING**:',
          '- Validate generated outputs conform to schema specifications',
          '- Check compliance with structural constraints and patterns',
          '- Validate adherence to naming conventions and standards',
          '- Test conformance to data types and format requirements',
          '- Assess compliance with validation rules and constraints',

          '**SPECIFICATION COMPLIANCE CHECKING**:',
          '- Validate generators produce outputs meeting functional specifications',
          '- Check compliance with non-functional requirements (performance, security)',
          '- Validate adherence to industry standards and best practices',
          '- Test compliance with accessibility and usability guidelines',
          '- Assess conformance to integration and interoperability requirements',

          '=== USABILITY AND STAKEHOLDER VALIDATION ===',
          '**USER EXPERIENCE TESTING**:',
          '- Test generator usability for different stakeholder types',
          '- Assess learnability and ease of use for generator interfaces',
          '- Validate generator workflow integration with stakeholder processes',
          '- Test generator responsiveness and feedback mechanisms',
          '- Assess accessibility and inclusive design aspects',

          '**STAKEHOLDER VALUE VALIDATION**:',
          '- Validate generators support stakeholder goals and objectives',
          '- Assess generator utility for actual business workflows',
          '- Test generator outputs meet stakeholder quality expectations',
          '- Validate generator efficiency gains for stakeholder tasks',
          '- Assess stakeholder satisfaction with generator capabilities',

          '=== PERFORMANCE AND SCALABILITY VALIDATION ===',
          '**COMPUTATIONAL PERFORMANCE TESTING**:',
          '- Test generator execution speed and response times',
          '- Validate memory usage and resource efficiency',
          '- Assess scalability with increasing ontology size and complexity',
          '- Test concurrent usage and multi-user performance',
          '- Validate performance under stress and peak load conditions',

          '**RELIABILITY AND ROBUSTNESS TESTING**:',
          '- Test generator behavior with edge cases and boundary conditions',
          '- Validate error handling and graceful failure mechanisms',
          '- Test generator stability under various operating conditions',
          '- Assess recovery capabilities from failure scenarios',
          '- Validate consistency of outputs across multiple executions',

          '=== INTEGRATION AND COMPATIBILITY VALIDATION ===',
          '**SYSTEM INTEGRATION TESTING**:',
          '- Test generator integration with existing systems and tools',
          '- Validate API compatibility and interface specifications',
          '- Test data format compatibility and transformation capabilities',
          '- Assess integration impact on system performance and stability',
          '- Validate security and privacy compliance in integrated environments',

          '**EVOLUTION AND MAINTENANCE VALIDATION**:',
          '- Test generator adaptability to ontology changes and evolution',
          '- Validate generator maintenance and update procedures',
          '- Assess backward compatibility with previous ontology versions',
          '- Test generator configuration and customization capabilities',
          '- Validate generator documentation and support materials',

          'Provide comprehensive validation results with specific recommendations for generator improvement.'
        ],
        context: {
          projectName: inputs.projectName,
          generators: inputs.generators,
          knowledgeGraph: inputs.knowledgeGraph,
          schema: inputs.schema,
          validationFramework: inputs.validationFramework,
          evidenceFramework: inputs.evidenceFramework,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['generator-validation', 'quality-assessment', 'conformance-testing', 'usability-validation']
    };
  }
});

/**
 * Task: Encyclopedia Validation
 * Purpose: Comprehensive validation of encyclopedia/documentation completeness, accuracy, and usability
 */
const encyclopediaValidationTask = defineTask({
  name: 'encyclopedia-validation',
  description: 'Comprehensive validation of encyclopedia completeness, accuracy, consistency, and usability',

  inputs: {
    projectName: { type: 'string', required: true },
    documentation: { type: 'object', required: true },
    knowledgeGraph: { type: 'object', required: true },
    schema: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    validationFramework: { type: 'object', required: true },
    ontologyScope: { type: 'string', default: 'comprehensive' },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    domainType: { type: 'string', default: 'general' }
  },

  outputs: {
    completenessResults: { type: 'object' },
    accuracyResults: { type: 'object' },
    consistencyResults: { type: 'object' },
    usabilityResults: { type: 'object' },
    coverageScore: { type: 'number' },
    accuracyScore: { type: 'number' },
    consistencyScore: { type: 'number' },
    issuesFound: { type: 'array' },
    improvementRecommendations: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Encyclopedia Validation: ${inputs.projectName}`,
      agent: {
        role: 'encyclopedia-validation-specialist',
        goal: `Comprehensively validate encyclopedia quality and completeness for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE ENCYCLOPEDIA VALIDATION FRAMEWORK ===',
          'Apply systematic validation methodology for encyclopedia completeness, accuracy, and usability.',

          '=== COMPLETENESS VALIDATION ===',
          '**DOMAIN COVERAGE ASSESSMENT**:',
          '- Map encyclopedia content against ontology concepts and relationships',
          '- Identify concepts, relationships, and attributes missing from documentation',
          '- Assess coverage depth for different concept categories and importance levels',
          '- Validate coverage of domain-specific terminology and specialized knowledge',
          '- Check coverage of edge cases, exceptions, and boundary conditions',

          '**STAKEHOLDER PERSPECTIVE COVERAGE**:',
          '- Validate coverage of different stakeholder viewpoints and use cases',
          '- Assess documentation completeness for different user roles and contexts',
          '- Check coverage of domain workflows, processes, and procedures',
          '- Validate inclusion of practical examples and real-world scenarios',
          '- Assess coverage of troubleshooting, FAQs, and common issues',

          '**HIERARCHICAL COMPLETENESS CHECKING**:',
          '- Validate completeness at different levels of detail and abstraction',
          '- Check consistency of detail levels across different concept areas',
          '- Assess adequacy of high-level overviews and detailed specifications',
          '- Validate completeness of cross-references and relationship documentation',
          '- Check completeness of metadata, provenance, and attribution information',

          '=== ACCURACY VALIDATION ===',
          '**FACT-CHECKING AND VERIFICATION**:',
          '- Verify factual accuracy against authoritative sources and evidence',
          '- Cross-check claims and assertions with primary source materials',
          '- Validate consistency with established domain standards and practices',
          '- Check accuracy of examples, illustrations, and case studies',
          '- Verify correctness of technical specifications and implementation details',

          '**ONTOLOGY ALIGNMENT VALIDATION**:',
          '- Validate accuracy of documentation against ontology content',
          '- Check for inconsistencies between documented and modeled concepts',
          '- Verify accuracy of relationship descriptions and semantic connections',
          '- Validate consistency of concept definitions across documentation',
          '- Check alignment between documented examples and ontology instances',

          '**EVIDENCE-BASED ACCURACY ASSESSMENT**:',
          '- Validate that documented claims are supported by appropriate evidence',
          '- Check quality and credibility of sources cited in documentation',
          '- Assess strength of evidence for different types of claims',
          '- Identify unsupported assertions requiring additional evidence',
          '- Validate accuracy of evidence interpretation and citation',

          '=== CONSISTENCY VALIDATION ===',
          '**INTERNAL CONSISTENCY CHECKING**:',
          '- Identify contradictions and inconsistencies within documentation',
          '- Check consistency of terminology usage across different sections',
          '- Validate consistency of formatting, style, and presentation',
          '- Check consistency of cross-references and linking',
          '- Assess consistency of detail levels and explanation approaches',

          '**CROSS-ARTIFACT CONSISTENCY VALIDATION**:',
          '- Validate consistency between encyclopedia and other project artifacts',
          '- Check alignment between documentation and generated outputs',
          '- Verify consistency with schema definitions and specifications',
          '- Validate alignment with validation results and quality assessments',
          '- Check consistency with stakeholder requirements and expectations',

          '=== USABILITY AND ACCESSIBILITY VALIDATION ===',
          '**USER EXPERIENCE ASSESSMENT**:',
          '- Test encyclopedia navigation and information findability',
          '- Assess readability and comprehensibility for target audiences',
          '- Validate search functionality and information retrieval',
          '- Test accessibility compliance and inclusive design',
          '- Assess mobile responsiveness and multi-device compatibility',

          '**STAKEHOLDER UTILITY VALIDATION**:',
          '- Validate encyclopedia utility for different stakeholder workflows',
          '- Test effectiveness for learning and knowledge transfer',
          '- Assess utility for decision-making and problem-solving',
          '- Validate effectiveness for troubleshooting and support',
          '- Test utility for ongoing maintenance and evolution',

          '=== MAINTENANCE AND EVOLUTION VALIDATION ===',
          '**MAINTAINABILITY ASSESSMENT**:',
          '- Assess ease of updating and maintaining encyclopedia content',
          '- Validate version control and change management processes',
          '- Test scalability for growing content and user base',
          '- Assess sustainability of documentation maintenance approach',
          '- Validate integration with content management and publication workflows',

          '**EVOLUTION READINESS VALIDATION**:',
          '- Test adaptability to ontology changes and evolution',
          '- Validate flexibility for changing stakeholder needs',
          '- Assess capability for localization and internationalization',
          '- Test integration with emerging technologies and platforms',
          '- Validate long-term sustainability and preservation strategies',

          '=== QUALITY SCORING AND ASSESSMENT ===',
          '**COMPREHENSIVE QUALITY METRICS**:',
          '- Calculate coverage score: percentage of ontology concepts documented',
          '- Assess accuracy score: percentage of verified accurate information',
          '- Evaluate consistency score: degree of internal and external consistency',
          '- Measure usability score: effectiveness for stakeholder tasks',
          '- Calculate overall quality index combining multiple dimensions',

          '**IMPROVEMENT PRIORITIZATION**:',
          '- Prioritize identified issues by impact on stakeholder value',
          '- Assess improvement effort vs. benefit for different recommendations',
          '- Consider stakeholder feedback and preferences in prioritization',
          '- Identify quick wins vs. long-term strategic improvements',
          '- Plan improvement implementation strategy and timeline',

          'Provide detailed validation results with prioritized improvement recommendations.',

          `Validation scope: ${inputs.ontologyScope} for ${inputs.domainType} domain with ${inputs.stakeholderContext} context`
        ],
        context: {
          projectName: inputs.projectName,
          documentation: inputs.documentation,
          knowledgeGraph: inputs.knowledgeGraph,
          schema: inputs.schema,
          evidenceFramework: inputs.evidenceFramework,
          validationFramework: inputs.validationFramework,
          ontologyScope: inputs.ontologyScope,
          stakeholderContext: inputs.stakeholderContext,
          domainType: inputs.domainType
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['encyclopedia-validation', 'completeness-assessment', 'accuracy-verification', 'usability-testing']
    };
  }
});

/**
 * Task: Cross-System Validation
 * Purpose: Comprehensive validation across generators, documentation, ontology, and schema
 */
const crossSystemValidationTask = defineTask({
  name: 'cross-system-validation',
  description: 'Comprehensive validation across generators, documentation, ontology, and schema for integration and coherence',

  inputs: {
    projectName: { type: 'string', required: true },
    generators: { type: 'object', required: true },
    documentation: { type: 'object', required: true },
    knowledgeGraph: { type: 'object', required: true },
    schema: { type: 'object', required: true },
    evidenceFramework: { type: 'object', required: true },
    validationFramework: { type: 'object', required: true },
    allResults: { type: 'object', required: true }
  },

  outputs: {
    integrationResults: { type: 'object' },
    holisticResults: { type: 'object' },
    integrationScore: { type: 'number' },
    holisticScore: { type: 'number' },
    coherenceAnalysis: { type: 'object' },
    interoperabilityAssessment: { type: 'object' },
    systemLevelIssues: { type: 'array' },
    optimizationOpportunities: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Cross-System Validation: ${inputs.projectName}`,
      agent: {
        role: 'cross-system-validation-specialist',
        goal: `Validate integration and coherence across all system components for ${inputs.projectName}`,
        instructions: [
          '=== COMPREHENSIVE CROSS-SYSTEM VALIDATION FRAMEWORK ===',
          'Apply systematic validation methodology across all system components for integration and holistic coherence.',

          '=== INTEGRATION VALIDATION ===',
          '**COMPONENT INTEGRATION TESTING**:',
          '- Validate integration between schema and ontology components',
          '- Test generator integration with ontology and schema',
          '- Validate documentation integration with all system components',
          '- Test end-to-end workflows across integrated components',
          '- Assess data flow and transformation accuracy across components',

          '**INTERFACE COMPATIBILITY VALIDATION**:',
          '- Validate API compatibility between different system components',
          '- Test data format compatibility and transformation accuracy',
          '- Check protocol compatibility and communication reliability',
          '- Validate security and access control integration',
          '- Test error handling and exception propagation across components',

          '**WORKFLOW INTEGRATION ASSESSMENT**:',
          '- Test complete user workflows spanning multiple components',
          '- Validate business process support across integrated system',
          '- Assess stakeholder workflow efficiency with integrated components',
          '- Test integration impact on user experience and satisfaction',
          '- Validate workflow reliability and error recovery mechanisms',

          '=== HOLISTIC SYSTEM VALIDATION ===',
          '**SYSTEM-LEVEL COHERENCE ANALYSIS**:',
          '- Validate conceptual coherence across all system components',
          '- Assess semantic consistency throughout integrated system',
          '- Check logical coherence of system architecture and design',
          '- Validate goal alignment across all system components',
          '- Assess strategic coherence with organizational objectives',

          '**EMERGENT PROPERTIES ASSESSMENT**:',
          '- Identify emergent properties arising from component integration',
          '- Assess positive and negative emergent behaviors',
          '- Validate emergent capabilities against stakeholder requirements',
          '- Test emergent system performance and scalability characteristics',
          '- Assess emergent security and reliability properties',

          '**WHOLE-SYSTEM PERFORMANCE VALIDATION**:',
          '- Test overall system performance under realistic load conditions',
          '- Validate system scalability with growing data and users',
          '- Assess system reliability and availability under stress',
          '- Test disaster recovery and business continuity capabilities',
          '- Validate system maintainability and evolution capabilities',

          '=== STAKEHOLDER VALUE COHERENCE ===',
          '**MULTI-STAKEHOLDER VALUE ASSESSMENT**:',
          '- Validate value delivery for all stakeholder groups',
          '- Assess trade-offs and conflicts in stakeholder value optimization',
          '- Test stakeholder satisfaction with integrated system capabilities',
          '- Validate alignment with diverse stakeholder goals and objectives',
          '- Assess long-term value sustainability for all stakeholders',

          '**BUSINESS OBJECTIVE ALIGNMENT**:',
          '- Validate system alignment with strategic business objectives',
          '- Assess contribution to organizational competitive advantage',
          '- Test support for business decision-making and operations',
          '- Validate ROI and cost-benefit across all system components',
          '- Assess strategic positioning and future readiness',

          '=== INTEROPERABILITY AND STANDARDS COMPLIANCE ===',
          '**STANDARDS COMPLIANCE VALIDATION**:',
          '- Validate compliance with relevant industry standards',
          '- Test interoperability with standard protocols and formats',
          '- Assess accessibility and inclusive design compliance',
          '- Validate security and privacy standards compliance',
          '- Test regulatory compliance across all system components',

          '**ECOSYSTEM INTEROPERABILITY TESTING**:',
          '- Test interoperability with external systems and services',
          '- Validate data exchange capabilities with partner systems',
          '- Assess integration capabilities with cloud and enterprise platforms',
          '- Test compatibility with emerging technologies and standards',
          '- Validate ecosystem positioning and network effects',

          '=== SYSTEM EVOLUTION AND ADAPTABILITY ===',
          '**EVOLUTION CAPABILITY ASSESSMENT**:',
          '- Test system adaptability to changing requirements',
          '- Validate capability for component evolution and replacement',
          '- Assess system flexibility for emerging use cases',
          '- Test scalability for organizational growth and change',
          '- Validate long-term sustainability and maintainability',

          '**FUTURE READINESS VALIDATION**:',
          '- Assess system readiness for anticipated future requirements',
          '- Validate compatibility with emerging technologies',
          '- Test adaptability to changing regulatory environments',
          '- Assess strategic positioning for future competitive advantage',
          '- Validate investment protection and evolution pathways',

          '=== OPTIMIZATION OPPORTUNITY IDENTIFICATION ===',
          '**SYSTEM-LEVEL OPTIMIZATION ANALYSIS**:',
          '- Identify optimization opportunities spanning multiple components',
          '- Assess potential for performance improvements through integration',
          '- Identify redundancies and inefficiencies in current integration',
          '- Assess opportunities for automation and process optimization',
          '- Identify potential for enhanced stakeholder value delivery',

          '**INTEGRATION ENHANCEMENT RECOMMENDATIONS**:',
          '- Recommend improvements to component integration approaches',
          '- Suggest enhancements to data flow and transformation processes',
          '- Recommend interface improvements and standardization',
          '- Suggest workflow optimization and user experience improvements',
          '- Recommend strategic positioning and ecosystem enhancement',

          'Provide comprehensive cross-system validation results with strategic optimization recommendations.'
        ],
        context: {
          projectName: inputs.projectName,
          generators: inputs.generators,
          documentation: inputs.documentation,
          knowledgeGraph: inputs.knowledgeGraph,
          schema: inputs.schema,
          evidenceFramework: inputs.evidenceFramework,
          validationFramework: inputs.validationFramework,
          allResults: inputs.allResults
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['cross-system-validation', 'integration-testing', 'holistic-assessment', 'interoperability']
    };
  }
});

/**
 * Task: Evidence Generation Through Research and Experimentation
 * Purpose: Generate original evidence through research studies and experiments when existing evidence is insufficient
 */
const evidenceGenerationTask = defineTask({
  name: 'evidence-generation-research',
  description: 'Generate original evidence through designed research studies and experiments to fill critical evidence gaps',

  inputs: {
    projectName: { type: 'string', required: true },
    evidenceGaps: { type: 'array', required: true },
    evidenceFramework: { type: 'object', required: true },
    currentPhase: { type: 'string', required: true },
    domainType: { type: 'string', default: 'general' },
    stakeholderContext: { type: 'string', default: 'multi-team' },
    resourceConstraints: { type: 'object', default: {} },
    researchPriority: { type: 'string', default: 'high' }
  },

  outputs: {
    researchStudies: { type: 'array' },
    designedExperiments: { type: 'array' },
    empiricalValidation: { type: 'array' },
    originalData: { type: 'object' },
    collaborativeStudies: { type: 'array' },
    generatedEvidence: { type: 'object' },
    validationResults: { type: 'object' },
    researchMethodology: { type: 'object' },
    replicationInstructions: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'agent',
      title: `Evidence Generation Research: ${inputs.currentPhase} - ${inputs.projectName}`,
      agent: {
        role: 'evidence-generation-researcher',
        goal: `Design and conduct research studies and experiments to generate missing evidence for ${inputs.projectName}`,
        instructions: [
          '=== EVIDENCE GENERATION RESEARCH FRAMEWORK ===',
          'Design and execute original research studies and experiments to fill critical evidence gaps.',

          '=== EVIDENCE GAP ANALYSIS AND PRIORITIZATION ===',
          '**CRITICAL GAP ASSESSMENT**:',
          '- Analyze each evidence gap for criticality to ontology validity',
          '- Assess impact of missing evidence on decision-making and stakeholder confidence',
          '- Prioritize gaps by potential research feasibility and resource requirements',
          '- Evaluate urgency based on project timeline and dependencies',
          '- Consider stakeholder needs and regulatory requirements for evidence',

          '**RESEARCH FEASIBILITY EVALUATION**:',
          '- Assess feasibility of generating evidence through original research',
          '- Evaluate available resources (time, budget, expertise, technology)',
          '- Consider ethical constraints and approval requirements',
          '- Assess stakeholder availability and participation capacity',
          '- Evaluate technical feasibility and methodological requirements',

          '=== RESEARCH STUDY DESIGN ===',
          '**SYSTEMATIC RESEARCH METHODOLOGY**:',
          '- Design appropriate research methodologies for different evidence types',
          '- Select quantitative vs. qualitative approaches based on evidence needs',
          '- Design sampling strategies and data collection protocols',
          '- Establish validity and reliability measures for research instruments',
          '- Plan data analysis methods and statistical approaches',

          '**STAKEHOLDER RESEARCH STUDIES**:',
          '- Design surveys and interviews for stakeholder knowledge elicitation',
          '- Create focus group protocols for collaborative knowledge validation',
          '- Develop participatory research approaches for domain expertise capture',
          '- Design longitudinal studies for process and workflow validation',
          '- Create case study protocols for real-world scenario validation',

          '=== EXPERIMENTAL DESIGN AND EXECUTION ===',
          '**CONTROLLED EXPERIMENT DESIGN**:',
          '- Design controlled experiments for ontology component validation',
          '- Create experimental protocols with appropriate controls and variables',
          '- Establish measurement criteria and success metrics',
          '- Design replication protocols for independent validation',
          '- Plan statistical analysis and significance testing approaches',

          '**EMPIRICAL VALIDATION EXPERIMENTS**:',
          '- Design experiments to validate ontology accuracy against real-world data',
          '- Create performance testing experiments for ontology query efficiency',
          '- Design usability experiments for stakeholder interaction validation',
          '- Develop scalability experiments for large-scale deployment scenarios',
          '- Create integration experiments for system compatibility validation',

          '**COLLABORATIVE VALIDATION STUDIES**:',
          '- Design multi-stakeholder validation studies for consensus building',
          '- Create cross-organizational studies for broader domain validation',
          '- Develop expert panel studies for specialized domain knowledge',
          '- Design comparative studies against existing ontologies and standards',
          '- Create longitudinal validation studies for temporal stability',

          '=== ORIGINAL DATA COLLECTION ===',
          '**SYSTEMATIC DATA COLLECTION PROTOCOLS**:',
          '- Design data collection instruments and procedures',
          '- Establish data quality standards and validation procedures',
          '- Create data management and storage protocols',
          '- Design data cleaning and preprocessing methodologies',
          '- Establish data versioning and change management procedures',

          '**DOMAIN-SPECIFIC DATA GENERATION**:',
          '- Collect domain-specific examples and counter-examples',
          '- Generate test datasets for ontology validation',
          '- Create benchmark datasets for comparative evaluation',
          '- Develop synthetic data for edge case and boundary condition testing',
          '- Collect real-world usage data for practical validation',

          '=== HYPOTHESIS GENERATION AND TESTING ===',
          '**SYSTEMATIC HYPOTHESIS DEVELOPMENT**:',
          '- Generate testable hypotheses for uncertain domain aspects',
          '- Design hypothesis testing protocols and acceptance criteria',
          '- Create alternative hypotheses and null hypothesis testing',
          '- Plan hypothesis refinement based on experimental results',
          '- Document hypothesis evolution and learning progression',

          '**PREDICTIVE VALIDATION STUDIES**:',
          '- Design studies to test ontology predictive capabilities',
          '- Create validation experiments for ontology inference accuracy',
          '- Test ontology robustness under various scenarios and conditions',
          '- Validate ontology adaptability to changing domain conditions',
          '- Test ontology generalizability across different contexts',

          '=== RESEARCH EXECUTION AND VALIDATION ===',
          '**RIGOROUS EXECUTION PROTOCOLS**:',
          '- Execute research studies with proper controls and documentation',
          '- Maintain research integrity and ethical standards throughout',
          '- Document all procedures, decisions, and unexpected outcomes',
          '- Implement quality control measures and peer validation',
          '- Create comprehensive audit trails for research reproducibility',

          '**RESULTS VALIDATION AND ANALYSIS**:',
          '- Apply appropriate statistical analysis and significance testing',
          '- Validate results through independent analysis and review',
          '- Assess generalizability and external validity of findings',
          '- Document limitations, biases, and potential confounding factors',
          '- Create confidence intervals and uncertainty quantification',

          '=== GENERATED EVIDENCE INTEGRATION ===',
          '**EVIDENCE SYNTHESIS AND INTEGRATION**:',
          '- Synthesize generated evidence with existing evidence sources',
          '- Resolve conflicts between generated and existing evidence',
          '- Update evidence quality assessments based on original research',
          '- Integrate findings into ontology and documentation',
          '- Update stakeholder confidence and validation status',

          '**REPLICATION AND REPRODUCIBILITY PROTOCOLS**:',
          '- Create complete replication instructions for all studies and experiments',
          '- Document all materials, procedures, and analytical approaches',
          '- Provide access to raw data and analysis code where possible',
          '- Create guidance for independent replication attempts',
          '- Establish protocols for ongoing validation and updates',

          '=== COLLABORATIVE RESEARCH COORDINATION ===',
          '**MULTI-STAKEHOLDER RESEARCH COORDINATION**:',
          '- Coordinate research activities across different stakeholder groups',
          '- Manage collaborative data collection and validation efforts',
          '- Facilitate expert participation and knowledge contribution',
          '- Coordinate with external research institutions and organizations',
          '- Manage intellectual property and data sharing agreements',

          '**COMMUNITY VALIDATION AND PEER REVIEW**:',
          '- Organize peer review processes for generated research',
          '- Facilitate community validation and feedback collection',
          '- Coordinate with domain experts for specialized validation',
          '- Manage external validation and independent replication efforts',
          '- Create mechanisms for ongoing community contribution and validation',

          'Execute systematic evidence generation with rigorous methodology and complete documentation.',

          `Research context: ${inputs.currentPhase} phase for ${inputs.domainType} domain with ${inputs.stakeholderContext} stakeholder complexity`
        ],
        context: {
          projectName: inputs.projectName,
          evidenceGaps: inputs.evidenceGaps,
          evidenceFramework: inputs.evidenceFramework,
          currentPhase: inputs.currentPhase,
          domainType: inputs.domainType,
          stakeholderContext: inputs.stakeholderContext,
          resourceConstraints: inputs.resourceConstraints,
          researchPriority: inputs.researchPriority
        }
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['evidence-generation', 'original-research', 'experimental-design', 'empirical-validation']
    };
  }
});