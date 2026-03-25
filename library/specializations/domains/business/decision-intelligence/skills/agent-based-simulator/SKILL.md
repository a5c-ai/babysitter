---
name: agent-based-simulator
description: Agent-based modeling skill for simulating complex adaptive systems with heterogeneous interacting agents
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: simulation
  priority: lower
  tools-libraries:
    - mesa
    - agentpy
    - pyNetLogo
---

# Agent-Based Simulator

## Overview

The Agent-Based Simulator skill provides capabilities for modeling complex adaptive systems through the simulation of heterogeneous, interacting agents. It enables bottom-up understanding of emergent market behaviors, customer dynamics, and competitive interactions for strategic decision support.

## Capabilities

- Agent definition and behavior modeling
- Environment and spatial modeling
- Interaction rules specification
- Emergent behavior observation
- Parameter sweeping
- Ensemble simulation runs
- Visualization and animation
- Statistical analysis of outcomes

## Used By Processes

- War Gaming and Competitive Response Modeling
- Market Sizing and Opportunity Assessment
- Customer Segmentation Analysis

## Usage

### Agent Definition

```python
# Define customer agent
customer_agent = {
    "type": "Customer",
    "attributes": {
        "budget": {"distribution": "normal", "mean": 1000, "std": 200},
        "brand_loyalty": {"distribution": "uniform", "min": 0, "max": 1},
        "price_sensitivity": {"distribution": "beta", "alpha": 2, "beta": 5},
        "preferred_features": ["list of features"]
    },
    "behaviors": {
        "purchase_decision": {
            "triggers": ["need_arises", "promotion_seen"],
            "evaluation": "weighted_utility",
            "factors": ["price", "quality", "brand_match"]
        },
        "word_of_mouth": {
            "probability": 0.3,
            "reach": {"distribution": "poisson", "lambda": 5},
            "sentiment_spread": True
        },
        "brand_switching": {
            "threshold": 0.7,
            "factors": ["satisfaction", "competitor_promotion"]
        }
    }
}
```

### Environment Definition

```python
# Define market environment
environment = {
    "topology": "network",  # or "grid", "continuous"
    "network_type": "small_world",
    "network_params": {"k": 6, "p": 0.1},
    "global_properties": {
        "economic_condition": {"initial": "normal", "transitions": "markov"},
        "market_size": 10000,
        "growth_rate": 0.02
    }
}
```

### Interaction Rules

```python
# Define interaction rules
interactions = {
    "customer_customer": {
        "information_sharing": {
            "probability": "based_on_relationship",
            "content": ["product_experience", "price_info"]
        },
        "social_influence": {
            "mechanism": "threshold_model",
            "threshold_distribution": "normal"
        }
    },
    "customer_company": {
        "purchase": {
            "frequency": "need_based",
            "channel": ["online", "physical", "hybrid"]
        },
        "complaint": {
            "trigger": "satisfaction < 0.3",
            "resolution_impact": 0.5
        }
    },
    "company_company": {
        "price_competition": "cournot|bertrand|stackelberg",
        "market_signaling": True
    }
}
```

### Simulation Configuration

```python
# Simulation settings
simulation_config = {
    "time_steps": 365,
    "agents": {
        "Customer": 5000,
        "Company": 3
    },
    "ensemble_runs": 100,
    "parameter_sweep": {
        "price_sensitivity_mean": [0.3, 0.5, 0.7],
        "word_of_mouth_probability": [0.1, 0.3, 0.5]
    },
    "data_collection": {
        "agent_level": ["satisfaction", "brand_choice"],
        "model_level": ["market_shares", "total_revenue", "gini_coefficient"]
    }
}
```

## Input Schema

```json
{
  "agents": {
    "agent_type": {
      "count": "number",
      "attributes": "object",
      "behaviors": "object"
    }
  },
  "environment": {
    "topology": "string",
    "properties": "object"
  },
  "interactions": "object",
  "simulation_config": {
    "time_steps": "number",
    "ensemble_runs": "number",
    "parameter_sweep": "object",
    "random_seed": "number"
  }
}
```

## Output Schema

```json
{
  "summary_statistics": {
    "metric_name": {
      "mean": "number",
      "std": "number",
      "percentiles": "object",
      "time_series": ["number"]
    }
  },
  "emergent_patterns": [
    {
      "pattern": "string",
      "frequency": "number",
      "conditions": "object"
    }
  ],
  "parameter_sweep_results": {
    "parameter_combination": {
      "outcomes": "object"
    }
  },
  "agent_trajectories": "object (sample)",
  "network_metrics": {
    "clustering_coefficient": "number",
    "average_path_length": "number",
    "degree_distribution": "object"
  },
  "visualization_paths": ["string"]
}
```

## Best Practices

1. Start with simple agents and add complexity incrementally
2. Validate agent behaviors against real-world observations
3. Use ensemble runs to account for stochastic variability
4. Perform sensitivity analysis on key parameters
5. Document all behavioral rules and their justification
6. Test for emergent behaviors under extreme conditions
7. Compare results with aggregate-level data when available

## Use Cases

| Use Case | Agent Types | Key Behaviors |
|----------|------------|---------------|
| Market Dynamics | Customers, Firms | Purchasing, Pricing |
| Innovation Diffusion | Adopters, Influencers | Adoption, Communication |
| Supply Chain | Suppliers, Distributors, Retailers | Ordering, Inventory |
| Opinion Formation | Citizens, Media | Influence, Information spread |

## Integration Points

- Connects with System Dynamics Modeler for hybrid approaches
- Feeds into War Game Orchestrator for competitive scenarios
- Supports Scenario Narrative Generator for storyline creation
- Integrates with Monte Carlo Engine for uncertainty propagation
