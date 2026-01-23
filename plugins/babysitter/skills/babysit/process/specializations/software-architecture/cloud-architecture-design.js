/**
 * @process specializations/software-architecture/cloud-architecture-design
 * @description Cloud-native architecture design process with cloud provider selection, compute/data/network design, security planning, HA design, and cost optimization
 * @inputs { projectName: string, requirements: object, cloudProviders?: string[], targetQuality?: number }
 * @outputs { success: boolean, architecture: object, cost: object, security: object, iac: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    requirements,
    cloudProviders = ['AWS', 'Azure', 'GCP'],
    targetQuality = 85
  } = inputs;

  const results = {
    processSlug: 'cloud-architecture-design',
    category: 'software-architecture',
    projectName,
    phases: []
  };

  // Phase 1: Define Cloud Strategy
  ctx.log('Phase 1: Defining cloud strategy...');
  const strategyResult = await ctx.task(defineCloudStrategyTask, {
    projectName,
    requirements,
    cloudProviders
  });
  results.phases.push({ phase: 1, name: 'Cloud Strategy', result: strategyResult });

  await ctx.breakpoint({
    question: 'Review cloud strategy and approach. Proceed with provider selection?',
    title: 'Cloud Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: strategyResult,
      files: [{ path: `artifacts/cloud-strategy.md`, format: 'markdown' }]
    }
  });

  // Phase 2: Select Cloud Provider
  ctx.log('Phase 2: Selecting cloud provider...');
  const providerResult = await ctx.task(selectCloudProviderTask, {
    projectName,
    requirements,
    strategy: strategyResult,
    candidates: cloudProviders
  });
  results.phases.push({ phase: 2, name: 'Provider Selection', result: providerResult });
  results.selectedProvider = providerResult.selectedProvider;

  await ctx.breakpoint({
    question: `Selected: ${providerResult.selectedProvider}. Proceed with architecture design?`,
    title: 'Provider Selection Review',
    context: {
      runId: ctx.runId,
      provider: providerResult,
      files: [{ path: `artifacts/provider-selection.md`, format: 'markdown' }]
    }
  });

  // Phase 3: Parallel Architecture Design (Compute, Data, Network)
  ctx.log('Phase 3: Designing architecture components in parallel...');
  const [computeResult, dataResult, networkResult] = await ctx.parallel.all([
    ctx.task(designComputeArchitectureTask, {
      projectName,
      requirements,
      provider: providerResult.selectedProvider,
      strategy: strategyResult
    }),
    ctx.task(designDataArchitectureTask, {
      projectName,
      requirements,
      provider: providerResult.selectedProvider,
      strategy: strategyResult
    }),
    ctx.task(designNetworkArchitectureTask, {
      projectName,
      requirements,
      provider: providerResult.selectedProvider,
      strategy: strategyResult
    })
  ]);

  results.phases.push({ phase: 3, name: 'Architecture Design', result: {
    compute: computeResult,
    data: dataResult,
    network: networkResult
  }});

  await ctx.breakpoint({
    question: 'Review compute, data, and network architecture. Proceed with security and compliance?',
    title: 'Architecture Components Review',
    context: {
      runId: ctx.runId,
      architecture: { compute: computeResult, data: dataResult, network: networkResult },
      files: [
        { path: `artifacts/compute-architecture.md`, format: 'markdown' },
        { path: `artifacts/data-architecture.md`, format: 'markdown' },
        { path: `artifacts/network-architecture.md`, format: 'markdown' }
      ]
    }
  });

  // Phase 4: Security and Compliance Planning
  ctx.log('Phase 4: Planning security and compliance...');
  const securityResult = await ctx.task(planSecurityComplianceTask, {
    projectName,
    requirements,
    provider: providerResult.selectedProvider,
    compute: computeResult,
    data: dataResult,
    network: networkResult
  });
  results.phases.push({ phase: 4, name: 'Security & Compliance', result: securityResult });
  results.security = securityResult;

  await ctx.breakpoint({
    question: 'Review security and compliance design. Proceed with HA design?',
    title: 'Security Review',
    context: {
      runId: ctx.runId,
      security: securityResult,
      files: [{ path: `artifacts/security-design.md`, format: 'markdown' }]
    }
  });

  // Phase 5: High Availability Design
  ctx.log('Phase 5: Designing high availability...');
  const haResult = await ctx.task(designHighAvailabilityTask, {
    projectName,
    requirements,
    provider: providerResult.selectedProvider,
    compute: computeResult,
    data: dataResult,
    network: networkResult,
    security: securityResult
  });
  results.phases.push({ phase: 5, name: 'High Availability', result: haResult });
  results.highAvailability = haResult;

  // Phase 6: Cost Optimization
  ctx.log('Phase 6: Optimizing costs...');
  const costResult = await ctx.task(optimizeCostsTask, {
    projectName,
    requirements,
    provider: providerResult.selectedProvider,
    compute: computeResult,
    data: dataResult,
    network: networkResult,
    security: securityResult,
    ha: haResult
  });
  results.phases.push({ phase: 6, name: 'Cost Optimization', result: costResult });
  results.cost = costResult;

  await ctx.breakpoint({
    question: 'Review HA design and cost estimates. Proceed with IaC generation?',
    title: 'HA & Cost Review',
    context: {
      runId: ctx.runId,
      ha: haResult,
      cost: costResult,
      files: [
        { path: `artifacts/ha-design.md`, format: 'markdown' },
        { path: `artifacts/cost-estimate.md`, format: 'markdown' }
      ]
    }
  });

  // Phase 7: Infrastructure as Code Generation
  ctx.log('Phase 7: Creating Infrastructure as Code...');
  const iacResult = await ctx.task(createInfrastructureAsCodeTask, {
    projectName,
    provider: providerResult.selectedProvider,
    compute: computeResult,
    data: dataResult,
    network: networkResult,
    security: securityResult,
    ha: haResult
  });
  results.phases.push({ phase: 7, name: 'Infrastructure as Code', result: iacResult });
  results.iac = iacResult;

  // Phase 8: Quality Validation
  ctx.log('Phase 8: Validating architecture quality...');
  const qualityResult = await ctx.task(validateArchitectureQualityTask, {
    projectName,
    requirements,
    targetQuality,
    architecture: {
      strategy: strategyResult,
      provider: providerResult,
      compute: computeResult,
      data: dataResult,
      network: networkResult,
      security: securityResult,
      ha: haResult,
      cost: costResult,
      iac: iacResult
    }
  });
  results.phases.push({ phase: 8, name: 'Quality Validation', result: qualityResult });
  results.qualityScore = qualityResult.score;

  // Final Review
  await ctx.breakpoint({
    question: `Architecture quality: ${qualityResult.score}/${targetQuality}. Approve final architecture?`,
    title: 'Final Architecture Review',
    context: {
      runId: ctx.runId,
      quality: qualityResult,
      summary: results,
      files: [
        { path: `artifacts/cloud-architecture-diagram.md`, format: 'markdown' },
        { path: `artifacts/final-architecture-report.md`, format: 'markdown' }
      ]
    }
  });

  return {
    success: qualityResult.score >= targetQuality,
    processSlug: 'cloud-architecture-design',
    category: 'software-architecture',
    projectName,
    architecture: {
      strategy: strategyResult,
      provider: providerResult.selectedProvider,
      compute: computeResult,
      data: dataResult,
      network: networkResult,
      security: securityResult,
      highAvailability: haResult
    },
    cost: costResult,
    iac: iacResult,
    qualityScore: qualityResult.score,
    targetQuality,
    phases: results.phases,
    metadata: {
      processId: 'specializations/software-architecture/cloud-architecture-design',
      specializationSlug: 'software-architecture',
      timestamp: ctx.now()
    }
  };
}

/**
 * Phase 1: Define Cloud Strategy
 */
export const defineCloudStrategyTask = defineTask('define-cloud-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Cloud Strategy: ${args.projectName}`,
  agent: {
    name: 'cloud-strategist',
    prompt: {
      role: 'cloud architect strategist',
      task: 'Define comprehensive cloud strategy including approach, migration patterns, and architectural principles',
      context: args,
      instructions: [
        'Analyze project requirements and constraints',
        'Define cloud adoption strategy (greenfield, brownfield, hybrid)',
        'Identify migration patterns (lift-and-shift, re-platform, re-architect)',
        'Define architectural principles (cloud-native, 12-factor, etc.)',
        'Establish design patterns (microservices, serverless, containers)',
        'Document compliance and regulatory requirements',
        'Define multi-region and disaster recovery strategy',
        'Create cloud strategy document'
      ],
      outputFormat: 'JSON with approach, patterns, principles, compliance, drStrategy, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'patterns', 'principles', 'summary'],
      properties: {
        approach: { type: 'string', enum: ['greenfield', 'brownfield', 'hybrid', 'multi-cloud'] },
        patterns: { type: 'array', items: { type: 'string' } },
        principles: { type: 'array', items: { type: 'string' } },
        compliance: { type: 'array', items: { type: 'string' } },
        drStrategy: { type: 'string' },
        multiRegion: { type: 'boolean' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'strategy', 'phase-1']
}));

/**
 * Phase 2: Select Cloud Provider
 */
export const selectCloudProviderTask = defineTask('select-cloud-provider', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Cloud Provider: ${args.projectName}`,
  agent: {
    name: 'cloud-provider-evaluator',
    prompt: {
      role: 'cloud provider evaluation specialist',
      task: 'Evaluate and select optimal cloud provider based on requirements',
      context: args,
      instructions: [
        'Evaluate candidate providers against requirements',
        'Compare service offerings (compute, database, storage, networking)',
        'Assess regional availability and latency',
        'Evaluate pricing models and cost implications',
        'Review compliance certifications',
        'Assess ecosystem maturity and tooling',
        'Consider team expertise and learning curve',
        'Score providers using weighted criteria',
        'Recommend primary provider with justification',
        'Document alternatives and trade-offs'
      ],
      outputFormat: 'JSON with selectedProvider, scoring, justification, alternatives, tradeoffs'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedProvider', 'justification'],
      properties: {
        selectedProvider: { type: 'string', enum: ['AWS', 'Azure', 'GCP', 'Multi-Cloud'] },
        scoring: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        justification: { type: 'string' },
        alternatives: { type: 'array', items: { type: 'string' } },
        tradeoffs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'provider-selection', 'phase-2']
}));

/**
 * Phase 3A: Design Compute Architecture
 */
export const designComputeArchitectureTask = defineTask('design-compute-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Compute Architecture: ${args.projectName}`,
  agent: {
    name: 'compute-architect',
    prompt: {
      role: 'compute and container architecture specialist',
      task: 'Design compute architecture using provider-specific services',
      context: args,
      instructions: [
        'Select compute services (VMs, containers, serverless, Kubernetes)',
        'Design container orchestration strategy (ECS, EKS, AKS, GKE)',
        'Plan serverless architecture (Lambda, Azure Functions, Cloud Functions)',
        'Define auto-scaling policies and triggers',
        'Design compute instance types and sizing',
        'Plan deployment strategies (blue-green, canary, rolling)',
        'Design service mesh architecture if applicable',
        'Document compute service selection matrix',
        'Create compute architecture diagram'
      ],
      outputFormat: 'JSON with services, orchestration, serverless, autoScaling, deployment, diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'summary'],
      properties: {
        services: { type: 'array', items: { type: 'string' } },
        orchestration: { type: 'string' },
        serverless: { type: 'boolean' },
        autoScaling: { type: 'object' },
        deployment: { type: 'string' },
        instanceTypes: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'compute', 'phase-3']
}));

/**
 * Phase 3B: Design Data Architecture
 */
export const designDataArchitectureTask = defineTask('design-data-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Data Architecture: ${args.projectName}`,
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'data and storage architecture specialist',
      task: 'Design data architecture including databases, storage, and data flow',
      context: args,
      instructions: [
        'Select database services (RDS, DynamoDB, Aurora, Cosmos DB, Cloud SQL)',
        'Design data storage strategy (S3, Blob Storage, Cloud Storage)',
        'Plan caching layer (ElastiCache, Redis, Memcached)',
        'Design data replication and backup strategy',
        'Plan data partitioning and sharding',
        'Design data pipeline and ETL processes',
        'Plan analytics and data warehouse (Redshift, BigQuery, Synapse)',
        'Document data governance and compliance',
        'Create data architecture diagram'
      ],
      outputFormat: 'JSON with databases, storage, caching, replication, pipelines, analytics, diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['databases', 'storage', 'summary'],
      properties: {
        databases: { type: 'array', items: { type: 'string' } },
        storage: { type: 'object' },
        caching: { type: 'string' },
        replication: { type: 'object' },
        pipelines: { type: 'array', items: { type: 'string' } },
        analytics: { type: 'string' },
        backup: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'data', 'phase-3']
}));

/**
 * Phase 3C: Design Network Architecture
 */
export const designNetworkArchitectureTask = defineTask('design-network-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Network Architecture: ${args.projectName}`,
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'cloud network architecture specialist',
      task: 'Design network architecture including VPC, subnets, routing, and connectivity',
      context: args,
      instructions: [
        'Design VPC/VNet architecture with CIDR planning',
        'Plan subnet strategy (public, private, database tiers)',
        'Design routing tables and NAT gateways',
        'Plan load balancing architecture (ALB, NLB, Azure LB)',
        'Design API Gateway and ingress controllers',
        'Plan DNS strategy (Route 53, Azure DNS, Cloud DNS)',
        'Design VPN and Direct Connect/ExpressRoute architecture',
        'Plan network security groups and ACLs',
        'Design CDN integration (CloudFront, Azure CDN, Cloud CDN)',
        'Create network architecture diagram'
      ],
      outputFormat: 'JSON with vpc, subnets, routing, loadBalancing, apiGateway, dns, vpn, cdn, diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['vpc', 'subnets', 'summary'],
      properties: {
        vpc: { type: 'object' },
        subnets: { type: 'array', items: { type: 'object' } },
        routing: { type: 'object' },
        loadBalancing: { type: 'array', items: { type: 'string' } },
        apiGateway: { type: 'string' },
        dns: { type: 'string' },
        vpn: { type: 'object' },
        cdn: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'network', 'phase-3']
}));

/**
 * Phase 4: Plan Security and Compliance
 */
export const planSecurityComplianceTask = defineTask('plan-security-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan Security & Compliance: ${args.projectName}`,
  agent: {
    name: 'security-architect',
    prompt: {
      role: 'cloud security and compliance specialist',
      task: 'Design comprehensive security and compliance architecture',
      context: args,
      instructions: [
        'Design identity and access management (IAM) strategy',
        'Plan authentication and authorization (Cognito, Azure AD, Identity Platform)',
        'Design encryption strategy (data at rest and in transit)',
        'Plan key management (KMS, Key Vault, Cloud KMS)',
        'Design network security (security groups, WAF, DDoS protection)',
        'Plan security monitoring and logging (CloudTrail, Security Center)',
        'Design secrets management (Secrets Manager, Key Vault)',
        'Document compliance requirements (GDPR, HIPAA, SOC2, PCI-DSS)',
        'Plan security incident response',
        'Create security architecture diagram'
      ],
      outputFormat: 'JSON with iam, authentication, encryption, keyManagement, networkSecurity, monitoring, compliance, diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['iam', 'authentication', 'encryption', 'summary'],
      properties: {
        iam: { type: 'object' },
        authentication: { type: 'string' },
        encryption: { type: 'object' },
        keyManagement: { type: 'string' },
        networkSecurity: { type: 'array', items: { type: 'string' } },
        monitoring: { type: 'array', items: { type: 'string' } },
        compliance: { type: 'array', items: { type: 'string' } },
        incidentResponse: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'security', 'phase-4']
}));

/**
 * Phase 5: Design High Availability
 */
export const designHighAvailabilityTask = defineTask('design-high-availability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design High Availability: ${args.projectName}`,
  agent: {
    name: 'ha-architect',
    prompt: {
      role: 'high availability and reliability specialist',
      task: 'Design high availability architecture with fault tolerance and disaster recovery',
      context: args,
      instructions: [
        'Design multi-AZ/multi-zone deployment strategy',
        'Plan regional redundancy and failover',
        'Design auto-scaling and self-healing mechanisms',
        'Plan load balancing and health checks',
        'Design circuit breaker and retry patterns',
        'Plan backup and restore procedures',
        'Design disaster recovery strategy (RPO/RTO)',
        'Plan chaos engineering and resilience testing',
        'Calculate availability SLA targets',
        'Create HA architecture diagram'
      ],
      outputFormat: 'JSON with multiAz, regional, autoScaling, loadBalancing, resilience, backup, dr, sla, diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['multiAz', 'sla', 'summary'],
      properties: {
        multiAz: { type: 'boolean' },
        regional: { type: 'object' },
        autoScaling: { type: 'object' },
        loadBalancing: { type: 'object' },
        resilience: { type: 'array', items: { type: 'string' } },
        backup: { type: 'object' },
        dr: { type: 'object' },
        sla: { type: 'object' },
        rpo: { type: 'string' },
        rto: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'high-availability', 'phase-5']
}));

/**
 * Phase 6: Optimize Costs
 */
export const optimizeCostsTask = defineTask('optimize-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Costs: ${args.projectName}`,
  agent: {
    name: 'cost-optimizer',
    prompt: {
      role: 'cloud cost optimization specialist',
      task: 'Analyze architecture and optimize for cost-effectiveness',
      context: args,
      instructions: [
        'Estimate monthly costs for all components',
        'Identify cost optimization opportunities',
        'Recommend reserved instances/savings plans',
        'Suggest spot instances for non-critical workloads',
        'Plan auto-scaling policies to reduce waste',
        'Identify over-provisioned resources',
        'Recommend appropriate instance/service tiers',
        'Plan cost monitoring and alerting',
        'Calculate TCO (Total Cost of Ownership)',
        'Create cost breakdown and optimization report'
      ],
      outputFormat: 'JSON with estimatedMonthlyCost, breakdown, optimizations, reservations, monitoring, tco'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedMonthlyCost', 'summary'],
      properties: {
        estimatedMonthlyCost: { type: 'number' },
        breakdown: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'object' } },
        reservations: { type: 'array', items: { type: 'string' } },
        spotInstances: { type: 'boolean' },
        monitoring: { type: 'object' },
        tco: { type: 'object' },
        savingsPercentage: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'cost-optimization', 'phase-6']
}));

/**
 * Phase 7: Create Infrastructure as Code
 */
export const createInfrastructureAsCodeTask = defineTask('create-infrastructure-as-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Infrastructure as Code: ${args.projectName}`,
  agent: {
    name: 'iac-engineer',
    prompt: {
      role: 'infrastructure as code specialist',
      task: 'Generate Infrastructure as Code for the complete architecture',
      context: args,
      instructions: [
        'Generate Terraform/CloudFormation/ARM templates',
        'Structure IaC into modules (network, compute, data, security)',
        'Implement variables and parameterization',
        'Create environment-specific configurations (dev, staging, prod)',
        'Add proper tagging and resource naming conventions',
        'Include state management configuration',
        'Generate CI/CD pipeline for IaC deployment',
        'Create documentation and usage instructions',
        'Implement security best practices in IaC',
        'Generate sample tfvars/parameters files'
      ],
      outputFormat: 'JSON with tool, modules, files, variables, environments, pipeline, documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'modules', 'summary'],
      properties: {
        tool: { type: 'string', enum: ['Terraform', 'CloudFormation', 'ARM', 'Pulumi'] },
        modules: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'object' } },
        variables: { type: 'object' },
        environments: { type: 'array', items: { type: 'string' } },
        pipeline: { type: 'object' },
        stateManagement: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'iac', 'phase-7']
}));

/**
 * Phase 8: Validate Architecture Quality
 */
export const validateArchitectureQualityTask = defineTask('validate-architecture-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Architecture Quality: ${args.projectName}`,
  agent: {
    name: 'architecture-quality-validator',
    prompt: {
      role: 'senior cloud architect and quality assessor',
      task: 'Validate cloud architecture quality against best practices and requirements',
      context: args,
      instructions: [
        'Assess architecture against cloud-native principles',
        'Validate security and compliance coverage',
        'Review high availability and disaster recovery design',
        'Assess cost optimization effectiveness',
        'Validate scalability and performance design',
        'Check adherence to well-architected framework',
        'Identify architectural risks and gaps',
        'Review IaC quality and completeness',
        'Score architecture quality 0-100',
        'Provide recommendations for improvement'
      ],
      outputFormat: 'JSON with score, assessment, risks, gaps, recommendations, wellArchitected'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        risks: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        wellArchitected: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cloud-architecture', 'quality-validation', 'phase-8']
}));
