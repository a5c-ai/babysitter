/**
 * @process specializations/devops-sre-platform/kubernetes-setup
 * @description Kubernetes Cluster Setup and Management - Complete workflow for setting up a production-ready
 * Kubernetes cluster with cluster provisioning, networking, storage, security, monitoring, and GitOps configuration.
 * @inputs { projectName: string, cloudProvider?: string, clusterSize?: string, environment?: string, requirements?: object }
 * @outputs { success: boolean, clusterInfo: object, manifests: array, monitoring: object, security: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/kubernetes-setup', {
 *   projectName: 'Production Kubernetes Cluster',
 *   cloudProvider: 'aws',
 *   clusterSize: 'medium',
 *   environment: 'production',
 *   requirements: {
 *     highAvailability: true,
 *     multiAZ: true,
 *     nodeCount: 5,
 *     storageClass: 'gp3',
 *     monitoring: true,
 *     serviceMesh: 'istio'
 *   }
 * });
 *
 * @references
 * - Kubernetes Documentation: https://kubernetes.io/docs/
 * - Kubernetes Patterns: https://k8spatterns.io/
 * - Production Best Practices: https://kubernetes.io/docs/setup/best-practices/
 * - EKS Best Practices: https://aws.github.io/aws-eks-best-practices/
 * - GKE Best Practices: https://cloud.google.com/kubernetes-engine/docs/best-practices
 * - AKS Best Practices: https://learn.microsoft.com/en-us/azure/aks/best-practices
 * - Kubernetes Security: https://kubernetes.io/docs/concepts/security/
 * - Cloud Native Security: https://www.cncf.io/blog/2020/11/18/cloud-native-security-whitepaper/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cloudProvider = 'aws', // 'aws', 'gcp', 'azure', 'on-premise'
    clusterSize = 'medium', // 'small', 'medium', 'large', 'custom'
    environment = 'production', // 'development', 'staging', 'production'
    requirements = {
      highAvailability: true,
      multiAZ: true,
      nodeCount: 5,
      storageClass: 'gp3',
      monitoring: true,
      serviceMesh: false,
      networkPolicy: true,
      rbacEnabled: true,
      secretsEncryption: true,
      backupEnabled: true,
      autoscaling: true,
      logging: true
    },
    kubernetesVersion = '1.28',
    region = 'us-east-1',
    outputDir = 'kubernetes-setup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let clusterInfo = {};
  let manifests = [];
  let monitoring = {};
  let security = {};

  ctx.log('info', `Starting Kubernetes Cluster Setup for ${projectName}`);
  ctx.log('info', `Cloud Provider: ${cloudProvider}, Environment: ${environment}, Size: ${clusterSize}`);

  // ============================================================================
  // PHASE 1: CLUSTER PLANNING AND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning Kubernetes cluster architecture');

  const clusterDesign = await ctx.task(clusterDesignTask, {
    projectName,
    cloudProvider,
    clusterSize,
    environment,
    requirements,
    kubernetesVersion,
    region,
    outputDir
  });

  if (!clusterDesign.success) {
    return {
      success: false,
      error: 'Failed to complete cluster design',
      details: clusterDesign,
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...clusterDesign.artifacts);
  clusterInfo.design = clusterDesign;

  // Quality Gate: Review cluster design
  await ctx.breakpoint({
    question: `Phase 1 Review: Cluster will use ${clusterDesign.nodeCount} nodes across ${clusterDesign.availabilityZones.length} AZs. Estimated cost: $${clusterDesign.estimatedMonthlyCost}/month. Approve design?`,
    title: 'Cluster Design Approval',
    context: {
      runId: ctx.runId,
      clusterDesign,
      files: [{
        path: `${outputDir}/phase1-cluster-design.json`,
        format: 'json',
        content: JSON.stringify(clusterDesign, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 2: CLUSTER PROVISIONING
  // ============================================================================

  ctx.log('info', 'Phase 2: Provisioning Kubernetes cluster');

  const clusterProvisioning = await ctx.task(clusterProvisioningTask, {
    projectName,
    cloudProvider,
    clusterDesign,
    kubernetesVersion,
    region,
    outputDir
  });

  if (!clusterProvisioning.success) {
    return {
      success: false,
      error: 'Failed to provision cluster',
      details: clusterProvisioning,
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...clusterProvisioning.artifacts);
  clusterInfo.cluster = clusterProvisioning;

  ctx.log('info', `Cluster provisioned: ${clusterProvisioning.clusterName}`);
  ctx.log('info', `Cluster endpoint: ${clusterProvisioning.endpoint}`);

  // ============================================================================
  // PHASE 3: NETWORKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring networking (VPC, CNI, Ingress)');

  const [vpcConfig, cniConfig, ingressConfig] = await ctx.parallel.all([
    ctx.task(vpcNetworkingTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    }),
    ctx.task(cniSetupTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    }),
    ctx.task(ingressSetupTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    })
  ]);

  if (!vpcConfig.success || !cniConfig.success || !ingressConfig.success) {
    return {
      success: false,
      error: 'Failed to complete networking setup',
      details: { vpcConfig, cniConfig, ingressConfig },
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...vpcConfig.artifacts, ...cniConfig.artifacts, ...ingressConfig.artifacts);
  manifests.push(...cniConfig.manifests, ...ingressConfig.manifests);
  clusterInfo.networking = { vpcConfig, cniConfig, ingressConfig };

  // Quality Gate: Network configuration review
  await ctx.breakpoint({
    question: `Phase 3 Review: Networking configured with ${cniConfig.cniPlugin} CNI and ${ingressConfig.ingressController} ingress controller. Proceed?`,
    title: 'Networking Configuration Review',
    context: {
      runId: ctx.runId,
      networking: { vpcConfig, cniConfig, ingressConfig },
      files: [{
        path: `${outputDir}/phase3-networking-config.json`,
        format: 'json',
        content: JSON.stringify({ vpcConfig, cniConfig, ingressConfig }, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 4: STORAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring storage (CSI drivers, StorageClasses)');

  const storageConfig = await ctx.task(storageSetupTask, {
    projectName,
    cloudProvider,
    clusterInfo: clusterProvisioning,
    requirements,
    outputDir
  });

  if (!storageConfig.success) {
    return {
      success: false,
      error: 'Failed to configure storage',
      details: storageConfig,
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...storageConfig.artifacts);
  manifests.push(...storageConfig.manifests);
  clusterInfo.storage = storageConfig;

  // ============================================================================
  // PHASE 5: SECURITY HARDENING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing security controls');

  const [rbacConfig, podSecurityConfig, secretsConfig, networkPolicyConfig] = await ctx.parallel.all([
    ctx.task(rbacSetupTask, {
      projectName,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    }),
    ctx.task(podSecuritySetupTask, {
      projectName,
      clusterInfo: clusterProvisioning,
      kubernetesVersion,
      outputDir
    }),
    ctx.task(secretsEncryptionTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    }),
    ctx.task(networkPolicySetupTask, {
      projectName,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    })
  ]);

  if (!rbacConfig.success || !podSecurityConfig.success || !secretsConfig.success || !networkPolicyConfig.success) {
    return {
      success: false,
      error: 'Failed to complete security hardening',
      details: { rbacConfig, podSecurityConfig, secretsConfig, networkPolicyConfig },
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(
    ...rbacConfig.artifacts,
    ...podSecurityConfig.artifacts,
    ...secretsConfig.artifacts,
    ...networkPolicyConfig.artifacts
  );
  manifests.push(
    ...rbacConfig.manifests,
    ...podSecurityConfig.manifests,
    ...secretsConfig.manifests,
    ...networkPolicyConfig.manifests
  );
  security = { rbacConfig, podSecurityConfig, secretsConfig, networkPolicyConfig };

  // Quality Gate: Security review
  const securityScore = (rbacConfig.score + podSecurityConfig.score + secretsConfig.score + networkPolicyConfig.score) / 4;

  await ctx.breakpoint({
    question: `Phase 5 Review: Security hardening complete with overall score: ${securityScore.toFixed(1)}/100. RBAC, Pod Security, Secrets Encryption, and Network Policies configured. Approve?`,
    title: 'Security Configuration Review',
    context: {
      runId: ctx.runId,
      securityScore,
      security,
      files: [{
        path: `${outputDir}/phase5-security-config.json`,
        format: 'json',
        content: JSON.stringify(security, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 6: MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up monitoring and observability stack');

  const [metricsStack, loggingStack, tracingStack] = await ctx.parallel.all([
    ctx.task(metricsSetupTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    }),
    ctx.task(loggingSetupTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    }),
    ctx.task(tracingSetupTask, {
      projectName,
      cloudProvider,
      clusterInfo: clusterProvisioning,
      requirements,
      outputDir
    })
  ]);

  if (!metricsStack.success || !loggingStack.success) {
    return {
      success: false,
      error: 'Failed to set up monitoring stack',
      details: { metricsStack, loggingStack, tracingStack },
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...metricsStack.artifacts, ...loggingStack.artifacts, ...tracingStack.artifacts);
  manifests.push(...metricsStack.manifests, ...loggingStack.manifests, ...tracingStack.manifests);
  monitoring = { metricsStack, loggingStack, tracingStack };

  ctx.log('info', `Monitoring configured: Metrics=${metricsStack.tool}, Logging=${loggingStack.tool}, Tracing=${tracingStack.tool}`);

  // ============================================================================
  // PHASE 7: CLUSTER AUTOSCALING
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring cluster and pod autoscaling');

  const autoscalingConfig = await ctx.task(autoscalingSetupTask, {
    projectName,
    cloudProvider,
    clusterInfo: clusterProvisioning,
    requirements,
    outputDir
  });

  if (!autoscalingConfig.success) {
    return {
      success: false,
      error: 'Failed to configure autoscaling',
      details: autoscalingConfig,
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...autoscalingConfig.artifacts);
  manifests.push(...autoscalingConfig.manifests);
  clusterInfo.autoscaling = autoscalingConfig;

  // ============================================================================
  // PHASE 8: BACKUP AND DISASTER RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up backup and disaster recovery');

  const backupConfig = await ctx.task(backupSetupTask, {
    projectName,
    cloudProvider,
    clusterInfo: clusterProvisioning,
    requirements,
    outputDir
  });

  if (!backupConfig.success) {
    return {
      success: false,
      error: 'Failed to configure backup',
      details: backupConfig,
      metadata: {
        processId: 'specializations/devops-sre-platform/kubernetes-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...backupConfig.artifacts);
  manifests.push(...backupConfig.manifests);
  clusterInfo.backup = backupConfig;

  // ============================================================================
  // PHASE 9: GITOPS SETUP (OPTIONAL)
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up GitOps workflow');

  const gitopsConfig = await ctx.task(gitopsSetupTask, {
    projectName,
    clusterInfo: clusterProvisioning,
    requirements,
    outputDir
  });

  if (!gitopsConfig.success) {
    ctx.log('warn', 'GitOps setup failed, but this is optional - continuing');
  } else {
    artifacts.push(...gitopsConfig.artifacts);
    manifests.push(...gitopsConfig.manifests);
    clusterInfo.gitops = gitopsConfig;
    ctx.log('info', `GitOps configured with ${gitopsConfig.tool}`);
  }

  // ============================================================================
  // PHASE 10: SERVICE MESH (OPTIONAL)
  // ============================================================================

  if (requirements.serviceMesh) {
    ctx.log('info', 'Phase 10: Installing and configuring service mesh');

    const serviceMeshConfig = await ctx.task(serviceMeshSetupTask, {
      projectName,
      clusterInfo: clusterProvisioning,
      serviceMeshType: requirements.serviceMesh,
      outputDir
    });

    if (serviceMeshConfig.success) {
      artifacts.push(...serviceMeshConfig.artifacts);
      manifests.push(...serviceMeshConfig.manifests);
      clusterInfo.serviceMesh = serviceMeshConfig;
      ctx.log('info', `Service mesh ${requirements.serviceMesh} installed successfully`);
    } else {
      ctx.log('warn', 'Service mesh setup failed, but continuing');
    }
  }

  // ============================================================================
  // PHASE 11: CLUSTER VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating cluster setup and running tests');

  const clusterValidation = await ctx.task(clusterValidationTask, {
    projectName,
    clusterInfo: clusterProvisioning,
    requirements,
    outputDir
  });

  if (!clusterValidation.success) {
    ctx.log('error', 'Cluster validation failed');

    await ctx.breakpoint({
      question: `Phase 11 Alert: Cluster validation failed with ${clusterValidation.failedTests} failed tests. Review issues before proceeding?`,
      title: 'Cluster Validation Failed',
      context: {
        runId: ctx.runId,
        validation: clusterValidation,
        files: [{
          path: `${outputDir}/phase11-validation-report.json`,
          format: 'json',
          content: JSON.stringify(clusterValidation, null, 2)
        }]
      }
    });
  }

  artifacts.push(...clusterValidation.artifacts);

  // ============================================================================
  // PHASE 12: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating documentation and operational runbooks');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    clusterInfo,
    manifests,
    monitoring,
    security,
    cloudProvider,
    outputDir
  });

  if (!documentation.success) {
    ctx.log('warn', 'Documentation generation failed, but continuing');
  } else {
    artifacts.push(...documentation.artifacts);
  }

  // ============================================================================
  // FINAL QUALITY GATE AND HANDOFF
  // ============================================================================

  const overallScore = (
    (clusterDesign.designScore || 0) +
    (clusterValidation.validationScore || 0) +
    securityScore +
    (metricsStack.score || 0) +
    (loggingStack.score || 0)
  ) / 5;

  const qualityThreshold = environment === 'production' ? 85 : 75;

  ctx.log('info', `Overall cluster quality score: ${overallScore.toFixed(1)}/100`);

  await ctx.breakpoint({
    question: `Final Review: Kubernetes cluster ${clusterProvisioning.clusterName} is ready. Overall quality score: ${overallScore.toFixed(1)}/100 (threshold: ${qualityThreshold}). Ready to handoff?`,
    title: 'Final Cluster Review and Handoff',
    context: {
      runId: ctx.runId,
      overallScore,
      qualityThreshold,
      clusterInfo,
      monitoring,
      security,
      files: [
        {
          path: `${outputDir}/cluster-summary.json`,
          format: 'json',
          content: JSON.stringify({
            clusterInfo,
            monitoring,
            security,
            manifests: manifests.length,
            artifacts: artifacts.length
          }, null, 2)
        },
        {
          path: `${outputDir}/operational-runbook.md`,
          format: 'markdown',
          content: documentation.runbook || 'Runbook generation pending'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Kubernetes cluster setup completed in ${duration}ms`);
  ctx.log('info', `Cluster: ${clusterProvisioning.clusterName}`);
  ctx.log('info', `Endpoint: ${clusterProvisioning.endpoint}`);
  ctx.log('info', `Node Count: ${clusterProvisioning.nodeCount}`);
  ctx.log('info', `Quality Score: ${overallScore.toFixed(1)}/100`);

  return {
    success: true,
    projectName,
    clusterInfo,
    manifests,
    monitoring,
    security,
    artifacts,
    overallScore,
    qualityThreshold,
    summary: {
      clusterName: clusterProvisioning.clusterName,
      endpoint: clusterProvisioning.endpoint,
      kubernetesVersion,
      nodeCount: clusterProvisioning.nodeCount,
      cloudProvider,
      region,
      environment,
      estimatedMonthlyCost: clusterDesign.estimatedMonthlyCost,
      manifestsGenerated: manifests.length,
      artifactsCreated: artifacts.length,
      qualityScore: overallScore,
      securityScore,
      monitoringEnabled: requirements.monitoring,
      backupEnabled: requirements.backupEnabled,
      gitopsEnabled: gitopsConfig?.success || false,
      serviceMeshEnabled: requirements.serviceMesh ? true : false
    },
    metadata: {
      processId: 'specializations/devops-sre-platform/kubernetes-setup',
      processSlug: 'kubernetes-setup',
      category: 'container-orchestration',
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

export const clusterDesignTask = defineTask('cluster-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Kubernetes Cluster: ${args.projectName}`,
  agent: {
    name: 'kubernetes-architect',
    prompt: {
      role: 'Senior Kubernetes Architect specialized in production cluster design',
      task: 'Design a production-ready Kubernetes cluster architecture',
      context: args,
      instructions: [
        'Analyze requirements for cluster sizing and configuration',
        `Design cluster for ${args.cloudProvider} (EKS/GKE/AKS/on-premise)`,
        'Calculate node count and instance types based on workload',
        'Design multi-AZ/multi-zone architecture for high availability',
        'Plan node groups (system, application, monitoring)',
        'Design network architecture (VPC, subnets, CIDR ranges)',
        'Plan control plane configuration',
        'Select Kubernetes version and upgrade strategy',
        'Design tagging and resource naming conventions',
        'Estimate monthly infrastructure costs',
        'Create cluster architecture diagram',
        'Document design decisions and rationale'
      ],
      outputFormat: 'JSON with success, designScore, nodeCount, instanceTypes, availabilityZones, estimatedMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'designScore', 'nodeCount', 'availabilityZones', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        designScore: { type: 'number', minimum: 0, maximum: 100 },
        nodeCount: { type: 'number' },
        instanceTypes: { type: 'array', items: { type: 'string' } },
        availabilityZones: { type: 'array', items: { type: 'string' } },
        controlPlaneConfig: { type: 'object' },
        nodeGroups: { type: 'array' },
        networkDesign: { type: 'object' },
        estimatedMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'cluster-design', 'architecture', args.cloudProvider]
}));

export const clusterProvisioningTask = defineTask('cluster-provisioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Provision Kubernetes Cluster: ${args.projectName}`,
  agent: {
    name: 'kubernetes-provisioner',
    prompt: {
      role: 'DevOps Engineer specialized in Kubernetes cluster provisioning',
      task: 'Provision Kubernetes cluster using Infrastructure as Code',
      context: args,
      instructions: [
        'Generate IaC for cluster provisioning (Terraform/CloudFormation)',
        `Create ${args.cloudProvider}-specific cluster configuration`,
        'Configure control plane (API server, scheduler, controller manager)',
        'Provision worker nodes in multiple availability zones',
        'Configure cluster networking and security groups',
        'Set up IAM roles and service accounts',
        'Configure cluster add-ons and extensions',
        'Enable cluster logging and audit logs',
        'Configure kubeconfig for cluster access',
        'Validate cluster is healthy and reachable',
        'Tag resources for cost allocation',
        'Generate cluster connection details'
      ],
      outputFormat: 'JSON with success, clusterName, endpoint, nodeCount, clusterVersion, kubeconfig, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'clusterName', 'endpoint', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        clusterName: { type: 'string' },
        endpoint: { type: 'string' },
        clusterVersion: { type: 'string' },
        nodeCount: { type: 'number' },
        clusterArn: { type: 'string' },
        vpcId: { type: 'string' },
        securityGroups: { type: 'array' },
        kubeconfig: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'provisioning', 'iac', args.cloudProvider]
}));

export const vpcNetworkingTask = defineTask('vpc-networking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure VPC Networking: ${args.projectName}`,
  agent: {
    name: 'network-engineer',
    prompt: {
      role: 'Network Engineer specialized in Kubernetes networking',
      task: 'Configure VPC networking for Kubernetes cluster',
      context: args,
      instructions: [
        'Design VPC CIDR blocks for pods and services',
        'Create public and private subnets across AZs',
        'Configure NAT gateways for private subnet internet access',
        'Set up route tables and internet gateway',
        'Configure security groups for control plane and nodes',
        'Enable VPC flow logs for network monitoring',
        'Configure DNS resolution (CoreDNS)',
        'Set up load balancer subnets',
        'Configure VPC peering if required',
        'Document network architecture and IP ranges'
      ],
      outputFormat: 'JSON with success, vpcId, subnets, securityGroups, natGateways, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vpcId', 'subnets', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vpcId: { type: 'string' },
        vpcCidr: { type: 'string' },
        subnets: { type: 'array' },
        securityGroups: { type: 'array' },
        natGateways: { type: 'array' },
        routeTables: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'networking', 'vpc', args.cloudProvider]
}));

export const cniSetupTask = defineTask('cni-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure CNI Plugin: ${args.projectName}`,
  agent: {
    name: 'cni-specialist',
    prompt: {
      role: 'Kubernetes Networking Specialist',
      task: 'Install and configure Container Network Interface (CNI) plugin',
      context: args,
      instructions: [
        'Select appropriate CNI plugin (Calico, Cilium, AWS VPC CNI, etc.)',
        'Install CNI plugin via manifests or Helm',
        'Configure IP address management (IPAM)',
        'Enable network policies if required',
        'Configure pod-to-pod networking',
        'Set up service networking',
        'Configure network performance tuning',
        'Test connectivity between pods',
        'Generate CNI configuration manifests',
        'Document CNI architecture and troubleshooting'
      ],
      outputFormat: 'JSON with success, cniPlugin, manifests, networkPoliciesEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'cniPlugin', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cniPlugin: { type: 'string' },
        version: { type: 'string' },
        networkPoliciesEnabled: { type: 'boolean' },
        ipamConfig: { type: 'object' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'networking', 'cni']
}));

export const ingressSetupTask = defineTask('ingress-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Ingress Controller: ${args.projectName}`,
  agent: {
    name: 'ingress-specialist',
    prompt: {
      role: 'Kubernetes Ingress Specialist',
      task: 'Install and configure Ingress controller for external access',
      context: args,
      instructions: [
        'Select ingress controller (NGINX, Traefik, AWS ALB, etc.)',
        'Install ingress controller via Helm or manifests',
        'Configure load balancer integration',
        'Set up SSL/TLS termination',
        'Configure default backend',
        'Set up ingress classes',
        'Configure rate limiting and security policies',
        'Enable access logging and metrics',
        'Test ingress routing and SSL',
        'Generate sample ingress manifests'
      ],
      outputFormat: 'JSON with success, ingressController, loadBalancer, sslEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'ingressController', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        ingressController: { type: 'string' },
        version: { type: 'string' },
        loadBalancer: { type: 'object' },
        sslEnabled: { type: 'boolean' },
        ingressClass: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'ingress', 'load-balancer']
}));

export const storageSetupTask = defineTask('storage-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Storage: ${args.projectName}`,
  agent: {
    name: 'storage-specialist',
    prompt: {
      role: 'Kubernetes Storage Specialist',
      task: 'Configure persistent storage using CSI drivers and StorageClasses',
      context: args,
      instructions: [
        'Install CSI driver for cloud provider (EBS CSI, GCE PD CSI, Azure Disk CSI)',
        'Create StorageClasses for different storage tiers',
        'Configure volume snapshot capabilities',
        'Set up dynamic volume provisioning',
        'Configure volume expansion and resizing',
        'Set default StorageClass',
        'Test PVC creation and binding',
        'Configure backup and recovery for persistent volumes',
        'Generate sample PVC manifests',
        'Document storage architecture and best practices'
      ],
      outputFormat: 'JSON with success, csiDriver, storageClasses, snapshotsEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'csiDriver', 'storageClasses', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        csiDriver: { type: 'string' },
        storageClasses: { type: 'array' },
        snapshotsEnabled: { type: 'boolean' },
        volumeExpansionEnabled: { type: 'boolean' },
        defaultStorageClass: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'storage', 'csi', args.cloudProvider]
}));

export const rbacSetupTask = defineTask('rbac-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure RBAC: ${args.projectName}`,
  agent: {
    name: 'security-engineer',
    prompt: {
      role: 'Kubernetes Security Engineer',
      task: 'Configure Role-Based Access Control (RBAC) for cluster security',
      context: args,
      instructions: [
        'Design RBAC strategy (admin, developer, viewer roles)',
        'Create ClusterRoles and Roles with least privilege',
        'Create RoleBindings and ClusterRoleBindings',
        'Configure ServiceAccounts for applications',
        'Set up OIDC/LDAP integration for user authentication',
        'Implement namespace-based isolation',
        'Configure audit logging for RBAC events',
        'Test RBAC policies with different users',
        'Generate RBAC manifests',
        'Document access control policies'
      ],
      outputFormat: 'JSON with success, score, roles, serviceAccounts, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'roles', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        roles: { type: 'array' },
        clusterRoles: { type: 'array' },
        serviceAccounts: { type: 'array' },
        oidcEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'security', 'rbac']
}));

export const podSecuritySetupTask = defineTask('pod-security-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Pod Security: ${args.projectName}`,
  agent: {
    name: 'pod-security-specialist',
    prompt: {
      role: 'Kubernetes Security Specialist',
      task: 'Implement Pod Security Standards and admission controls',
      context: args,
      instructions: [
        'Configure Pod Security Standards (PSS) for namespaces',
        'Set baseline, restricted, and privileged policies',
        'Implement Pod Security Admission controller',
        'Configure security contexts for pods',
        'Restrict privileged containers',
        'Configure AppArmor/SELinux profiles',
        'Implement resource limits and quotas',
        'Configure read-only root filesystems',
        'Test pod security policies',
        'Generate pod security manifests'
      ],
      outputFormat: 'JSON with success, score, podSecurityStandards, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        podSecurityStandards: { type: 'array' },
        admissionControlEnabled: { type: 'boolean' },
        resourceQuotas: { type: 'array' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'security', 'pod-security']
}));

export const secretsEncryptionTask = defineTask('secrets-encryption', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Secrets Encryption: ${args.projectName}`,
  agent: {
    name: 'secrets-specialist',
    prompt: {
      role: 'Kubernetes Security Engineer specialized in secrets management',
      task: 'Configure secrets encryption at rest and integrate external secrets manager',
      context: args,
      instructions: [
        'Enable encryption at rest for Kubernetes secrets',
        'Configure KMS provider (AWS KMS, Azure Key Vault, GCP KMS)',
        'Install and configure External Secrets Operator',
        'Set up secret rotation policies',
        'Configure sealed secrets or SOPS for GitOps',
        'Implement secret scanning in CI/CD',
        'Test secret encryption and retrieval',
        'Generate secrets management manifests',
        'Document secrets management practices',
        'Create secret rotation procedures'
      ],
      outputFormat: 'JSON with success, score, encryptionEnabled, externalSecretsEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'encryptionEnabled', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        encryptionEnabled: { type: 'boolean' },
        kmsProvider: { type: 'string' },
        externalSecretsEnabled: { type: 'boolean' },
        sealedSecretsEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'security', 'secrets', args.cloudProvider]
}));

export const networkPolicySetupTask = defineTask('network-policy-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Network Policies: ${args.projectName}`,
  agent: {
    name: 'network-security-specialist',
    prompt: {
      role: 'Kubernetes Network Security Specialist',
      task: 'Implement NetworkPolicies for pod-to-pod traffic control',
      context: args,
      instructions: [
        'Design network segmentation strategy',
        'Create default deny-all network policies',
        'Implement namespace-based network isolation',
        'Configure ingress rules for allowed traffic',
        'Configure egress rules for external services',
        'Create policies for common patterns (DB access, API access)',
        'Test network policies with connectivity tests',
        'Generate network policy manifests',
        'Document network security architecture',
        'Create network policy troubleshooting guide'
      ],
      outputFormat: 'JSON with success, score, networkPolicies, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'networkPolicies', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        networkPolicies: { type: 'array' },
        defaultDenyEnabled: { type: 'boolean' },
        namespaceIsolationEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'security', 'network-policy']
}));

export const metricsSetupTask = defineTask('metrics-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Metrics Monitoring: ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'Site Reliability Engineer specialized in Kubernetes monitoring',
      task: 'Deploy and configure metrics monitoring stack',
      context: args,
      instructions: [
        'Install Prometheus Operator or kube-prometheus-stack',
        'Configure Prometheus for metrics scraping',
        'Install Grafana for visualization',
        'Create default dashboards (cluster, node, pod metrics)',
        'Configure metrics retention and storage',
        'Set up ServiceMonitors for auto-discovery',
        'Configure alerting rules and Alertmanager',
        'Install metrics-server for HPA',
        'Test metrics collection and alerting',
        'Generate monitoring manifests'
      ],
      outputFormat: 'JSON with success, score, tool, dashboards, alerts, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'tool', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        tool: { type: 'string' },
        prometheusEndpoint: { type: 'string' },
        grafanaEndpoint: { type: 'string' },
        dashboards: { type: 'array' },
        alerts: { type: 'array' },
        retentionPeriod: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'monitoring', 'metrics', 'prometheus']
}));

export const loggingSetupTask = defineTask('logging-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Centralized Logging: ${args.projectName}`,
  agent: {
    name: 'logging-engineer',
    prompt: {
      role: 'DevOps Engineer specialized in log aggregation',
      task: 'Deploy and configure centralized logging stack',
      context: args,
      instructions: [
        'Select logging stack (ELK, Loki, CloudWatch, etc.)',
        'Install log aggregation tool (Fluent Bit, Fluentd)',
        'Configure log collection from all pods',
        'Set up log parsing and enrichment',
        'Configure log retention and rotation',
        'Create log viewing dashboards',
        'Set up log-based alerts',
        'Configure audit log collection',
        'Test log ingestion and search',
        'Generate logging manifests'
      ],
      outputFormat: 'JSON with success, score, tool, logRetention, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'tool', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        tool: { type: 'string' },
        aggregator: { type: 'string' },
        logEndpoint: { type: 'string' },
        logRetention: { type: 'string' },
        auditLogsEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'logging', 'observability']
}));

export const tracingSetupTask = defineTask('tracing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Distributed Tracing: ${args.projectName}`,
  agent: {
    name: 'tracing-engineer',
    prompt: {
      role: 'Observability Engineer specialized in distributed tracing',
      task: 'Deploy and configure distributed tracing system',
      context: args,
      instructions: [
        'Select tracing backend (Jaeger, Tempo, X-Ray)',
        'Install OpenTelemetry Collector',
        'Configure trace collection and sampling',
        'Set up trace visualization UI',
        'Configure trace retention and storage',
        'Integrate with service mesh if available',
        'Test trace collection and visualization',
        'Generate tracing manifests',
        'Document instrumentation guidelines',
        'Create tracing best practices guide'
      ],
      outputFormat: 'JSON with success, score, tool, tracingEndpoint, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tool', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        tool: { type: 'string' },
        tracingEndpoint: { type: 'string' },
        samplingRate: { type: 'number' },
        retentionPeriod: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'tracing', 'observability']
}));

export const autoscalingSetupTask = defineTask('autoscaling-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Autoscaling: ${args.projectName}`,
  agent: {
    name: 'autoscaling-specialist',
    prompt: {
      role: 'SRE specialized in Kubernetes autoscaling',
      task: 'Configure cluster autoscaler and horizontal pod autoscaling',
      context: args,
      instructions: [
        'Install Cluster Autoscaler for node scaling',
        'Configure Cluster Autoscaler parameters (min/max nodes)',
        'Set up Horizontal Pod Autoscaler (HPA)',
        'Configure custom metrics for HPA (CPU, memory, custom)',
        'Install Vertical Pod Autoscaler (VPA) if needed',
        'Configure Karpenter for advanced node provisioning (if applicable)',
        'Set pod disruption budgets for safe scaling',
        'Test autoscaling behavior under load',
        'Generate autoscaling manifests',
        'Document autoscaling policies'
      ],
      outputFormat: 'JSON with success, clusterAutoscalerEnabled, hpaEnabled, vpaEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'clusterAutoscalerEnabled', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        clusterAutoscalerEnabled: { type: 'boolean' },
        hpaEnabled: { type: 'boolean' },
        vpaEnabled: { type: 'boolean' },
        karpenterEnabled: { type: 'boolean' },
        minNodes: { type: 'number' },
        maxNodes: { type: 'number' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'autoscaling', 'hpa', args.cloudProvider]
}));

export const backupSetupTask = defineTask('backup-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Backup and DR: ${args.projectName}`,
  agent: {
    name: 'backup-specialist',
    prompt: {
      role: 'Site Reliability Engineer specialized in disaster recovery',
      task: 'Configure backup and disaster recovery for Kubernetes cluster',
      context: args,
      instructions: [
        'Install Velero for cluster backup',
        'Configure backup storage location (S3, GCS, Azure Blob)',
        'Set up backup schedules for cluster resources',
        'Configure volume snapshot backups',
        'Test backup and restore procedures',
        'Configure backup retention policies',
        'Set up cross-region backup replication',
        'Create disaster recovery runbooks',
        'Generate backup manifests',
        'Document backup and restore procedures'
      ],
      outputFormat: 'JSON with success, backupTool, backupSchedule, backupLocation, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupTool', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backupTool: { type: 'string' },
        backupLocation: { type: 'string' },
        backupSchedule: { type: 'string' },
        retentionDays: { type: 'number' },
        volumeSnapshotsEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'backup', 'disaster-recovery', args.cloudProvider]
}));

export const gitopsSetupTask = defineTask('gitops-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure GitOps: ${args.projectName}`,
  agent: {
    name: 'gitops-engineer',
    prompt: {
      role: 'Platform Engineer specialized in GitOps workflows',
      task: 'Set up GitOps-based continuous deployment',
      context: args,
      instructions: [
        'Select GitOps tool (Argo CD or Flux CD)',
        'Install GitOps operator in cluster',
        'Configure Git repository for manifests',
        'Set up application definitions',
        'Configure auto-sync and self-heal policies',
        'Set up multi-environment promotion',
        'Configure secrets management (Sealed Secrets/External Secrets)',
        'Set up notifications and webhooks',
        'Test GitOps deployment workflows',
        'Generate GitOps configuration manifests'
      ],
      outputFormat: 'JSON with success, tool, gitRepo, autoSyncEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tool', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tool: { type: 'string' },
        gitRepo: { type: 'string' },
        dashboardUrl: { type: 'string' },
        autoSyncEnabled: { type: 'boolean' },
        selfHealEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'gitops', 'argocd', 'flux']
}));

export const serviceMeshSetupTask = defineTask('service-mesh-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Install Service Mesh: ${args.projectName}`,
  agent: {
    name: 'service-mesh-engineer',
    prompt: {
      role: 'Platform Engineer specialized in service mesh',
      task: 'Install and configure service mesh for advanced traffic management',
      context: args,
      instructions: [
        `Install service mesh (${args.serviceMeshType})`,
        'Configure control plane and data plane',
        'Set up automatic sidecar injection',
        'Configure mTLS for service-to-service encryption',
        'Set up traffic management (routing, splitting)',
        'Configure observability (metrics, traces)',
        'Set up circuit breakers and retries',
        'Configure ingress and egress gateways',
        'Test service mesh functionality',
        'Generate service mesh manifests'
      ],
      outputFormat: 'JSON with success, serviceMesh, mtlsEnabled, observabilityIntegrated, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'serviceMesh', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        serviceMesh: { type: 'string' },
        version: { type: 'string' },
        mtlsEnabled: { type: 'boolean' },
        observabilityIntegrated: { type: 'boolean' },
        ingressGateway: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'service-mesh', args.serviceMeshType]
}));

export const clusterValidationTask = defineTask('cluster-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Cluster Setup: ${args.projectName}`,
  agent: {
    name: 'cluster-validator',
    prompt: {
      role: 'QA Engineer specialized in Kubernetes validation',
      task: 'Validate cluster setup and run conformance tests',
      context: args,
      instructions: [
        'Run Kubernetes conformance tests (Sonobuoy)',
        'Validate cluster connectivity and DNS resolution',
        'Test pod scheduling and resource allocation',
        'Validate storage provisioning and PVC binding',
        'Test ingress routing and SSL termination',
        'Validate RBAC and security policies',
        'Test autoscaling behavior',
        'Validate monitoring and logging collection',
        'Test backup and restore procedures',
        'Generate validation report with pass/fail status'
      ],
      outputFormat: 'JSON with success, validationScore, testsPassed, testsFailed, findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationScore', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsSkipped: { type: 'number' },
        findings: { type: 'array' },
        conformanceTests: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'validation', 'testing']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specialized in Kubernetes documentation',
      task: 'Generate comprehensive cluster documentation and operational runbooks',
      context: args,
      instructions: [
        'Create cluster architecture documentation',
        'Document cluster access and authentication',
        'Generate operational runbooks (scaling, upgrades, troubleshooting)',
        'Create incident response procedures',
        'Document backup and disaster recovery procedures',
        'Create monitoring and alerting guide',
        'Document security policies and compliance',
        'Create onboarding guide for developers',
        'Generate troubleshooting guides',
        'Create cost optimization recommendations'
      ],
      outputFormat: 'JSON with success, runbook (markdown), architecture (markdown), operationalGuides, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbook', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbook: { type: 'string' },
        architecture: { type: 'string' },
        operationalGuides: { type: 'array' },
        troubleshootingGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['kubernetes', 'documentation', 'runbooks']
}));
