# Technical Documentation References

## Documentation Tools and Platforms

### Static Site Generators
- **Docusaurus** - React-based documentation framework by Meta, optimized for versioned docs, MDX support, built-in search, and i18n
- **MkDocs** - Python-based static site generator with Material theme, simple YAML configuration, plugin ecosystem
- **Sphinx** - Python documentation generator, reStructuredText support, extensive extension system, autodoc capabilities
- **VuePress** - Vue-powered static site generator with markdown-centered project structure
- **Jekyll** - Ruby-based static site generator with GitHub Pages integration
- **Hugo** - Go-based framework known for speed and flexibility

### Docs-as-Code Approach
- **Version control integration** - Documentation stored alongside code in Git repositories
- **Review workflows** - Pull request reviews for documentation changes
- **CI/CD pipelines** - Automated builds, testing, and deployment of documentation
- **Local development** - Write and preview docs in the same environment as code
- **Branch-based workflows** - Feature branches for documentation changes
- **Automated validation** - Link checking, spell checking, linting

## API Documentation

### OpenAPI/Swagger Ecosystem
- **OpenAPI Specification (OAS)** - Industry-standard specification for REST APIs (formerly Swagger)
- **Swagger UI** - Interactive API documentation with try-it-out functionality
- **Swagger Editor** - Browser-based editor for OpenAPI specs
- **Redoc** - OpenAPI/Swagger-generated API documentation with responsive three-panel design
- **Stoplight Studio** - Visual OpenAPI designer with mock servers
- **Postman** - API platform with documentation generation from collections

### API Documentation Tools
- **GraphQL** - Schema introspection and documentation (GraphiQL, GraphQL Playground)
- **AsyncAPI** - Specification for event-driven/async APIs
- **ReadMe** - Interactive API documentation platform with API metrics
- **Slate** - Clean, responsive API documentation framework
- **API Blueprint** - Markdown-based API description language

## Diagramming and Visualization

### Code-Based Diagramming
- **Mermaid** - Markdown-inspired text definitions for diagrams (flowcharts, sequence, Gantt, class, state, ER diagrams)
- **PlantUML** - Java-based tool for UML diagrams from plain text descriptions
- **D2** - Modern diagram scripting language with hand-drawn styling
- **Graphviz** - Graph visualization using DOT language
- **Structurizr** - C4 model architecture diagrams as code

### Architecture Diagrams
- **C4 Model** - Context, Containers, Components, Code architecture visualization
- **Diagrams (Python)** - Cloud architecture diagrams using Python code
- **Kroki** - Unified API for multiple diagram types (PlantUML, Mermaid, GraphViz, etc.)
- **Draw.io/Diagrams.net** - Web-based diagramming with version control integration

## Style Guides and Standards

### Industry Style Guides
- **Google Developer Documentation Style Guide** - Comprehensive guide covering voice, tone, grammar, accessibility, and formatting
- **Microsoft Writing Style Guide** - Modern approach to writing about technology for global audiences
- **IBM Carbon Design System** - Content guidelines for UI and technical content
- **Red Hat Technical Writing Style Guide** - Open source documentation standards
- **Apple Style Guide** - Guidelines for Apple platform documentation

### Style Guide Principles
- **Consistency** - Terminology, formatting, structure
- **Clarity** - Simple language, active voice, short sentences
- **Accessibility** - Alt text, color contrast, screen reader compatibility
- **Inclusivity** - Gender-neutral language, cultural awareness
- **Scannability** - Headings, lists, tables, visual hierarchy

## Knowledge Management

### Documentation Platforms
- **Confluence** - Enterprise wiki and collaboration platform
- **Notion** - All-in-one workspace for notes, docs, wikis
- **GitBook** - Documentation platform with Git integration
- **BookStack** - Self-hosted, easy-to-use documentation platform
- **Outline** - Open source knowledge base with Markdown support

### Search and Discovery
- **Algolia DocSearch** - Search-as-a-service for documentation sites
- **Elasticsearch** - Full-text search engine for large documentation sets
- **Lunr.js** - Client-side full-text search
- **Fuse.js** - Lightweight fuzzy-search library

### Content Management
- **Headless CMS** - Contentful, Strapi, Sanity for structured content
- **Component libraries** - Storybook for UI component documentation
- **ADR (Architecture Decision Records)** - Lightweight documentation of architecture decisions
- **RFC process** - Request for Comments for design proposals

## Documentation Testing and Quality

### Validation Tools
- **Vale** - Syntax-aware linter for prose and documentation
- **markdownlint** - Markdown style and syntax checking
- **alex** - Catch insensitive, inconsiderate writing
- **write-good** - Naive linter for English prose
- **textlint** - Pluggable linting tool for text and markdown

### Link Checking
- **markdown-link-check** - Check markdown files for broken links
- **linkinator** - Link validation across websites
- **broken-link-checker** - Find broken links in HTML

### Screenshot and Code Testing
- **Percy** - Visual testing and review for documentation
- **Playwright** - Browser automation for testing interactive docs
- **doctest** - Testing code examples in documentation

## Versioning and Localization

### Version Management
- **Semantic versioning** - Documentation versions aligned with product releases
- **Version switcher** - UI component for navigating between doc versions
- **Deprecation notices** - Clear communication of deprecated features
- **Changelog** - Structured documentation of changes

### Internationalization (i18n)
- **Crowdin** - Translation management platform
- **Transifex** - Localization platform for documentation
- **Weblate** - Web-based translation tool with Git integration
- **i18next** - Internationalization framework for web applications

## Collaborative Writing

### Real-time Collaboration
- **Google Docs** - Real-time collaborative editing
- **HackMD/CodiMD** - Collaborative markdown editor
- **Etherpad** - Real-time collaborative text editing
- **Dropbox Paper** - Collaborative workspace for documentation

### Review and Feedback
- **GitHub Pull Requests** - Code review workflow for documentation
- **GitLab Merge Requests** - Built-in review and approval process
- **Reviewable** - Code review tool with documentation focus
- **Hypothesis** - Web annotation and collaborative discussion

## Specialized Documentation Types

### API Reference Generation
- **JSDoc** - JavaScript API documentation generator
- **Javadoc** - Java documentation generator
- **Doxygen** - Multi-language documentation generator
- **rustdoc** - Rust documentation tool
- **Godoc** - Go documentation tool
- **Pydoc/Sphinx** - Python documentation tools

### Runbook and Operational Docs
- **Runbook templates** - Incident response procedures
- **Operational checklists** - Deployment, rollback, troubleshooting
- **On-call guides** - Alert handling and escalation procedures
- **SRE documentation** - Service reliability engineering practices

### Tutorial and Learning Content
- **Interactive tutorials** - Katacoda, Instruqt for hands-on learning
- **Jupyter notebooks** - Executable documentation for data science
- **Executable books** - Jupyter Book for computational narratives
- **Code playgrounds** - CodeSandbox, StackBlitz embeds

## Analytics and Metrics

### Documentation Analytics
- **Google Analytics** - Page views, user behavior, search queries
- **Amplitude** - Product analytics for documentation engagement
- **Mixpanel** - User interaction tracking
- **Heap** - Automatic event tracking

### Feedback Mechanisms
- **Feedback widgets** - Thumbs up/down, rating systems
- **User surveys** - Satisfaction scores (CSAT, NPS)
- **Issue tracking** - GitHub Issues for documentation bugs
- **Documentation support tickets** - Track documentation-related questions

## Accessibility (a11y)

### Standards and Guidelines
- **WCAG 2.1** - Web Content Accessibility Guidelines
- **Section 508** - U.S. federal accessibility requirements
- **ARIA** - Accessible Rich Internet Applications specifications

### Accessibility Tools
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Pa11y** - Automated accessibility testing in CI/CD
- **Lighthouse** - Auditing for accessibility, performance, SEO

## Reference Count
This document contains references to **100+ tools, platforms, standards, and practices** across documentation tools, API documentation, diagramming, style guides, knowledge management, testing, versioning, collaboration, specialized documentation types, analytics, and accessibility.
