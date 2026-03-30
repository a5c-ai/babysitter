/**
 * @process specializations/fpga-programming/sva-development
 * @description SystemVerilog Assertion (SVA) Development - Implement concurrent and immediate assertions to verify
 * design properties. Create assertion libraries for protocol checking and design intent specification.
 * @inputs { designName: string, protocols?: array, designIntentProperties?: array, assertionLevel?: string, outputDir?: string }
 * @outputs { success: boolean, assertionFiles: array, assertionLibrary: object, coverageReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/sva-development', {
 *   designName: 'axi_master',
 *   protocols: ['AXI4', 'AXI4-Lite'],
 *   designIntentProperties: ['no_deadlock', 'data_integrity', 'handshake_timeout'],
 *   assertionLevel: 'comprehensive'
 * });
 *
 * @references
 * - SystemVerilog Assertions: https://www.accellera.org/
 * - SVA Handbook: https://verificationacademy.com/
 * - Formal Verification with SVA: https://www.synopsys.com/verification/static-and-formal-verification.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    protocols = [],
    designIntentProperties = [],
    assertionLevel = 'standard', // 'basic', 'standard', 'comprehensive'
    formalVerificationCompatible = true,
    simulationAssertions = true,
    coverProperties = true,
    outputDir = 'sva-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SVA Development for: ${designName}`);
  ctx.log('info', `Protocols: ${protocols.length}, Properties: ${designIntentProperties.length}`);

  // ============================================================================
  // PHASE 1: ASSERTION REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Assertion Requirements Analysis');

  const requirements = await ctx.task(assertionRequirementsTask, {
    designName,
    protocols,
    designIntentProperties,
    assertionLevel,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: SEQUENCE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Sequence Definition');

  const sequences = await ctx.task(sequenceDefinitionTask, {
    designName,
    protocols,
    requirements,
    outputDir
  });

  artifacts.push(...sequences.artifacts);

  // ============================================================================
  // PHASE 3: PROPERTY SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Property Specification');

  const properties = await ctx.task(propertySpecificationTask, {
    designName,
    designIntentProperties,
    sequences,
    requirements,
    formalVerificationCompatible,
    outputDir
  });

  artifacts.push(...properties.artifacts);

  // Quality Gate: Property review
  await ctx.breakpoint({
    question: `Property specification complete for ${designName}. ${properties.propertyCount} properties defined. Review SVA properties?`,
    title: 'Property Specification Review',
    context: {
      runId: ctx.runId,
      designName,
      propertyCount: properties.propertyCount,
      categories: properties.categories,
      files: properties.artifacts.map(a => ({ path: a.path, format: a.format || 'sv' }))
    }
  });

  // ============================================================================
  // PHASE 4: CONCURRENT ASSERTION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Concurrent Assertion Implementation');

  const concurrentAssertions = await ctx.task(concurrentAssertionTask, {
    designName,
    properties,
    sequences,
    simulationAssertions,
    formalVerificationCompatible,
    outputDir
  });

  artifacts.push(...concurrentAssertions.artifacts);

  // ============================================================================
  // PHASE 5: IMMEDIATE ASSERTION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Immediate Assertion Implementation');

  const immediateAssertions = await ctx.task(immediateAssertionTask, {
    designName,
    requirements,
    outputDir
  });

  artifacts.push(...immediateAssertions.artifacts);

  // ============================================================================
  // PHASE 6: COVER PROPERTY IMPLEMENTATION
  // ============================================================================

  let coverPropertiesImpl = null;
  if (coverProperties) {
    ctx.log('info', 'Phase 6: Cover Property Implementation');

    coverPropertiesImpl = await ctx.task(coverPropertyTask, {
      designName,
      properties,
      sequences,
      outputDir
    });

    artifacts.push(...coverPropertiesImpl.artifacts);
  }

  // ============================================================================
  // PHASE 7: ASSUME PROPERTY FOR INPUTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Assume Property Definition');

  const assumeProperties = await ctx.task(assumePropertyTask, {
    designName,
    requirements,
    formalVerificationCompatible,
    outputDir
  });

  artifacts.push(...assumeProperties.artifacts);

  // ============================================================================
  // PHASE 8: ASSERTION LIBRARY ORGANIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Assertion Library Organization');

  const assertionLibrary = await ctx.task(assertionLibraryTask, {
    designName,
    protocols,
    concurrentAssertions,
    immediateAssertions,
    coverPropertiesImpl,
    assumeProperties,
    outputDir
  });

  artifacts.push(...assertionLibrary.artifacts);

  // ============================================================================
  // PHASE 9: ASSERTION BIND MODULE
  // ============================================================================

  ctx.log('info', 'Phase 9: Assertion Bind Module Creation');

  const bindModule = await ctx.task(assertionBindTask, {
    designName,
    assertionLibrary,
    outputDir
  });

  artifacts.push(...bindModule.artifacts);

  // ============================================================================
  // PHASE 10: ASSERTION VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Assertion Verification and Testing');

  const verification = await ctx.task(assertionVerificationTask, {
    designName,
    assertionLibrary,
    bindModule,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  // Final Breakpoint
  const totalAssertions = concurrentAssertions.assertionCount + immediateAssertions.assertionCount;
  await ctx.breakpoint({
    question: `SVA Development Complete for ${designName}. ${totalAssertions} assertions, ${coverPropertiesImpl?.coverCount || 0} cover properties. Review assertion package?`,
    title: 'SVA Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        designName,
        concurrentAssertions: concurrentAssertions.assertionCount,
        immediateAssertions: immediateAssertions.assertionCount,
        coverProperties: coverPropertiesImpl?.coverCount || 0,
        assumeProperties: assumeProperties.assumeCount,
        verificationPassed: verification.passed
      },
      files: [
        { path: assertionLibrary.libraryPath, format: 'sv', label: 'Assertion Library' },
        { path: bindModule.bindFilePath, format: 'sv', label: 'Bind Module' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: verification.passed,
    designName,
    assertionFiles: [
      assertionLibrary.libraryPath,
      bindModule.bindFilePath,
      ...concurrentAssertions.assertionFiles
    ],
    assertionLibrary: {
      path: assertionLibrary.libraryPath,
      sequenceCount: sequences.sequenceCount,
      propertyCount: properties.propertyCount,
      assertionCount: totalAssertions
    },
    coverageReport: {
      coverProperties: coverPropertiesImpl?.coverCount || 0,
      assumeProperties: assumeProperties.assumeCount,
      verificationStatus: verification.status
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/sva-development',
      timestamp: startTime,
      designName,
      assertionLevel,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const assertionRequirementsTask = defineTask('assertion-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Assertion Requirements - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Analyze assertion requirements',
      context: args,
      instructions: [
        '1. Identify protocol checking requirements',
        '2. Define design intent properties',
        '3. Identify interface assumptions',
        '4. Define timing requirements',
        '5. Identify safety properties',
        '6. Define liveness properties',
        '7. Identify coverage goals',
        '8. Document assertion scope',
        '9. Prioritize assertions',
        '10. Create requirements document'
      ],
      outputFormat: 'JSON with requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['protocolRequirements', 'designIntentReqs', 'artifacts'],
      properties: {
        protocolRequirements: { type: 'array', items: { type: 'object' } },
        designIntentReqs: { type: 'array', items: { type: 'object' } },
        timingRequirements: { type: 'array', items: { type: 'object' } },
        safetyProperties: { type: 'array', items: { type: 'string' } },
        livenessProperties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'requirements']
}));

export const sequenceDefinitionTask = defineTask('sequence-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Sequence Definition - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Define SVA sequences',
      context: args,
      instructions: [
        '1. Define protocol sequences',
        '2. Create handshake sequences',
        '3. Define timing sequences',
        '4. Create parameterized sequences',
        '5. Use sequence operators correctly',
        '6. Define local variables in sequences',
        '7. Create reusable sequences',
        '8. Document sequence behavior',
        '9. Organize sequence library',
        '10. Test sequence matching'
      ],
      outputFormat: 'JSON with sequence definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['sequenceCount', 'sequences', 'artifacts'],
      properties: {
        sequenceCount: { type: 'number' },
        sequences: { type: 'array', items: { type: 'object' } },
        parameterizedSequences: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'sequences']
}));

export const propertySpecificationTask = defineTask('property-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Property Specification - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Specify SVA properties',
      context: args,
      instructions: [
        '1. Define safety properties',
        '2. Define liveness properties',
        '3. Create protocol properties',
        '4. Use property operators',
        '5. Define parameterized properties',
        '6. Add property labels',
        '7. Ensure formal tool compatibility',
        '8. Document property intent',
        '9. Categorize properties',
        '10. Review property completeness'
      ],
      outputFormat: 'JSON with property specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['propertyCount', 'properties', 'categories', 'artifacts'],
      properties: {
        propertyCount: { type: 'number' },
        properties: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        formalCompatible: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'properties']
}));

export const concurrentAssertionTask = defineTask('concurrent-assertion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Concurrent Assertions - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Implement concurrent assertions',
      context: args,
      instructions: [
        '1. Create assert property statements',
        '2. Configure assertion severity',
        '3. Add failure messages',
        '4. Configure assertion control',
        '5. Use proper clock specification',
        '6. Handle reset correctly',
        '7. Add assertion labels',
        '8. Configure simulation vs formal',
        '9. Group related assertions',
        '10. Document assertion purpose'
      ],
      outputFormat: 'JSON with concurrent assertions'
    },
    outputSchema: {
      type: 'object',
      required: ['assertionCount', 'assertionFiles', 'artifacts'],
      properties: {
        assertionCount: { type: 'number' },
        assertionFiles: { type: 'array', items: { type: 'string' } },
        assertionsByCategory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'concurrent-assertions']
}));

export const immediateAssertionTask = defineTask('immediate-assertion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Immediate Assertions - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Implement immediate assertions',
      context: args,
      instructions: [
        '1. Create simple immediate assertions',
        '2. Create deferred assertions',
        '3. Add assertion messages',
        '4. Configure severity levels',
        '5. Place in procedural blocks',
        '6. Use for combinational checks',
        '7. Add input validation',
        '8. Document immediate assertions',
        '9. Test assertion triggering',
        '10. Organize by function'
      ],
      outputFormat: 'JSON with immediate assertions'
    },
    outputSchema: {
      type: 'object',
      required: ['assertionCount', 'artifacts'],
      properties: {
        assertionCount: { type: 'number' },
        immediateAssertions: { type: 'array', items: { type: 'object' } },
        deferredAssertions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'immediate-assertions']
}));

export const coverPropertyTask = defineTask('cover-property', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Cover Properties - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Implement cover properties',
      context: args,
      instructions: [
        '1. Create cover property statements',
        '2. Cover important scenarios',
        '3. Cover corner cases',
        '4. Cover state transitions',
        '5. Cover protocol sequences',
        '6. Add cover labels',
        '7. Define coverage goals',
        '8. Organize by feature',
        '9. Document coverage intent',
        '10. Link to verification plan'
      ],
      outputFormat: 'JSON with cover properties'
    },
    outputSchema: {
      type: 'object',
      required: ['coverCount', 'coverProperties', 'artifacts'],
      properties: {
        coverCount: { type: 'number' },
        coverProperties: { type: 'array', items: { type: 'object' } },
        coverageGoals: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'cover-properties']
}));

export const assumePropertyTask = defineTask('assume-property', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Assume Properties - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Define assume properties for inputs',
      context: args,
      instructions: [
        '1. Identify input constraints',
        '2. Create assume property statements',
        '3. Define valid input ranges',
        '4. Constrain protocol inputs',
        '5. Define timing assumptions',
        '6. Document assumptions',
        '7. Verify assumption completeness',
        '8. Ensure formal compatibility',
        '9. Organize assumptions',
        '10. Review with design team'
      ],
      outputFormat: 'JSON with assume properties'
    },
    outputSchema: {
      type: 'object',
      required: ['assumeCount', 'assumeProperties', 'artifacts'],
      properties: {
        assumeCount: { type: 'number' },
        assumeProperties: { type: 'array', items: { type: 'object' } },
        inputConstraints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'assume-properties']
}));

export const assertionLibraryTask = defineTask('assertion-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Assertion Library - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Organize assertion library',
      context: args,
      instructions: [
        '1. Create library module/package',
        '2. Organize by protocol',
        '3. Organize by function',
        '4. Create parameterized assertions',
        '5. Define assertion macros',
        '6. Add configuration options',
        '7. Document library usage',
        '8. Create usage examples',
        '9. Define severity defaults',
        '10. Test library compilation'
      ],
      outputFormat: 'JSON with library details'
    },
    outputSchema: {
      type: 'object',
      required: ['libraryPath', 'artifacts'],
      properties: {
        libraryPath: { type: 'string' },
        modules: { type: 'array', items: { type: 'string' } },
        macros: { type: 'array', items: { type: 'string' } },
        usageExamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'library']
}));

export const assertionBindTask = defineTask('assertion-bind', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Assertion Bind - ${args.designName}`,
  agent: {
    name: 'sva-engineer',
    prompt: {
      role: 'SVA Engineer',
      task: 'Create assertion bind module',
      context: args,
      instructions: [
        '1. Create bind statements',
        '2. Bind to target module',
        '3. Connect signals correctly',
        '4. Handle parameterization',
        '5. Create hierarchical binds',
        '6. Add compile guards',
        '7. Support multiple instances',
        '8. Document bind usage',
        '9. Test bind compilation',
        '10. Verify signal connections'
      ],
      outputFormat: 'JSON with bind module'
    },
    outputSchema: {
      type: 'object',
      required: ['bindFilePath', 'artifacts'],
      properties: {
        bindFilePath: { type: 'string' },
        bindStatements: { type: 'array', items: { type: 'object' } },
        targetModules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'bind']
}));

export const assertionVerificationTask = defineTask('assertion-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Assertion Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Verify assertion correctness',
      context: args,
      instructions: [
        '1. Compile assertions with design',
        '2. Run simulation with assertions',
        '3. Verify assertion triggering',
        '4. Test cover property hits',
        '5. Check false positives',
        '6. Check false negatives',
        '7. Verify formal proofs if applicable',
        '8. Document verification results',
        '9. Fix assertion bugs',
        '10. Generate verification report'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'status', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        status: { type: 'string' },
        assertionsFired: { type: 'number' },
        coverHits: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'sva', 'verification']
}));
