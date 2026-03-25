/**
 * @process specializations/devops-sre-platform/cost-optimization
 * @description Cost Optimization and FinOps Process - Comprehensive cloud cost optimization framework implementing
 * FinOps principles to analyze, optimize, and govern cloud spending across infrastructure, applications, and services.
 * Covers cost visibility, resource rightsizing, waste elimination, reservation management, budget tracking, cost
 * allocation, and continuous optimization practices to maximize cloud ROI.
 * @inputs { projectName: string, cloudProvider?: string, scope?: string, targetSavings?: number, budgetLimit?: number }
 * @outputs { success: boolean, totalSavings: number, savingsPercentage: number, recommendations: array, optimizations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/cost-optimization', {
 *   projectName: 'E-commerce Platform',
 *   cloudProvider: 'AWS', // 'AWS', 'Azure', 'GCP', 'multi-cloud'
 *   scope: 'full-infrastructure', // 'compute', 'storage', 'networking', 'full-infrastructure'
 *   targetSavings: 30, // percentage
 *   budgetLimit: 50000, // monthly budget in USD
 *   environment: 'production',
 *   includeReservations: true,
 *   includeSavingsPlans: true,
 *   analysisPeriod: 90 // days
 * });
 *
 * @references
 * - FinOps Foundation: https://www.finops.org/
 * - AWS Cost Optimization: https://aws.amazon.com/aws-cost-management/
 * - Azure Cost Management: https://azure.microsoft.com/en-us/products/cost-management/
 * - GCP Cost Optimization: https://cloud.google.com/cost-management
 * - Cloud FinOps Book: https://www.oreilly.com/library/view/cloud-finops/9781492054610/
 * - FinOps Framework: https://www.finops.org/framework/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cloudProvider = 'AWS', // 'AWS', 'Azure', 'GCP', 'multi-cloud'
    scope = 'full-infrastructure', // 'compute', 'storage', 'networking', 'databases', 'full-infrastructure'
    targetSavings = 25, // percentage
    budgetLimit = null, // monthly budget in USD
    environment = 'production',
    includeReservations = true,
    includeSavingsPlans = true,
    analysisPeriod = 90, // days for historical analysis
    outputDir = 'cost-optimization-output',
    enableAutomatedRemediation = false, // automated cost optimization actions
    costAllocationTags = [], // tags for cost allocation
    departments = [], // departments for showback/chargeback
    optimizationAreas = ['compute', 'storage', 'networking', 'databases', 'serverless'], // areas to optimize
    complianceRequirements = [] // cost compliance policies
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const optimizations = [];
  const recommendations = [];
  let totalCurrentCost = 0;
  let totalOptimizedCost = 0;
  let totalSavings = 0;
  let savingsPercentage = 0;

  ctx.log('info', `Starting Cost Optimization and FinOps Process for ${projectName}`);
  ctx.log('info', `Cloud Provider: ${cloudProvider}, Scope: ${scope}, Target Savings: ${targetSavings}%`);
  ctx.log('info', `Analysis Period: ${analysisPeriod} days, Budget Limit: ${budgetLimit ? `$${budgetLimit}` : 'Not set'}`);

  // ============================================================================
  // PHASE 1: COST DISCOVERY AND VISIBILITY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and analyzing cloud costs');

  const costDiscovery = await ctx.task(costDiscoveryTask, {
    projectName,
    cloudProvider,
    scope,
    environment,
    analysisPeriod,
    costAllocationTags,
    departments,
    outputDir
  });

  artifacts.push(...costDiscovery.artifacts);
  totalCurrentCost = costDiscovery.totalCurrentCost;

  ctx.log('info', `Cost Discovery Complete - Current Monthly Cost: $${totalCurrentCost.toFixed(2)}`);
  ctx.log('info', `Top Cost Categories: ${costDiscovery.topCostCategories.slice(0, 3).map(c => `${c.category}: $${c.cost.toFixed(2)}`).join(', ')}`);

  // Quality Gate: Cost visibility review
  await ctx.breakpoint({
    question: `Cost discovery complete for ${projectName}. Current monthly cost: $${totalCurrentCost.toFixed(2)}. Top cost drivers: ${costDiscovery.topCostCategories.slice(0, 5).map(c => c.category).join(', ')}. Review cost breakdown?`,
    title: 'Cost Discovery Review',
    context: {
      runId: ctx.runId,
      costSummary: {
        totalCurrentCost,
        byCategory: costDiscovery.topCostCategories.slice(0, 10),
        byService: costDiscovery.costByService.slice(0, 10),
        byDepartment: costDiscovery.costByDepartment,
        trend: costDiscovery.costTrend
      },
      files: costDiscovery.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: WASTE IDENTIFICATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying waste and inefficiencies');

  const wasteAnalysis = await ctx.task(wasteIdentificationTask, {
    projectName,
    cloudProvider,
    scope,
    environment,
    costDiscovery,
    analysisPeriod,
    optimizationAreas,
    outputDir
  });

  artifacts.push(...wasteAnalysis.artifacts);

  ctx.log('info', `Waste Analysis Complete - Identified $${wasteAnalysis.potentialSavings.toFixed(2)}/month in waste`);
  ctx.log('info', `Waste Categories: ${wasteAnalysis.wasteCategories.length} types identified`);

  // ============================================================================
  // PHASE 3: RESOURCE RIGHTSIZING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing resource utilization for rightsizing');

  const rightsizingAnalysis = await ctx.task(resourceRightsizingTask, {
    projectName,
    cloudProvider,
    scope,
    environment,
    analysisPeriod,
    optimizationAreas,
    outputDir
  });

  artifacts.push(...rightsizingAnalysis.artifacts);
  recommendations.push(...rightsizingAnalysis.recommendations);

  ctx.log('info', `Rightsizing Analysis Complete - ${rightsizingAnalysis.recommendations.length} recommendations, potential savings: $${rightsizingAnalysis.potentialSavings.toFixed(2)}/month`);

  // Quality Gate: Rightsizing recommendations review
  await ctx.breakpoint({
    question: `Resource rightsizing analysis complete. ${rightsizingAnalysis.recommendations.length} recommendations identified with potential savings of $${rightsizingAnalysis.potentialSavings.toFixed(2)}/month. Review and approve recommendations?`,
    title: 'Rightsizing Recommendations Review',
    context: {
      runId: ctx.runId,
      rightsizing: {
        totalRecommendations: rightsizingAnalysis.recommendations.length,
        potentialSavings: rightsizingAnalysis.potentialSavings,
        byResourceType: rightsizingAnalysis.byResourceType,
        highImpactRecommendations: rightsizingAnalysis.recommendations
          .filter(r => r.impact === 'high')
          .slice(0, 10)
      },
      files: rightsizingAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: RESERVATION AND SAVINGS PLANS ANALYSIS
  // ============================================================================

  if (includeReservations || includeSavingsPlans) {
    ctx.log('info', 'Phase 4: Analyzing reservation and savings plan opportunities');

    const reservationAnalysis = await ctx.task(reservationAnalysisTask, {
      projectName,
      cloudProvider,
      environment,
      costDiscovery,
      includeReservations,
      includeSavingsPlans,
      analysisPeriod,
      outputDir
    });

    artifacts.push(...reservationAnalysis.artifacts);
    recommendations.push(...reservationAnalysis.recommendations);

    ctx.log('info', `Reservation Analysis Complete - Potential savings: $${reservationAnalysis.potentialSavings.toFixed(2)}/month`);

    // Quality Gate: Reservation recommendations review
    await ctx.breakpoint({
      question: `Reservation and savings plan analysis complete. ${reservationAnalysis.recommendations.length} recommendations with potential savings of $${reservationAnalysis.potentialSavings.toFixed(2)}/month. Review commitment recommendations?`,
      title: 'Reservation Recommendations Review',
      context: {
        runId: ctx.runId,
        reservations: {
          totalRecommendations: reservationAnalysis.recommendations.length,
          potentialSavings: reservationAnalysis.potentialSavings,
          commitmentType: reservationAnalysis.commitmentType,
          coverageRecommendations: reservationAnalysis.coverageRecommendations,
          riskAssessment: reservationAnalysis.riskAssessment
        },
        files: reservationAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: STORAGE OPTIMIZATION
  // ============================================================================

  if (optimizationAreas.includes('storage')) {
    ctx.log('info', 'Phase 5: Optimizing storage costs');

    const storageOptimization = await ctx.task(storageOptimizationTask, {
      projectName,
      cloudProvider,
      environment,
      analysisPeriod,
      outputDir
    });

    artifacts.push(...storageOptimization.artifacts);
    recommendations.push(...storageOptimization.recommendations);
    optimizations.push({
      phase: 'Storage Optimization',
      result: storageOptimization
    });

    ctx.log('info', `Storage Optimization Complete - Potential savings: $${storageOptimization.potentialSavings.toFixed(2)}/month`);
  }

  // ============================================================================
  // PHASE 6: NETWORKING COST OPTIMIZATION
  // ============================================================================

  if (optimizationAreas.includes('networking')) {
    ctx.log('info', 'Phase 6: Optimizing networking costs');

    const networkingOptimization = await ctx.task(networkingOptimizationTask, {
      projectName,
      cloudProvider,
      environment,
      analysisPeriod,
      outputDir
    });

    artifacts.push(...networkingOptimization.artifacts);
    recommendations.push(...networkingOptimization.recommendations);
    optimizations.push({
      phase: 'Networking Optimization',
      result: networkingOptimization
    });

    ctx.log('info', `Networking Optimization Complete - Potential savings: $${networkingOptimization.potentialSavings.toFixed(2)}/month`);
  }

  // ============================================================================
  // PHASE 7: DATABASE COST OPTIMIZATION
  // ============================================================================

  if (optimizationAreas.includes('databases')) {
    ctx.log('info', 'Phase 7: Optimizing database costs');

    const databaseOptimization = await ctx.task(databaseOptimizationTask, {
      projectName,
      cloudProvider,
      environment,
      analysisPeriod,
      outputDir
    });

    artifacts.push(...databaseOptimization.artifacts);
    recommendations.push(...databaseOptimization.recommendations);
    optimizations.push({
      phase: 'Database Optimization',
      result: databaseOptimization
    });

    ctx.log('info', `Database Optimization Complete - Potential savings: $${databaseOptimization.potentialSavings.toFixed(2)}/month`);
  }

  // ============================================================================
  // PHASE 8: SERVERLESS OPTIMIZATION
  // ============================================================================

  if (optimizationAreas.includes('serverless')) {
    ctx.log('info', 'Phase 8: Optimizing serverless costs');

    const serverlessOptimization = await ctx.task(serverlessOptimizationTask, {
      projectName,
      cloudProvider,
      environment,
      analysisPeriod,
      outputDir
    });

    artifacts.push(...serverlessOptimization.artifacts);
    recommendations.push(...serverlessOptimization.recommendations);
    optimizations.push({
      phase: 'Serverless Optimization',
      result: serverlessOptimization
    });

    ctx.log('info', `Serverless Optimization Complete - Potential savings: $${serverlessOptimization.potentialSavings.toFixed(2)}/month`);
  }

  // ============================================================================
  // PHASE 9: COST ALLOCATION AND TAGGING
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing cost allocation and tagging strategy');

  const costAllocation = await ctx.task(costAllocationTask, {
    projectName,
    cloudProvider,
    environment,
    costAllocationTags,
    departments,
    costDiscovery,
    outputDir
  });

  artifacts.push(...costAllocation.artifacts);

  ctx.log('info', `Cost Allocation Complete - ${costAllocation.taggedResources} resources tagged, ${costAllocation.tagCoverage}% coverage`);

  // Quality Gate: Cost allocation review
  await ctx.breakpoint({
    question: `Cost allocation tagging strategy implemented. Tag coverage: ${costAllocation.tagCoverage}%. Untagged resources: ${costAllocation.untaggedResources}. Review showback/chargeback reports?`,
    title: 'Cost Allocation Review',
    context: {
      runId: ctx.runId,
      allocation: {
        taggedResources: costAllocation.taggedResources,
        untaggedResources: costAllocation.untaggedResources,
        tagCoverage: costAllocation.tagCoverage,
        costByDepartment: costAllocation.costByDepartment,
        costByProject: costAllocation.costByProject,
        costByEnvironment: costAllocation.costByEnvironment
      },
      files: costAllocation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 10: BUDGET AND ALERT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up budgets and cost alerts');

  const budgetSetup = await ctx.task(budgetAlertsTask, {
    projectName,
    cloudProvider,
    budgetLimit,
    departments,
    totalCurrentCost,
    targetSavings,
    outputDir
  });

  artifacts.push(...budgetSetup.artifacts);

  ctx.log('info', `Budget Setup Complete - ${budgetSetup.budgetsCreated} budgets created, ${budgetSetup.alertsConfigured} alerts configured`);

  // ============================================================================
  // PHASE 11: OPTIMIZATION PRIORITY AND ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating optimization priority and implementation roadmap');

  const optimizationRoadmap = await ctx.task(optimizationRoadmapTask, {
    projectName,
    totalCurrentCost,
    targetSavings,
    wasteAnalysis,
    rightsizingAnalysis,
    recommendations,
    optimizations,
    budgetLimit,
    outputDir
  });

  artifacts.push(...optimizationRoadmap.artifacts);

  ctx.log('info', `Optimization Roadmap Created - ${optimizationRoadmap.phases.length} implementation phases, ${optimizationRoadmap.quickWins.length} quick wins`);

  // Quality Gate: Roadmap approval
  await ctx.breakpoint({
    question: `Optimization roadmap created with ${optimizationRoadmap.phases.length} phases and projected savings of $${optimizationRoadmap.totalProjectedSavings.toFixed(2)}/month. Quick wins: ${optimizationRoadmap.quickWins.length}. Approve implementation plan?`,
    title: 'Optimization Roadmap Approval',
    context: {
      runId: ctx.runId,
      roadmap: {
        totalProjectedSavings: optimizationRoadmap.totalProjectedSavings,
        savingsPercentage: optimizationRoadmap.savingsPercentage,
        phases: optimizationRoadmap.phases,
        quickWins: optimizationRoadmap.quickWins,
        priorityRecommendations: optimizationRoadmap.priorityRecommendations.slice(0, 10)
      },
      files: optimizationRoadmap.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 12: IMPLEMENT QUICK WINS (Optional)
  // ============================================================================

  if (enableAutomatedRemediation && optimizationRoadmap.quickWins.length > 0) {
    ctx.log('info', 'Phase 12: Implementing quick win optimizations');

    const quickWinImplementation = await ctx.task(implementQuickWinsTask, {
      projectName,
      cloudProvider,
      quickWins: optimizationRoadmap.quickWins,
      outputDir
    });

    artifacts.push(...quickWinImplementation.artifacts);
    optimizations.push({
      phase: 'Quick Wins Implementation',
      result: quickWinImplementation
    });

    ctx.log('info', `Quick Wins Implemented - ${quickWinImplementation.implementedCount} optimizations, $${quickWinImplementation.actualSavings.toFixed(2)}/month saved`);

    // Quality Gate: Quick wins verification
    await ctx.breakpoint({
      question: `Quick win optimizations implemented. ${quickWinImplementation.implementedCount} of ${quickWinImplementation.attemptedCount} successful. Actual savings: $${quickWinImplementation.actualSavings.toFixed(2)}/month. Verify changes?`,
      title: 'Quick Wins Verification',
      context: {
        runId: ctx.runId,
        implementation: {
          implementedCount: quickWinImplementation.implementedCount,
          failedCount: quickWinImplementation.failedCount,
          actualSavings: quickWinImplementation.actualSavings,
          implementedOptimizations: quickWinImplementation.implementations
        },
        files: quickWinImplementation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: FINOPS GOVERNANCE AND POLICIES
  // ============================================================================

  ctx.log('info', 'Phase 13: Establishing FinOps governance and policies');

  const finopsGovernance = await ctx.task(finopsGovernanceTask, {
    projectName,
    cloudProvider,
    departments,
    complianceRequirements,
    budgetLimit,
    costAllocation,
    outputDir
  });

  artifacts.push(...finopsGovernance.artifacts);

  ctx.log('info', `FinOps Governance Complete - ${finopsGovernance.policiesCreated} policies created, ${finopsGovernance.guardrailsImplemented} guardrails implemented`);

  // ============================================================================
  // PHASE 14: COST MONITORING AND DASHBOARDS
  // ============================================================================

  ctx.log('info', 'Phase 14: Setting up cost monitoring dashboards and reports');

  const costMonitoring = await ctx.task(costMonitoringTask, {
    projectName,
    cloudProvider,
    departments,
    costDiscovery,
    budgetSetup,
    optimizationRoadmap,
    outputDir
  });

  artifacts.push(...costMonitoring.artifacts);

  ctx.log('info', `Cost Monitoring Setup Complete - ${costMonitoring.dashboardsCreated} dashboards created, ${costMonitoring.reportsScheduled} reports scheduled`);

  // ============================================================================
  // PHASE 15: CALCULATE FINAL SAVINGS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 15: Calculating final savings and generating recommendations');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    projectName,
    totalCurrentCost,
    targetSavings,
    wasteAnalysis,
    rightsizingAnalysis,
    optimizations,
    optimizationRoadmap,
    costAllocation,
    budgetSetup,
    outputDir
  });

  totalSavings = finalAssessment.totalProjectedSavings;
  savingsPercentage = finalAssessment.savingsPercentage;
  totalOptimizedCost = totalCurrentCost - totalSavings;

  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Final Assessment Complete - Total Projected Savings: $${totalSavings.toFixed(2)}/month (${savingsPercentage.toFixed(1)}%)`);

  // Final Breakpoint: Cost optimization complete
  await ctx.breakpoint({
    question: `Cost Optimization and FinOps Process Complete for ${projectName}. Current cost: $${totalCurrentCost.toFixed(2)}/month. Projected optimized cost: $${totalOptimizedCost.toFixed(2)}/month. Savings: $${totalSavings.toFixed(2)}/month (${savingsPercentage.toFixed(1)}%). Target achieved: ${savingsPercentage >= targetSavings ? 'Yes' : 'No'}. Review and proceed with implementation?`,
    title: 'Final Cost Optimization Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        cloudProvider,
        currentMonthlyCost: totalCurrentCost,
        optimizedMonthlyCost: totalOptimizedCost,
        totalMonthlySavings: totalSavings,
        savingsPercentage,
        targetSavings,
        targetAchieved: savingsPercentage >= targetSavings,
        annualSavings: totalSavings * 12
      },
      breakdown: {
        wasteElimination: wasteAnalysis.potentialSavings,
        rightsizing: rightsizingAnalysis.potentialSavings,
        reservations: includeReservations || includeSavingsPlans ? finalAssessment.reservationSavings : 0,
        storage: optimizations.find(o => o.phase === 'Storage Optimization')?.result.potentialSavings || 0,
        networking: optimizations.find(o => o.phase === 'Networking Optimization')?.result.potentialSavings || 0,
        databases: optimizations.find(o => o.phase === 'Database Optimization')?.result.potentialSavings || 0,
        serverless: optimizations.find(o => o.phase === 'Serverless Optimization')?.result.potentialSavings || 0
      },
      topRecommendations: finalAssessment.topRecommendations.slice(0, 15),
      nextSteps: finalAssessment.nextSteps,
      files: [
        { path: finalAssessment.executiveSummaryPath, format: 'markdown', label: 'Executive Summary' },
        { path: optimizationRoadmap.roadmapPath, format: 'markdown', label: 'Implementation Roadmap' },
        { path: costMonitoring.dashboardsConfigPath, format: 'json', label: 'Cost Dashboards Configuration' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    cloudProvider,
    scope,
    environment,
    costs: {
      currentMonthlyCost: totalCurrentCost,
      optimizedMonthlyCost: totalOptimizedCost,
      monthlySavings: totalSavings,
      annualSavings: totalSavings * 12,
      savingsPercentage,
      targetSavings,
      targetAchieved: savingsPercentage >= targetSavings
    },
    savingsBreakdown: {
      wasteElimination: {
        amount: wasteAnalysis.potentialSavings,
        percentage: (wasteAnalysis.potentialSavings / totalCurrentCost) * 100
      },
      rightsizing: {
        amount: rightsizingAnalysis.potentialSavings,
        percentage: (rightsizingAnalysis.potentialSavings / totalCurrentCost) * 100,
        recommendations: rightsizingAnalysis.recommendations.length
      },
      reservations: includeReservations || includeSavingsPlans ? {
        amount: finalAssessment.reservationSavings,
        percentage: (finalAssessment.reservationSavings / totalCurrentCost) * 100
      } : null,
      storage: optimizations.find(o => o.phase === 'Storage Optimization') ? {
        amount: optimizations.find(o => o.phase === 'Storage Optimization').result.potentialSavings,
        percentage: (optimizations.find(o => o.phase === 'Storage Optimization').result.potentialSavings / totalCurrentCost) * 100
      } : null,
      networking: optimizations.find(o => o.phase === 'Networking Optimization') ? {
        amount: optimizations.find(o => o.phase === 'Networking Optimization').result.potentialSavings,
        percentage: (optimizations.find(o => o.phase === 'Networking Optimization').result.potentialSavings / totalCurrentCost) * 100
      } : null,
      databases: optimizations.find(o => o.phase === 'Database Optimization') ? {
        amount: optimizations.find(o => o.phase === 'Database Optimization').result.potentialSavings,
        percentage: (optimizations.find(o => o.phase === 'Database Optimization').result.potentialSavings / totalCurrentCost) * 100
      } : null,
      serverless: optimizations.find(o => o.phase === 'Serverless Optimization') ? {
        amount: optimizations.find(o => o.phase === 'Serverless Optimization').result.potentialSavings,
        percentage: (optimizations.find(o => o.phase === 'Serverless Optimization').result.potentialSavings / totalCurrentCost) * 100
      } : null
    },
    recommendations: {
      total: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length,
      mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
      lowPriority: recommendations.filter(r => r.priority === 'low').length,
      topRecommendations: finalAssessment.topRecommendations
    },
    optimization: {
      phases: optimizationRoadmap.phases.length,
      quickWins: optimizationRoadmap.quickWins.length,
      quickWinsImplemented: enableAutomatedRemediation ? optimizations.find(o => o.phase === 'Quick Wins Implementation')?.result.implementedCount || 0 : 0,
      estimatedImplementationTime: optimizationRoadmap.estimatedImplementationTime
    },
    costAllocation: {
      tagCoverage: costAllocation.tagCoverage,
      taggedResources: costAllocation.taggedResources,
      untaggedResources: costAllocation.untaggedResources,
      departments: costAllocation.costByDepartment.length,
      showbackEnabled: costAllocation.showbackEnabled,
      chargebackEnabled: costAllocation.chargebackEnabled
    },
    governance: {
      policiesCreated: finopsGovernance.policiesCreated,
      guardrailsImplemented: finopsGovernance.guardrailsImplemented,
      complianceScore: finopsGovernance.complianceScore
    },
    monitoring: {
      dashboardsCreated: costMonitoring.dashboardsCreated,
      reportsScheduled: costMonitoring.reportsScheduled,
      alertsConfigured: budgetSetup.alertsConfigured,
      budgetsCreated: budgetSetup.budgetsCreated
    },
    artifacts,
    reports: {
      executiveSummaryPath: finalAssessment.executiveSummaryPath,
      detailedReportPath: finalAssessment.detailedReportPath,
      roadmapPath: optimizationRoadmap.roadmapPath,
      dashboardsConfigPath: costMonitoring.dashboardsConfigPath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/cost-optimization',
      processSlug: 'cost-optimization',
      category: 'devops-sre-platform',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      analysisPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Cost Discovery
export const costDiscoveryTask = defineTask('cost-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Cost Discovery and Visibility - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Analyst and Cloud Cost Expert',
      task: 'Discover and analyze cloud costs to establish baseline visibility',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        scope: args.scope,
        environment: args.environment,
        analysisPeriod: args.analysisPeriod,
        costAllocationTags: args.costAllocationTags,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Connect to cloud cost management APIs:',
        '   - AWS: Cost Explorer API, AWS Cost and Usage Report',
        '   - Azure: Cost Management API, Azure Consumption API',
        '   - GCP: Cloud Billing API, BigQuery billing exports',
        '2. Query historical cost data for analysis period (90 days)',
        '3. Calculate total current monthly cost',
        '4. Break down costs by:',
        '   - Service/Product (EC2, S3, RDS, Lambda, etc.)',
        '   - Resource Type (instances, volumes, snapshots)',
        '   - Region/Location',
        '   - Environment (production, staging, dev)',
        '   - Department/Team (if tags available)',
        '   - Project/Application',
        '   - Cost category (compute, storage, networking, etc.)',
        '5. Identify top cost drivers (top 20 services/resources)',
        '6. Analyze cost trends:',
        '   - Month-over-month growth rate',
        '   - Day-of-week patterns',
        '   - Seasonality patterns',
        '   - Unexpected spikes or anomalies',
        '7. Calculate cost metrics:',
        '   - Average daily cost',
        '   - Cost per environment',
        '   - Cost per department',
        '8. Assess tag coverage for cost allocation',
        '9. Identify untagged or improperly tagged resources',
        '10. Generate comprehensive cost discovery report',
        '11. Create cost breakdown visualizations (CSV for charting)',
        '12. Document cost baseline and key findings'
      ],
      outputFormat: 'JSON object with cost discovery details'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCurrentCost', 'topCostCategories', 'costByService', 'costTrend', 'artifacts'],
      properties: {
        totalCurrentCost: { type: 'number', description: 'Current monthly cost in USD' },
        averageDailyCost: { type: 'number' },
        topCostCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              cost: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        },
        costByService: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              cost: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        },
        costByRegion: { type: 'array' },
        costByEnvironment: { type: 'array' },
        costByDepartment: { type: 'array' },
        costTrend: {
          type: 'object',
          properties: {
            growthRate: { type: 'number', description: 'Month-over-month growth percentage' },
            trend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
            anomalies: { type: 'array' }
          }
        },
        tagCoverage: { type: 'number', description: 'Percentage of resources with cost allocation tags' },
        untaggedResourcesCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'discovery']
}));

// Phase 2: Waste Identification
export const wasteIdentificationTask = defineTask('waste-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Waste Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Waste Detection Specialist',
      task: 'Identify cloud waste and inefficiencies',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        scope: args.scope,
        environment: args.environment,
        costDiscovery: args.costDiscovery,
        analysisPeriod: args.analysisPeriod,
        optimizationAreas: args.optimizationAreas,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify idle resources (zero or minimal utilization):',
        '   - Stopped EC2 instances (still incurring EBS volume costs)',
        '   - Idle load balancers (no traffic)',
        '   - Unused elastic IPs',
        '   - Idle NAT gateways',
        '   - Unattached EBS volumes',
        '   - Old EBS snapshots (>90 days)',
        '   - Idle RDS instances',
        '2. Identify zombie resources:',
        '   - Orphaned resources from deleted applications',
        '   - Old test/dev resources not cleaned up',
        '   - Resources from abandoned projects',
        '3. Identify oversized resources:',
        '   - Over-provisioned instances (low CPU/memory)',
        '   - Oversized databases',
        '   - Excessive IOPS provisioned',
        '4. Identify inefficient architectures:',
        '   - Resources in expensive regions unnecessarily',
        '   - Inefficient data transfer patterns',
        '   - Redundant backups/snapshots',
        '5. Identify old generation resources:',
        '   - Previous generation instance types',
        '   - Deprecated services with cheaper alternatives',
        '6. Identify scheduling opportunities:',
        '   - Non-production resources running 24/7',
        '   - Dev/test environments that could be scheduled',
        '7. For each waste category:',
        '   - Count affected resources',
        '   - Calculate wasted cost',
        '   - Estimate potential savings',
        '   - Assess remediation difficulty (easy, medium, hard)',
        '8. Categorize waste by type and priority',
        '9. Calculate total waste and potential savings',
        '10. Generate waste analysis report with actionable findings'
      ],
      outputFormat: 'JSON object with waste analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'wasteCategories', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number', description: 'Total monthly savings from waste elimination' },
        wasteCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              resourceCount: { type: 'number' },
              wastedCost: { type: 'number' },
              potentialSavings: { type: 'number' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        idleResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceId: { type: 'string' },
              resourceType: { type: 'string' },
              monthlyCost: { type: 'number' },
              utilization: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        schedulingOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceId: { type: 'string' },
              environment: { type: 'string' },
              currentRuntime: { type: 'string' },
              proposedSchedule: { type: 'string' },
              potentialSavings: { type: 'number' }
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
  labels: ['agent', 'cost-optimization', 'waste']
}));

// Phase 3: Resource Rightsizing
export const resourceRightsizingTask = defineTask('resource-rightsizing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Resource Rightsizing Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Resource Optimization Engineer',
      task: 'Analyze resource utilization and provide rightsizing recommendations',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        scope: args.scope,
        environment: args.environment,
        analysisPeriod: args.analysisPeriod,
        optimizationAreas: args.optimizationAreas,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query CloudWatch/Azure Monitor/Cloud Monitoring for utilization metrics:',
        '   - CPU utilization (average, peak, p95)',
        '   - Memory utilization',
        '   - Network throughput',
        '   - Disk IOPS and throughput',
        '   - Storage utilization',
        '2. Analyze compute resource utilization (EC2, VMs, GCE):',
        '   - Identify over-provisioned instances (CPU <40%, Memory <60%)',
        '   - Identify under-provisioned instances (CPU >80%, Memory >85%)',
        '   - Recommend appropriate instance types',
        '   - Consider newer generation instance types with better price/performance',
        '   - Consider graviton/ARM-based instances for cost savings',
        '3. Analyze database utilization (RDS, Cloud SQL, etc.):',
        '   - CPU, memory, connection count',
        '   - Storage utilization and IOPS',
        '   - Recommend rightsizing or migration to serverless',
        '4. Analyze storage (EBS, disks, Cloud Storage):',
        '   - Provisioned vs. actual IOPS usage',
        '   - Storage tier optimization (hot, cool, archive)',
        '   - Snapshot optimization',
        '5. For each rightsizing opportunity:',
        '   - Current resource configuration and cost',
        '   - Recommended configuration',
        '   - Expected cost after rightsizing',
        '   - Monthly savings',
        '   - Impact assessment (performance, risk)',
        '   - Downtime required (if any)',
        '6. Categorize recommendations by:',
        '   - Impact: high (>$500/month), medium ($100-$500), low (<$100)',
        '   - Risk: low (safe), medium (test recommended), high (careful review)',
        '   - Effort: low (automated), medium (manual), high (complex)',
        '7. Calculate total potential savings from rightsizing',
        '8. Generate prioritized rightsizing recommendations report'
      ],
      outputFormat: 'JSON object with rightsizing analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'recommendations', 'byResourceType', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceId: { type: 'string' },
              resourceType: { type: 'string' },
              currentConfig: { type: 'string' },
              currentCost: { type: 'number' },
              recommendedConfig: { type: 'string' },
              recommendedCost: { type: 'number' },
              savings: { type: 'number' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              rationale: { type: 'string' },
              utilizationMetrics: { type: 'object' }
            }
          }
        },
        byResourceType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceType: { type: 'string' },
              count: { type: 'number' },
              potentialSavings: { type: 'number' }
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
  labels: ['agent', 'cost-optimization', 'rightsizing']
}));

// Phase 4: Reservation Analysis
export const reservationAnalysisTask = defineTask('reservation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Reservation and Savings Plans Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Financial Analyst specializing in Commitments',
      task: 'Analyze reservation and savings plan opportunities for cost savings',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        environment: args.environment,
        costDiscovery: args.costDiscovery,
        includeReservations: args.includeReservations,
        includeSavingsPlans: args.includeSavingsPlans,
        analysisPeriod: args.analysisPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze current reservation/commitment coverage:',
        '   - AWS: Reserved Instances (RI), Savings Plans',
        '   - Azure: Reserved VM Instances, Savings Plans',
        '   - GCP: Committed Use Discounts (CUD)',
        '2. Identify eligible resources for commitments:',
        '   - Steady-state workloads (running 24/7)',
        '   - Production instances with stable patterns',
        '   - Predictable database usage',
        '3. Analyze usage patterns over analysis period:',
        '   - Consistent vs. variable usage',
        '   - Baseline usage that could be covered by commitments',
        '   - Peak vs. average usage',
        '4. Calculate optimal reservation strategy:',
        '   - 1-year vs. 3-year commitment',
        '   - No upfront vs. partial vs. all upfront payment',
        '   - Instance type flexibility vs. specific instance',
        '   - Regional vs. zonal coverage',
        '5. For Savings Plans:',
        '   - Compute Savings Plans (flexible across instance families)',
        '   - EC2 Instance Savings Plans (specific instance family)',
        '   - Calculate hourly commitment amount',
        '6. Calculate potential savings:',
        '   - Discount percentage (typically 30-70%)',
        '   - Monthly savings from commitments',
        '   - Break-even analysis',
        '7. Assess risk:',
        '   - Workload volatility',
        '   - Business uncertainty',
        '   - Technology changes',
        '   - Recommendation: start with 1-year, lower coverage',
        '8. Recommend coverage percentage:',
        '   - Conservative: 60-70% of baseline usage',
        '   - Moderate: 70-80% of baseline usage',
        '   - Aggressive: 80-90% of baseline usage',
        '9. Generate reservation purchase recommendations',
        '10. Include utilization and coverage monitoring strategy'
      ],
      outputFormat: 'JSON object with reservation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'recommendations', 'coverageRecommendations', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number' },
        currentCoverage: { type: 'number', description: 'Current reservation coverage percentage' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              commitmentType: { type: 'string', description: 'RI, Savings Plan, CUD' },
              resourceType: { type: 'string' },
              term: { type: 'string', description: '1-year or 3-year' },
              paymentOption: { type: 'string' },
              quantity: { type: 'number' },
              hourlyCommitment: { type: 'number' },
              upfrontCost: { type: 'number' },
              monthlyCost: { type: 'number' },
              monthlySavings: { type: 'number' },
              discountPercentage: { type: 'number' },
              breakEvenMonths: { type: 'number' }
            }
          }
        },
        coverageRecommendations: {
          type: 'object',
          properties: {
            recommendedCoverage: { type: 'number', description: 'Percentage' },
            strategy: { type: 'string', enum: ['conservative', 'moderate', 'aggressive'] },
            rationale: { type: 'string' }
          }
        },
        riskAssessment: {
          type: 'object',
          properties: {
            workloadStability: { type: 'string', enum: ['high', 'medium', 'low'] },
            usageVolatility: { type: 'number' },
            overallRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        commitmentType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'reservations']
}));

// Phase 5: Storage Optimization
export const storageOptimizationTask = defineTask('storage-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Storage Cost Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Storage Optimization Engineer',
      task: 'Optimize storage costs through tiering, lifecycle policies, and cleanup',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        environment: args.environment,
        analysisPeriod: args.analysisPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze object storage (S3, Blob Storage, Cloud Storage):',
        '   - Identify objects in expensive tiers (Standard)',
        '   - Check access patterns and last access time',
        '   - Recommend tier transitions:',
        '     * Infrequent Access (30+ days no access)',
        '     * Archive (90+ days no access)',
        '     * Deep Archive (180+ days no access)',
        '   - Calculate storage tier savings',
        '2. Implement lifecycle policies:',
        '   - Auto-transition to lower tiers based on age/access',
        '   - Auto-delete old temp/log files',
        '   - Expire old versions and delete markers',
        '3. Analyze block storage (EBS, Azure Disks):',
        '   - Identify unattached volumes',
        '   - Identify old snapshots (>90 days)',
        '   - Identify oversized volumes (low utilization)',
        '   - Recommend volume type changes (gp3 vs gp2)',
        '   - Recommend snapshot retention policies',
        '4. Analyze backup and disaster recovery:',
        '   - Excessive backup retention',
        '   - Redundant backups',
        '   - Backup compression opportunities',
        '5. Optimize database storage:',
        '   - Unused database storage (overprovisioned)',
        '   - Old backup retention',
        '   - Enable storage auto-scaling',
        '6. Identify data duplication:',
        '   - Same files stored in multiple locations',
        '   - Old duplicates that can be cleaned up',
        '7. Calculate storage savings:',
        '   - Tier transitions',
        '   - Cleanup and deletion',
        '   - Compression',
        '   - Snapshot optimization',
        '8. Generate storage optimization recommendations',
        '9. Include implementation scripts/policies'
      ],
      outputFormat: 'JSON object with storage optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'recommendations', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimizationType: { type: 'string' },
              resourceId: { type: 'string' },
              currentConfig: { type: 'string' },
              currentCost: { type: 'number' },
              recommendedAction: { type: 'string' },
              newCost: { type: 'number' },
              savings: { type: 'number' },
              effort: { type: 'string' }
            }
          }
        },
        storageTieringSavings: { type: 'number' },
        lifecyclePolicies: { type: 'array' },
        cleanupOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'storage']
}));

// Phase 6: Networking Optimization
export const networkingOptimizationTask = defineTask('networking-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Networking Cost Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Network Cost Engineer',
      task: 'Optimize networking and data transfer costs',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        environment: args.environment,
        analysisPeriod: args.analysisPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze data transfer costs:',
        '   - Cross-region data transfer',
        '   - Internet egress (data out)',
        '   - Inter-AZ/zone data transfer',
        '   - VPN and Direct Connect costs',
        '2. Identify expensive data transfer patterns:',
        '   - Large cross-region transfers',
        '   - Inefficient architectures causing excessive transfers',
        '   - Chatty microservices',
        '3. Optimize data transfer:',
        '   - Consolidate resources in same region/AZ',
        '   - Use CloudFront/CDN to reduce origin requests',
        '   - Compress data before transfer',
        '   - Use S3 Transfer Acceleration where appropriate',
        '   - Implement data caching strategies',
        '4. Optimize load balancers:',
        '   - Identify idle load balancers',
        '   - Consolidate low-traffic load balancers',
        '   - Right-size load balancer types (ALB vs NLB vs Gateway)',
        '5. Optimize NAT Gateways:',
        '   - Identify idle NAT Gateways',
        '   - Consider NAT instance for low traffic',
        '   - Consolidate NAT Gateways across AZs where appropriate',
        '6. Optimize VPN and Direct Connect:',
        '   - Right-size connection bandwidth',
        '   - Identify unused connections',
        '7. Calculate networking savings:',
        '   - Data transfer optimization',
        '   - Load balancer optimization',
        '   - NAT Gateway optimization',
        '   - Architecture changes',
        '8. Generate networking optimization recommendations',
        '9. Include architecture diagrams showing optimized data flows'
      ],
      outputFormat: 'JSON object with networking optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'recommendations', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimizationType: { type: 'string' },
              resourceId: { type: 'string' },
              currentSetup: { type: 'string' },
              currentCost: { type: 'number' },
              recommendedChange: { type: 'string' },
              newCost: { type: 'number' },
              savings: { type: 'number' },
              complexity: { type: 'string' }
            }
          }
        },
        dataTransferSavings: { type: 'number' },
        loadBalancerSavings: { type: 'number' },
        natGatewaySavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'networking']
}));

// Phase 7: Database Optimization
export const databaseOptimizationTask = defineTask('database-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Database Cost Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Performance and Cost Engineer',
      task: 'Optimize database costs through rightsizing, serverless, and efficiency improvements',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        environment: args.environment,
        analysisPeriod: args.analysisPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze database utilization (RDS, Aurora, Cloud SQL, etc.):',
        '   - CPU, memory, connections',
        '   - IOPS and storage utilization',
        '   - Query performance metrics',
        '2. Identify rightsizing opportunities:',
        '   - Over-provisioned instances',
        '   - Under-provisioned instances causing performance issues',
        '   - Recommend appropriate instance sizes',
        '3. Evaluate serverless database options:',
        '   - Aurora Serverless for variable workloads',
        '   - Azure SQL Database serverless',
        '   - Compare costs: traditional vs serverless',
        '4. Optimize storage and backups:',
        '   - Oversized storage allocation',
        '   - Excessive backup retention (>30 days)',
        '   - Enable storage auto-scaling',
        '   - Optimize snapshot frequency',
        '5. Consider read replicas optimization:',
        '   - Unused or under-utilized read replicas',
        '   - Right-size read replica instances',
        '6. Evaluate multi-AZ vs single-AZ:',
        '   - Dev/test databases that dont need multi-AZ',
        '   - Significant cost difference (2x)',
        '7. Consider Reserved Instances for databases:',
        '   - Steady-state production databases',
        '   - Calculate RI savings',
        '8. Optimize database engines:',
        '   - Migrate from commercial to open-source (Oracle/SQL Server to PostgreSQL/MySQL)',
        '   - Cost comparison and migration feasibility',
        '9. Calculate database savings',
        '10. Generate database optimization recommendations with migration paths'
      ],
      outputFormat: 'JSON object with database optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'recommendations', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              databaseId: { type: 'string' },
              engine: { type: 'string' },
              currentConfig: { type: 'string' },
              currentCost: { type: 'number' },
              recommendedChange: { type: 'string' },
              newCost: { type: 'number' },
              savings: { type: 'number' },
              risk: { type: 'string' },
              complexity: { type: 'string' }
            }
          }
        },
        serverlessOpportunities: { type: 'array' },
        rightsizingSavings: { type: 'number' },
        reservationSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'database']
}));

// Phase 8: Serverless Optimization
export const serverlessOptimizationTask = defineTask('serverless-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Serverless Cost Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Serverless Architecture and Cost Engineer',
      task: 'Optimize serverless function costs and configurations',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        environment: args.environment,
        analysisPeriod: args.analysisPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze Lambda/Functions costs:',
        '   - Invocation count',
        '   - Execution duration',
        '   - Memory allocation',
        '   - Request/response payload size',
        '2. Optimize function memory allocation:',
        '   - Over-provisioned memory (unused)',
        '   - Under-provisioned causing slow execution',
        '   - Use AWS Lambda Power Tuning tool or equivalent',
        '   - Find optimal memory for cost/performance',
        '3. Optimize function execution time:',
        '   - Identify slow functions',
        '   - Code optimization opportunities',
        '   - Cold start reduction strategies',
        '   - Connection pooling and reuse',
        '4. Reduce invocation count:',
        '   - Batch processing instead of per-item',
        '   - Increase polling intervals where appropriate',
        '   - Use EventBridge scheduled rules efficiently',
        '5. Optimize API Gateway costs:',
        '   - HTTP API vs REST API (cheaper)',
        '   - Response caching',
        '   - Request throttling',
        '6. Consider Graviton2 architecture (Lambda):',
        '   - 20% better price/performance',
        '   - Identify compatible functions',
        '7. Evaluate alternatives for high-volume functions:',
        '   - Container-based (ECS/Fargate) for consistent workloads',
        '   - Cost comparison at scale',
        '8. Optimize CloudWatch Logs retention:',
        '   - Excessive retention periods',
        '   - Log volume reduction',
        '9. Calculate serverless savings',
        '10. Generate optimization recommendations with implementation details'
      ],
      outputFormat: 'JSON object with serverless optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialSavings', 'recommendations', 'artifacts'],
      properties: {
        potentialSavings: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              functionName: { type: 'string' },
              currentMemory: { type: 'number' },
              currentDuration: { type: 'number' },
              currentCost: { type: 'number' },
              recommendedMemory: { type: 'number' },
              expectedDuration: { type: 'number' },
              newCost: { type: 'number' },
              savings: { type: 'number' },
              optimizationType: { type: 'string' }
            }
          }
        },
        memoryOptimizationSavings: { type: 'number' },
        invocationOptimizationSavings: { type: 'number' },
        architectureSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'serverless']
}));

// Phase 9: Cost Allocation
export const costAllocationTask = defineTask('cost-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Cost Allocation and Tagging - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Governance Specialist',
      task: 'Implement comprehensive cost allocation tagging strategy',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        environment: args.environment,
        costAllocationTags: args.costAllocationTags,
        departments: args.departments,
        costDiscovery: args.costDiscovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define cost allocation tag schema:',
        '   - Required tags: Environment, Project, Owner, Department, CostCenter',
        '   - Optional tags: Application, Team, Service, Function',
        '   - Standardize tag names and values',
        '2. Audit current tagging:',
        '   - Identify untagged resources',
        '   - Identify improperly tagged resources',
        '   - Calculate current tag coverage percentage',
        '3. Implement tagging policies:',
        '   - AWS: Tag Policies in Organizations',
        '   - Azure: Azure Policy for tagging',
        '   - GCP: Organization Policy for labels',
        '   - Enforce tags on resource creation',
        '4. Tag existing resources:',
        '   - Create tagging scripts/automation',
        '   - Tag high-cost resources first',
        '   - Tag by service, region, project',
        '   - Validate tag application',
        '5. Enable cost allocation tags in billing:',
        '   - Activate tags for cost reports',
        '   - Wait for tag data to appear (24-48 hours)',
        '6. Create cost allocation reports:',
        '   - Cost by department',
        '   - Cost by project/application',
        '   - Cost by environment (prod, staging, dev)',
        '   - Cost by team/owner',
        '7. Implement showback/chargeback:',
        '   - Showback: visibility without billing',
        '   - Chargeback: actual cost allocation to departments',
        '   - Create automated reports',
        '8. Set up tag compliance monitoring:',
        '   - Alert on untagged resources',
        '   - Periodic tag audit reports',
        '9. Calculate tag coverage improvement',
        '10. Generate tagging implementation guide and reports'
      ],
      outputFormat: 'JSON object with cost allocation details'
    },
    outputSchema: {
      type: 'object',
      required: ['taggedResources', 'untaggedResources', 'tagCoverage', 'costByDepartment', 'artifacts'],
      properties: {
        taggedResources: { type: 'number' },
        untaggedResources: { type: 'number' },
        tagCoverage: { type: 'number', description: 'Percentage of resources with required tags' },
        tagSchema: {
          type: 'object',
          properties: {
            requiredTags: { type: 'array', items: { type: 'string' } },
            optionalTags: { type: 'array', items: { type: 'string' } }
          }
        },
        costByDepartment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              department: { type: 'string' },
              cost: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        },
        costByProject: { type: 'array' },
        costByEnvironment: { type: 'array' },
        showbackEnabled: { type: 'boolean' },
        chargebackEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'allocation']
}));

// Phase 10: Budget and Alerts
export const budgetAlertsTask = defineTask('budget-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Budget and Cost Alert Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Budget Management Specialist',
      task: 'Set up budgets and cost alerts to prevent overspending',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        budgetLimit: args.budgetLimit,
        departments: args.departments,
        totalCurrentCost: args.totalCurrentCost,
        targetSavings: args.targetSavings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create organizational budgets:',
        '   - Master budget for total cloud spend',
        '   - Department/team budgets',
        '   - Project/application budgets',
        '   - Environment budgets (prod, non-prod)',
        '2. Set budget thresholds:',
        '   - Alert at 50% of budget',
        '   - Alert at 75% of budget',
        '   - Alert at 90% of budget',
        '   - Alert at 100% of budget (exceeded)',
        '3. Configure budget alerts:',
        '   - AWS Budgets with SNS notifications',
        '   - Azure Cost Management budgets',
        '   - GCP Budget alerts',
        '   - Email notifications to stakeholders',
        '   - Slack/Teams integration',
        '4. Set up anomaly detection:',
        '   - AWS Cost Anomaly Detection',
        '   - Azure Cost Management anomaly alerts',
        '   - Alert on unexpected cost spikes',
        '5. Create cost forecasts:',
        '   - Project end-of-month costs',
        '   - Alert if forecast exceeds budget',
        '6. Implement automated responses (optional):',
        '   - Stop non-prod resources at budget threshold',
        '   - Require approval for new resources',
        '   - Scale down resources automatically',
        '7. Set up budget review cadence:',
        '   - Weekly cost reviews',
        '   - Monthly budget vs actual analysis',
        '   - Quarterly budget adjustments',
        '8. Create budget dashboards:',
        '   - Budget vs actual spend',
        '   - Forecast vs budget',
        '   - Department spend tracking',
        '9. Document budget policies and escalation procedures',
        '10. Generate budget configuration report'
      ],
      outputFormat: 'JSON object with budget setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['budgetsCreated', 'alertsConfigured', 'artifacts'],
      properties: {
        budgetsCreated: { type: 'number' },
        alertsConfigured: { type: 'number' },
        budgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scope: { type: 'string' },
              amount: { type: 'number' },
              period: { type: 'string' },
              thresholds: { type: 'array', items: { type: 'number' } },
              alertChannels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        anomalyDetectionEnabled: { type: 'boolean' },
        forecastingEnabled: { type: 'boolean' },
        automatedActionsEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'budgets']
}));

// Phase 11: Optimization Roadmap
export const optimizationRoadmapTask = defineTask('optimization-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Optimization Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic FinOps Planner',
      task: 'Create prioritized implementation roadmap for cost optimizations',
      context: {
        projectName: args.projectName,
        totalCurrentCost: args.totalCurrentCost,
        targetSavings: args.targetSavings,
        wasteAnalysis: args.wasteAnalysis,
        rightsizingAnalysis: args.rightsizingAnalysis,
        recommendations: args.recommendations,
        optimizations: args.optimizations,
        budgetLimit: args.budgetLimit,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Consolidate all recommendations from all phases',
        '2. Prioritize recommendations using scoring model:',
        '   - Impact score (savings amount): 0-10',
        '   - Effort score (complexity, time): 0-10',
        '   - Risk score (business risk): 0-10',
        '   - Calculate priority = (Impact * 2 + (10 - Effort) + (10 - Risk)) / 4',
        '3. Identify "Quick Wins" (high impact, low effort, low risk):',
        '   - Can be implemented in <1 week',
        '   - Minimal risk',
        '   - Immediate cost savings',
        '   - Examples: terminate idle resources, delete old snapshots',
        '4. Group recommendations into implementation phases:',
        '   - Phase 1 (Week 1-2): Quick wins and waste elimination',
        '   - Phase 2 (Week 3-4): Rightsizing and optimization',
        '   - Phase 3 (Month 2): Reservations and commitments',
        '   - Phase 4 (Month 3): Architecture changes and migrations',
        '5. For each phase:',
        '   - List specific actions',
        '   - Estimated savings',
        '   - Implementation effort',
        '   - Required approvals',
        '   - Dependencies',
        '   - Timeline',
        '6. Calculate cumulative savings over time',
        '7. Create implementation checklist for each recommendation',
        '8. Identify required resources and stakeholders',
        '9. Calculate ROI and payback period',
        '10. Generate detailed roadmap document with Gantt chart',
        '11. Include risk mitigation strategies',
        '12. Define success metrics and tracking'
      ],
      outputFormat: 'JSON object with optimization roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['totalProjectedSavings', 'savingsPercentage', 'phases', 'quickWins', 'priorityRecommendations', 'roadmapPath', 'artifacts'],
      properties: {
        totalProjectedSavings: { type: 'number' },
        savingsPercentage: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              timeline: { type: 'string' },
              savings: { type: 'number' },
              actions: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' },
              dependencies: { type: 'array' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              savings: { type: 'number' },
              effort: { type: 'string' },
              risk: { type: 'string' }
            }
          }
        },
        priorityRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendation: { type: 'string' },
              savings: { type: 'number' },
              priorityScore: { type: 'number' },
              phase: { type: 'number' }
            }
          }
        },
        estimatedImplementationTime: { type: 'string' },
        roi: { type: 'number' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'roadmap']
}));

// Phase 12: Implement Quick Wins
export const implementQuickWinsTask = defineTask('implement-quick-wins', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Implement Quick Win Optimizations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Automation Engineer',
      task: 'Implement quick win cost optimizations with automated remediation',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        quickWins: args.quickWins,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review quick win actions for safety:',
        '   - Verify resources are safe to modify',
        '   - Check for dependencies',
        '   - Confirm resources are not in use',
        '2. Implement quick wins in order of priority:',
        '   - Terminate stopped/idle instances',
        '   - Delete unattached volumes',
        '   - Delete old snapshots (>90 days)',
        '   - Release unused elastic IPs',
        '   - Remove idle load balancers',
        '   - Implement storage lifecycle policies',
        '   - Schedule dev/test resources for shutdown',
        '3. For each action:',
        '   - Log action being taken',
        '   - Execute via cloud API/CLI',
        '   - Verify successful execution',
        '   - Record actual savings',
        '   - Handle errors gracefully',
        '4. Create backup/rollback plan:',
        '   - Take snapshots before deletion (where applicable)',
        '   - Document rollback procedures',
        '5. Track implementation progress:',
        '   - Count attempted optimizations',
        '   - Count successful optimizations',
        '   - Count failed optimizations',
        '   - Calculate actual savings achieved',
        '6. Validate cost impact:',
        '   - Wait 24 hours for billing data',
        '   - Compare before/after costs',
        '7. Document all changes made',
        '8. Generate implementation summary report',
        '9. Create monitoring to prevent re-occurrence of waste',
        '10. Provide recommendations for ongoing optimization'
      ],
      outputFormat: 'JSON object with implementation results'
    },
    outputSchema: {
      type: 'object',
      required: ['attemptedCount', 'implementedCount', 'failedCount', 'actualSavings', 'implementations', 'artifacts'],
      properties: {
        attemptedCount: { type: 'number' },
        implementedCount: { type: 'number' },
        failedCount: { type: 'number' },
        actualSavings: { type: 'number' },
        implementations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              resourceId: { type: 'string' },
              status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
              savings: { type: 'number' },
              error: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        rollbackPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'implementation']
}));

// Phase 13: FinOps Governance
export const finopsGovernanceTask = defineTask('finops-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: FinOps Governance and Policies - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Governance Lead',
      task: 'Establish FinOps governance framework, policies, and guardrails',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        departments: args.departments,
        complianceRequirements: args.complianceRequirements,
        budgetLimit: args.budgetLimit,
        costAllocation: args.costAllocation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish FinOps team structure:',
        '   - Define roles: FinOps Lead, Cloud Architects, Engineering Leads',
        '   - Set up FinOps working group',
        '   - Define RACI matrix for cost decisions',
        '2. Create cloud governance policies:',
        '   - Resource naming conventions',
        '   - Mandatory tagging policies',
        '   - Approved instance types and sizes',
        '   - Approved regions',
        '   - Reservation approval process',
        '   - Budget allocation and approval workflows',
        '3. Implement technical guardrails:',
        '   - AWS: Service Control Policies (SCPs)',
        '   - Azure: Azure Policy',
        '   - GCP: Organization Policies',
        '   - Prevent expensive instance types in non-prod',
        '   - Require approval for reserved instance purchases',
        '   - Block public S3 buckets (security and cost)',
        '   - Enforce encryption (compliance)',
        '4. Establish cost optimization KPIs:',
        '   - Cost per customer/user',
        '   - Cost per transaction',
        '   - Unit cost trends',
        '   - Waste percentage',
        '   - Tag compliance percentage',
        '   - Budget variance',
        '5. Create cost review cadence:',
        '   - Weekly team cost reviews',
        '   - Monthly executive cost reviews',
        '   - Quarterly FinOps maturity assessment',
        '6. Implement approval workflows:',
        '   - New project budget requests',
        '   - Reservation purchase approvals',
        '   - Over-budget expenditure approvals',
        '7. Create cost optimization playbooks:',
        '   - Compute optimization playbook',
        '   - Storage optimization playbook',
        '   - Network optimization playbook',
        '8. Establish continuous optimization process:',
        '   - Monthly optimization reviews',
        '   - Automated recommendations',
        '   - Tracking savings realized',
        '9. Define compliance requirements:',
        '   - Regulatory requirements (if any)',
        '   - Audit trail for cost decisions',
        '   - Cost allocation for compliance',
        '10. Generate governance framework document'
      ],
      outputFormat: 'JSON object with governance details'
    },
    outputSchema: {
      type: 'object',
      required: ['policiesCreated', 'guardrailsImplemented', 'complianceScore', 'artifacts'],
      properties: {
        policiesCreated: { type: 'number' },
        guardrailsImplemented: { type: 'number' },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              enforcement: { type: 'string', enum: ['advisory', 'deny', 'enforce'] }
            }
          }
        },
        guardrails: { type: 'array' },
        kpis: { type: 'array', items: { type: 'string' } },
        reviewCadence: {
          type: 'object',
          properties: {
            weekly: { type: 'array' },
            monthly: { type: 'array' },
            quarterly: { type: 'array' }
          }
        },
        complianceScore: { type: 'number', description: 'Compliance score 0-100' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'governance']
}));

// Phase 14: Cost Monitoring
export const costMonitoringTask = defineTask('cost-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Cost Monitoring and Dashboards - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Reporting and Visualization Specialist',
      task: 'Set up comprehensive cost monitoring dashboards and automated reports',
      context: {
        projectName: args.projectName,
        cloudProvider: args.cloudProvider,
        departments: args.departments,
        costDiscovery: args.costDiscovery,
        budgetSetup: args.budgetSetup,
        optimizationRoadmap: args.optimizationRoadmap,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Executive Cost Dashboard:',
        '   - Total monthly cost trend',
        '   - Budget vs actual',
        '   - Cost forecast',
        '   - Savings achieved',
        '   - Top cost drivers',
        '   - Department cost breakdown',
        '2. Create Engineering Cost Dashboard:',
        '   - Cost by service',
        '   - Cost by environment',
        '   - Cost by project/application',
        '   - Resource utilization metrics',
        '   - Optimization recommendations',
        '3. Create Department/Team Dashboards:',
        '   - Team-specific costs',
        '   - Budget tracking',
        '   - Cost trends',
        '   - Showback reports',
        '4. Implement dashboard technology:',
        '   - AWS: CloudWatch Dashboards, QuickSight',
        '   - Azure: Azure Dashboards, Power BI',
        '   - GCP: Cloud Monitoring, Data Studio',
        '   - Third-party: Grafana, Tableau',
        '5. Set up automated cost reports:',
        '   - Daily cost summary email',
        '   - Weekly cost reports to teams',
        '   - Monthly cost reports to executives',
        '   - Quarterly FinOps review reports',
        '6. Create anomaly alert reports:',
        '   - Unusual cost spikes',
        '   - Budget overruns',
        '   - New resource creation',
        '7. Implement cost attribution views:',
        '   - Cost by tag',
        '   - Untagged resource costs',
        '   - Cross-charge/chargeback reports',
        '8. Set up savings tracking:',
        '   - Savings from optimizations',
        '   - Savings vs targets',
        '   - ROI from FinOps initiatives',
        '9. Create compliance reports:',
        '   - Tag compliance',
        '   - Policy compliance',
        '   - Governance metrics',
        '10. Generate dashboard configuration and access documentation'
      ],
      outputFormat: 'JSON object with monitoring setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardsCreated', 'reportsScheduled', 'dashboardsConfigPath', 'artifacts'],
      properties: {
        dashboardsCreated: { type: 'number' },
        reportsScheduled: { type: 'number' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              audience: { type: 'string' },
              url: { type: 'string' },
              refreshFrequency: { type: 'string' }
            }
          }
        },
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              frequency: { type: 'string' },
              recipients: { type: 'array' },
              format: { type: 'string' }
            }
          }
        },
        dashboardsConfigPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'monitoring']
}));

// Phase 15: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Final Cost Optimization Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Executive Advisor',
      task: 'Generate comprehensive final assessment and executive summary',
      context: {
        projectName: args.projectName,
        totalCurrentCost: args.totalCurrentCost,
        targetSavings: args.targetSavings,
        wasteAnalysis: args.wasteAnalysis,
        rightsizingAnalysis: args.rightsizingAnalysis,
        optimizations: args.optimizations,
        optimizationRoadmap: args.optimizationRoadmap,
        costAllocation: args.costAllocation,
        budgetSetup: args.budgetSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate total projected savings:',
        '   - Sum all optimization opportunities',
        '   - Calculate as percentage of current cost',
        '   - Calculate annual savings',
        '   - Compare to target savings',
        '2. Break down savings by category:',
        '   - Waste elimination',
        '   - Rightsizing',
        '   - Reservations/commitments',
        '   - Storage optimization',
        '   - Networking optimization',
        '   - Database optimization',
        '   - Serverless optimization',
        '3. Assess FinOps maturity:',
        '   - Cost visibility: 0-10',
        '   - Optimization capability: 0-10',
        '   - Governance and controls: 0-10',
        '   - Culture and accountability: 0-10',
        '   - Overall maturity level: Crawl/Walk/Run',
        '4. Prioritize top 20 recommendations:',
        '   - Rank by impact, effort, risk',
        '   - Include savings estimate',
        '   - Include implementation timeline',
        '5. Generate executive summary:',
        '   - Current state overview',
        '   - Key findings and insights',
        '   - Total savings opportunity',
        '   - Implementation approach',
        '   - Expected outcomes',
        '   - Risks and mitigation',
        '   - Next steps and timeline',
        '6. Create detailed optimization report:',
        '   - All findings and recommendations',
        '   - Supporting data and charts',
        '   - Implementation roadmap',
        '   - Governance framework',
        '   - Monitoring and tracking plan',
        '7. Calculate ROI metrics:',
        '   - Savings vs FinOps investment',
        '   - Payback period',
        '   - 3-year projected savings',
        '8. Define success criteria:',
        '   - Cost reduction targets',
        '   - Tag compliance targets',
        '   - Budget adherence targets',
        '   - Optimization cycle frequency',
        '9. Provide next steps and recommendations',
        '10. Generate professional executive summary and detailed report'
      ],
      outputFormat: 'JSON object with final assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['totalProjectedSavings', 'savingsPercentage', 'topRecommendations', 'nextSteps', 'executiveSummaryPath', 'detailedReportPath', 'artifacts'],
      properties: {
        totalProjectedSavings: { type: 'number' },
        annualProjectedSavings: { type: 'number' },
        savingsPercentage: { type: 'number' },
        reservationSavings: { type: 'number' },
        targetAchieved: { type: 'boolean' },
        savingsByCategory: {
          type: 'object',
          properties: {
            waste: { type: 'number' },
            rightsizing: { type: 'number' },
            reservations: { type: 'number' },
            storage: { type: 'number' },
            networking: { type: 'number' },
            databases: { type: 'number' },
            serverless: { type: 'number' }
          }
        },
        finopsMaturity: {
          type: 'object',
          properties: {
            visibility: { type: 'number' },
            optimization: { type: 'number' },
            governance: { type: 'number' },
            culture: { type: 'number' },
            overallScore: { type: 'number' },
            maturityLevel: { type: 'string', enum: ['Crawl', 'Walk', 'Run'] }
          }
        },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendation: { type: 'string' },
              category: { type: 'string' },
              savings: { type: 'number' },
              effort: { type: 'string' },
              risk: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        roi: {
          type: 'object',
          properties: {
            investmentRequired: { type: 'number' },
            firstYearSavings: { type: 'number' },
            threeYearSavings: { type: 'number' },
            paybackMonths: { type: 'number' }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        executiveSummaryPath: { type: 'string' },
        detailedReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cost-optimization', 'assessment']
}));
