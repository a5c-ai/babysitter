/**
 * @process specializations/security-research/security-research-lab-setup
 * @description Setup and configuration of isolated security research environments including virtual
 * machines, network isolation, analysis tools, and malware sandboxes. Ensures safe and reproducible
 * research conditions.
 * @inputs { projectName: string, labType: string, requirements?: object }
 * @outputs { success: boolean, labConfig: object, tools: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/security-research-lab-setup', {
 *   projectName: 'Malware Analysis Lab',
 *   labType: 'malware-analysis',
 *   requirements: { isolation: 'high', tools: ['remnux', 'cuckoo'] }
 * });
 *
 * @references
 * - REMnux: https://remnux.org/
 * - FlareVM: https://github.com/mandiant/flare-vm
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    labType,
    requirements = {},
    outputDir = 'lab-setup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const tools = [];

  ctx.log('info', `Starting Security Research Lab Setup for ${projectName}`);
  ctx.log('info', `Lab Type: ${labType}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing lab requirements');

  const reqAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    labType,
    requirements,
    outputDir
  });

  artifacts.push(...reqAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up lab infrastructure');

  const infraSetup = await ctx.task(infraSetupTask, {
    projectName,
    labType,
    reqAnalysis,
    outputDir
  });

  artifacts.push(...infraSetup.artifacts);

  // ============================================================================
  // PHASE 3: NETWORK ISOLATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring network isolation');

  const networkIsolation = await ctx.task(networkIsolationTask, {
    projectName,
    reqAnalysis,
    infraSetup,
    outputDir
  });

  artifacts.push(...networkIsolation.artifacts);

  // ============================================================================
  // PHASE 4: TOOL INSTALLATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Installing analysis tools');

  const toolInstallation = await ctx.task(toolInstallationTask, {
    projectName,
    labType,
    reqAnalysis,
    outputDir
  });

  tools.push(...toolInstallation.tools);
  artifacts.push(...toolInstallation.artifacts);

  // ============================================================================
  // PHASE 5: SANDBOX CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring analysis sandboxes');

  const sandboxConfig = await ctx.task(sandboxConfigTask, {
    projectName,
    labType,
    infraSetup,
    outputDir
  });

  artifacts.push(...sandboxConfig.artifacts);

  // ============================================================================
  // PHASE 6: VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Verifying lab configuration');

  const verification = await ctx.task(labVerificationTask, {
    projectName,
    infraSetup,
    networkIsolation,
    toolInstallation,
    sandboxConfig,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  await ctx.breakpoint({
    question: `Lab setup complete. ${tools.length} tools installed. Isolation verified: ${verification.isolationVerified}. Ready for use?`,
    title: 'Lab Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        labType,
        vms: infraSetup.vmCount,
        tools: tools.length,
        isolationVerified: verification.isolationVerified
      },
      files: verification.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    labConfig: {
      labType,
      infrastructure: infraSetup.config,
      network: networkIsolation.config,
      sandboxes: sandboxConfig.sandboxes
    },
    tools,
    verified: verification.isolationVerified,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/security-research-lab-setup',
      timestamp: startTime,
      labType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Requirements - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Security Lab Architect',
      task: 'Analyze lab requirements',
      context: args,
      instructions: [
        '1. Define lab purpose',
        '2. Identify tool requirements',
        '3. Determine isolation level',
        '4. Specify VM requirements',
        '5. Define network needs',
        '6. Identify storage needs',
        '7. Plan snapshot strategy',
        '8. Document requirements'
      ],
      outputFormat: 'JSON with requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'toolList', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        toolList: { type: 'array' },
        vmSpecs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'lab-setup', 'requirements']
}));

export const infraSetupTask = defineTask('infra-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Infrastructure - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Lab Infrastructure Engineer',
      task: 'Set up lab infrastructure',
      context: args,
      instructions: [
        '1. Set up hypervisor',
        '2. Create analysis VMs',
        '3. Create victim VMs',
        '4. Configure storage',
        '5. Set up snapshots',
        '6. Configure resources',
        '7. Test VM operations',
        '8. Document configuration'
      ],
      outputFormat: 'JSON with infrastructure'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'vmCount', 'artifacts'],
      properties: {
        config: { type: 'object' },
        vmCount: { type: 'number' },
        vms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'lab-setup', 'infrastructure']
}));

export const networkIsolationTask = defineTask('network-isolation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Network Isolation - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Lab Network Engineer',
      task: 'Configure network isolation',
      context: args,
      instructions: [
        '1. Create isolated networks',
        '2. Configure firewalls',
        '3. Set up INetSim',
        '4. Configure DNS sinkhole',
        '5. Set up traffic capture',
        '6. Block internet access',
        '7. Test isolation',
        '8. Document configuration'
      ],
      outputFormat: 'JSON with network config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'isolated', 'artifacts'],
      properties: {
        config: { type: 'object' },
        isolated: { type: 'boolean' },
        networks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'lab-setup', 'network']
}));

export const toolInstallationTask = defineTask('tool-installation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Install Tools - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Security Tool Installer',
      task: 'Install analysis tools',
      context: args,
      instructions: [
        '1. Install REMnux/FlareVM',
        '2. Install static analysis tools',
        '3. Install dynamic analysis tools',
        '4. Install debuggers',
        '5. Install network tools',
        '6. Configure tool settings',
        '7. Verify installations',
        '8. Document tool list'
      ],
      outputFormat: 'JSON with tools'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'installed', 'artifacts'],
      properties: {
        tools: { type: 'array' },
        installed: { type: 'number' },
        failed: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'lab-setup', 'tools']
}));

export const sandboxConfigTask = defineTask('sandbox-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Sandboxes - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Sandbox Configuration Engineer',
      task: 'Configure analysis sandboxes',
      context: args,
      instructions: [
        '1. Set up Cuckoo sandbox',
        '2. Configure guest VMs',
        '3. Set up agents',
        '4. Configure reporting',
        '5. Set up web interface',
        '6. Configure signatures',
        '7. Test submission',
        '8. Document configuration'
      ],
      outputFormat: 'JSON with sandbox config'
    },
    outputSchema: {
      type: 'object',
      required: ['sandboxes', 'configured', 'artifacts'],
      properties: {
        sandboxes: { type: 'array' },
        configured: { type: 'boolean' },
        guestVMs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'lab-setup', 'sandbox']
}));

export const labVerificationTask = defineTask('lab-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify Lab - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Lab Verification Specialist',
      task: 'Verify lab configuration',
      context: args,
      instructions: [
        '1. Test network isolation',
        '2. Verify VM snapshots',
        '3. Test tool functionality',
        '4. Test sandbox operation',
        '5. Verify no internet leak',
        '6. Test sample workflow',
        '7. Document test results',
        '8. Create verification report'
      ],
      outputFormat: 'JSON with verification'
    },
    outputSchema: {
      type: 'object',
      required: ['isolationVerified', 'allTestsPassed', 'artifacts'],
      properties: {
        isolationVerified: { type: 'boolean' },
        allTestsPassed: { type: 'boolean' },
        testResults: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'lab-setup', 'verification']
}));
