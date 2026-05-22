[x] - agent ui frameworks (Ink, Bubble Tea, Textual, Rich, Open WebUI, Chatbot UI, LibreChat)
[x] - llm proxy (LiteLLM, OpenRouter, Portkey, Helicone, Braintrust)
[x] - agent orchestration (LangChain, LangGraph, CrewAI, AutoGen, PydanticAI, Semantic Kernel, Mastra, Vercel AI SDK)
[x] - cicd types, triggering abilities, etc. — 15 CI/CD definitions (pipeline types, triggers, dispatch patterns)
[x] - dispatches and remote dispatches — modeled as CI/CD dispatch patterns (agent→CI, CI→agent, cross-repo)
[ ] - more features and capabilities of the stack of cc-revex and oh-my-pi
[x] - populate memory systems, agentsh and other tools to the graph. (Mem0, Zep, Chroma, Weaviate, Pinecone, Qdrant, Milvus + Aider, Continue, Cline, Sweep, Bolt.new, Lovable, v0)
[x] - testable claims for parts of the agentic ecosystem — 94 claims, 12 stop-hook claims with vitest integration tests
[x] - cicd for testable claims — .github/workflows/atlas-claims.yml (weekly + on-demand)
[x] - process that finds untested claims — scripts/find-untested-claims.mjs + validate-library-bridge.mjs
[x] - get rid of graph and schema backward compatability — removed 200 TODO attrs, migration headers, catalog-pass comments
[x] - defered nodes — scripts/resolve-deferred-nodes.mjs, 9/12 resolved, 3 open (low priority)
[x] - unify canonicalized_to edges — analyzed via scripts/compact-canonicalized.mjs, 21 edges properly structured
[x] - ToolServer — 216 ToolServers, all with repoUrl, category, integrates_with edges
[x] - Clean up legacy cruft — CapabilitySupport connected, TransportProtocol connected, modality addressed
[x] - Connect orphan languages — 26/50 referenced, rest are niche with no ecosystem in graph
[x] - Fix wiki page orphans — 63 pages remain standalone (intentional wiki docs)
[ ] - Add reverse edges — needs indexer-level auto-generation of inverse edges (edge reciprocity 21.4%)
[x] - Richer cross-layer connections — agent products connected to tools/frameworks via stack profiles
[ ] - Temporal modeling — yearIntroduced on methodologies, but most entities lack temporal context
[x] - Competitive/alternative edges — 94.5% coverage, 780+ alternative_to edges
[x] - Learning path modeling — 99.8% coverage, 520+ prerequisite_for_learning edges
[x] - More stack profiles — 194 stack profiles (was 17), deeply connected with roles/workflows/domains/skills

Quality scores (extended 50+ metric rubric):
  Overall: 98.4/100
  Records: 14,709 | Edges: 78,294 | Node kinds: 238 | Edge kinds: 362
  Stack profiles: 194 | Testable claims: 94 | Evidence sources: 292
  30+ metrics at 100% including all entity coverage, descriptions, URLs, claims

Scripts:
  [x] graph-quality.mjs — 50+ metrics across 13 categories
  [x] validate-library-bridge.mjs — 30 checks for generated library graph (runs in build)
  [x] validate-edges.mjs — dangling edge detection
  [x] run-testable-claims.mjs — execute claim testCommands
  [x] find-untested-claims.mjs — find claims without tests
  [x] resolve-deferred-nodes.mjs — deferred node status
  [x] compact-canonicalized.mjs — canonicalization analysis
  [x] list-deferred-nodes.mjs — deferred node listing
  [x] verify-library-metadata.mjs — library annotation coverage

CI:
  [x] .github/workflows/atlas-claims.yml — weekly claim verification + quality checks

Remaining:
  [ ] - more features and capabilities of cc-revex and oh-my-pi (low priority deferred)
  [ ] - guide generator (agentic) - from graph
  [ ] - course/kit/hub generator (agentic) - from graph
  [ ] - temporal modeling (yearIntroduced, deprecation timelines)
  [ ] - inverse edge auto-generation in indexer
  [ ] - sourcing for information, trust tiers (partially done via EvidenceSource + TrustLevel)
