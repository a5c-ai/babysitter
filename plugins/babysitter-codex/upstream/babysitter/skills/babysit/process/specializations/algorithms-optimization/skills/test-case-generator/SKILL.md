---
name: test-case-generator
description: Generate comprehensive test cases including edge cases, stress tests, and counter-examples for algorithm correctness verification. Supports random generation, constraint-based generation, and brute force oracle comparison.
allowed-tools: Bash, Read, Write, Grep, Glob
metadata:
  author: babysitter-sdk
  version: "1.0"
  category: algorithms-optimization
  skill-id: SK-ALGO-008
  priority: high
---

# test-case-generator

A specialized skill for generating comprehensive test cases for algorithm verification, including edge cases, stress tests, random inputs, and counter-example finding through brute force oracle comparison.

## Purpose

Generate test cases for:
- Correctness verification against problem constraints
- Edge case identification and testing
- Stress testing with large inputs
- Counter-example finding for wrong solutions
- Brute force oracle generation for validation

## Capabilities

### Core Features

1. **Random Test Generation**
   - Generate inputs within specified constraints
   - Support for various data types (arrays, trees, graphs, strings)
   - Configurable distributions (uniform, normal, edge-biased)
   - Reproducible tests with seed values

2. **Edge Case Generation**
   - Minimum/maximum constraint values
   - Empty inputs, single elements
   - Sorted/reverse sorted sequences
   - All same elements, alternating patterns
   - Boundary conditions

3. **Stress Testing**
   - Maximum constraint inputs
   - Time limit verification
   - Memory limit testing
   - Performance regression detection

4. **Counter-Example Finding**
   - Compare against brute force oracle
   - Binary search on input size for minimal failing case
   - Automatic test case minimization
   - Difference reporting

5. **Data Structure Generation**
   - Arrays: random, sorted, nearly sorted, with duplicates
   - Trees: binary trees, BSTs, balanced, skewed
   - Graphs: sparse, dense, DAGs, with cycles
   - Strings: random, palindromes, patterns

## Integration Options

### CLI Tools

**QuickTest CLI** - Comprehensive CP testing tool:
```bash
npm install -g quicktest-cli

# Compare against brute force
qt cmp --solution solution.cpp --brute brute.cpp --gen gen.cpp

# Stress test for TLE
qt stress --solution solution.cpp --gen gen.cpp --time-limit 1000
```

**Stress Testing Script (7oSkaaa)**:
```bash
git clone https://github.com/7oSkaaa/Stress_Testing
# Provides: gen_array(), gen_tree(), gen_simple_graph()
```

### testlib.h (Codeforces Standard)

```cpp
#include "testlib.h"

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);

    int n = opt<int>("n", rnd.next(1, 100000));

    println(n);
    println(rnd.any(range(n), [](int) {
        return rnd.next(-1000000000, 1000000000);
    }));

    return 0;
}
```

## Usage

### Generate Random Test Cases

```bash
# Generate array test cases
test-case-generator array \
  --min-size 1 \
  --max-size 100000 \
  --min-value -1e9 \
  --max-value 1e9 \
  --count 100

# Generate graph test cases
test-case-generator graph \
  --nodes 1000 \
  --edges 5000 \
  --type undirected \
  --connected true
```

### Generate Edge Cases

```bash
# Automatic edge case generation
test-case-generator edge-cases --problem "two-sum" --constraints constraints.json

# Output includes:
# - Empty array []
# - Single element [x]
# - Two elements (match/no-match)
# - All same elements
# - Maximum array size
# - Maximum/minimum values
```

### Stress Testing

```bash
# Compare solution against brute force
test-case-generator stress \
  --solution solution.cpp \
  --brute brute.cpp \
  --iterations 1000 \
  --timeout 5000

# Output on failure:
# Found counter-example at iteration 47:
# Input: [3, 5, 2, 8, 1]
# Target: 6
# Expected: [0, 2]
# Actual: [1, 2]
```

### Find Minimal Counter-Example

```bash
# Binary search for smallest failing input
test-case-generator minimize \
  --solution solution.cpp \
  --brute brute.cpp \
  --failing-input large_input.txt

# Output:
# Original input size: 10000
# Minimal failing input size: 4
# Minimal input: [3, 1, 2, 4]
```

## Output Schema

```json
{
  "testCases": [
    {
      "id": "test_001",
      "category": "edge_case",
      "description": "Empty array",
      "input": {
        "arr": [],
        "target": 5
      },
      "expectedOutput": [],
      "tags": ["empty", "boundary"]
    },
    {
      "id": "test_002",
      "category": "random",
      "description": "Random array, n=1000",
      "input": {
        "arr": [...],
        "target": 12345
      },
      "expectedOutput": null,
      "oracle": "brute_force"
    }
  ],
  "metadata": {
    "generatedAt": "ISO8601",
    "seed": 42,
    "constraints": {
      "n": [1, 100000],
      "values": [-1e9, 1e9]
    }
  }
}
```

## Generator Templates

### Array Generator

```python
def generate_array(n_range=(1, 100000), value_range=(-1e9, 1e9), seed=None):
    """Generate random array within constraints."""
    if seed:
        random.seed(seed)
    n = random.randint(*n_range)
    return [random.randint(*value_range) for _ in range(n)]

def generate_edge_cases():
    """Generate common edge cases for array problems."""
    return [
        [],                          # Empty
        [0],                         # Single element
        [1, 1],                      # Two same
        [1, 2],                      # Two different
        list(range(100)),            # Sorted ascending
        list(range(100, 0, -1)),     # Sorted descending
        [5] * 100,                   # All same
        [10**9] * 1000,              # Max values
        [-10**9] * 1000,             # Min values
    ]
```

### Tree Generator

```python
def generate_tree(n, tree_type='random'):
    """Generate tree with n nodes."""
    if tree_type == 'random':
        return random_tree(n)
    elif tree_type == 'line':
        return [(i, i+1) for i in range(1, n)]
    elif tree_type == 'star':
        return [(1, i) for i in range(2, n+1)]
    elif tree_type == 'binary':
        return [(i, 2*i), (i, 2*i+1) for i in range(1, n//2+1)]
```

### Graph Generator

```python
def generate_graph(n, m, graph_type='undirected', connected=True):
    """Generate graph with n nodes and m edges."""
    edges = set()

    # Ensure connectivity with spanning tree
    if connected:
        nodes = list(range(1, n+1))
        random.shuffle(nodes)
        for i in range(1, n):
            u = nodes[random.randint(0, i-1)]
            v = nodes[i]
            edges.add((min(u,v), max(u,v)))

    # Add remaining edges
    while len(edges) < m:
        u, v = random.randint(1, n), random.randint(1, n)
        if u != v and (min(u,v), max(u,v)) not in edges:
            edges.add((min(u,v), max(u,v)))

    return list(edges)
```

## Stress Testing Workflow

```
1. Write solution.cpp (your solution)
2. Write brute.cpp (naive but correct)
3. Write gen.cpp (test generator)
4. Run stress test loop:
   - Generate input with gen.cpp
   - Run both solutions
   - Compare outputs
   - If different, report counter-example
5. If counter-example found:
   - Minimize input
   - Debug solution
   - Repeat
```

## Edge Case Categories

| Category | Examples |
|----------|----------|
| **Empty** | [], "", null |
| **Single** | [x], "a", single node |
| **Boundary** | n=1, n=max, value=min/max |
| **Duplicates** | All same, many duplicates |
| **Sorted** | Ascending, descending, nearly sorted |
| **Extremes** | INT_MAX, INT_MIN, 0 |
| **Special** | Palindrome, balanced, skewed |

## Integration with Processes

This skill enhances:
- `correctness-proof-testing` - Verify algorithm correctness
- `algorithm-implementation` - Test during development
- `leetcode-problem-solving` - Additional test coverage
- `upsolving` - Debug failed solutions

## References

- [QuickTest CLI](https://github.com/LuchoBazz/quicktest)
- [Stress Testing (7oSkaaa)](https://github.com/7oSkaaa/Stress_Testing)
- [testlib.h](https://github.com/MikeMirzayanov/testlib)
- [Competitive Programming Stress Testing](https://github.com/mrsac7/Competitive-Programming-Stress-Testing)
- [Test Case Generator](https://github.com/Tanmay-901/test-case-generator)

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `CONSTRAINT_VIOLATION` | Generated value out of range | Check constraint bounds |
| `TIMEOUT` | Generation taking too long | Reduce size or simplify |
| `MEMORY_EXCEEDED` | Too many test cases in memory | Stream to file |
| `ORACLE_FAILED` | Brute force solution crashed | Debug brute force |

## Best Practices

1. **Always test edge cases first** - Empty, single, boundary
2. **Use reproducible seeds** - For debugging failed cases
3. **Start small, scale up** - n=10, n=100, n=1000, ...
4. **Verify brute force** - Ensure oracle is definitely correct
5. **Minimize counter-examples** - Smaller inputs easier to debug
6. **Save failing inputs** - Keep a regression test suite
