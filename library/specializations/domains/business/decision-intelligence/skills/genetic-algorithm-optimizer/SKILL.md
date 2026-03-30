---
name: genetic-algorithm-optimizer
description: Genetic algorithm skill for complex optimization problems with non-linear objectives or discontinuous search spaces
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: optimization
  priority: lower
  tools-libraries:
    - DEAP
    - pymoo
    - geneticalgorithm
---

# Genetic Algorithm Optimizer

## Overview

The Genetic Algorithm Optimizer skill provides evolutionary computation capabilities for solving complex optimization problems that are difficult for traditional methods. It handles non-linear, non-convex, discontinuous, and multi-objective optimization through biologically-inspired search strategies.

## Capabilities

- Chromosome encoding (binary, real, permutation)
- Selection operators (tournament, roulette, rank)
- Crossover and mutation operations
- Multi-objective optimization (NSGA-II, NSGA-III)
- Constraint handling
- Parameter tuning guidance
- Convergence monitoring
- Pareto front visualization

## Used By Processes

- Prescriptive Analytics and Optimization
- Strategic Portfolio Optimization
- Design Optimization

## Usage

### Problem Definition

```python
# Define optimization problem
ga_problem = {
    "name": "Portfolio Optimization",
    "encoding": "real",  # or "binary", "permutation", "integer"
    "variables": {
        "asset_weights": {
            "count": 10,
            "bounds": [0, 1],
            "constraint": "sum_to_one"
        }
    },
    "objectives": [
        {
            "name": "maximize_return",
            "function": "portfolio_return(weights, expected_returns)",
            "direction": "maximize"
        },
        {
            "name": "minimize_risk",
            "function": "portfolio_volatility(weights, covariance_matrix)",
            "direction": "minimize"
        }
    ],
    "constraints": [
        {
            "name": "min_diversification",
            "expression": "max(weights) <= 0.25",
            "type": "inequality"
        },
        {
            "name": "sector_limit",
            "expression": "sum(tech_weights) <= 0.40",
            "type": "inequality"
        }
    ]
}
```

### GA Configuration

```python
# Genetic algorithm parameters
ga_config = {
    "population_size": 200,
    "generations": 500,
    "selection": {
        "method": "tournament",
        "tournament_size": 3
    },
    "crossover": {
        "method": "simulated_binary",  # for real encoding
        "probability": 0.9,
        "eta": 15  # distribution index
    },
    "mutation": {
        "method": "polynomial",
        "probability": 0.1,
        "eta": 20
    },
    "elitism": 0.05,  # preserve top 5%
    "constraint_handling": "penalty",  # or "repair", "feasibility_rules"
    "termination": {
        "max_generations": 500,
        "convergence_threshold": 1e-6,
        "stall_generations": 50
    }
}
```

### Multi-Objective Configuration (NSGA-II)

```python
# NSGA-II settings
nsga_config = {
    "algorithm": "NSGA-II",
    "population_size": 100,
    "reference_directions": "auto",  # for NSGA-III
    "diversity_mechanism": "crowding_distance",
    "archive": {
        "enabled": True,
        "max_size": 200
    }
}
```

## Encoding Types

| Encoding | Best For | Operators |
|----------|----------|-----------|
| Binary | Feature selection, discrete choices | One-point, two-point crossover |
| Real | Continuous optimization | SBX, polynomial mutation |
| Permutation | Sequencing, TSP | PMX, order crossover |
| Integer | Discrete with ranges | Uniform crossover |

## Selection Methods

| Method | Description | Pressure |
|--------|-------------|----------|
| Tournament | Random subset competition | Adjustable |
| Roulette | Probability proportional to fitness | High |
| Rank | Probability based on rank | Moderate |
| Stochastic Universal | Even selection distribution | Low |

## Input Schema

```json
{
  "problem": {
    "encoding": "string",
    "variables": "object",
    "objectives": ["object"],
    "constraints": ["object"]
  },
  "ga_config": {
    "population_size": "number",
    "generations": "number",
    "selection": "object",
    "crossover": "object",
    "mutation": "object"
  },
  "multi_objective": {
    "algorithm": "NSGA-II|NSGA-III|MOEA/D",
    "reference_directions": "object"
  },
  "output_options": {
    "save_history": "boolean",
    "pareto_front": "boolean",
    "convergence_plot": "boolean"
  }
}
```

## Output Schema

```json
{
  "best_solution": {
    "variables": "object",
    "objectives": "object",
    "constraint_violation": "number"
  },
  "pareto_front": [
    {
      "variables": "object",
      "objectives": "object"
    }
  ],
  "convergence": {
    "generations": ["number"],
    "best_fitness": ["number"],
    "average_fitness": ["number"],
    "diversity": ["number"]
  },
  "statistics": {
    "total_evaluations": "number",
    "feasible_solutions": "number",
    "hypervolume": "number (multi-objective)"
  },
  "visualization_paths": ["string"]
}
```

## Best Practices

1. Start with larger population for complex landscapes
2. Balance exploration (mutation) and exploitation (crossover)
3. Use problem-specific operators when possible
4. Monitor diversity to avoid premature convergence
5. Run multiple times with different seeds
6. Validate solutions with domain expertise
7. Consider hybrid approaches (GA + local search)

## Constraint Handling

| Method | Description | Use When |
|--------|-------------|----------|
| Penalty | Add penalty term to fitness | Simple constraints |
| Repair | Fix infeasible solutions | Structure known |
| Feasibility Rules | Feasible > infeasible | Many constraints |
| Separate handling | Tournament with constraints | Multi-objective |

## Multi-Objective Interpretation

For Pareto-optimal solutions:
- All solutions on the front are non-dominated
- Trade-offs exist between objectives
- Decision-maker selects based on preferences
- Use hypervolume for algorithm comparison

## Integration Points

- Feeds into Strategic Options Analyst for strategy optimization
- Connects with Sensitivity Analyzer for robustness testing
- Supports Optimization Specialist agent
- Integrates with Decision Visualization for Pareto fronts
