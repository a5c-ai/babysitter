# Legal and Compliance - Skills and Agents References

This document provides references to GitHub repositories, MCP servers, community resources, and other technical assets that can be used to implement the skills and agents identified in the Legal and Compliance specialization backlog.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills References](#skills-references)
3. [Agents References](#agents-references)
4. [MCP Servers](#mcp-servers)
5. [Community Resources](#community-resources)
6. [Legal Technology Platforms](#legal-technology-platforms)
7. [Regulatory Data Sources](#regulatory-data-sources)
8. [Implementation Notes](#implementation-notes)

---

## Overview

### Purpose
This document catalogs technical resources available for implementing specialized legal and compliance capabilities. References include open-source libraries, commercial APIs, MCP server implementations, and community-maintained resources.

### Resource Categories
- **GitHub Repositories**: Open-source code and libraries
- **MCP Servers**: Model Context Protocol server implementations
- **APIs**: Commercial and open legal technology APIs
- **Datasets**: Legal corpora, clause libraries, and training data
- **Community**: Forums, standards bodies, and professional organizations

---

## Skills References

### SK-001: Contract Analysis Skill
**Slug**: `contract-analysis`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [atticus-ai/cuad](https://github.com/TheAtticusProject/cuad) | Contract Understanding Atticus Dataset - 500+ contracts with 13K+ labeled clauses | 200+ | CC BY 4.0 |
| [nlmatics/llmsherpa](https://github.com/nlmatics/llmsherpa) | Document parsing library for LLM-ready document understanding | 500+ | Apache 2.0 |
| [jsoma/pdfplumber](https://github.com/jsvine/pdfplumber) | PDF parsing for extracting text and tables | 5K+ | MIT |
| [explosion/spaCy](https://github.com/explosion/spaCy) | Industrial-strength NLP with legal entity recognition | 28K+ | MIT |
| [stanfordnlp/stanza](https://github.com/stanfordnlp/stanza) | Stanford NLP library with multilingual support | 7K+ | Apache 2.0 |
| [docarray/docarray](https://github.com/docarray/docarray) | Document processing for ML pipelines | 2K+ | Apache 2.0 |

#### Datasets and Corpora
| Resource | Description | Access |
|----------|-------------|--------|
| [CUAD Dataset](https://www.atticusprojectai.org/cuad) | 510 contracts with 13,000+ annotated clauses | Open |
| [Contract NLI](https://stanfordnlp.github.io/contract-nli/) | Stanford contract natural language inference dataset | Open |
| [LEDGAR](https://metatext.io/datasets/ledgar) | SEC EDGAR contract provisions dataset | Open |
| [US Legal Agreements](https://huggingface.co/datasets/lexlms/legal_contracts) | HuggingFace legal contract corpus | Open |

#### Commercial APIs
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [Kira Systems](https://kirasystems.com) | Contract analysis AI | Clause extraction, risk identification |
| [Luminance](https://www.luminance.com) | AI contract review | Due diligence, clause analysis |
| [Evisort](https://www.evisort.com) | Contract intelligence | AI extraction, obligation tracking |
| [LawGeex](https://www.lawgeex.com) | Contract review automation | Approval workflows, risk scoring |

---

### SK-002: Contract Drafting Skill
**Slug**: `contract-drafting`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [docassemble/docassemble](https://github.com/jhpyle/docassemble) | Document assembly platform for legal forms | 700+ | MIT |
| [openlawteam/openlaw-core](https://github.com/openlawteam/openlaw-core) | Smart contract generation from natural language | 100+ | Apache 2.0 |
| [commonform/commonform-cli](https://github.com/commonform/commonform-cli) | Plain-language legal form compilation | 100+ | Apache 2.0 |
| [kentaro-m/docusaurus-pdf](https://github.com/signcl/docusaurus-pdf) | Document generation utilities | 200+ | MIT |

#### Template Libraries
| Resource | Description | Access |
|----------|-------------|--------|
| [SAFT Project](https://saftproject.com) | Simple Agreement for Future Tokens templates | Open |
| [Series Seed](https://github.com/seriesseed/equity) | Startup equity document templates | Open |
| [Cooley GO Docs](https://www.cooleygo.com/documents/) | Startup legal document generator | Free |
| [Common Paper](https://commonpaper.com) | Standard commercial contracts | Open |

#### Commercial APIs
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [Juro](https://juro.com) | Contract collaboration | Templates, e-signature |
| [Ironclad](https://ironcladapp.com) | Digital contracting | Template automation |
| [Precisely](https://precisely.se) | Contract automation | Document assembly |

---

### SK-003: CLM Integration Skill
**Slug**: `clm-integration`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [docusign/docusign-esign-python-client](https://github.com/docusign/docusign-esign-python-client) | DocuSign API client | 200+ | MIT |
| [docusign/docusign-click-python-client](https://github.com/docusign/docusign-click-python-client) | DocuSign Click API | 50+ | MIT |
| [adobesign/AdobeSign-OpenAPI](https://github.com/AdobeDocs/adobesign-api-docs) | Adobe Sign API documentation | 50+ | Apache 2.0 |
| [pandadoc/pandadoc-api-python-client](https://github.com/PandaDoc/pandadoc-api-python-client) | PandaDoc API client | 50+ | MIT |

#### CLM Platform APIs
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Icertis](https://developer.icertis.com) | Icertis Developer Portal | Full CLM lifecycle |
| [DocuSign CLM](https://developers.docusign.com/docs/clm-api/) | CLM REST API | Contract management |
| [Agiloft](https://www.agiloft.com/developers.htm) | Agiloft REST API | Flexible CLM |
| [Ironclad](https://developer.ironcladapp.com) | Ironclad API | Digital contracting |
| [Conga](https://developer.conga.com) | Conga API | Document generation |
| [ContractPodAi](https://contractpodai.com/api/) | ContractPodAi API | AI CLM |

---

### SK-004: Obligation Tracking Skill
**Slug**: `obligation-tracking`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [celery/celery](https://github.com/celery/celery) | Distributed task queue for scheduling | 23K+ | BSD |
| [rq/rq-scheduler](https://github.com/rq/rq-scheduler) | Job scheduling for Redis Queue | 500+ | BSD |
| [agronholm/apscheduler](https://github.com/agronholm/apscheduler) | Advanced Python Scheduler | 5K+ | MIT |
| [spatie/laravel-schedule-monitor](https://github.com/spatie/laravel-schedule-monitor) | Schedule monitoring | 500+ | MIT |

#### Commercial Solutions
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [Sirion](https://www.sirionlabs.com) | AI contract lifecycle | Obligation extraction |
| [Parley Pro](https://parleypro.com) | Contract management | Obligation tracking |
| [CobbleStone](https://www.cobblestonesoftware.com) | Contract Insight | Milestone tracking |

---

### SK-005: Negotiation Playbook Skill
**Slug**: `negotiation-playbook`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [dmcc/py-rete](https://github.com/cmaclell/py_rete) | RETE algorithm for rule-based systems | 100+ | MIT |
| [pyke-project/pyke](https://github.com/pyke-project/pyke) | Knowledge-based inference engine | 200+ | MIT |
| [NomicFoundation/decision-tree](https://github.com/decision-tree/decision-tree) | Decision tree frameworks | 100+ | MIT |

#### Resources
| Resource | Description | Access |
|----------|-------------|--------|
| [WorldCC Playbook Templates](https://www.worldcc.com) | Contract playbook frameworks | Member |
| [IACCM Resources](https://www.worldcc.com/resources) | Negotiation best practices | Member |
| [CLOC Playbook Guide](https://cloc.org) | Corporate legal playbooks | Member |

---

### SK-006: Legal Research Skill
**Slug**: `legal-research`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [freelawproject/courtlistener](https://github.com/freelawproject/courtlistener) | Free legal research database | 500+ | AGPL |
| [freelawproject/eyecite](https://github.com/freelawproject/eyecite) | Legal citation extraction | 100+ | BSD |
| [openlegaldata/oldp](https://github.com/openlegaldata/oldp) | Open Legal Data Platform | 100+ | MIT |
| [case-law-access-project/capstone](https://github.com/harvard-lil/capstone) | Harvard case law access | 200+ | MIT |

#### Legal Research APIs
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [CourtListener API](https://www.courtlistener.com/api/) | Free case law API | US federal/state cases |
| [Case Law Access Project](https://case.law) | Harvard Law API | 6.5M+ case opinions |
| [RECAP Archive](https://www.courtlistener.com/recap/) | PACER document archive | Federal court docs |
| [LexisNexis API](https://developer.lexisnexis.com) | Commercial legal research | Full legal library |
| [Westlaw Edge API](https://developer.thomsonreuters.com) | Commercial legal research | Case law, statutes |
| [vLex](https://vlex.com/api) | Global legal research | Multi-jurisdictional |

#### Open Data Sources
| Source | Description | Access |
|--------|-------------|--------|
| [US Code (GPO)](https://uscode.house.gov) | Official US Code repository | Open |
| [Federal Register API](https://www.federalregister.gov/developers/api/v1) | Federal regulations | Open |
| [Regulations.gov API](https://open.gsa.gov/api/regulationsgov/) | Regulatory dockets | Open |
| [Congress.gov API](https://api.congress.gov) | Legislative data | Open |
| [EUR-Lex](https://eur-lex.europa.eu/content/tools/webservices.html) | EU law database | Open |

---

### SK-007: Regulatory Monitoring Skill
**Slug**: `regulatory-monitoring`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators) | Congressional data | 1K+ | CC0 |
| [freedomofpress/securedrop](https://github.com/freedomofpress/securedrop) | Document leak platform | 3K+ | AGPL |
| [rss-bridge/rss-bridge](https://github.com/RSS-Bridge/rss-bridge) | Feed generation from any site | 6K+ | Unlicense |

#### Regulatory Feed Sources
| Source | Description | Access |
|--------|-------------|--------|
| [Federal Register](https://www.federalregister.gov) | US regulatory publications | Open |
| [SEC EDGAR](https://www.sec.gov/developer) | Securities filings | Open |
| [OCC Bulletins](https://www.occ.gov/news-issuances/) | Banking guidance | Open |
| [FTC News](https://www.ftc.gov/news-events) | Consumer protection | Open |
| [CFPB Regulations](https://www.consumerfinance.gov/rules-policy/) | Consumer finance | Open |
| [EPA Regulations](https://www.epa.gov/laws-regulations) | Environmental rules | Open |
| [FDA Guidance](https://www.fda.gov/regulatory-information) | Healthcare regulations | Open |

#### Commercial Services
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [RegTech](https://www.regtech.com) | Regulatory intelligence | Multi-regulator tracking |
| [Thomson Reuters Regulatory Intelligence](https://legal.thomsonreuters.com/en/products/regulatory-intelligence) | Global regulatory tracking | Alert system |
| [Compliance.ai](https://www.compliance.ai) | AI regulatory monitoring | Change management |
| [Ascent](https://www.ascentregtech.com) | RegTech platform | Automated monitoring |

---

### SK-008: Compliance Assessment Skill
**Slug**: `compliance-assessment`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [complianceascode/oscap](https://github.com/ComplianceAsCode/content) | SCAP security content | 2K+ | BSD |
| [OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries) | Security compliance guides | 25K+ | CC BY-SA |
| [aquasecurity/trivy](https://github.com/aquasecurity/trivy) | Security compliance scanner | 20K+ | Apache 2.0 |
| [controlplaneio/kubesec](https://github.com/controlplaneio/kubesec) | Kubernetes security | 1K+ | Apache 2.0 |

#### Compliance Frameworks
| Framework | Repository/Resource | Description |
|-----------|---------------------|-------------|
| [NIST CSF](https://www.nist.gov/cyberframework) | Cybersecurity Framework | Security controls |
| [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html) | Information Security | Security standard |
| [SOC 2](https://www.aicpa.org/soc4so) | Service Organization Controls | Trust principles |
| [COBIT](https://www.isaca.org/resources/cobit) | IT Governance Framework | Control objectives |
| [ISO 37301](https://www.iso.org/standard/75080.html) | Compliance Management | Compliance systems |

---

### SK-009: Compliance Training Skill
**Slug**: `compliance-training`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [overhangio/tutor](https://github.com/overhangio/tutor) | Open edX deployment | 1K+ | AGPL |
| [ilios/ilios](https://github.com/ilios/ilios) | Curriculum management | 200+ | MIT |
| [h5p/h5p-cli](https://github.com/h5p/h5p-cli) | Interactive content creation | 100+ | MIT |
| [assesskit/assesskit](https://github.com/assesskit/assesskit) | Assessment framework | 100+ | MIT |

#### LMS Platforms with APIs
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Canvas LMS](https://canvas.instructure.com/doc/api/) | Canvas REST API | Full LMS integration |
| [Moodle](https://docs.moodle.org/dev/Web_service_API_functions) | Moodle Web Services | LMS functions |
| [Absorb LMS](https://developer.absorblms.com) | Absorb API | Corporate LMS |
| [SAP Litmos](https://support.litmos.com/hc/en-us/sections/360000199733-API) | Litmos API | Training tracking |
| [Docebo](https://www.docebo.com/developers/) | Docebo API | AI-powered LMS |

---

### SK-010: Compliance Evidence Collector
**Slug**: `compliance-evidence`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [prowler-cloud/prowler](https://github.com/prowler-cloud/prowler) | Cloud security assessment | 9K+ | Apache 2.0 |
| [bridgecrewio/checkov](https://github.com/bridgecrewio/checkov) | Policy-as-code for IaC | 6K+ | Apache 2.0 |
| [cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian) | Cloud governance rules | 5K+ | Apache 2.0 |
| [turbot/steampipe](https://github.com/turbot/steampipe) | Universal cloud API query | 6K+ | AGPL |

#### GRC Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [ServiceNow GRC](https://developer.servicenow.com) | ServiceNow API | Integrated GRC |
| [OneTrust](https://developer.onetrust.com) | OneTrust API | Privacy & GRC |
| [MetricStream](https://www.metricstream.com) | MetricStream API | Enterprise GRC |
| [Archer](https://www.archerirm.com) | RSA Archer API | Risk management |
| [LogicGate](https://www.logicgate.com/api) | LogicGate API | Risk Cloud |

---

### SK-011: Patent Prosecution Skill
**Slug**: `patent-prosecution`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [USPTO/PatentPublicData](https://github.com/USPTO/PatentPublicData) | USPTO open data tools | 200+ | CC0 |
| [google/patents-public-data](https://github.com/google/patents-public-data) | Google Patents dataset | 500+ | Apache 2.0 |
| [tarrell13/Patent-Parser](https://github.com/tarrell13/Patent-Parser) | Patent document parser | 100+ | MIT |
| [benho/patent-claim-parser](https://github.com/benho/patent-claim-parser) | Claim parsing utilities | 50+ | MIT |

#### Patent APIs and Data Sources
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [USPTO PatentsView API](https://patentsview.org/apis/api-endpoints) | US patent data API | Patent search, analysis |
| [USPTO Open Data Portal](https://developer.uspto.gov) | Official USPTO APIs | Full patent data |
| [EPO Open Patent Services](https://developers.epo.org) | European Patent Office API | EP patents |
| [WIPO](https://www.wipo.int/reference/en/wireservices/) | World IP Organization | PCT data |
| [Google Patents Public Data](https://console.cloud.google.com/marketplace/details/google_patents_public_datasets/google-patents-public-data) | BigQuery dataset | Global patents |
| [Lens.org](https://about.lens.org/data-services/) | Open patent & scholarly | Free patent search |

#### Commercial Services
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [PatSnap](https://www.patsnap.com) | IP intelligence | Analytics, search |
| [Questel](https://www.questel.com) | IP business intelligence | Portfolio management |
| [Anaqua](https://www.anaqua.com) | IP management | Docketing, analytics |

---

### SK-012: Trademark Management Skill
**Slug**: `trademark-management`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [USPTO/TrademarkPublicData](https://bulkdata.uspto.gov) | USPTO trademark bulk data | - | Public Domain |
| [imagededup/imagededup](https://github.com/idealo/imagededup) | Image deduplication for logo comparison | 4K+ | Apache 2.0 |
| [opencv/opencv](https://github.com/opencv/opencv) | Computer vision for logo analysis | 75K+ | Apache 2.0 |

#### Trademark APIs and Data Sources
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [USPTO TSDR API](https://developer.uspto.gov/api-catalog/trademark-status-document-retrieval-tsdr) | Trademark status API | Registration data |
| [USPTO Trademark Bulk Data](https://bulkdata.uspto.gov) | TSDR bulk files | Full trademark database |
| [EUIPO TMView](https://www.tmdn.org/tmview/) | EU trademark search | European marks |
| [WIPO Global Brand Database](https://www.wipo.int/branddb/en/) | International trademark | Madrid Protocol |
| [TrademarkNow](https://www.trademarknow.com) | AI trademark screening | Clearance search |
| [Corsearch](https://corsearch.com) | Brand protection | Screening, watching |

---

### SK-013: IP Portfolio Skill
**Slug**: `ip-portfolio`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [patentsview/PatentsView-API](https://github.com/PatentsView/PatentsView-API) | Patent data analysis | 100+ | Public Domain |
| [freepatentmosaic/pmc](https://github.com/PatentsView) | Patent mining tools | 50+ | MIT |

#### IP Management Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Anaqua](https://www.anaqua.com) | IP Management | Full portfolio |
| [CPA Global (Clarivate)](https://clarivate.com/cpa-global/) | IP Services | Renewals, docketing |
| [Dennemeyer](https://www.dennemeyer.com) | IP Management | Global portfolio |
| [IPfolio](https://www.ipfolio.com) | Cloud IP Management | Portfolio tracking |
| [FoundationIP](https://www.foundationip.com) | IP Management | Docketing |

---

### SK-014: Trade Secret Protection Skill
**Slug**: `trade-secret-protection`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [microsoft/presidio](https://github.com/microsoft/presidio) | Data protection & PII anonymization | 2K+ | MIT |
| [opendlp/opendlp](https://github.com/opendlp/opendlp) | Open source DLP | 500+ | GPL |
| [digitalocean/document-classifier](https://github.com/digitalocean) | Document classification | 100+ | MIT |

#### Commercial DLP Solutions
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [Microsoft Purview](https://learn.microsoft.com/en-us/purview/purview) | Microsoft DLP | Data classification |
| [Symantec DLP](https://www.broadcom.com/products/cybersecurity/information-protection/data-loss-prevention) | Enterprise DLP | Content detection |
| [Digital Guardian](https://www.digitalguardian.com) | Data protection | Endpoint DLP |
| [Forcepoint](https://www.forcepoint.com) | Data-first security | DLP, CASB |

---

### SK-015: IP Licensing Skill
**Slug**: `ip-licensing`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [spdx/license-list-data](https://github.com/spdx/license-list-data) | SPDX license list | 500+ | CC0 |
| [licensee/licensee](https://github.com/licensee/licensee) | License detection | 1K+ | MIT |
| [fossology/fossology](https://github.com/fossology/fossology) | Open source license compliance | 700+ | GPL |

#### License Management Platforms
| Platform | Description | Capabilities |
|----------|-------------|--------------|
| [Rightsline](https://www.rightsline.com) | Rights management | Royalty tracking |
| [FilmTrack](https://www.filmtrack.com) | Rights management | License tracking |
| [FADEL](https://fadel.com) | Brand licensing | Royalty management |

---

### SK-016: Legal Hold Skill
**Slug**: `legal-hold`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [DFRWS/dfrws-challenge](https://github.com/DFRWS) | Digital forensics resources | - | Various |
| [sleuthkit/sleuthkit](https://github.com/sleuthkit/sleuthkit) | Digital forensics toolkit | 2K+ | Multiple |

#### Legal Hold Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Exterro](https://www.exterro.com) | Legal GRC | Legal hold management |
| [ZyLAB ONE](https://www.zylab.com) | eDiscovery | Legal hold automation |
| [Lighthouse](https://www.lighthouseglobal.com) | Legal hold | Custodian management |
| [Logikcull](https://www.logikcull.com) | Legal hold | Automated holds |
| [Onna](https://onna.com) | Data management | Enterprise legal hold |

---

### SK-017: E-Discovery Skill
**Slug**: `e-discovery`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [apache/tika](https://github.com/apache/tika) | Content detection and extraction | 1K+ | Apache 2.0 |
| [libratom/libratom](https://github.com/libratom/libratom) | Email archive processing | 100+ | MIT |
| [openedr/openedr](https://github.com/ComodoSecurity/openedr) | Open endpoint detection | 1K+ | Apache 2.0 |

#### E-Discovery Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Relativity](https://platform.relativity.com) | Relativity API | Full e-discovery |
| [Everlaw](https://www.everlaw.com/product/api/) | Everlaw API | Cloud e-discovery |
| [Disco](https://www.csdisco.com) | DISCO API | AI e-discovery |
| [Nuix](https://www.nuix.com/developers) | Nuix Engine API | Data processing |
| [Exterro](https://www.exterro.com) | Exterro API | Legal GRC |
| [Reveal](https://www.revealdata.com) | Reveal-Brainspace | AI review |

---

### SK-018: Matter Management Skill
**Slug**: `matter-management`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [openproject/openproject](https://github.com/opf/openproject) | Project management | 8K+ | GPL |
| [taigaio/taiga-back](https://github.com/taigaio/taiga-back) | Project management backend | 4K+ | AGPL |

#### Matter Management Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Clio](https://app.clio.com/api/v4/documentation) | Clio API | Legal practice management |
| [PracticePanther](https://www.practicepanther.com/api/) | Practice Management API | Matter tracking |
| [Litify](https://www.litify.com/developers/) | Salesforce Legal | Matter lifecycle |
| [SimpleLegal](https://www.simplelegal.com) | Legal Operations | Matter & spend |
| [Mitratech TeamConnect](https://mitratech.com) | Enterprise Legal | Matter management |
| [Onit](https://www.onit.com) | Legal Operations | Matter automation |

---

### SK-019: ADR Management Skill
**Slug**: `adr-management`

#### Resources
| Organization | Service | Capabilities |
|--------------|---------|--------------|
| [AAA/ICDR](https://www.adr.org) | American Arbitration Association | Arbitration services |
| [JAMS](https://www.jamsadr.com) | JAMS Mediation & Arbitration | Dispute resolution |
| [ICC](https://iccwbo.org/dispute-resolution-services/) | International Chamber of Commerce | International arbitration |
| [LCIA](https://www.lcia.org) | London Court of International Arbitration | International ADR |
| [CPR](https://www.cpradr.org) | CPR Institute | Corporate ADR |

---

### SK-020: Board Governance Skill
**Slug**: `board-governance`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [decidim/decidim](https://github.com/decidim/decidim) | Digital democracy platform | 1K+ | AGPL |
| [loomio/loomio](https://github.com/loomio/loomio) | Collaborative decision-making | 2K+ | AGPL |

#### Board Portal Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Diligent Boards](https://diligent.com) | Board Management | Board portal |
| [Nasdaq Boardvantage](https://www.nasdaq.com/solutions/governance-solutions) | Board Portal | Board meetings |
| [BoardEffect](https://www.boardeffect.com) | Board Management | Governance |
| [OnBoard](https://www.passageways.com/board-portal-software/) | Board Portal | Meeting management |
| [Azeus Convene](https://www.azeusconvene.com) | Board Portal | Digital governance |

---

### SK-021: Policy Management Skill
**Slug**: `policy-management`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [open-policy-agent/opa](https://github.com/open-policy-agent/opa) | Policy engine | 9K+ | Apache 2.0 |
| [bridgecrewio/checkov](https://github.com/bridgecrewio/checkov) | Policy as code | 6K+ | Apache 2.0 |

#### Policy Management Platforms
| Platform | Description | Capabilities |
|----------|-------------|--------------|
| [PowerDMS](https://www.powerdms.com) | Policy Management | Document control |
| [ConvergePoint](https://www.convergepoint.com) | SharePoint Policy | Policy lifecycle |
| [ComplianceBridge](https://www.compliancebridge.com) | Policy Software | Policy distribution |
| [NAVEX Global](https://www.navex.com) | Policy Management | Ethics & compliance |

---

### SK-022: Corporate Records Skill
**Slug**: `corporate-records`

#### Entity Management Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [CT Corporation](https://www.wolterskluwer.com/en/solutions/ct-corporation) | Entity Management | Corporate filings |
| [CSC](https://www.cscglobal.com/service/sbs/) | CSC Entity Management | Entity compliance |
| [Diligent Entities](https://diligent.com/products/entities) | Diligent API | Entity management |
| [EnterpriseEntity](https://www.enterpriseentity.com) | Entity Management | Subsidiary tracking |

---

### SK-023: Entity Management Skill
**Slug**: `entity-management`

#### Filing APIs
| Provider | Service | Capabilities |
|----------|---------|--------------|
| [Delaware Division of Corporations](https://corp.delaware.gov) | Delaware Filings | Corporate filings |
| [EDGAR Online](https://www.edgar-online.com) | SEC Filings | Public company |
| [Dun & Bradstreet](https://developer.dnb.com) | D&B API | Business data |
| [OpenCorporates](https://api.opencorporates.com) | Corporate Data | Global entities |

---

### SK-024: GDPR Compliance Skill
**Slug**: `gdpr-compliance`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [microsoft/presidio](https://github.com/microsoft/presidio) | PII detection | 2K+ | MIT |
| [special-cases/gdpr-framework](https://github.com/special-cases) | GDPR implementation | 100+ | MIT |
| [privacyidea/privacyidea](https://github.com/privacyidea/privacyidea) | Privacy management | 1K+ | AGPL |

#### Privacy Management Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [OneTrust](https://developer.onetrust.com) | OneTrust API | Privacy management |
| [TrustArc](https://trustarc.com) | TrustArc Platform | Privacy compliance |
| [BigID](https://www.bigid.com) | BigID API | Data intelligence |
| [Securiti](https://securiti.ai) | Securiti.ai | Privacy automation |
| [DataGrail](https://www.datagrail.io) | DataGrail API | Privacy platform |
| [Transcend](https://transcend.io) | Transcend API | Data rights |

---

### SK-025: Data Mapping Skill
**Slug**: `data-mapping`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [amundsen-io/amundsen](https://github.com/amundsen-io/amundsen) | Data discovery platform | 4K+ | Apache 2.0 |
| [datahub-project/datahub](https://github.com/datahub-project/datahub) | Metadata platform | 9K+ | Apache 2.0 |
| [apache/atlas](https://github.com/apache/atlas) | Data governance and metadata | 1K+ | Apache 2.0 |
| [linkedin/datalineage](https://github.com/linkedin/WhereHows) | Data lineage | 1K+ | Apache 2.0 |

#### Data Cataloging Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [Collibra](https://developer.collibra.com) | Collibra API | Data intelligence |
| [Alation](https://www.alation.com) | Alation API | Data catalog |
| [Informatica](https://developer.informatica.com) | Informatica API | Data management |
| [Talend](https://developer.talend.com) | Talend API | Data integration |

---

### SK-026: Data Subject Rights Skill
**Slug**: `dsr-management`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [fides-ethical/fides](https://github.com/ethyca/fides) | Privacy engineering | 1K+ | Apache 2.0 |
| [openid/opendid](https://github.com/openid) | Identity verification | - | Apache 2.0 |

#### DSR Management Platforms
| Platform | API Documentation | Capabilities |
|----------|-------------------|--------------|
| [OneTrust](https://developer.onetrust.com) | Privacy Rights | DSR automation |
| [DataGrail](https://www.datagrail.io) | DSR Platform | Request fulfillment |
| [Transcend](https://transcend.io) | Data Rights | Automated responses |
| [WireWheel](https://wirewheel.io) | Privacy Platform | DSR management |
| [Ketch](https://www.ketch.com) | Data Control | Consent & DSR |

---

### SK-027: Breach Response Skill
**Slug**: `breach-response`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [TheHive-Project/TheHive](https://github.com/TheHive-Project/TheHive) | Security incident response | 3K+ | AGPL |
| [MISP/MISP](https://github.com/MISP/MISP) | Threat intelligence platform | 5K+ | AGPL |
| [dfir-iris/iris-web](https://github.com/dfir-iris/iris-web) | Incident response platform | 2K+ | LGPL |

#### Breach Notification Resources
| Resource | Description | Access |
|----------|-------------|--------|
| [HHS Breach Portal](https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf) | HIPAA breach reporting | Public |
| [State AG Notification List](https://www.ncsl.org/technology-and-communication/security-breach-notification-laws) | State breach laws | Reference |
| [GDPR Breach Notification](https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en) | EU guidance | Reference |
| [IAPP Breach Calculator](https://iapp.org/resources/article/us-state-data-breach-notification-chart/) | Breach timeline tool | Reference |

---

### SK-028: Privacy Impact Assessment Skill
**Slug**: `pia-assessment`

#### GitHub Repositories
| Repository | Description | Stars | License |
|------------|-------------|-------|---------|
| [OWASP/Threat-Dragon](https://github.com/OWASP/threat-dragon) | Threat modeling | 500+ | Apache 2.0 |
| [cetic/frama-c](https://github.com/Frama-C/Frama-C-snapshot) | Formal analysis | 200+ | LGPL |

#### PIA Resources
| Resource | Description | Access |
|----------|-------------|--------|
| [ICO DPIA Guidance](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/data-protection-impact-assessments-dpias/) | UK DPA guidance | Reference |
| [CNIL PIA Software](https://www.cnil.fr/en/open-source-pia-software-helps-carry-out-data-protection-impact-assesment) | Open source PIA tool | Free |
| [NIST Privacy Framework](https://www.nist.gov/privacy-framework) | Privacy risk framework | Reference |
| [EDPB DPIA Guidelines](https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en) | EU DPIA guidance | Reference |

---

## Agents References

### AG-001: General Counsel Agent
**Slug**: `general-counsel`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [ACC Resources](https://www.acc.com) | Association of Corporate Counsel | Member |
| [Harvard Law School Forum](https://corpgov.law.harvard.edu) | Corporate governance | Open |
| [Stanford Law Resources](https://law.stanford.edu/publications/) | Legal scholarship | Open |
| [GC Magazine](https://www.globalcustodian.com) | Industry insights | Subscription |

#### Persona Model Training Data
| Dataset | Description | Access |
|---------|-------------|--------|
| Legal briefs corpus | SEC filings, legal opinions | Various |
| Board presentation archives | Governance materials | Internal |
| Legal department metrics | Benchmarking data | CLOC |

---

### AG-002: Contracts Counsel Agent
**Slug**: `contracts-counsel`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [WorldCC](https://www.worldcc.com) | Contract management resources | Member |
| [IACCM Benchmarking](https://www.worldcc.com) | Contract benchmarks | Member |
| [Contract Nerds](https://contractnerds.com) | Contract community | Open |

---

### AG-003: Compliance Officer Agent
**Slug**: `compliance-officer`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [SCCE](https://www.corporatecompliance.org) | Society of Corporate Compliance | Member |
| [FCPA Blog](https://fcpablog.com) | Anti-corruption resources | Open |
| [Compliance Week](https://www.complianceweek.com) | Compliance news | Subscription |
| [DOJ FCPA Resource](https://www.justice.gov/criminal-fraud/fcpa) | DOJ guidance | Open |

---

### AG-004: Regulatory Affairs Specialist Agent
**Slug**: `regulatory-specialist`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [Regulatory Focus](https://www.raps.org) | RAPS resources | Member |
| [Law360](https://www.law360.com) | Regulatory news | Subscription |
| [Federal Register](https://www.federalregister.gov) | US regulations | Open |

---

### AG-005: IP Counsel Agent
**Slug**: `ip-counsel`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [AIPLA](https://www.aipla.org) | IP Law Association | Member |
| [IPWatchdog](https://www.ipwatchdog.com) | IP news and analysis | Open |
| [WIPO Magazine](https://www.wipo.int/wipo_magazine/en/) | Global IP insights | Open |
| [IAM Magazine](https://www.iam-media.com) | IP business strategy | Subscription |

---

### AG-006: Patent Attorney Agent
**Slug**: `patent-attorney`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [USPTO MPEP](https://www.uspto.gov/web/offices/pac/mpep/index.html) | Manual of Patent Examining Procedure | Open |
| [PatentlyO](https://patentlyo.com) | Patent law blog | Open |
| [EPO Guidelines](https://www.epo.org/law-practice/legal-texts/guidelines.html) | European patent guidelines | Open |

---

### AG-007: Trademark Attorney Agent
**Slug**: `trademark-attorney`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [INTA](https://www.inta.org) | International Trademark Association | Member |
| [TMEP](https://tmep.uspto.gov) | Trademark Manual | Open |
| [Trademark Reporter](https://www.inta.org/trademark-reporter/) | Trademark journal | Member |

---

### AG-008: Litigation Counsel Agent
**Slug**: `litigation-counsel`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [ABA Litigation Section](https://www.americanbar.org/groups/litigation/) | Litigation resources | Member |
| [JOLT Blog](https://jolt.law.harvard.edu) | Legal tech and litigation | Open |
| [Litigation Finance Journal](https://www.litigationfinancejournal.com) | Litigation funding | Open |

---

### AG-009: E-Discovery Specialist Agent
**Slug**: `e-discovery-specialist`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [EDRM](https://edrm.net) | E-Discovery Reference Model | Open |
| [ACEDS](https://aceds.org) | E-Discovery certification | Member |
| [Sedona Conference](https://thesedonaconference.org) | E-discovery guidance | Open |

---

### AG-010: Corporate Counsel Agent
**Slug**: `corporate-counsel`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [Delaware Courts](https://courts.delaware.gov/Chancery/) | Delaware corporate law | Open |
| [Harvard Corporate Governance](https://corpgov.law.harvard.edu) | Governance research | Open |
| [SEC.gov](https://www.sec.gov) | Securities guidance | Open |

---

### AG-011: Corporate Secretary Agent
**Slug**: `corporate-secretary`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [Society for Corporate Governance](https://www.societycorpgov.org) | Governance professionals | Member |
| [NYSE Listing Standards](https://www.nyse.com/regulation/listed-company-compliance) | Exchange rules | Open |
| [NASDAQ Governance](https://listingcenter.nasdaq.com/rulebook/nasdaq/rules) | Listing rules | Open |

---

### AG-012: Privacy Counsel Agent
**Slug**: `privacy-counsel`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [IAPP](https://iapp.org) | International Association of Privacy Professionals | Member |
| [Future of Privacy Forum](https://fpf.org) | Privacy research | Open |
| [Privacy Tracker](https://iapp.org/resources/article/us-state-privacy-legislation-tracker/) | State privacy laws | Open |

---

### AG-013: Data Protection Officer Agent
**Slug**: `data-protection-officer`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [EDPB](https://edpb.europa.eu) | European Data Protection Board | Open |
| [ICO Guidance](https://ico.org.uk) | UK DPA guidance | Open |
| [CNIL Resources](https://www.cnil.fr/en) | French DPA | Open |

---

### AG-014: Breach Response Coordinator Agent
**Slug**: `breach-coordinator`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [SANS Incident Response](https://www.sans.org/incident-response/) | IR resources | Member |
| [FIRST](https://www.first.org) | Incident response teams | Member |
| [Verizon DBIR](https://www.verizon.com/business/resources/reports/dbir/) | Breach statistics | Open |

---

### AG-015: Legal Operations Manager Agent
**Slug**: `legal-ops-manager`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [CLOC](https://cloc.org) | Corporate Legal Operations Consortium | Member |
| [Legal Tech News](https://www.law.com/legaltechnews/) | Legal technology | Subscription |
| [Blickstein Group Surveys](https://blicksteingroup.com) | Legal ops benchmarks | Subscription |

---

### AG-016: Employment Lawyer Agent
**Slug**: `employment-lawyer`

#### Knowledge Sources
| Resource | Description | Access |
|----------|-------------|--------|
| [SHRM](https://www.shrm.org) | HR/Employment resources | Member |
| [DOL](https://www.dol.gov) | Department of Labor | Open |
| [EEOC](https://www.eeoc.gov) | Employment discrimination | Open |
| [Littler Workplace Policy Institute](https://www.littler.com/firm-news-announcements/workplace-policy-institute) | Employment policy | Open |

---

## MCP Servers

### Available Legal MCP Servers

| Server | Repository | Description | Capabilities |
|--------|------------|-------------|--------------|
| **Legal Research MCP** | [Custom Implementation] | Legal research integration | Case law search, citation analysis |
| **Contract Analysis MCP** | [Custom Implementation] | Contract document processing | Clause extraction, risk scoring |
| **Compliance MCP** | [Custom Implementation] | Compliance framework integration | Control mapping, evidence collection |
| **E-Discovery MCP** | [Custom Implementation] | E-discovery platform integration | Document processing, review workflows |

### Recommended MCP Server Implementations

#### 1. Legal Document MCP Server
```
Purpose: Process legal documents (contracts, briefs, filings)
Features:
- PDF/Word document parsing
- Legal entity extraction
- Citation detection and validation
- Clause identification and categorization
APIs to integrate: Apache Tika, spaCy, eyecite
```

#### 2. Legal Research MCP Server
```
Purpose: Search and analyze legal sources
Features:
- Case law search
- Statute lookup
- Regulatory tracking
- Citation network analysis
APIs to integrate: CourtListener, Congress.gov, Federal Register
```

#### 3. CLM Integration MCP Server
```
Purpose: Connect to contract lifecycle management systems
Features:
- Contract status queries
- Obligation extraction
- Workflow automation
- E-signature integration
APIs to integrate: DocuSign, Icertis, Ironclad
```

#### 4. Compliance Framework MCP Server
```
Purpose: Map and track compliance requirements
Features:
- Framework control lookup
- Evidence mapping
- Risk scoring
- Audit support
APIs to integrate: NIST CSF, ISO 27001, SOC 2 frameworks
```

#### 5. Privacy Management MCP Server
```
Purpose: Manage privacy compliance workflows
Features:
- Data mapping queries
- DSR processing
- Consent management
- PIA automation
APIs to integrate: OneTrust, BigID, TrustArc
```

---

## Community Resources

### Professional Organizations

| Organization | Website | Resources |
|--------------|---------|-----------|
| Association of Corporate Counsel (ACC) | [acc.com](https://www.acc.com) | Templates, benchmarks, CLEs |
| Corporate Legal Operations Consortium (CLOC) | [cloc.org](https://cloc.org) | Legal ops resources |
| International Association of Privacy Professionals (IAPP) | [iapp.org](https://iapp.org) | Privacy resources, certifications |
| Society of Corporate Compliance and Ethics (SCCE) | [corporatecompliance.org](https://www.corporatecompliance.org) | Compliance resources |
| World Commerce & Contracting (WorldCC) | [worldcc.com](https://www.worldcc.com) | Contract management |
| E-Discovery Reference Model (EDRM) | [edrm.net](https://edrm.net) | E-discovery standards |
| American Intellectual Property Law Association (AIPLA) | [aipla.org](https://www.aipla.org) | IP resources |
| International Trademark Association (INTA) | [inta.org](https://www.inta.org) | Trademark resources |

### Open Source Communities

| Community | Focus | Resources |
|-----------|-------|-----------|
| Free Law Project | Legal data access | CourtListener, RECAP |
| Open Legal Data | Legal data standards | OLDP, legal schemas |
| Common Form | Legal document standards | Markup, templates |
| Accord Project | Smart legal contracts | Cicero, templates |

### Legal Technology Standards

| Standard | Organization | Purpose |
|----------|--------------|---------|
| SALI (Standards Advancement for Legal Industry) | [sali.org](https://www.sali.org) | Legal data standards |
| LEDES (Legal Electronic Data Exchange Standard) | [ledes.org](https://www.ledes.org) | Legal billing |
| EDRM | [edrm.net](https://edrm.net) | E-discovery reference model |
| UTBMS | ABA | Uniform Task-Based Billing |

---

## Legal Technology Platforms

### Contract Management

| Platform | Type | Best For |
|----------|------|----------|
| Icertis | Enterprise CLM | Large enterprises, complex contracts |
| DocuSign CLM | Mid-market CLM | DocuSign ecosystem users |
| Ironclad | Digital contracting | Tech companies, high volume |
| Agiloft | Flexible CLM | Custom workflows |
| Conga (Apttus) | CLM + CPQ | Salesforce users |

### E-Discovery

| Platform | Type | Best For |
|----------|------|----------|
| Relativity | Enterprise e-discovery | Large matters, law firms |
| Everlaw | Cloud e-discovery | Cloud-first organizations |
| DISCO | AI-powered e-discovery | AI review needs |
| Nuix | Data processing | High-volume processing |
| Exterro | Legal GRC | Integrated legal hold + e-discovery |

### Privacy Management

| Platform | Type | Best For |
|----------|------|----------|
| OneTrust | Privacy management | Comprehensive privacy program |
| TrustArc | Privacy compliance | Cookie consent, assessments |
| BigID | Data intelligence | Data discovery, classification |
| Securiti.ai | Privacy automation | AI-driven privacy |
| WireWheel | Privacy platform | Mid-market privacy |

### GRC Platforms

| Platform | Type | Best For |
|----------|------|----------|
| ServiceNow GRC | Enterprise GRC | ServiceNow ecosystem |
| Archer (RSA) | Enterprise risk | Complex risk programs |
| MetricStream | Enterprise GRC | Global compliance |
| LogicGate | Risk Cloud | Flexible workflows |
| OneTrust GRC | Integrated GRC | Privacy + compliance |

---

## Regulatory Data Sources

### United States

| Agency | Data Source | API Available |
|--------|-------------|---------------|
| SEC | [EDGAR](https://www.sec.gov/edgar) | Yes |
| Federal Register | [federalregister.gov](https://www.federalregister.gov) | Yes |
| Congress | [congress.gov](https://www.congress.gov) | Yes |
| USPTO | [developer.uspto.gov](https://developer.uspto.gov) | Yes |
| DOJ | [justice.gov](https://www.justice.gov) | No |
| FTC | [ftc.gov](https://www.ftc.gov) | Limited |
| CFPB | [consumerfinance.gov](https://www.consumerfinance.gov) | Yes |
| EPA | [epa.gov](https://www.epa.gov) | Yes |
| FDA | [fda.gov](https://www.fda.gov) | Limited |

### European Union

| Agency | Data Source | API Available |
|--------|-------------|---------------|
| EUR-Lex | [eur-lex.europa.eu](https://eur-lex.europa.eu) | Yes |
| EUIPO | [euipo.europa.eu](https://euipo.europa.eu) | Yes |
| EPO | [epo.org](https://www.epo.org) | Yes |
| EDPB | [edpb.europa.eu](https://edpb.europa.eu) | No |
| EBA | [eba.europa.eu](https://www.eba.europa.eu) | Yes |

### International

| Organization | Data Source | API Available |
|--------------|-------------|---------------|
| WIPO | [wipo.int](https://www.wipo.int) | Yes |
| WTO | [wto.org](https://www.wto.org) | Limited |
| UN | [un.org](https://www.un.org) | Limited |
| OECD | [oecd.org](https://www.oecd.org) | Yes |

---

## Implementation Notes

### Priority Implementation Order

Based on the skills-agents-backlog.md phases:

#### Phase 1 (Foundation)
- SK-001 Contract Analysis: Start with CUAD dataset, spaCy NER
- SK-003 CLM Integration: Prioritize DocuSign CLM API
- SK-008 Compliance Assessment: Implement NIST CSF mapping
- AG-002 Contracts Counsel: Train on WorldCC playbook data
- AG-003 Compliance Officer: Train on SCCE resources

#### Phase 2-7
Follow the priority order in skills-agents-backlog.md, leveraging the APIs and resources cataloged above for each skill/agent implementation.

### Technical Considerations

1. **API Rate Limits**: Most legal research APIs have rate limits; implement caching and queuing
2. **Document Processing**: Use Apache Tika for universal document parsing
3. **NLP Models**: Consider fine-tuning legal-domain models (Legal-BERT, CaseLaw-BERT)
4. **Data Privacy**: Implement data minimization for any training data
5. **Audit Trails**: All legal operations require comprehensive logging

### Licensing Considerations

| License Type | Consideration |
|--------------|---------------|
| AGPL | Requires source code disclosure if deployed as service |
| Apache 2.0 | Patent grants included, commercial-friendly |
| MIT | Most permissive, no patent grants |
| CC BY | Attribution required |
| Proprietary APIs | Review commercial terms carefully |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| GitHub Repositories Referenced | 50+ |
| Commercial APIs Referenced | 40+ |
| Professional Organizations | 8 |
| Legal Technology Platforms | 25+ |
| Regulatory Data Sources | 15+ |
| Open Datasets | 10+ |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Documented
**Next Step**: Phase 6 - Begin implementation of priority skills and agents
