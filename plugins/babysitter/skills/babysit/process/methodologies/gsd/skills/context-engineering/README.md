# context-engineering

Context window monitoring and budget management for GSD orchestration.

## Quick Start

Context engineering prevents context rot -- the quality degradation that occurs as the context window fills up. The orchestrator stays lean (15-30% usage) while subagents get fresh 200k-token context each.

### Check Current Usage

Context usage is estimated from cumulative tool output sizes and conversation history.

### Threshold Warnings

- **70%**: Warning - consider summarizing completed work
- **85%**: Critical - spawn new subagent for remaining work
- **95%**: Emergency - save state and exit immediately

### Plan Wave Budgets

Before executing a multi-wave phase, estimate context budget:
- Each agent spawn costs ~3% of orchestrator context
- Each agent result processing costs ~2%
- Total orchestrator usage should stay under 30%

## Examples

### Healthy Orchestrator Session

```
Tokens: ~35,000 / 200,000 (17.5%)
Status: HEALTHY
3 agent spawns completed, 2 remaining
Budget: on track (estimated total: 28%)
```

### Context Warning

```
[CONTEXT 70%] Warning: Context window at 70%.
Recommendation: Summarize completed wave results before spawning next wave.
```

### Emergency Wrap-Up

```
[CONTEXT 95%] Emergency: Context window at 95%.
Actions taken:
1. Updated STATE.md with current position
2. Committed all pending changes
3. Created continue-here.md with handoff context
```

## Troubleshooting

### Context fills too quickly
- Check if large files are being read in full (use targeted reads instead)
- Ensure agent results are being summarized, not passed verbatim
- Verify wave parallelization is enabled (reduces sequential context accumulation)

### Budget estimates are off
- Token estimation uses character/4 heuristic, which is approximate
- Adjust `agentSpawnCost` and `agentResultCost` in config if estimates are consistently wrong
- Consider using `quality` profile for complex work (fewer iterations = less context)

### Emergency threshold triggered too early
- Review orchestrator workflow for inline work that should be delegated to agents
- Increase summarization frequency between waves
- Consider splitting large phases into sub-phases
