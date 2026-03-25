/**
 * @process specializations/data-science-ml/ml-project-scoping
 * @description ML Project Scoping and Requirements Analysis - Define business objectives, success metrics,
 * constraints, and technical requirements for ML projects with feasibility assessment and stakeholder alignment.
 * @inputs { projectName: string, businessDomain: string, stakeholders?: string[], initialRequirements?: string }
 * @outputs { success: boolean, scopeDocument: object, feasibilityScore: number, dataAvailability: object, technicalRequirements: object }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/ml-project-scoping', {
 *   projectName: 'Customer Churn Prediction',
 *   businessDomain: 'E-commerce',
 *   stakeholders: ['Product Manager', 'Data Science Lead', 'Engineering Lead'],
 *   initialRequirements: 'Predict customer churn to enable proactive retention campaigns'
 * });
 *
 * @references
 * - CRISP-DM Methodology: https://www.datascience-pm.com/crisp-dm-2/
 * - Team Data Science Process (TDSP): https://learn.microsoft.com/en-us/azure/architecture/data-science-process/overview
 * - MLOps Principles: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
 * - Rules of Machine Learning - Google: https://developers.google.com/machine-learning/guides/rules-of-ml
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    businessDomain,
    stakeholders = [],
    initialRequirements = ''
  } = inputs;

  // Phase 1: Business Understanding
  const businessUnderstanding = await ctx.task(businessUnderstandingTask, {
    projectName,
    businessDomain,
    initialRequirements,
    stakeholders
  });

  // Quality Gate: Business objectives must be clearly defined
  if (!businessUnderstanding.objectives || businessUnderstanding.objectives.length === 0) {
    return {
      success: false,
      error: 'Business objectives not clearly defined',
      phase: 'business-understanding',
      scopeDocument: null
    };
  }

  // Breakpoint: Review business objectives with stakeholders
  await ctx.breakpoint({
    question: `Review business objectives for ${projectName}. Are these aligned with stakeholder expectations?`,
    title: 'Business Objectives Review',
    context: {
      runId: ctx.runId,
      projectName,
      objectives: businessUnderstanding.objectives,
      successMetrics: businessUnderstanding.successMetrics,
      files: [{
        path: `artifacts/phase1-business-understanding.json`,
        format: 'json',
        content: businessUnderstanding
      }]
    }
  });

  // Phase 2: Success Metrics and KPIs Definition
  const metricsDefinition = await ctx.task(metricsDefinitionTask, {
    projectName,
    businessObjectives: businessUnderstanding.objectives,
    businessDomain,
    successMetrics: businessUnderstanding.successMetrics
  });

  // Phase 3: Data Availability Assessment
  const dataAssessment = await ctx.task(dataAvailabilityTask, {
    projectName,
    objectives: businessUnderstanding.objectives,
    requiredDataTypes: metricsDefinition.requiredDataTypes
  });

  // Quality Gate: Data availability must meet minimum threshold
  const dataAvailabilityScore = dataAssessment.availabilityScore || 0;
  if (dataAvailabilityScore < 60) {
    await ctx.breakpoint({
      question: `Data availability score is ${dataAvailabilityScore}/100 (below threshold of 60). Should we proceed with data collection plan or halt the project?`,
      title: 'Data Availability Warning',
      context: {
        runId: ctx.runId,
        dataAssessment,
        recommendation: 'Consider data collection initiatives or alternative data sources before proceeding'
      }
    });
  }

  // Phase 4: Technical Feasibility Analysis
  const feasibilityAnalysis = await ctx.task(feasibilityAnalysisTask, {
    projectName,
    objectives: businessUnderstanding.objectives,
    dataAssessment,
    metricsDefinition,
    businessDomain
  });

  // Phase 5: Constraints and Requirements Documentation
  const constraintsDocumentation = await ctx.task(constraintsDocumentationTask, {
    projectName,
    businessUnderstanding,
    metricsDefinition,
    feasibilityAnalysis,
    stakeholders
  });

  // Phase 6: ML Problem Formulation
  const problemFormulation = await ctx.task(problemFormulationTask, {
    projectName,
    businessObjectives: businessUnderstanding.objectives,
    dataAssessment,
    constraints: constraintsDocumentation.constraints
  });

  // Phase 7: Resource and Timeline Estimation
  const resourceEstimation = await ctx.task(resourceEstimationTask, {
    projectName,
    problemFormulation,
    feasibilityAnalysis,
    dataAssessment
  });

  // Phase 8: Risk Assessment and Mitigation Planning
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    businessDomain,
    dataAssessment,
    feasibilityAnalysis,
    constraints: constraintsDocumentation.constraints,
    problemFormulation
  });

  // Phase 9: Ethical and Fairness Considerations
  const ethicsAssessment = await ctx.task(ethicsAssessmentTask, {
    projectName,
    businessDomain,
    problemFormulation,
    dataAssessment,
    stakeholders
  });

  // Quality Gate: Ethical risks must be assessed
  if (ethicsAssessment.highRiskFactors && ethicsAssessment.highRiskFactors.length > 0) {
    await ctx.breakpoint({
      question: `Ethical assessment identified ${ethicsAssessment.highRiskFactors.length} high-risk factors. Review mitigation strategies and approve?`,
      title: 'Ethical Risk Review',
      context: {
        runId: ctx.runId,
        highRiskFactors: ethicsAssessment.highRiskFactors,
        mitigationStrategies: ethicsAssessment.mitigationStrategies,
        recommendation: 'Ensure fairness assessment and bias detection are included in the ML pipeline'
      }
    });
  }

  // Phase 10: Final Scope Document Generation
  const scopeDocument = await ctx.task(scopeDocumentGenerationTask, {
    projectName,
    businessDomain,
    businessUnderstanding,
    metricsDefinition,
    dataAssessment,
    feasibilityAnalysis,
    constraintsDocumentation,
    problemFormulation,
    resourceEstimation,
    riskAssessment,
    ethicsAssessment,
    stakeholders
  });

  // Final Quality Gate: Overall feasibility score
  const feasibilityScore = feasibilityAnalysis.overallFeasibilityScore || 0;
  const proceed = feasibilityScore >= 70;

  // Final Breakpoint: Project Approval
  await ctx.breakpoint({
    question: `ML Project Scoping Complete for ${projectName}. Feasibility Score: ${feasibilityScore}/100. Approve project to proceed to next phase?`,
    title: 'Project Scoping Approval',
    context: {
      runId: ctx.runId,
      projectName,
      feasibilityScore,
      recommendation: proceed ? 'Proceed to Exploratory Data Analysis phase' : 'Address gaps before proceeding',
      files: [
        { path: `artifacts/final-scope-document.json`, format: 'json', content: scopeDocument },
        { path: `artifacts/final-scope-document.md`, format: 'markdown', content: scopeDocument.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    feasibilityScore,
    proceed,
    scopeDocument: scopeDocument.document,
    businessObjectives: businessUnderstanding.objectives,
    successMetrics: metricsDefinition.mlMetrics,
    dataAvailability: {
      score: dataAvailabilityScore,
      gaps: dataAssessment.dataGaps,
      sources: dataAssessment.identifiedSources
    },
    technicalRequirements: {
      mlProblemType: problemFormulation.mlProblemType,
      recommendedApproaches: problemFormulation.recommendedApproaches,
      infrastructure: feasibilityAnalysis.infrastructureRequirements,
      teamSkills: resourceEstimation.requiredSkills
    },
    constraints: constraintsDocumentation.constraints,
    timeline: resourceEstimation.estimatedTimeline,
    risks: riskAssessment.risks,
    ethicalConsiderations: ethicsAssessment.considerations,
    nextSteps: scopeDocument.nextSteps,
    metadata: {
      processId: 'specializations/data-science-ml/ml-project-scoping',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const businessUnderstandingTask = defineTask('business-understanding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Business Understanding - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior ML Product Manager with expertise in CRISP-DM methodology',
      task: 'Conduct comprehensive business understanding for ML project scoping',
      context: {
        projectName: args.projectName,
        businessDomain: args.businessDomain,
        initialRequirements: args.initialRequirements,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Analyze the initial requirements and business domain to understand the business context',
        '2. Define 3-5 clear, measurable business objectives that this ML project aims to achieve',
        '3. Identify key stakeholders and their primary concerns/expectations',
        '4. Define business success metrics (revenue impact, cost savings, efficiency gains, etc.)',
        '5. Document current baseline performance (if any existing solution exists)',
        '6. Identify business constraints (budget, timeline, regulatory, operational)',
        '7. Define the scope boundaries - what is IN scope and what is OUT of scope',
        '8. Document assumptions about the business environment and problem space',
        '9. Identify potential business value and ROI expectations',
        '10. Provide recommendations for stakeholder alignment activities'
      ],
      outputFormat: 'JSON object with structured business understanding'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'successMetrics', 'constraints', 'scopeBoundaries'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              measurable: { type: 'boolean' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          },
          minItems: 3
        },
        successMetrics: {
          type: 'object',
          properties: {
            businessMetrics: { type: 'array', items: { type: 'string' } },
            currentBaseline: { type: 'string' },
            targetImprovement: { type: 'string' }
          }
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            budget: { type: 'string' },
            timeline: { type: 'string' },
            regulatory: { type: 'array', items: { type: 'string' } },
            operational: { type: 'array', items: { type: 'string' } }
          }
        },
        scopeBoundaries: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        expectedROI: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'business-understanding', 'crisp-dm']
}));

export const metricsDefinitionTask = defineTask('metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: ML Metrics and KPIs Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Data Scientist with expertise in ML evaluation metrics',
      task: 'Define comprehensive ML success metrics and KPIs aligned with business objectives',
      context: {
        projectName: args.projectName,
        businessObjectives: args.businessObjectives,
        businessDomain: args.businessDomain,
        successMetrics: args.successMetrics
      },
      instructions: [
        '1. Map each business objective to specific ML metrics (accuracy, precision, recall, F1, AUC, MAE, RMSE, etc.)',
        '2. Define primary and secondary ML evaluation metrics with target thresholds',
        '3. Specify online metrics (production performance) vs offline metrics (model evaluation)',
        '4. Define guardrail metrics to prevent regression in critical areas',
        '5. Establish baseline performance benchmarks (current system or naive baseline)',
        '6. Define statistical significance criteria for A/B testing',
        '7. Identify required data types and features needed to compute these metrics',
        '8. Document trade-offs between different metrics (e.g., precision vs recall)',
        '9. Specify latency and throughput requirements for real-time systems',
        '10. Define monitoring metrics for production deployment (data drift, model degradation)'
      ],
      outputFormat: 'JSON object with comprehensive metrics definition'
    },
    outputSchema: {
      type: 'object',
      required: ['mlMetrics', 'baselinePerformance', 'requiredDataTypes'],
      properties: {
        mlMetrics: {
          type: 'object',
          properties: {
            primary: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  targetThreshold: { type: 'number' },
                  businessJustification: { type: 'string' }
                }
              }
            },
            secondary: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  targetThreshold: { type: 'number' }
                }
              }
            },
            guardrails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  minimumThreshold: { type: 'number' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        onlineVsOfflineMetrics: {
          type: 'object',
          properties: {
            offline: { type: 'array', items: { type: 'string' } },
            online: { type: 'array', items: { type: 'string' } }
          }
        },
        baselinePerformance: {
          type: 'object',
          properties: {
            currentSystem: { type: 'string' },
            naiveBaseline: { type: 'string' },
            targetImprovement: { type: 'string' }
          }
        },
        performanceRequirements: {
          type: 'object',
          properties: {
            latency: { type: 'string' },
            throughput: { type: 'string' },
            availability: { type: 'string' }
          }
        },
        requiredDataTypes: { type: 'array', items: { type: 'string' } },
        statisticalCriteria: {
          type: 'object',
          properties: {
            confidenceLevel: { type: 'number' },
            minimumSampleSize: { type: 'number' },
            minimumDetectableEffect: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'metrics-definition', 'evaluation']
}));

export const dataAvailabilityTask = defineTask('data-availability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Data Availability Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineering Lead with expertise in data discovery and quality assessment',
      task: 'Assess data availability, quality, and gaps for the ML project',
      context: {
        projectName: args.projectName,
        objectives: args.objectives,
        requiredDataTypes: args.requiredDataTypes
      },
      instructions: [
        '1. Identify existing data sources (databases, data lakes, APIs, third-party sources)',
        '2. Assess data availability for each required data type (available, partially available, not available)',
        '3. Estimate data volume and coverage (historical depth, completeness, sample size)',
        '4. Evaluate data quality dimensions (accuracy, completeness, consistency, timeliness)',
        '5. Identify labeled data availability for supervised learning (if applicable)',
        '6. Document data access and privacy constraints (PII, GDPR, HIPAA, etc.)',
        '7. Identify data gaps and recommend data collection strategies',
        '8. Assess data versioning and lineage capabilities',
        '9. Calculate overall data availability score (0-100)',
        '10. Provide recommendations for data preparation and quality improvement'
      ],
      outputFormat: 'JSON object with comprehensive data availability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['availabilityScore', 'identifiedSources', 'dataGaps'],
      properties: {
        identifiedSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceName: { type: 'string' },
              dataType: { type: 'string' },
              availability: { type: 'string', enum: ['available', 'partial', 'not-available'] },
              volume: { type: 'string' },
              quality: { type: 'string', enum: ['high', 'medium', 'low'] },
              accessConstraints: { type: 'string' }
            }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            accuracy: { type: 'string' },
            completeness: { type: 'number' },
            consistency: { type: 'string' },
            timeliness: { type: 'string' }
          }
        },
        labeledData: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            labelQuality: { type: 'string' },
            sampleSize: { type: 'number' },
            labelingStrategy: { type: 'string' }
          }
        },
        dataGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              criticality: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        privacyConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string' },
              impact: { type: 'string' },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        availabilityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall data availability score'
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'data-assessment', 'data-quality']
}));

export const feasibilityAnalysisTask = defineTask('feasibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Technical Feasibility Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Architect with expertise in ML system design and infrastructure',
      task: 'Conduct comprehensive technical feasibility analysis for the ML project',
      context: {
        projectName: args.projectName,
        objectives: args.objectives,
        dataAssessment: args.dataAssessment,
        metricsDefinition: args.metricsDefinition,
        businessDomain: args.businessDomain
      },
      instructions: [
        '1. Assess technical feasibility based on data availability, problem complexity, and current ML capabilities',
        '2. Identify candidate ML approaches (supervised/unsupervised, deep learning, classical ML, ensemble methods)',
        '3. Evaluate infrastructure requirements (compute, storage, GPU/TPU, cloud vs on-premise)',
        '4. Assess technical risks (scalability, latency, model complexity, training time)',
        '5. Evaluate integration complexity with existing systems and workflows',
        '6. Identify required tools and frameworks (TensorFlow, PyTorch, MLflow, Feast, etc.)',
        '7. Assess team skill gaps and training requirements',
        '8. Evaluate model serving requirements (batch, real-time, edge deployment)',
        '9. Calculate overall feasibility score (0-100) considering all factors',
        '10. Provide go/no-go recommendation with confidence level'
      ],
      outputFormat: 'JSON object with comprehensive feasibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallFeasibilityScore', 'recommendation', 'candidateApproaches'],
      properties: {
        candidateApproaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              estimatedComplexity: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        infrastructureRequirements: {
          type: 'object',
          properties: {
            compute: { type: 'string' },
            storage: { type: 'string' },
            gpuRequired: { type: 'boolean' },
            cloudVsOnPremise: { type: 'string' },
            estimatedCost: { type: 'string' }
          }
        },
        toolsAndFrameworks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              availability: { type: 'string', enum: ['available', 'needs-setup', 'needs-procurement'] }
            }
          }
        },
        technicalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        integrationComplexity: {
          type: 'object',
          properties: {
            complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
            integrationPoints: { type: 'array', items: { type: 'string' } },
            challenges: { type: 'array', items: { type: 'string' } }
          }
        },
        modelServing: {
          type: 'object',
          properties: {
            servingPattern: { type: 'string', enum: ['batch', 'real-time', 'edge', 'hybrid'] },
            latencyRequirement: { type: 'string' },
            scalabilityRequirement: { type: 'string' }
          }
        },
        overallFeasibilityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall technical feasibility score'
        },
        recommendation: {
          type: 'object',
          properties: {
            decision: { type: 'string', enum: ['go', 'no-go', 'conditional-go'] },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            justification: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'feasibility', 'technical-analysis']
}));

export const constraintsDocumentationTask = defineTask('constraints-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Constraints and Requirements Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Systems Analyst with expertise in requirements engineering',
      task: 'Document comprehensive constraints and requirements for the ML project',
      context: {
        projectName: args.projectName,
        businessUnderstanding: args.businessUnderstanding,
        metricsDefinition: args.metricsDefinition,
        feasibilityAnalysis: args.feasibilityAnalysis,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Document functional requirements (what the ML system must do)',
        '2. Document non-functional requirements (performance, scalability, reliability, security)',
        '3. Identify regulatory and compliance constraints (GDPR, HIPAA, industry standards)',
        '4. Document resource constraints (budget, timeline, team capacity)',
        '5. Identify technical constraints (infrastructure, data access, integration points)',
        '6. Document model interpretability and explainability requirements',
        '7. Specify fairness and bias prevention requirements',
        '8. Define model governance and audit requirements',
        '9. Document deployment and operational constraints',
        '10. Prioritize requirements (must-have, should-have, nice-to-have)'
      ],
      outputFormat: 'JSON object with comprehensive constraints and requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'functionalRequirements', 'nonFunctionalRequirements'],
      properties: {
        functionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              rationale: { type: 'string' }
            }
          }
        },
        nonFunctionalRequirements: {
          type: 'object',
          properties: {
            performance: { type: 'array', items: { type: 'string' } },
            scalability: { type: 'array', items: { type: 'string' } },
            reliability: { type: 'array', items: { type: 'string' } },
            security: { type: 'array', items: { type: 'string' } },
            maintainability: { type: 'array', items: { type: 'string' } }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            regulatory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  regulation: { type: 'string' },
                  impact: { type: 'string' },
                  complianceRequirements: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            resource: {
              type: 'object',
              properties: {
                budget: { type: 'string' },
                timeline: { type: 'string' },
                teamSize: { type: 'string' }
              }
            },
            technical: { type: 'array', items: { type: 'string' } },
            operational: { type: 'array', items: { type: 'string' } }
          }
        },
        interpretabilityRequirements: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            level: { type: 'string', enum: ['high', 'medium', 'low'] },
            methods: { type: 'array', items: { type: 'string' } },
            justification: { type: 'string' }
          }
        },
        fairnessRequirements: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            protectedAttributes: { type: 'array', items: { type: 'string' } },
            fairnessMetrics: { type: 'array', items: { type: 'string' } },
            mitigationStrategies: { type: 'array', items: { type: 'string' } }
          }
        },
        governanceRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              stakeholder: { type: 'string' },
              frequency: { type: 'string' }
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
  labels: ['ml-scoping', 'planning', 'constraints', 'requirements']
}));

export const problemFormulationTask = defineTask('problem-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: ML Problem Formulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior ML Research Scientist with expertise in problem formulation',
      task: 'Formulate the business problem as a well-defined ML problem',
      context: {
        projectName: args.projectName,
        businessObjectives: args.businessObjectives,
        dataAssessment: args.dataAssessment,
        constraints: args.constraints
      },
      instructions: [
        '1. Translate business objectives into a precise ML problem statement',
        '2. Classify the ML problem type (classification, regression, clustering, ranking, recommendation, etc.)',
        '3. Define the prediction target and input features conceptually',
        '4. Specify the learning paradigm (supervised, unsupervised, semi-supervised, reinforcement learning)',
        '5. Identify similar ML problems and relevant research papers/solutions',
        '6. Recommend specific ML approaches and algorithms suitable for this problem',
        '7. Define the model output format and how it will be consumed',
        '8. Identify potential pitfalls (data leakage, label noise, class imbalance, etc.)',
        '9. Define success criteria for model performance',
        '10. Provide alternative problem formulations if applicable'
      ],
      outputFormat: 'JSON object with precise ML problem formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['mlProblemType', 'problemStatement', 'recommendedApproaches'],
      properties: {
        problemStatement: {
          type: 'string',
          description: 'Clear, concise ML problem statement'
        },
        mlProblemType: {
          type: 'string',
          enum: ['classification', 'regression', 'clustering', 'ranking', 'recommendation', 'anomaly-detection', 'time-series-forecasting', 'natural-language-processing', 'computer-vision', 'reinforcement-learning', 'multi-task-learning']
        },
        learningParadigm: {
          type: 'string',
          enum: ['supervised', 'unsupervised', 'semi-supervised', 'reinforcement-learning', 'self-supervised']
        },
        predictionTarget: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            type: { type: 'string' },
            cardinality: { type: 'string' }
          }
        },
        inputFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureCategory: { type: 'string' },
              description: { type: 'string' },
              dataType: { type: 'string' }
            }
          }
        },
        recommendedApproaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              algorithm: { type: 'string' },
              rationale: { type: 'string' },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              precedents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        modelOutput: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            interpretation: { type: 'string' },
            consumptionPattern: { type: 'string' }
          }
        },
        potentialPitfalls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pitfall: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              prevention: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        alternativeFormulations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              formulation: { type: 'string' },
              tradeoffs: { type: 'string' }
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
  labels: ['ml-scoping', 'planning', 'problem-formulation', 'ml-design']
}));

export const resourceEstimationTask = defineTask('resource-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Resource and Timeline Estimation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Project Manager with expertise in ML project planning',
      task: 'Estimate resources, timeline, and team requirements for the ML project',
      context: {
        projectName: args.projectName,
        problemFormulation: args.problemFormulation,
        feasibilityAnalysis: args.feasibilityAnalysis,
        dataAssessment: args.dataAssessment
      },
      instructions: [
        '1. Estimate project phases and timeline (data preparation, modeling, evaluation, deployment)',
        '2. Identify required team roles and skill sets (data engineers, ML engineers, MLOps, etc.)',
        '3. Estimate computational resources (training time, GPU hours, storage)',
        '4. Estimate costs (infrastructure, tools, licenses, third-party services)',
        '5. Identify dependencies and critical path items',
        '6. Define project milestones and deliverables',
        '7. Estimate effort for each phase in person-weeks/months',
        '8. Identify skill gaps and training requirements',
        '9. Plan for iterative development and experimentation time',
        '10. Include buffer for uncertainty and risk mitigation'
      ],
      outputFormat: 'JSON object with comprehensive resource and timeline estimation'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedTimeline', 'requiredSkills', 'estimatedCost'],
      properties: {
        estimatedTimeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  effort: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  deliverable: { type: 'string' },
                  targetDate: { type: 'string' }
                }
              }
            }
          }
        },
        requiredSkills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              capacity: { type: 'string' },
              availability: { type: 'string', enum: ['available', 'needs-hiring', 'needs-training'] }
            }
          }
        },
        computationalResources: {
          type: 'object',
          properties: {
            trainingTime: { type: 'string' },
            gpuHours: { type: 'string' },
            storage: { type: 'string' },
            inferenceCapacity: { type: 'string' }
          }
        },
        estimatedCost: {
          type: 'object',
          properties: {
            infrastructure: { type: 'string' },
            tools: { type: 'string' },
            personnel: { type: 'string' },
            thirdPartyServices: { type: 'string' },
            total: { type: 'string' },
            breakdown: { type: 'array', items: { type: 'string' } }
          }
        },
        riskBuffer: {
          type: 'object',
          properties: {
            timeBuffer: { type: 'string' },
            costBuffer: { type: 'string' },
            justification: { type: 'string' }
          }
        },
        skillGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              criticality: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
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
  labels: ['ml-scoping', 'planning', 'resource-estimation', 'project-management']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Risk Assessment and Mitigation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Risk Analyst with expertise in ML system risks and failure modes',
      task: 'Conduct comprehensive risk assessment and develop mitigation strategies',
      context: {
        projectName: args.projectName,
        businessDomain: args.businessDomain,
        dataAssessment: args.dataAssessment,
        feasibilityAnalysis: args.feasibilityAnalysis,
        constraints: args.constraints,
        problemFormulation: args.problemFormulation
      },
      instructions: [
        '1. Identify technical risks (model performance, scalability, integration failures)',
        '2. Identify data risks (quality issues, availability, bias, privacy breaches)',
        '3. Identify operational risks (deployment failures, monitoring gaps, model drift)',
        '4. Identify business risks (misalignment with objectives, negative ROI, stakeholder concerns)',
        '5. Assess risk probability and impact for each identified risk',
        '6. Develop mitigation strategies for high and medium priority risks',
        '7. Define risk triggers and early warning indicators',
        '8. Create contingency plans for critical risks',
        '9. Identify risks related to AI safety and ethical concerns',
        '10. Prioritize risks and create risk register with owners and timelines'
      ],
      outputFormat: 'JSON object with comprehensive risk assessment and mitigation plans'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigationStrategies', 'riskRegister'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'data', 'operational', 'business', 'ethical', 'security'] },
              description: { type: 'string' },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              cost: { type: 'string' },
              effectiveness: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        contingencyPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              trigger: { type: 'string' },
              action: { type: 'string' },
              responsibility: { type: 'string' }
            }
          }
        },
        earlyWarningIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              threshold: { type: 'string' },
              monitoringFrequency: { type: 'string' },
              relatedRisks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        riskRegister: {
          type: 'object',
          properties: {
            criticalRisks: { type: 'number' },
            highRisks: { type: 'number' },
            mediumRisks: { type: 'number' },
            lowRisks: { type: 'number' },
            overallRiskLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'risk-assessment', 'risk-management']
}));

export const ethicsAssessmentTask = defineTask('ethics-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Ethical and Fairness Considerations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI Ethics Specialist with expertise in responsible AI and fairness',
      task: 'Assess ethical implications and fairness considerations for the ML project',
      context: {
        projectName: args.projectName,
        businessDomain: args.businessDomain,
        problemFormulation: args.problemFormulation,
        dataAssessment: args.dataAssessment,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Identify ethical concerns related to the ML application (autonomy, privacy, transparency)',
        '2. Assess potential for algorithmic bias and discrimination across demographic groups',
        '3. Evaluate fairness requirements and identify protected attributes',
        '4. Assess data privacy and consent implications',
        '5. Evaluate model transparency and explainability requirements for stakeholders',
        '6. Identify potential negative externalities or unintended consequences',
        '7. Assess alignment with ethical AI principles (fairness, accountability, transparency)',
        '8. Recommend fairness metrics and bias detection methods (demographic parity, equalized odds, etc.)',
        '9. Develop mitigation strategies for identified ethical risks',
        '10. Define governance and oversight mechanisms for ongoing ethical compliance'
      ],
      outputFormat: 'JSON object with comprehensive ethics and fairness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['considerations', 'fairnessAssessment', 'mitigationStrategies'],
      properties: {
        ethicalConcerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              category: { type: 'string', enum: ['privacy', 'fairness', 'transparency', 'autonomy', 'accountability', 'safety'] },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        fairnessAssessment: {
          type: 'object',
          properties: {
            biasRisk: { type: 'string', enum: ['high', 'medium', 'low'] },
            protectedAttributes: { type: 'array', items: { type: 'string' } },
            fairnessMetrics: { type: 'array', items: { type: 'string' } },
            historicalBias: { type: 'string' },
            representationBias: { type: 'string' }
          }
        },
        privacyAssessment: {
          type: 'object',
          properties: {
            personalDataUsage: { type: 'string' },
            consentMechanism: { type: 'string' },
            dataMinimization: { type: 'string' },
            privacyRisks: { type: 'array', items: { type: 'string' } }
          }
        },
        transparencyRequirements: {
          type: 'object',
          properties: {
            explainabilityLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
            stakeholderCommunication: { type: 'array', items: { type: 'string' } },
            modelCardRequired: { type: 'boolean' },
            auditTrail: { type: 'string' }
          }
        },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              strategy: { type: 'string' },
              implementation: { type: 'string' },
              validation: { type: 'string' }
            }
          }
        },
        highRiskFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' },
              residualRisk: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        governanceMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              frequency: { type: 'string' },
              stakeholders: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        considerations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Summary of key ethical considerations'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'ethics', 'fairness', 'responsible-ai']
}));

export const scopeDocumentGenerationTask = defineTask('scope-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Final Scope Document Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Technical Writer with expertise in project documentation',
      task: 'Generate comprehensive ML project scope document synthesizing all analyses',
      context: {
        projectName: args.projectName,
        businessDomain: args.businessDomain,
        businessUnderstanding: args.businessUnderstanding,
        metricsDefinition: args.metricsDefinition,
        dataAssessment: args.dataAssessment,
        feasibilityAnalysis: args.feasibilityAnalysis,
        constraintsDocumentation: args.constraintsDocumentation,
        problemFormulation: args.problemFormulation,
        resourceEstimation: args.resourceEstimation,
        riskAssessment: args.riskAssessment,
        ethicsAssessment: args.ethicsAssessment,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Create executive summary with key findings and recommendations',
        '2. Synthesize business objectives and success metrics into coherent narrative',
        '3. Document ML problem formulation with technical specifications',
        '4. Summarize data availability, quality, and preparation requirements',
        '5. Present technical feasibility analysis with recommended approaches',
        '6. Consolidate constraints, requirements, and acceptance criteria',
        '7. Summarize resource estimates, timeline, and team requirements',
        '8. Present risk assessment with mitigation strategies',
        '9. Document ethical considerations and fairness requirements',
        '10. Define clear next steps and phase gate criteria for project progression',
        '11. Generate both structured JSON document and markdown report'
      ],
      outputFormat: 'JSON object with complete scope document and markdown report'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown', 'nextSteps'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            projectOverview: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                domain: { type: 'string' },
                objectives: { type: 'array', items: { type: 'string' } },
                stakeholders: { type: 'array', items: { type: 'string' } }
              }
            },
            mlProblemDefinition: {
              type: 'object',
              properties: {
                problemStatement: { type: 'string' },
                problemType: { type: 'string' },
                recommendedApproaches: { type: 'array', items: { type: 'string' } }
              }
            },
            successMetrics: {
              type: 'object',
              properties: {
                businessMetrics: { type: 'array', items: { type: 'string' } },
                mlMetrics: { type: 'array', items: { type: 'string' } },
                performanceTargets: { type: 'object' }
              }
            },
            dataReadiness: {
              type: 'object',
              properties: {
                availabilityScore: { type: 'number' },
                qualityAssessment: { type: 'string' },
                gaps: { type: 'array', items: { type: 'string' } }
              }
            },
            technicalFeasibility: {
              type: 'object',
              properties: {
                feasibilityScore: { type: 'number' },
                recommendation: { type: 'string' },
                infrastructure: { type: 'object' }
              }
            },
            constraints: { type: 'object' },
            resourcePlan: {
              type: 'object',
              properties: {
                timeline: { type: 'string' },
                team: { type: 'array', items: { type: 'string' } },
                budget: { type: 'string' }
              }
            },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  severity: { type: 'string' },
                  mitigation: { type: 'string' }
                }
              }
            },
            ethicsAndFairness: {
              type: 'object',
              properties: {
                concerns: { type: 'array', items: { type: 'string' } },
                mitigations: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        markdown: {
          type: 'string',
          description: 'Complete scope document in markdown format for human review'
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              phase: { type: 'string' },
              owner: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] }
            }
          }
        },
        approvalCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-scoping', 'planning', 'documentation', 'scope-document']
}));
