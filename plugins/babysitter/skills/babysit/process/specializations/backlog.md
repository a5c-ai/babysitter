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

Physical Sciences Specializations (give a proper name to each specialization):

[ ] Embedded Systems, Hardware, Firmware, Device Drivers, Hardware-Software Integration
[ ] Robotics and world simulation
[ ] Quantum Computing, Quantum Algorithms, Quantum Hardware, Quantum Software
[ ] Bioinformatics, Genomics, Proteomics
[ ] Nanotechnology
[ ] Materials Science
[ ] Aerospace Engineering
[ ] Automotive Engineering
[ ] Civil Engineering
[ ] Mechanical Engineering
[ ] Electrical Engineering
[ ] Chemical Engineering
[ ] Biomedical Engineering
[ ] Environmental Engineering
[ ] Industrial Engineering
[ ] Computer Science
[ ] Mathematics
[ ] Physics
[ ] General Purpose Scientific Discovery, Engineering, and Problem Solving - Methodical Creative Thinking. Thinking Patterns for Scientific Discovery, Engineering, and Problem Solving

Business and Finance Specializations (give a proper name to each specialization):

[ ] Business
[ ] Finance, Accounting, Economics
[ ] Marketing
[ ] Sales
[ ] Legal
[ ] Human Resources
[ ] Customer Service, Support, Customer Success, Customer Experience
[ ] General Purpose Project Management, Leadership, etc.

Social Sciences and Humanities Specializations (give a proper name to each specialization):

[ ] Supply Chain Management
[ ] Logistics, Transportation, Shipping, Freight, Warehousing, Inventory Management
[ ] Healthcare, Medical, Healthcare Management, Medical Management
[ ] Education, Teaching, Learning, Learning Management System, Learning Management System
[ ] Social Sciences
[ ] Humanities and anthropology
[ ] Philosophy, Theology
[ ] Arts and culture

## Phase 1: Research, Readme and References

At this phase, only research the specializations and their references for common practices, etc. Do not create the actual process.js files from the references yet. only create the README.md and references.md files. for each.

## Phase 2: Identifying Processes, methodologies, work patterns, flows, processes, etc.

Create a processes-backlog.md file in the directory. This file will contain the list of processes, methodologies, work patterns, flows, processes, etc. for this specialization. with bullet point (open todo, for each process identified - with a short description of the process, and a link to the reference if available)

## Phase 3: Create process javascript files for each process identified

for each process in the processes-backlog.md file, create a js file in the directory. according to the syntax, conventions and patterns of the Babysitter SDK and the rest of the existing processes.