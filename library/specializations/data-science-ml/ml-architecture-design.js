/**
 * @process specializations/data-science-ml/ml-architecture-design
 * @description ML Architecture Design and Model Selection - Design system architecture for ML pipelines,
 * select candidate model architectures, define evaluation criteria, and establish baseline performance benchmarks
 * with iterative refinement.
 * @inputs { projectName: string, problemFormulation?: object, dataCharacteristics?: object, constraints?: object }
 * @outputs { success: boolean, architecture: object, modelCandidates: array, baselinePerformance: object, implementationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/ml-architecture-design', {
 *   projectName: 'Customer Churn Prediction',
 *   problemFormulation: { mlProblemType: 'classification', learningParadigm: 'supervised' },
 *   dataCharacteristics: { volumeGB: 50, recordCount: 1000000, featureCount: 45 },
 *   constraints: { latencyMs: 100, budget: '$50K', timeline: '3 months' }
 * });
 *
 * @references
 * - Designing Machine Learning Systems by Chip Huyen: https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/
 * - Production ML Systems - Google: https://developers.google.com/machine-learning/crash-course/production-ml-systems
 * - ML Test Score Rubric: https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/aad9f93b86b7addfea4c419b9100c6cdd26cacea.pdf
 * - Rules of Machine Learning - Google: https://developers.google.com/machine-learning/guides/rules-of-ml
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    problemFormulation = {},
    dataCharacteristics = {},
    constraints = {}
  } = inputs;

  // Phase 1: System Architecture Design
  const systemArchitecture = await ctx.task(systemArchitectureDesignTask, {
    projectName,
    problemFormulation,
    dataCharacteristics,
    constraints
  });

  // Quality Gate: Architecture must address all core components
  const requiredComponents = ['data-ingestion', 'feature-engineering', 'training', 'evaluation', 'serving'];
  const missingComponents = requiredComponents.filter(
    component => !systemArchitecture.components.some(c => c.type === component)
  );

  if (missingComponents.length > 0) {
    return {
      success: false,
      error: `Missing required architecture components: ${missingComponents.join(', ')}`,
      phase: 'system-architecture-design',
      architecture: null
    };
  }

  // Breakpoint: Review system architecture
  await ctx.breakpoint({
    question: `Review ML system architecture for ${projectName}. Does the architecture meet scalability, latency, and integration requirements?`,
    title: 'System Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      architecture: systemArchitecture,
      files: [{
        path: 'artifacts/phase1-system-architecture.json',
        format: 'json',
        content: systemArchitecture
      }, {
        path: 'artifacts/phase1-system-architecture-diagram.md',
        format: 'markdown',
        content: systemArchitecture.diagram
      }]
    }
  });

  // Phase 2: Model Architecture Selection
  const modelSelection = await ctx.task(modelArchitectureSelectionTask, {
    projectName,
    problemFormulation,
    dataCharacteristics,
    constraints,
    systemArchitecture
  });

  // Phase 3: Baseline Model Development
  const baselineModel = await ctx.task(baselineModelTask, {
    projectName,
    problemFormulation,
    dataCharacteristics,
    modelSelection
  });

  // Breakpoint: Review baseline results
  await ctx.breakpoint({
    question: `Baseline model established for ${projectName}. Performance: ${baselineModel.performance}. Approve to proceed with candidate models?`,
    title: 'Baseline Model Review',
    context: {
      runId: ctx.runId,
      projectName,
      baseline: baselineModel,
      files: [{
        path: 'artifacts/phase3-baseline-model.json',
        format: 'json',
        content: baselineModel
      }]
    }
  });

  // Phase 4: Candidate Model Architecture Design (Parallel)
  const candidateModelSpecs = modelSelection.candidateModels.slice(0, 3); // Top 3 candidates
  const candidateModels = await ctx.parallel.all(
    candidateModelSpecs.map((candidate, index) =>
      () => ctx.task(candidateModelDesignTask, {
        projectName,
        candidateIndex: index + 1,
        candidateSpec: candidate,
        problemFormulation,
        dataCharacteristics,
        baselinePerformance: baselineModel.performance,
        constraints
      })
    )
  );

  // Phase 5: Evaluation Criteria Definition
  const evaluationCriteria = await ctx.task(evaluationCriteriaTask, {
    projectName,
    problemFormulation,
    candidateModels,
    baselinePerformance: baselineModel.performance,
    constraints
  });

  // Phase 6: Architecture Comparison and Ranking
  const architectureComparison = await ctx.task(architectureComparisonTask, {
    projectName,
    candidateModels,
    baselineModel,
    evaluationCriteria,
    constraints
  });

  // Quality Gate: At least one candidate must exceed baseline
  const viableCandidates = architectureComparison.rankedArchitectures.filter(
    arch => arch.exceedsBaseline === true
  );

  if (viableCandidates.length === 0) {
    await ctx.breakpoint({
      question: `No candidate architectures exceed baseline performance. Should we refine architectures, adjust constraints, or revisit problem formulation?`,
      title: 'No Viable Candidates Warning',
      context: {
        runId: ctx.runId,
        projectName,
        comparison: architectureComparison,
        recommendation: 'Consider relaxing constraints, adding more data, or exploring alternative approaches'
      }
    });
  }

  // Breakpoint: Review architecture comparison
  await ctx.breakpoint({
    question: `Review architecture comparison for ${projectName}. Top recommendation: ${architectureComparison.recommendation.architecture}. Approve?`,
    title: 'Architecture Comparison Review',
    context: {
      runId: ctx.runId,
      projectName,
      comparison: architectureComparison,
      files: [{
        path: 'artifacts/phase6-architecture-comparison.json',
        format: 'json',
        content: architectureComparison
      }, {
        path: 'artifacts/phase6-architecture-comparison-report.md',
        format: 'markdown',
        content: architectureComparison.comparisonReport
      }]
    }
  });

  // Phase 7: Training Infrastructure Planning
  const trainingInfrastructure = await ctx.task(trainingInfrastructureTask, {
    projectName,
    recommendedArchitecture: architectureComparison.recommendation,
    dataCharacteristics,
    constraints
  });

  // Phase 8: Serving Infrastructure Planning
  const servingInfrastructure = await ctx.task(servingInfrastructureTask, {
    projectName,
    recommendedArchitecture: architectureComparison.recommendation,
    constraints,
    systemArchitecture
  });

  // Phase 9: MLOps Pipeline Design
  const mlOpsPipeline = await ctx.task(mlOpsPipelineTask, {
    projectName,
    systemArchitecture,
    recommendedArchitecture: architectureComparison.recommendation,
    trainingInfrastructure,
    servingInfrastructure
  });

  // Phase 10: Implementation Roadmap
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    projectName,
    systemArchitecture,
    recommendedArchitecture: architectureComparison.recommendation,
    trainingInfrastructure,
    servingInfrastructure,
    mlOpsPipeline,
    constraints
  });

  // Phase 11: Risk and Mitigation Analysis
  const riskAnalysis = await ctx.task(architectureRiskAnalysisTask, {
    projectName,
    systemArchitecture,
    recommendedArchitecture: architectureComparison.recommendation,
    implementationRoadmap,
    constraints
  });

  // Quality Gate: Critical risks must have mitigation plans
  const criticalRisksWithoutMitigation = riskAnalysis.risks.filter(
    risk => risk.severity === 'critical' && !risk.mitigationPlan
  );

  if (criticalRisksWithoutMitigation.length > 0) {
    await ctx.breakpoint({
      question: `${criticalRisksWithoutMitigation.length} critical risks lack mitigation plans. Should we develop mitigation strategies before proceeding?`,
      title: 'Critical Risk Warning',
      context: {
        runId: ctx.runId,
        projectName,
        criticalRisks: criticalRisksWithoutMitigation,
        recommendation: 'Develop mitigation strategies for all critical risks'
      }
    });
  }

  // Final Breakpoint: Architecture Design Approval
  await ctx.breakpoint({
    question: `ML Architecture Design complete for ${projectName}. Recommended: ${architectureComparison.recommendation.architecture}. Expected performance improvement: ${architectureComparison.recommendation.expectedImprovement}. Approve to proceed to implementation?`,
    title: 'Architecture Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      recommendation: architectureComparison.recommendation,
      estimatedTimeline: implementationRoadmap.timeline,
      estimatedCost: implementationRoadmap.cost,
      files: [
        { path: 'artifacts/final-architecture-design.json', format: 'json', content: architectureComparison.recommendation },
        { path: 'artifacts/final-architecture-design.md', format: 'markdown', content: implementationRoadmap.markdown },
        { path: 'artifacts/implementation-roadmap.md', format: 'markdown', content: implementationRoadmap.roadmapMarkdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    architecture: {
      system: systemArchitecture,
      model: architectureComparison.recommendation,
      training: trainingInfrastructure,
      serving: servingInfrastructure,
      mlops: mlOpsPipeline
    },
    modelCandidates: candidateModels,
    baselinePerformance: baselineModel.performance,
    comparison: architectureComparison,
    implementationPlan: implementationRoadmap,
    risks: riskAnalysis,
    nextSteps: implementationRoadmap.phases,
    metadata: {
      processId: 'specializations/data-science-ml/ml-architecture-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const systemArchitectureDesignTask = defineTask('system-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: System Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Systems Architect with expertise in designing production ML systems',
      task: 'Design comprehensive ML system architecture covering all components from data ingestion to model serving',
      context: {
        projectName: args.projectName,
        problemFormulation: args.problemFormulation,
        dataCharacteristics: args.dataCharacteristics,
        constraints: args.constraints
      },
      instructions: [
        '1. Design data ingestion pipeline (batch/streaming, sources, validation)',
        '2. Design feature engineering pipeline (transformations, feature store, serving consistency)',
        '3. Design training pipeline (data preparation, training orchestration, experiment tracking)',
        '4. Design model evaluation pipeline (validation, A/B testing, performance monitoring)',
        '5. Design serving architecture (batch predictions, real-time inference, edge deployment)',
        '6. Design monitoring and observability (metrics, logging, alerting, drift detection)',
        '7. Define component interfaces and data contracts',
        '8. Identify integration points with existing systems',
        '9. Design for scalability, fault tolerance, and maintainability',
        '10. Create architecture diagram (mermaid or text-based representation)'
      ],
      outputFormat: 'JSON object with comprehensive system architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'dataFlow', 'integrationPoints'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['data-ingestion', 'feature-engineering', 'training', 'evaluation', 'serving', 'monitoring', 'orchestration'] },
              description: { type: 'string' },
              technologies: { type: 'array', items: { type: 'string' } },
              scalability: { type: 'string' },
              interfaces: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataFlow: {
          type: 'object',
          properties: {
            trainingPath: { type: 'array', items: { type: 'string' } },
            servingPath: { type: 'array', items: { type: 'string' } },
            monitoringPath: { type: 'array', items: { type: 'string' } }
          }
        },
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              interface: { type: 'string' },
              dataContract: { type: 'string' },
              latencyRequirement: { type: 'string' }
            }
          }
        },
        scalabilityStrategy: {
          type: 'object',
          properties: {
            dataVolume: { type: 'string' },
            trafficHandling: { type: 'string' },
            resourceScaling: { type: 'string' }
          }
        },
        faultTolerance: {
          type: 'object',
          properties: {
            redundancy: { type: 'string' },
            failover: { type: 'string' },
            dataRecovery: { type: 'string' }
          }
        },
        diagram: {
          type: 'string',
          description: 'Architecture diagram in markdown/mermaid format'
        },
        designRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'system-design', 'infrastructure']
}));

export const modelArchitectureSelectionTask = defineTask('model-architecture-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Model Architecture Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Engineer with expertise in model architecture design',
      task: 'Identify and evaluate candidate model architectures for the ML problem',
      context: {
        projectName: args.projectName,
        problemFormulation: args.problemFormulation,
        dataCharacteristics: args.dataCharacteristics,
        constraints: args.constraints,
        systemArchitecture: args.systemArchitecture
      },
      instructions: [
        '1. Identify candidate model families (classical ML, deep learning, ensemble methods)',
        '2. For each candidate, specify architecture details (layers, units, activation functions)',
        '3. Assess computational requirements (FLOPs, memory, training time)',
        '4. Evaluate interpretability vs performance trade-offs',
        '5. Consider state-of-the-art architectures for the problem domain',
        '6. Assess transfer learning opportunities (pretrained models)',
        '7. Evaluate model complexity vs available data trade-offs',
        '8. Prioritize candidates based on feasibility and expected performance',
        '9. Identify architectural innovations that could improve performance',
        '10. Recommend top 3-5 architectures for detailed design'
      ],
      outputFormat: 'JSON object with candidate model architectures'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateModels', 'selectionCriteria'],
      properties: {
        candidateModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              family: { type: 'string', enum: ['classical-ml', 'deep-learning', 'ensemble', 'hybrid'] },
              description: { type: 'string' },
              architectureDetails: { type: 'string' },
              transferLearning: { type: 'boolean' },
              pretrainedModel: { type: 'string' },
              computationalComplexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
              interpretability: { type: 'string', enum: ['high', 'medium', 'low'] },
              trainingTime: { type: 'string' },
              inferenceLatency: { type: 'string' },
              expectedPerformance: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              precedents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        selectionCriteria: {
          type: 'object',
          properties: {
            primaryCriterion: { type: 'string' },
            secondaryCriteria: { type: 'array', items: { type: 'string' } },
            tradeoffAnalysis: { type: 'string' }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3-5 recommended architectures for detailed design'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'model-selection', 'architecture-design']
}));

export const baselineModelTask = defineTask('baseline-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Baseline Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer with expertise in establishing baseline models',
      task: 'Design simple baseline model to establish performance benchmarks',
      context: {
        projectName: args.projectName,
        problemFormulation: args.problemFormulation,
        dataCharacteristics: args.dataCharacteristics,
        modelSelection: args.modelSelection
      },
      instructions: [
        '1. Design simple baseline approach (naive baseline, rule-based, simple ML model)',
        '2. Specify baseline features and preprocessing',
        '3. Define baseline training approach',
        '4. Estimate baseline performance metrics',
        '5. Establish minimum acceptable performance threshold',
        '6. Define success criteria for candidate models (must beat baseline by X%)',
        '7. Document baseline assumptions and limitations',
        '8. Provide implementation specifications for baseline',
        '9. Estimate baseline development effort',
        '10. Recommend baseline evaluation methodology'
      ],
      outputFormat: 'JSON object with baseline model specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineApproach', 'performance', 'successThreshold'],
      properties: {
        baselineApproach: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['naive', 'rule-based', 'simple-ml', 'heuristic'] },
            description: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            algorithm: { type: 'string' },
            hyperparameters: { type: 'object' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            estimatedMetrics: { type: 'object' },
            confidenceInterval: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        successThreshold: {
          type: 'object',
          properties: {
            minimumImprovement: { type: 'string' },
            targetMetrics: { type: 'object' },
            rationale: { type: 'string' }
          }
        },
        implementation: {
          type: 'object',
          properties: {
            effort: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } },
            validationApproach: { type: 'string' }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'baseline', 'benchmarking']
}));

export const candidateModelDesignTask = defineTask('candidate-model-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.${args.candidateIndex}: Candidate Model Design - ${args.candidateSpec.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Engineer specializing in model architecture design',
      task: 'Design detailed architecture specification for candidate model',
      context: {
        projectName: args.projectName,
        candidateIndex: args.candidateIndex,
        candidateSpec: args.candidateSpec,
        problemFormulation: args.problemFormulation,
        dataCharacteristics: args.dataCharacteristics,
        baselinePerformance: args.baselinePerformance,
        constraints: args.constraints
      },
      instructions: [
        '1. Design detailed layer-by-layer architecture specification',
        '2. Specify input preprocessing and feature engineering requirements',
        '3. Define loss function and optimization strategy',
        '4. Recommend hyperparameter search space',
        '5. Design regularization and overfitting prevention strategies',
        '6. Specify data augmentation strategies (if applicable)',
        '7. Define training schedule and learning rate strategy',
        '8. Estimate computational requirements (GPU hours, memory)',
        '9. Identify potential bottlenecks and optimization opportunities',
        '10. Provide pseudo-code or high-level implementation outline'
      ],
      outputFormat: 'JSON object with detailed model architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'training', 'expectedPerformance'],
      properties: {
        modelName: { type: 'string' },
        architecture: {
          type: 'object',
          properties: {
            layers: { type: 'array', items: { type: 'object' } },
            parameters: { type: 'number' },
            inputShape: { type: 'string' },
            outputShape: { type: 'string' },
            architectureDiagram: { type: 'string' }
          }
        },
        preprocessing: {
          type: 'object',
          properties: {
            featureEngineering: { type: 'array', items: { type: 'string' } },
            normalization: { type: 'string' },
            encodings: { type: 'array', items: { type: 'string' } },
            augmentation: { type: 'array', items: { type: 'string' } }
          }
        },
        training: {
          type: 'object',
          properties: {
            lossFunction: { type: 'string' },
            optimizer: { type: 'string' },
            learningRateStrategy: { type: 'string' },
            batchSize: { type: 'number' },
            epochs: { type: 'number' },
            regularization: { type: 'array', items: { type: 'string' } }
          }
        },
        hyperparameters: {
          type: 'object',
          properties: {
            searchSpace: { type: 'object' },
            searchStrategy: { type: 'string' },
            budget: { type: 'string' }
          }
        },
        computationalRequirements: {
          type: 'object',
          properties: {
            trainingTime: { type: 'string' },
            gpuHours: { type: 'string' },
            memory: { type: 'string' },
            storageGB: { type: 'number' }
          }
        },
        expectedPerformance: {
          type: 'object',
          properties: {
            metrics: { type: 'object' },
            improvementOverBaseline: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        },
        implementationConsiderations: {
          type: 'array',
          items: { type: 'string' }
        },
        pseudoCode: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'model-design', `candidate-${args.candidateIndex}`]
}));

export const evaluationCriteriaTask = defineTask('evaluation-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Evaluation Criteria Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Evaluation Specialist with expertise in model assessment',
      task: 'Define comprehensive evaluation criteria for comparing model architectures',
      context: {
        projectName: args.projectName,
        problemFormulation: args.problemFormulation,
        candidateModels: args.candidateModels,
        baselinePerformance: args.baselinePerformance,
        constraints: args.constraints
      },
      instructions: [
        '1. Define primary evaluation metrics (accuracy, precision, recall, etc.)',
        '2. Define secondary metrics (fairness, interpretability, robustness)',
        '3. Define operational metrics (latency, throughput, cost)',
        '4. Specify evaluation methodology (cross-validation, holdout, time-series split)',
        '5. Define statistical significance tests',
        '6. Specify evaluation datasets (training, validation, test splits)',
        '7. Define performance benchmarks and thresholds',
        '8. Create scoring rubric with weights for multi-criteria decision making',
        '9. Define trade-off analysis framework (performance vs cost, accuracy vs latency)',
        '10. Specify documentation requirements for evaluation results'
      ],
      outputFormat: 'JSON object with comprehensive evaluation criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMetrics', 'scoringRubric', 'methodology'],
      properties: {
        primaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              weight: { type: 'number' },
              minimumThreshold: { type: 'number' },
              target: { type: 'number' }
            }
          }
        },
        secondaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              weight: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        operationalMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        methodology: {
          type: 'object',
          properties: {
            validationStrategy: { type: 'string' },
            dataSplits: { type: 'object' },
            crossValidationFolds: { type: 'number' },
            statisticalTests: { type: 'array', items: { type: 'string' } }
          }
        },
        scoringRubric: {
          type: 'object',
          properties: {
            totalWeight: { type: 'number' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  weight: { type: 'number' },
                  criteria: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        tradeoffFramework: {
          type: 'object',
          properties: {
            dimensions: { type: 'array', items: { type: 'string' } },
            tradeoffAnalysis: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'evaluation', 'criteria']
}));

export const architectureComparisonTask = defineTask('architecture-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Architecture Comparison and Ranking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Architect with expertise in model comparison and selection',
      task: 'Compare candidate architectures and provide ranked recommendation',
      context: {
        projectName: args.projectName,
        candidateModels: args.candidateModels,
        baselineModel: args.baselineModel,
        evaluationCriteria: args.evaluationCriteria,
        constraints: args.constraints
      },
      instructions: [
        '1. Score each candidate model against evaluation criteria',
        '2. Compare candidates on performance, complexity, cost, interpretability',
        '3. Analyze trade-offs between competing objectives',
        '4. Assess risk vs reward for each architecture',
        '5. Evaluate implementation complexity and timeline',
        '6. Consider operational and maintenance overhead',
        '7. Rank architectures with confidence scores',
        '8. Identify conditions where alternative architectures may be preferred',
        '9. Provide clear recommendation with justification',
        '10. Generate comparison report and visualization'
      ],
      outputFormat: 'JSON object with architecture comparison and recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedArchitectures', 'recommendation', 'comparisonMatrix'],
      properties: {
        rankedArchitectures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              modelName: { type: 'string' },
              totalScore: { type: 'number' },
              scores: { type: 'object' },
              exceedsBaseline: { type: 'boolean' },
              expectedImprovement: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        comparisonMatrix: {
          type: 'object',
          description: 'Matrix comparing all architectures across criteria'
        },
        tradeoffAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension1: { type: 'string' },
              dimension2: { type: 'string' },
              analysis: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendation: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            justification: { type: 'string' },
            expectedImprovement: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            alternativeConditions: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
            mitigations: { type: 'array', items: { type: 'string' } }
          }
        },
        comparisonReport: {
          type: 'string',
          description: 'Detailed comparison report in markdown format'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'comparison', 'decision']
}));

export const trainingInfrastructureTask = defineTask('training-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Training Infrastructure Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Infrastructure Engineer specializing in training infrastructure',
      task: 'Design training infrastructure for the recommended model architecture',
      context: {
        projectName: args.projectName,
        recommendedArchitecture: args.recommendedArchitecture,
        dataCharacteristics: args.dataCharacteristics,
        constraints: args.constraints
      },
      instructions: [
        '1. Specify compute resources (CPUs, GPUs, TPUs, memory)',
        '2. Design distributed training strategy if needed (data parallel, model parallel)',
        '3. Plan storage infrastructure (training data, checkpoints, artifacts)',
        '4. Select training orchestration platform (Kubeflow, SageMaker, Vertex AI)',
        '5. Design experiment tracking and versioning (MLflow, Weights & Biases)',
        '6. Plan hyperparameter tuning infrastructure',
        '7. Design checkpointing and fault tolerance strategy',
        '8. Estimate training costs and optimization opportunities',
        '9. Plan development vs production training environments',
        '10. Specify monitoring and debugging tools'
      ],
      outputFormat: 'JSON object with training infrastructure plan'
    },
    outputSchema: {
      type: 'object',
      required: ['computeResources', 'orchestration', 'estimatedCost'],
      properties: {
        computeResources: {
          type: 'object',
          properties: {
            instanceType: { type: 'string' },
            gpuType: { type: 'string' },
            gpuCount: { type: 'number' },
            memory: { type: 'string' },
            storage: { type: 'string' }
          }
        },
        distributedStrategy: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            strategy: { type: 'string' },
            nodes: { type: 'number' },
            framework: { type: 'string' }
          }
        },
        orchestration: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            justification: { type: 'string' }
          }
        },
        experimentTracking: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } },
            artifacts: { type: 'array', items: { type: 'string' } }
          }
        },
        hyperparameterTuning: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            tool: { type: 'string' },
            budget: { type: 'string' }
          }
        },
        faultTolerance: {
          type: 'object',
          properties: {
            checkpointingFrequency: { type: 'string' },
            retryStrategy: { type: 'string' },
            backupStorage: { type: 'string' }
          }
        },
        estimatedCost: {
          type: 'object',
          properties: {
            developmentPhase: { type: 'string' },
            productionTraining: { type: 'string' },
            retrainingCost: { type: 'string' },
            breakdown: { type: 'object' }
          }
        },
        optimization: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              expectedSavings: { type: 'string' },
              implementation: { type: 'string' }
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
  labels: ['ml-architecture', 'planning', 'training', 'infrastructure']
}));

export const servingInfrastructureTask = defineTask('serving-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Serving Infrastructure Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Infrastructure Engineer specializing in model serving',
      task: 'Design serving infrastructure for production model deployment',
      context: {
        projectName: args.projectName,
        recommendedArchitecture: args.recommendedArchitecture,
        constraints: args.constraints,
        systemArchitecture: args.systemArchitecture
      },
      instructions: [
        '1. Design serving pattern (batch, real-time, streaming, edge)',
        '2. Select serving framework (TensorFlow Serving, TorchServe, Seldon, BentoML)',
        '3. Specify compute resources and auto-scaling strategy',
        '4. Design API interface and data contracts',
        '5. Plan model versioning and A/B testing infrastructure',
        '6. Design caching and optimization strategies',
        '7. Plan for canary deployments and gradual rollouts',
        '8. Design monitoring and alerting for serving layer',
        '9. Estimate serving costs and optimize for efficiency',
        '10. Plan for model updates and hot-swapping'
      ],
      outputFormat: 'JSON object with serving infrastructure plan'
    },
    outputSchema: {
      type: 'object',
      required: ['servingPattern', 'framework', 'apiDesign'],
      properties: {
        servingPattern: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['batch', 'real-time', 'streaming', 'edge', 'hybrid'] },
            justification: { type: 'string' },
            latencyTarget: { type: 'string' },
            throughputTarget: { type: 'string' }
          }
        },
        framework: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            justification: { type: 'string' }
          }
        },
        computeResources: {
          type: 'object',
          properties: {
            instanceType: { type: 'string' },
            minInstances: { type: 'number' },
            maxInstances: { type: 'number' },
            autoScalingPolicy: { type: 'string' }
          }
        },
        apiDesign: {
          type: 'object',
          properties: {
            endpoint: { type: 'string' },
            protocol: { type: 'string' },
            requestFormat: { type: 'object' },
            responseFormat: { type: 'object' },
            authentication: { type: 'string' },
            rateLimit: { type: 'string' }
          }
        },
        modelVersioning: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            abTestingSupport: { type: 'boolean' },
            rollbackCapability: { type: 'boolean' }
          }
        },
        optimization: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              expectedImprovement: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            slos: { type: 'array', items: { type: 'object' } },
            alerts: { type: 'array', items: { type: 'object' } }
          }
        },
        estimatedCost: {
          type: 'object',
          properties: {
            monthly: { type: 'string' },
            breakdown: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'serving', 'deployment']
}));

export const mlOpsPipelineTask = defineTask('mlops-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: MLOps Pipeline Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer with expertise in ML pipeline automation',
      task: 'Design end-to-end MLOps pipeline for continuous training and deployment',
      context: {
        projectName: args.projectName,
        systemArchitecture: args.systemArchitecture,
        recommendedArchitecture: args.recommendedArchitecture,
        trainingInfrastructure: args.trainingInfrastructure,
        servingInfrastructure: args.servingInfrastructure
      },
      instructions: [
        '1. Design CI/CD pipeline for ML code and models',
        '2. Design automated data validation pipeline',
        '3. Design automated model training and evaluation pipeline',
        '4. Design automated model deployment pipeline with quality gates',
        '5. Design monitoring and drift detection pipeline',
        '6. Design automated retraining triggers and workflows',
        '7. Plan model registry and artifact management',
        '8. Design feature store integration (if applicable)',
        '9. Plan for model governance and compliance',
        '10. Create pipeline diagram and workflow specifications'
      ],
      outputFormat: 'JSON object with MLOps pipeline design'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelines', 'automation', 'governance'],
      properties: {
        pipelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['data', 'training', 'deployment', 'monitoring', 'retraining'] },
              trigger: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              qualityGates: { type: 'array', items: { type: 'string' } },
              tools: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        automation: {
          type: 'object',
          properties: {
            cicdTool: { type: 'string' },
            orchestrationTool: { type: 'string' },
            schedulingStrategy: { type: 'string' },
            automationLevel: { type: 'string', enum: ['manual', 'semi-automated', 'fully-automated'] }
          }
        },
        modelRegistry: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            versioning: { type: 'string' },
            metadata: { type: 'array', items: { type: 'string' } }
          }
        },
        featureStore: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            tool: { type: 'string' },
            integration: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            dataMonitoring: { type: 'array', items: { type: 'string' } },
            modelMonitoring: { type: 'array', items: { type: 'string' } },
            driftDetection: { type: 'string' },
            alerting: { type: 'array', items: { type: 'string' } }
          }
        },
        governance: {
          type: 'object',
          properties: {
            approvalWorkflow: { type: 'string' },
            auditTrail: { type: 'string' },
            complianceChecks: { type: 'array', items: { type: 'string' } }
          }
        },
        pipelineDiagram: {
          type: 'string',
          description: 'Pipeline architecture diagram in markdown/mermaid format'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'mlops', 'automation']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Implementation Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Project Manager with expertise in ML implementation planning',
      task: 'Create detailed implementation roadmap for ML architecture',
      context: {
        projectName: args.projectName,
        systemArchitecture: args.systemArchitecture,
        recommendedArchitecture: args.recommendedArchitecture,
        trainingInfrastructure: args.trainingInfrastructure,
        servingInfrastructure: args.servingInfrastructure,
        mlOpsPipeline: args.mlOpsPipeline,
        constraints: args.constraints
      },
      instructions: [
        '1. Break down implementation into phases with milestones',
        '2. Define deliverables for each phase',
        '3. Estimate effort and timeline for each phase',
        '4. Identify dependencies and critical path',
        '5. Define success criteria and quality gates',
        '6. Identify required team skills and roles',
        '7. Plan for iterative development and experimentation',
        '8. Include buffer for risks and uncertainties',
        '9. Estimate total project cost',
        '10. Generate Gantt chart or timeline visualization'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'cost'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              team: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  phase: { type: 'string' },
                  targetDate: { type: 'string' },
                  criticalPath: { type: 'boolean' }
                }
              }
            }
          }
        },
        cost: {
          type: 'object',
          properties: {
            development: { type: 'string' },
            infrastructure: { type: 'string' },
            personnel: { type: 'string' },
            contingency: { type: 'string' },
            total: { type: 'string' },
            breakdown: { type: 'array', items: { type: 'object' } }
          }
        },
        team: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              allocation: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' },
              contingency: { type: 'string' }
            }
          }
        },
        markdown: {
          type: 'string',
          description: 'Complete architecture design document in markdown'
        },
        roadmapMarkdown: {
          type: 'string',
          description: 'Implementation roadmap in markdown format'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-architecture', 'planning', 'roadmap', 'project-management']
}));

export const architectureRiskAnalysisTask = defineTask('architecture-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Architecture Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Risk Analyst specializing in architecture risks',
      task: 'Analyze risks specific to the recommended architecture and implementation plan',
      context: {
        projectName: args.projectName,
        systemArchitecture: args.systemArchitecture,
        recommendedArchitecture: args.recommendedArchitecture,
        implementationRoadmap: args.implementationRoadmap,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify architectural risks (scalability limits, single points of failure)',
        '2. Assess model-specific risks (overfitting, training instability, convergence issues)',
        '3. Evaluate infrastructure risks (resource constraints, vendor lock-in)',
        '4. Identify integration risks with existing systems',
        '5. Assess operational risks (complexity, maintainability, debugging difficulty)',
        '6. Evaluate performance risks (latency, throughput bottlenecks)',
        '7. Assess cost risks (budget overruns, unexpected expenses)',
        '8. Identify timeline risks (delays, scope creep)',
        '9. For each risk, provide severity, probability, and mitigation plan',
        '10. Prioritize critical risks requiring immediate attention'
      ],
      outputFormat: 'JSON object with comprehensive risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'criticalRisks', 'overallRiskLevel'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string', enum: ['architecture', 'model', 'infrastructure', 'integration', 'operational', 'performance', 'cost', 'timeline'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string' },
              mitigationPlan: { type: 'string' },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        criticalRisks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of critical risks requiring immediate attention'
        },
        overallRiskLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low']
        },
        riskMitigationTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              mitigationDeadline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
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
  labels: ['ml-architecture', 'planning', 'risk-analysis', 'risk-management']
}));
