# Customer Experience and Support - Skills and Agents References

This document provides curated references to GitHub repositories, MCP servers, community resources, and third-party tools that can accelerate the implementation of the skills and agents identified in the backlog.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills References](#skills-references)
3. [Agents References](#agents-references)
4. [MCP Server References](#mcp-server-references)
5. [Platform Integration References](#platform-integration-references)
6. [Community Resources](#community-resources)
7. [Standards and Frameworks](#standards-and-frameworks)

---

## Overview

### Purpose
This document maps each identified skill and agent to relevant external resources including:
- Open-source GitHub repositories for implementation reference
- MCP (Model Context Protocol) servers for direct integration
- Community tools and libraries
- Platform APIs and SDKs
- Industry standards and frameworks

### Resource Categories
- **GitHub Repos**: Open-source code for reference or direct use
- **MCP Servers**: Ready-to-use Model Context Protocol integrations
- **NPM Packages**: Node.js libraries for quick integration
- **APIs**: External service APIs for platform integration
- **Standards**: Industry frameworks and methodologies

---

## Skills References

### SK-001: Sentiment Analysis Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [vaderSentiment](https://github.com/cjhutto/vaderSentiment) | VADER sentiment analysis for social media text | 4.2k+ | Python |
| [natural](https://github.com/NaturalNode/natural) | General natural language facilities for Node.js including sentiment | 10k+ | JavaScript |
| [sentiment](https://github.com/thisandagain/sentiment) | AFINN-based sentiment analysis for Node.js | 3k+ | JavaScript |
| [compromise](https://github.com/spencermountain/compromise) | Modest natural-language processing in JavaScript | 11k+ | JavaScript |
| [TextBlob](https://github.com/sloria/TextBlob) | Simple Python library for NLP tasks including sentiment | 8.8k+ | Python |

#### NPM Packages
- `sentiment` - AFINN-based sentiment analysis
- `natural` - NLP toolkit with sentiment analysis
- `ml-sentiment` - Machine learning sentiment classifier
- `wink-sentiment` - Accurate sentiment scoring
- `franc` - Language detection for multilingual support

#### APIs
- **AWS Comprehend**: Sentiment analysis API
- **Google Cloud Natural Language**: Entity and sentiment analysis
- **Azure Text Analytics**: Sentiment and opinion mining
- **IBM Watson Natural Language Understanding**: Advanced NLP

---

### SK-002: NPS/CSAT Analytics Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [nps-calculator](https://github.com/danielstjernquist/nps-calculator) | NPS score calculator | 50+ | JavaScript |
| [simple-statistics](https://github.com/simple-statistics/simple-statistics) | Statistical methods for JavaScript | 3k+ | JavaScript |
| [stats-js](https://github.com/mrdoob/stats.js) | JavaScript performance monitor | 8k+ | JavaScript |
| [jstat](https://github.com/jstat/jstat) | Statistical library for JavaScript | 1.5k+ | JavaScript |

#### NPM Packages
- `simple-statistics` - Statistical analysis functions
- `jstat` - Statistical operations
- `stats-lite` - Lightweight statistics library
- `ml-regression` - Regression analysis for trend prediction

#### Reference Resources
- [NPS Benchmarks by Industry](https://www.qualtrics.com/blog/nps-benchmarks/)
- [CSAT Calculation Best Practices](https://www.zendesk.com/blog/customer-satisfaction-score/)
- [CX Metrics Framework](https://www.gartner.com/en/marketing/glossary/customer-experience-cx)

---

### SK-003: Customer Health Score Calculator Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [customer-health-score](https://github.com/topics/customer-health-score) | GitHub topic for health score implementations | Various | Various |
| [mlr3](https://github.com/mlr-org/mlr3) | Machine learning framework (R) | 800+ | R |
| [scikit-learn](https://github.com/scikit-learn/scikit-learn) | ML library with scoring algorithms | 58k+ | Python |
| [brain.js](https://github.com/BrainJS/brain.js) | Neural network library for Node.js | 14k+ | JavaScript |

#### NPM Packages
- `brain.js` - Neural networks for score prediction
- `ml-regression` - Regression for trend analysis
- `mathjs` - Extensive math library for calculations
- `simple-statistics` - Statistical computations

#### Vendor APIs
- **Gainsight API**: Health score management
- **Totango API**: Customer success metrics
- **ChurnZero API**: Health scoring and analytics
- **Vitally API**: Customer health platform

---

### SK-004: Churn Prediction Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [customer-churn-prediction](https://github.com/topics/customer-churn-prediction) | GitHub topic for churn prediction | Various | Various |
| [tensorflow](https://github.com/tensorflow/tensorflow) | ML framework for prediction models | 182k+ | Python/C++ |
| [xgboost](https://github.com/dmlc/xgboost) | Gradient boosting for classification | 25k+ | C++/Python |
| [lightgbm](https://github.com/microsoft/LightGBM) | Fast gradient boosting framework | 16k+ | C++/Python |
| [ml.js](https://github.com/mljs/ml) | Machine learning tools for JavaScript | 2.4k+ | JavaScript |

#### NPM Packages
- `@tensorflow/tfjs` - TensorFlow.js for browser/Node.js
- `brain.js` - Neural network library
- `ml-random-forest` - Random forest classifier
- `ml-logistic-regression` - Logistic regression

#### Reference Resources
- [Churn Prediction Models](https://www.kdnuggets.com/2019/05/churn-prediction-machine-learning.html)
- [Feature Engineering for Churn](https://towardsdatascience.com/churn-prediction-770d6cb582a5)

---

### SK-005: Ticket Classification Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [fastText](https://github.com/facebookresearch/fastText) | Library for text classification | 25k+ | C++/Python |
| [transformers](https://github.com/huggingface/transformers) | State-of-the-art NLP models | 125k+ | Python |
| [ticket-classifier](https://github.com/topics/ticket-classification) | GitHub topic for ticket classification | Various | Various |
| [spaCy](https://github.com/explosion/spaCy) | Industrial-strength NLP | 29k+ | Python |

#### NPM Packages
- `natural` - Text classification with Naive Bayes
- `compromise` - NLP with entity extraction
- `node-nlp` - NLP library with classification
- `wink-naive-bayes-text-classifier` - Text classification

#### APIs
- **MonkeyLearn**: Text classification API
- **Dialogflow**: Intent classification
- **AWS Comprehend**: Custom classification
- **Cohere**: Text classification embeddings

---

### SK-006: SLA Monitoring Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [sla-calculator](https://github.com/topics/sla-calculator) | GitHub topic for SLA tools | Various | Various |
| [moment](https://github.com/moment/moment) | Date/time library for calculations | 47k+ | JavaScript |
| [date-fns](https://github.com/date-fns/date-fns) | Modern date utility library | 33k+ | TypeScript |
| [business-time](https://github.com/topics/business-time) | Business hours calculation | Various | Various |

#### NPM Packages
- `moment-business-time` - Business hours calculation
- `date-fns` - Date manipulation utilities
- `luxon` - DateTime library
- `workalendar` - Working day calendars
- `cron-parser` - SLA schedule parsing

#### Reference Resources
- [SLA Management Best Practices](https://www.servicenow.com/products/service-level-management.html)
- [ITIL SLA Framework](https://wiki.en.it-processmaps.com/index.php/Service_Level_Management)

---

### SK-007: Knowledge Article Generator Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [gpt4all](https://github.com/nomic-ai/gpt4all) | Local LLM for content generation | 65k+ | C++/Python |
| [langchain](https://github.com/langchain-ai/langchain) | LLM application framework | 85k+ | Python |
| [llama-index](https://github.com/run-llama/llama_index) | Data framework for LLMs | 32k+ | Python |
| [marked](https://github.com/markedjs/marked) | Markdown parser and compiler | 32k+ | JavaScript |

#### NPM Packages
- `marked` - Markdown processing
- `turndown` - HTML to Markdown conversion
- `remark` - Markdown processor
- `langchain` - LLM orchestration
- `openai` - OpenAI API client

#### APIs
- **OpenAI API**: GPT models for content generation
- **Anthropic API**: Claude for article writing
- **Cohere API**: Text generation
- **AI21 API**: Text generation and summarization

---

### SK-008: Search Optimization Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [elasticsearch](https://github.com/elastic/elasticsearch) | Distributed search engine | 68k+ | Java |
| [meilisearch](https://github.com/meilisearch/meilisearch) | Lightning fast search engine | 44k+ | Rust |
| [typesense](https://github.com/typesense/typesense) | Fast, typo-tolerant search | 18k+ | C++ |
| [lunr.js](https://github.com/olivernn/lunr.js) | Client-side search library | 8.8k+ | JavaScript |
| [flexsearch](https://github.com/nextapps-de/flexsearch) | Full-text search library | 12k+ | JavaScript |

#### NPM Packages
- `@elastic/elasticsearch` - Elasticsearch client
- `meilisearch` - MeiliSearch client
- `typesense` - Typesense client
- `lunr` - Client-side full-text search
- `flexsearch` - Fast full-text search

#### APIs
- **Algolia**: Search-as-a-service
- **Elastic Cloud**: Managed Elasticsearch
- **Azure Cognitive Search**: AI-powered search

---

### SK-009: Journey Visualization Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [mermaid](https://github.com/mermaid-js/mermaid) | Diagram generation from text | 67k+ | JavaScript |
| [d3](https://github.com/d3/d3) | Data visualization library | 107k+ | JavaScript |
| [chart.js](https://github.com/chartjs/Chart.js) | Simple HTML5 charts | 63k+ | JavaScript |
| [plotly.js](https://github.com/plotly/plotly.js) | Interactive charting library | 16k+ | JavaScript |
| [cytoscape.js](https://github.com/cytoscape/cytoscape.js) | Graph theory visualization | 9.7k+ | JavaScript |

#### NPM Packages
- `mermaid` - Diagram generation
- `d3` - Data visualization
- `chart.js` - Chart library
- `cytoscape` - Graph visualization
- `svg.js` - SVG manipulation

#### Reference Resources
- [Journey Mapping Tools Comparison](https://www.nngroup.com/articles/customer-journey-mapping/)
- [Service Blueprint Templates](https://www.nngroup.com/articles/service-blueprints-definition/)

---

### SK-010: CRM Integration Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [jsforce](https://github.com/jsforce/jsforce) | Salesforce API library for JavaScript | 2.2k+ | JavaScript |
| [hubspot-api-nodejs](https://github.com/HubSpot/hubspot-api-nodejs) | HubSpot API client | 200+ | TypeScript |
| [simple-salesforce](https://github.com/simple-salesforce/simple-salesforce) | Python client for Salesforce | 1.5k+ | Python |

#### NPM Packages
- `jsforce` - Salesforce API client
- `@hubspot/api-client` - HubSpot API client
- `dynamics-web-api` - Dynamics 365 client
- `pipedrive` - Pipedrive API client

#### Official APIs
- **Salesforce REST API**: CRM operations
- **HubSpot API**: Marketing and CRM
- **Microsoft Dynamics 365 API**: Enterprise CRM
- **Zoho CRM API**: CRM platform
- **Pipedrive API**: Sales CRM

---

### SK-011: Support Platform Integration Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [node-zendesk](https://github.com/blakmatrix/node-zendesk) | Zendesk API wrapper | 200+ | JavaScript |
| [freshdesk-api](https://github.com/topics/freshdesk-api) | Freshdesk integrations | Various | Various |
| [servicenow-sdk](https://github.com/topics/servicenow) | ServiceNow integrations | Various | Various |

#### NPM Packages
- `node-zendesk` - Zendesk API client
- `freshdesk-api` - Freshdesk client
- `@servicenow/sdk` - ServiceNow SDK
- `intercom-client` - Intercom API client
- `helpscout` - Help Scout client

#### Official APIs
- **Zendesk API**: Support ticketing
- **Freshdesk API**: Helpdesk platform
- **ServiceNow API**: ITSM platform
- **Intercom API**: Customer messaging
- **Front API**: Shared inbox

---

### SK-012: Customer Communication Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [nodemailer](https://github.com/nodemailer/nodemailer) | Email sending for Node.js | 16k+ | JavaScript |
| [mjml](https://github.com/mjmlio/mjml) | Email framework | 16k+ | JavaScript |
| [react-email](https://github.com/resend/react-email) | React components for emails | 12k+ | TypeScript |
| [twilio-node](https://github.com/twilio/twilio-node) | Twilio SDK for Node.js | 1.3k+ | TypeScript |

#### NPM Packages
- `nodemailer` - Email sending
- `mjml` - Email templating
- `twilio` - SMS and voice
- `sendgrid/mail` - SendGrid email
- `postmark` - Transactional email

#### APIs
- **SendGrid API**: Email delivery
- **Twilio API**: SMS and voice
- **Mailchimp API**: Email marketing
- **Customer.io API**: Messaging automation

---

### SK-013: Onboarding Progress Tracker Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [mixpanel-node](https://github.com/mixpanel/mixpanel-node) | Mixpanel tracking for Node.js | 200+ | JavaScript |
| [analytics-node](https://github.com/segmentio/analytics-node) | Segment analytics client | 500+ | JavaScript |
| [amplitude-js](https://github.com/amplitude/Amplitude-JavaScript) | Amplitude SDK | 300+ | JavaScript |

#### NPM Packages
- `mixpanel` - Product analytics
- `@segment/analytics-node` - Segment client
- `@amplitude/analytics-node` - Amplitude SDK
- `posthog-node` - PostHog analytics

#### APIs
- **Mixpanel API**: Product analytics
- **Amplitude API**: Behavioral analytics
- **Segment API**: Customer data platform
- **PostHog API**: Product analytics

---

### SK-014: Escalation Workflow Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [pagerduty-client](https://github.com/topics/pagerduty) | PagerDuty integrations | Various | Various |
| [opsgenie-sdk](https://github.com/topics/opsgenie) | OpsGenie integrations | Various | Various |
| [node-schedule](https://github.com/node-schedule/node-schedule) | Job scheduling for Node.js | 9k+ | JavaScript |

#### NPM Packages
- `@pagerduty/pdjs` - PagerDuty client
- `opsgenie-sdk` - OpsGenie SDK
- `node-schedule` - Task scheduling
- `agenda` - Job scheduling

#### APIs
- **PagerDuty API**: Incident management
- **OpsGenie API**: Alert management
- **VictorOps API**: On-call scheduling

---

### SK-015: Root Cause Analysis Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [mermaid](https://github.com/mermaid-js/mermaid) | Fishbone diagram generation | 67k+ | JavaScript |
| [graphviz](https://github.com/graphp/graphviz) | Graph visualization | Various | Various |
| [fault-tree-analysis](https://github.com/topics/fault-tree-analysis) | FTA implementations | Various | Various |

#### NPM Packages
- `mermaid` - Diagram generation
- `graphviz` - Graph layouts
- `viz.js` - Graphviz in browser
- `dagre` - Directed graph layout

#### Reference Resources
- [5 Whys Template](https://www.mindtools.com/pages/article/newTMC_5W.htm)
- [Fishbone Diagram Guide](https://asq.org/quality-resources/fishbone)
- [ITIL Problem Management](https://wiki.en.it-processmaps.com/index.php/Problem_Management)

---

### SK-016: Survey Design Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [surveyjs](https://github.com/surveyjs/survey-library) | Survey/form library | 4k+ | TypeScript |
| [formio](https://github.com/formio/formio.js) | Form and survey builder | 1.8k+ | JavaScript |
| [typeform-embed](https://github.com/Typeform/embed) | Typeform embed SDK | 200+ | TypeScript |

#### NPM Packages
- `survey-library` - Survey.js library
- `formiojs` - Form.io SDK
- `@typeform/embed` - Typeform embedding
- `survicate` - Survey tool

#### APIs
- **SurveyMonkey API**: Survey platform
- **Typeform API**: Conversational forms
- **Qualtrics API**: Research surveys
- **Delighted API**: NPS surveys

---

### SK-017: Deflection Rate Calculator Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [analytics.js](https://github.com/segmentio/analytics.js) | Analytics tracking | 4.8k+ | JavaScript |
| [matomo](https://github.com/matomo-org/matomo) | Web analytics platform | 19k+ | PHP |
| [plausible](https://github.com/plausible/analytics) | Privacy-focused analytics | 18k+ | Elixir |

#### NPM Packages
- `@segment/analytics-node` - Event tracking
- `simple-statistics` - Statistical calculations
- `mathjs` - Mathematical operations

#### Reference Resources
- [Deflection Rate Calculation](https://www.zendesk.com/blog/customer-service-metrics/)
- [Self-Service Success Metrics](https://www.gartner.com/smarterwithgartner/how-to-measure-self-service-success)

---

### SK-018: QBR Presentation Generator Skill

#### GitHub Repositories
| Repository | Description | Stars | Language |
|-----------|-------------|-------|----------|
| [pptxgenjs](https://github.com/gitbrent/PptxGenJS) | PowerPoint generation | 2.3k+ | TypeScript |
| [docxtemplater](https://github.com/open-xml-templating/docxtemplater) | Document templating | 2.8k+ | JavaScript |
| [reveal.js](https://github.com/hakimel/reveal.js) | HTML presentations | 67k+ | JavaScript |
| [slidev](https://github.com/slidevjs/slidev) | Presentation slides for devs | 31k+ | TypeScript |

#### NPM Packages
- `pptxgenjs` - PowerPoint generation
- `docxtemplater` - Document generation
- `officegen` - Office document creation
- `reveal.js` - HTML presentations
- `pdf-lib` - PDF creation

---

## Agents References

### AG-001: Customer Success Manager Agent

#### Reference Resources
- [Gainsight Customer Success Framework](https://www.gainsight.com/resources/)
- [SuccessHACKER Resources](https://www.successhacker.co/)
- [Customer Success Association](https://www.customersuccessassociation.com/)
- [Lincoln Murphy Resources](https://sixteenventures.com/)

#### Certification Programs
- Gainsight Level 1-3 Certifications
- SuccessHACKER CS Certifications
- Customer Success Manager Certification (CSMC)

---

### AG-002: Voice of Customer Analyst Agent

#### Reference Resources
- [Qualtrics XM Institute](https://www.qualtrics.com/xm-institute/)
- [CustomerThink](https://customerthink.com/)
- [Voice of Customer Best Practices](https://www.medallia.com/resource-library/)

#### Tools Reference
- Qualtrics, Medallia, InMoment platforms
- Survey design methodologies
- Text analytics frameworks

---

### AG-003: Support Operations Manager Agent

#### Reference Resources
- [HDI (Help Desk Institute)](https://www.thinkhdi.com/)
- [ICMI (International Customer Management Institute)](https://www.icmi.com/)
- [Support Driven Community](https://supportdriven.com/)

#### Certification Programs
- HDI Support Center Manager
- ICMI Contact Center Management
- COPC Customer Experience Standard

---

### AG-004: Knowledge Management Expert Agent

#### Reference Resources
- [KCS Academy](https://www.serviceinnovation.org/kcs/)
- [APQC Knowledge Management](https://www.apqc.org/expertise/knowledge-management)
- [Knowledge Management Institute](https://www.kminstitute.org/)

#### Certification Programs
- KCS v6 Practices Certification
- KCS Coaching Certification
- APQC KM Certification

---

### AG-005: ITIL Service Manager Agent

#### Reference Resources
- [AXELOS ITIL Resources](https://www.axelos.com/best-practice-solutions/itil)
- [ITSMDaily](https://itsm.tools/)
- [ITSM Academy](https://www.itsmacademy.com/)

#### Certification Programs
- ITIL 4 Foundation
- ITIL 4 Managing Professional
- ITIL 4 Strategic Leader

---

### AG-006: Customer Journey Architect Agent

#### Reference Resources
- [Nielsen Norman Group](https://www.nngroup.com/)
- [Service Design Network](https://www.service-design-network.org/)
- [Adaptive Path](https://www.adaptivepath.org/)

#### Methodologies
- Jobs to Be Done (JTBD)
- Service Blueprinting
- Experience Mapping

---

### AG-007 through AG-014

See the respective skill references above for tooling. Agent expertise is built on:
- Industry certifications
- Best practice frameworks
- Domain-specific methodologies
- Platform expertise

---

## MCP Server References

### Customer Data and Analytics MCP Servers

| MCP Server | Purpose | Repository/Source |
|-----------|---------|-------------------|
| `@anthropic/mcp-server-memory` | Conversation memory for customer context | [Anthropic MCP](https://github.com/anthropics/mcp) |
| `mcp-server-sqlite` | Local database for customer data | [MCP Servers](https://github.com/modelcontextprotocol/servers) |
| `mcp-server-postgres` | PostgreSQL for customer analytics | [MCP Servers](https://github.com/modelcontextprotocol/servers) |

### Communication and Notification MCP Servers

| MCP Server | Purpose | Repository/Source |
|-----------|---------|-------------------|
| `mcp-server-slack` | Slack integration for support | [MCP Servers](https://github.com/modelcontextprotocol/servers) |
| `mcp-server-github` | GitHub for documentation | [MCP Servers](https://github.com/modelcontextprotocol/servers) |
| `mcp-server-google-drive` | Document storage/retrieval | Community |

### Potential Custom MCP Servers to Build

| MCP Server Concept | Purpose | Priority |
|-------------------|---------|----------|
| `mcp-server-salesforce` | Salesforce CRM integration | High |
| `mcp-server-zendesk` | Zendesk ticket management | High |
| `mcp-server-hubspot` | HubSpot CRM operations | High |
| `mcp-server-gainsight` | Customer success platform | Medium |
| `mcp-server-intercom` | Customer messaging | Medium |
| `mcp-server-freshdesk` | Helpdesk operations | Medium |
| `mcp-server-servicenow` | ITSM operations | Medium |
| `mcp-server-surveymonkey` | Survey management | Low |
| `mcp-server-typeform` | Form/survey handling | Low |

---

## Platform Integration References

### CRM Platforms

| Platform | API Documentation | SDK |
|----------|------------------|-----|
| Salesforce | [REST API](https://developer.salesforce.com/docs/apis) | jsforce, simple-salesforce |
| HubSpot | [API Docs](https://developers.hubspot.com/docs/api/overview) | @hubspot/api-client |
| Microsoft Dynamics | [Web API](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/webapi/) | dynamics-web-api |
| Zoho CRM | [API Docs](https://www.zoho.com/crm/developer/docs/api/v2/) | zcrmsdk |

### Support Platforms

| Platform | API Documentation | SDK |
|----------|------------------|-----|
| Zendesk | [API Reference](https://developer.zendesk.com/api-reference/) | node-zendesk |
| Freshdesk | [API Docs](https://developers.freshdesk.com/api/) | freshdesk-api |
| ServiceNow | [REST API](https://developer.servicenow.com/dev.do#!/reference/api/) | @servicenow/sdk |
| Intercom | [API Reference](https://developers.intercom.com/docs/references/rest-api/) | intercom-client |
| Front | [API Docs](https://dev.frontapp.com/reference/introduction) | @frontapp/plugin-sdk |

### Customer Success Platforms

| Platform | API Documentation | SDK |
|----------|------------------|-----|
| Gainsight | [API Docs](https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs) | REST API |
| Totango | [API Reference](https://support.totango.com/hc/en-us/articles/360032029571-API-Documentation) | REST API |
| ChurnZero | [API Docs](https://churnzero.readme.io/) | REST API |
| Vitally | [API Reference](https://docs.vitally.io/api-reference/) | REST API |

### Survey Platforms

| Platform | API Documentation | SDK |
|----------|------------------|-----|
| SurveyMonkey | [API Docs](https://developer.surveymonkey.com/api/v3/) | REST API |
| Qualtrics | [API Reference](https://api.qualtrics.com/) | REST API |
| Typeform | [API Docs](https://developer.typeform.com/) | @typeform/embed |
| Delighted | [API Reference](https://delighted.com/docs/api) | delighted |

### Analytics Platforms

| Platform | API Documentation | SDK |
|----------|------------------|-----|
| Mixpanel | [API Reference](https://developer.mixpanel.com/) | mixpanel |
| Amplitude | [API Docs](https://www.docs.developers.amplitude.com/) | @amplitude/analytics-node |
| Segment | [API Reference](https://segment.com/docs/connections/sources/catalog/libraries/server/node/) | @segment/analytics-node |
| PostHog | [API Docs](https://posthog.com/docs/api) | posthog-node |

---

## Community Resources

### Forums and Communities

| Community | Focus | URL |
|-----------|-------|-----|
| Support Driven | Support professionals | [supportdriven.com](https://supportdriven.com) |
| Gain Grow Retain | Customer Success | [gaingrowretain.com](https://gaingrowretain.com) |
| Success Hacker | CS resources | [successhacker.co](https://www.successhacker.co) |
| CX Network | CX professionals | [cxnetwork.com](https://www.cxnetwork.com) |
| HDI Community | IT service management | [thinkhdi.com](https://www.thinkhdi.com) |
| r/CustomerSuccess | Reddit community | [reddit.com/r/CustomerSuccess](https://www.reddit.com/r/CustomerSuccess) |

### Publications and Blogs

| Publication | Focus | URL |
|-------------|-------|-----|
| CustomerThink | CX strategy | [customerthink.com](https://customerthink.com) |
| CX Journey | Journey mapping | [cx-journey.com](https://www.cx-journey.com) |
| Totango Blog | Customer Success | [totango.com/blog](https://www.totango.com/blog) |
| Zendesk Blog | Support best practices | [zendesk.com/blog](https://www.zendesk.com/blog) |
| Gainsight Blog | CS strategies | [gainsight.com/blog](https://www.gainsight.com/blog) |

### Podcasts

| Podcast | Focus |
|---------|-------|
| The CX Cast | Customer experience |
| Gain Grow Retain | Customer success |
| Support Ops | Support operations |
| The CX Leader | CX leadership |
| Customer Success Leader | CS strategies |

---

## Standards and Frameworks

### Industry Standards

| Standard | Organization | Focus |
|----------|--------------|-------|
| ITIL 4 | AXELOS | IT service management |
| COPC | COPC Inc. | Contact center excellence |
| ISO 10002 | ISO | Customer satisfaction |
| KCS v6 | Consortium for Service Innovation | Knowledge management |
| NPS | Bain & Company | Customer loyalty |

### Methodology Frameworks

| Framework | Focus | Reference |
|-----------|-------|-----------|
| Jobs to Be Done | Customer needs | [JTBD Framework](https://strategyn.com/customer-centered-innovation-map/) |
| Service Blueprint | Service design | [NNG Blueprint](https://www.nngroup.com/articles/service-blueprints-definition/) |
| Customer Journey Mapping | Experience design | [NNG Mapping](https://www.nngroup.com/articles/customer-journey-mapping/) |
| CES | Effort scoring | [Gartner CES](https://www.gartner.com/en/sales/insights/customer-effort-score) |
| Health Score | Success metrics | [Gainsight Framework](https://www.gainsight.com/guides/customer-health-score/) |

### Compliance and Privacy

| Regulation | Region | Focus |
|------------|--------|-------|
| GDPR | EU | Data protection |
| CCPA | California | Consumer privacy |
| SOC 2 | Global | Security controls |
| HIPAA | US Healthcare | Health data privacy |

---

## Summary

This reference document provides comprehensive resources for implementing the 18 skills and 14 agents identified in the Customer Experience backlog. Key highlights:

| Category | Count |
|----------|-------|
| GitHub Repositories Referenced | 50+ |
| NPM Packages Listed | 80+ |
| Platform APIs Documented | 25+ |
| MCP Servers (Existing) | 5+ |
| MCP Servers (To Build) | 9 |
| Community Resources | 15+ |
| Industry Standards | 5 |
| Methodology Frameworks | 5 |

### Priority Implementation Recommendations

1. **Immediate**: Leverage existing MCP servers for data storage and communication
2. **Short-term**: Build Salesforce and Zendesk MCP servers for CRM/support integration
3. **Medium-term**: Implement sentiment analysis using existing NPM packages
4. **Long-term**: Develop custom MCP servers for customer success platforms

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Implement priority skills and agents
