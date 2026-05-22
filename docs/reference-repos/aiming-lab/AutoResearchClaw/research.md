# aiming-lab/AutoResearchClaw

**Repository**: https://github.com/aiming-lab/AutoResearchClaw  
**Stars**: 11,057 ⭐  
**License**: MIT  
**Language**: Python  
**Archetype**: Autonomous Research Pipeline  
**Processing Date**: 2026-04-13

## Overview

AutoResearchClaw is a fully autonomous 23-stage research pipeline that transforms a single research idea into a conference-ready paper with no human intervention required. It represents one of the most comprehensive end-to-end automated research systems, integrating literature review, experiment design, execution, analysis, and paper writing.

## Repository Structure

```
AutoResearchClaw/
├── .claude/                 # Claude Code integration
├── researchclaw/           # Core pipeline implementation
├── docs/                   # Documentation and guides
│   ├── HITL_GUIDE.md      # Human-in-the-Loop guide
│   ├── showcase/          # Generated paper examples
│   └── integration-guide.md
├── scripts/               # Setup and utility scripts
├── prompts.default.yaml   # LLM prompts for all stages
└── config.researchclaw.example.yaml # Configuration template
```

## 23-Stage Research Pipeline

### Literature & Foundation (Stages 1-6)
1. **Idea Refinement** - Topic clarification and scope definition
2. **Literature Search** - OpenAlex, Semantic Scholar, arXiv integration
3. **Literature Analysis** - Citation analysis and gap identification
4. **Research Question Formation** - Hypothesis generation
5. **Methodology Design** - Experimental approach planning
6. **Related Work Synthesis** - Background section creation

### Experimentation & Development (Stages 7-13)
7. **Environment Setup** - Hardware-aware sandbox configuration
8. **Code Generation** - Implementation with external CLI agent delegation
9. **Experiment Design** - Statistical methodology planning
10. **Data Collection** - Automated data gathering
11. **Experiment Execution** - GPU/MPS/CPU auto-detection
12. **Results Analysis** - Statistical validation
13. **Visualization** - Figure and chart generation

### Quality & Validation (Stages 14-19)
14. **Multi-Agent Peer Review** - CodeAgent, BenchmarkAgent, FigureAgent
15. **4-Round Quality Audit** - AI-slop detection, 7-dimension scoring
16. **NeurIPS Checklist Validation** - Conference standard compliance
17. **Citation Verification** - Anti-fabrication system
18. **Claim Validation** - Anti-hallucination verification
19. **Reproducibility Check** - Code and data validation

### Paper Production (Stages 20-23)
20. **Draft Generation** - Section-by-section writing
21. **LaTeX Compilation** - Conference-ready formatting
22. **Final Review** - Human-AI collaborative editing
23. **Submission Package** - Complete paper with supplements

## Key Features & Innovations

### Human-in-the-Loop (HITL) System
- **6 Intervention Modes**: full-auto, gate-only, checkpoint, step-by-step, co-pilot, custom
- **SmartPause**: Confidence-driven dynamic intervention
- **Idea Workshop**: Hypothesis co-creation
- **Baseline Navigator**: Experiment design review
- **Paper Co-Writer**: Collaborative drafting
- **ALHF**: Intervention learning from human feedback

### Multi-Agent Architecture
- **CodeAgent**: Code generation and validation
- **BenchmarkAgent**: Performance evaluation
- **FigureAgent**: Visualization creation
- **Multi-agent debate**: Consensus building across agents

### Quality Assurance
- **Anti-fabrication system**: VerifiedRegistry + diagnosis loop
- **Citation verification**: Real literature from academic databases
- **7-dimension review scoring**: Comprehensive quality metrics
- **AI-slop detection**: Academic writing quality control

### Cross-Platform Integration
- **ACP-compatible backends**: Claude Code, Codex CLI, Copilot CLI, Gemini CLI, Kimi CLI
- **OpenClaw bridge**: Discord, Telegram, Lark, WeChat support
- **Beast Mode**: Complex code generation routing to OpenCode
- **MetaClaw integration**: Cross-run learning and skill accumulation

## Skills System (19+ Skills)

Pre-loaded skills covering:
- Scientific writing methodologies
- Experiment design patterns
- Chemistry and biology domain knowledge
- Statistical analysis techniques
- A-Evolve agentic evolution (community contributed)

Custom skills via:
```bash
researchclaw skills install
# or drop SKILL.md into .claude/skills/
```

## Extractable Processes

### Research Orchestration Patterns
1. **23-stage pipeline architecture** - Complete research lifecycle
2. **Multi-agent consensus building** - Collaborative validation
3. **Human-AI intervention points** - Strategic collaboration patterns
4. **Dynamic confidence assessment** - Automated quality gating

### Quality Assurance Frameworks
1. **Multi-layer validation** - Technical, academic, and reproducibility checks
2. **Citation verification pipelines** - Anti-fabrication safeguards
3. **7-dimension quality scoring** - Comprehensive evaluation metrics
4. **Conference compliance checking** - Automated standard validation

### Literature Integration Methods
1. **Multi-source literature aggregation** - OpenAlex, Semantic Scholar, arXiv
2. **Citation analysis workflows** - Gap identification and positioning
3. **Related work synthesis** - Automated background generation
4. **Real-time verification** - Anti-hallucination for references

### Experiment Automation
1. **Hardware-aware execution** - GPU/MPS/CPU auto-detection
2. **Sandbox environment management** - Isolated experiment execution
3. **Statistical validation pipelines** - Automated analysis workflows
4. **Reproducibility frameworks** - Code and data validation

## Technology Stack

- **Python 3.11+** with modern async/await patterns
- **Docker sandbox** with network-policy-aware execution
- **OpenAlex, Semantic Scholar, arXiv** for literature
- **LaTeX compilation** for paper generation
- **Multi-LLM support** with provider abstraction
- **CLI agent integration** for complex code generation

## Value for Babysitter Marketplace

**Very High Value** - This repository contains one of the most sophisticated automated research pipelines available, with extensive orchestration patterns for:
- Multi-stage workflow coordination
- Human-AI collaboration frameworks
- Quality assurance and validation systems
- Literature integration and verification
- Academic standard compliance

### Key Extractable Elements
- 23-stage pipeline orchestration patterns
- Multi-agent consensus building mechanisms
- Human-in-the-loop intervention strategies
- Quality evaluation and validation frameworks
- Literature integration and citation verification
- Academic writing and compliance automation

## Classification

**Category**: Autonomous Research System  
**Subcategory**: Academic Paper Generation Pipeline  
**Complexity**: Research-grade  
**Maturity**: Production-ready (v0.4.0)  
**Adoption**: High (11K+ stars, active development)

## Ethical Considerations

The repository includes comprehensive ethics guidelines covering:
- Academic integrity requirements
- Transparency in AI assistance
- Citation verification obligations
- Misuse prevention measures
- Human review requirements

## Research Notes

This repository represents a significant advancement in automated research methodology, demonstrating:
- End-to-end academic workflow automation
- Sophisticated multi-agent coordination
- Real-world quality assurance mechanisms
- Human-AI collaborative patterns
- Academic standard compliance automation

The 23-stage pipeline architecture and quality validation systems provide substantial value for complex workflow orchestration in babysitter processes.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| 23-Stage Research Pipeline | NEW | Complete autonomous research lifecycle from idea to conference-ready paper | - | specializations/academic-research/autonomous-research-pipeline.js |
| Multi-Agent Consensus Building | UPGRADE | Collaborative validation with CodeAgent, BenchmarkAgent, FigureAgent patterns | library/specializations/ai-agents-conversational/ | specializations/shared/multi-agent-consensus-building.js |
| Human-in-the-Loop Intervention System | NEW | 6 intervention modes with confidence-driven dynamic intervention | - | specializations/shared/human-in-loop-intervention-system.js |
| Quality Assurance Framework | NEW | 7-dimension scoring with AI-slop detection and conference compliance | - | specializations/academic-research/research-quality-assurance.js |
| Citation Verification Pipeline | NEW | Anti-fabrication system with real literature validation | - | specializations/academic-research/citation-verification-pipeline.js |
| Literature Integration Workflow | NEW | Multi-source aggregation from OpenAlex, Semantic Scholar, arXiv | - | specializations/academic-research/literature-integration-workflow.js |
| Experiment Automation Framework | NEW | Hardware-aware execution with statistical validation and reproducibility | - | specializations/academic-research/experiment-automation-framework.js |
| Academic Paper Generation | NEW | LaTeX compilation with section-by-section writing and formatting | - | specializations/academic-research/academic-paper-generation.js |
| Reproducibility Validation | NEW | Code and data validation for research reproducibility standards | - | specializations/academic-research/reproducibility-validation.js |
| Statistical Analysis Automation | NEW | Automated statistical validation and analysis workflows | - | specializations/data-science-ml/statistical-analysis-automation.js |
| Anti-Hallucination Verification | NEW | Claim validation and anti-fabrication safeguards | - | specializations/shared/anti-hallucination-verification.js |
| Conference Standard Compliance | NEW | NeurIPS checklist validation and academic standard checking | - | specializations/academic-research/conference-standard-compliance.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| OpenAlex API Integration | NEW | Academic literature search and citation data via OpenAlex API | - | plugins/a5c/marketplace/plugins/openalex-api-integration/ |
| Semantic Scholar Integration | NEW | Research paper discovery and analysis via Semantic Scholar API | - | plugins/a5c/marketplace/plugins/semantic-scholar-integration/ |
| ArXiv Integration | NEW | Preprint repository access and paper retrieval via arXiv API | - | plugins/a5c/marketplace/plugins/arxiv-integration/ |