# tmuskal/arc-agi-benchmarker

- **Archetype**: claude-plugin-benchmark
- **Stars**: 0
- **Last pushed**: 2026-04-11 (recent)
- **License**: MIT
- **Discovered**: 2026-04-13
- **Skills found**: Multiple (ARC-AGI benchmarking skills)

## Summary
Claude Code plugin marketplace for proving AGI capabilities by testing claude-code setups against ARC-AGI-3 benchmarks. Features interactive grid-world pattern recognition puzzles, LongMemEval benchmarking for multi-session QA testing, and cross-harness comparison with competing AI tools (Codex, Gemini, OpenCode). Includes setup/validation, benchmark execution, test browsing, report generation, run comparison, and cross-harness workflow skills. Results stored locally in `.arc-agi-benchmarks/` with JSON-based scoring and replay logs.

## Assessment
HIGH VALUE for babysitter capability assessment. The ARC-AGI-3 benchmarking provides standardized AGI evaluation that could validate babysitter's problem-solving capabilities. The LongMemEval multi-session testing and cross-harness comparison functionality offer sophisticated benchmarking methodologies. The plugin-based extensibility with skill-driven UX and local result storage align well with babysitter's architecture. Self-benchmarking capabilities enable quantified performance assessment.

## Extraction Priority
- High
- Rationale: The AGI benchmarking methodology, multi-session evaluation patterns, and cross-harness comparison capabilities provide valuable frameworks for assessing babysitter's problem-solving and orchestration capabilities. The standardized evaluation approach could be essential for babysitter validation and improvement.

## Processes
- **ARC-AGI Pattern Recognition Benchmarking**: Interactive grid-world task evaluation for AI capability assessment
- **Multi-Session QA Evaluation**: Extended chat history testing with AI judge evaluation
- **Cross-Harness Capability Comparison**: Generate and compare results across competing AI tools
- **AGI Capability Self-Assessment**: Quantify local setup performance against published AGI benchmarks
- **Benchmark Result Management**: Store, analyze, and replay evaluation results with JSON-based scoring

## Plugin Ideas
- **ARC-AGI Integration**: Integration with ARC-AGI benchmark suite for standardized capability assessment

## Patterns
- Self-benchmarking marketplace framework
- Interactive grid-world pattern recognition
- Multi-session evaluation with extended context
- Cross-harness result generation and comparison
- Plugin-based extensibility with skill-driven UX
- Local result storage with JSON scoring
- Replay log capability for analysis
- Claude or GPT-4o judge evaluation

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| ARC-AGI Pattern Recognition Benchmarking | NEW | Interactive grid-world task evaluation for AI capability assessment | - | specializations/shared/arc-agi-pattern-recognition-benchmarking.js |
| Multi-Session QA Evaluation | NEW | Extended chat history testing with AI judge evaluation | - | specializations/shared/multi-session-qa-evaluation.js |
| Cross-Harness Capability Comparison | NEW | Generate and compare results across competing AI tools | - | specializations/shared/cross-harness-capability-comparison.js |
| AGI Capability Self-Assessment | NEW | Quantify local setup performance against published AGI benchmarks | - | methodologies/agi-capability-self-assessment/ |
| Benchmark Result Management | NEW | Store, analyze, and replay evaluation results with structured scoring | - | specializations/shared/benchmark-result-management.js |
| Interactive Puzzle Solving | NEW | Grid-world pattern recognition and problem-solving methodology | - | specializations/shared/interactive-puzzle-solving.js |
| AI Judge Evaluation | NEW | Automated evaluation using Claude or GPT-4o as scoring judge | - | specializations/shared/ai-judge-evaluation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| ARC-AGI Integration | NEW | Integration with ARC-AGI benchmark suite for standardized capability assessment | arc-agi-benchmarker | plugins/a5c/marketplace/plugins/arc-agi-integration/ |