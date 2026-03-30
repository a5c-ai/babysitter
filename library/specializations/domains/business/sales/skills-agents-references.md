# Sales Specialization - Skills & Agents References

This document provides references to GitHub repositories, MCP servers, community resources, and implementation guides for the skills and agents defined in the Sales backlog.

---

## Table of Contents

1. [CRM Integration References](#crm-integration-references)
2. [Lead Intelligence & Enrichment References](#lead-intelligence--enrichment-references)
3. [Sales Analytics & Forecasting References](#sales-analytics--forecasting-references)
4. [Sales Engagement References](#sales-engagement-references)
5. [Document & Proposal References](#document--proposal-references)
6. [Competitive Intelligence References](#competitive-intelligence-references)
7. [Customer Success References](#customer-success-references)
8. [Territory & Quota Planning References](#territory--quota-planning-references)
9. [Learning & Enablement References](#learning--enablement-references)
10. [Data Quality & Enrichment References](#data-quality--enrichment-references)
11. [Agent Implementation References](#agent-implementation-references)
12. [MCP Server References](#mcp-server-references)
13. [Community Resources](#community-resources)

---

## CRM Integration References

### Salesforce Connector

#### Official Resources
- **Salesforce REST API Documentation**: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/
- **Salesforce Bulk API 2.0**: https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/
- **Salesforce Streaming API**: https://developer.salesforce.com/docs/atlas.en-us.api_streaming.meta/api_streaming/

#### GitHub Repositories
- **jsforce** - Salesforce API Library for JavaScript
  - Repository: https://github.com/jsforce/jsforce
  - npm: `npm install jsforce`
  - Features: SOQL, CRUD, Bulk API, Streaming API support

- **simple-salesforce** - Python library for Salesforce
  - Repository: https://github.com/simple-salesforce/simple-salesforce
  - pip: `pip install simple-salesforce`
  - Features: REST API, Bulk API, Metadata API

- **salesforce-cli** - Official Salesforce CLI
  - Repository: https://github.com/salesforcecli/cli
  - Features: Deployment, data operations, org management

#### MCP Server Implementations
- **mcp-salesforce** - MCP server for Salesforce integration
  - Repository: https://github.com/modelcontextprotocol/servers/tree/main/src/salesforce
  - Capabilities: SOQL queries, object CRUD, bulk operations

- **salesforce-mcp-server** - Community Salesforce MCP
  - Repository: https://github.com/anthropics/anthropic-cookbook/tree/main/mcp/salesforce

### HubSpot Connector

#### Official Resources
- **HubSpot API Documentation**: https://developers.hubspot.com/docs/api/overview
- **HubSpot Developer Portal**: https://developers.hubspot.com/

#### GitHub Repositories
- **hubspot-api-nodejs** - Official HubSpot Node.js SDK
  - Repository: https://github.com/HubSpot/hubspot-api-nodejs
  - npm: `npm install @hubspot/api-client`

- **hubspot-api-python** - Official HubSpot Python SDK
  - Repository: https://github.com/HubSpot/hubspot-api-python
  - pip: `pip install hubspot-api-client`

#### MCP Server Implementations
- **mcp-hubspot** - MCP server for HubSpot
  - Repository: https://github.com/modelcontextprotocol/servers/tree/main/src/hubspot
  - Capabilities: Contacts, deals, companies, marketing automation

### Dynamics 365 Connector

#### Official Resources
- **Dynamics 365 Web API**: https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/use-microsoft-dynamics-365-web-api
- **Power Platform Connectors**: https://docs.microsoft.com/en-us/connectors/dynamicscrmonline/

#### GitHub Repositories
- **dynamics-web-api** - Dynamics 365 Web API for Node.js
  - Repository: https://github.com/AlikhanAitkulov/DynamicsWebApi
  - npm: `npm install dynamics-web-api`

- **Microsoft.PowerPlatform.Dataverse.Client** - .NET SDK
  - Repository: https://github.com/microsoft/PowerPlatform-DataverseServiceClient
  - NuGet: `Microsoft.PowerPlatform.Dataverse.Client`

### Pipedrive Connector

#### Official Resources
- **Pipedrive API Reference**: https://developers.pipedrive.com/docs/api/v1

#### GitHub Repositories
- **pipedrive** - Node.js client for Pipedrive API
  - Repository: https://github.com/pipedrive/client-nodejs
  - npm: `npm install pipedrive`

---

## Lead Intelligence & Enrichment References

### Clearbit Enrichment

#### Official Resources
- **Clearbit API Documentation**: https://clearbit.com/docs

#### GitHub Repositories
- **clearbit-node** - Official Clearbit Node.js client
  - Repository: https://github.com/clearbit/clearbit-node
  - npm: `npm install clearbit`

- **clearbit-python** - Official Clearbit Python client
  - Repository: https://github.com/clearbit/clearbit-python
  - pip: `pip install clearbit`

### ZoomInfo Enrichment

#### Official Resources
- **ZoomInfo API Documentation**: https://developers.zoominfo.com/

#### GitHub Repositories
- Community implementations available for various languages
- Reference: ZoomInfo Developer Portal for SDK downloads

### Apollo.io Prospecting

#### Official Resources
- **Apollo API Documentation**: https://apolloio.github.io/apollo-api-docs/

#### GitHub Repositories
- **apollo-io-api** - Unofficial Apollo.io API wrapper
  - Various community implementations on GitHub
  - Search: `apollo.io api client`

### 6sense Intent Data

#### Official Resources
- **6sense API Documentation**: https://developers.6sense.com/

#### Implementation Notes
- Primarily accessed via REST API
- Webhook integration for real-time signals

---

## Sales Analytics & Forecasting References

### Clari Forecasting

#### Official Resources
- **Clari API Documentation**: Contact Clari for API access
- **Clari Developer Portal**: https://www.clari.com/developers/

#### Integration Patterns
- REST API for forecast data retrieval
- Webhook events for deal activity

### Gong Conversation Intelligence

#### Official Resources
- **Gong API Documentation**: https://help.gong.io/hc/en-us/articles/360042498011-Gong-API

#### GitHub Repositories
- **gong-api-client** - Community implementations
  - Search GitHub for: `gong.io api client`

#### MCP Server Implementations
- **mcp-gong** - MCP server for Gong.io
  - Reference: Community MCP implementations
  - Capabilities: Call transcripts, deal signals, analytics

### Chorus Analytics (ZoomInfo)

#### Official Resources
- **Chorus API**: Part of ZoomInfo platform
- Documentation: https://developers.zoominfo.com/chorus

### Tableau Analytics

#### Official Resources
- **Tableau REST API**: https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api.htm
- **Tableau Hyper API**: https://help.tableau.com/current/api/hyper_api/en-us/index.html

#### GitHub Repositories
- **tableau-api-lib** - Python wrapper for Tableau REST API
  - Repository: https://github.com/divinorum-webb/tableau-api-lib
  - pip: `pip install tableau-api-lib`

- **TabPy** - Execute Python code in Tableau
  - Repository: https://github.com/tableau/TabPy

---

## Sales Engagement References

### Outreach.io Sequences

#### Official Resources
- **Outreach API Documentation**: https://api.outreach.io/api/v2/docs

#### GitHub Repositories
- **outreach-api** - Community API wrappers
  - Reference: Outreach Developer Portal

### SalesLoft Cadences

#### Official Resources
- **SalesLoft API Documentation**: https://developers.salesloft.com/

#### GitHub Repositories
- **salesloft-api-client** - Various community implementations
  - Search: `salesloft api client`

### Calendly Scheduling

#### Official Resources
- **Calendly API Documentation**: https://developer.calendly.com/

#### GitHub Repositories
- **calendly-api-python** - Python client
  - Various community implementations

#### MCP Server Implementations
- **mcp-calendly** - Calendar scheduling MCP
  - Capabilities: Event types, scheduling, availability

---

## Document & Proposal References

### PandaDoc Proposals

#### Official Resources
- **PandaDoc API Documentation**: https://developers.pandadoc.com/

#### GitHub Repositories
- **pandadoc-api** - Official SDKs
  - Repository: https://github.com/PandaDoc
  - Multiple language support: Node.js, Python, Ruby

### DocuSign Contracts

#### Official Resources
- **DocuSign eSignature API**: https://developers.docusign.com/docs/esign-rest-api/

#### GitHub Repositories
- **docusign-esign-node-client** - Official Node.js SDK
  - Repository: https://github.com/docusign/docusign-esign-node-client
  - npm: `npm install docusign-esign`

- **docusign-esign-python-client** - Official Python SDK
  - Repository: https://github.com/docusign/docusign-esign-python-client
  - pip: `pip install docusign-esign`

#### MCP Server Implementations
- **mcp-docusign** - Document signing MCP
  - Capabilities: Envelope creation, signature tracking, template management

### Conga CPQ

#### Official Resources
- **Conga Developer Center**: https://developer.conga.com/

#### Implementation Notes
- Primarily Salesforce-native, accessed via Apex/SOQL
- REST API available for external integration

---

## Competitive Intelligence References

### Crayon Competitive

#### Official Resources
- **Crayon API**: Contact Crayon for API documentation
- **Platform**: https://www.crayon.co/

#### Integration Patterns
- REST API for intel retrieval
- Webhook notifications for updates

### Klue Battlecards

#### Official Resources
- **Klue Platform**: https://klue.com/
- API access via enterprise agreement

#### Implementation Notes
- Battlecard API for content retrieval
- Integration with Salesforce, Slack

---

## Customer Success References

### Gainsight CS

#### Official Resources
- **Gainsight API Documentation**: https://support.gainsight.com/SFDC_Edition/API_for_Gainsight_NXT

#### GitHub Repositories
- Community implementations for Gainsight integration
- Primarily REST API based

### Totango Health

#### Official Resources
- **Totango API Documentation**: https://support.totango.com/hc/en-us/articles/360000227826-Totango-API

### ChurnZero Signals

#### Official Resources
- **ChurnZero API**: https://app.churnzero.net/api

---

## Territory & Quota Planning References

### Xactly Compensation

#### Official Resources
- **Xactly Developer Portal**: https://www.xactlycorp.com/
- API documentation via enterprise agreement

### Anaplan Planning

#### Official Resources
- **Anaplan API Documentation**: https://help.anaplan.com/api-guide-f2c38bdf-dccb-4d2a-88b3-5ed7bccd8ae2

#### GitHub Repositories
- **anaplan-api** - Community implementations
  - Reference: Anaplan Community

### Varicent ICM

#### Official Resources
- **Varicent Developer Resources**: https://www.varicent.com/
- REST API documentation via agreement

---

## Learning & Enablement References

### Seismic Enablement

#### Official Resources
- **Seismic API**: https://developer.seismic.com/

#### Integration Patterns
- Content API for search/delivery
- Analytics API for engagement data

### Highspot Content

#### Official Resources
- **Highspot API Documentation**: https://developer.highspot.com/

### Lessonly Training (Seismic Learning)

#### Official Resources
- **Lessonly API**: https://www.lessonly.com/api-docs/

### Mindtickle Readiness

#### Official Resources
- **Mindtickle Developer Portal**: https://www.mindtickle.com/

---

## Data Quality & Enrichment References

### Dun & Bradstreet Data

#### Official Resources
- **D&B Direct+ API**: https://developer.dnb.com/

#### GitHub Repositories
- Reference implementations available on D&B Developer Portal

### RingLead DeDup

#### Official Resources
- **RingLead (ZoomInfo)**: https://ringlead.com/
- Primarily Salesforce-native with API access

---

## Agent Implementation References

### Sales Methodology Agent Frameworks

#### LangChain Agent Patterns
- **Repository**: https://github.com/langchain-ai/langchain
- **Sales Agent Examples**: https://github.com/langchain-ai/langchain/tree/master/cookbook
- **Relevant Patterns**:
  - ReAct agent for methodology coaching
  - Tool-calling agents for CRM integration
  - Memory patterns for conversation context

#### CrewAI Multi-Agent Framework
- **Repository**: https://github.com/joaomdmoura/crewAI
- **Use Cases**:
  - Sales team simulation
  - Multi-role qualification workflows
  - Collaborative deal analysis

#### AutoGen Sales Agents
- **Repository**: https://github.com/microsoft/autogen
- **Relevant Examples**:
  - Conversational agents for sales coaching
  - Multi-agent deal review

### Agent Building Blocks

#### SPIN/MEDDPICC/Challenger Frameworks
- **Sales Methodology Libraries**:
  - Community prompts and templates on GitHub
  - Search: `sales methodology prompts langchain`

- **Qualification Scoring Models**:
  - Reference: https://github.com/topics/sales-scoring

#### Value Engineering Calculators
- **ROI Calculator Templates**:
  - Various open-source implementations
  - Search: `roi calculator javascript`

- **TCO Models**:
  - Reference: Cloud provider TCO tools as patterns

---

## MCP Server References

### Official MCP Server Repository
- **Main Repository**: https://github.com/modelcontextprotocol/servers
- **Server Specification**: https://modelcontextprotocol.io/

### Sales-Relevant MCP Servers

#### CRM Servers
| Server | Repository | Capabilities |
|--------|------------|--------------|
| mcp-salesforce | modelcontextprotocol/servers | SOQL, CRUD, Bulk API |
| mcp-hubspot | Community | Contacts, Deals, Marketing |
| mcp-pipedrive | Community | Deals, Activities |

#### Communication Servers
| Server | Repository | Capabilities |
|--------|------------|--------------|
| mcp-slack | modelcontextprotocol/servers | Messaging, Notifications |
| mcp-email | Community | Email composition, tracking |
| mcp-calendar | Community | Scheduling, availability |

#### Analytics Servers
| Server | Repository | Capabilities |
|--------|------------|--------------|
| mcp-tableau | Community | Dashboard queries |
| mcp-bigquery | Community | Analytics queries |
| mcp-postgres | modelcontextprotocol/servers | Database operations |

#### Document Servers
| Server | Repository | Capabilities |
|--------|------------|--------------|
| mcp-gdrive | modelcontextprotocol/servers | Document access |
| mcp-notion | modelcontextprotocol/servers | Knowledge base |
| mcp-confluence | Community | Documentation |

### Building Custom MCP Servers
- **MCP SDK (Python)**: https://github.com/modelcontextprotocol/python-sdk
- **MCP SDK (TypeScript)**: https://github.com/modelcontextprotocol/typescript-sdk
- **Template Server**: https://github.com/modelcontextprotocol/server-template

---

## Community Resources

### Sales Operations Communities
- **RevOps Co-op**: https://revopsco-op.com/
- **Modern Sales Pros**: https://modernsalespros.com/
- **Sales Hacker Community**: https://www.saleshacker.com/

### Developer Communities
- **Salesforce Developer Community**: https://developer.salesforce.com/community
- **HubSpot Developer Community**: https://community.hubspot.com/t5/Developer/ct-p/developer
- **MCP Community Discord**: https://discord.gg/modelcontextprotocol

### Open Source Sales Tools
- **Mautic** - Open source marketing automation
  - Repository: https://github.com/mautic/mautic

- **SuiteCRM** - Open source CRM
  - Repository: https://github.com/salesagility/SuiteCRM

- **Odoo CRM** - Open source ERP with CRM
  - Repository: https://github.com/odoo/odoo

### AI/ML Sales Tools
- **Lead Scoring Models**:
  - Search GitHub: `lead scoring machine learning`
  - Reference: scikit-learn pipelines for scoring

- **Churn Prediction**:
  - Repository: https://github.com/topics/churn-prediction
  - Reference implementations with XGBoost, LSTM

- **Sales Forecasting**:
  - Prophet for time series: https://github.com/facebook/prophet
  - Neural forecasting: https://github.com/Nixtla/neuralforecast

### Tutorials & Learning Resources
- **Salesforce Trailhead**: https://trailhead.salesforce.com/
- **HubSpot Academy**: https://academy.hubspot.com/
- **LangChain Cookbook**: https://github.com/langchain-ai/langchain/tree/master/cookbook

---

## Implementation Notes

### Authentication Patterns
Most sales platform integrations require OAuth 2.0:
1. **Salesforce**: OAuth 2.0 JWT Bearer flow recommended
2. **HubSpot**: OAuth 2.0 or API Key (Private App Token)
3. **Dynamics 365**: Azure AD OAuth 2.0
4. **Document Platforms**: OAuth 2.0 standard flow

### Rate Limiting Considerations
| Platform | Limits | Strategy |
|----------|--------|----------|
| Salesforce | 15,000 API calls/day (Enterprise) | Bulk API for batch operations |
| HubSpot | 100 calls/10 sec (Standard) | Rate limiting middleware |
| Gong | Varies by plan | Caching, webhook preference |
| Outreach | 10,000/min | Queue management |

### Data Synchronization Patterns
1. **Real-time**: Webhooks for critical updates (deal stage changes)
2. **Near-real-time**: Polling with change tracking (5-15 min intervals)
3. **Batch**: Bulk API for large data operations (overnight syncs)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial references document |

---

## Contributing

To suggest additional references:
1. Verify the resource is actively maintained
2. Confirm API availability and documentation quality
3. Test basic integration functionality
4. Submit with usage examples where possible
