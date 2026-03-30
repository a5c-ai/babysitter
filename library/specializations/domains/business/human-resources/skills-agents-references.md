# Human Resources and People Operations - Skills and Agents References

This document provides references to GitHub repositories, MCP servers, community resources, and relevant tools that can support the implementation of specialized skills and agents for Human Resources processes.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills References](#skills-references)
3. [Agents References](#agents-references)
4. [MCP Servers](#mcp-servers)
5. [Community Resources](#community-resources)
6. [Implementation Guides](#implementation-guides)

---

## Overview

This reference document maps the 22 skills and 15 agents identified in the skills-agents-backlog.md to available open-source tools, APIs, MCP servers, and community resources. These references serve as implementation starting points and integration targets for building HR-specific automation capabilities.

### Reference Categories

- **GitHub Repositories**: Open-source projects and libraries
- **MCP Servers**: Model Context Protocol servers for AI integration
- **APIs & Platforms**: Commercial and open APIs for HR systems
- **Community Resources**: Documentation, best practices, and frameworks

---

## Skills References

### SK-001: ATS Integration Skill

**Slug**: `ats-integration`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [OpenCATS/OpenCATS](https://github.com/OpenCATS/OpenCATS) | Open-source applicant tracking system | 1.2k+ | PHP |
| [Ashby/ashby-api-python](https://github.com/ashbyhq/ashby-api-python) | Python SDK for Ashby ATS API | - | Python |
| [lever/postings-api](https://github.com/lever/postings-api) | Lever postings API documentation | 100+ | - |
| [merge-api/merge-python-client](https://github.com/merge-api/merge-python-client) | Unified ATS/HRIS API client | 50+ | Python |

#### APIs & Platforms

- **Greenhouse API**: https://developers.greenhouse.io/
- **Lever API**: https://hire.lever.co/developer/documentation
- **Workday Recruiting API**: https://community.workday.com/
- **iCIMS API**: https://developer.icims.com/
- **Merge.dev**: https://merge.dev/ (Unified ATS API)
- **Findem API**: https://www.findem.ai/developers

#### Community Resources

- SHRM Talent Acquisition Resources: https://www.shrm.org/topics-tools/topics/talent-acquisition
- HR Open Standards: https://hropenstandards.org/
- TAtech Resources: https://tatech.org/

---

### SK-002: Resume Parsing and Screening Skill

**Slug**: `resume-screening`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [daxeel/Resume-Parser](https://github.com/daxeel/Resume-Parser) | Simple resume parser using NLP | 500+ | Python |
| [OmkarPathak/pyresparser](https://github.com/OmkarPathak/pyresparser) | Resume parser in Python | 1.5k+ | Python |
| [hrflow/hrflow-sdk-python](https://github.com/Hrflow/hrflow-sdk-python) | HrFlow parsing SDK | 50+ | Python |
| [Affinda/affinda-python](https://github.com/affinda/affinda-python) | Resume parsing API client | - | Python |
| [reworkd/AgentGPT](https://github.com/reworkd/AgentGPT) | AI agent for task automation | 30k+ | TypeScript |

#### APIs & Platforms

- **Affinda Resume Parser**: https://www.affinda.com/resume-parser
- **HrFlow.ai**: https://www.hrflow.ai/
- **Textkernel**: https://www.textkernel.com/
- **Sovren/Textkernel**: https://www.textkernel.com/
- **Rchilli**: https://www.rchilli.com/

#### Community Resources

- EEOC Uniform Guidelines: https://www.eeoc.gov/laws/guidance/
- OFCCP Compliance Resources: https://www.dol.gov/agencies/ofccp

---

### SK-003: Interview Question Generator Skill

**Slug**: `interview-questions`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | AI agent platform | 160k+ | Python |
| [yangshun/tech-interview-handbook](https://github.com/yangshun/tech-interview-handbook) | Tech interview preparation | 110k+ | - |
| [DopplerHQ/awesome-interview-questions](https://github.com/DopplerHQ/awesome-interview-questions) | Curated interview questions | 65k+ | - |

#### APIs & Platforms

- **LangChain**: https://www.langchain.com/
- **OpenAI API**: https://platform.openai.com/
- **Anthropic Claude API**: https://www.anthropic.com/api

#### Community Resources

- SHRM Interview Questions Database: https://www.shrm.org/
- SIOP Structured Interview Guidelines: https://www.siop.org/
- Lominger Competency Framework: https://www.kornferry.com/

---

### SK-004: Onboarding Workflow Skill

**Slug**: `onboarding-workflow`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | Workflow automation platform | 40k+ | TypeScript |
| [automatisch/automatisch](https://github.com/automatisch/automatisch) | Open-source Zapier alternative | 5k+ | TypeScript |
| [windmill-labs/windmill](https://github.com/windmill-labs/windmill) | Developer platform for workflows | 9k+ | Rust/TS |

#### APIs & Platforms

- **BambooHR API**: https://documentation.bamboohr.com/reference
- **Rippling API**: https://developer.rippling.com/
- **Gusto API**: https://docs.gusto.com/
- **Workday HCM API**: https://community.workday.com/

#### Community Resources

- SHRM Onboarding Resources: https://www.shrm.org/topics-tools/topics/onboarding
- Brandon Hall Group Research: https://www.brandonhall.com/

---

### SK-005: OKR/Goal Management Skill

**Slug**: `okr-management`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [plmrlnsnts/okr-tracker](https://github.com/plmrlnsnts/okr-tracker) | OKR tracking application | 100+ | Vue/Laravel |
| [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | Open-source Notion alternative | 50k+ | Rust/Flutter |
| [twentyhq/twenty](https://github.com/twentyhq/twenty) | Open-source CRM with goals | 15k+ | TypeScript |

#### APIs & Platforms

- **Lattice API**: https://developers.lattice.com/
- **15Five API**: https://developer.15five.com/
- **BetterWorks API**: https://www.betterworks.com/
- **Workboard API**: https://www.workboard.com/

#### Community Resources

- Measure What Matters (John Doerr): https://www.whatmatters.com/
- OKR Institute: https://okrinstitute.org/

---

### SK-006: Performance Review Generator Skill

**Slug**: `performance-review`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [hwchase17/langchain](https://github.com/langchain-ai/langchain) | LLM application framework | 85k+ | Python |
| [unstructured-io/unstructured](https://github.com/Unstructured-IO/unstructured) | Document processing | 7k+ | Python |

#### APIs & Platforms

- **Lattice Performance API**: https://developers.lattice.com/
- **Culture Amp API**: https://developer.cultureamp.com/
- **Reflektive API**: https://www.reflektive.com/
- **Small Improvements API**: https://www.small-improvements.com/

#### Community Resources

- SHRM Performance Management: https://www.shrm.org/topics-tools/topics/performance-management
- WorldatWork Resources: https://www.worldatwork.org/

---

### SK-007: 360 Feedback Survey Skill

**Slug**: `360-feedback`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [LimeSurvey/LimeSurvey](https://github.com/LimeSurvey/LimeSurvey) | Open-source survey platform | 2.5k+ | PHP |
| [formbricks/formbricks](https://github.com/formbricks/formbricks) | Open-source survey platform | 6k+ | TypeScript |
| [typeform/create-api](https://github.com/typeform/create-api) | Typeform API client | 100+ | JavaScript |

#### APIs & Platforms

- **SurveyMonkey API**: https://developer.surveymonkey.com/
- **Qualtrics API**: https://api.qualtrics.com/
- **Culture Amp API**: https://developer.cultureamp.com/
- **Reflektive 360 API**: https://www.reflektive.com/

#### Community Resources

- CCL 360 Research: https://www.ccl.org/
- SIOP Guidelines for 360 Feedback: https://www.siop.org/

---

### SK-008: PIP Documentation Skill

**Slug**: `pip-documentation`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [docuseal/docuseal](https://github.com/docuseal/docuseal) | Open-source DocuSign alternative | 5k+ | Ruby |
| [pandadoc/pandadoc-api-node-client](https://github.com/PandaDoc/pandadoc-api-node-client) | Document automation | 20+ | TypeScript |

#### APIs & Platforms

- **DocuSign API**: https://developers.docusign.com/
- **PandaDoc API**: https://developers.pandadoc.com/
- **HelloSign API**: https://developers.hellosign.com/

#### Community Resources

- SHRM PIP Templates: https://www.shrm.org/
- Fisher Phillips Employment Law: https://www.fisherphillips.com/
- Littler Mendelson Resources: https://www.littler.com/

---

### SK-009: Training Needs Assessment Skill

**Slug**: `training-needs`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [lightdash/lightdash](https://github.com/lightdash/lightdash) | Open-source BI for analysis | 3k+ | TypeScript |
| [metabase/metabase](https://github.com/metabase/metabase) | Open-source BI platform | 37k+ | Clojure |

#### APIs & Platforms

- **LinkedIn Learning API**: https://developer.linkedin.com/
- **Degreed API**: https://developer.degreed.com/
- **Pluralsight API**: https://www.pluralsight.com/
- **Udemy Business API**: https://business.udemy.com/

#### Community Resources

- ATD Training Needs Analysis: https://www.td.org/
- CIPD L&D Resources: https://www.cipd.org/

---

### SK-010: LMS Administration Skill

**Slug**: `lms-admin`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [moodle/moodle](https://github.com/moodle/moodle) | Open-source LMS | 5k+ | PHP |
| [chamilo/chamilo-lms](https://github.com/chamilo/chamilo-lms) | Open-source e-learning | 700+ | PHP |
| [Canvas-LMS/canvas-lms](https://github.com/instructure/canvas-lms) | Open-source LMS | 5k+ | Ruby |
| [openedx/edx-platform](https://github.com/openedx/edx-platform) | Open edX LMS platform | 7k+ | Python |

#### APIs & Platforms

- **Cornerstone OnDemand API**: https://developer.cornerstoneondemand.com/
- **Workday Learning API**: https://community.workday.com/
- **SAP SuccessFactors Learning API**: https://api.sap.com/
- **Absorb LMS API**: https://www.absorblms.com/

#### Community Resources

- Brandon Hall Group LMS Resources: https://www.brandonhall.com/
- Training Industry LMS Guide: https://trainingindustry.com/

---

### SK-011: Succession Planning Skill

**Slug**: `succession-planning`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [streamlit/streamlit](https://github.com/streamlit/streamlit) | Data app framework | 32k+ | Python |
| [plotly/dash](https://github.com/plotly/dash) | Analytics dashboard | 20k+ | Python |

#### APIs & Platforms

- **Workday Talent API**: https://community.workday.com/
- **SAP SuccessFactors Succession API**: https://api.sap.com/
- **Cornerstone Succession API**: https://developer.cornerstoneondemand.com/
- **Saba/Cornerstone API**: https://www.cornerstoneondemand.com/

#### Community Resources

- SHRM Succession Planning: https://www.shrm.org/
- CEB/Gartner Succession Research: https://www.gartner.com/

---

### SK-012: Job Evaluation Skill

**Slug**: `job-evaluation`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [O*NET/onet-api](https://www.onetonline.org/) | Occupational data | - | - |
| [pandas-dev/pandas](https://github.com/pandas-dev/pandas) | Data analysis | 42k+ | Python |

#### APIs & Platforms

- **O*NET Web Services**: https://services.onetcenter.org/
- **BLS Occupational Data**: https://www.bls.gov/developers/
- **Mercer Job Evaluation**: https://www.mercer.com/
- **Willis Towers Watson Job Leveling**: https://www.wtwco.com/
- **Korn Ferry Hay System**: https://www.kornferry.com/

#### Community Resources

- WorldatWork Job Evaluation: https://www.worldatwork.org/
- SHRM Job Analysis Resources: https://www.shrm.org/

---

### SK-013: Compensation Benchmarking Skill

**Slug**: `comp-benchmarking`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [scipy/scipy](https://github.com/scipy/scipy) | Scientific computing | 12k+ | Python |
| [statsmodels/statsmodels](https://github.com/statsmodels/statsmodels) | Statistical modeling | 9k+ | Python |

#### APIs & Platforms

- **Payscale API**: https://www.payscale.com/
- **Salary.com API**: https://www.salary.com/
- **Radford/Aon API**: https://radford.aon.com/
- **Mercer Compensation API**: https://www.mercer.com/
- **Glassdoor API**: https://www.glassdoor.com/developer/
- **Levels.fyi API**: https://www.levels.fyi/

#### Community Resources

- WorldatWork Compensation: https://www.worldatwork.org/
- SHRM Compensation Resources: https://www.shrm.org/

---

### SK-014: Pay Equity Analysis Skill

**Slug**: `pay-equity`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [statsmodels/statsmodels](https://github.com/statsmodels/statsmodels) | Statistical modeling | 9k+ | Python |
| [scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn) | ML library | 58k+ | Python |
| [Syndio/syndio-api](https://syndio.com/) | Pay equity platform | - | - |

#### APIs & Platforms

- **Syndio Pay Equity**: https://syndio.com/
- **Payscale Pay Equity**: https://www.payscale.com/
- **Trusaic PayParity**: https://trusaic.com/
- **Affirmity/LexisNexis**: https://www.affirmity.com/

#### Community Resources

- EEOC Pay Transparency: https://www.eeoc.gov/
- OFCCP Compensation Guidance: https://www.dol.gov/agencies/ofccp
- WorldatWork Pay Equity: https://www.worldatwork.org/

---

### SK-015: Benefits Enrollment Skill

**Slug**: `benefits-enrollment`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | Workflow automation | 40k+ | TypeScript |

#### APIs & Platforms

- **Gusto Benefits API**: https://docs.gusto.com/
- **Rippling Benefits API**: https://developer.rippling.com/
- **Benefitfocus API**: https://www.benefitfocus.com/
- **Ease/Employee Navigator API**: https://www.ease.com/
- **Namely API**: https://developers.namely.com/

#### Community Resources

- SHRM Benefits Resources: https://www.shrm.org/topics-tools/topics/benefits
- IFEBP Resources: https://www.ifebp.org/
- ACA Compliance: https://www.healthcare.gov/

---

### SK-016: HR Investigation Skill

**Slug**: `hr-investigation`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [docuseal/docuseal](https://github.com/docuseal/docuseal) | Document management | 5k+ | Ruby |
| [paperless-ngx/paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | Document management | 17k+ | Python |

#### APIs & Platforms

- **HR Acuity**: https://www.hracuity.com/
- **i-Sight**: https://www.i-sight.com/
- **EthicsPoint/NAVEX**: https://www.navex.com/

#### Community Resources

- AWI Investigation Training: https://www.aaborelli.com/
- SHRM Investigation Resources: https://www.shrm.org/
- EEOC Investigation Guidelines: https://www.eeoc.gov/

---

### SK-017: Exit Interview Analysis Skill

**Slug**: `exit-analysis`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [explosion/spaCy](https://github.com/explosion/spaCy) | NLP library | 29k+ | Python |
| [huggingface/transformers](https://github.com/huggingface/transformers) | ML models | 125k+ | Python |
| [nltk/nltk](https://github.com/nltk/nltk) | NLP toolkit | 13k+ | Python |

#### APIs & Platforms

- **Culture Amp Exit API**: https://developer.cultureamp.com/
- **Workday Exit API**: https://community.workday.com/
- **Qualtrics Employee Experience**: https://api.qualtrics.com/

#### Community Resources

- SHRM Exit Interview Resources: https://www.shrm.org/
- LinkedIn Talent Insights: https://business.linkedin.com/

---

### SK-018: Workforce Planning Skill

**Slug**: `workforce-planning`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [facebook/prophet](https://github.com/facebook/prophet) | Time series forecasting | 18k+ | Python |
| [unit8co/darts](https://github.com/unit8co/darts) | Time series library | 7k+ | Python |
| [ourownstory/neural_prophet](https://github.com/ourownstory/neural_prophet) | Neural forecasting | 3k+ | Python |

#### APIs & Platforms

- **Visier API**: https://developer.visier.com/
- **Workday Adaptive Planning API**: https://community.workday.com/
- **Anaplan API**: https://www.anaplan.com/
- **ChartHop API**: https://developers.charthop.com/

#### Community Resources

- SHRM Workforce Planning: https://www.shrm.org/
- HCI Workforce Planning: https://www.hci.org/

---

### SK-019: Turnover Analytics Skill

**Slug**: `turnover-analytics`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [lifelines/lifelines](https://github.com/CamDavidsonPilon/lifelines) | Survival analysis | 2k+ | Python |
| [scikit-survival/scikit-survival](https://github.com/sebp/scikit-survival) | Survival analysis ML | 1k+ | Python |

#### APIs & Platforms

- **Visier People Analytics**: https://developer.visier.com/
- **One Model API**: https://www.onemodel.co/
- **Crunchr API**: https://www.crunchr.com/
- **Workday Prism Analytics**: https://community.workday.com/

#### Community Resources

- SHRM Turnover Metrics: https://www.shrm.org/
- People Analytics World: https://peopleanalyticsworld.com/

---

### SK-020: Engagement Survey Skill

**Slug**: `engagement-survey`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [LimeSurvey/LimeSurvey](https://github.com/LimeSurvey/LimeSurvey) | Survey platform | 2.5k+ | PHP |
| [formbricks/formbricks](https://github.com/formbricks/formbricks) | Survey platform | 6k+ | TypeScript |
| [typeform/create-api](https://github.com/typeform/create-api) | Form builder API | 100+ | JavaScript |

#### APIs & Platforms

- **Culture Amp API**: https://developer.cultureamp.com/
- **Peakon/Workday API**: https://community.workday.com/
- **Glint/LinkedIn API**: https://business.linkedin.com/
- **Qualtrics Employee XM**: https://api.qualtrics.com/
- **15Five Engagement**: https://developer.15five.com/

#### Community Resources

- Gallup Q12: https://www.gallup.com/
- SHRM Employee Engagement: https://www.shrm.org/
- Bersin Research: https://joshbersin.com/

---

### SK-021: Culture Assessment Skill

**Slug**: `culture-assessment`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [explosion/spaCy](https://github.com/explosion/spaCy) | NLP analysis | 29k+ | Python |
| [streamlit/streamlit](https://github.com/streamlit/streamlit) | Data apps | 32k+ | Python |

#### APIs & Platforms

- **Culture Amp API**: https://developer.cultureamp.com/
- **Denison Culture API**: https://www.denisonconsulting.com/
- **Human Synergistics OCI**: https://www.humansynergistics.com/
- **Great Place to Work API**: https://www.greatplacetowork.com/

#### Community Resources

- Competing Values Framework (CVF): Quinn & Cameron Research
- Organizational Culture Inventory (OCI): https://www.humansynergistics.com/
- SHRM Culture Resources: https://www.shrm.org/

---

### SK-022: Employment Law Compliance Skill

**Slug**: `employment-compliance`

#### GitHub Repositories

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [docassemble/docassemble](https://github.com/jhpyle/docassemble) | Legal document automation | 700+ | Python |
| [suffolklitlab/docassemble-AssemblyLine](https://github.com/SuffolkLITLab/docassemble-AssemblyLine) | Legal forms | 100+ | Python |

#### APIs & Platforms

- **Mineral (formerly ThinkHR)**: https://www.trustmineral.com/
- **SHRM Compliance API**: https://www.shrm.org/
- **Paychex Compliance**: https://www.paychex.com/
- **ADP Compliance API**: https://developers.adp.com/

#### Community Resources

- DOL Employment Law: https://www.dol.gov/
- EEOC Resources: https://www.eeoc.gov/
- SHRM Legal: https://www.shrm.org/topics-tools/topics/legal
- Fisher Phillips: https://www.fisherphillips.com/
- Littler Mendelson: https://www.littler.com/

---

## Agents References

### AG-001: Talent Acquisition Strategist Agent

**Slug**: `ta-strategist`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| SHRM Talent Acquisition Competency Model | Framework | https://www.shrm.org/ |
| LinkedIn Global Talent Trends | Research | https://business.linkedin.com/ |
| Bersin TA Maturity Model | Framework | https://joshbersin.com/ |
| ERE Media | Community | https://www.ere.net/ |

#### Prompt Engineering Resources

- **Role Definition**: VP-level talent acquisition leader with 15+ years experience
- **Knowledge Domains**: Recruiting strategy, employer branding, diversity recruiting, candidate experience
- **Communication Style**: Strategic, data-driven, consultative

---

### AG-002: Technical Recruiter Agent

**Slug**: `technical-recruiter`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| Tech Interview Handbook | Repository | https://github.com/yangshun/tech-interview-handbook |
| Hired State of Tech Salaries | Research | https://hired.com/ |
| HackerRank Developer Skills Report | Research | https://www.hackerrank.com/ |
| Triplebyte Technical Assessment | Platform | https://triplebyte.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Senior technical recruiter with engineering background
- **Knowledge Domains**: Technical skills assessment, coding challenges, developer communities
- **Communication Style**: Technical, precise, developer-friendly

---

### AG-003: HR Business Partner Agent

**Slug**: `hr-business-partner`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| SHRM HRBP Competency Model | Framework | https://www.shrm.org/ |
| Dave Ulrich HR Model | Framework | https://www.rbl.net/ |
| CIPD HR Business Partnering | Research | https://www.cipd.org/ |
| AIHR HRBP Resources | Training | https://www.aihr.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Senior HRBP with 12+ years across multiple industries
- **Knowledge Domains**: Business partnering, performance management, employee relations, org design
- **Communication Style**: Consultative, balanced, solution-oriented

---

### AG-004: Performance Management Expert Agent

**Slug**: `performance-expert`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| Deloitte Performance Management Research | Research | https://www2.deloitte.com/ |
| Gallup Performance Management | Research | https://www.gallup.com/ |
| NeuroLeadership Institute | Research | https://neuroleadership.com/ |
| SHRM Performance Management | Resources | https://www.shrm.org/ |

#### Prompt Engineering Resources

- **Role Definition**: Director of Performance Management with I/O Psychology background
- **Knowledge Domains**: Goal frameworks, calibration, feedback systems, PIP processes
- **Communication Style**: Evidence-based, coaching-oriented, fair

---

### AG-005: Learning and Development Specialist Agent

**Slug**: `learning-specialist`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| ATD Competency Model | Framework | https://www.td.org/ |
| Kirkpatrick Evaluation Model | Framework | https://www.kirkpatrickpartners.com/ |
| Brandon Hall Learning Research | Research | https://www.brandonhall.com/ |
| CIPD L&D Research | Resources | https://www.cipd.org/ |

#### Prompt Engineering Resources

- **Role Definition**: Senior L&D Manager with instructional design expertise
- **Knowledge Domains**: Adult learning, instructional design, LMS, leadership development
- **Communication Style**: Educational, practical, measurement-focused

---

### AG-006: Total Rewards Strategist Agent

**Slug**: `total-rewards`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| WorldatWork Total Rewards Model | Framework | https://www.worldatwork.org/ |
| Mercer Total Rewards Research | Research | https://www.mercer.com/ |
| Willis Towers Watson Rewards | Research | https://www.wtwco.com/ |
| SHRM Compensation Resources | Resources | https://www.shrm.org/ |

#### Prompt Engineering Resources

- **Role Definition**: Head of Total Rewards with CCP certification and consulting background
- **Knowledge Domains**: Compensation strategy, pay equity, benefits design, executive comp
- **Communication Style**: Analytical, strategic, market-informed

---

### AG-007: Compensation Analyst Agent

**Slug**: `compensation-analyst`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| WorldatWork CCP Body of Knowledge | Certification | https://www.worldatwork.org/ |
| Radford Survey Methodology | Methodology | https://radford.aon.com/ |
| Mercer IPE System | Methodology | https://www.mercer.com/ |
| PayScale Methodology | Resources | https://www.payscale.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Senior Compensation Analyst with statistics background
- **Knowledge Domains**: Market pricing, job matching, range development, pay equity statistics
- **Communication Style**: Data-driven, precise, methodological

---

### AG-008: Employee Relations Investigator Agent

**Slug**: `er-investigator`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| AWI Investigation Training | Training | https://www.aaborelli.com/ |
| SHRM ER Resources | Resources | https://www.shrm.org/ |
| EEOC Investigation Guidance | Regulatory | https://www.eeoc.gov/ |
| HR Acuity ER Resources | Platform | https://www.hracuity.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Employee Relations Manager with 10+ years investigation experience
- **Knowledge Domains**: Investigation methodology, employment law, documentation, conflict resolution
- **Communication Style**: Neutral, thorough, legally-minded

---

### AG-009: People Analytics Expert Agent

**Slug**: `people-analytics`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| AIHR People Analytics | Training | https://www.aihr.com/ |
| Wharton People Analytics Conference | Research | https://wpa.wharton.upenn.edu/ |
| Visier Insights Research | Research | https://www.visier.com/ |
| One Model Analytics | Platform | https://www.onemodel.co/ |

#### Prompt Engineering Resources

- **Role Definition**: Head of People Analytics with data science background
- **Knowledge Domains**: HR metrics, predictive modeling, data visualization, workforce analytics
- **Communication Style**: Analytical, insight-driven, business-focused

---

### AG-010: Workforce Planning Strategist Agent

**Slug**: `workforce-planner`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| HCI Strategic Workforce Planning | Certification | https://www.hci.org/ |
| SHRM Workforce Planning | Resources | https://www.shrm.org/ |
| Mercer Workforce Planning | Research | https://www.mercer.com/ |
| APQC Workforce Planning | Benchmarks | https://www.apqc.org/ |

#### Prompt Engineering Resources

- **Role Definition**: Director of Workforce Planning with strategy consulting background
- **Knowledge Domains**: Demand forecasting, supply analysis, scenario planning, skills gap analysis
- **Communication Style**: Strategic, scenario-based, forward-looking

---

### AG-011: Organizational Development Consultant Agent

**Slug**: `od-consultant`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| OD Network | Community | https://www.odnetwork.org/ |
| Prosci Change Management | Framework | https://www.prosci.com/ |
| McKinsey Organization Practice | Research | https://www.mckinsey.com/ |
| SIOP I/O Psychology | Research | https://www.siop.org/ |

#### Prompt Engineering Resources

- **Role Definition**: Senior OD Consultant with I/O Psychology background
- **Knowledge Domains**: Culture transformation, change management, team effectiveness, org design
- **Communication Style**: Facilitative, diagnostic, intervention-focused

---

### AG-012: Employment Law Advisor Agent

**Slug**: `employment-law`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| DOL Employment Law | Regulatory | https://www.dol.gov/ |
| EEOC Guidance | Regulatory | https://www.eeoc.gov/ |
| Fisher Phillips | Law Firm | https://www.fisherphillips.com/ |
| Littler Mendelson | Law Firm | https://www.littler.com/ |
| Jackson Lewis | Law Firm | https://www.jacksonlewis.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Employment Law Attorney/HR Compliance Director with 15+ years experience
- **Knowledge Domains**: FLSA, FMLA, ADA, Title VII, state employment laws, compliance
- **Communication Style**: Legal, cautious, compliance-focused

---

### AG-013: DEI Program Manager Agent

**Slug**: `dei-manager`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| SHRM Inclusion Resources | Resources | https://www.shrm.org/ |
| McKinsey Diversity Research | Research | https://www.mckinsey.com/ |
| Catalyst DEI Resources | Research | https://www.catalyst.org/ |
| DiversityInc | Community | https://www.diversityinc.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Director of DEI with 10+ years DEI leadership
- **Knowledge Domains**: DEI strategy, inclusive hiring, bias mitigation, ERGs, DEI metrics
- **Communication Style**: Inclusive, advocacy-oriented, data-informed

---

### AG-014: Onboarding Coordinator Agent

**Slug**: `onboarding-coordinator`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| SHRM Onboarding Toolkit | Resources | https://www.shrm.org/ |
| Brandon Hall Onboarding Research | Research | https://www.brandonhall.com/ |
| Sapling Onboarding | Platform | https://www.saplinghr.com/ |
| Enboarder | Platform | https://enboarder.com/ |

#### Prompt Engineering Resources

- **Role Definition**: Onboarding Program Manager with 8+ years experience
- **Knowledge Domains**: Preboarding, first-week experience, 30-60-90 plans, onboarding metrics
- **Communication Style**: Welcoming, organized, detail-oriented

---

### AG-015: Succession Planning Advisor Agent

**Slug**: `succession-advisor`

#### Reference Materials

| Resource | Type | Link |
|----------|------|------|
| SHRM Succession Planning | Resources | https://www.shrm.org/ |
| DDI Leadership Research | Research | https://www.ddiworld.com/ |
| Korn Ferry Succession | Research | https://www.kornferry.com/ |
| CCL Succession Resources | Research | https://www.ccl.org/ |

#### Prompt Engineering Resources

- **Role Definition**: VP of Talent Management with 15+ years experience
- **Knowledge Domains**: Critical roles, talent assessment, 9-box, development planning, high-potential programs
- **Communication Style**: Strategic, developmental, long-term focused

---

## MCP Servers

### HR-Specific MCP Servers

| Server | Description | Repository/Link |
|--------|-------------|-----------------|
| **MCP HR Connector** | Unified HRIS/ATS connectivity | Custom implementation needed |
| **MCP Compliance Checker** | Employment law compliance validation | Custom implementation needed |
| **MCP Survey Analyzer** | Employee survey data analysis | Custom implementation needed |

### General-Purpose MCP Servers (HR-Applicable)

| Server | Description | Repository |
|--------|-------------|------------|
| [mcp-server-fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) | HTTP requests to HR APIs | MCP official |
| [mcp-server-postgres](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) | HRIS database access | MCP official |
| [mcp-server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) | HR document management | MCP official |
| [mcp-server-slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack) | HR communications | MCP official |
| [mcp-server-google-drive](https://github.com/modelcontextprotocol/servers) | Document storage | MCP community |

### MCP Server Implementation Priorities

1. **HRIS Integration MCP Server**
   - Connect to Workday, SAP SuccessFactors, BambooHR, ADP
   - Unified employee data access
   - Compliance-aware data handling

2. **ATS Integration MCP Server**
   - Connect to Greenhouse, Lever, iCIMS, Workday Recruiting
   - Candidate pipeline management
   - Interview scheduling integration

3. **Survey Platform MCP Server**
   - Connect to Qualtrics, Culture Amp, SurveyMonkey
   - Survey deployment and collection
   - Analytics and reporting

4. **Learning Platform MCP Server**
   - Connect to Cornerstone, Workday Learning, SAP SuccessFactors
   - Course management
   - Completion tracking

---

## Community Resources

### Professional Organizations

| Organization | Focus Area | Website |
|--------------|------------|---------|
| SHRM | General HR | https://www.shrm.org/ |
| WorldatWork | Compensation & Benefits | https://www.worldatwork.org/ |
| ATD | Learning & Development | https://www.td.org/ |
| SIOP | I/O Psychology | https://www.siop.org/ |
| CIPD | HR (UK-focused) | https://www.cipd.org/ |
| AIHR | HR Analytics & Digital | https://www.aihr.com/ |
| HCI | Human Capital | https://www.hci.org/ |
| OD Network | Organization Development | https://www.odnetwork.org/ |

### Research & Publications

| Source | Focus | Link |
|--------|-------|------|
| Josh Bersin Research | HR Tech & Trends | https://joshbersin.com/ |
| Deloitte Human Capital Trends | Annual Research | https://www2.deloitte.com/ |
| McKinsey Organization Practice | Strategic HR | https://www.mckinsey.com/ |
| Gartner HR Research | Market Analysis | https://www.gartner.com/ |
| Brandon Hall Group | L&D & Talent | https://www.brandonhall.com/ |
| Gallup Workplace | Engagement | https://www.gallup.com/ |

### Open-Source HR Projects

| Project | Description | Repository |
|---------|-------------|------------|
| OpenCATS | Applicant Tracking System | https://github.com/OpenCATS/OpenCATS |
| OrangeHRM | HR Management System | https://github.com/orangehrm/orangehrm |
| Moodle | Learning Management System | https://github.com/moodle/moodle |
| Canvas LMS | Learning Platform | https://github.com/instructure/canvas-lms |
| Open edX | Learning Platform | https://github.com/openedx/edx-platform |
| Odoo HR | HR Modules | https://github.com/odoo/odoo |
| IceHRM | HR Management | https://github.com/galomontes/icehrm |
| Sentrifugo | HR Management | https://github.com/nicholaskasprzak/sentrifugo |

### Standards & Frameworks

| Standard | Description | Link |
|----------|-------------|------|
| HR Open Standards | HR Data Interchange | https://hropenstandards.org/ |
| HRXML | HR Data Standards | https://www.hr-xml.org/ |
| xAPI/Tin Can | Learning Data | https://xapi.com/ |
| SCORM | eLearning Standard | https://scorm.com/ |
| SOC 2 | Data Security | https://www.aicpa.org/ |
| ISO 30400 | HR Terminology | https://www.iso.org/ |

---

## Implementation Guides

### Phase 1: Foundation Skills Implementation

1. **ATS Integration (SK-001)**
   - Start with Merge.dev unified API
   - Implement Greenhouse and Lever connectors
   - Add OFCCP compliance data handling

2. **Performance Review Generator (SK-006)**
   - Build LangChain-based template generation
   - Integrate with Lattice/Culture Amp APIs
   - Create competency-based evaluation framework

3. **Employment Compliance (SK-022)**
   - Integrate DOL and EEOC data sources
   - Build jurisdiction-aware compliance rules
   - Create policy validation workflows

### Phase 2: Agent Development Approach

1. **Define Agent Personas**
   - Use role definitions from agent references
   - Establish expertise boundaries
   - Create communication style guidelines

2. **Build Knowledge Bases**
   - Curate relevant professional resources
   - Include regulatory and compliance data
   - Add industry best practices

3. **Implement Agent Orchestration**
   - Define agent collaboration patterns
   - Establish escalation procedures
   - Create quality assurance checkpoints

### Recommended Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| LLM Framework | LangChain/LlamaIndex | Agent orchestration |
| Vector Database | Pinecone/Weaviate | Knowledge retrieval |
| Workflow Engine | n8n/Windmill | Process automation |
| Survey Platform | Formbricks/LimeSurvey | Feedback collection |
| Analytics | Metabase/Lightdash | HR dashboards |
| Document Processing | Unstructured | Resume/document parsing |

---

## Summary

| Category | Count |
|----------|-------|
| Skills with References | 22 |
| Agents with References | 15 |
| MCP Servers Identified | 10+ |
| Professional Organizations | 8 |
| Open-Source Projects | 8+ |
| API Platforms Referenced | 50+ |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement high-priority skills and agents
