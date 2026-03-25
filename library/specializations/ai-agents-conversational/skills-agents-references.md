# AI Agents and Conversational AI - Skills and Agents References

This document provides links to community-created Claude skills, agents, plugins, MCP servers, and related tools that align with the skills and agents identified in the backlog for this specialization.

## Overview

- **Total References Found**: 89
- **Categories Covered**: 15
- **Last Updated**: 2026-01-24

---

## Table of Contents

1. [Agent Orchestration Platforms](#agent-orchestration-platforms)
2. [LangChain and LangGraph Integration](#langchain-and-langgraph-integration)
3. [Multi-Agent Frameworks](#multi-agent-frameworks)
4. [RAG Pipeline Tools](#rag-pipeline-tools)
5. [Vector Database MCP Servers](#vector-database-mcp-servers)
6. [Memory Systems](#memory-systems)
7. [Observability and Tracing](#observability-and-tracing)
8. [Safety and Guardrails](#safety-and-guardrails)
9. [NLU and Intent Classification](#nlu-and-intent-classification)
10. [Prompt Engineering Tools](#prompt-engineering-tools)
11. [Claude Skills Collections](#claude-skills-collections)
12. [Official MCP Resources](#official-mcp-resources)
13. [Claude Agent SDK](#claude-agent-sdk)
14. [Additional Agent Tools](#additional-agent-tools)
15. [Reference Documentation](#reference-documentation)

---

## Agent Orchestration Platforms

### Claude-Flow
**The leading multi-agent orchestration platform for Claude**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/ruvnet/claude-flow |

**Key Features:**
- 60+ specialized agents for coding, testing, security, and DevOps
- HNSW vector database with 150x-12,500x faster retrieval
- Multiple swarm topologies (mesh, hierarchical, ring, star)
- MCP protocol integration with 175+ tools
- 84.8% SWE-Bench solve rate
- RAG integration with enterprise-grade architecture

**Applicable Skills/Agents:**
- AG-AA-003 (multi-agent-coordinator)
- AG-AA-004 (langgraph-workflow-designer)
- SK-LG-001 (langgraph-state-graph)

---

### Cloudflare Agents SDK
**Build stateful AI agents with scheduling, RPC, MCP servers, and streaming chat**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/cloudflare/skills/tree/main/agents-sdk |

**Applicable Skills/Agents:**
- SK-AF-001 (crewai-setup)
- AG-OPS-001 (agent-deployment-engineer)

---

## LangChain and LangGraph Integration

### LangGraph RAG MCP
**RAG system using LangGraph documentation exposed via MCP**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/pedarias/langgraph-rag-mcp |

**Features:**
- Collects and processes LangGraph documentation
- Creates vector database for semantic search
- Exposes knowledge through MCP protocol
- Integrates with VS Code, Cursor, Claude Desktop, Windsurf

**Applicable Skills/Agents:**
- SK-LG-001 (langgraph-state-graph)
- SK-RAG-001 (rag-chunking-strategy)
- AG-RAG-001 (rag-pipeline-architect)

---

### LangGraph MCP Agents
**LangGraph-powered ReAct agent with MCP integration**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/teddynote-lab/langgraph-mcp-agents |

**Features:**
- Streamlit web interface for agent configuration
- MCP client setup tutorials
- Local MCP server integration
- RAG integration for document retrieval
- Native LangChain tools alongside MCP tools

**Applicable Skills/Agents:**
- SK-LC-001 (langchain-react-agent)
- SK-LG-004 (langgraph-routing)
- AG-AA-001 (react-agent-architect)

---

### MCP Mastery with Claude and LangChain
**Comprehensive MCP servers & clients with LangChain integration**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/laxmimerit/MCP-Mastery-with-Claude-and-Langchain |

**Features:**
- Python, Streamlit, ChromaDB integration
- LangChain and LangGraph agents
- Ollama integrations
- Agentic RAG implementation

**Applicable Skills/Agents:**
- SK-LC-001 (langchain-react-agent)
- SK-LC-004 (langchain-tools)
- SK-VDB-003 (chroma-integration)

---

### Awesome LangGraph
**Comprehensive index of the LangChain + LangGraph ecosystem**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/von-development/awesome-LangGraph |

**Features:**
- Concepts, projects, tools, and templates
- Multi-agent application guides
- MCP server integration examples
- RAG application patterns

**Applicable Skills/Agents:**
- SK-LG-001 through SK-LG-005 (all LangGraph skills)
- AG-AA-004 (langgraph-workflow-designer)

---

### LangSmith Fetch Skill
**Debug LangChain and LangGraph agents with LangSmith traces**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/ComposioHQ/awesome-claude-skills/tree/master/langsmith-fetch |

**Features:**
- Automatically fetches execution traces from LangSmith Studio
- First AI observability skill for Claude Code
- Debugging support for agent development

**Applicable Skills/Agents:**
- SK-OBS-001 (langsmith-tracing)
- AG-OPS-004 (observability-engineer)

---

### LangChain Anthropic MCP Server
**Tools for generating LangChain-based systems**

| Resource | Link |
|----------|------|
| Glama Registry | https://glama.ai/mcp/servers/@spencer-life/langchain-anthropic-mcp-server |

**Features:**
- Document ingestion pipelines
- Conversational RAG setup
- Multi-query retrievers
- Supabase vector store configuration
- Hybrid search (vector + keyword)

**Applicable Skills/Agents:**
- SK-LC-003 (langchain-retriever)
- SK-RAG-003 (rag-hybrid-search)
- AG-RAG-001 (rag-pipeline-architect)

---

## Multi-Agent Frameworks

### CrewAI
**Framework for orchestrating role-playing, autonomous AI agents**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/crewAIInc/crewAI |
| Documentation | https://docs.crewai.com |

**Key Stats (2025):**
- $18M in funding
- 100,000+ certified developers
- 60% Fortune 500 adoption
- 60 million+ agent executions monthly

**Features:**
- Built from scratch (independent of LangChain)
- Collaborative intelligence for complex tasks
- Role-based agent orchestration

**Applicable Skills/Agents:**
- SK-AF-001 (crewai-setup)
- AG-AA-003 (multi-agent-coordinator)

---

### Microsoft Agent Framework (AutoGen + Semantic Kernel)
**Unified multi-agent AI system framework**

| Resource | Link |
|----------|------|
| AutoGen GitHub | https://github.com/microsoft/autogen |
| Semantic Kernel GitHub | https://github.com/microsoft/semantic-kernel |
| Microsoft Foundry | https://devblogs.microsoft.com/foundry/ |

**Features:**
- Merged AutoGen research with Semantic Kernel enterprise SDK (October 2025)
- Asynchronous, event-driven architecture
- Multi-language support (C#, Python, Java)
- Claude model integration (Haiku 4.5, Sonnet 4.5, Opus 4.1)
- General availability Q1 2026

**Applicable Skills/Agents:**
- SK-AF-002 (autogen-setup)
- SK-AF-004 (semantic-kernel-setup)
- AG-AA-002 (plan-execute-planner)

---

### Agent Skills for Context Engineering
**Comprehensive skills for multi-agent architectures and memory systems**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering |

**Included Skills:**
- Context fundamentals and degradation patterns
- Context compression and optimization
- Multi-agent architectures (orchestrator, peer-to-peer, hierarchical)
- Memory systems design
- Tool design and evaluation frameworks

**Applicable Skills/Agents:**
- AG-AA-003 (multi-agent-coordinator)
- AG-MEM-001 (memory-architect)
- SK-PE-005 (prompt-compression)

---

### wshobson/agents
**Intelligent automation and multi-agent orchestration**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/wshobson/agents |

**Features:**
- 8 LLM application skills (LangGraph, prompt engineering, RAG, evaluation)
- 7+ coordinated agents (backend-architect, database-architect, frontend-developer)
- Embeddings, similarity search, vector tuning, hybrid search

**Applicable Skills/Agents:**
- AG-AA-003 (multi-agent-coordinator)
- SK-RAG-003 (rag-hybrid-search)

---

## RAG Pipeline Tools

### MCP Local RAG
**Local-first RAG server for developers using MCP**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/shinpr/mcp-local-rag |

**Features:**
- Semantic + keyword search for code and technical docs
- Fully private, zero setup required
- Local-first architecture

**Applicable Skills/Agents:**
- SK-RAG-003 (rag-hybrid-search)
- AG-RAG-001 (rag-pipeline-architect)

---

### Claude Context (Zilliz)
**Code search MCP for Claude Code**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/zilliztech/claude-context |

**Features:**
- Index codebase directory for hybrid search (BM25 + dense vector)
- Natural language queries with hybrid search
- LangChain/LangGraph integration examples

**Applicable Skills/Agents:**
- SK-RAG-003 (rag-hybrid-search)
- SK-VDB-005 (milvus-integration)

---

### Needle MCP
**Production-ready RAG out of the box**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/needle-ai/needle-mcp |

**Features:**
- Search and retrieve data from documents
- Production-ready implementation
- Easy integration with MCP clients

**Applicable Skills/Agents:**
- SK-RAG-001 (rag-chunking-strategy)
- AG-RAG-001 (rag-pipeline-architect)

---

### Inkeep MCP Server
**RAG search over your content**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/inkeep/mcp-server-python |

**Features:**
- Powered by Inkeep
- Content retrieval and search
- Python-based MCP server

**Applicable Skills/Agents:**
- SK-RAG-005 (rag-query-transformation)
- AG-RAG-005 (knowledge-base-curator)

---

### Graphlit MCP Server
**Content ingestion and search**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/graphlit/graphlit-mcp-server |

**Features:**
- Ingest from Slack, Gmail, podcast feeds, web crawling
- Searchable Graphlit project
- Multi-source content aggregation

**Applicable Skills/Agents:**
- SK-RAG-001 (rag-chunking-strategy)
- AG-RAG-002 (chunking-strategy-expert)

---

### Haystack
**AI orchestration framework for RAG applications**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/deepset-ai/haystack |
| Documentation | https://haystack.deepset.ai |

**Features:**
- Production-ready LLM applications
- Components: models, vector DBs, file converters
- Pipelines for RAG, QA, semantic search, chatbots
- Advanced retrieval methods

**Benchmarks (2025):**
- ~5.9 ms framework overhead
- ~1.57k token usage (lowest among major frameworks)

**Applicable Skills/Agents:**
- SK-AF-005 (haystack-pipeline)
- AG-RAG-001 (rag-pipeline-architect)

---

### LlamaIndex
**Framework for RAG applications and data connectors**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/run-llama/llama_index |
| Documentation | https://docs.llamaindex.ai |

**Features:**
- 100+ data connectors
- Purpose-built retrieval infrastructure
- Native query engines
- Keyword search, embedding search, hierarchical retrieval

**Applicable Skills/Agents:**
- SK-AF-003 (llamaindex-agent)
- AG-RAG-001 (rag-pipeline-architect)

---

## Vector Database MCP Servers

### Chroma MCP
**Open-source AI application database**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/chroma-core/chroma-mcp |

**Features:**
- Embeddings and vector search
- Document storage and full-text search
- Developer-friendly and lightweight

**Applicable Skills/Agents:**
- SK-VDB-003 (chroma-integration)
- AG-RAG-003 (vector-db-specialist)

---

### Milvus MCP Server
**Distributed vector database MCP integration**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/zilliztech/mcp-server-milvus |

**Features:**
- Search, query and interact with Milvus
- Distributed vector database support
- GPU-accelerated operations

**Applicable Skills/Agents:**
- SK-VDB-005 (milvus-integration)
- AG-RAG-003 (vector-db-specialist)

---

### Qdrant MCP Server
**Semantic memory layer on Qdrant vector search engine**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/qdrant/mcp-server-qdrant |

**Features:**
- Semantic memory layer implementation
- High-performance vector similarity search (Rust)
- Powerful metadata filtering

**Applicable Skills/Agents:**
- SK-VDB-004 (qdrant-integration)
- AG-RAG-003 (vector-db-specialist)

---

### Pinecone
**Managed serverless vector database**

| Resource | Link |
|----------|------|
| Documentation | https://docs.pinecone.io |
| Python Client | https://github.com/pinecone-io/pinecone-python-client |

**Features:**
- Fully managed, serverless
- Query times under 50ms
- Automatic scaling
- SOC 2 Type II, ISO 27001, GDPR, HIPAA compliant

**Applicable Skills/Agents:**
- SK-VDB-001 (pinecone-integration)
- AG-RAG-003 (vector-db-specialist)

---

### Weaviate
**Vector database with knowledge graph capabilities**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/weaviate/weaviate |
| Documentation | https://weaviate.io/developers/weaviate |

**Features:**
- GraphQL interface
- Knowledge graph capabilities
- Semantic search with structural understanding
- HIPAA compliance on AWS (2025)

**Applicable Skills/Agents:**
- SK-VDB-002 (weaviate-integration)
- AG-RAG-003 (vector-db-specialist)

---

## Memory Systems

### Mem0 MCP Servers

| Resource | Link |
|----------|------|
| Official Mem0 MCP | https://github.com/mem0ai/mem0-mcp |
| Mem0 Core Library | https://github.com/mem0ai/mem0 |
| coleam00/mcp-mem0 | https://github.com/coleam00/mcp-mem0 |
| pinkpixel-dev/mem0-mcp | https://github.com/pinkpixel-dev/mem0-mcp |
| OpenMemory MCP | https://github.com/mcpconcierge/mem0-OpenMemory-MCP-server |

**Features:**
- Universal memory layer for AI agents
- Save text or conversation history
- Semantic search across memories
- MCP-compatible clients (Claude Desktop, Cursor)
- Y Combinator backed

**Applicable Skills/Agents:**
- SK-MEM-002 (mem0-integration)
- AG-MEM-001 (memory-architect)

---

### MemoryOS
**Memory operating system for personalized AI agents (EMNLP 2025 Oral)**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/BAI-LAB/MemoryOS |

**Features:**
- Short-term, mid-term, and long-term persona memory
- Automated user profile and knowledge updating
- MCP server for injecting long-term memory
- Benchmarks with Mem0, Zep comparison

**Applicable Skills/Agents:**
- SK-MEM-001 (zep-memory-integration)
- SK-MEM-004 (memory-summarization)
- AG-MEM-001 (memory-architect)

---

### OpenMemory
**Local persistent memory store for LLM applications**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/CaviraOSS/OpenMemory |

**Features:**
- Native MCP server included
- Migration from Mem0, Zep, Supermemory
- Integrations: LangChain, CrewAI, AutoGen, Streamlit

**Applicable Skills/Agents:**
- SK-MEM-003 (redis-memory-backend)
- AG-MEM-002 (user-profile-builder)

---

### MCP Memory Server (Official)
**Knowledge graph-based persistent memory**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/modelcontextprotocol/servers/tree/main/src/memory |

**Features:**
- Official reference implementation
- Knowledge graph storage
- Persistent memory system

**Applicable Skills/Agents:**
- SK-LC-002 (langchain-memory)
- AG-MEM-003 (semantic-memory-curator)

---

### Neo4j MCP
**Graph database with graph-backed memory**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/neo4j-contrib/mcp-neo4j |

**Features:**
- Schema exploration
- Read/write Cypher capabilities
- Graph-backed memory system

**Applicable Skills/Agents:**
- SK-MEM-005 (entity-memory-extraction)
- AG-MEM-003 (semantic-memory-curator)

---

### Memory Systems Skill
**Design short-term, long-term, and graph-based memory architectures**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/tree/main/skills/memory-systems |

**Applicable Skills/Agents:**
- SK-MEM-001 through SK-MEM-005 (all memory skills)
- AG-MEM-001 (memory-architect)

---

## Observability and Tracing

### Langfuse
**Open source LLM engineering platform**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/langfuse/langfuse |
| Documentation | https://langfuse.com |
| Claude Agent SDK Integration | https://langfuse.com/integrations/frameworks/claude-agent-sdk |

**Features:**
- LLM observability, metrics, evals
- Prompt management, playground, datasets
- OpenTelemetry, LangChain, OpenAI SDK, LiteLLM integrations
- @observe() decorator for Python
- Claude Agent SDK tracing support

**Applicable Skills/Agents:**
- SK-OBS-002 (langfuse-integration)
- AG-OPS-004 (observability-engineer)

---

### LangSmith
**Managed observability suite by LangChain**

| Resource | Link |
|----------|------|
| Documentation | https://docs.langchain.com/langsmith/observability |

**Features:**
- Dashboards, alerting, human-in-the-loop evaluation
- Deep LangChain/LangGraph integration
- Run Tree model for nested traces
- MCP connectivity to Claude, VSCode

**Applicable Skills/Agents:**
- SK-OBS-001 (langsmith-tracing)
- AG-OPS-004 (observability-engineer)

---

### Arize Phoenix
**Observability platform for LLM applications**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/Arize-ai/phoenix |
| Documentation | https://docs.arize.com/phoenix |

**Features:**
- LLM traces and evaluation
- Open-source observability
- Production monitoring

**Applicable Skills/Agents:**
- SK-OBS-003 (phoenix-arize-setup)
- AG-SAF-004 (agent-evaluator)

---

### Logfire MCP
**OpenTelemetry traces and metrics access**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/pydantic/logfire-mcp |

**Features:**
- OpenTelemetry integration
- Traces and metrics through MCP

**Applicable Skills/Agents:**
- SK-OBS-004 (opentelemetry-llm)
- AG-OPS-004 (observability-engineer)

---

### Comet Opik MCP
**Query and analyze LLM telemetry data**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/comet-ml/opik-mcp |

**Features:**
- Natural language queries for logs, traces, prompts
- LLM telemetry analysis

**Applicable Skills/Agents:**
- SK-OBS-001 (langsmith-tracing)
- AG-OPS-004 (observability-engineer)

---

### Digma MCP Server
**Code observability with OTEL/APM data**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/digma-ai/digma-mcp-server |

**Features:**
- Dynamic analysis based on OTEL/APM data
- Code reviews and issue identification

**Applicable Skills/Agents:**
- SK-OBS-004 (opentelemetry-llm)
- AG-OPS-004 (observability-engineer)

---

## Safety and Guardrails

### NVIDIA NeMo Guardrails
**Programmable guardrails for LLM-based conversational systems**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/NVIDIA-NeMo/Guardrails |
| Documentation | https://docs.nvidia.com/nemo/guardrails |

**Features:**
- Input, dialog, and retrieval rails
- Jailbreak and injection detection
- LLM self-checking (moderation, fact-checking, hallucination)
- NVIDIA safety models integration
- Works with OpenAI, Claude, LLaMa-2, Falcon, Vicuna

**Applicable Skills/Agents:**
- SK-SAF-003 (nemo-guardrails)
- AG-SAF-001 (safety-auditor)

---

### Guardrails AI
**Validation framework for Gen AI applications**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/guardrails-ai/guardrails |
| Documentation | https://www.guardrailsai.com |

**Features:**
- Input/output validation
- Pre-built validators
- Custom validators via Python decorators
- NeMo Guardrails integration

**Applicable Skills/Agents:**
- SK-SAF-002 (guardrails-ai-setup)
- AG-SAF-001 (safety-auditor)

---

### OpenAI Guardrails Python
**Prompt injection detection**

| Resource | Link |
|----------|------|
| Documentation | https://openai.github.io/openai-guardrails-python |

**Features:**
- Prompt injection detection
- Code injection protection (Python, SQL, Jinja)
- Cross-site scripting protection

**Applicable Skills/Agents:**
- SK-SAF-004 (prompt-injection-detector)
- AG-SAF-002 (prompt-injection-defender)

---

## NLU and Intent Classification

### Rasa
**Open source machine learning framework for conversational AI**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/RasaHQ/rasa |
| Documentation | https://rasa.com/docs |
| Interactive Playground | https://hello.rasa.com |

**Features:**
- NLU: Intent classification and entity extraction
- Dialogue management with probabilistic models
- CALM engine (LLM fluency + business logic)
- DIET classifier for fast training
- Slack, Facebook integrations

**Applicable Skills/Agents:**
- SK-NLU-003 (rasa-nlu-integration)
- AG-CAI-002 (intent-taxonomy-expert)

---

### Hugging Face Transformers
**State-of-the-art NLP models**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/huggingface/transformers |
| Hub | https://huggingface.co/models |

**Features:**
- Fine-tuning for intent classification
- Pre-trained models for NLU tasks
- SetFit few-shot learning

**Applicable Skills/Agents:**
- SK-NLU-001 (huggingface-classifier)
- SK-NLU-002 (setfit-few-shot)

---

### spaCy
**Industrial-strength NLP**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/explosion/spaCy |
| Documentation | https://spacy.io |

**Features:**
- NER model training
- Entity extraction
- Production-ready NLP pipelines

**Applicable Skills/Agents:**
- SK-NLU-004 (spacy-ner)
- AG-CAI-003 (entity-extraction-specialist)

---

## Prompt Engineering Tools

### Context Compression Skill
**Strategies for managing long-running sessions**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/tree/main/skills/context-compression |

**Applicable Skills/Agents:**
- SK-PE-005 (prompt-compression)
- AG-OPS-002 (cost-optimizer)

---

### Evaluation Skill
**Building evaluation frameworks for agent systems**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/tree/main/skills/evaluation |

**Applicable Skills/Agents:**
- AG-SAF-004 (agent-evaluator)
- AG-SAF-005 (llm-judge)

---

## Claude Skills Collections

### ComposioHQ Awesome Claude Skills
**Curated list of Claude Skills and resources**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/ComposioHQ/awesome-claude-skills |

**Highlighted Skills:**
- LangSmith Fetch (agent debugging)
- MCP Builder (server creation guide)
- Connect/Connect-Apps (500+ app integrations)

---

### VoltAgent Awesome Claude Skills
**Community Claude Skills collection**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/VoltAgent/awesome-claude-skills |

**Highlighted Skills:**
- Agent Skills for Context Engineering
- Cloudflare Agents SDK
- MCP Builder

---

### travisvn Awesome Claude Skills
**Curated Claude Skills for Claude Code workflows**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/travisvn/awesome-claude-skills |

---

### ccplugins Awesome Claude Code Plugins
**Marketplace of slash commands, subagents, MCP servers, and hooks**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/ccplugins/awesome-claude-code-plugins |

**Categories:**
- Workflow Orchestration (8 plugins)
- Development Engineering (15 plugins including ai-engineer)
- Documentation (8 plugins)

---

## Official MCP Resources

### Model Context Protocol Organization
**Official MCP GitHub organization**

| Resource | Link |
|----------|------|
| GitHub Organization | https://github.com/modelcontextprotocol |
| Official Servers | https://github.com/modelcontextprotocol/servers |
| Specification | https://modelcontextprotocol.io/specification/2025-11-25 |
| Registry | https://registry.modelcontextprotocol.io |

**Reference Servers:**
- Memory (knowledge graph-based persistent memory)
- Sequential Thinking (dynamic problem-solving)
- Everything (reference/test server)

---

### Awesome MCP Servers Lists

| Resource | Link |
|----------|------|
| wong2/awesome-mcp-servers | https://github.com/wong2/awesome-mcp-servers |
| punkpeye/awesome-mcp-servers | https://github.com/punkpeye/awesome-mcp-servers |

---

## Claude Agent SDK

### Official Claude Agent SDK
**Framework for building AI agents on Claude**

| Resource | Link |
|----------|------|
| Python SDK | https://github.com/anthropics/claude-agent-sdk-python |
| Demo Applications | https://github.com/anthropics/claude-agent-sdk-demos |
| Documentation | https://docs.anthropic.com/en/docs/agents |

**Features:**
- MCP protocol support
- Custom tools via @tool decorator
- In-process MCP servers
- Hooks for deterministic processing

---

### Claude Agent SDK Guides

| Resource | Link |
|----------|------|
| Complete Guide (Gist) | https://gist.github.com/dabit3/93a5afe8171753d0dbfd41c80033171d |
| Intro Repository | https://github.com/kenneth-liao/claude-agent-sdk-intro |
| Promptfoo Integration | https://www.promptfoo.dev/docs/providers/claude-agent-sdk |

---

## Additional Agent Tools

### Sequential Thinking MCP Server
**Dynamic and reflective problem-solving**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking |

**Applicable Skills/Agents:**
- AG-AA-002 (plan-execute-planner)
- AG-PE-004 (cot-reasoning-expert)

---

### AgentRPC
**Connect functions across network boundaries**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/agentrpc/agentrpc |

**Applicable Skills/Agents:**
- AG-OPS-001 (agent-deployment-engineer)

---

### Claude Skills MCP
**Intelligent search for Claude Agent Skills**

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/K-Dense-AI/claude-skills-mcp |

**Features:**
- Search capabilities for Claude Agent Skills
- Cross-platform support (macOS, Windows, Linux)

---

## Reference Documentation

### Anthropic Resources

| Resource | Link |
|----------|------|
| Skills Explained Blog | https://claude.com/blog/skills-explained |
| Building Agents Guide | https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk |
| Code Execution with MCP | https://www.anthropic.com/engineering/code-execution-with-mcp |
| MCP Introduction | https://www.anthropic.com/news/model-context-protocol |

---

### Community Analysis

| Resource | Link |
|----------|------|
| Claude Skills Deep Dive | https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/ |
| AI Agent Framework Landscape 2025 | https://medium.com/@hieutrantrung.it/the-ai-agent-framework-landscape-in-2025-what-changed-and-what-matters-3cd9b07ef2c3 |
| Top AI Agent Frameworks 2025 | https://www.codecademy.com/article/top-ai-agent-frameworks-in-2025 |

---

## Skills/Agents Coverage Summary

### High Coverage (5+ references)
| Skill/Agent ID | Name | References |
|----------------|------|------------|
| SK-OBS-001 | langsmith-tracing | 6 |
| SK-RAG-003 | rag-hybrid-search | 5 |
| AG-RAG-001 | rag-pipeline-architect | 5 |
| AG-OPS-004 | observability-engineer | 5 |
| AG-MEM-001 | memory-architect | 5 |

### Good Coverage (3-4 references)
| Skill/Agent ID | Name | References |
|----------------|------|------------|
| SK-LG-001 | langgraph-state-graph | 4 |
| SK-VDB-003 | chroma-integration | 3 |
| SK-MEM-002 | mem0-integration | 4 |
| SK-AF-001 | crewai-setup | 3 |
| AG-AA-003 | multi-agent-coordinator | 4 |
| AG-RAG-003 | vector-db-specialist | 4 |
| AG-SAF-001 | safety-auditor | 3 |

### Moderate Coverage (1-2 references)
All other skills and agents have at least 1-2 applicable references.

---

## Notes

1. **MCP Adoption**: The Model Context Protocol has become the de facto standard for AI-to-tool integrations, with Microsoft, Google, and OpenAI joining the steering committee in 2025.

2. **Framework Consolidation**: The agent framework landscape has consolidated significantly, with Microsoft merging AutoGen and Semantic Kernel, and CrewAI emerging as a leading independent framework.

3. **Memory Systems**: Mem0 and MemoryOS have emerged as leading solutions for AI agent memory, with multiple MCP server implementations available.

4. **Observability**: Langfuse and LangSmith remain the primary observability platforms, with native Claude Agent SDK integration.

5. **Version Compatibility**: Many tools are rapidly evolving. Check documentation for current compatibility with Claude models and MCP specification versions.

---

*Last Updated: 2026-01-24*
*Generated for AI Agents and Conversational AI Specialization*
