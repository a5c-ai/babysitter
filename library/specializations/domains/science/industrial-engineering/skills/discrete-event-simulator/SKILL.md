---
name: discrete-event-simulator
description: Discrete event simulation skill for modeling and analyzing complex systems with stochastic processes.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: simulation
  backlog-id: SK-IE-005
---

# discrete-event-simulator

You are **discrete-event-simulator** - a specialized skill for building and analyzing discrete event simulation models for complex systems with stochastic processes.

## Overview

This skill enables AI-powered discrete event simulation including:
- Process flow modeling with SimPy
- Entity generation with statistical distributions
- Resource capacity modeling
- Queue discipline implementation (FIFO, priority, etc.)
- Simulation warm-up period detection
- Output statistics with confidence intervals
- Animation and visualization generation

## Prerequisites

- Python 3.8+ with SimPy installed
- Statistical libraries (scipy, numpy)
- Visualization libraries (matplotlib, plotly)

## Capabilities

### 1. Basic SimPy Model

```python
import simpy
import numpy as np

def manufacturing_system(env, arrival_rate, service_rate, num_machines):
    """
    Simple manufacturing system simulation
    """
    machines = simpy.Resource(env, capacity=num_machines)

    # Statistics collection
    wait_times = []
    system_times = []

    def customer(env, name, machines):
        arrival_time = env.now

        with machines.request() as request:
            yield request
            wait_time = env.now - arrival_time
            wait_times.append(wait_time)

            # Service time
            service_time = np.random.exponential(1/service_rate)
            yield env.timeout(service_time)

            system_times.append(env.now - arrival_time)

    def customer_generator(env, arrival_rate, machines):
        customer_id = 0
        while True:
            yield env.timeout(np.random.exponential(1/arrival_rate))
            customer_id += 1
            env.process(customer(env, f"Customer_{customer_id}", machines))

    env.process(customer_generator(env, arrival_rate, machines))
    env.run(until=1000)

    return {
        "avg_wait_time": np.mean(wait_times),
        "avg_system_time": np.mean(system_times),
        "max_wait_time": np.max(wait_times),
        "customers_served": len(wait_times)
    }
```

### 2. Complex Process Flow

```python
class ManufacturingLine:
    """
    Multi-stage manufacturing line with buffers
    """
    def __init__(self, env, config):
        self.env = env
        self.config = config

        # Create resources
        self.stations = {
            name: simpy.Resource(env, capacity=cap)
            for name, cap in config['stations'].items()
        }

        # Buffers between stations
        self.buffers = {
            name: simpy.Container(env, capacity=cap, init=0)
            for name, cap in config['buffers'].items()
        }

        # Statistics
        self.stats = {
            'throughput': 0,
            'wip': [],
            'utilization': {s: [] for s in self.stations}
        }

    def part_flow(self, part_id):
        """Process a part through all stations"""
        for station_name in self.config['routing']:
            station = self.stations[station_name]

            with station.request() as req:
                yield req

                # Record utilization
                self.stats['utilization'][station_name].append(
                    station.count / station.capacity
                )

                # Process time
                process_time = self.config['process_times'][station_name]()
                yield self.env.timeout(process_time)

        self.stats['throughput'] += 1

    def part_arrivals(self):
        """Generate arriving parts"""
        part_id = 0
        while True:
            yield self.env.timeout(self.config['interarrival_time']())
            part_id += 1
            self.env.process(self.part_flow(part_id))
            self.stats['wip'].append(sum(s.count for s in self.stations.values()))
```

### 3. Queue Disciplines

```python
class PriorityQueue:
    """
    Priority queue resource for SimPy
    """
    def __init__(self, env, capacity):
        self.env = env
        self.capacity = capacity
        self.queue = []
        self.available = capacity

    def request(self, priority=0):
        return PriorityRequest(self, priority)

class PriorityRequest:
    def __init__(self, resource, priority):
        self.resource = resource
        self.priority = priority
        self.event = resource.env.event()

    def __enter__(self):
        if self.resource.available > 0:
            self.resource.available -= 1
            self.event.succeed()
        else:
            # Insert by priority (lower = higher priority)
            heapq.heappush(self.resource.queue,
                          (self.priority, self.event))
        return self.event

    def __exit__(self, *args):
        self.resource.available += 1
        if self.resource.queue:
            _, waiting_event = heapq.heappop(self.resource.queue)
            waiting_event.succeed()
```

### 4. Warm-up Detection

```python
def welch_warmup_detection(data, window_size=50):
    """
    Welch's method for detecting warm-up period
    """
    n = len(data)
    moving_avg = []

    for i in range(n - window_size + 1):
        moving_avg.append(np.mean(data[i:i+window_size]))

    # Find convergence point
    threshold = 0.01 * np.std(moving_avg)
    converged = False
    warmup_end = 0

    for i in range(len(moving_avg) - 1):
        if abs(moving_avg[i+1] - moving_avg[i]) < threshold:
            if not converged:
                warmup_end = i
                converged = True
        else:
            converged = False

    return warmup_end * window_size

def run_with_warmup(env, model, warmup_time, run_time):
    """
    Run simulation with warm-up period removal
    """
    env.run(until=warmup_time)
    model.reset_statistics()
    env.run(until=warmup_time + run_time)
    return model.get_statistics()
```

### 5. Output Analysis with Confidence Intervals

```python
def replicated_runs(model_func, num_replications, confidence=0.95):
    """
    Run multiple replications and compute confidence intervals
    """
    results = []

    for rep in range(num_replications):
        env = simpy.Environment()
        result = model_func(env, seed=rep)
        results.append(result)

    # Compute statistics
    means = {key: np.mean([r[key] for r in results])
             for key in results[0].keys()}

    stds = {key: np.std([r[key] for r in results], ddof=1)
            for key in results[0].keys()}

    # Confidence intervals
    from scipy import stats
    t_value = stats.t.ppf((1 + confidence) / 2, num_replications - 1)

    ci = {key: (means[key] - t_value * stds[key] / np.sqrt(num_replications),
                means[key] + t_value * stds[key] / np.sqrt(num_replications))
          for key in means.keys()}

    return {
        "means": means,
        "std_devs": stds,
        "confidence_intervals": ci,
        "num_replications": num_replications
    }
```

## Process Integration

This skill integrates with the following processes:
- `discrete-event-simulation-modeling.js`
- `queuing-system-analysis.js`
- `capacity-planning-analysis.js`

## Output Format

```json
{
  "model_name": "Manufacturing_Line",
  "simulation_time": 10000,
  "replications": 30,
  "warmup_time": 1000,
  "performance_measures": {
    "throughput": {
      "mean": 245.3,
      "std": 12.4,
      "ci_95": [240.1, 250.5]
    },
    "avg_wait_time": {
      "mean": 5.2,
      "std": 0.8,
      "ci_95": [4.9, 5.5]
    },
    "utilization": {
      "station_1": 0.82,
      "station_2": 0.91
    }
  },
  "bottleneck": "station_2",
  "recommendations": [
    "Consider adding capacity at station_2"
  ]
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| SimPy | DES framework | General simulation |
| Ciw | Queue networks | Service systems |
| salabim | Animation | Visual models |
| scipy.stats | Statistics | Output analysis |

## Best Practices

1. **Validate with analytical results** - Test against known solutions
2. **Remove warm-up bias** - Use proper initialization
3. **Run sufficient replications** - Target narrow CIs
4. **Document assumptions** - Record all distributions
5. **Verify random streams** - Use independent seeds
6. **Analyze output carefully** - Check for non-stationarity

## Constraints

- Report confidence intervals, not just point estimates
- Document all random number streams
- Validate model behavior incrementally
- Use appropriate run lengths
