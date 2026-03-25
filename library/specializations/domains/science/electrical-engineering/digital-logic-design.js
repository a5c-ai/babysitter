/**
 * @process specializations/domains/science/electrical-engineering/digital-logic-design
 * @description Digital Logic Design and Verification - Guide the design of digital logic circuits and state machines
 * using HDL languages. Covers RTL design, timing analysis, synthesis, and verification for FPGAs and ASICs.
 * @inputs { designName: string, targetPlatform: string, functionalRequirements: object, timingConstraints?: object }
 * @outputs { success: boolean, rtlCode: object, verificationResults: object, synthesisResults: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/digital-logic-design', {
 *   designName: 'UART Controller',
 *   targetPlatform: 'FPGA-Xilinx',
 *   functionalRequirements: { baudRates: ['9600', '115200'], dataBits: 8, parity: 'configurable' },
 *   timingConstraints: { clockFrequency: '100MHz', setupTime: '2ns' }
 * });
 *
 * @references
 * - IEEE 1364 (Verilog)
 * - IEEE 1076 (VHDL)
 * - IEEE 1800 (SystemVerilog)
 * - Xilinx Vivado Design Guidelines
 * - Intel Quartus Prime Documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    targetPlatform,
    functionalRequirements,
    timingConstraints = {}
  } = inputs;

  // Phase 1: Define Functional and Timing Requirements
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    designName,
    targetPlatform,
    functionalRequirements,
    timingConstraints
  });

  // Quality Gate: Requirements must be complete
  if (!requirementsAnalysis.complete) {
    return {
      success: false,
      error: 'Functional requirements incomplete',
      phase: 'requirements-analysis',
      missingRequirements: requirementsAnalysis.missingItems
    };
  }

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Review functional and timing requirements for ${designName}. Proceed with architecture design?`,
    title: 'Requirements Review',
    context: {
      runId: ctx.runId,
      designName,
      requirements: requirementsAnalysis.finalRequirements,
      files: [{
        path: `artifacts/phase1-requirements.json`,
        format: 'json',
        content: requirementsAnalysis
      }]
    }
  });

  // Phase 2: Create Block Diagrams and Architecture Specification
  const architectureDesign = await ctx.task(architectureDesignTask, {
    designName,
    targetPlatform,
    requirements: requirementsAnalysis.finalRequirements
  });

  // Phase 3: Write RTL Code in Verilog/VHDL/SystemVerilog
  const rtlDevelopment = await ctx.task(rtlDevelopmentTask, {
    designName,
    architecture: architectureDesign.architecture,
    requirements: requirementsAnalysis.finalRequirements,
    targetPlatform
  });

  // Breakpoint: Review RTL code
  await ctx.breakpoint({
    question: `Review RTL code for ${designName}. Code follows ${rtlDevelopment.hdlLanguage} coding standards. Proceed with verification?`,
    title: 'RTL Code Review',
    context: {
      runId: ctx.runId,
      hdlLanguage: rtlDevelopment.hdlLanguage,
      modules: rtlDevelopment.modules,
      files: [{
        path: `artifacts/phase3-rtl-code.json`,
        format: 'json',
        content: rtlDevelopment
      }]
    }
  });

  // Phase 4: Develop Testbenches and Verification Plans
  const verificationPlanning = await ctx.task(verificationPlanningTask, {
    designName,
    rtlModules: rtlDevelopment.modules,
    requirements: requirementsAnalysis.finalRequirements,
    architecture: architectureDesign.architecture
  });

  // Phase 5: Simulate and Verify Functionality
  const functionalSimulation = await ctx.task(functionalSimulationTask, {
    designName,
    rtlCode: rtlDevelopment.rtlCode,
    testbenches: verificationPlanning.testbenches,
    verificationPlan: verificationPlanning.plan
  });

  // Quality Gate: Functional verification must pass
  if (!functionalSimulation.allTestsPassed) {
    await ctx.breakpoint({
      question: `Functional verification found ${functionalSimulation.failedTests.length} failing tests. Debug and fix before proceeding?`,
      title: 'Verification Failures',
      context: {
        runId: ctx.runId,
        passedTests: functionalSimulation.passedTests,
        failedTests: functionalSimulation.failedTests,
        coverage: functionalSimulation.coverage
      }
    });
  }

  // Phase 6: Synthesize and Analyze Timing Reports
  const synthesisAnalysis = await ctx.task(synthesisAnalysisTask, {
    designName,
    rtlCode: rtlDevelopment.rtlCode,
    targetPlatform,
    timingConstraints: requirementsAnalysis.finalRequirements.timing
  });

  // Quality Gate: Timing must be met
  if (!synthesisAnalysis.timingMet) {
    await ctx.breakpoint({
      question: `Timing analysis shows violations. Worst negative slack: ${synthesisAnalysis.worstSlack}. Optimize timing?`,
      title: 'Timing Violations',
      context: {
        runId: ctx.runId,
        timingReport: synthesisAnalysis.timingReport,
        violations: synthesisAnalysis.violations,
        recommendations: synthesisAnalysis.optimizationRecommendations
      }
    });
  }

  // Phase 7: Optimize for Power, Performance, and Area (PPA)
  const ppaOptimization = await ctx.task(ppaOptimizationTask, {
    designName,
    rtlCode: rtlDevelopment.rtlCode,
    synthesisResults: synthesisAnalysis.results,
    targetPlatform,
    requirements: requirementsAnalysis.finalRequirements
  });

  // Phase 8: Generate Implementation Constraints and Documentation
  const implementationDocumentation = await ctx.task(implementationDocumentationTask, {
    designName,
    targetPlatform,
    requirementsAnalysis,
    architectureDesign,
    rtlDevelopment,
    verificationPlanning,
    functionalSimulation,
    synthesisAnalysis,
    ppaOptimization
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Digital logic design complete for ${designName}. Verification ${functionalSimulation.allTestsPassed ? 'PASSED' : 'PARTIAL'}. Timing ${synthesisAnalysis.timingMet ? 'MET' : 'NOT MET'}. Approve for release?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      designName,
      verificationSummary: functionalSimulation.summary,
      synthesisMetrics: synthesisAnalysis.metrics,
      ppaMetrics: ppaOptimization.metrics,
      files: [
        { path: `artifacts/final-rtl.json`, format: 'json', content: ppaOptimization.optimizedRtl },
        { path: `artifacts/design-report.md`, format: 'markdown', content: implementationDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    designName,
    targetPlatform,
    rtlCode: {
      language: rtlDevelopment.hdlLanguage,
      modules: ppaOptimization.optimizedRtl || rtlDevelopment.rtlCode,
      hierarchy: rtlDevelopment.hierarchy
    },
    verificationResults: {
      allTestsPassed: functionalSimulation.allTestsPassed,
      testSummary: functionalSimulation.summary,
      coverage: functionalSimulation.coverage
    },
    synthesisResults: {
      timingMet: synthesisAnalysis.timingMet,
      resourceUtilization: synthesisAnalysis.resourceUtilization,
      powerEstimate: synthesisAnalysis.powerEstimate,
      ppaMetrics: ppaOptimization.metrics
    },
    documentation: implementationDocumentation.document,
    constraints: implementationDocumentation.constraints,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/digital-logic-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'Digital Design Engineer with expertise in requirements specification',
      task: 'Analyze and define functional and timing requirements for digital logic design',
      context: {
        designName: args.designName,
        targetPlatform: args.targetPlatform,
        functionalRequirements: args.functionalRequirements,
        timingConstraints: args.timingConstraints
      },
      instructions: [
        '1. Analyze functional requirements for completeness (inputs, outputs, behavior)',
        '2. Define timing requirements (clock domains, setup/hold times, latency)',
        '3. Identify interface specifications (protocols, bus widths, signaling)',
        '4. Define reset and initialization requirements',
        '5. Specify power and area constraints if applicable',
        '6. Identify clock domain crossings and synchronization needs',
        '7. Define error handling and fault tolerance requirements',
        '8. Document testability requirements (JTAG, scan chains)',
        '9. Identify platform-specific constraints (FPGA resources, IO standards)',
        '10. Create requirements traceability matrix'
      ],
      outputFormat: 'JSON object with complete requirements specification'
    },
    outputSchema: {
      type: 'object',
      required: ['complete', 'finalRequirements'],
      properties: {
        complete: { type: 'boolean' },
        finalRequirements: {
          type: 'object',
          properties: {
            functional: { type: 'object' },
            timing: { type: 'object' },
            interfaces: { type: 'array', items: { type: 'object' } },
            power: { type: 'object' },
            testability: { type: 'object' }
          }
        },
        missingItems: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        traceabilityMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'requirements']
}));

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Architecture Design - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'Digital System Architect with expertise in RTL design',
      task: 'Create block diagrams and architecture specification for digital design',
      context: {
        designName: args.designName,
        targetPlatform: args.targetPlatform,
        requirements: args.requirements
      },
      instructions: [
        '1. Create top-level block diagram showing major functional blocks',
        '2. Define module hierarchy and partitioning',
        '3. Specify interfaces between modules (signals, buses, protocols)',
        '4. Define state machine structures for control logic',
        '5. Identify datapath elements (registers, ALUs, multiplexers)',
        '6. Plan clock distribution and domain structure',
        '7. Define memory architecture (register files, FIFOs, RAMs)',
        '8. Plan pipeline stages if applicable',
        '9. Identify reusable IP blocks and design patterns',
        '10. Document microarchitecture decisions and rationale'
      ],
      outputFormat: 'JSON object with complete architecture specification'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'moduleHierarchy'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            blockDiagram: { type: 'string' },
            functionalBlocks: { type: 'array', items: { type: 'object' } },
            interfaces: { type: 'array', items: { type: 'object' } },
            clockDomains: { type: 'array', items: { type: 'object' } }
          }
        },
        moduleHierarchy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              parent: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        stateMachines: { type: 'array', items: { type: 'object' } },
        datapath: { type: 'object' },
        memoryMap: { type: 'object' },
        designPatterns: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'architecture']
}));

export const rtlDevelopmentTask = defineTask('rtl-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: RTL Development - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'RTL Design Engineer with expertise in Verilog/VHDL/SystemVerilog',
      task: 'Write RTL code implementing the architecture specification',
      context: {
        designName: args.designName,
        architecture: args.architecture,
        requirements: args.requirements,
        targetPlatform: args.targetPlatform
      },
      instructions: [
        '1. Select appropriate HDL language (Verilog, VHDL, SystemVerilog)',
        '2. Implement top-level module with port definitions',
        '3. Code sub-modules following hierarchy specification',
        '4. Implement state machines using recommended coding styles',
        '5. Code datapath with proper pipelining and timing',
        '6. Implement clock domain crossing logic safely',
        '7. Add reset synchronization and initialization logic',
        '8. Follow coding guidelines for synthesis (no latches, full case, etc.)',
        '9. Add appropriate comments and documentation',
        '10. Create parameterized modules for reusability'
      ],
      outputFormat: 'JSON object with RTL code and module descriptions'
    },
    outputSchema: {
      type: 'object',
      required: ['hdlLanguage', 'rtlCode', 'modules'],
      properties: {
        hdlLanguage: { type: 'string', enum: ['Verilog', 'VHDL', 'SystemVerilog'] },
        rtlCode: {
          type: 'object',
          properties: {
            topModule: { type: 'string' },
            subModules: { type: 'array', items: { type: 'object' } }
          }
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              ports: { type: 'array', items: { type: 'object' } },
              parameters: { type: 'array', items: { type: 'object' } },
              description: { type: 'string' }
            }
          }
        },
        hierarchy: { type: 'object' },
        codingStandards: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'rtl']
}));

export const verificationPlanningTask = defineTask('verification-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Verification Planning - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'Verification Engineer with expertise in UVM and functional verification',
      task: 'Develop testbenches and verification plans for the RTL design',
      context: {
        designName: args.designName,
        rtlModules: args.rtlModules,
        requirements: args.requirements,
        architecture: args.architecture
      },
      instructions: [
        '1. Create verification plan with coverage goals',
        '2. Define test scenarios for all functional requirements',
        '3. Design testbench architecture (drivers, monitors, scoreboards)',
        '4. Develop stimulus generation strategy (directed and constrained random)',
        '5. Define functional coverage points',
        '6. Create assertions for protocol and interface checking',
        '7. Plan regression test suite',
        '8. Define pass/fail criteria for each test',
        '9. Identify corner cases and boundary conditions',
        '10. Document verification closure criteria'
      ],
      outputFormat: 'JSON object with verification plan and testbenches'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'testbenches'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            coverageGoals: { type: 'object' },
            testScenarios: { type: 'array', items: { type: 'object' } },
            closureCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        testbenches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dut: { type: 'string' },
              testCases: { type: 'array', items: { type: 'string' } },
              code: { type: 'string' }
            }
          }
        },
        assertions: { type: 'array', items: { type: 'object' } },
        coverageModel: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'verification']
}));

export const functionalSimulationTask = defineTask('functional-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Functional Simulation - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'Verification Engineer with expertise in simulation and debug',
      task: 'Execute simulations and verify functional correctness',
      context: {
        designName: args.designName,
        rtlCode: args.rtlCode,
        testbenches: args.testbenches,
        verificationPlan: args.verificationPlan
      },
      instructions: [
        '1. Run all test cases in verification plan',
        '2. Collect and analyze functional coverage',
        '3. Debug failing tests and identify root causes',
        '4. Verify assertion results',
        '5. Analyze waveforms for protocol compliance',
        '6. Check for simulation warnings and errors',
        '7. Verify timing behavior in functional simulation',
        '8. Run corner case and stress tests',
        '9. Generate coverage reports',
        '10. Document test results and remaining coverage gaps'
      ],
      outputFormat: 'JSON object with simulation results and coverage'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'passedTests', 'failedTests', 'coverage'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        passedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'string' },
              result: { type: 'string' }
            }
          }
        },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              failure: { type: 'string' },
              rootCause: { type: 'string' }
            }
          }
        },
        coverage: {
          type: 'object',
          properties: {
            codeCoverage: { type: 'number' },
            functionalCoverage: { type: 'number' },
            assertionCoverage: { type: 'number' }
          }
        },
        summary: { type: 'string' },
        coverageGaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'simulation']
}));

export const synthesisAnalysisTask = defineTask('synthesis-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Synthesis and Timing Analysis - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'FPGA/ASIC Implementation Engineer with expertise in synthesis',
      task: 'Synthesize design and analyze timing reports',
      context: {
        designName: args.designName,
        rtlCode: args.rtlCode,
        targetPlatform: args.targetPlatform,
        timingConstraints: args.timingConstraints
      },
      instructions: [
        '1. Create synthesis constraints (clocks, I/O timing, false paths)',
        '2. Run synthesis and analyze results',
        '3. Review timing reports for setup and hold violations',
        '4. Analyze critical paths and timing margins',
        '5. Check resource utilization (LUTs, FFs, BRAMs, DSPs)',
        '6. Estimate power consumption',
        '7. Identify synthesis warnings and optimizations',
        '8. Review inferred logic (RAMs, DSPs, carry chains)',
        '9. Analyze clock domain crossing reports',
        '10. Provide timing optimization recommendations'
      ],
      outputFormat: 'JSON object with synthesis and timing results'
    },
    outputSchema: {
      type: 'object',
      required: ['timingMet', 'results', 'resourceUtilization'],
      properties: {
        timingMet: { type: 'boolean' },
        worstSlack: { type: 'string' },
        results: {
          type: 'object',
          properties: {
            setupSlack: { type: 'string' },
            holdSlack: { type: 'string' },
            criticalPaths: { type: 'array', items: { type: 'object' } }
          }
        },
        resourceUtilization: {
          type: 'object',
          properties: {
            luts: { type: 'string' },
            registers: { type: 'string' },
            brams: { type: 'string' },
            dsps: { type: 'string' }
          }
        },
        powerEstimate: { type: 'object' },
        timingReport: { type: 'object' },
        violations: { type: 'array', items: { type: 'object' } },
        optimizationRecommendations: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'synthesis', 'timing']
}));

export const ppaOptimizationTask = defineTask('ppa-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: PPA Optimization - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'RTL Optimization Engineer specializing in PPA trade-offs',
      task: 'Optimize design for power, performance, and area',
      context: {
        designName: args.designName,
        rtlCode: args.rtlCode,
        synthesisResults: args.synthesisResults,
        targetPlatform: args.targetPlatform,
        requirements: args.requirements
      },
      instructions: [
        '1. Analyze PPA bottlenecks from synthesis results',
        '2. Apply timing optimization techniques (retiming, pipelining)',
        '3. Optimize area through resource sharing and logic minimization',
        '4. Apply power optimization (clock gating, operand isolation)',
        '5. Balance PPA trade-offs based on requirements',
        '6. Re-synthesize and verify improvements',
        '7. Ensure timing closure after optimizations',
        '8. Document optimization techniques applied',
        '9. Verify functional equivalence after changes',
        '10. Generate final PPA metrics report'
      ],
      outputFormat: 'JSON object with optimization results and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedRtl', 'metrics'],
      properties: {
        optimizedRtl: { type: 'object' },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              target: { type: 'string' },
              improvement: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            power: { type: 'object' },
            performance: { type: 'object' },
            area: { type: 'object' }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        equivalenceVerified: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'optimization', 'ppa']
}));

export const implementationDocumentationTask = defineTask('implementation-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Implementation Documentation - ${args.designName}`,
  agent: {
    name: 'digital-design-engineer',
    prompt: {
      role: 'Technical Documentation Specialist for Digital Design',
      task: 'Generate implementation constraints and comprehensive documentation',
      context: {
        designName: args.designName,
        targetPlatform: args.targetPlatform,
        requirementsAnalysis: args.requirementsAnalysis,
        architectureDesign: args.architectureDesign,
        rtlDevelopment: args.rtlDevelopment,
        verificationPlanning: args.verificationPlanning,
        functionalSimulation: args.functionalSimulation,
        synthesisAnalysis: args.synthesisAnalysis,
        ppaOptimization: args.ppaOptimization
      },
      instructions: [
        '1. Create design specification document',
        '2. Document architecture and microarchitecture',
        '3. Generate timing constraints file (SDC/XDC)',
        '4. Document I/O assignments and pin constraints',
        '5. Create programming guide for configuration',
        '6. Document verification results and coverage',
        '7. Generate release notes with known issues',
        '8. Create integration guide for system designers',
        '9. Document synthesis and implementation settings',
        '10. Generate both structured JSON and markdown reports'
      ],
      outputFormat: 'JSON object with complete documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'constraints', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            designSpecification: { type: 'object' },
            architectureDescription: { type: 'string' },
            verificationSummary: { type: 'object' },
            implementationGuide: { type: 'string' },
            releaseNotes: { type: 'object' }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            pinAssignments: { type: 'object' },
            synthesis: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        designFiles: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'digital', 'hdl', 'documentation']
}));
