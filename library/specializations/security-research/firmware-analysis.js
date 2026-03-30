/**
 * @process specializations/security-research/firmware-analysis
 * @description Security analysis of embedded device firmware including extraction, file system analysis,
 * binary analysis, and vulnerability identification in IoT and embedded systems using binwalk, FACT,
 * and specialized firmware analysis tools.
 * @inputs { projectName: string, firmwarePath: string, deviceType?: string }
 * @outputs { success: boolean, firmwareReport: object, vulnerabilities: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/firmware-analysis', {
 *   projectName: 'Router Firmware Analysis',
 *   firmwarePath: '/path/to/firmware.bin',
 *   deviceType: 'router'
 * });
 *
 * @references
 * - Binwalk: https://github.com/ReFirmLabs/binwalk
 * - FACT: https://github.com/fkie-cad/FACT_core
 * - Attify: https://attify.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    firmwarePath,
    deviceType = 'embedded',
    analysisDepth = 'comprehensive',
    outputDir = 'firmware-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Firmware Analysis for ${projectName}`);
  ctx.log('info', `Firmware: ${firmwarePath}, Device Type: ${deviceType}`);

  // ============================================================================
  // PHASE 1: FIRMWARE EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Extracting firmware from device or file');

  const extraction = await ctx.task(firmwareExtractionTask, {
    projectName,
    firmwarePath,
    outputDir
  });

  artifacts.push(...extraction.artifacts);

  // ============================================================================
  // PHASE 2: STRUCTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing firmware structure with binwalk');

  const structureAnalysis = await ctx.task(structureAnalysisTask, {
    projectName,
    firmwarePath,
    extraction,
    outputDir
  });

  artifacts.push(...structureAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: FILE SYSTEM EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Extracting and analyzing file systems');

  const fsExtraction = await ctx.task(fileSystemExtractionTask, {
    projectName,
    structureAnalysis,
    outputDir
  });

  artifacts.push(...fsExtraction.artifacts);

  // ============================================================================
  // PHASE 4: BINARY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying and analyzing binaries');

  const binaryAnalysis = await ctx.task(firmwareBinaryAnalysisTask, {
    projectName,
    fsExtraction,
    outputDir
  });

  artifacts.push(...binaryAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CONFIGURATION REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Reviewing configuration files');

  const configReview = await ctx.task(configurationReviewTask, {
    projectName,
    fsExtraction,
    outputDir
  });

  vulnerabilities.push(...configReview.vulnerabilities);
  artifacts.push(...configReview.artifacts);

  // ============================================================================
  // PHASE 6: CREDENTIAL SEARCH
  // ============================================================================

  ctx.log('info', 'Phase 6: Checking for hardcoded credentials');

  const credentialSearch = await ctx.task(credentialSearchTask, {
    projectName,
    fsExtraction,
    outputDir
  });

  vulnerabilities.push(...credentialSearch.vulnerabilities);
  artifacts.push(...credentialSearch.artifacts);

  // ============================================================================
  // PHASE 7: NETWORK SERVICE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing network services');

  const networkAnalysis = await ctx.task(networkServiceAnalysisTask, {
    projectName,
    fsExtraction,
    binaryAnalysis,
    outputDir
  });

  vulnerabilities.push(...networkAnalysis.vulnerabilities);
  artifacts.push(...networkAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating firmware analysis report');

  const report = await ctx.task(firmwareReportTask, {
    projectName,
    structureAnalysis,
    fsExtraction,
    binaryAnalysis,
    vulnerabilities,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Firmware analysis complete for ${projectName}. ${vulnerabilities.length} vulnerabilities found, ${credentialSearch.credentialsFound} credentials discovered. Review findings?`,
    title: 'Firmware Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        firmwareSize: structureAnalysis.size,
        fileSystems: fsExtraction.fileSystemsFound,
        binaries: binaryAnalysis.binariesAnalyzed,
        vulnerabilities: vulnerabilities.length,
        credentials: credentialSearch.credentialsFound
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    firmwareReport: {
      structure: structureAnalysis.structure,
      fileSystems: fsExtraction.fileSystemsFound,
      binaries: binaryAnalysis.binariesAnalyzed,
      reportPath: report.reportPath
    },
    vulnerabilities,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/firmware-analysis',
      timestamp: startTime,
      deviceType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const firmwareExtractionTask = defineTask('firmware-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract Firmware - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Firmware Extraction Specialist',
      task: 'Extract firmware from device or downloaded file',
      context: args,
      instructions: [
        '1. Identify firmware source (device, download)',
        '2. Verify firmware integrity',
        '3. Check for encryption/obfuscation',
        '4. Attempt decryption if needed',
        '5. Identify firmware format',
        '6. Document extraction method',
        '7. Calculate hashes',
        '8. Store extracted firmware'
      ],
      outputFormat: 'JSON with extraction details'
    },
    outputSchema: {
      type: 'object',
      required: ['extractedPath', 'encrypted', 'artifacts'],
      properties: {
        extractedPath: { type: 'string' },
        encrypted: { type: 'boolean' },
        hashes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'extraction']
}));

export const structureAnalysisTask = defineTask('structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Firmware Structure - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Firmware Structure Analyst',
      task: 'Analyze firmware structure with binwalk',
      context: args,
      instructions: [
        '1. Run binwalk signature analysis',
        '2. Identify embedded file systems',
        '3. Find compressed sections',
        '4. Identify bootloader',
        '5. Find kernel image',
        '6. Locate root file system',
        '7. Map firmware layout',
        '8. Document structure'
      ],
      outputFormat: 'JSON with structure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'size', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        size: { type: 'number' },
        components: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'structure']
}));

export const fileSystemExtractionTask = defineTask('filesystem-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract File Systems - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'File System Extraction Specialist',
      task: 'Extract and analyze file systems',
      context: args,
      instructions: [
        '1. Extract all file systems',
        '2. Identify file system types',
        '3. Mount or extract contents',
        '4. Enumerate all files',
        '5. Identify interesting files',
        '6. Check file permissions',
        '7. Find setuid/setgid binaries',
        '8. Document file system layout'
      ],
      outputFormat: 'JSON with filesystem details'
    },
    outputSchema: {
      type: 'object',
      required: ['fileSystemsFound', 'extractedPath', 'artifacts'],
      properties: {
        fileSystemsFound: { type: 'number' },
        extractedPath: { type: 'string' },
        fileTypes: { type: 'array' },
        totalFiles: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'filesystem']
}));

export const firmwareBinaryAnalysisTask = defineTask('firmware-binary-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Firmware Binaries - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Firmware Binary Analyst',
      task: 'Identify and analyze binaries in firmware',
      context: args,
      instructions: [
        '1. Find all executable binaries',
        '2. Identify custom binaries',
        '3. Check for known vulnerable versions',
        '4. Analyze main application',
        '5. Check security mitigations',
        '6. Identify unsafe functions',
        '7. Look for debug symbols',
        '8. Document binary analysis'
      ],
      outputFormat: 'JSON with binary analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['binariesAnalyzed', 'customBinaries', 'artifacts'],
      properties: {
        binariesAnalyzed: { type: 'number' },
        customBinaries: { type: 'array' },
        vulnerableBinaries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'binaries']
}));

export const configurationReviewTask = defineTask('configuration-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Configurations - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Configuration Security Analyst',
      task: 'Review configuration files for security issues',
      context: args,
      instructions: [
        '1. Find all configuration files',
        '2. Check for insecure defaults',
        '3. Find exposed debug settings',
        '4. Check network configurations',
        '5. Review service configurations',
        '6. Check for sensitive data',
        '7. Identify misconfigurations',
        '8. Document configuration issues'
      ],
      outputFormat: 'JSON with configuration review'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'configFiles', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        configFiles: { type: 'array' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'configuration']
}));

export const credentialSearchTask = defineTask('credential-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Search for Credentials - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Credential Discovery Specialist',
      task: 'Check for hardcoded credentials',
      context: args,
      instructions: [
        '1. Search for password strings',
        '2. Find API keys and tokens',
        '3. Check for SSH keys',
        '4. Find certificate private keys',
        '5. Check shadow/passwd files',
        '6. Search for database credentials',
        '7. Find cloud provider keys',
        '8. Document all credentials found'
      ],
      outputFormat: 'JSON with credential findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'credentialsFound', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        credentialsFound: { type: 'number' },
        credentialTypes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'credentials']
}));

export const networkServiceAnalysisTask = defineTask('network-service-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Network Services - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Network Service Analyst',
      task: 'Analyze network services in firmware',
      context: args,
      instructions: [
        '1. Identify listening services',
        '2. Find web server configurations',
        '3. Analyze API endpoints',
        '4. Check for telnet/SSH',
        '5. Find debug interfaces',
        '6. Analyze update mechanisms',
        '7. Check for backdoors',
        '8. Document network exposure'
      ],
      outputFormat: 'JSON with network analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'services', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        services: { type: 'array' },
        exposedPorts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'network']
}));

export const firmwareReportTask = defineTask('firmware-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Firmware Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Firmware Report Specialist',
      task: 'Generate comprehensive firmware analysis report',
      context: args,
      instructions: [
        '1. Summarize firmware analysis',
        '2. Document firmware structure',
        '3. List all vulnerabilities',
        '4. Include credential findings',
        '5. Document attack surface',
        '6. Provide remediation guidance',
        '7. Include technical details',
        '8. Format as professional report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'firmware', 'reporting']
}));
