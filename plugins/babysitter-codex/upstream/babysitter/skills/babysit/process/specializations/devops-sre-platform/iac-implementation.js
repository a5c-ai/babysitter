/**
 * @process specializations/devops-sre-platform/iac-implementation
 * @description Infrastructure as Code (IaC) Implementation - Complete end-to-end IaC development process
 * for DevOps/SRE/Platform teams including planning, design, implementation, testing, validation, and deployment
 * with quality gates and iterative refinement.
 * @inputs { projectName: string, cloudProvider?: string, iacTool?: string, requirements?: object, targetQuality?: number }
 * @outputs { success: boolean, qualityScore: number, artifacts: array, iacFiles: array, deploymentReady: boolean }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/iac-implementation', {
 *   projectName: 'E-commerce Platform Infrastructure',
 *   cloudProvider: 'aws',
 *   iacTool: 'terraform',
 *   requirements: {
 *     environment: 'production',
 *     compute: { type: 'containers', orchestration: 'kubernetes' },
 *     database: { type: 'postgresql', replication: true },
 *     storage: { type: 'object-storage' },
 *     networking: { multiAz: true, vpn: false },
 *     security: { compliance: 'SOC2', encryption: true },
 *     monitoring: { logs: true, metrics: true, alerts: true }
 *   },
 *   targetQuality: 85,
 *   maxIterations: 3
 * });
 *
 * @references
 * - Terraform Best Practices: https://www.terraform-best-practices.com/
 * - AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/
 * - Infrastructure as Code Patterns: https://infrastructure-as-code.com/patterns/
 * - HashiCorp Learn: https://learn.hashicorp.com/terraform
 * - Pulumi Documentation: https://www.pulumi.com/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cloudProvider = 'aws', // 'aws', 'azure', 'gcp', 'multi-cloud'
    iacTool = 'terraform', // 'terraform', 'pulumi', 'cloudformation', 'cdk', 'bicep'
    requirements = {
      environment: 'production',
      compute: {},
      database: {},
      storage: {},
      networking: {},
      security: {},
      monitoring: {}
    },
    targetQuality = 85,
    maxIterations = 3,
    constraints = {
      budget: 10000,
      timeline: '4 weeks',
      team: 'devops'
    },
    outputDir = 'iac-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let qualityScore = 0;
  let iterationResults = [];

  ctx.log('info', `Starting Infrastructure as Code Implementation for ${projectName}`);
  ctx.log('info', `Cloud Provider: ${cloudProvider}, IaC Tool: ${iacTool}`);
  ctx.log('info', `Target Quality: ${targetQuality}, Max Iterations: ${maxIterations}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND ARCHITECTURE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and planning architecture');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    cloudProvider,
    iacTool,
    requirements,
    constraints,
    outputDir
  });

  if (!requirementsAnalysis.success) {
    return {
      success: false,
      error: 'Failed to complete requirements analysis',
      details: requirementsAnalysis,
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-implementation',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...requirementsAnalysis.artifacts);

  // Quality Gate: Requirements are clear and complete
  const requirementsGaps = requirementsAnalysis.gaps || [];
  if (requirementsGaps.length > 0) {
    ctx.log('warn', `Found ${requirementsGaps.length} requirements gaps`);

    await ctx.breakpoint({
      question: `Phase 1 Quality Gate: Found ${requirementsGaps.length} requirements gaps. Review and clarify before proceeding?`,
      title: 'Requirements Analysis Gate',
      context: {
        runId: ctx.runId,
        requirementsScore: requirementsAnalysis.completenessScore,
        gaps: requirementsGaps,
        files: [{
          path: `${outputDir}/phase1-requirements-analysis.json`,
          format: 'json',
          content: JSON.stringify(requirementsAnalysis, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 2: ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing infrastructure architecture');

  // Design architecture components in parallel
  const [computeDesign, dataDesign, networkDesign, securityDesign] = await ctx.parallel.all([
    ctx.task(designComputeInfrastructureTask, {
      projectName,
      cloudProvider,
      requirements: requirements.compute,
      analysis: requirementsAnalysis,
      outputDir
    }),
    ctx.task(designDataInfrastructureTask, {
      projectName,
      cloudProvider,
      requirements: requirements.database,
      storageRequirements: requirements.storage,
      analysis: requirementsAnalysis,
      outputDir
    }),
    ctx.task(designNetworkInfrastructureTask, {
      projectName,
      cloudProvider,
      requirements: requirements.networking,
      analysis: requirementsAnalysis,
      outputDir
    }),
    ctx.task(designSecurityInfrastructureTask, {
      projectName,
      cloudProvider,
      requirements: requirements.security,
      analysis: requirementsAnalysis,
      outputDir
    })
  ]);

  if (!computeDesign.success || !dataDesign.success || !networkDesign.success || !securityDesign.success) {
    return {
      success: false,
      error: 'Failed to complete architecture design',
      details: { computeDesign, dataDesign, networkDesign, securityDesign },
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-implementation',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...computeDesign.artifacts, ...dataDesign.artifacts, ...networkDesign.artifacts, ...securityDesign.artifacts);

  const architectureDesign = {
    compute: computeDesign,
    data: dataDesign,
    network: networkDesign,
    security: securityDesign
  };

  // Breakpoint: Review architecture design
  await ctx.breakpoint({
    question: 'Phase 2 Quality Gate: Review infrastructure architecture design. Approve to proceed with IaC implementation?',
    title: 'Architecture Design Review',
    context: {
      runId: ctx.runId,
      architecture: architectureDesign,
      files: [
        { path: `${outputDir}/phase2-compute-design.json`, format: 'json' },
        { path: `${outputDir}/phase2-data-design.json`, format: 'json' },
        { path: `${outputDir}/phase2-network-design.json`, format: 'json' },
        { path: `${outputDir}/phase2-security-design.json`, format: 'json' },
        { path: `${outputDir}/architecture-diagram.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: IaC IMPLEMENTATION WITH QUALITY CONVERGENCE
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Infrastructure as Code with quality convergence');

  let iteration = 0;
  let converged = false;

  while (iteration < maxIterations && !converged) {
    iteration++;
    ctx.log('info', `Starting IaC implementation iteration ${iteration}/${maxIterations}`);

    // Step 1: Generate/refine IaC code
    const iacImplementation = await ctx.task(implementIaCCodeTask, {
      projectName,
      cloudProvider,
      iacTool,
      architecture: architectureDesign,
      requirements,
      iteration,
      previousFeedback: iteration > 1 ? iterationResults[iteration - 2].feedback : null,
      outputDir
    });

    if (!iacImplementation.success) {
      return {
        success: false,
        error: `Failed IaC implementation at iteration ${iteration}`,
        details: iacImplementation,
        metadata: {
          processId: 'specializations/devops-sre-platform/iac-implementation',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...iacImplementation.artifacts);

    // Step 2: Run validation and quality checks in parallel
    const [
      syntaxValidation,
      securityScan,
      costEstimation,
      complianceCheck,
      bestPracticesCheck
    ] = await ctx.parallel.all([
      ctx.task(validateIaCSyntaxTask, {
        projectName,
        iacTool,
        iacFiles: iacImplementation.files,
        outputDir
      }),
      ctx.task(scanIaCSecurityTask, {
        projectName,
        iacTool,
        iacFiles: iacImplementation.files,
        securityRequirements: requirements.security,
        outputDir
      }),
      ctx.task(estimateIaCCostsTask, {
        projectName,
        cloudProvider,
        iacFiles: iacImplementation.files,
        budget: constraints.budget,
        outputDir
      }),
      ctx.task(checkIaCComplianceTask, {
        projectName,
        iacFiles: iacImplementation.files,
        complianceRequirements: requirements.security?.compliance || [],
        outputDir
      }),
      ctx.task(checkIaCBestPracticesTask, {
        projectName,
        iacTool,
        cloudProvider,
        iacFiles: iacImplementation.files,
        outputDir
      })
    ]);

    if (!syntaxValidation.valid) {
      ctx.log('error', 'IaC syntax validation failed - critical blocker');
      return {
        success: false,
        error: 'IaC syntax validation failed',
        details: syntaxValidation,
        metadata: {
          processId: 'specializations/devops-sre-platform/iac-implementation',
          timestamp: startTime
        }
      };
    }

    artifacts.push(
      ...syntaxValidation.artifacts,
      ...securityScan.artifacts,
      ...costEstimation.artifacts,
      ...complianceCheck.artifacts,
      ...bestPracticesCheck.artifacts
    );

    // Step 3: Comprehensive quality scoring by agent
    const qualityAssessment = await ctx.task(assessIaCQualityTask, {
      projectName,
      iacTool,
      cloudProvider,
      architecture: architectureDesign,
      implementation: iacImplementation,
      validation: {
        syntax: syntaxValidation,
        security: securityScan,
        cost: costEstimation,
        compliance: complianceCheck,
        bestPractices: bestPracticesCheck
      },
      requirements,
      targetQuality,
      iteration,
      outputDir
    });

    qualityScore = qualityAssessment.overallScore;

    // Store iteration results
    iterationResults.push({
      iteration,
      quality: qualityScore,
      implementation: iacImplementation,
      validation: {
        syntax: syntaxValidation,
        security: securityScan,
        cost: costEstimation,
        compliance: complianceCheck,
        bestPractices: bestPracticesCheck
      },
      assessment: qualityAssessment,
      feedback: qualityAssessment.recommendations
    });

    ctx.log('info', `Iteration ${iteration} complete. Quality Score: ${qualityScore}/${targetQuality}`);

    // Quality Gate: Check for critical security issues
    const criticalSecurityIssues = securityScan.findings?.filter(f => f.severity === 'critical') || [];
    if (criticalSecurityIssues.length > 0) {
      ctx.log('error', `Found ${criticalSecurityIssues.length} CRITICAL security issues`);

      await ctx.breakpoint({
        question: `Iteration ${iteration} Security Gate: Found ${criticalSecurityIssues.length} CRITICAL security issues. These must be fixed. Review and continue?`,
        title: 'Critical Security Issues Gate',
        context: {
          runId: ctx.runId,
          iteration,
          criticalIssues: criticalSecurityIssues,
          files: [{
            path: `${outputDir}/iteration-${iteration}-security-report.json`,
            format: 'json',
            content: JSON.stringify(securityScan, null, 2)
          }]
        }
      });

      // Force another iteration to fix critical issues
      continue;
    }

    // Check convergence
    if (qualityScore >= targetQuality) {
      converged = true;
      ctx.log('info', `Quality target achieved: ${qualityScore}/${targetQuality}`);
    } else if (iteration < maxIterations) {
      ctx.log('info', `Quality not yet achieved: ${qualityScore}/${targetQuality}. Continuing iteration ${iteration + 1}`);

      await ctx.breakpoint({
        question: `Iteration ${iteration} complete. Quality: ${qualityScore}/${targetQuality}. Review feedback and continue iteration ${iteration + 1}?`,
        title: `Iteration ${iteration} Review`,
        context: {
          runId: ctx.runId,
          iteration,
          qualityScore,
          targetQuality,
          recommendations: qualityAssessment.recommendations,
          files: [
            { path: `${outputDir}/iteration-${iteration}-report.json`, format: 'json' },
            { path: `${outputDir}/iteration-${iteration}-feedback.md`, format: 'markdown' }
          ]
        }
      });
    } else {
      ctx.log('warn', `Maximum iterations reached. Quality: ${qualityScore}/${targetQuality}`);
    }
  }

  // ============================================================================
  // PHASE 4: IaC TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing and validating IaC implementation');

  const latestImplementation = iterationResults[iteration - 1].implementation;

  // Run comprehensive tests in parallel
  const [
    planValidation,
    dryRunTest,
    moduleTests,
    integrationTests
  ] = await ctx.parallel.all([
    ctx.task(validateIaCPlanTask, {
      projectName,
      iacTool,
      iacFiles: latestImplementation.files,
      outputDir
    }),
    ctx.task(runIaCDryRunTask, {
      projectName,
      iacTool,
      iacFiles: latestImplementation.files,
      outputDir
    }),
    ctx.task(testIaCModulesTask, {
      projectName,
      iacTool,
      iacFiles: latestImplementation.files,
      outputDir
    }),
    ctx.task(runIaCIntegrationTestsTask, {
      projectName,
      iacTool,
      iacFiles: latestImplementation.files,
      architecture: architectureDesign,
      outputDir
    })
  ]);

  if (!planValidation.valid || !dryRunTest.success) {
    return {
      success: false,
      error: 'IaC validation or dry-run failed',
      details: { planValidation, dryRunTest },
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-implementation',
        timestamp: startTime
      }
    };
  }

  artifacts.push(
    ...planValidation.artifacts,
    ...dryRunTest.artifacts,
    ...moduleTests.artifacts,
    ...integrationTests.artifacts
  );

  // Quality Gate: All tests must pass
  const testFailures = [
    ...(moduleTests.failures || []),
    ...(integrationTests.failures || [])
  ];

  if (testFailures.length > 0) {
    ctx.log('warn', `Found ${testFailures.length} test failures`);

    await ctx.breakpoint({
      question: `Phase 4 Quality Gate: Found ${testFailures.length} test failures. Review and fix before deployment?`,
      title: 'IaC Testing Gate',
      context: {
        runId: ctx.runId,
        moduleTestResults: moduleTests,
        integrationTestResults: integrationTests,
        testFailures,
        files: [
          { path: `${outputDir}/phase4-module-tests.json`, format: 'json' },
          { path: `${outputDir}/phase4-integration-tests.json`, format: 'json' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 5: DOCUMENTATION AND DEPLOYMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating documentation and preparing deployment');

  const [documentation, deploymentPlan] = await ctx.parallel.all([
    ctx.task(generateIaCDocumentationTask, {
      projectName,
      iacTool,
      cloudProvider,
      architecture: architectureDesign,
      implementation: latestImplementation,
      requirements,
      outputDir
    }),
    ctx.task(createDeploymentPlanTask, {
      projectName,
      iacTool,
      iacFiles: latestImplementation.files,
      architecture: architectureDesign,
      planValidation,
      outputDir
    })
  ]);

  if (!documentation.success || !deploymentPlan.success) {
    return {
      success: false,
      error: 'Failed to generate documentation or deployment plan',
      details: { documentation, deploymentPlan },
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-implementation',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...documentation.artifacts, ...deploymentPlan.artifacts);

  // ============================================================================
  // PHASE 6: FINAL REVIEW AND DEPLOYMENT READINESS
  // ============================================================================

  ctx.log('info', 'Phase 6: Final review and deployment readiness assessment');

  const finalReview = await ctx.task(finalIaCReviewTask, {
    projectName,
    iacTool,
    cloudProvider,
    architecture: architectureDesign,
    iterations: iterationResults,
    finalQuality: qualityScore,
    targetQuality,
    converged,
    testing: {
      plan: planValidation,
      dryRun: dryRunTest,
      modules: moduleTests,
      integration: integrationTests
    },
    documentation,
    deploymentPlan,
    requirements,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  const deploymentReady = finalReview.approved && qualityScore >= targetQuality && converged;

  // Final Quality Gate
  await ctx.breakpoint({
    question: `Final Review: Quality ${qualityScore}/${targetQuality}. ${finalReview.verdict}. Deployment Ready: ${deploymentReady}. Approve for deployment?`,
    title: 'Final IaC Review and Deployment Approval',
    context: {
      runId: ctx.runId,
      qualityScore,
      targetQuality,
      converged,
      deploymentReady,
      finalReview,
      files: [
        { path: `${outputDir}/final-review-report.md`, format: 'markdown' },
        { path: `${outputDir}/deployment-plan.md`, format: 'markdown' },
        { path: `${outputDir}/architecture-documentation.md`, format: 'markdown' },
        { path: `${outputDir}/quality-history.json`, format: 'json' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `IaC Implementation completed in ${duration}ms`);
  ctx.log('info', `Final Quality Score: ${qualityScore}/100 (target: ${targetQuality})`);
  ctx.log('info', `Iterations: ${iteration}/${maxIterations}`);
  ctx.log('info', `Deployment Ready: ${deploymentReady}`);

  return {
    success: converged && deploymentReady,
    projectName,
    cloudProvider,
    iacTool,
    qualityScore,
    targetQuality,
    converged,
    deploymentReady,
    iterations: iteration,
    architecture: architectureDesign,
    iacFiles: latestImplementation.files,
    iterationResults,
    testing: {
      plan: planValidation,
      dryRun: dryRunTest,
      modules: moduleTests,
      integration: integrationTests
    },
    documentation,
    deploymentPlan,
    finalReview,
    artifacts,
    summary: {
      totalFiles: latestImplementation.files.length,
      linesOfCode: latestImplementation.linesOfCode || 0,
      modules: latestImplementation.modules?.length || 0,
      resources: latestImplementation.resourceCount || 0,
      estimatedMonthlyCost: iterationResults[iteration - 1].validation.cost.estimatedMonthlyCost || 0,
      securityIssues: iterationResults[iteration - 1].validation.security.findings?.length || 0,
      complianceScore: iterationResults[iteration - 1].validation.compliance.score || 0
    },
    metadata: {
      processId: 'specializations/devops-sre-platform/iac-implementation',
      processSlug: 'iac-implementation',
      category: 'Infrastructure as Code',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Requirements: ${args.projectName}`,
  agent: {
    name: 'infrastructure-analyst',
    prompt: {
      role: 'Senior Infrastructure Architect and Requirements Analyst',
      task: 'Analyze infrastructure requirements and create comprehensive specification',
      context: args,
      instructions: [
        'Analyze and clarify infrastructure requirements',
        'Identify compute, storage, database, and networking needs',
        'Assess security and compliance requirements',
        'Evaluate monitoring and observability needs',
        'Identify high availability and disaster recovery requirements',
        'Assess scalability and performance requirements',
        'Evaluate cost constraints and budget',
        'Identify gaps and ambiguities in requirements',
        'Create detailed infrastructure specification',
        'Recommend architecture patterns based on requirements'
      ],
      outputFormat: 'JSON with success, specification, gaps, completenessScore (0-100), recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specification', 'completenessScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specification: {
          type: 'object',
          properties: {
            compute: { type: 'object' },
            storage: { type: 'object' },
            database: { type: 'object' },
            networking: { type: 'object' },
            security: { type: 'object' },
            monitoring: { type: 'object' },
            highAvailability: { type: 'object' },
            scalability: { type: 'object' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'requirements', 'phase-1', args.cloudProvider]
}));

export const designComputeInfrastructureTask = defineTask('design-compute-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Compute Infrastructure: ${args.projectName}`,
  agent: {
    name: 'compute-architect',
    prompt: {
      role: 'Cloud Compute Architect',
      task: 'Design compute infrastructure including VMs, containers, serverless, and orchestration',
      context: args,
      instructions: [
        'Design compute architecture based on requirements',
        'Select appropriate compute services (EC2, ECS, EKS, Lambda, etc.)',
        'Design auto-scaling strategies',
        'Plan container orchestration if needed',
        'Design serverless components if applicable',
        'Plan instance types and sizing',
        'Design deployment strategies',
        'Plan compute security (IAM, security groups)',
        'Estimate compute costs',
        'Create compute architecture diagram'
      ],
      outputFormat: 'JSON with success, design, services, autoScaling, security, estimatedCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'services', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: { type: 'object' },
        services: { type: 'array', items: { type: 'string' } },
        autoScaling: { type: 'object' },
        security: { type: 'object' },
        estimatedCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'design', 'compute', 'phase-2']
}));

export const designDataInfrastructureTask = defineTask('design-data-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Data Infrastructure: ${args.projectName}`,
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'Cloud Data and Storage Architect',
      task: 'Design data infrastructure including databases, storage, caching, and backup',
      context: args,
      instructions: [
        'Design database architecture (RDS, DynamoDB, etc.)',
        'Design storage architecture (S3, EBS, EFS, etc.)',
        'Plan caching strategy (ElastiCache, etc.)',
        'Design data replication and backup',
        'Plan data encryption at rest and in transit',
        'Design data access patterns',
        'Plan data lifecycle and retention policies',
        'Estimate storage and database costs',
        'Create data architecture diagram'
      ],
      outputFormat: 'JSON with success, design, databases, storage, caching, backup, security, estimatedCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: { type: 'object' },
        databases: { type: 'array', items: { type: 'string' } },
        storage: { type: 'object' },
        caching: { type: 'object' },
        backup: { type: 'object' },
        security: { type: 'object' },
        estimatedCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'design', 'data', 'phase-2']
}));

export const designNetworkInfrastructureTask = defineTask('design-network-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Network Infrastructure: ${args.projectName}`,
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Cloud Network Architect',
      task: 'Design network infrastructure including VPC, subnets, routing, load balancing, and connectivity',
      context: args,
      instructions: [
        'Design VPC architecture with CIDR planning',
        'Design subnet strategy (public, private, database)',
        'Plan routing tables and internet/NAT gateways',
        'Design load balancer architecture (ALB, NLB, etc.)',
        'Plan DNS and domain management',
        'Design VPN or Direct Connect if needed',
        'Plan network security (security groups, NACLs, WAF)',
        'Design CDN integration if applicable',
        'Estimate networking costs',
        'Create network architecture diagram'
      ],
      outputFormat: 'JSON with success, design, vpc, subnets, routing, loadBalancing, dns, security, estimatedCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'vpc', 'subnets', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: { type: 'object' },
        vpc: { type: 'object' },
        subnets: { type: 'array' },
        routing: { type: 'object' },
        loadBalancing: { type: 'array' },
        dns: { type: 'object' },
        security: { type: 'object' },
        estimatedCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'design', 'network', 'phase-2']
}));

export const designSecurityInfrastructureTask = defineTask('design-security-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Security Infrastructure: ${args.projectName}`,
  agent: {
    name: 'security-architect',
    prompt: {
      role: 'Cloud Security Architect',
      task: 'Design security infrastructure including IAM, encryption, monitoring, and compliance',
      context: args,
      instructions: [
        'Design IAM architecture (roles, policies, users, groups)',
        'Plan encryption strategy (KMS, key rotation)',
        'Design secrets management (Secrets Manager, Parameter Store)',
        'Plan security monitoring and logging (CloudTrail, GuardDuty, etc.)',
        'Design network security (security groups, NACLs, WAF)',
        'Plan compliance requirements (GDPR, HIPAA, SOC2, etc.)',
        'Design incident response procedures',
        'Plan security scanning and vulnerability management',
        'Create security architecture diagram'
      ],
      outputFormat: 'JSON with success, design, iam, encryption, monitoring, compliance, incidentResponse, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'iam', 'encryption', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: { type: 'object' },
        iam: { type: 'object' },
        encryption: { type: 'object' },
        monitoring: { type: 'array' },
        compliance: { type: 'array' },
        incidentResponse: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'design', 'security', 'phase-2']
}));

export const implementIaCCodeTask = defineTask('implement-iac-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement IaC Code: ${args.projectName} (Iteration ${args.iteration})`,
  agent: {
    name: 'iac-developer',
    prompt: {
      role: 'Senior Infrastructure as Code Engineer',
      task: 'Implement Infrastructure as Code based on architecture design',
      context: args,
      instructions: [
        'Generate complete IaC code based on architecture design',
        'Organize code into modules (network, compute, data, security)',
        'Implement variables and outputs',
        'Create environment-specific configurations',
        'Implement proper resource naming and tagging',
        'Add inline documentation and comments',
        'Implement state management configuration',
        'Follow IaC best practices and conventions',
        'If iteration > 1, refine code based on previous feedback',
        'Generate all necessary configuration files'
      ],
      outputFormat: 'JSON with success, files (array with path, content, type), modules, variables, outputs, resourceCount, linesOfCode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'files', 'modules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            required: ['path', 'content', 'type'],
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        modules: { type: 'array', items: { type: 'string' } },
        variables: { type: 'object' },
        outputs: { type: 'object' },
        resourceCount: { type: 'number' },
        linesOfCode: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'coding', 'phase-3', `iteration-${args.iteration}`]
}));

export const validateIaCSyntaxTask = defineTask('validate-iac-syntax', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate IaC Syntax: ${args.iacTool}`,
  agent: {
    name: 'iac-validator',
    prompt: {
      role: 'Infrastructure as Code Validation Specialist',
      task: 'Validate IaC syntax and configuration correctness',
      context: args,
      instructions: [
        'Validate IaC syntax (terraform validate, etc.)',
        'Check for configuration errors',
        'Validate resource dependencies',
        'Check for circular dependencies',
        'Validate variable usage',
        'Check module references',
        'Validate provider configurations',
        'Report all syntax errors and warnings'
      ],
      outputFormat: 'JSON with success, valid, errors (array), warnings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'valid', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        valid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'validation', 'syntax', 'phase-3']
}));

export const scanIaCSecurityTask = defineTask('scan-iac-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Scan: ${args.projectName}`,
  agent: {
    name: 'iac-security-scanner',
    prompt: {
      role: 'Cloud Security Engineer',
      task: 'Scan IaC for security vulnerabilities and misconfigurations',
      context: args,
      instructions: [
        'Scan for publicly exposed resources',
        'Check encryption configurations',
        'Validate IAM policies and permissions',
        'Check for hardcoded secrets or credentials',
        'Validate network security configurations',
        'Check logging and monitoring setup',
        'Validate backup configurations',
        'Check for CIS benchmark compliance',
        'Report all security findings with severity'
      ],
      outputFormat: 'JSON with success, findings (array with severity, type, resource, issue, recommendation), criticalCount, highCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'type', 'resource', 'issue', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              type: { type: 'string' },
              resource: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'security', 'scanning', 'phase-3']
}));

export const estimateIaCCostsTask = defineTask('estimate-iac-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Estimate Costs: ${args.projectName}`,
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'Cloud FinOps Analyst',
      task: 'Estimate infrastructure costs from IaC configuration',
      context: args,
      instructions: [
        'Analyze all resources defined in IaC',
        'Estimate monthly costs for compute resources',
        'Calculate storage costs',
        'Estimate data transfer costs',
        'Calculate database costs',
        'Estimate costs for managed services',
        'Compare against budget constraints',
        'Identify cost optimization opportunities',
        'Provide cost breakdown by service'
      ],
      outputFormat: 'JSON with success, estimatedMonthlyCost, costBreakdown, budgetStatus, optimizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'estimatedMonthlyCost', 'costBreakdown', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        estimatedMonthlyCost: { type: 'number' },
        estimatedAnnualCost: { type: 'number' },
        costBreakdown: {
          type: 'object',
          properties: {
            compute: { type: 'number' },
            storage: { type: 'number' },
            database: { type: 'number' },
            networking: { type: 'number' },
            other: { type: 'number' }
          }
        },
        budgetStatus: { type: 'string', enum: ['within-budget', 'over-budget', 'no-budget'] },
        optimizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'cost', 'estimation', 'phase-3']
}));

export const checkIaCComplianceTask = defineTask('check-iac-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Check: ${args.projectName}`,
  agent: {
    name: 'compliance-checker',
    prompt: {
      role: 'Compliance Auditor',
      task: 'Check IaC against compliance requirements',
      context: args,
      instructions: [
        'Verify compliance with specified standards (SOC2, HIPAA, etc.)',
        'Check data residency requirements',
        'Validate audit logging configurations',
        'Check access control mechanisms',
        'Validate encryption standards',
        'Review data retention policies',
        'Check incident response configurations',
        'Calculate compliance score',
        'Identify compliance gaps'
      ],
      outputFormat: 'JSON with success, score (0-100), complianceStatus, findings, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'complianceStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        complianceStatus: { type: 'string', enum: ['compliant', 'non-compliant', 'partial'] },
        findings: { type: 'array' },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'compliance', 'phase-3']
}));

export const checkIaCBestPracticesTask = defineTask('check-iac-best-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Best Practices Check: ${args.iacTool}`,
  agent: {
    name: 'best-practices-checker',
    prompt: {
      role: 'Infrastructure as Code Best Practices Expert',
      task: 'Check IaC against best practices and conventions',
      context: args,
      instructions: [
        'Check code organization and module structure',
        'Verify naming conventions',
        'Check resource tagging strategy',
        'Validate variable and output usage',
        'Check state management configuration',
        'Verify environment separation',
        'Check documentation and comments',
        'Validate DRY principles',
        'Check for proper use of data sources',
        'Identify improvement opportunities'
      ],
      outputFormat: 'JSON with success, score (0-100), findings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'best-practices', 'phase-3']
}));

export const assessIaCQualityTask = defineTask('assess-iac-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Assessment: ${args.projectName} (Iteration ${args.iteration})`,
  agent: {
    name: 'iac-quality-assessor',
    prompt: {
      role: 'Senior Infrastructure Quality Engineer',
      task: 'Assess overall IaC quality across multiple dimensions',
      context: args,
      instructions: [
        'Review syntax validation results (weight: 15%)',
        'Review security scan findings (weight: 30%)',
        'Review cost estimation and budget alignment (weight: 15%)',
        'Review compliance check results (weight: 20%)',
        'Review best practices adherence (weight: 20%)',
        'Calculate weighted overall quality score (0-100)',
        'Compare against target quality score',
        'Provide specific, prioritized recommendations',
        'Identify critical issues requiring immediate attention',
        'Assess progress toward quality target'
      ],
      outputFormat: 'JSON with overallScore (0-100), scores (object), summary, recommendations (prioritized array), criticalIssues, progress'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'scores', 'summary', 'recommendations'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        scores: {
          type: 'object',
          properties: {
            syntax: { type: 'number' },
            security: { type: 'number' },
            cost: { type: 'number' },
            compliance: { type: 'number' },
            bestPractices: { type: 'number' }
          }
        },
        summary: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        progress: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'quality', 'assessment', 'phase-3', `iteration-${args.iteration}`]
}));

export const validateIaCPlanTask = defineTask('validate-iac-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Plan: ${args.projectName}`,
  agent: {
    name: 'plan-validator',
    prompt: {
      role: 'Infrastructure Deployment Specialist',
      task: 'Generate and validate infrastructure deployment plan',
      context: args,
      instructions: [
        'Generate deployment plan (terraform plan, etc.)',
        'Analyze resource additions, changes, and deletions',
        'Identify potentially destructive changes',
        'Check for data loss risks',
        'Validate resource dependencies',
        'Assess change blast radius',
        'Identify changes requiring downtime',
        'Validate change rollout strategy',
        'Generate plan summary with risk assessment'
      ],
      outputFormat: 'JSON with success, valid, planSummary (additions, changes, deletions), risks, warnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'valid', 'planSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        valid: { type: 'boolean' },
        planSummary: {
          type: 'object',
          properties: {
            additions: { type: 'number' },
            changes: { type: 'number' },
            deletions: { type: 'number' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'validation', 'plan', 'phase-4']
}));

export const runIaCDryRunTask = defineTask('run-iac-dry-run', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dry Run: ${args.projectName}`,
  agent: {
    name: 'dry-run-executor',
    prompt: {
      role: 'Infrastructure Testing Engineer',
      task: 'Execute IaC dry run to validate deployment',
      context: args,
      instructions: [
        'Execute dry run deployment (terraform apply -dry-run, etc.)',
        'Validate all resource provisioning steps',
        'Check for provider API errors',
        'Validate resource quotas and limits',
        'Check for permission issues',
        'Validate network connectivity requirements',
        'Check for dependency issues',
        'Generate dry run report'
      ],
      outputFormat: 'JSON with success, dryRunPassed, issues, warnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dryRunPassed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dryRunPassed: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'testing', 'dry-run', 'phase-4']
}));

export const testIaCModulesTask = defineTask('test-iac-modules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Modules: ${args.projectName}`,
  agent: {
    name: 'module-tester',
    prompt: {
      role: 'Infrastructure Testing Engineer',
      task: 'Test individual IaC modules',
      context: args,
      instructions: [
        'Identify all IaC modules',
        'Test each module independently',
        'Validate module inputs and outputs',
        'Check module dependencies',
        'Verify module documentation',
        'Test module reusability',
        'Validate module versioning',
        'Generate module test report'
      ],
      outputFormat: 'JSON with success, totalTests, passed, failed, failures (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        failures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'testing', 'modules', 'phase-4']
}));

export const runIaCIntegrationTestsTask = defineTask('run-iac-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Tests: ${args.projectName}`,
  agent: {
    name: 'integration-tester',
    prompt: {
      role: 'Infrastructure Integration Testing Specialist',
      task: 'Run integration tests for complete infrastructure',
      context: args,
      instructions: [
        'Test integration between all modules',
        'Validate end-to-end connectivity',
        'Test security policies integration',
        'Validate monitoring and logging integration',
        'Test backup and disaster recovery procedures',
        'Validate auto-scaling integration',
        'Test load balancing and routing',
        'Generate integration test report'
      ],
      outputFormat: 'JSON with success, totalTests, passed, failed, failures (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        failures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'testing', 'integration', 'phase-4']
}));

export const generateIaCDocumentationTask = defineTask('generate-iac-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  agent: {
    name: 'documentation-generator',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive IaC documentation',
      context: args,
      instructions: [
        'Generate README with project overview',
        'Document architecture and design decisions',
        'Document all modules and their purposes',
        'Document variables and their usage',
        'Document outputs and their purposes',
        'Create deployment instructions',
        'Document prerequisites and dependencies',
        'Create troubleshooting guide',
        'Document security considerations',
        'Create cost estimation documentation',
        'Generate architecture diagrams'
      ],
      outputFormat: 'JSON with success, documents (array with path, content), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documents', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'documentation', 'phase-5']
}));

export const createDeploymentPlanTask = defineTask('create-deployment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Deployment Plan: ${args.projectName}`,
  agent: {
    name: 'deployment-planner',
    prompt: {
      role: 'Infrastructure Deployment Lead',
      task: 'Create detailed deployment plan',
      context: args,
      instructions: [
        'Analyze deployment plan and resource changes',
        'Create phased deployment strategy',
        'Identify deployment dependencies',
        'Plan rollback procedures',
        'Define deployment checkpoints',
        'Create deployment timeline',
        'Identify deployment risks',
        'Plan monitoring during deployment',
        'Create deployment runbook',
        'Define success criteria'
      ],
      outputFormat: 'JSON with success, plan (phases, timeline, dependencies), rollbackPlan, risks, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'rollbackPlan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            timeline: { type: 'string' },
            dependencies: { type: 'array' }
          }
        },
        rollbackPlan: { type: 'object' },
        risks: { type: 'array' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'deployment', 'planning', 'phase-5']
}));

export const finalIaCReviewTask = defineTask('final-iac-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Review: ${args.projectName}`,
  agent: {
    name: 'infrastructure-reviewer',
    prompt: {
      role: 'Principal Infrastructure Engineer and Technical Reviewer',
      task: 'Conduct comprehensive final review of IaC implementation',
      context: args,
      instructions: [
        'Review quality convergence history',
        'Assess final quality against target',
        'Review all validation and test results',
        'Review security scan findings',
        'Review cost estimation and budget alignment',
        'Review compliance status',
        'Assess deployment readiness',
        'Identify any blocking issues',
        'Provide deployment recommendation',
        'Suggest post-deployment monitoring',
        'Recommend follow-up tasks'
      ],
      outputFormat: 'JSON with verdict, approved (boolean), confidence (0-100), strengths, concerns, blockingIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'confidence', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        approved: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-implementation', 'review', 'final', 'phase-6']
}));
