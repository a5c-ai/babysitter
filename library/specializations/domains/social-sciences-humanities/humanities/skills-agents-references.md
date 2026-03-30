# Humanities and Anthropology - Skills and Agents References

## Phase 5: External Resources and Cross-Specialization References

This document provides external resources, tools, and cross-specialization references to support the implementation of Humanities and Anthropology skills and agents.

---

## GitHub Repositories

### Digital Humanities and Text Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [TEIC/TEI](https://github.com/TEIC/TEI) | Text Encoding Initiative guidelines and schemas | SK-HUM-004 (TEI Text Encoding) |
| [srophe/srophe](https://github.com/srophe/srophe) | Syriac reference portal (TEI-based digital edition) | SK-HUM-004 |
| [NLTK/nltk](https://github.com/nltk/nltk) | Natural Language Toolkit for text analysis | SK-HUM-009 (Topic Modeling), SK-HUM-005 |
| [explosion/spaCy](https://github.com/explosion/spaCy) | Industrial-strength NLP library | SK-HUM-009 |
| [mimno/Mallet](https://github.com/mimno/Mallet) | Machine learning for language toolkit (topic modeling) | SK-HUM-009 |
| [agoldst/dfr-browser](https://github.com/agoldst/dfr-browser) | Topic model visualization | SK-HUM-009 |
| [voyant-tools/voyant](https://github.com/sgsinclair/VoyantServer) | Text analysis environment | SK-HUM-005 (Literary Close Reading), SK-HUM-009 |

### Archival and Historical Research

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [archivesspace/archivesspace](https://github.com/archivesspace/archivesspace) | Archives information management | SK-HUM-007 (Archival Finding Aid Interpretation) |
| [omeka/omeka-s](https://github.com/omeka/omeka-s) | Digital collection publishing | SK-HUM-014 (Metadata Standards) |
| [atom/atom](https://github.com/artefactual/atom) | Access to Memory archival software | SK-HUM-007 |
| [collective-access](https://github.com/collectiveaccess) | Museum and archival collections management | SK-HUM-007, SK-HUM-014 |

### Qualitative Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [QualCoder](https://github.com/ccbogel/QualCoder) | Open-source qualitative data analysis | SK-HUM-002 (Ethnographic Coding) |
| [RQDA](https://github.com/Ronggui/RQDA) | R-based qualitative data analysis | SK-HUM-002 |
| [Taguette](https://github.com/remram44/taguette) | Free and open-source qualitative analysis tool | SK-HUM-002 |

### Linguistic Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [praat/praat](https://github.com/praat/praat) | Speech analysis software | SK-HUM-003 (IPA Transcription) |
| [lingtypology/lingtypology](https://github.com/agricolamz/lingtypology) | Linguistic typology mapping | SK-HUM-003, SK-HUM-011 |
| [ELAN](https://github.com/Katsu-lab/ELAN) | Multimedia annotation tool | SK-HUM-003, SK-HUM-012 |
| [cldf/cldf](https://github.com/cldf/cldf) | Cross-Linguistic Data Formats | SK-HUM-003, SK-HUM-012 |
| [lexibank](https://github.com/lexibank) | Cross-linguistic lexical database tools | SK-HUM-012 (Morphosyntactic Analysis) |

### GIS and Spatial Humanities

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [qgis/QGIS](https://github.com/qgis/QGIS) | Open-source GIS platform | SK-HUM-011 (GIS Mapping) |
| [Leaflet/Leaflet](https://github.com/Leaflet/Leaflet) | Interactive map library | SK-HUM-011 |
| [pelagios/recogito](https://github.com/pelagios/recogito2) | Semantic annotation for historical maps | SK-HUM-011, SK-HUM-001 |
| [WorldHistoricalGazetteer](https://github.com/WorldHistoricalGazetteer) | Historical place name resources | SK-HUM-011 |

### Network Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [gephi/gephi](https://github.com/gephi/gephi) | Network visualization platform | SK-HUM-009 |
| [networkx/networkx](https://github.com/networkx/networkx) | Python network analysis library | SK-HUM-009 |
| [igraph/igraph](https://github.com/igraph/igraph) | Network analysis library | SK-HUM-009 |

### Oral History

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ohms-viewer](https://github.com/uklibraries/ohms-viewer) | Oral History Metadata Synchronizer | SK-HUM-008 (Oral History Interview) |
| [oralhistoryonline](https://github.com/oral-history) | Oral history tools collection | SK-HUM-008 |

---

## MCP Server References

### Potential MCP Integrations

| MCP Server Type | Description | Applicable Skills |
|-----------------|-------------|-------------------|
| **Archival Database MCP** | ArchivesSpace, Collective Access integration | SK-HUM-007 |
| **TEI Validation MCP** | TEI schema validation and transformation | SK-HUM-004 |
| **NLP Processing MCP** | Text analysis pipeline with spaCy/NLTK | SK-HUM-009, SK-HUM-005 |
| **Citation Management MCP** | Zotero/Mendeley bibliography access | SK-HUM-010 |
| **GIS Data MCP** | Historical gazetteer and spatial data | SK-HUM-011 |
| **Audio Transcription MCP** | Speech-to-text for oral history | SK-HUM-008, SK-HUM-003 |
| **IRB Protocol MCP** | Ethics application templates and tracking | SK-HUM-006 |

### Recommended MCP Implementations

```yaml
# Example MCP configuration for humanities research
mcp_servers:
  - name: text-analysis-pipeline
    type: nlp
    description: Text mining and analysis services
    features:
      - tokenization
      - lemmatization
      - pos_tagging
      - ner_extraction
      - topic_modeling
      - sentiment_analysis
    models:
      - spacy_en_core_web_lg
      - mallet_lda
      - bert_base

  - name: tei-processor
    type: xml
    description: TEI encoding validation and transformation
    schemas:
      - TEI_all
      - TEI_lite
      - EpiDoc
    features:
      - validation
      - xslt_transform
      - html_rendering
      - pdf_generation

  - name: citation-manager
    type: api
    description: Bibliography management integration
    connectors:
      - Zotero
      - Mendeley
      - EndNote
    formats:
      - Chicago
      - MLA
      - APA
      - Turabian
```

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [Alliance of Digital Humanities Organizations (ADHO)](https://adho.org/) | DH conferences, publications, standards | SK-HUM-004, SK-HUM-009, AG-HUM-005 |
| [American Anthropological Association (AAA)](https://www.americananthro.org/) | Ethics, methods, publications | SK-HUM-002, SK-HUM-006, AG-HUM-002 |
| [American Historical Association (AHA)](https://www.historians.org/) | Historical methods, ethics, careers | SK-HUM-001, SK-HUM-007, AG-HUM-001 |
| [Modern Language Association (MLA)](https://www.mla.org/) | Literary studies, citation, job market | SK-HUM-005, SK-HUM-010, AG-HUM-004 |
| [Linguistic Society of America (LSA)](https://www.linguisticsociety.org/) | Linguistic research, endangered languages | SK-HUM-003, SK-HUM-012, AG-HUM-003 |
| [Society of American Archivists (SAA)](https://www2.archivists.org/) | Archival standards, best practices | SK-HUM-007, SK-HUM-014 |
| [Oral History Association (OHA)](https://www.oralhistory.org/) | Oral history principles, best practices | SK-HUM-008, AG-HUM-006 |
| [Association for Computational Linguistics (ACL)](https://www.aclweb.org/) | NLP research and resources | SK-HUM-009, SK-HUM-003 |

### Standards and Guidelines

| Standard | Description | Relevant Skills |
|----------|-------------|-----------------|
| [TEI Guidelines](https://tei-c.org/guidelines/) | Text encoding standards | SK-HUM-004 |
| [Dublin Core](https://www.dublincore.org/) | Metadata element set | SK-HUM-014 |
| [METS (Metadata Encoding & Transmission)](https://www.loc.gov/standards/mets/) | Digital library metadata | SK-HUM-014 |
| [MODS (Metadata Object Description Schema)](https://www.loc.gov/standards/mods/) | Bibliographic metadata | SK-HUM-014 |
| [EAD (Encoded Archival Description)](https://www.loc.gov/ead/) | Archival finding aid standard | SK-HUM-007 |
| [DACS (Describing Archives: A Content Standard)](https://saa-ts-dacs.github.io/) | Archival description rules | SK-HUM-007 |
| [IPA Chart](https://www.internationalphoneticassociation.org/content/ipa-chart) | Phonetic transcription standard | SK-HUM-003 |
| [Leipzig Glossing Rules](https://www.eva.mpg.de/lingua/resources/glossing-rules.php) | Interlinear glossing conventions | SK-HUM-012 |

### Online Learning and Tutorials

| Resource | Description | Relevant Areas |
|----------|-------------|----------------|
| [Programming Historian](https://programminghistorian.org/) | Digital humanities tutorials | SK-HUM-004, SK-HUM-009, SK-HUM-011 |
| [DARIAH-TEACH](https://teach.dariah.eu/) | DH training modules | All digital humanities skills |
| [TAPoR](https://tapor.ca/) | Text analysis tools directory | SK-HUM-009 |
| [UCLA DH Tutorials](https://dh.ucla.edu/) | Digital humanities methods | All skills |
| [ELAN Tutorials](https://archive.mpi.nl/tla/elan) | Linguistic annotation training | SK-HUM-003 |
| [Columbia DH Tutorials](https://guides.library.columbia.edu/digital-humanities) | Text encoding, mapping | SK-HUM-004, SK-HUM-011 |

### Research Ethics Resources

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [AAA Ethics](https://ethics.americananthro.org/) | Anthropological ethics statements | SK-HUM-006 |
| [NCRMW (National Committee for Research Involving Maori)](https://www.nzqa.govt.nz/) | Indigenous research ethics | SK-HUM-006 |
| [First Archivists Circle Protocols](https://www2.nau.edu/libnap-p/protocols.html) | Native American archival ethics | SK-HUM-006 |
| [Belmont Report](https://www.hhs.gov/ohrp/regulations-and-policy/belmont-report/) | Human subjects research principles | SK-HUM-006 |

### Forums and Communities

| Community | Focus | URL |
|-----------|-------|-----|
| DH Slack | Digital humanities discussion | [digitalhumanities.slack.com](https://digitalhumanities.slack.com/) |
| Linguist List | Linguistics announcements | [linguistlist.org](https://linguistlist.org/) |
| H-Net | Humanities networks | [h-net.org](https://networks.h-net.org/) |
| Archives & Archivists | Archival practice | [A&A Listserv](https://www2.archivists.org/listservs) |

---

## API Documentation

### Text Analysis and NLP APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [spaCy API](https://spacy.io/api) | Industrial NLP processing | SK-HUM-009 |
| [NLTK Documentation](https://www.nltk.org/api/nltk.html) | Natural language processing | SK-HUM-009, SK-HUM-005 |
| [Stanford CoreNLP](https://stanfordnlp.github.io/CoreNLP/) | NLP annotation pipeline | SK-HUM-009 |
| [Voyant Tools API](https://voyant-tools.org/docs/#!/guide/about) | Text analysis visualization | SK-HUM-005, SK-HUM-009 |
| [CLARIN Language Resources](https://www.clarin.eu/content/language-resources) | European language data | SK-HUM-003, SK-HUM-012 |

### Archival and Metadata APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [ArchivesSpace API](https://archivesspace.github.io/archivesspace/api/) | Archival collection management | SK-HUM-007 |
| [DPLA API](https://pro.dp.la/developers/api-codex) | Digital Public Library access | SK-HUM-007, SK-HUM-001 |
| [Europeana API](https://pro.europeana.eu/page/apis) | European cultural heritage | SK-HUM-001, SK-HUM-007 |
| [HathiTrust API](https://www.hathitrust.org/data_api) | Digital library access | SK-HUM-001 |
| [Internet Archive API](https://archive.org/services/docs/api/) | Historical web and text | SK-HUM-001 |

### Citation and Bibliography APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Zotero API](https://www.zotero.org/support/dev/web_api/v3/start) | Bibliography management | SK-HUM-010 |
| [CrossRef API](https://api.crossref.org/) | DOI and citation metadata | SK-HUM-010 |
| [ORCID API](https://orcid.org/developer-tools) | Researcher identification | SK-HUM-010, SK-HUM-015 |
| [Semantic Scholar API](https://www.semanticscholar.org/product/api) | Academic paper search | SK-HUM-013 |

### GIS and Spatial APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Geonames API](https://www.geonames.org/export/web-services.html) | Geographic database | SK-HUM-011 |
| [Pelagios/Recogito API](https://recogito.pelagios.org/help/api-doc) | Semantic annotation | SK-HUM-011 |
| [World Historical Gazetteer](https://whgazetteer.org/api/) | Historical place names | SK-HUM-011 |
| [Pleiades](https://pleiades.stoa.org/) | Ancient place gazetteer | SK-HUM-011 |

---

## Applicable Skills from Other Specializations

### From Technology Specializations

| Source Specialization | Skill/Process | Application to Humanities |
|----------------------|---------------|---------------------------|
| **Software Development** | Web Development | Digital edition publishing |
| **Software Development** | Database Design | Research data management |
| **Software Development** | API Integration | Third-party data access |
| **Data Science** | Text Mining | SK-HUM-009 computational text analysis |
| **Data Science** | Data Visualization | Research findings presentation |
| **Data Science** | Statistical Analysis | Corpus linguistics, stylometry |
| **Data Science** | Machine Learning | Named entity recognition, classification |

### From Business Specializations

| Source Specialization | Skill/Process | Application to Humanities |
|----------------------|---------------|---------------------------|
| **Finance** | Grant Budgeting | SK-HUM-015 grant proposal development |
| **Marketing** | Communication Strategy | Research dissemination |
| **Operations** | Project Management | Research project coordination |
| **Legal** | Intellectual Property | Copyright, permissions |
| **Legal** | Contract Management | Research agreements |
| **Human Resources** | Training Development | Research methods instruction |

### From Other Social Sciences & Humanities

| Source Specialization | Skill/Process | Application to Humanities |
|----------------------|---------------|---------------------------|
| **Social Sciences** | Qualitative Analysis | SK-HUM-002 ethnographic coding |
| **Social Sciences** | Survey Research | Research data collection |
| **Social Sciences** | Program Evaluation | Project assessment |
| **Social Sciences** | Research Ethics | SK-HUM-006 IRB navigation |
| **Philosophy** | Hermeneutical Interpretation | SK-HUM-005 textual analysis |
| **Philosophy** | Critical Theory Application | SK-HUM-013 theoretical frameworks |
| **Philosophy** | Scholarly Writing | SK-HUM-010 academic publication |
| **Education** | Curriculum Development | Humanities education |
| **Education** | Assessment Design | Student learning evaluation |
| **Arts & Culture** | Curatorial Research | Museum/archive collaboration |
| **Arts & Culture** | Collection Documentation | Material culture research |

### Cross-Functional Agent Collaborations

| Humanities Agent | Collaborating Agent | Collaboration Purpose |
|-----------------|--------------------|-----------------------|
| AG-HUM-001 (Archival Research Specialist) | Arts: Curator Agent | Exhibition research |
| AG-HUM-002 (Ethnographic Methods Advisor) | Social Sciences: Qualitative Researcher | Mixed methods design |
| AG-HUM-003 (Documentary Linguist) | Data Science: NLP Specialist | Computational linguistics |
| AG-HUM-004 (Literary Critic) | Philosophy: Hermeneutics Agent | Interpretive theory |
| AG-HUM-005 (Digital Humanities Technologist) | Software: Data Engineer | Pipeline development |
| AG-HUM-006 (Oral Historian) | Education: Curriculum Developer | Educational oral history |
| AG-HUM-007 (Historical Narrator) | Marketing: Content Strategist | Public history communication |
| AG-HUM-008 (Research Ethics Consultant) | Legal: Compliance Officer | Regulatory navigation |
| AG-HUM-009 (Grants Advisor) | Finance: Budget Analyst | Grant financial planning |
| AG-HUM-010 (Cultural Heritage Specialist) | Arts: Conservation Agent | Preservation projects |

---

## Implementation Recommendations

### Priority Integration Order

1. **Text Encoding** (SK-HUM-004) - TEI validation and transformation pipeline
2. **Archival Access** (SK-HUM-007) - ArchivesSpace/EAD integration
3. **Text Analysis** (SK-HUM-009) - NLP pipeline with spaCy/NLTK
4. **Citation Management** (SK-HUM-010) - Zotero/bibliography integration
5. **GIS Mapping** (SK-HUM-011) - QGIS and gazetteer connectivity

### Technology Stack Recommendations

```yaml
recommended_stack:
  text_encoding:
    - oXygen XML Editor
    - TEI Publisher
    - CETEIcean (browser rendering)

  text_analysis:
    primary: spaCy
    topic_modeling: MALLET / Gensim
    visualization: Voyant Tools

  qualitative:
    - NVivo / Atlas.ti (commercial)
    - QualCoder / Taguette (open source)

  archival:
    - ArchivesSpace
    - Omeka S
    - CollectiveAccess

  linguistics:
    - Praat (phonetics)
    - ELAN (annotation)
    - FLEx (fieldwork)

  gis:
    - QGIS
    - Leaflet
    - Recogito

  bibliography:
    - Zotero
    - BibTeX

  publishing:
    - Jekyll / Hugo
    - Scalar
    - Manifold
```

### Metadata Standards Implementation

```yaml
metadata_standards:
  descriptive:
    - Dublin Core (general)
    - MODS (bibliographic)
    - VRA Core (visual resources)

  structural:
    - METS (digital objects)
    - TEI Header (texts)

  archival:
    - EAD3 (finding aids)
    - DACS (description)

  preservation:
    - PREMIS
    - BagIt
```

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Specialization**: Humanities and Anthropology (`humanities`)
**Phase**: 5 - Skills and Agents References
