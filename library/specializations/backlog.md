For each specialization, ensure a directory under `specializations/[name]/` with the following structure:
```
specializations/
├── domains/
    ├── [domain-name-slugified]/
        ├── [specialization-name-slugified]/
                ├── references.md - research for reference materials for processes and methodologies for this specialization. Make sure to include links to the references.
                ├── README.md - roles and responsibilities for this specialization, goals and objectives, use cases, common flows, description of the specialization, and other relevant information.
```

Software and R&D Specializations (give a proper name to each specialization) - in specialization directory without the domain directory: 
[x] Data Science and Machine Learning - example for good reference: https://www.researchgate.net/publication/378735203_Principles_of_Rigorous_Development_and_of_Appraisal_of_ML_and_AI_Methods_and_Systems
    # library/specializations/data-science-and-machine-learning/
[x] Product Management, Product Strategy
    # library/specializations/product-management/
[x] DevOps, SRE, Platform Engineering
    # library/specializations/devops-sre-platform/
[x] Security, Compliance, Risk Management - now has an end-to-end flagship: scope/boundary definition, framework control mapping, parallel control + scan evidence collection, evidence-sufficiency gate, policy-gated exceptions/sign-off/external release (flagship process: security-attestation-workflow.js; anchors the 22 point processes BY NAME)
    # library/specializations/security-compliance/
[x] Software Architecture, Design Patterns
    # library/specializations/software-architecture/
[x] Monitoring, Ingestions, ETL, Analytics, BI, Data Engineering, Data-Driven Decision Making, A/B Testing - now has an end-to-end flagship: data-contract definition, source profiling, model/pipeline build, executed quality + reconciliation gates, policy-gated backfill/cutover/deprecation (flagship process: data-product-lifecycle-workflow.js)
    # library/specializations/data-engineering-analytics/
[x] UX/UI Design, User Experience, User Interface
    # library/specializations/ux-ui-design/
[x] QA, Testing Automation, Testing - now has an end-to-end flagship: risk-based strategy, coverage/gap analysis, environment+test-data fidelity gate, parallel multi-tier execution, false-green gate, policy-gated waivers/quarantines, release quality certificate (flagship process: release-quality-assurance-workflow.js; owns the EVIDENCE, release-engineering/release-lifecycle.js owns the ACT)
    # library/specializations/qa-testing-automation/
[x] Documentation, Technical Writing, Technical Communication, Specifications, Standards
    # library/specializations/technical-documentation/
[x] Meta Specialization: library/specializations/meta/ - for domain, specialization, processes, skills and agents creation. (mostly from the instructions in this file, file names and locations, the process below as composable sub processes and skills, etc.) - all detailed with all the relevant information and references, and examples if available.

Engineering Specializations (give a proper name to each specialization): (not under domains directory)

[x] Embedded Systems, Hardware, Firmware, Device Drivers, Hardware-Software Integration
[x] Robotics and world simulation
[x] Game Product Development
[x] Web Product Development (frameworks, patterns, best practices, tools, sdk, libraries, etc.)
[x] Mobile Product Development
[x] Desktop Product Development
[x] AI Agents and Conversational AI Agents and Chatbots - Howtos, UX, Frameworks, Tools, SDKs, Libraries, Best Practices, Patterns, etc.
[x] Algorithms, Optimization, Microcoding, l33tcode, etc.
[x] SDKs Development, Platforms Development, Systems Development and Tools Development, Frameworks Development, Libraries Development, etc.
[x] GPU Programming, CUDA, OpenCL, etc.
[x] FPGA Programming, VHDL, Verilog, etc.
[x] Cryptography, Blockchain Development, Smart Contracts, Zero-Knowledge Proofs, etc.
[x] CLI development. MCP development.
[x] Programming Languages Development, Compilers Development, Interpreters Development, etc.
[x] Network Programming, Network Protocols, Network Security, Network Management, Network Monitoring, Network Analysis, Network Troubleshooting, etc.
[x] Porting, Refactoring, Modernization, Migration, etc.
[x] Performance Optimization, Profiling, Benchmarking, Memory Management, Memory Leaks, Memory Leak Detection, Memory Leak Fixing, etc.
[x] Security Research, Vulnerability Research, Vulnerability Detection, Vulnerability Fixing, etc.
[x] Backend Development, APIs, Domain-Driven Systems - now has its first process (backend-service-delivery.js)
    # library/specializations/backend-development/
[x] Shared Cross-Domain Assets - home for assets useful across many specializations (first skill: kip-librarian)
    # library/specializations/shared/
[x] Customer Support - support operations specialization (flagship process: ticket-lifecycle.js)
    # library/specializations/customer-support/
[x] Incident Management - incident response specialization consolidating three prior incident files (flagship process: incident-lifecycle.js)
    # library/specializations/incident-management/
[x] Release Engineering - release management specialization covering versioning, changelogs, release trains, and rollout gates (flagship process: release-lifecycle.js)
    # library/specializations/release-engineering/
[x] Data Privacy Compliance - privacy operations specialization covering DSAR handling, consent, and data-protection workflows (flagship process: dsar-lifecycle.js)
    # library/specializations/data-privacy-compliance/
[x] Communication - internal/external communication specialization, now with README and flagship multi-audience announcement pipeline (flagship process: multi-audience-announcement-pipeline.js)
    # library/specializations/communication/
[x] Authoring - long-form content authoring and editorial operations; README added in the hollow-spec consolidation pass (processes: editorial-lifecycle.js, documenter.js)
    # library/specializations/authoring/
[x] Collaboration - code review and repository collaboration assets; README added in the hollow-spec consolidation pass (assets: code-review/, github/, skills/six-dimension-code-review)
    # library/specializations/collaboration/
[x] Media - generative media production; README added in the hollow-spec consolidation pass (flagship process: media-production-pipeline.js; skill: generative-media-prompting)
    # library/specializations/media/
[x] Research - research, scanning and publication specialization; now also the home of the folded sourcing pipeline (processes: research-publication-workflow.js, news-intelligence-pipeline.js, novelties-scanner.js, standards-gap-audit.js)
    # library/specializations/research/

Folded vestigial directories (header-only @deprecated re-export pointers, kept so existing process ids keep resolving):
[x] sourcing/ -> research/ - specializations/sourcing/news-intelligence-pipeline.js is a pointer to specializations/research/news-intelligence-pipeline.js
[x] business/ -> domains/business/business-strategy/ - specializations/business/revenue.js is a pointer to specializations/domains/business/business-strategy/revenue.js

Science Specializations (give a proper name to each specialization): each in process/specializations/domains/science/[specialization-name-slugified]/

[x] General Purpose Scientific Discovery, Engineering, and Problem Solving - Methodical Creative Thinking. Thinking Patterns for Scientific Discovery, Thinking and discovery patterns.
[x] Quantum Computing, Quantum Algorithms, Quantum Hardware, Quantum Software
[x] Bioinformatics, Genomics, Proteomics
[x] Nanotechnology
[x] Materials Science
[x] Aerospace Engineering
[x] Automotive Engineering
[x] Mechanical Engineering
[x] Electrical Engineering
[x] Chemical Engineering
[x] Biomedical Engineering - now has an end-to-end flagship: design-control intake, ISO 14971 risk management, parallel design characterization, policy-gated design freeze, V&V, DHF sufficiency gate, policy-gated submission, post-market surveillance with severity-routed CAPA (flagship process: medical-device-tplc-workflow.js; composes the 14 point processes BY NAME)
    # library/specializations/domains/science/biomedical-engineering/
[x] Environmental Engineering
[x] Industrial Engineering
[x] Computer Science
[x] Mathematics
[x] Physics
[x] Civil Engineering - now has an end-to-end flagship: concept design and load/seismic analysis, parallel discipline design, specs + BIM coordination + permit package, independent adversarial structural peer review, engineer-of-record stamp, construction release, QC hold points, handover/as-built reconciliation (flagship process: design-to-construction-workflow.js)
    # library/specializations/domains/science/civil-engineering/

Business and Finance Specializations (give a proper name to each specialization): each in process/specializations/domains/business/[specialization-name-slugified]/

[x] Business
[x] Finance, Accounting, Economics
[x] Marketing
[x] Sales
[x] Legal
[x] Human Resources
[x] Customer Service, Support, Customer Success, Customer Experience
[x] General Purpose Project Management, Leadership, etc. - now has an end-to-end flagship: business case + charter, WBS/scope baseline, parallel core and supporting planning, estimate-and-risk-realism gate, stage-gated execution with EVM checkpoints, status-integrity (watermelon) gate, bounded change-control-board loop, steering phase gates, closure and benefits realization (flagship process: program-delivery-workflow.js)
    # library/specializations/domains/business/project-management/
[x] Supply Chain Management
[x] Logistics, Transportation, Shipping, Freight, Warehousing, Inventory Management
[x] VCs, investments and Due Diligence processes (processes for evaluating and selecting investments, due diligence, valuation, monitoring and tracking, allocation, risk management, portfolio management, deal flow management, deal structuring, etc.) - now has an end-to-end flagship: sourcing/thesis-fit screening, six parallel diligence workstreams, diligence-completeness gate, valuation triangulation + ownership model, memo with an adversarial bear-case gate, check-size-matrix-routed IC decision, policy-gated term sheet/wiring, portfolio monitoring and follow-on reserves (flagship process: investment-lifecycle-workflow.js; composes the 21 point processes BY NAME)
    # library/specializations/domains/business/venture-capital/
[x] Enterpreneurship and Startup Processes (presentations, pitch decks, business plans, market research, funding, investor relations, etc.)
[x] Business Strategy
[x] Operations
[x] Business Analysis and Consulting
[x] Intelligence, Decision Support and Decision Making
[x] Knowledge Management - now has an end-to-end flagship: kip corpus recall, multi-method intake, curation, parallel dedupe/enrichment/classification, adversarial accuracy-and-freshness gate, merge adjudication, policy-gated taxonomy change and KB publish, decay monitoring, policy-gated retirement (flagship process: knowledge-lifecycle-workflow.js)
    # library/specializations/domains/business/knowledge-management/
[x] Advertising, Social Media, Content Marketing,  Influencer Marketing, etc.
[x] Public Relations, etc.
[x] Procurement - sourcing, vendor selection, and purchase-order operations (flagship process: procurement-lifecycle.js)
    # library/specializations/domains/business/procurement/
[x] Observability - SLO design, instrumentation, alert tuning, error-budget review (flagship process: slo-lifecycle.js; incident-lifecycle.js is a deprecation pointer to the incident-management specialization)
    # library/specializations/observability/
[x] Accessibility - WCAG audit, remediation, re-audit gate, conformance-statement publish (flagship process: wcag-audit-remediation.js; supersedes web-development/accessibility-audit-remediation.js)
    # library/specializations/accessibility/
[x] Internationalization - string extraction, per-locale translation QA, locale regression sweeps, locale release (flagship process: localization-lifecycle.js)
    # library/specializations/internationalization/
[x] MLOps - model eval harnesses, promotion gates, drift monitoring, dataset governance (flagship process: model-lifecycle.js)
    # library/specializations/mlops/
[x] Developer Relations - docs-driven sample apps, accuracy gates, multi-channel content, community triage (flagship process: devrel-campaign.js)
    # library/specializations/developer-relations/

Social Sciences and Humanities Specializations (give a proper name to each specialization): each in process/specializations/domains/social-sciences-humanities/[specialization-name-slugified]/

[x] Healthcare, Medical, Healthcare Management, Medical Management - now has an end-to-end flagship: safety-event intake + harm classification, gated containment, parallel investigation (clinical review, iterative RCA, harm assessment, conditional FMEA), CAPA dossier, investigation-sufficiency gate, statutory-clock regulatory filing and patient/family disclosure, PDSA practice change, deadline-audited closure (flagship process: clinical-safety-quality-workflow.js; composes 13 point processes BY NAME)
    # library/specializations/domains/social-sciences-humanities/healthcare/
[x] Education, Teaching, Learning, Learning Management System, Learning Management System
[x] Social Sciences - FIRST end-to-end flagship in the social-sciences-humanities tier (establishes the tier contract: routed-gate-combinator reuse, per-domain kip kind, policy-gated executors, fail-closed terminals): research question, design selection, instrument validation, locked pre-registration, IRB determination, fieldwork, executed analyses, manuscript (flagship process: empirical-study-lifecycle-workflow.js; composes 20 point processes BY NAME)
    # library/specializations/domains/social-sciences-humanities/social-sciences/
[x] Humanities and anthropology
[x] Philosophy, Theology
[x] Arts and culture

# Processes for creating domains, specializations, processes, skills and agents

## Phase 1: Research, Readme and References

At this phase, only research the specializations and their references for common practices, etc. Do not create the actual process.js files from the references yet. only create the README.md and references.md files. for each.

## Phase 2: Identifying Processes, methodologies, work patterns, flows, processes, etc.

Create a processes-backlog.md file in the directory. This file will contain the list of processes, methodologies, work patterns, flows, processes, etc. for this specialization. with bullet point (open todo, for each process identified - with a short description of the process, and a link to the reference if available)

## Phase 3: Create process javascript files for each process identified

for each process in the processes-backlog.md file, create a js file in the directory. according to the syntax, conventions and patterns of the Babysitter SDK and the rest of the existing processes.

## Phase 4: Identify skills and agents to support the processes

For each process implemented as a js file, identify agents (subagents) or relevant skills (some of them are currently using the general-purpose agents) to be created or searched for to support the process. and create a skills-agents-backlog.md file in the directory. this file will contain the list of skills and agents to be created or searched for to support the process. with bullet point (open todo, for each skill and agent identified - with a short description of the skill and agent, and a link to the reference if available)

if the skill or agent is common or shared between specializations, create the skills or agents directory in common ancestors directories. for example, if the skill name is as generic as developer-skill, put it in the skills-agents-backlog.md file in the common ancestors directories (could also be under a specific domain directory).

## Phase 5: Research and add references to the skills-agents-references.md file

from skills-agents-backlog.md (at any level of the directory structure)

Look online (mostly in github) for community created claude skills, agents, plugins and mcps that can be used to support the processes. and add them to the skills-agents-references.md file.

Reference links for skills and agents search:

https://github.com/alirezarezvani/claude-skills/tree/main
https://github.com/wshobson/agents
https://github.com/KhazP/vibe-coding-prompt-template
https://github.com/kasperjunge/agent-resources
https://github.com/levnikolaevich/claude-code-skills
https://github.com/ComposioHQ/awesome-claude-skills
https://github.com/VoltAgent/awesome-claude-skills
https://github.com/EveryInc/compound-engineering-plugin
https://github.com/trailofbits/skills
https://github.com/hesreallyhim/awesome-claude-code?tab=readme-ov-file#agent-skills-
https://github.com/laguagu/claude-code-nextjs-skills
https://github.com/SawyerHood/dev-browser
https://github.com/zechenzhangAGI/AI-research-SKILLs
https://github.com/Prat011/awesome-llm-skills
https://github.com/K-Dense-AI/claude-scientific-skills
https://github.com/davepoon/buildwithclaude
https://github.com/yusufkaraaslan/Skill_Seekers
https://github.com/itsmostafa/aws-agent-skills
https://github.com/antonbabenko/terraform-skill
https://github.com/zscole/adversarial-spec
https://github.com/alirezarezvani/claude-code-skill-factory
https://github.com/conorluddy/ios-simulator-skill
https://github.com/mhattingpete/claude-skills-marketplace
https://github.com/jezweb/claude-skills
https://github.com/JSONbored/claudepro-directory?tab=readme-ov-file
https://github.com/gmickel/gmickel-claude-marketplace
https://github.com/ccplugins/awesome-claude-code-plugins
https://github.com/keskinonur/claude-code-ios-dev-guide
https://github.com/rsmdt/the-startup
https://github.com/tzachbon/smart-ralph
https://github.com/shinpr/claude-code-workflows
https://github.com/elb-pr/claudikins-kernel
https://github.com/quemsah/awesome-claude-plugins
https://github.com/levnikolaevich/claude-code-skills
https://github.com/DeepBitsTechnology/claude-plugins
https://github.com/secondsky/claude-skills
https://github.com/jcmrs/claude-code-spec-kit-subagent-plugin
https://github.com/existential-birds/beagle
https://github.com/ccplugins/marketplace
https://github.com/Roberdan/MyConvergio
https://github.com/heathdutton/claude-d2-diagrams
https://github.com/kanaerulabs/growth-kit
https://github.com/andisab/swe-marketplace
https://github.com/bigph00t/claude-research-team
https://github.com/afhverjuekki/claude-code-aristotle-plugin
https://github.com/agenisea/ai-design-engineering-cc-plugins
https://github.com/shipdeckai/claude-skills/tree/main/plugins/image-gen
https://github.com/OutlineDriven/odin-claude-plugin
https://github.com/urav06/dialectic
https://github.com/xbim08/awesome-claude-code-plugins/tree/main/plugins

also the claude-skills tag on github: https://github.com/topics/claude-skills

## Phase 6: create, copy or update the skill or agent file in the relevant directory.

if found online, copy the entire content include supporting files, scripts, documentation, etc.

if not found online, create the skill or agent file in the relevant directory. include supporting files, scripts, documentation, etc.

if the skill or agent is for a specific specialization under a domain, create the skills or agents directory in the relevant directory, then create the directory for the skill or agent, then create the files (SKILL.md, README.md, references/ , scripts/ etc.). include supporting files, scripts, documentation, etc.
for example, if the skill name is analyzer-skill, for the domain of business and the specialization of business-analysis, create the library/specializations/business/skills/business-analysis/analyzer-skill/ directory, then create the files (SKILL.md, README.md, references/ , scripts/ etc.). include supporting files, scripts, documentation, etc.

the same domain and specialization dir as the process file. rnd specialzations does not have a domain directory and are under the specializations directory. for example: specializations/data-science-ml/skills and specializations/data-science-ml/agents

if the skill or agent is common or shared between specializations, create the skills or agents directory in common ancestors directories. for example, if the skill name is as generic as developer-skill, create the library/specializations/skills/developer-skill/ directory, then create the files (SKILL.md, README.md, references/ , scripts/ etc.). include supporting files, scripts, documentation, etc.

do it for ALL the skills and agents in the skills-agents-backlog.md file. mark when done with a checkmark.
iterate again and map gaps in the skills-agents-backlog.md file until all gaps are filled and all the skills and agents are created.

## Phase 7: integrate the skill or agent into the process file

For each skill and agent, update the relevant processes js files to use it
do it for ALL the skills and agents in the skills-agents-backlog.md file and in the processes js files. 
