# AI Agents and Conversational AI References

## LLM Agent Frameworks

### Core Frameworks
- **LangChain** - Comprehensive framework for building LLM applications with chains, agents, tools, memory abstractions, and extensive integrations
- **LangGraph** - Part of LangChain ecosystem for building stateful, cyclic multi-agent workflows with explicit state management and checkpointing
- **LlamaIndex (GPT Index)** - Data framework for LLM applications specializing in RAG, advanced indexing, query engines, and multi-document agents
- **Semantic Kernel** - Microsoft's SDK for integrating LLMs into applications with planners, plugins, memory, and skills abstractions
- **Haystack** - End-to-end NLP framework with pipeline architecture, RAG focus, document processing, and production-ready monitoring
- **AutoGPT** - Autonomous agent framework demonstrating self-directed task creation, execution, and goal-oriented behavior
- **BabyAGI** - Minimalist autonomous agent for task-driven autonomous operation with task creation and prioritization
- **CrewAI** - Multi-agent orchestration framework with role-based design, task delegation, and simplified multi-agent API
- **Transformers Agents** - Hugging Face agent framework with tool integration and multi-modal capabilities
- **DSPy** - Framework for programming with language models using composable modules and optimization

## Chatbot Platforms and Frameworks

### Open Source Platforms
- **Rasa** - Open source conversational AI with custom NLU, dialogue management, ML-based intent classification, and self-hosted deployment
- **Botpress** - Open source chatbot platform with visual flow builder, NLU engine, multi-channel deployment, and extensibility
- **Botkit** - Developer tool for building chatbots with conversation management and multi-platform support
- **ChatterBot** - Python library for generating automated responses using machine learning
- **Errbot** - Python chatbot framework for building bots for Slack, Discord, IRC, and more

### Enterprise Platforms
- **Microsoft Bot Framework** - Enterprise framework with Azure Bot Service, adaptive dialogs, multi-channel support, and LUIS integration
- **Dialogflow (Google)** - Conversational AI platform with intent/entity recognition, multi-turn conversations, and Google Cloud integration
- **Amazon Lex** - AWS conversational interface service powered by Alexa with ASR, NLU, and Lambda integration
- **IBM Watson Assistant** - Enterprise platform with intent classification, dialog skills, Watson Discovery integration, and analytics
- **SAP Conversational AI** - Enterprise bot platform with NLP, dialog management, and SAP system integration
- **Kore.ai** - Enterprise conversational AI platform for customer service and employee engagement

### No-Code/Low-Code Platforms
- **Voiceflow** - Visual conversation design platform for prototyping and production deployment with collaboration features
- **Landbot** - No-code chatbot builder with drag-and-drop interface and conversational landing pages
- **ManyChat** - Facebook Messenger bot platform with visual builder and marketing focus
- **Chatfuel** - No-code Messenger and Instagram bot builder with AI integration
- **Tidio** - Live chat and chatbot platform with visual builder and e-commerce integrations
- **Mobile Monkey** - Messenger marketing platform with bot automation
- **Flow XO** - Multi-platform chatbot builder with workflow automation

## Large Language Models

### Proprietary Models
- **OpenAI GPT-4** - State-of-the-art multimodal LLM with reasoning, function calling, and vision capabilities
- **OpenAI GPT-4 Turbo** - Faster, more cost-effective version with 128k context window
- **OpenAI GPT-3.5 Turbo** - Fast and cost-effective for many conversational tasks
- **Anthropic Claude 3 Opus** - Most capable Claude model with strong reasoning and analysis
- **Anthropic Claude 3 Sonnet** - Balanced performance and cost for most tasks
- **Anthropic Claude 3 Haiku** - Fast and cost-effective for high-volume tasks
- **Google Gemini Pro** - Multimodal model with strong reasoning capabilities
- **Google Gemini Ultra** - Most capable Gemini model for complex tasks
- **Mistral Large** - High-performance European LLM with multilingual support
- **Cohere Command** - Enterprise LLM optimized for business applications

### Open Source Models
- **Llama 3** - Meta's open source LLM family (8B, 70B parameters)
- **Mistral 7B / Mixtral 8x7B** - Open source models from Mistral AI with efficient architecture
- **Phi-3** - Microsoft's small language models optimized for efficiency
- **Gemma** - Google's open source LLM family
- **Vicuna** - Open source chatbot trained from LLaMA with GPT-4 conversations
- **Falcon** - Open source LLM from Technology Innovation Institute
- **MPT** - MosaicML's open source foundation models
- **StableLM** - Stability AI's open source language models

### Specialized Models
- **CodeLlama** - Specialized for code generation and understanding
- **Med-PaLM** - Medical domain-specific language model
- **BloombergGPT** - Finance-specific language model
- **Galactica** - Scientific knowledge and reasoning model

## Agent Architectures and Patterns

### Architecture Types
- **ReAct (Reasoning and Acting)** - Interleaves reasoning traces with action execution for interpretable multi-step reasoning
- **ReWOO (Reasoning WithOut Observation)** - Plans all actions upfront for efficiency and parallel execution
- **Plan-and-Execute** - Separates high-level planning from low-level execution with replanning
- **Reflexion** - Agent framework with self-reflection and iterative improvement
- **REWOO** - Modular paradigm separating planning, execution, and reasoning
- **Tree of Thoughts** - Explores multiple reasoning paths in a tree structure
- **Graph of Thoughts** - General graph-based reasoning framework
- **Chain-of-Thought (CoT)** - Step-by-step reasoning in prompts
- **Self-Consistency** - Sample multiple reasoning paths and vote on answers

### Multi-Agent Patterns
- **Hierarchical agents** - Manager delegates to specialist workers
- **Cooperative agents** - Agents share information and collaborate
- **Competitive agents** - Debate or voting mechanisms for decision making
- **Sequential pipeline** - Agents process in defined order
- **Parallel processing** - Independent agents with aggregation
- **Swarm intelligence** - Emergent behavior from simple agent interactions

## Natural Language Processing

### NLU/NLP Frameworks
- **spaCy** - Industrial-strength NLP library with pre-trained models and entity recognition
- **NLTK (Natural Language Toolkit)** - Comprehensive NLP library for Python with linguistic resources
- **Hugging Face Transformers** - State-of-the-art NLP models (BERT, GPT, T5) with simple APIs
- **Stanza** - Stanford NLP toolkit with multilingual support
- **AllenNLP** - Research library for deep learning-based NLP
- **Flair** - Simple framework for state-of-the-art NLP

### Intent and Entity Recognition
- **DIET (Dual Intent and Entity Transformer)** - Rasa's architecture for intent and entity extraction
- **BERT for sequence classification** - Fine-tuned BERT for intent recognition
- **SetFit** - Few-shot text classification with sentence transformers
- **SpanBERT** - Specialized for entity extraction and span-based tasks
- **NER models** - Named entity recognition (spaCy, Flair, BERT-based)

### Embedding Models
- **OpenAI text-embedding-3-small/large** - Latest embedding models from OpenAI
- **OpenAI text-embedding-ada-002** - Widely-used general-purpose embeddings
- **Cohere embed-english-v3.0** - High-quality embeddings with compression options
- **sentence-transformers** - Framework for sentence and document embeddings
- **all-MiniLM-L6-v2** - Popular lightweight sentence transformer
- **all-mpnet-base-v2** - High-quality general-purpose embeddings
- **E5 embeddings** - Microsoft's text embeddings (E5-small, base, large)
- **Instructor embeddings** - Task-specific embeddings with instructions
- **BGE embeddings** - BAAI general embeddings for retrieval

## Vector Databases and Search

### Vector Databases
- **Pinecone** - Managed vector database with filtering, namespaces, and high availability
- **Weaviate** - Open source vector database with GraphQL API and hybrid search
- **Chroma** - Open source embedding database designed for LLM applications
- **Qdrant** - Vector similarity search engine with rich filtering
- **Milvus** - Open source vector database for scalable similarity search
- **Faiss** - Facebook AI Similarity Search library for efficient vector search
- **Elasticsearch** - Traditional search with vector search capabilities (kNN)
- **pgvector** - PostgreSQL extension for vector similarity search
- **LanceDB** - Embedded vector database built on Lance data format
- **Vespa** - Open source platform for structured and vector search

### Search and Retrieval
- **BM25** - Classic ranking function for keyword-based retrieval
- **Elasticsearch** - Full-text search and analytics engine
- **Typesense** - Fast, typo-tolerant search engine
- **Algolia** - Hosted search with instant results and typo tolerance
- **MeiliSearch** - Fast, relevant search engine with instant results

## Retrieval-Augmented Generation (RAG)

### RAG Frameworks
- **LlamaIndex** - Specialized data framework for RAG applications with advanced patterns
- **LangChain** - RAG chains and retrievers with various strategies
- **Haystack** - RAG pipelines with document processing and indexing
- **txtai** - All-in-one embeddings database with RAG support
- **PrivateGPT** - RAG over private documents with local LLMs

### RAG Techniques
- **Naive RAG** - Basic retrieval and generation pipeline
- **Advanced RAG** - Pre-retrieval and post-retrieval optimization
- **Modular RAG** - Composable RAG modules and patterns
- **Agentic RAG** - Agent-driven retrieval decisions
- **Self-RAG** - Retrieval with self-reflection and critique
- **Corrective RAG** - Self-correction based on retrieval quality
- **Adaptive RAG** - Dynamic strategy selection based on query
- **HyDE (Hypothetical Document Embeddings)** - Generate hypothetical answers for better retrieval
- **Multi-Query RAG** - Multiple query variations for comprehensive retrieval
- **RAG Fusion** - Reciprocal rank fusion of multiple retrieval results

### Reranking Models
- **Cohere Rerank** - Neural reranking API for improving search results
- **Cross-encoder models** - BERT-based models for passage reranking
- **colBERT** - Efficient and effective passage search
- **RankGPT** - LLM-based reranking with GPT models
- **MonoT5** - T5-based reranking model

## Memory Systems

### Memory Types
- **Short-term memory** - Recent conversation context (conversation buffer, sliding window)
- **Long-term memory** - Persistent storage of facts and experiences (vector databases, knowledge graphs)
- **Semantic memory** - Embedding-based retrieval of relevant context
- **Episodic memory** - Storage and retrieval of past interaction episodes
- **Working memory** - Active information for current task (entity memory, summary memory)

### Memory Implementations
- **LangChain Memory** - ConversationBufferMemory, ConversationSummaryMemory, VectorStoreMemory
- **Zep** - Long-term memory store for LLM applications with fact extraction
- **MemGPT** - Memory management for LLMs with virtual context
- **LlamaIndex Memory** - Chat history and vector store-backed memory
- **Mem0** - Personalized AI memory layer with long-term retention

## Tool Use and Function Calling

### Function Calling APIs
- **OpenAI Function Calling** - Native function calling in GPT-4 and GPT-3.5 Turbo
- **Anthropic Tool Use** - Claude's tool use with function definitions
- **Google Function Calling** - Gemini's function calling capabilities
- **Mistral Function Calling** - Native function calling in Mistral models

### Tool Frameworks
- **LangChain Tools** - Extensive toolkit with 100+ pre-built tools
- **Semantic Kernel Plugins** - Reusable plugins for various capabilities
- **AutoGPT Plugins** - Extensible plugin system for autonomous agents
- **ChatGPT Plugins** - Official plugin ecosystem for ChatGPT
- **OpenAI Actions (GPTs)** - Custom actions for GPT applications

### Common Tool Categories
- **Search tools** - Web search, document search, semantic search
- **API integrations** - REST APIs, databases, third-party services
- **Code execution** - Python REPL, Jupyter kernel, sandboxed execution
- **Web browsing** - Web scraping, browser automation
- **File operations** - Read, write, search files
- **Data analysis** - SQL queries, data visualization, statistics
- **Communication** - Email, SMS, notifications

## Conversation Design Tools

### Flow Design and Prototyping
- **Voiceflow** - Visual conversation design with collaboration and prototyping
- **Botsociety** - Chatbot and voice assistant mockup tool
- **Botmock** - Conversation design and prototyping platform
- **FlowXO** - Visual bot builder with conversation flow design
- **Lucidchart** - Diagramming tool for conversation flows

### Testing and Analytics
- **Botium** - Testing and quality assurance for chatbots
- **Dimon** - Conversation analytics and monitoring
- **Dashbot** - Bot analytics and optimization platform
- **Chatbase** - Analytics for chatbots and virtual agents
- **BotAnalytics** - Conversation analytics and funnel analysis

## Prompt Engineering

### Prompting Techniques
- **Zero-shot prompting** - Task description without examples
- **Few-shot prompting** - Providing examples in the prompt
- **Chain-of-Thought (CoT)** - Step-by-step reasoning prompts
- **Self-Consistency** - Sample multiple reasoning paths
- **Tree of Thoughts** - Explore multiple reasoning branches
- **ReAct prompting** - Reason and act interleaved
- **Least-to-Most prompting** - Break down into subproblems
- **Automatic Prompt Engineering (APE)** - Automated prompt optimization
- **Constitutional AI** - Self-critique and revision prompts

### Prompt Management
- **LangSmith** - Prompt management and versioning for LangChain
- **PromptLayer** - Prompt engineering platform with versioning and analytics
- **Humanloop** - Collaborative prompt engineering and evaluation
- **Parea AI** - LLM evaluation and prompt optimization
- **Helicone** - Prompt versioning and A/B testing

## Safety and Alignment

### Content Moderation
- **OpenAI Moderation API** - Detect harmful content in text
- **Perspective API** - Toxicity and abuse detection from Google
- **Azure Content Safety** - Comprehensive content moderation service
- **Hive Moderation** - AI-powered content moderation
- **LlamaGuard** - Open source LLM-based safety model from Meta

### Guardrails and Safety
- **Guardrails AI** - Framework for adding guardrails to LLM applications
- **NeMo Guardrails** - NVIDIA's toolkit for controlling LLM interactions
- **LangKit** - Open source toolkit for monitoring LLM applications
- **Rebuff** - Prompt injection detection framework
- **Prompt injection detection** - Tools and techniques to prevent prompt attacks

### Red Teaming and Testing
- **Red teaming frameworks** - Adversarial testing methodologies
- **HELM (Holistic Evaluation of Language Models)** - Comprehensive evaluation benchmarks
- **TruthfulQA** - Benchmark for measuring truthfulness
- **RealToxicityPrompts** - Dataset for evaluating toxicity

## Evaluation and Benchmarks

### Agent Benchmarks
- **AgentBench** - Multi-domain benchmark for LLM agents
- **WebArena** - Realistic web navigation benchmark
- **ToolBench** - Benchmark for tool-using capabilities
- **API-Bank** - Benchmark for API call generation
- **GAIA** - General AI assistants benchmark
- **SWE-bench** - Software engineering tasks benchmark

### Conversational AI Benchmarks
- **Conversational Intelligence Challenge (ConvAI)** - Multi-turn conversation evaluation
- **DSTC (Dialog System Technology Challenge)** - Series of challenges for dialogue systems
- **MultiWOZ** - Multi-domain task-oriented dialogue dataset
- **PersonaChat** - Personality-conditioned dialogue dataset
- **Empathetic Dialogues** - Dataset for empathetic conversations

### LLM Evaluation Tools
- **LangSmith** - LLM evaluation and monitoring from LangChain
- **LangFuse** - Open source LLM engineering platform with tracing
- **Phoenix (Arize AI)** - LLM observability and evaluation
- **Weights & Biases** - Experiment tracking with LLM support
- **PromptBench** - Adversarial prompt benchmark
- **LLM-as-Judge** - Use GPT-4 or Claude to evaluate responses

## Voice and Multi-Modal

### Speech Recognition (ASR)
- **Whisper (OpenAI)** - Robust speech recognition model
- **Google Cloud Speech-to-Text** - Enterprise ASR service
- **Amazon Transcribe** - AWS speech recognition service
- **Azure Speech Services** - Microsoft speech recognition
- **AssemblyAI** - Speech-to-text API with speaker diarization
- **Deepgram** - Real-time speech recognition

### Text-to-Speech (TTS)
- **ElevenLabs** - Realistic and expressive voice synthesis
- **Google Cloud Text-to-Speech** - Natural-sounding speech synthesis
- **Amazon Polly** - Lifelike text-to-speech service
- **Azure Speech Services** - Neural TTS with custom voices
- **PlayHT** - AI voice generation platform
- **Coqui TTS** - Open source text-to-speech engine

### Multi-Modal Models
- **GPT-4 Vision** - OpenAI's multimodal model with vision capabilities
- **Claude 3** - Anthropic's multimodal models (Opus, Sonnet, Haiku)
- **Gemini** - Google's native multimodal architecture
- **LLaVA** - Open source vision-language model
- **BLIP-2** - Bootstrapping vision-language pre-training

## Deployment and Infrastructure

### LLM Serving
- **vLLM** - High-throughput LLM serving with PagedAttention
- **Text Generation Inference (TGI)** - Hugging Face's inference server
- **Ollama** - Run LLMs locally with simple CLI
- **LocalAI** - OpenAI-compatible API for local LLMs
- **LMDeploy** - Efficient LLM deployment toolkit
- **Ray Serve** - Scalable model serving with Ray

### API Gateways
- **LiteLLM** - Unified API for multiple LLM providers
- **Portkey** - AI gateway with routing, caching, and observability
- **Martian** - LLM router and gateway
- **OpenRouter** - Unified API for multiple LLM providers
- **Helicone** - LLM observability and proxy

### Orchestration
- **LangServe** - Deploy LangChain runnables as REST APIs
- **FastAPI** - Modern Python web framework for APIs
- **Modal** - Serverless compute for LLM applications
- **Anyscale** - Scalable Ray-based deployment platform
- **Replicate** - Run and deploy machine learning models

## Observability and Monitoring

### LLM Observability
- **LangSmith** - Debugging, testing, and monitoring for LangChain
- **LangFuse** - Open source LLM engineering platform
- **Phoenix (Arize AI)** - LLM observability with tracing and evaluation
- **Weights & Biases** - MLOps platform with LLM tracking
- **MLflow** - Open source MLOps platform
- **Helicone** - LLM observability with analytics and caching

### Tracing and Debugging
- **OpenTelemetry** - Vendor-neutral observability framework
- **Jaeger** - Distributed tracing system
- **LangSmith Tracing** - Native tracing for LangChain applications
- **LangWatch** - LLM conversation monitoring and analytics

## Fine-Tuning and Training

### Fine-Tuning Platforms
- **OpenAI Fine-Tuning** - Fine-tune GPT-3.5 and GPT-4
- **Hugging Face AutoTrain** - No-code model fine-tuning
- **Weights & Biases** - Experiment tracking for fine-tuning
- **Lamini** - Platform for training and fine-tuning LLMs
- **Predibase** - Fine-tune and serve open source LLMs

### Training Frameworks
- **Hugging Face Transformers** - Training and fine-tuning transformer models
- **DeepSpeed** - Microsoft's deep learning optimization library
- **Megatron-LM** - NVIDIA's framework for training large language models
- **Axolotl** - Tool for fine-tuning LLMs with various techniques
- **LLaMA-Factory** - Efficient fine-tuning of LLaMA models

### Parameter-Efficient Fine-Tuning (PEFT)
- **LoRA (Low-Rank Adaptation)** - Efficient fine-tuning with low-rank matrices
- **QLoRA** - Quantized LoRA for memory-efficient fine-tuning
- **Prefix Tuning** - Add trainable prefix tokens
- **Adapter Tuning** - Add small adapter modules
- **PEFT library (Hugging Face)** - Framework for parameter-efficient methods

## Data and Annotation

### Annotation Platforms
- **Label Studio** - Open source data labeling platform
- **Prodigy** - Scriptable annotation tool from spaCy creators
- **Doccano** - Open source text annotation tool
- **Snorkel** - Programmatic data labeling
- **Amazon SageMaker Ground Truth** - Managed data labeling

### Synthetic Data Generation
- **GPT-4 for data generation** - Create training examples with LLMs
- **Anthropic Claude** - Generate high-quality synthetic conversations
- **Alpaca** - Stanford's synthetic instruction-following data
- **Self-Instruct** - Automated instruction generation framework
- **Evol-Instruct** - Evolving instruction complexity for training

## Testing and Quality Assurance

### Testing Frameworks
- **pytest** - Python testing framework with LLM testing plugins
- **Promptfoo** - Test and evaluate LLM outputs
- **DeepEval** - LLM evaluation framework
- **TruLens** - Evaluation and tracking for LLM applications
- **Continuous Eval** - Open source evaluation framework

### Dataset and Benchmarking
- **HELM** - Holistic evaluation framework
- **lm-evaluation-harness** - Framework for evaluating language models
- **BigBench** - Diverse benchmark tasks for language models
- **SuperGLUE** - General language understanding benchmark

## Development Tools

### IDEs and Notebooks
- **Jupyter** - Interactive notebooks for experimentation
- **Google Colab** - Free cloud-based Jupyter environment
- **VS Code** - Code editor with LLM extensions
- **Cursor** - AI-first code editor
- **Replit** - Online IDE with AI assistance

### Libraries and SDKs
- **OpenAI Python SDK** - Official Python library for OpenAI API
- **Anthropic Python SDK** - Official Python library for Claude API
- **LangChain** - Framework for LLM application development
- **LlamaIndex** - Data framework for LLM applications
- **Guidance** - Microsoft's framework for controlling LLM generation

## Reference Count
This document contains references to **300+ tools, frameworks, platforms, models, techniques, and resources** across LLM agent frameworks, chatbot platforms, language models, agent architectures, NLP tools, vector databases, RAG systems, memory implementations, function calling, conversation design, prompt engineering, safety tools, evaluation frameworks, voice/multi-modal systems, deployment infrastructure, observability platforms, fine-tuning tools, annotation platforms, and development environments.
