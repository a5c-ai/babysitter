---
name: queuing-analyzer
description: Queuing theory analysis skill for analytical evaluation of waiting line systems.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: simulation
  backlog-id: SK-IE-007
---

# queuing-analyzer

You are **queuing-analyzer** - a specialized skill for analytical evaluation of waiting line systems using queuing theory.

## Overview

This skill enables AI-powered queuing analysis including:
- M/M/1, M/M/c, M/G/1 model calculations
- Steady-state performance measure computation (Lq, Wq, L, W)
- Server utilization analysis
- Probability calculations (wait time > threshold)
- Erlang C for call center staffing
- Finite population models
- Network of queues analysis

## Prerequisites

- Python 3.8+ with scipy, numpy
- Understanding of queuing notation

## Capabilities

### 1. M/M/1 Queue Analysis

```python
def mm1_queue(arrival_rate, service_rate):
    """
    M/M/1 queue performance measures
    - Poisson arrivals, exponential service, single server
    """
    lambda_ = arrival_rate
    mu = service_rate

    # Utilization
    rho = lambda_ / mu

    if rho >= 1:
        return {"error": "System unstable (rho >= 1)"}

    # Performance measures
    L = rho / (1 - rho)  # Expected number in system
    Lq = rho**2 / (1 - rho)  # Expected number in queue
    W = 1 / (mu - lambda_)  # Expected time in system
    Wq = rho / (mu - lambda_)  # Expected time in queue

    # Probabilities
    P0 = 1 - rho  # Probability system empty
    Pn = lambda n: (1 - rho) * rho**n  # Probability of n in system

    return {
        "model": "M/M/1",
        "arrival_rate": lambda_,
        "service_rate": mu,
        "utilization": rho,
        "L": L,
        "Lq": Lq,
        "W": W,
        "Wq": Wq,
        "P0": P0,
        "P_wait": rho,
        "stable": rho < 1
    }
```

### 2. M/M/c Queue Analysis

```python
from scipy.special import factorial
import numpy as np

def mmc_queue(arrival_rate, service_rate, num_servers):
    """
    M/M/c queue performance measures
    - Multiple parallel servers
    """
    lambda_ = arrival_rate
    mu = service_rate
    c = num_servers

    rho = lambda_ / (c * mu)

    if rho >= 1:
        return {"error": "System unstable (rho >= 1)"}

    # Calculate P0
    sum_term = sum((c * rho)**n / factorial(n) for n in range(c))
    last_term = (c * rho)**c / (factorial(c) * (1 - rho))
    P0 = 1 / (sum_term + last_term)

    # Erlang C formula (probability of waiting)
    C = ((c * rho)**c / factorial(c)) * (1 / (1 - rho)) * P0

    # Performance measures
    Lq = C * rho / (1 - rho)
    L = Lq + lambda_ / mu
    Wq = Lq / lambda_
    W = Wq + 1 / mu

    return {
        "model": "M/M/c",
        "arrival_rate": lambda_,
        "service_rate": mu,
        "servers": c,
        "utilization": rho,
        "L": L,
        "Lq": Lq,
        "W": W,
        "Wq": Wq,
        "P0": P0,
        "P_wait": C,
        "stable": rho < 1
    }
```

### 3. M/G/1 Queue (Pollaczek-Khinchin)

```python
def mg1_queue(arrival_rate, service_mean, service_variance):
    """
    M/G/1 queue using Pollaczek-Khinchin formula
    - General service time distribution
    """
    lambda_ = arrival_rate
    Es = service_mean
    Var_s = service_variance

    # Second moment of service time
    Es2 = Var_s + Es**2

    rho = lambda_ * Es

    if rho >= 1:
        return {"error": "System unstable (rho >= 1)"}

    # Pollaczek-Khinchin formula
    Lq = (lambda_**2 * Es2) / (2 * (1 - rho))
    L = Lq + rho
    Wq = Lq / lambda_
    W = Wq + Es

    return {
        "model": "M/G/1",
        "arrival_rate": lambda_,
        "service_mean": Es,
        "service_variance": Var_s,
        "utilization": rho,
        "L": L,
        "Lq": Lq,
        "W": W,
        "Wq": Wq,
        "stable": rho < 1
    }
```

### 4. Erlang C for Call Center Staffing

```python
def erlang_c_staffing(arrival_rate, service_rate, target_service_level,
                      target_wait_time):
    """
    Determine minimum servers for service level target
    """
    lambda_ = arrival_rate
    mu = service_rate

    # Minimum servers for stability
    min_servers = int(np.ceil(lambda_ / mu))

    for c in range(min_servers, min_servers + 100):
        result = mmc_queue(lambda_, mu, c)

        if result.get('error'):
            continue

        # Service level: P(wait <= target)
        # SL = 1 - C * exp(-(c*mu - lambda) * target_wait)
        C = result['P_wait']
        exp_term = np.exp(-(c * mu - lambda_) * target_wait_time)
        service_level = 1 - C * exp_term

        if service_level >= target_service_level:
            return {
                "recommended_servers": c,
                "achieved_service_level": service_level,
                "target_service_level": target_service_level,
                "P_wait": C,
                "utilization": result['utilization'],
                "avg_wait": result['Wq']
            }

    return {"error": "Could not achieve target service level"}
```

### 5. Finite Population (M/M/c/K/K)

```python
def finite_population_queue(arrival_rate, service_rate, num_servers,
                           population_size):
    """
    Finite population queue (machine repair model)
    """
    lambda_ = arrival_rate  # Per-customer arrival rate
    mu = service_rate
    c = num_servers
    K = population_size

    # State probabilities using recursion
    P = np.zeros(K + 1)
    P[0] = 1  # Temporary

    for n in range(1, K + 1):
        if n <= c:
            P[n] = P[n-1] * (K - n + 1) * lambda_ / (n * mu)
        else:
            P[n] = P[n-1] * (K - n + 1) * lambda_ / (c * mu)

    # Normalize
    P = P / P.sum()

    # Performance measures
    L = sum(n * P[n] for n in range(K + 1))
    Lq = sum((n - c) * P[n] for n in range(c + 1, K + 1))

    # Effective arrival rate
    lambda_eff = sum((K - n) * lambda_ * P[n] for n in range(K))

    W = L / lambda_eff if lambda_eff > 0 else 0
    Wq = Lq / lambda_eff if lambda_eff > 0 else 0

    return {
        "model": "M/M/c/K/K",
        "servers": c,
        "population": K,
        "L": L,
        "Lq": Lq,
        "W": W,
        "Wq": Wq,
        "effective_arrival_rate": lambda_eff,
        "state_probabilities": P.tolist()
    }
```

### 6. Network of Queues (Jackson Network)

```python
def jackson_network(arrival_rates, service_rates, routing_matrix):
    """
    Open Jackson network analysis
    arrival_rates: external arrivals to each node
    service_rates: service rate at each node
    routing_matrix: probability of routing from i to j
    """
    n_nodes = len(service_rates)

    # Solve for effective arrival rates
    # lambda_i = gamma_i + sum_j(lambda_j * r_ji)
    R = np.array(routing_matrix)
    gamma = np.array(arrival_rates)

    # lambda = gamma + lambda * R => lambda = gamma * (I - R)^-1
    I = np.eye(n_nodes)
    lambdas = np.linalg.solve((I - R.T), gamma)

    # Analyze each queue as M/M/1
    results = []
    for i in range(n_nodes):
        result = mm1_queue(lambdas[i], service_rates[i])
        result['node'] = i
        result['effective_arrival_rate'] = lambdas[i]
        results.append(result)

    # Network totals
    L_total = sum(r['L'] for r in results if 'L' in r)

    return {
        "model": "Jackson_Network",
        "effective_arrival_rates": lambdas.tolist(),
        "node_results": results,
        "total_L": L_total
    }
```

## Process Integration

This skill integrates with the following processes:
- `queuing-system-analysis.js`
- `capacity-planning-analysis.js`
- `discrete-event-simulation-modeling.js`

## Output Format

```json
{
  "model": "M/M/c",
  "parameters": {
    "arrival_rate": 10,
    "service_rate": 4,
    "servers": 3
  },
  "performance_measures": {
    "utilization": 0.833,
    "L": 6.01,
    "Lq": 3.51,
    "W": 0.601,
    "Wq": 0.351
  },
  "probabilities": {
    "P0": 0.045,
    "P_wait": 0.702
  },
  "service_level": {
    "P_wait_less_5min": 0.82
  },
  "recommendations": [
    "High utilization - consider adding server"
  ]
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| scipy | Scientific computing | Core calculations |
| queueing | Python package | Queue analysis |
| queuecomputer (R) | R package | Advanced models |
| Custom | Hand-coded | Specific needs |

## Best Practices

1. **Verify stability** - Check rho < 1 before computing
2. **Validate assumptions** - Test for Poisson arrivals
3. **Consider finite population** - When applicable
4. **Compare to simulation** - For complex systems
5. **Sensitivity analysis** - Test parameter variations
6. **Document notation** - Use Kendall notation

## Constraints

- Report all assumptions explicitly
- Flag unstable systems
- Document limitations of analytical models
- Recommend simulation for complex cases
