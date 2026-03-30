/**
 * @process specializations/domains/science/electrical-engineering/digital-filter-design
 * @description Digital Filter Design - Guide the design of digital filters including FIR, IIR, and adaptive filters.
 * Covers specification, design methods, stability analysis, and implementation considerations.
 * @inputs { filterName: string, filterType: string, specifications: object, implementationTarget?: string }
 * @outputs { success: boolean, filterDesign: object, coefficients: object, analysis: object, implementation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/digital-filter-design', {
 *   filterName: 'Anti-Aliasing Lowpass',
 *   filterType: 'FIR-lowpass',
 *   specifications: { passband: '10kHz', stopband: '12kHz', passbandRipple: '0.1dB', stopbandAtten: '60dB' },
 *   implementationTarget: 'FPGA'
 * });
 *
 * @references
 * - IEEE Signal Processing Guidelines
 * - MATLAB Filter Designer Documentation
 * - Digital Filter Design Methodologies
 * - Fixed-Point Filter Implementation Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    filterName,
    filterType,
    specifications,
    implementationTarget = 'software'
  } = inputs;

  // Phase 1: Define Filter Specifications
  const specificationDefinition = await ctx.task(specificationDefinitionTask, {
    filterName,
    filterType,
    specifications
  });

  // Quality Gate: Specifications must be realizable
  if (!specificationDefinition.realizable) {
    return {
      success: false,
      error: 'Filter specifications are not realizable',
      phase: 'specification-definition',
      issues: specificationDefinition.issues
    };
  }

  // Phase 2: Select Filter Type
  const filterTypeSelection = await ctx.task(filterTypeSelectionTask, {
    filterName,
    filterType,
    specifications: specificationDefinition.finalSpecs,
    implementationTarget
  });

  // Breakpoint: Review filter type selection
  await ctx.breakpoint({
    question: `Filter type selected: ${filterTypeSelection.selectedType}. Order estimate: ${filterTypeSelection.orderEstimate}. Proceed with design?`,
    title: 'Filter Type Review',
    context: {
      runId: ctx.runId,
      filterName,
      selection: filterTypeSelection,
      files: [{
        path: `artifacts/phase2-selection.json`,
        format: 'json',
        content: filterTypeSelection
      }]
    }
  });

  // Phase 3: Choose Design Method
  const designMethodSelection = await ctx.task(designMethodSelectionTask, {
    filterName,
    filterType: filterTypeSelection.selectedType,
    specifications: specificationDefinition.finalSpecs,
    orderEstimate: filterTypeSelection.orderEstimate
  });

  // Phase 4: Calculate Filter Coefficients
  const coefficientCalculation = await ctx.task(coefficientCalculationTask, {
    filterName,
    filterType: filterTypeSelection.selectedType,
    designMethod: designMethodSelection.method,
    specifications: specificationDefinition.finalSpecs
  });

  // Phase 5: Analyze Frequency Response and Phase Characteristics
  const responseAnalysis = await ctx.task(responseAnalysisTask, {
    filterName,
    coefficients: coefficientCalculation.coefficients,
    filterType: filterTypeSelection.selectedType,
    specifications: specificationDefinition.finalSpecs
  });

  // Breakpoint: Review frequency response
  await ctx.breakpoint({
    question: `Review frequency response for ${filterName}. Specifications ${responseAnalysis.meetsSpecs ? 'MET' : 'NOT MET'}. Proceed with stability analysis?`,
    title: 'Response Analysis Review',
    context: {
      runId: ctx.runId,
      responseMetrics: responseAnalysis.metrics,
      files: [{
        path: `artifacts/phase5-response.json`,
        format: 'json',
        content: responseAnalysis
      }]
    }
  });

  // Phase 6: Verify Stability (for IIR filters)
  const stabilityAnalysis = await ctx.task(stabilityAnalysisTask, {
    filterName,
    coefficients: coefficientCalculation.coefficients,
    filterType: filterTypeSelection.selectedType
  });

  // Quality Gate: Filter must be stable
  if (!stabilityAnalysis.stable) {
    await ctx.breakpoint({
      question: `Stability analysis indicates unstable filter. ${stabilityAnalysis.stabilityIssues.length} poles outside unit circle. Redesign required?`,
      title: 'Stability Issue',
      context: {
        runId: ctx.runId,
        stabilityIssues: stabilityAnalysis.stabilityIssues,
        recommendations: stabilityAnalysis.recommendations
      }
    });
  }

  // Phase 7: Implement and Test Filter Structure
  const filterImplementation = await ctx.task(filterImplementationTask, {
    filterName,
    coefficients: coefficientCalculation.coefficients,
    filterType: filterTypeSelection.selectedType,
    implementationTarget
  });

  // Phase 8: Optimize for Fixed-Point Implementation
  const fixedPointOptimization = await ctx.task(fixedPointOptimizationTask, {
    filterName,
    implementation: filterImplementation.implementation,
    coefficients: coefficientCalculation.coefficients,
    implementationTarget,
    specifications: specificationDefinition.finalSpecs
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Digital filter design complete for ${filterName}. Order: ${coefficientCalculation.filterOrder}. Fixed-point SQNR: ${fixedPointOptimization.sqnr}. Approve design?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      filterName,
      designSummary: {
        type: filterTypeSelection.selectedType,
        order: coefficientCalculation.filterOrder,
        stable: stabilityAnalysis.stable,
        meetsSpecs: responseAnalysis.meetsSpecs
      },
      files: [
        { path: `artifacts/filter-coefficients.json`, format: 'json', content: coefficientCalculation.coefficients },
        { path: `artifacts/filter-report.md`, format: 'markdown', content: fixedPointOptimization.markdown }
      ]
    }
  });

  return {
    success: true,
    filterName,
    filterDesign: {
      type: filterTypeSelection.selectedType,
      method: designMethodSelection.method,
      order: coefficientCalculation.filterOrder,
      structure: filterImplementation.structure
    },
    coefficients: {
      floatingPoint: coefficientCalculation.coefficients,
      fixedPoint: fixedPointOptimization.fixedPointCoefficients,
      wordLength: fixedPointOptimization.wordLength
    },
    analysis: {
      frequencyResponse: responseAnalysis.frequencyResponse,
      phaseResponse: responseAnalysis.phaseResponse,
      groupDelay: responseAnalysis.groupDelay,
      stability: stabilityAnalysis
    },
    implementation: {
      target: implementationTarget,
      structure: filterImplementation.structure,
      resourceEstimate: filterImplementation.resourceEstimate,
      fixedPointPerformance: fixedPointOptimization.performance
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/digital-filter-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const specificationDefinitionTask = defineTask('specification-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Specification Definition - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Filter Design Engineer',
      task: 'Define and validate filter specifications',
      context: {
        filterName: args.filterName,
        filterType: args.filterType,
        specifications: args.specifications
      },
      instructions: [
        '1. Parse filter type (lowpass, highpass, bandpass, bandstop, multiband)',
        '2. Define passband frequency/frequencies and ripple',
        '3. Define stopband frequency/frequencies and attenuation',
        '4. Normalize frequencies to sampling rate',
        '5. Check specification realizability',
        '6. Calculate transition bandwidth',
        '7. Estimate minimum filter order',
        '8. Define phase requirements (linear phase, minimum phase)',
        '9. Document any specification trade-offs',
        '10. Create complete specification document'
      ],
      outputFormat: 'JSON object with filter specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['realizable', 'finalSpecs'],
      properties: {
        realizable: { type: 'boolean' },
        finalSpecs: {
          type: 'object',
          properties: {
            responseType: { type: 'string' },
            passbandEdge: { type: 'array', items: { type: 'number' } },
            stopbandEdge: { type: 'array', items: { type: 'number' } },
            passbandRipple: { type: 'number' },
            stopbandAttenuation: { type: 'number' },
            samplingFrequency: { type: 'number' },
            phaseRequirement: { type: 'string' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        transitionBandwidth: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'specification']
}));

export const filterTypeSelectionTask = defineTask('filter-type-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Filter Type Selection - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Filter Design Specialist',
      task: 'Select optimal filter type (FIR vs IIR)',
      context: {
        filterName: args.filterName,
        filterType: args.filterType,
        specifications: args.specifications,
        implementationTarget: args.implementationTarget
      },
      instructions: [
        '1. Evaluate FIR vs IIR trade-offs for application',
        '2. Consider linear phase requirements (favors FIR)',
        '3. Consider computational efficiency (may favor IIR)',
        '4. Evaluate stability concerns (FIR always stable)',
        '5. Consider fixed-point implementation (coefficient sensitivity)',
        '6. Estimate filter order for both types',
        '7. Consider latency requirements',
        '8. Evaluate memory requirements',
        '9. Make recommendation with justification',
        '10. Document selection criteria and decision'
      ],
      outputFormat: 'JSON object with filter type selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedType', 'orderEstimate'],
      properties: {
        selectedType: { type: 'string', enum: ['FIR', 'IIR'] },
        orderEstimate: { type: 'number' },
        firAnalysis: {
          type: 'object',
          properties: {
            estimatedOrder: { type: 'number' },
            pros: { type: 'array', items: { type: 'string' } },
            cons: { type: 'array', items: { type: 'string' } }
          }
        },
        iirAnalysis: {
          type: 'object',
          properties: {
            estimatedOrder: { type: 'number' },
            pros: { type: 'array', items: { type: 'string' } },
            cons: { type: 'array', items: { type: 'string' } }
          }
        },
        justification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'selection']
}));

export const designMethodSelectionTask = defineTask('design-method-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Design Method Selection - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Filter Design Engineer',
      task: 'Choose appropriate filter design method',
      context: {
        filterName: args.filterName,
        filterType: args.filterType,
        specifications: args.specifications,
        orderEstimate: args.orderEstimate
      },
      instructions: [
        '1. For FIR: Consider windowing, Parks-McClellan, frequency sampling',
        '2. For IIR: Consider Butterworth, Chebyshev I/II, Elliptic, Bessel',
        '3. Evaluate method suitability for specifications',
        '4. Consider optimization criteria (equiripple, monotonic, etc.)',
        '5. Evaluate design complexity and computation',
        '6. Consider coefficient sensitivity for IIR methods',
        '7. Evaluate phase characteristics of each method',
        '8. Select optimal design method',
        '9. Document method parameters',
        '10. Justify method selection'
      ],
      outputFormat: 'JSON object with design method selection'
    },
    outputSchema: {
      type: 'object',
      required: ['method'],
      properties: {
        method: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            parameters: { type: 'object' },
            characteristics: { type: 'array', items: { type: 'string' } }
          }
        },
        alternativeMethods: { type: 'array', items: { type: 'object' } },
        justification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'design-method']
}));

export const coefficientCalculationTask = defineTask('coefficient-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Coefficient Calculation - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Filter Design Engineer',
      task: 'Calculate filter coefficients using selected method',
      context: {
        filterName: args.filterName,
        filterType: args.filterType,
        designMethod: args.designMethod,
        specifications: args.specifications
      },
      instructions: [
        '1. Apply selected design method algorithm',
        '2. Calculate filter order meeting specifications',
        '3. Compute filter coefficients (numerator/denominator or FIR taps)',
        '4. For IIR: Compute second-order section (SOS) representation',
        '5. Verify coefficient precision requirements',
        '6. Document coefficient values',
        '7. Calculate coefficient dynamic range',
        '8. Identify coefficient scaling requirements',
        '9. Generate coefficient arrays for implementation',
        '10. Document calculation methodology'
      ],
      outputFormat: 'JSON object with filter coefficients'
    },
    outputSchema: {
      type: 'object',
      required: ['coefficients', 'filterOrder'],
      properties: {
        coefficients: {
          type: 'object',
          properties: {
            numerator: { type: 'array', items: { type: 'number' } },
            denominator: { type: 'array', items: { type: 'number' } },
            sos: { type: 'array', items: { type: 'array' } },
            gain: { type: 'number' }
          }
        },
        filterOrder: { type: 'number' },
        coefficientRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        symmetry: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'coefficients']
}));

export const responseAnalysisTask = defineTask('response-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Response Analysis - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Filter Analysis Engineer',
      task: 'Analyze frequency response and phase characteristics',
      context: {
        filterName: args.filterName,
        coefficients: args.coefficients,
        filterType: args.filterType,
        specifications: args.specifications
      },
      instructions: [
        '1. Calculate magnitude frequency response',
        '2. Verify passband ripple meets specification',
        '3. Verify stopband attenuation meets specification',
        '4. Calculate phase response',
        '5. Calculate group delay',
        '6. Identify any phase distortion concerns',
        '7. Verify transition band characteristics',
        '8. Calculate impulse response',
        '9. Compare response to specifications',
        '10. Document analysis results'
      ],
      outputFormat: 'JSON object with response analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsSpecs', 'metrics', 'frequencyResponse'],
      properties: {
        meetsSpecs: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            passbandRipple: { type: 'string' },
            stopbandAttenuation: { type: 'string' },
            transitionWidth: { type: 'string' },
            maxGroupDelayVariation: { type: 'string' }
          }
        },
        frequencyResponse: { type: 'object' },
        phaseResponse: { type: 'object' },
        groupDelay: { type: 'object' },
        impulseResponse: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'analysis']
}));

export const stabilityAnalysisTask = defineTask('stability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stability Analysis - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Control Systems/DSP Engineer',
      task: 'Verify filter stability (especially for IIR filters)',
      context: {
        filterName: args.filterName,
        coefficients: args.coefficients,
        filterType: args.filterType
      },
      instructions: [
        '1. Calculate pole locations (for IIR filters)',
        '2. Verify all poles are inside unit circle',
        '3. Calculate stability margin (distance from unit circle)',
        '4. Analyze potential for limit cycles in fixed-point',
        '5. Check for coefficient sensitivity to quantization',
        '6. Evaluate cascade vs. parallel structure for stability',
        '7. Recommend SOS ordering for best numerical properties',
        '8. Analyze zero locations for phase characteristics',
        '9. Document stability analysis results',
        '10. Provide recommendations if stability concerns exist'
      ],
      outputFormat: 'JSON object with stability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stable'],
      properties: {
        stable: { type: 'boolean' },
        poles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              real: { type: 'number' },
              imag: { type: 'number' },
              magnitude: { type: 'number' }
            }
          }
        },
        zeros: { type: 'array', items: { type: 'object' } },
        stabilityMargin: { type: 'string' },
        stabilityIssues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        sosOrdering: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'stability']
}));

export const filterImplementationTask = defineTask('filter-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Filter Implementation - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Implementation Engineer',
      task: 'Implement and test filter structure',
      context: {
        filterName: args.filterName,
        coefficients: args.coefficients,
        filterType: args.filterType,
        implementationTarget: args.implementationTarget
      },
      instructions: [
        '1. Select implementation structure (Direct Form I/II, Transposed, Cascade, Parallel)',
        '2. For FIR: Choose symmetric/antisymmetric optimizations',
        '3. For IIR: Implement as cascaded second-order sections',
        '4. Implement efficient multiply-accumulate operations',
        '5. Design state variable storage',
        '6. Implement coefficient storage',
        '7. Test with impulse response',
        '8. Verify against theoretical response',
        '9. Estimate computational resources',
        '10. Document implementation structure'
      ],
      outputFormat: 'JSON object with filter implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'structure', 'resourceEstimate'],
      properties: {
        implementation: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            stateVariables: { type: 'number' },
            multiplications: { type: 'number' },
            additions: { type: 'number' }
          }
        },
        structure: { type: 'string' },
        resourceEstimate: {
          type: 'object',
          properties: {
            mips: { type: 'string' },
            memory: { type: 'string' },
            latency: { type: 'string' }
          }
        },
        testResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'implementation']
}));

export const fixedPointOptimizationTask = defineTask('fixed-point-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Fixed-Point Optimization - ${args.filterName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Fixed-Point DSP Engineer',
      task: 'Optimize filter for fixed-point implementation',
      context: {
        filterName: args.filterName,
        implementation: args.implementation,
        coefficients: args.coefficients,
        implementationTarget: args.implementationTarget,
        specifications: args.specifications
      },
      instructions: [
        '1. Determine coefficient word length requirements',
        '2. Scale coefficients for fixed-point representation',
        '3. Determine data word length for states and signals',
        '4. Implement coefficient quantization',
        '5. Analyze quantization noise contribution',
        '6. Calculate signal-to-quantization-noise ratio (SQNR)',
        '7. Verify filter still meets specifications',
        '8. Optimize for target hardware (DSP, FPGA, etc.)',
        '9. Generate fixed-point coefficient arrays',
        '10. Document fixed-point implementation details'
      ],
      outputFormat: 'JSON object with fixed-point optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['fixedPointCoefficients', 'wordLength', 'sqnr', 'performance'],
      properties: {
        fixedPointCoefficients: {
          type: 'object',
          properties: {
            values: { type: 'array', items: { type: 'number' } },
            format: { type: 'string' },
            scaleFactor: { type: 'number' }
          }
        },
        wordLength: {
          type: 'object',
          properties: {
            coefficients: { type: 'number' },
            data: { type: 'number' },
            accumulator: { type: 'number' }
          }
        },
        sqnr: { type: 'string' },
        performance: {
          type: 'object',
          properties: {
            passbandRipple: { type: 'string' },
            stopbandAttenuation: { type: 'string' },
            meetsSpecs: { type: 'boolean' }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'filter', 'fixed-point']
}));
