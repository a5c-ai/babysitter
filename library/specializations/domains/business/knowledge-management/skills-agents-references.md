# Knowledge Management - Skills and Agents References

This document provides implementation references for the skills and agents identified in the Knowledge Management specialization backlog. References include GitHub repositories, MCP servers, community resources, and documentation links.

---

## Table of Contents

1. [Skills References](#skills-references)
2. [Agents References](#agents-references)
3. [MCP Server References](#mcp-server-references)
4. [Community Resources](#community-resources)
5. [Standards and Specifications](#standards-and-specifications)

---

## Skills References

### SK-001: Confluence Integration Skill (`confluence-km`)

**GitHub Repositories**:
- [atlassian-api/atlassian-python-api](https://github.com/atlassian-api/atlassian-python-api) - Python wrapper for Atlassian REST APIs including Confluence
- [pycontribs/confluence](https://github.com/pycontribs/confluence) - Confluence API client library
- [mrdon/python-confluence](https://github.com/mrdon/python-confluence) - Python library for Confluence
- [atlassian/confluence-client](https://github.com/atlassian/confluence-client) - Official Atlassian Confluence client
- [mister-muffin/confluence-dumper](https://github.com/mister-muffin/confluence-dumper) - Tool for exporting Confluence spaces

**MCP Servers**:
- [modelcontextprotocol/servers - Confluence](https://github.com/modelcontextprotocol/servers) - MCP server implementations (check for Atlassian integrations)
- Community MCP servers for Confluence integration

**Documentation**:
- [Confluence REST API Documentation](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/)
- [Confluence Cloud Developer Documentation](https://developer.atlassian.com/cloud/confluence/)
- [Atlassian SDK Documentation](https://developer.atlassian.com/server/framework/atlassian-sdk/)

**NPM Packages**:
- [confluence-api](https://www.npmjs.com/package/confluence-api) - Node.js Confluence API client
- [atlassian-confluence](https://www.npmjs.com/package/atlassian-confluence) - Confluence REST API wrapper

---

### SK-002: SharePoint Knowledge Management Skill (`sharepoint-km`)

**GitHub Repositories**:
- [pnp/pnpjs](https://github.com/pnp/pnpjs) - PnP JavaScript Library for Microsoft 365
- [pnp/powershell](https://github.com/pnp/powershell) - PnP PowerShell for SharePoint/Microsoft 365
- [pnp/sp-dev-fx-webparts](https://github.com/pnp/sp-dev-fx-webparts) - SharePoint Framework web parts samples
- [microsoftgraph/msgraph-sdk-javascript](https://github.com/microsoftgraph/msgraph-sdk-javascript) - Microsoft Graph SDK for JavaScript
- [SharePoint/sp-dev-docs](https://github.com/SharePoint/sp-dev-docs) - SharePoint developer documentation

**MCP Servers**:
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - Check for Microsoft Graph/SharePoint integrations
- Community MCP servers for Microsoft 365

**Documentation**:
- [Microsoft Graph API - Sites](https://learn.microsoft.com/en-us/graph/api/resources/sharepoint?view=graph-rest-1.0)
- [SharePoint REST API Reference](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/complete-basic-operations-using-sharepoint-rest-endpoints)
- [Microsoft Viva Topics Documentation](https://learn.microsoft.com/en-us/viva/topics/)

**NPM Packages**:
- [@pnp/sp](https://www.npmjs.com/package/@pnp/sp) - PnP SharePoint library
- [@microsoft/microsoft-graph-client](https://www.npmjs.com/package/@microsoft/microsoft-graph-client) - Microsoft Graph client

---

### SK-003: MediaWiki/Wiki.js Skill (`wiki-systems`)

**GitHub Repositories**:
- [wikimedia/mediawiki](https://github.com/wikimedia/mediawiki) - MediaWiki source code
- [requarks/wiki](https://github.com/requarks/wiki) - Wiki.js - modern wiki engine
- [Semantic-Org/SemanticMediaWiki](https://github.com/Semantic-Org/SemanticMediaWiki) - Semantic MediaWiki extension
- [wikimedia/pywikibot](https://github.com/wikimedia/pywikibot) - Python bot framework for MediaWiki
- [wikimedia/mediawiki-api-demos](https://github.com/wikimedia/mediawiki-api-demos) - MediaWiki API demo code

**MCP Servers**:
- Community Wiki.js MCP integrations
- MediaWiki API can be accessed via generic HTTP MCP servers

**Documentation**:
- [MediaWiki API Documentation](https://www.mediawiki.org/wiki/API:Main_page)
- [Wiki.js GraphQL API](https://docs.js.wiki/api)
- [Semantic MediaWiki Documentation](https://www.semantic-mediawiki.org/wiki/Semantic_MediaWiki)

**NPM Packages**:
- [wikibase-api](https://www.npmjs.com/package/wikibase-api) - Wikibase API client
- [mediawiki](https://www.npmjs.com/package/mediawiki) - MediaWiki bot framework
- [nodemw](https://www.npmjs.com/package/nodemw) - MediaWiki API client for Node.js

---

### SK-004: Notion Knowledge Base Skill (`notion-km`)

**GitHub Repositories**:
- [makenotion/notion-sdk-js](https://github.com/makenotion/notion-sdk-js) - Official Notion JavaScript SDK
- [NotionX/react-notion-x](https://github.com/NotionX/react-notion-x) - React renderer for Notion pages
- [jamalex/notion-py](https://github.com/jamalex/notion-py) - Unofficial Notion API client for Python
- [jaredpalmer/notion-email-sync](https://github.com/jaredpalmer/notion-email-sync) - Notion integration example
- [splitbee/notion-api-worker](https://github.com/splitbee/notion-api-worker) - Cloudflare Worker for Notion API

**MCP Servers**:
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - Check for Notion MCP server
- [Notion MCP Server implementations](https://github.com/search?q=notion+mcp+server) - Community implementations

**Documentation**:
- [Notion API Documentation](https://developers.notion.com/)
- [Notion Integration Guide](https://developers.notion.com/docs/getting-started)
- [Notion API Reference](https://developers.notion.com/reference/intro)

**NPM Packages**:
- [@notionhq/client](https://www.npmjs.com/package/@notionhq/client) - Official Notion client
- [notion-to-md](https://www.npmjs.com/package/notion-to-md) - Convert Notion pages to Markdown

---

### SK-005: Elasticsearch/OpenSearch Skill (`search-engine`)

**GitHub Repositories**:
- [elastic/elasticsearch](https://github.com/elastic/elasticsearch) - Elasticsearch search engine
- [opensearch-project/OpenSearch](https://github.com/opensearch-project/OpenSearch) - OpenSearch project
- [elastic/elasticsearch-js](https://github.com/elastic/elasticsearch-js) - Official Elasticsearch Node.js client
- [opensearch-project/opensearch-js](https://github.com/opensearch-project/opensearch-js) - OpenSearch JavaScript client
- [elastic/kibana](https://github.com/elastic/kibana) - Kibana analytics platform

**MCP Servers**:
- [modelcontextprotocol/servers - Elasticsearch](https://github.com/modelcontextprotocol/servers) - Potential Elasticsearch MCP
- Community search engine MCP implementations

**Documentation**:
- [Elasticsearch Reference Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)

**NPM Packages**:
- [@elastic/elasticsearch](https://www.npmjs.com/package/@elastic/elasticsearch) - Official Elasticsearch client
- [@opensearch-project/opensearch](https://www.npmjs.com/package/@opensearch-project/opensearch) - OpenSearch client
- [searchkit](https://www.npmjs.com/package/searchkit) - Elasticsearch UI components

---

### SK-006: Algolia Search Skill (`algolia-search`)

**GitHub Repositories**:
- [algolia/algoliasearch-client-javascript](https://github.com/algolia/algoliasearch-client-javascript) - Algolia JavaScript client
- [algolia/instantsearch](https://github.com/algolia/instantsearch) - InstantSearch.js UI library
- [algolia/react-instantsearch](https://github.com/algolia/react-instantsearch) - React InstantSearch
- [algolia/docsearch](https://github.com/algolia/docsearch) - DocSearch for documentation
- [algolia/autocomplete](https://github.com/algolia/autocomplete) - Autocomplete experiences

**MCP Servers**:
- Community Algolia MCP server implementations
- Search-as-a-service MCP patterns

**Documentation**:
- [Algolia Documentation](https://www.algolia.com/doc/)
- [Algolia API Reference](https://www.algolia.com/doc/api-reference/api-methods/)
- [InstantSearch Documentation](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/js/)

**NPM Packages**:
- [algoliasearch](https://www.npmjs.com/package/algoliasearch) - Algolia search client
- [instantsearch.js](https://www.npmjs.com/package/instantsearch.js) - InstantSearch UI library
- [react-instantsearch](https://www.npmjs.com/package/react-instantsearch) - React InstantSearch

---

### SK-007: Taxonomy Management Skill (`taxonomy-management`)

**GitHub Repositories**:
- [semantic-web/skos](https://github.com/semantic-web/skos) - SKOS implementations
- [PoolParty/PoolParty-SDK](https://github.com/PoolParty/PoolParty-SDK) - PoolParty taxonomy management (if available)
- [TopQuadrant/TopBraid-examples](https://github.com/TopQuadrant/TopBraid-examples) - TopBraid examples
- [protege-project/protege](https://github.com/protegeproject/protege) - Protege ontology editor
- [skosmos/Skosmos](https://github.com/NatLibFi/Skosmos) - SKOS browser and publishing tool

**MCP Servers**:
- Taxonomy/ontology MCP server patterns
- SKOS API integration servers

**Documentation**:
- [SKOS Reference](https://www.w3.org/TR/skos-reference/)
- [PoolParty Documentation](https://help.poolparty.biz/)
- [Protege Documentation](https://protegewiki.stanford.edu/wiki/Main_Page)

**NPM Packages**:
- [skos-api](https://www.npmjs.com/package/skos-api) - SKOS API utilities (if available)
- [jsonld](https://www.npmjs.com/package/jsonld) - JSON-LD processor
- [rdflib](https://www.npmjs.com/package/rdflib) - RDF library for JavaScript

---

### SK-008: Knowledge Graph Skill (`knowledge-graph`)

**GitHub Repositories**:
- [neo4j/neo4j](https://github.com/neo4j/neo4j) - Neo4j graph database
- [neo4j/neo4j-javascript-driver](https://github.com/neo4j/neo4j-javascript-driver) - Neo4j JavaScript driver
- [apache/jena](https://github.com/apache/jena) - Apache Jena semantic web framework
- [eclipse-rdf4j/rdf4j](https://github.com/eclipse-rdf4j/rdf4j) - Eclipse RDF4J
- [ontotext-ad/graphdb-workbench](https://github.com/Ontotext-AD/graphdb-workbench) - GraphDB workbench

**MCP Servers**:
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - Check for graph database MCP
- Neo4j MCP server implementations
- SPARQL endpoint MCP servers

**Documentation**:
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Apache Jena Documentation](https://jena.apache.org/documentation/)
- [RDF4J Documentation](https://rdf4j.org/documentation/)
- [SPARQL Query Language](https://www.w3.org/TR/sparql11-query/)

**NPM Packages**:
- [neo4j-driver](https://www.npmjs.com/package/neo4j-driver) - Neo4j JavaScript driver
- [sparql-http-client](https://www.npmjs.com/package/sparql-http-client) - SPARQL HTTP client
- [oxigraph](https://www.npmjs.com/package/oxigraph) - RDF graph store

---

### SK-009: Expert Finder Skill (`expert-finder`)

**GitHub Repositories**:
- [microsoft/skills-utils](https://github.com/microsoft) - Microsoft skills extraction (search for relevant repos)
- [linkedin/skills-utils](https://github.com/linkedin/skills-utils) - Skills taxonomy utilities
- [expert-finder/expert-finding](https://github.com/search?q=expert+finding) - Expert finding algorithms
- [networkx/networkx](https://github.com/networkx/networkx) - Network analysis for social graphs
- [SocioProphet/expertise-mining](https://github.com/search?q=expertise+mining) - Expertise mining approaches

**MCP Servers**:
- Skills/expertise API integrations
- Graph-based expert finding MCP patterns

**Documentation**:
- [LinkedIn Skills API](https://learn.microsoft.com/en-us/linkedin/) - Skills taxonomy reference
- [O*NET Skills Database](https://www.onetonline.org/) - Occupational skills database
- [ESCO Skills Taxonomy](https://esco.ec.europa.eu/) - European skills classification

**NPM Packages**:
- [graphology](https://www.npmjs.com/package/graphology) - Graph analysis library
- [social-network-analysis](https://www.npmjs.com/package/social-network-analysis) - SNA utilities

---

### SK-010: Content Curation Skill (`content-curation`)

**GitHub Repositories**:
- [huggingface/transformers](https://github.com/huggingface/transformers) - NLP models for content analysis
- [explosion/spaCy](https://github.com/explosion/spaCy) - Industrial NLP library
- [chartbeat-labs/textacy](https://github.com/chartbeat-labs/textacy) - Text analysis library
- [MaartenGr/BERTopic](https://github.com/MaartenGr/BERTopic) - Topic modeling with BERT
- [stanfordnlp/CoreNLP](https://github.com/stanfordnlp/CoreNLP) - Stanford CoreNLP

**MCP Servers**:
- NLP/content analysis MCP servers
- Text classification MCP patterns

**Documentation**:
- [Hugging Face Documentation](https://huggingface.co/docs)
- [spaCy Documentation](https://spacy.io/usage)
- [BERTopic Documentation](https://maartengr.github.io/BERTopic/)

**NPM Packages**:
- [natural](https://www.npmjs.com/package/natural) - Natural language processing
- [compromise](https://www.npmjs.com/package/compromise) - NLP in JavaScript
- [lda](https://www.npmjs.com/package/lda) - Latent Dirichlet Allocation

---

### SK-011: Community of Practice Platform Skill (`cop-platform`)

**GitHub Repositories**:
- [discourse/discourse](https://github.com/discourse/discourse) - Discourse forum platform
- [StackExchange/Stacks](https://github.com/StackExchange/Stacks) - Stack Overflow design system
- [flarum/flarum](https://github.com/flarum/flarum) - Modern forum software
- [questions2answers/question2answer](https://github.com/q2a/question2answer) - Q&A platform
- [answeroverflow/answeroverflow](https://github.com/AnswerOverflow/AnswerOverflow) - Discord to searchable Q&A

**MCP Servers**:
- Discourse API MCP integrations
- Community platform MCP patterns

**Documentation**:
- [Discourse API Documentation](https://docs.discourse.org/)
- [Stack Overflow for Teams API](https://api.stackexchange.com/docs)
- [Flarum Developer Documentation](https://docs.flarum.org/)

**NPM Packages**:
- [discourse-js](https://www.npmjs.com/package/discourse-js) - Discourse API client
- [stackexchange](https://www.npmjs.com/package/stackexchange) - Stack Exchange API client

---

### SK-012: Interview/Elicitation Recording Skill (`knowledge-elicitation`)

**GitHub Repositories**:
- [openai/whisper](https://github.com/openai/whisper) - OpenAI Whisper transcription
- [ggerganov/whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Whisper port in C++
- [pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio) - Speaker diarization
- [mozilla/DeepSpeech](https://github.com/mozilla/DeepSpeech) - Speech-to-text engine
- [AssemblyAI/assemblyai-python-sdk](https://github.com/AssemblyAI/assemblyai-python-sdk) - AssemblyAI SDK

**MCP Servers**:
- Audio transcription MCP servers
- Meeting recording API integrations

**Documentation**:
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [AssemblyAI Documentation](https://www.assemblyai.com/docs/)
- [Google Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Amazon Transcribe](https://docs.aws.amazon.com/transcribe/)

**NPM Packages**:
- [whisper-node](https://www.npmjs.com/package/whisper-node) - Whisper Node.js bindings
- [assemblyai](https://www.npmjs.com/package/assemblyai) - AssemblyAI client
- [@google-cloud/speech](https://www.npmjs.com/package/@google-cloud/speech) - Google Speech client

---

### SK-013: Learning Management System Skill (`lms-integration`)

**GitHub Repositories**:
- [moodle/moodle](https://github.com/moodle/moodle) - Moodle LMS platform
- [instructure/canvas-lms](https://github.com/instructure/canvas-lms) - Canvas LMS
- [AICC/CMI-5_Spec_Current](https://github.com/AICC/CMI-5_Spec_Current) - xAPI/CMI5 specification
- [ADL-Initiative/xAPI-Spec](https://github.com/adlnet/xAPI-Spec) - xAPI specification
- [RusticiSoftware/TinCan_Prototypes](https://github.com/RusticiSoftware/TinCan_Prototypes) - xAPI examples

**MCP Servers**:
- LMS API integration MCP patterns
- xAPI/SCORM MCP servers

**Documentation**:
- [Moodle Web Services API](https://docs.moodle.org/dev/Web_service_API_functions)
- [Canvas LMS API](https://canvas.instructure.com/doc/api/)
- [xAPI Specification](https://xapi.com/overview/)
- [SCORM Documentation](https://scorm.com/scorm-explained/)

**NPM Packages**:
- [xapi-js](https://www.npmjs.com/package/@xapi/xapi) - xAPI JavaScript library
- [canvas-api](https://www.npmjs.com/package/canvas-api) - Canvas API client
- [scorm-api-wrapper](https://www.npmjs.com/package/scorm-api-wrapper) - SCORM wrapper

---

### SK-014: Process Mining Skill (`process-mining`)

**GitHub Repositories**:
- [pm4py/pm4py-core](https://github.com/pm4py/pm4py-core) - PM4Py process mining library
- [bupaverse/bupaR](https://github.com/bupaverse/bupaR) - Business Process Analytics in R
- [apromore/ApromoreCore](https://github.com/apromore/ApromoreCore) - Apromore process analytics
- [signavio/business-process-mining](https://github.com/search?q=process+mining) - Process mining tools
- [process-intelligence-solutions/BPMN-IO](https://github.com/bpmn-io/bpmn-js) - BPMN.io toolkit

**MCP Servers**:
- Process mining API integrations
- Event log analysis MCP patterns

**Documentation**:
- [PM4Py Documentation](https://pm4py.fit.fraunhofer.de/documentation)
- [Celonis Documentation](https://docs.celonis.com/)
- [IEEE XES Standard](https://www.xes-standard.org/)

**NPM Packages**:
- [bpmn-js](https://www.npmjs.com/package/bpmn-js) - BPMN renderer and modeler
- [process-mining-js](https://www.npmjs.com/package/process-mining-js) - Process mining utilities (if available)

---

### SK-015: Metadata Schema Skill (`metadata-schema`)

**GitHub Repositories**:
- [json-schema-org/json-schema-spec](https://github.com/json-schema-org/json-schema-spec) - JSON Schema specification
- [schemaorg/schemaorg](https://github.com/schemaorg/schemaorg) - Schema.org vocabulary
- [dcmi/dublincore](https://github.com/dcmi) - Dublin Core metadata
- [ajv-validator/ajv](https://github.com/ajv-validator/ajv) - JSON Schema validator
- [everit-org/json-schema](https://github.com/everit-org/json-schema) - Java JSON Schema validator

**MCP Servers**:
- Schema validation MCP patterns
- Metadata harvesting MCP servers

**Documentation**:
- [JSON Schema Documentation](https://json-schema.org/learn/getting-started-step-by-step)
- [Schema.org Documentation](https://schema.org/docs/documents.html)
- [Dublin Core Metadata](https://www.dublincore.org/specifications/dublin-core/)
- [OAI-PMH Specification](http://www.openarchives.org/OAI/openarchivesprotocol.html)

**NPM Packages**:
- [ajv](https://www.npmjs.com/package/ajv) - JSON Schema validator
- [jsonld](https://www.npmjs.com/package/jsonld) - JSON-LD processor
- [schema-dts](https://www.npmjs.com/package/schema-dts) - Schema.org TypeScript definitions

---

### SK-016: Autocomplete/Type-ahead Skill (`autocomplete-engine`)

**GitHub Repositories**:
- [algolia/autocomplete](https://github.com/algolia/autocomplete) - Algolia Autocomplete
- [elastic/search-ui](https://github.com/elastic/search-ui) - Elastic Search UI
- [typesense/typesense](https://github.com/typesense/typesense) - Typesense search engine
- [meilisearch/meilisearch](https://github.com/meilisearch/meilisearch) - Meilisearch
- [twitter/typeahead.js](https://github.com/twitter/typeahead.js) - Twitter typeahead library

**MCP Servers**:
- Search suggestion MCP patterns
- Autocomplete API integrations

**Documentation**:
- [Elasticsearch Suggesters](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html)
- [Algolia Query Suggestions](https://www.algolia.com/doc/guides/building-search-ui/ui-and-ux-patterns/query-suggestions/js/)
- [Typesense Documentation](https://typesense.org/docs/)

**NPM Packages**:
- [@algolia/autocomplete-js](https://www.npmjs.com/package/@algolia/autocomplete-js) - Algolia Autocomplete
- [typesense](https://www.npmjs.com/package/typesense) - Typesense client
- [meilisearch](https://www.npmjs.com/package/meilisearch) - Meilisearch client

---

### SK-017: Readability Analysis Skill (`readability-analysis`)

**GitHub Repositories**:
- [shivam5992/textstat](https://github.com/shivam5992/textstat) - Python readability statistics
- [errata-ai/vale](https://github.com/errata-ai/vale) - Vale prose linter
- [wooorm/readability](https://github.com/wooorm/readability) - Readability formulas
- [btford/write-good](https://github.com/btford/write-good) - Naive linter for English prose
- [amperser/proselint](https://github.com/amperser/proselint) - Prose linter

**MCP Servers**:
- Text analysis MCP servers
- Writing quality MCP patterns

**Documentation**:
- [Vale Documentation](https://vale.sh/docs/)
- [Flesch-Kincaid Readability](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)

**NPM Packages**:
- [readability-scores](https://www.npmjs.com/package/readability-scores) - Readability metrics
- [write-good](https://www.npmjs.com/package/write-good) - English prose linter
- [text-readability](https://www.npmjs.com/package/text-readability) - Text readability analysis

---

### SK-018: Version Control for Content Skill (`content-versioning`)

**GitHub Repositories**:
- [git/git](https://github.com/git/git) - Git source code management
- [gitpython-developers/GitPython](https://github.com/gitpython-developers/GitPython) - Python Git library
- [isomorphic-git/isomorphic-git](https://github.com/isomorphic-git/isomorphic-git) - Git in JavaScript
- [nodegit/nodegit](https://github.com/nodegit/nodegit) - Node.js Git bindings
- [simple-git-js/simple-git](https://github.com/steveukx/git-js) - Simple Git for Node.js

**MCP Servers**:
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - Git MCP server
- Version control MCP patterns

**Documentation**:
- [Git Documentation](https://git-scm.com/doc)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitLab API Documentation](https://docs.gitlab.com/ee/api/)

**NPM Packages**:
- [simple-git](https://www.npmjs.com/package/simple-git) - Simple Git interface
- [isomorphic-git](https://www.npmjs.com/package/isomorphic-git) - Git for JavaScript
- [octokit](https://www.npmjs.com/package/octokit) - GitHub API client

---

### SK-019: Knowledge Analytics Skill (`knowledge-analytics`)

**GitHub Repositories**:
- [grafana/grafana](https://github.com/grafana/grafana) - Grafana analytics platform
- [apache/superset](https://github.com/apache/superset) - Apache Superset BI
- [metabase/metabase](https://github.com/metabase/metabase) - Metabase analytics
- [getredash/redash](https://github.com/getredash/redash) - Redash dashboards
- [plotly/plotly.js](https://github.com/plotly/plotly.js) - Plotly.js charting

**MCP Servers**:
- Analytics platform MCP integrations
- BI tool MCP patterns

**Documentation**:
- [Grafana Documentation](https://grafana.com/docs/)
- [Superset Documentation](https://superset.apache.org/docs/intro)
- [Metabase Documentation](https://www.metabase.com/docs/)

**NPM Packages**:
- [plotly.js](https://www.npmjs.com/package/plotly.js) - Plotly charting
- [chart.js](https://www.npmjs.com/package/chart.js) - Chart.js visualization
- [d3](https://www.npmjs.com/package/d3) - D3.js data visualization

---

### SK-020: Semantic Similarity Skill (`semantic-similarity`)

**GitHub Repositories**:
- [UKPLab/sentence-transformers](https://github.com/UKPLab/sentence-transformers) - Sentence Transformers
- [openai/openai-cookbook](https://github.com/openai/openai-cookbook) - OpenAI embeddings examples
- [facebookresearch/faiss](https://github.com/facebookresearch/faiss) - Facebook AI Similarity Search
- [pinecone-io/pinecone-client](https://github.com/pinecone-io/pinecone-python-client) - Pinecone vector DB
- [weaviate/weaviate](https://github.com/weaviate/weaviate) - Weaviate vector database

**MCP Servers**:
- Vector database MCP servers
- Embedding API MCP patterns

**Documentation**:
- [Sentence Transformers Documentation](https://www.sbert.net/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Weaviate Documentation](https://weaviate.io/developers/weaviate)

**NPM Packages**:
- [@pinecone-database/pinecone](https://www.npmjs.com/package/@pinecone-database/pinecone) - Pinecone client
- [weaviate-ts-client](https://www.npmjs.com/package/weaviate-ts-client) - Weaviate TypeScript client
- [openai](https://www.npmjs.com/package/openai) - OpenAI client for embeddings

---

## Agents References

### AG-001: Knowledge Architect Agent (`knowledge-architect`)

**Reference Frameworks**:
- [APQC Knowledge Management Framework](https://www.apqc.org/expertise/knowledge-management)
- [KM4Dev Knowledge Management Community](https://www.km4dev.org/)
- [Knowledge Management Institute](https://www.kminstitute.org/)

**GitHub Resources**:
- [knowledge-architecture/patterns](https://github.com/search?q=knowledge+architecture) - KM architecture patterns
- Information architecture repositories

**Publications and Standards**:
- ISO 30401:2018 - Knowledge management systems
- AIIM Information Management Body of Knowledge
- APQC Process Classification Framework

---

### AG-002: Taxonomy Specialist Agent (`taxonomy-specialist`)

**Reference Frameworks**:
- [ISO 25964 - Thesauri Standard](https://www.iso.org/standard/53657.html)
- [ANSI/NISO Z39.19 - Controlled Vocabularies](https://www.niso.org/publications/ansiniso-z3919-2005-r2010)
- [SKOS Simple Knowledge Organization System](https://www.w3.org/2004/02/skos/)

**GitHub Resources**:
- [taxonomy-management-tools](https://github.com/search?q=taxonomy+management) - Taxonomy tools
- [controlled-vocabulary](https://github.com/search?q=controlled+vocabulary) - Vocabulary management

**Communities**:
- [Taxonomy Boot Camp Conference](https://www.taxonomybootcamp.com/)
- [ISKO - International Society for Knowledge Organization](https://www.isko.org/)

---

### AG-003: Knowledge Engineer Agent (`knowledge-engineer`)

**Reference Frameworks**:
- [CommonKADS Methodology](http://www.commonkads.uva.nl/)
- [SECI Model (Nonaka and Takeuchi)](https://en.wikipedia.org/wiki/SECI_model_of_knowledge_dimensions)
- [Knowledge Engineering Methodology](https://www.sciencedirect.com/topics/computer-science/knowledge-engineering)

**GitHub Resources**:
- [knowledge-engineering](https://github.com/search?q=knowledge+engineering) - KE tools and methods
- [expert-systems](https://github.com/search?q=expert+system) - Expert system implementations

**Communities**:
- [Knowledge Acquisition Workshops](https://www.springer.com/series/558)
- [International Conference on Knowledge Engineering](https://www.keod.scitevents.org/)

---

### AG-004: Search and Findability Expert Agent (`search-expert`)

**Reference Frameworks**:
- [Information Retrieval Evaluation Metrics](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval))
- [Search Quality Evaluation Guidelines](https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf)
- [Nielsen Norman Group Search UX](https://www.nngroup.com/articles/search/)

**GitHub Resources**:
- [search-relevance](https://github.com/search?q=search+relevance) - Relevance tuning tools
- [elasticsearch-learning-to-rank](https://github.com/o19s/elasticsearch-learning-to-rank) - Learning to Rank

**Communities**:
- [Haystack Search Relevance Conference](https://haystackconf.com/)
- [Relevance Slack Community](https://relevancy.slack.com/)

---

### AG-005: Content Strategist Agent (`km-content-strategist`)

**Reference Frameworks**:
- [Content Strategy Quad (Brain Traffic)](https://www.braintraffic.com/insights/the-content-strategy-toolkit)
- [Kristina Halvorson's Content Strategy Model](https://www.contentstrategy.com/)
- [Content Design London Framework](https://contentdesign.london/)

**GitHub Resources**:
- [content-strategy](https://github.com/search?q=content+strategy) - Strategy tools
- [style-guide](https://github.com/search?q=style+guide+technical) - Style guide examples

**Communities**:
- [Confab Content Strategy Conference](https://www.confabevents.com/)
- [Content Strategy Alliance](https://www.contentstrategyalliance.com/)

---

### AG-006: Community Manager Agent (`cop-community-manager`)

**Reference Frameworks**:
- [Wenger-Trayner Communities of Practice](https://www.wenger-trayner.com/introduction-to-communities-of-practice/)
- [CMX Community Management Model](https://cmxhub.com/)
- [Feverbee Community Management Framework](https://www.feverbee.com/)

**GitHub Resources**:
- [community-management](https://github.com/search?q=community+management) - CoP tools
- [discourse-plugins](https://github.com/search?q=discourse+plugin) - Discourse extensions

**Communities**:
- [CMX Community Industry Group](https://cmxhub.com/)
- [Community Roundtable](https://communityroundtable.com/)

---

### AG-007: Learning Designer Agent (`km-learning-designer`)

**Reference Frameworks**:
- [ADDIE Instructional Design Model](https://www.instructionaldesign.org/models/addie/)
- [SAM (Successive Approximation Model)](https://www.alleninteractions.com/sam-process)
- [70-20-10 Learning Model](https://702010institute.com/)

**GitHub Resources**:
- [instructional-design](https://github.com/search?q=instructional+design) - ID tools
- [learning-experience](https://github.com/search?q=learning+experience) - LXD resources

**Communities**:
- [ATD (Association for Talent Development)](https://www.td.org/)
- [eLearning Industry Community](https://elearningindustry.com/)

---

### AG-008: Knowledge Graph Specialist Agent (`kg-specialist`)

**Reference Frameworks**:
- [RDF Primer](https://www.w3.org/TR/rdf-primer/)
- [OWL Web Ontology Language](https://www.w3.org/OWL/)
- [Knowledge Graph Design Patterns](https://enterprise-knowledge.com/knowledge-graph-design-patterns/)

**GitHub Resources**:
- [knowledge-graph](https://github.com/search?q=knowledge+graph) - KG implementations
- [ontology-engineering](https://github.com/search?q=ontology+engineering) - Ontology tools

**Communities**:
- [Knowledge Graph Conference](https://www.knowledgegraph.tech/)
- [Semantic Web Community](https://www.w3.org/community/semweb/)

---

### AG-009: Wiki/Platform Administrator Agent (`wiki-platform-admin`)

**Reference Frameworks**:
- [MediaWiki Administration Guide](https://www.mediawiki.org/wiki/Manual:Contents)
- [Confluence Space Administration](https://support.atlassian.com/confluence-cloud/docs/organize-your-space/)
- [SharePoint Site Administration](https://learn.microsoft.com/en-us/sharepoint/sites/sites-and-site-collections-overview)

**GitHub Resources**:
- [wiki-administration](https://github.com/search?q=wiki+administration) - Wiki tools
- [confluence-scripts](https://github.com/search?q=confluence+scripts) - Confluence automation

**Communities**:
- [MediaWiki Community](https://www.mediawiki.org/wiki/Project:Village_Pump)
- [Atlassian Community](https://community.atlassian.com/)

---

### AG-010: Knowledge Analyst Agent (`knowledge-analyst`)

**Reference Frameworks**:
- [APQC KM Metrics Framework](https://www.apqc.org/resource-library/resource-listing/knowledge-management-metrics-that-matter)
- [KM ROI Calculation Methods](https://www.kmworld.com/Articles/Editorial/Features/Knowledge-management-ROI-Its-time-to-measure-up-88451.aspx)
- [Knowledge Audit Methodologies](https://en.wikipedia.org/wiki/Knowledge_audit)

**GitHub Resources**:
- [km-analytics](https://github.com/search?q=knowledge+management+analytics) - KM analytics
- [content-analytics](https://github.com/search?q=content+analytics) - Content metrics

**Communities**:
- [KM World Conference](https://www.kmworld.com/Conference/)
- [APQC Knowledge Management Community](https://www.apqc.org/expertise/knowledge-management)

---

### AG-011: Subject Matter Expert Liaison Agent (`sme-liaison`)

**Reference Frameworks**:
- [Knowledge Elicitation Techniques](https://www.sciencedirect.com/topics/computer-science/knowledge-elicitation)
- [Cognitive Task Analysis Methods](https://www.oxfordhandbooks.com/view/10.1093/oxfordhb/9780199757183.001.0001/oxfordhb-9780199757183-e-3)
- [Expert Interview Methods](https://www.nngroup.com/articles/interviewing-users/)

**GitHub Resources**:
- [interview-techniques](https://github.com/search?q=interview+techniques) - Interview tools
- [knowledge-capture](https://github.com/search?q=knowledge+capture) - Capture methods

**Communities**:
- [Human Factors and Ergonomics Society](https://www.hfes.org/)
- [Association for Computing Machinery (ACM)](https://www.acm.org/)

---

### AG-012: Information Governance Specialist Agent (`info-governance`)

**Reference Frameworks**:
- [ARMA Information Governance Principles (Generally Accepted Recordkeeping Principles)](https://www.arma.org/page/principles)
- [COBIT Information Governance Framework](https://www.isaca.org/resources/cobit)
- [ISO 27001 Information Security](https://www.iso.org/isoiec-27001-information-security.html)

**GitHub Resources**:
- [information-governance](https://github.com/search?q=information+governance) - IG tools
- [records-management](https://github.com/search?q=records+management) - RM systems

**Communities**:
- [ARMA International](https://www.arma.org/)
- [AIIM Information Management Community](https://www.aiim.org/)

---

## MCP Server References

### Available MCP Servers for Knowledge Management

| Category | MCP Server | GitHub Repository | Description |
|----------|------------|-------------------|-------------|
| Filesystem | filesystem | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) | File operations for content management |
| Git | git | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/git) | Version control for content |
| GitHub | github | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/github) | GitHub integration |
| GitLab | gitlab | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab) | GitLab integration |
| Slack | slack | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/slack) | Team communication |
| PostgreSQL | postgres | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) | Database operations |
| SQLite | sqlite | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite) | Local database |
| Memory | memory | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) | Knowledge graph memory |
| Fetch | fetch | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) | Web content retrieval |

### Community MCP Servers

| Category | MCP Server | Repository | Description |
|----------|------------|------------|-------------|
| Confluence | confluence-mcp | Community | Atlassian Confluence integration |
| Notion | notion-mcp | Community | Notion workspace integration |
| SharePoint | sharepoint-mcp | Community | Microsoft SharePoint integration |
| Elasticsearch | elasticsearch-mcp | Community | Search engine integration |
| Neo4j | neo4j-mcp | Community | Knowledge graph database |
| Vector DB | pinecone-mcp | Community | Vector similarity search |

### MCP Development Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP SDK - TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP SDK - Python](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)

---

## Community Resources

### Professional Organizations

| Organization | Focus Area | Website |
|-------------|------------|---------|
| APQC | Knowledge Management Benchmarking | [apqc.org](https://www.apqc.org/) |
| KM Institute | KM Certification and Training | [kminstitute.org](https://www.kminstitute.org/) |
| AIIM | Information Management | [aiim.org](https://www.aiim.org/) |
| ARMA International | Records and Information Management | [arma.org](https://www.arma.org/) |
| ISKO | Knowledge Organization | [isko.org](https://www.isko.org/) |

### Conferences

| Conference | Focus | Website |
|-----------|-------|---------|
| KM World | Enterprise Knowledge Management | [kmworld.com](https://www.kmworld.com/Conference/) |
| Taxonomy Boot Camp | Taxonomy and Metadata | [taxonomybootcamp.com](https://www.taxonomybootcamp.com/) |
| Haystack | Search Relevance | [haystackconf.com](https://haystackconf.com/) |
| Knowledge Graph Conference | Knowledge Graphs | [knowledgegraph.tech](https://www.knowledgegraph.tech/) |
| Enterprise Search Summit | Enterprise Search | [enterprisesearchsummit.com](https://www.enterprisesearchsummit.com/) |

### Online Communities

| Community | Platform | Focus |
|-----------|----------|-------|
| KM4Dev | Web/Mailing List | Development sector KM |
| r/knowledgemanagement | Reddit | General KM discussion |
| Search Relevance | Slack | Search optimization |
| Semantic Web Community | W3C | Semantic technologies |
| Information Architecture Institute | Slack | IA practices |

### Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| APQC KM Essentials | Course | [apqc.org/training](https://www.apqc.org/training) |
| Coursera KM Courses | MOOC | [coursera.org](https://www.coursera.org/search?query=knowledge%20management) |
| KM Institute Certification | Certification | [kminstitute.org](https://www.kminstitute.org/certification) |
| Elasticsearch Tutorials | Documentation | [elastic.co/training](https://www.elastic.co/training/) |
| Neo4j GraphAcademy | Course | [graphacademy.neo4j.com](https://graphacademy.neo4j.com/) |

---

## Standards and Specifications

### Knowledge Organization Standards

| Standard | Description | Reference |
|----------|-------------|-----------|
| ISO 25964 | Thesauri and Interoperability | [iso.org](https://www.iso.org/standard/53657.html) |
| SKOS | Simple Knowledge Organization System | [w3.org](https://www.w3.org/2004/02/skos/) |
| OWL | Web Ontology Language | [w3.org](https://www.w3.org/OWL/) |
| RDFS | RDF Schema | [w3.org](https://www.w3.org/TR/rdf-schema/) |
| SPARQL | RDF Query Language | [w3.org](https://www.w3.org/TR/sparql11-query/) |

### Metadata Standards

| Standard | Description | Reference |
|----------|-------------|-----------|
| Dublin Core | Basic metadata elements | [dublincore.org](https://www.dublincore.org/) |
| Schema.org | Web content markup | [schema.org](https://schema.org/) |
| JSON-LD | JSON for Linked Data | [json-ld.org](https://json-ld.org/) |
| OAI-PMH | Metadata harvesting protocol | [openarchives.org](http://www.openarchives.org/OAI/openarchivesprotocol.html) |

### Learning Standards

| Standard | Description | Reference |
|----------|-------------|-----------|
| xAPI | Experience API for learning | [xapi.com](https://xapi.com/) |
| SCORM | Shareable Content Object Reference Model | [scorm.com](https://scorm.com/) |
| CMI5 | Next-gen SCORM | [xapi.com/cmi5](https://xapi.com/cmi5/) |
| LTI | Learning Tools Interoperability | [imsglobal.org](https://www.imsglobal.org/activity/learning-tools-interoperability) |

### Information Governance Standards

| Standard | Description | Reference |
|----------|-------------|-----------|
| ISO 30401 | Knowledge Management Systems | [iso.org](https://www.iso.org/standard/68683.html) |
| ISO 15489 | Records Management | [iso.org](https://www.iso.org/standard/62542.html) |
| ISO 27001 | Information Security | [iso.org](https://www.iso.org/isoiec-27001-information-security.html) |
| GDPR | Data Protection Regulation | [gdpr.eu](https://gdpr.eu/) |

---

## Summary

This reference document provides implementation resources for 20 skills and 12 agents identified in the Knowledge Management specialization backlog:

| Category | Count | Key References |
|----------|-------|----------------|
| GitHub Repositories | 100+ | Official SDKs, community tools |
| MCP Servers | 15+ | Model Context Protocol integrations |
| NPM Packages | 60+ | JavaScript/TypeScript libraries |
| Standards | 15+ | ISO, W3C, industry specifications |
| Communities | 20+ | Professional organizations, conferences |

### Implementation Notes

1. **Start with official SDKs** - Use official client libraries where available (e.g., Atlassian, Microsoft, OpenAI)
2. **Leverage MCP servers** - Check modelcontextprotocol/servers for existing integrations
3. **Follow standards** - Implement using SKOS, Dublin Core, xAPI where applicable
4. **Join communities** - Engage with APQC, KM Institute, Haystack for best practices

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Related**: skills-agents-backlog.md
