# Arts and Culture - Skills and Agents References

## Phase 5: External Resources and Cross-Specialization References

This document provides external resources, tools, and cross-specialization references to support the implementation of Arts and Culture skills and agents.

---

## GitHub Repositories

### Collection Management and Documentation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [CollectiveAccess/providence](https://github.com/CollectiveAccess/providence) | Open-source collections management and cataloging system for museums and archives | SK-AC-003 (collection-documentation) |
| [CollectiveAccess/pawtucket2](https://github.com/CollectiveAccess/pawtucket2) | Public access front-end for CollectiveAccess collections | SK-AC-003, SK-AC-014 (digital-engagement-strategy) |
| [archivesspace/archivesspace](https://github.com/archivesspace/archivesspace) | Archives information management application for managing collections | SK-AC-003 (collection-documentation) |
| [samvera](https://github.com/samvera) | Digital repository solutions for cultural heritage institutions | SK-AC-003, SK-AC-014 |
| [Omeka/Omeka](https://github.com/omeka/Omeka) | Web publishing platform for cultural heritage collections | SK-AC-003, SK-AC-014 |

### Exhibition and Design

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [exhibit3d/exhibit3d](https://github.com/exhibit3d/exhibit3d) | Virtual 3D exhibition spaces | SK-AC-004 (exhibition-design), SK-AC-014 |
| [openseadragon/openseadragon](https://github.com/openseadragon/openseadragon) | High-resolution zoomable image viewer for artworks | SK-AC-004, SK-AC-014 |
| [IIIF/awesome-iiif](https://github.com/IIIF/awesome-iiif) | International Image Interoperability Framework resources | SK-AC-003, SK-AC-004 |
| [projectmirador/mirador](https://github.com/ProjectMirador/mirador) | IIIF image viewer for art and cultural objects | SK-AC-004, SK-AC-014 |

### Conservation and Preservation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [LibraryOfCongress/bagit-python](https://github.com/LibraryOfCongress/bagit-python) | BagIt specification for digital preservation | SK-AC-006 (conservation-assessment), SK-AC-011 |
| [Archivematica/archivematica](https://github.com/artefactual/archivematica) | Digital preservation system | SK-AC-006, SK-AC-011 (risk-mitigation-planning) |
| [digitalpowrr/dpowr](https://github.com/digitalpowrr/Digital-POWRR) | Digital preservation tools and resources | SK-AC-006 |

### Grant Writing and Fundraising

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenGrants/awesome-grants](https://github.com/spicysouvlaki/awesome-grants) | Resources for grant writing and funding | SK-AC-002 (grant-proposal-writing) |

### Audience Analytics and Engagement

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [apache/superset](https://github.com/apache/superset) | Data visualization and analytics platform | SK-AC-007 (audience-analytics) |
| [metabase/metabase](https://github.com/metabase/metabase) | Open-source business intelligence tool | SK-AC-007 |
| [matomo-org/matomo](https://github.com/matomo-org/matomo) | Privacy-focused web analytics | SK-AC-007, SK-AC-014 |

### Production and Event Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [freelawproject/courtlistener](https://github.com/freelawproject/courtlistener) | Scheduling and coordination patterns | SK-AC-005 (production-coordination) |

---

## MCP Server References

### Potential MCP Integrations

| MCP Server Type | Description | Applicable Skills |
|-----------------|-------------|-------------------|
| **Document Management MCP** | Integration with museum collection databases and document management systems | SK-AC-003, SK-AC-006 |
| **Calendar/Scheduling MCP** | Production scheduling and event coordination | SK-AC-005 |
| **CRM Integration MCP** | Donor relationship management and stakeholder tracking | SK-AC-009 (donor-relationship-management) |
| **Analytics MCP** | Visitor analytics and engagement metrics aggregation | SK-AC-007 |
| **Image Processing MCP** | High-resolution artwork image processing and condition documentation | SK-AC-006, SK-AC-003 |
| **Notion/Database MCP** | Project planning and curatorial research documentation | SK-AC-001 (curatorial-research) |

### Recommended MCP Implementations

```yaml
# Example MCP configuration for arts administration
mcp_servers:
  - name: collection-database
    type: api
    description: Museum collection management system integration
    endpoints:
      - /objects
      - /exhibitions
      - /loans
      - /conditions

  - name: donor-crm
    type: database
    description: Donor relationship management
    tables:
      - donors
      - gifts
      - pledges
      - interactions

  - name: event-scheduler
    type: calendar
    description: Production and event scheduling
    features:
      - venue_booking
      - artist_scheduling
      - technical_requirements
```

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [American Alliance of Museums (AAM)](https://www.aam-us.org/) | Standards, ethics, best practices, professional development | All curatorial and administrative processes |
| [International Council of Museums (ICOM)](https://icom.museum/) | International standards, museum ethics, definitions | SK-AC-003, SK-AC-006 |
| [American Institute for Conservation (AIC)](https://www.culturalheritage.org/) | Conservation guidelines, ethical standards, treatment protocols | SK-AC-006 (conservation-assessment) |
| [Association of Performing Arts Professionals (APAP)](https://www.apap365.org/) | Performing arts management resources | SK-AC-005 (production-coordination) |
| [Americans for the Arts](https://www.americansforthearts.org/) | Arts advocacy, policy research, cultural impact data | SK-AC-010 (cultural-policy-analysis), SK-AC-015 |
| [Theatre Communications Group (TCG)](https://www.tcg.org/) | Theatre management, governance, finance resources | SK-AC-005, SK-AC-002 |
| [Association of Fundraising Professionals (AFP)](https://afpglobal.org/) | Fundraising ethics, best practices, professional development | SK-AC-002, SK-AC-009 |

### Documentation and Standards

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [Cataloging Cultural Objects (CCO)](https://vraweb.org/resources/cataloging-cultural-objects/) | Standard for describing cultural works | SK-AC-003 |
| [Spectrum 5.0](https://collectionstrust.org.uk/spectrum/) | UK museum collections management standard | SK-AC-003, SK-AC-006 |
| [Dublin Core](https://www.dublincore.org/) | Metadata standard for digital collections | SK-AC-003, SK-AC-014 |
| [Nomenclature 4.0](https://www.nomenclature.info/) | Object naming standard for museums | SK-AC-003 |
| [CIDOC-CRM](https://www.cidoc-crm.org/) | Conceptual reference model for cultural heritage | SK-AC-003, SK-AC-001 |

### Online Learning and Tutorials

| Platform | Content | Relevant Areas |
|----------|---------|----------------|
| [Museum Study](https://www.museumstudy.com/) | Museum professional development courses | Curatorial, registration, conservation |
| [Coursera Museum Studies](https://www.coursera.org/search?query=museum) | University-level museum courses | All areas |
| [Getty Foundation Resources](https://www.getty.edu/foundation/) | Art history research tools, vocabularies | SK-AC-001, SK-AC-003 |
| [Smithsonian Institution Archives](https://siarchives.si.edu/) | Archival best practices and resources | SK-AC-003 |

### Forums and Communities

| Community | Focus | URL |
|-----------|-------|-----|
| Museum-L Listserv | General museum discussions | museum-l@home.ease.lsoft.com |
| MCN (Museum Computer Network) | Museum technology | [mcn.edu](https://mcn.edu/) |
| AAM Community | Professional museum networking | [community.aam-us.org](https://community.aam-us.org/) |
| ARLIS-L | Art libraries | arlis-l@lists.arlisna.org |

---

## API Documentation

### Collection and Research APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Getty Vocabularies API](http://vocab.getty.edu/) | Art & Architecture Thesaurus, ULAN, TGN | SK-AC-001 (curatorial-research), SK-AC-003 |
| [Europeana API](https://pro.europeana.eu/page/apis) | Access to European cultural heritage data | SK-AC-001, SK-AC-014 |
| [DPLA API](https://pro.dp.la/developers/api-codex) | Digital Public Library of America | SK-AC-001, SK-AC-014 |
| [Harvard Art Museums API](https://github.com/harvardartmuseums/api-docs) | Collection data and images | SK-AC-001, SK-AC-003 |
| [Metropolitan Museum API](https://metmuseum.github.io/) | Open access to Met collection | SK-AC-001 |
| [Rijksmuseum API](https://data.rijksmuseum.nl/object-metadata/api/) | Dutch Golden Age collection | SK-AC-001 |
| [Smithsonian Open Access](https://www.si.edu/openaccess) | Smithsonian collections | SK-AC-001, SK-AC-003 |

### Funding and Grant APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Grants.gov API](https://www.grants.gov/web/grants/support/technical-support/grantsxml.html) | Federal grants search and application | SK-AC-002 (grant-proposal-writing) |
| [Foundation Directory Online](https://fconline.foundationcenter.org/) | Foundation and grant research | SK-AC-002 |
| [NEA Grants](https://www.arts.gov/grants) | National Endowment for the Arts funding | SK-AC-002 |

### Analytics and Visitor Data

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Google Analytics API](https://developers.google.com/analytics) | Website visitor analytics | SK-AC-007 (audience-analytics) |
| [Eventbrite API](https://www.eventbrite.com/platform/api) | Event ticketing and attendance | SK-AC-007, SK-AC-005 |
| [Tessitura API](https://www.tessituranetwork.com/) | Arts management CRM (commercial) | SK-AC-007, SK-AC-009 |

### Social and Engagement APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) | Social media engagement | SK-AC-014 (digital-engagement-strategy) |
| [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api) | Social listening and engagement | SK-AC-014 |
| [Mailchimp API](https://mailchimp.com/developer/) | Email marketing and audience management | SK-AC-014, SK-AC-007 |

---

## Applicable Skills from Other Specializations

### From Business Specializations

| Source Specialization | Skill/Process | Application to Arts & Culture |
|----------------------|---------------|------------------------------|
| **Finance & Accounting** | Budget Management, Financial Reporting | SK-AC-002 grant budgeting, organizational finance |
| **Finance & Accounting** | Grant Compliance Reporting | AG-AC-003 grant financial management |
| **Human Resources** | Performance Management | Staff evaluation for arts organizations |
| **Human Resources** | Volunteer Management | Docent and volunteer coordination |
| **Marketing** | Campaign Analytics | SK-AC-007 visitor analytics |
| **Marketing** | Brand Management | Institutional identity and positioning |
| **Operations** | Event Operations Management | SK-AC-005 production coordination |
| **Operations** | Facility Management | Venue and gallery operations |
| **Legal** | Contract Management | Artist contracts, loan agreements |
| **Legal** | Intellectual Property | Copyright, image rights, reproductions |
| **Legal** | Risk Assessment | SK-AC-011 collection risk management |

### From Technology Specializations

| Source Specialization | Skill/Process | Application to Arts & Culture |
|----------------------|---------------|------------------------------|
| **Software Development** | Database Design | Collection management systems |
| **Software Development** | API Integration | Third-party system connections |
| **Data Science** | Data Visualization | SK-AC-007 visitor data presentation |
| **Data Science** | Predictive Analytics | Attendance forecasting |
| **UX Design** | User Research | Visitor experience design |
| **UX Design** | Accessibility Testing | SK-AC-012 ADA compliance |

### From Other Social Sciences & Humanities

| Source Specialization | Skill/Process | Application to Arts & Culture |
|----------------------|---------------|------------------------------|
| **Education** | Curriculum Development | Museum education programs |
| **Education** | Learning Assessment | Visitor learning evaluation |
| **Social Sciences** | Survey Research Design | Visitor surveys |
| **Social Sciences** | Program Evaluation | Exhibition effectiveness assessment |
| **Humanities** | Archival Research | SK-AC-001 curatorial research |
| **Humanities** | Primary Source Analysis | Provenance research |

### Cross-Functional Agent Collaborations

| Arts & Culture Agent | Collaborating Agent | Collaboration Purpose |
|---------------------|--------------------|-----------------------|
| AG-AC-002 (arts-administrator-agent) | Finance: CFO Agent | Budget planning and financial oversight |
| AG-AC-003 (development-officer-agent) | Legal: Contract Agent | Gift agreements and donor contracts |
| AG-AC-004 (conservator-agent) | Science: Materials Scientist | Conservation treatment analysis |
| AG-AC-005 (production-manager-agent) | Operations: Event Manager | Large-scale production logistics |
| AG-AC-007 (education-outreach-agent) | Education: Curriculum Developer | K-12 education program alignment |
| AG-AC-008 (marketing-communications-agent) | Marketing: Digital Strategist | Multi-channel campaign execution |
| AG-AC-009 (cultural-policy-agent) | Social Sciences: Policy Analyst | Cultural impact measurement |

---

## Implementation Recommendations

### Priority Integration Order

1. **Collection Management** (SK-AC-003) - Integrate with CollectiveAccess or ArchivesSpace
2. **Analytics Platform** (SK-AC-007) - Deploy Metabase or Apache Superset
3. **Digital Asset Management** - Implement IIIF-compliant image serving
4. **CRM Integration** (SK-AC-009) - Connect donor management systems
5. **Grant Management** (SK-AC-002) - Integrate grants.gov and foundation databases

### Technology Stack Recommendations

```yaml
recommended_stack:
  collection_management:
    - CollectiveAccess (primary)
    - ArchivesSpace (archives)

  digital_asset_management:
    - ResourceSpace
    - IIIF server (Cantaloupe)

  analytics:
    - Metabase (visitor analytics)
    - Google Analytics (web)

  crm:
    - Salesforce Nonprofit
    - Bloomerang (donor management)

  project_management:
    - Asana (production)
    - Monday.com (exhibitions)
```

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Specialization**: Arts and Culture (`arts-culture`)
**Phase**: 5 - Skills and Agents References
