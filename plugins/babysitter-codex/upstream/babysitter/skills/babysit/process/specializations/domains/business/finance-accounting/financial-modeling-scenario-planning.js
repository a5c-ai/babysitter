/**
 * @file financial-modeling-scenario-planning.js
 * @description Building comprehensive financial models with sensitivity analysis, scenario planning, and Monte Carlo simulations for strategic decision support
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Financial Modeling and Scenario Planning Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.modelPurpose - Purpose of the model (strategic planning, investment analysis, etc.)
 * @param {Object} inputs.historicalData - Historical financial data for baseline
 * @param {Object} inputs.businessDrivers - Key business drivers and assumptions
 * @param {Array} inputs.scenarioDefinitions - Scenarios to model (base, upside, downside, etc.)
 * @param {Object} inputs.sensitivityVariables - Variables for sensitivity analysis
 * @param {Object} inputs.simulationParameters - Monte Carlo simulation parameters
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Comprehensive financial model with scenarios
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Model Architecture Design
  const architectureResult = await ctx.task(designModelArchitectureTask, {
    modelPurpose: inputs.modelPurpose,
    historicalData: inputs.historicalData,
    businessDrivers: inputs.businessDrivers
  });
  results.steps.push({ name: 'model-architecture', result: architectureResult });

  // Step 2: Build Base Financial Model
  const baseModelResult = await ctx.task(buildBaseModelTask, {
    architecture: architectureResult,
    historicalData: inputs.historicalData,
    businessDrivers: inputs.businessDrivers
  });
  results.steps.push({ name: 'base-model', result: baseModelResult });

  // Breakpoint for model structure review
  await ctx.breakpoint('model-review', {
    message: 'Review base model structure, formulas, and initial outputs before scenario development',
    data: baseModelResult
  });

  // Step 3: Validate Model Integrity
  const validationResult = await ctx.task(validateModelTask, {
    baseModel: baseModelResult,
    historicalData: inputs.historicalData
  });
  results.steps.push({ name: 'model-validation', result: validationResult });

  // Step 4: Develop Scenarios
  const scenariosResult = await ctx.task(developScenariosTask, {
    baseModel: baseModelResult,
    scenarioDefinitions: inputs.scenarioDefinitions,
    businessDrivers: inputs.businessDrivers
  });
  results.steps.push({ name: 'scenario-development', result: scenariosResult });

  // Step 5: Sensitivity Analysis
  const sensitivityResult = await ctx.task(performSensitivityAnalysisTask, {
    baseModel: baseModelResult,
    sensitivityVariables: inputs.sensitivityVariables
  });
  results.steps.push({ name: 'sensitivity-analysis', result: sensitivityResult });

  // Step 6: Monte Carlo Simulation
  const simulationResult = await ctx.task(runMonteCarloSimulationTask, {
    baseModel: baseModelResult,
    simulationParameters: inputs.simulationParameters
  });
  results.steps.push({ name: 'monte-carlo-simulation', result: simulationResult });

  // Breakpoint for analysis review
  await ctx.breakpoint('analysis-review', {
    message: 'Review scenario, sensitivity, and simulation results before finalizing',
    data: { scenarios: scenariosResult, sensitivity: sensitivityResult, simulation: simulationResult }
  });

  // Step 7: Prepare Decision Support Package
  const decisionPackageResult = await ctx.task(prepareDecisionPackageTask, {
    modelPurpose: inputs.modelPurpose,
    baseModel: baseModelResult,
    scenarios: scenariosResult,
    sensitivity: sensitivityResult,
    simulation: simulationResult
  });
  results.steps.push({ name: 'decision-package', result: decisionPackageResult });

  results.outputs = {
    financialModel: baseModelResult,
    scenarios: scenariosResult,
    sensitivityAnalysis: sensitivityResult,
    monteCarloResults: simulationResult,
    decisionPackage: decisionPackageResult
  };

  return results;
}

// Task definitions
export const designModelArchitectureTask = defineTask('design-model-architecture', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'model-architect',
    prompt: {
      system: 'You are a financial modeling expert who designs robust, flexible model architectures for strategic decision-making.',
      user: `Design a comprehensive financial model architecture.

Model purpose: ${args.modelPurpose}
Historical data available: ${JSON.stringify(args.historicalData)}
Key business drivers: ${JSON.stringify(args.businessDrivers)}

Design:
1. Model structure and organization
   - Input/assumption sheet design
   - Calculation engine layout
   - Output and dashboard structure
   - Scenario manager design

2. Driver hierarchy
   - Primary revenue drivers
   - Cost structure drivers
   - Capital requirements drivers
   - Working capital drivers

3. Financial statement integration
   - Income statement structure
   - Balance sheet linkages
   - Cash flow statement integration
   - Supporting schedules

4. Time periods and granularity
   - Historical periods
   - Projection periods
   - Monthly/quarterly/annual views

5. Model controls and checks
   - Balance checks
   - Reasonableness tests
   - Circular reference handling

Document architecture decisions and rationale.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const buildBaseModelTask = defineTask('build-base-model', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'model-builder',
    prompt: {
      system: 'You are a financial model builder who creates accurate, auditable financial models following best practices.',
      user: `Build the base financial model following the designed architecture.

Architecture: ${JSON.stringify(args.architecture)}
Historical data: ${JSON.stringify(args.historicalData)}
Business drivers: ${JSON.stringify(args.businessDrivers)}

Build:
1. Input Section
   - All assumption inputs clearly organized
   - Driver inputs with units and validation
   - Timing and switch inputs

2. Revenue Model
   - Driver-based revenue projections
   - Multiple revenue streams if applicable
   - Volume, price, and mix components

3. Cost Model
   - Variable costs linked to drivers
   - Fixed costs with inflation
   - Step costs and thresholds

4. Operating Model
   - Working capital calculations
   - Capital expenditure modeling
   - Depreciation and amortization

5. Financial Statements
   - Income statement
   - Balance sheet (balanced)
   - Cash flow statement
   - Supporting schedules

6. Key Metrics
   - Profitability metrics
   - Return metrics
   - Liquidity metrics
   - Valuation metrics

Ensure all formulas are auditable and documented.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const validateModelTask = defineTask('validate-model', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'model-auditor',
    prompt: {
      system: 'You are a financial model auditor who validates model integrity and accuracy.',
      user: `Validate the financial model for accuracy and integrity.

Base model: ${JSON.stringify(args.baseModel)}
Historical data for comparison: ${JSON.stringify(args.historicalData)}

Validation checks:
1. Structural Integrity
   - Balance sheet balances
   - Cash flow ties to balance sheet changes
   - No hard-coded values in formulas
   - Consistent time period handling

2. Historical Reconciliation
   - Model recreates historical results
   - Variances explained and documented

3. Formula Audit
   - Logic review of key formulas
   - Circular reference identification
   - Error value identification
   - Consistency across periods

4. Reasonableness Tests
   - Margin trends make sense
   - Growth rates are reasonable
   - Working capital relationships hold
   - Capital intensity is appropriate

5. Stress Testing
   - Model handles extreme inputs
   - No divide-by-zero errors
   - Negative scenarios work properly

Document all findings and required fixes.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developScenariosTask = defineTask('develop-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'scenario-planning' },
  agent: {
    name: 'scenario-planner',
    prompt: {
      system: 'You are a strategic scenario planner who develops comprehensive business scenarios for financial modeling.',
      user: `Develop detailed scenarios using the base model.

Base model: ${JSON.stringify(args.baseModel)}
Scenario definitions: ${JSON.stringify(args.scenarioDefinitions)}
Business drivers: ${JSON.stringify(args.businessDrivers)}

For each scenario:
1. Define narrative and context
   - Market conditions assumed
   - Competitive dynamics
   - Internal execution assumptions

2. Set driver assumptions
   - Revenue driver values
   - Cost driver values
   - Capital requirements
   - Working capital needs

3. Generate financial outputs
   - Complete financial statements
   - Key metrics comparison
   - Cash flow implications

4. Identify key differences from base
   - Material changes highlighted
   - Risk/opportunity assessment
   - Probability weighting

Typical scenarios to develop:
- Base case (most likely)
- Upside case (favorable conditions)
- Downside case (adverse conditions)
- Management case (with initiatives)
- Stress case (severe adverse)

Create scenario comparison summary.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performSensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      system: 'You are a financial analyst specializing in sensitivity analysis and driver impact assessment.',
      user: `Perform comprehensive sensitivity analysis on the financial model.

Base model: ${JSON.stringify(args.baseModel)}
Sensitivity variables: ${JSON.stringify(args.sensitivityVariables)}

Perform:
1. Single Variable Sensitivity (Tornado Analysis)
   - Test each key variable independently
   - Measure impact on key outputs (NPV, IRR, EBITDA, etc.)
   - Rank variables by impact
   - Create tornado diagram data

2. Two-Variable Sensitivity (Data Tables)
   - Test combinations of key variables
   - Create sensitivity matrices
   - Identify critical combinations

3. Breakeven Analysis
   - Find breakeven points for key metrics
   - Revenue breakeven
   - Volume breakeven
   - Price breakeven

4. Threshold Analysis
   - Identify values where outcomes flip
   - Covenant compliance thresholds
   - Investment hurdle rate thresholds

5. Driver Elasticity
   - Calculate elasticity of outcomes to inputs
   - Identify highest-leverage drivers

Present results in visual format for decision-making.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const runMonteCarloSimulationTask = defineTask('monte-carlo-simulation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'quantitative-analysis' },
  agent: {
    name: 'quant-analyst',
    prompt: {
      system: 'You are a quantitative analyst specializing in Monte Carlo simulations for financial modeling.',
      user: `Run Monte Carlo simulation on the financial model.

Base model: ${JSON.stringify(args.baseModel)}
Simulation parameters: ${JSON.stringify(args.simulationParameters)}

Configure simulation:
1. Define probability distributions for key inputs
   - Revenue growth (normal, triangular, etc.)
   - Margin assumptions
   - Cost inflation
   - Market conditions

2. Set correlation structure
   - Correlations between related variables
   - Economic factor correlations

3. Run simulation
   - Number of iterations (e.g., 10,000)
   - Random seed for reproducibility

4. Analyze results
   - Output distributions (NPV, IRR, cash flow)
   - Confidence intervals (10th, 50th, 90th percentile)
   - Probability of achieving targets
   - Value at Risk (VaR) metrics

5. Identify risk factors
   - Which inputs drive most variance
   - Tail risk scenarios
   - Correlation impacts

Present probability distributions and key statistics.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareDecisionPackageTask = defineTask('prepare-decision-package', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'executive-reporting' },
  agent: {
    name: 'decision-support-analyst',
    prompt: {
      system: 'You are a decision support analyst who prepares comprehensive analysis packages for executive decision-making.',
      user: `Prepare decision support package from financial modeling analysis.

Model purpose: ${args.modelPurpose}
Base model: ${JSON.stringify(args.baseModel)}
Scenarios: ${JSON.stringify(args.scenarios)}
Sensitivity analysis: ${JSON.stringify(args.sensitivity)}
Monte Carlo results: ${JSON.stringify(args.simulation)}

Create package with:
1. Executive Summary
   - Key findings and recommendations
   - Decision framework
   - Risk/reward assessment

2. Base Case Analysis
   - Financial projections
   - Key assumptions
   - Value creation metrics

3. Scenario Comparison
   - Side-by-side scenario comparison
   - Key differences highlighted
   - Probability-weighted expected value

4. Risk Analysis
   - Sensitivity tornado chart
   - Monte Carlo probability distributions
   - Key risk factors and mitigation

5. Decision Criteria
   - Investment hurdles analysis
   - Strategic alignment assessment
   - Risk-adjusted returns

6. Recommendations
   - Recommended course of action
   - Conditions/triggers for decisions
   - Monitoring metrics

7. Technical Appendix
   - Model documentation
   - Assumption sources
   - Methodology notes

Format for board/executive presentation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
