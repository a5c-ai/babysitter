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
    # plugins/babysitter/skills/babysit/process/specializations/data-science-and-machine-learning/
[x] Product Management, Product Strategy
    # plugins/babysitter/skills/babysit/process/specializations/product-management/
[x] DevOps, SRE, Platform Engineering
    # plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/
[x] Security, Compliance, Risk Management
    # plugins/babysitter/skills/babysit/process/specializations/security-compliance/
[x] Software Architecture, Design Patterns
    # plugins/babysitter/skills/babysit/process/specializations/software-architecture/
[x] Monitoring, Ingestions, ETL, Analytics, BI, Data Engineering, Data-Driven Decision Making, A/B Testing
    # plugins/babysitter/skills/babysit/process/specializations/data-engineering-analytics/
[x] UX/UI Design, User Experience, User Interface
    # plugins/babysitter/skills/babysit/process/specializations/ux-ui-design/
[x] QA, Testing Automation, Testing
    # plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/
[x] Documentation, Technical Writing, Technical Communication, Specifications, Standards
    # plugins/babysitter/skills/babysit/process/specializations/technical-documentation/
[ ] Meta Specialization: plugins/babysitter/skills/babysit/process/specializations/meta/ - for domain, specialization, processes, skills and agents creation. (mostly from the instructions in this file, file names and locations, the process below as composable sub processes and skills, etc.) - all detailed with all the relevant information and references, and examples if available.

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
[x] Biomedical Engineering
[x] Environmental Engineering
[x] Industrial Engineering
[x] Computer Science
[x] Mathematics
[x] Physics
[x] Civil Engineering

Business and Finance Specializations (give a proper name to each specialization): each in process/specializations/domains/business/[specialization-name-slugified]/

[x] Business
[x] Finance, Accounting, Economics
[x] Marketing
[x] Sales
[x] Legal
[x] Human Resources
[x] Customer Service, Support, Customer Success, Customer Experience
[x] General Purpose Project Management, Leadership, etc.
[x] Supply Chain Management
[x] Logistics, Transportation, Shipping, Freight, Warehousing, Inventory Management
[x] VCs, investments and Due Diligence processes (processes for evaluating and selecting investments, due diligence, valuation, monitoring and tracking, allocation, risk management, portfolio management, deal flow management, deal structuring, etc.)
[x] Enterpreneurship and Startup Processes (presentations, pitch decks, business plans, market research, funding, investor relations, etc.)
[x] Business Strategy
[x] Operations
[x] Business Analysis and Consulting
[x] Intelligence, Decision Support and Decision Making
[x] Knowledge Management
[x] Advertising, Social Media, Content Marketing,  Influencer Marketing, etc.
[x] Public Relations, etc.

Social Sciences and Humanities Specializations (give a proper name to each specialization): each in process/specializations/domains/social-sciences-humanities/[specialization-name-slugified]/

[x] Healthcare, Medical, Healthcare Management, Medical Management
[x] Education, Teaching, Learning, Learning Management System, Learning Management System
[x] Social Sciences
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
for example, if the skill name is analyzer-skill, for the domain of business and the specialization of business-analysis, create the plugins/babysitter/skills/babysit/process/specializations/business/skills/business-analysis/analyzer-skill/ directory, then create the files (SKILL.md, README.md, references/ , scripts/ etc.). include supporting files, scripts, documentation, etc.

the same domain and specialization dir as the process file. rnd specialzations does not have a domain directory and are under the specializations directory. for example: specializations/data-science-ml/skills and specializations/data-science-ml/agents

if the skill or agent is common or shared between specializations, create the skills or agents directory in common ancestors directories. for example, if the skill name is as generic as developer-skill, create the plugins/babysitter/skills/babysit/process/specializations/skills/developer-skill/ directory, then create the files (SKILL.md, README.md, references/ , scripts/ etc.). include supporting files, scripts, documentation, etc.

do it for ALL the skills and agents in the skills-agents-backlog.md file. mark when done with a checkmark.
iterate again and map gaps in the skills-agents-backlog.md file until all gaps are filled and all the skills and agents are created.

## Phase 7: integrate the skill or agent into the process file

For each skill and agent, update the relevant processes js files to use it
do it for ALL the skills and agents in the skills-agents-backlog.md file and in the processes js files. 