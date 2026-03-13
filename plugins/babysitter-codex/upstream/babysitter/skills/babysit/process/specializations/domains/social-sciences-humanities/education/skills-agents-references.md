# Education and Learning - Skills and Agents References

## Phase 5: External Resources and Cross-Specialization References

This document provides external resources, tools, and cross-specialization references to support the implementation of Education and Learning skills and agents.

---

## GitHub Repositories

### Learning Management and Course Authoring

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [moodle/moodle](https://github.com/moodle/moodle) | Open-source learning management system | SK-EDU-007 (LMS Configuration) |
| [canvas-lms/canvas-lms](https://github.com/instructure/canvas-lms) | Modern LMS platform by Instructure | SK-EDU-007 |
| [openedx/edx-platform](https://github.com/openedx/edx-platform) | Open edX platform for MOOCs | SK-EDU-007, SK-EDU-005 |
| [ilios/ilios](https://github.com/ilios/ilios) | Curriculum management system for health sciences | SK-EDU-008 (Standards Alignment) |
| [chamilo/chamilo-lms](https://github.com/chamilo/chamilo-lms) | E-learning and collaboration platform | SK-EDU-007 |

### E-Learning Development Tools

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [nickulrich/adapt-learning](https://github.com/adaptlearning/adapt_framework) | Responsive e-learning framework | SK-EDU-005 (E-Learning Storyboarding), SK-EDU-006 |
| [h5p/h5p](https://github.com/h5p) | Interactive content creation framework | SK-EDU-006 (Multimedia Learning Design) |
| [OpenOLAT/OpenOLAT](https://github.com/OpenOLAT/OpenOLAT) | Learning and course management | SK-EDU-007 |
| [xAPI/xAPI-Spec](https://github.com/adlnet/xAPI-Spec) | Experience API (xAPI) specification | SK-EDU-007, SK-EDU-009 |

### Assessment and Analytics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [TAO/TAO-CE](https://github.com/oat-sa/tao-core) | Open Assessment Technologies platform | SK-EDU-003 (Assessment Item Development) |
| [Concerto/Concerto](https://github.com/campsych/concerto-platform) | Adaptive testing platform | SK-EDU-003 |
| [OpenAssessmentClient](https://github.com/oat-sa/extension-tao-test-runner) | Test delivery client | SK-EDU-003 |
| [learningAnalytics](https://github.com/learningAnalyticsUK) | Learning analytics tools collection | SK-EDU-009 (Learning Analytics) |
| [LAK/learning-analytics-datasets](https://github.com/CAHLR/courseware-lak) | Learning analytics datasets and tools | SK-EDU-009 |

### Accessibility and UDL

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pa11y/pa11y](https://github.com/pa11y/pa11y) | Automated accessibility testing tool | SK-EDU-010 (Accessibility Compliance) |
| [AccessibleColors](https://github.com/accessible-colors/accessible-colors) | Color contrast checker | SK-EDU-010 |
| [CAST/UDL-Guidelines](https://github.com/cast-org) | Universal Design for Learning resources | SK-EDU-006, SK-EDU-010 |
| [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | Accessibility testing engine | SK-EDU-010 |

### Standards and Specifications

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [SCORM-Cloud](https://github.com/RusticiSoftware) | SCORM implementation resources | SK-EDU-007 |
| [IMS-Global](https://github.com/IMSGlobal) | IMS Global standards (LTI, QTI, Caliper) | SK-EDU-007, SK-EDU-003 |
| [common-cartridge](https://github.com/instructure/common-cartridge-viewer) | Common Cartridge viewer and tools | SK-EDU-007 |

### Video Production

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ffmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | Video/audio processing | SK-EDU-011 (Instructional Video Production) |
| [OBS/obs-studio](https://github.com/obsproject/obs-studio) | Screen recording and streaming | SK-EDU-011 |
| [openshot/openshot-qt](https://github.com/OpenShot/openshot-qt) | Video editing software | SK-EDU-011 |

---

## MCP Server References

### Potential MCP Integrations

| MCP Server Type | Description | Applicable Skills |
|-----------------|-------------|-------------------|
| **LMS Integration MCP** | Connect to Canvas, Moodle, Blackboard APIs | SK-EDU-007 |
| **Assessment Engine MCP** | QTI-compliant item banking and delivery | SK-EDU-003, SK-EDU-004 |
| **xAPI/Learning Record Store MCP** | Learning data aggregation and analysis | SK-EDU-009 |
| **Video Transcoding MCP** | Instructional video processing pipeline | SK-EDU-011 |
| **Accessibility Checker MCP** | Automated WCAG compliance scanning | SK-EDU-010 |
| **Standards Alignment MCP** | Educational standards database lookup | SK-EDU-008 |

### Recommended MCP Implementations

```yaml
# Example MCP configuration for education technology
mcp_servers:
  - name: lms-connector
    type: api
    description: Multi-LMS integration hub
    supported_lms:
      - Canvas
      - Moodle
      - Blackboard
      - D2L Brightspace
    features:
      - course_creation
      - gradebook_sync
      - content_import
      - analytics_export

  - name: assessment-bank
    type: database
    description: QTI-compliant item bank
    standards:
      - QTI 2.2
      - APIP
    features:
      - item_authoring
      - test_assembly
      - psychometric_analysis

  - name: learning-record-store
    type: xapi
    description: xAPI learning data aggregation
    features:
      - statement_storage
      - learning_path_tracking
      - competency_mapping
```

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [Association for Educational Communications & Technology (AECT)](https://aect.org/) | Instructional design standards, research | SK-EDU-001, SK-EDU-005 |
| [International Society for Technology in Education (ISTE)](https://www.iste.org/) | Technology standards, professional learning | SK-EDU-007, SK-EDU-012 |
| [Association for Talent Development (ATD)](https://www.td.org/) | Workplace learning best practices | SK-EDU-001, SK-EDU-014 |
| [Online Learning Consortium (OLC)](https://onlinelearningconsortium.org/) | Quality frameworks, research | SK-EDU-013 (Quality Assurance) |
| [Quality Matters (QM)](https://www.qualitymatters.org/) | Course design quality standards | SK-EDU-013 |
| [EDUCAUSE](https://www.educause.edu/) | Higher education technology | SK-EDU-007, SK-EDU-009 |

### Standards Bodies

| Organization | Standards | Relevant Skills |
|--------------|-----------|-----------------|
| [IMS Global Learning Consortium](https://www.imsglobal.org/) | LTI, QTI, Caliper, Open Badges | SK-EDU-007, SK-EDU-003, SK-EDU-009 |
| [ADL Initiative](https://adlnet.gov/) | SCORM, xAPI, CMI5 | SK-EDU-007 |
| [IEEE LTSC](https://sagroups.ieee.org/ltsc/) | Learning technology standards | SK-EDU-007 |
| [W3C/WAI](https://www.w3.org/WAI/) | WCAG accessibility guidelines | SK-EDU-010 |
| [CAST](https://www.cast.org/) | UDL Guidelines | SK-EDU-006, SK-EDU-010 |

### Online Learning and Documentation

| Resource | Description | Relevant Areas |
|----------|-------------|----------------|
| [MoocLab](https://www.mooclab.club/) | MOOC design community | SK-EDU-005 |
| [ATD Learning Technologies Blog](https://www.td.org/insights/learning-technologies) | Learning technology trends | SK-EDU-005, SK-EDU-006 |
| [e-Learning Heroes](https://community.articulate.com/) | Articulate user community | SK-EDU-005, SK-EDU-006 |
| [Learning Solutions Magazine](https://learningsolutionsmag.com/) | Industry news and tutorials | All skills |
| [eLearning Industry](https://elearningindustry.com/) | Articles, webinars, vendor reviews | All skills |

### Curriculum Standards Databases

| Database | Coverage | Use Cases |
|----------|----------|-----------|
| [Common Core State Standards](https://www.corestandards.org/) | K-12 ELA and Math | SK-EDU-008 |
| [Next Generation Science Standards](https://www.nextgenscience.org/) | K-12 Science | SK-EDU-008 |
| [C3 Framework](https://www.socialstudies.org/standards/c3) | Social Studies | SK-EDU-008 |
| [AASL Standards](https://standards.aasl.org/) | Library/Information Literacy | SK-EDU-008 |
| [Achievement Standards Network (ASN)](http://www.achievementstandards.org/) | Standards alignment database | SK-EDU-008 |

---

## API Documentation

### LMS and Platform APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Canvas LMS REST API](https://canvas.instructure.com/doc/api/) | Full Canvas integration | SK-EDU-007, SK-EDU-009 |
| [Moodle Web Services API](https://docs.moodle.org/dev/Web_service_API_functions) | Moodle integration | SK-EDU-007 |
| [Blackboard REST API](https://developer.blackboard.com/portal/displayApi) | Blackboard integration | SK-EDU-007 |
| [D2L Brightspace API](https://docs.valence.desire2learn.com/) | Brightspace integration | SK-EDU-007 |
| [Google Classroom API](https://developers.google.com/classroom) | Google Classroom integration | SK-EDU-007 |
| [Microsoft Graph (Education)](https://docs.microsoft.com/graph/education-concept-overview) | Teams/Education integration | SK-EDU-007 |

### Assessment and Standards APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [TAO Platform API](https://www.taotesting.com/platform/) | Open assessment platform | SK-EDU-003 |
| [IMS QTI](https://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html) | Question and Test Interoperability | SK-EDU-003 |
| [Academic Benchmarks](https://www.instructure.com/higher-education/products/academic-benchmarks) | Standards alignment | SK-EDU-008 |
| [xAPI / Learning Locker](https://docs.learninglocker.net/welcome/) | Learning record store API | SK-EDU-009 |

### Content and Media APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [H5P API](https://h5p.org/documentation/for-developers) | Interactive content | SK-EDU-006 |
| [Kaltura API](https://developer.kaltura.com/) | Video platform | SK-EDU-011 |
| [Panopto API](https://support.panopto.com/s/article/Panopto-API) | Video capture platform | SK-EDU-011 |
| [YouTube Data API](https://developers.google.com/youtube/v3) | Video hosting/analytics | SK-EDU-011 |
| [Vimeo API](https://developer.vimeo.com/) | Video hosting | SK-EDU-011 |

### Accessibility Testing APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Deque axe API](https://www.deque.com/axe/) | Accessibility testing | SK-EDU-010 |
| [WAVE API](https://wave.webaim.org/api/) | Web accessibility evaluation | SK-EDU-010 |
| [Siteimprove API](https://developer.siteimprove.com/) | Accessibility and quality | SK-EDU-010, SK-EDU-013 |

---

## Applicable Skills from Other Specializations

### From Technology Specializations

| Source Specialization | Skill/Process | Application to Education |
|----------------------|---------------|--------------------------|
| **Software Development** | Web Development | LMS customization, content development |
| **Software Development** | API Integration | Third-party tool connections |
| **Software Development** | Database Design | Learning record management |
| **UX Design** | User Research | Learner experience optimization |
| **UX Design** | Interaction Design | E-learning interface design |
| **UX Design** | Usability Testing | Course usability evaluation |
| **Data Science** | Statistical Analysis | Learning analytics, psychometrics |
| **Data Science** | Data Visualization | Learning dashboards |
| **Data Science** | Machine Learning | Adaptive learning systems |

### From Business Specializations

| Source Specialization | Skill/Process | Application to Education |
|----------------------|---------------|--------------------------|
| **Human Resources** | Training Needs Analysis | SK-EDU-001 organizational learning needs |
| **Human Resources** | Performance Management | Competency-based training evaluation |
| **Human Resources** | Change Management | Learning program implementation |
| **Operations** | Project Management | Curriculum development projects |
| **Operations** | Process Improvement | Instructional process optimization |
| **Marketing** | Content Strategy | Learning content marketing |
| **Marketing** | Audience Segmentation | Learner persona development |

### From Other Social Sciences & Humanities

| Source Specialization | Skill/Process | Application to Education |
|----------------------|---------------|--------------------------|
| **Social Sciences** | Survey Research Design | Learner needs assessment, evaluation |
| **Social Sciences** | Quantitative Methods | Educational research, assessment analytics |
| **Social Sciences** | Qualitative Analysis | Learner interview analysis |
| **Social Sciences** | Program Evaluation | SK-EDU-009 training effectiveness |
| **Philosophy** | Critical Thinking Assessment | Learning outcome assessment |
| **Philosophy** | Ethical Framework Application | Research ethics, academic integrity |
| **Humanities** | Scholarly Writing | Academic publication |
| **Humanities** | Archival Research | Historical curriculum analysis |

### Cross-Functional Agent Collaborations

| Education Agent | Collaborating Agent | Collaboration Purpose |
|-----------------|--------------------|-----------------------|
| AG-EDU-001 (Instructional Design Lead) | UX: Experience Designer | Learner experience optimization |
| AG-EDU-003 (Assessment Design Specialist) | Data Science: Statistician | Psychometric analysis |
| AG-EDU-004 (E-Learning Developer) | Software: Frontend Developer | Custom interaction development |
| AG-EDU-005 (Learning Technology Admin) | IT: Systems Administrator | Infrastructure management |
| AG-EDU-007 (Learning Evaluation Analyst) | Social Sciences: Research Methodologist | Evaluation design |
| AG-EDU-008 (Accessibility Specialist) | UX: Accessibility Expert | Inclusive design implementation |
| AG-EDU-009 (Quality Assurance Coordinator) | Operations: Quality Manager | Process improvement |
| AG-EDU-010 (Learning Experience Designer) | Marketing: Content Strategist | Engagement optimization |

---

## Implementation Recommendations

### Priority Integration Order

1. **LMS Integration** (SK-EDU-007) - Connect primary learning platforms via API
2. **Assessment Platform** (SK-EDU-003) - Implement QTI-compliant item banking
3. **Learning Analytics** (SK-EDU-009) - Deploy xAPI learning record store
4. **Accessibility Testing** (SK-EDU-010) - Automated WCAG compliance checking
5. **Standards Alignment** (SK-EDU-008) - Connect to standards databases

### Technology Stack Recommendations

```yaml
recommended_stack:
  learning_management:
    primary: Canvas LMS / Moodle
    enterprise: Cornerstone / SAP SuccessFactors Learning

  course_authoring:
    - Articulate Storyline / Rise
    - Adobe Captivate
    - H5P (interactive content)
    - Adapt Learning (responsive)

  assessment:
    - TAO Platform
    - Questionmark
    - Respondus (proctoring)

  video:
    - Panopto
    - Kaltura
    - Camtasia (desktop)

  analytics:
    - Learning Locker (xAPI)
    - Canvas Data
    - Power BI / Tableau

  accessibility:
    - axe DevTools
    - WAVE
    - SiteImprove
```

### Quality Framework Integration

```yaml
quality_frameworks:
  course_design:
    - Quality Matters (QM)
    - OSCQR (SUNY)
    - Blackboard Exemplary Course Program

  accessibility:
    - WCAG 2.1 Level AA
    - Section 508
    - EN 301 549

  evaluation:
    - Kirkpatrick Four Levels
    - Phillips ROI Methodology
    - Brinkerhoff Success Case Method
```

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Specialization**: Education and Learning (`education`)
**Phase**: 5 - Skills and Agents References
