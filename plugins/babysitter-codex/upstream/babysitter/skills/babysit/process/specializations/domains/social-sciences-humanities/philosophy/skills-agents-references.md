# Philosophy and Theology - Skills and Agents References

## Phase 5: External Resources and Cross-Specialization References

This document provides external resources, tools, and cross-specialization references to support the implementation of Philosophy and Theology skills and agents.

---

## GitHub Repositories

### Logic and Formal Methods

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Coq/coq](https://github.com/coq/coq) | Formal proof management system | SK-PHIL-001 (Formal Logic Analysis) |
| [isabelle-prover/isabelle](https://github.com/isabelle-prover/mirror-isabelle) | Generic proof assistant | SK-PHIL-001 |
| [leanprover/lean4](https://github.com/leanprover/lean4) | Theorem prover and programming language | SK-PHIL-001 |
| [agda/agda](https://github.com/agda/agda) | Dependently typed programming language | SK-PHIL-001 |
| [Z3Prover/z3](https://github.com/Z3Prover/z3) | SMT solver for logic verification | SK-PHIL-001 |
| [argumentation-online](https://github.com/dstl/argumentation) | Computational argumentation frameworks | SK-PHIL-002 (Argument Mapping) |

### Argument Analysis and Mapping

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [argdown/argdown](https://github.com/christianvoigt/argdown) | Argument mapping syntax and tools | SK-PHIL-002 |
| [bCisive/argument-map](https://github.com/arguman) | Collaborative argument mapping | SK-PHIL-002 |
| [rationale](https://github.com/OpenPhilology) | Argument visualization tools | SK-PHIL-002 |

### Text Analysis and Hermeneutics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [NLTK/nltk](https://github.com/nltk/nltk) | Natural language processing toolkit | SK-PHIL-004 (Hermeneutical Interpretation), SK-PHIL-013 |
| [perseus-digital-library](https://github.com/PerseusDL) | Classical text digital library | SK-PHIL-004 |
| [open-philosophy](https://github.com/OpenPhilosophyResources) | Philosophy text resources | SK-PHIL-004, SK-PHIL-013 |
| [TEIC/TEI](https://github.com/TEIC/TEI) | Text Encoding Initiative for scholarly editions | SK-PHIL-004 |

### Ethics and Decision Support

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ethicalengine](https://github.com/ethicalengine) | Moral dilemma analysis platform | SK-PHIL-003 (Ethical Framework Application) |
| [moral-machine](https://github.com/MIT-AI-Accelerator) | Ethical decision modeling | SK-PHIL-003 |
| [deon](https://github.com/deon/deon) | Ethics checklist for data science | SK-PHIL-003, SK-PHIL-012 |

### Critical Thinking and Education

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [critical-thinking](https://github.com/criticalthinking) | Critical thinking resources | SK-PHIL-011 (Fallacy Detection), SK-PHIL-014 |
| [logicproof](https://github.com/OpenLogic/OpenLogic) | Open logic textbook and exercises | SK-PHIL-001, SK-PHIL-011 |

---

## MCP Server References

### Potential MCP Integrations

| MCP Server Type | Description | Applicable Skills |
|-----------------|-------------|-------------------|
| **Logic Verification MCP** | Formal proof checking and validation | SK-PHIL-001 |
| **Argument Mapping MCP** | Argument structure analysis and visualization | SK-PHIL-002 |
| **Philosophy Corpus MCP** | Access to Stanford Encyclopedia, PhilPapers | SK-PHIL-013 (Literature Synthesis) |
| **Ethics Case Database MCP** | Bioethics and applied ethics case repository | SK-PHIL-003, SK-PHIL-012 |
| **Citation Network MCP** | Philosophical citation and influence mapping | SK-PHIL-013 |
| **Scripture/Text MCP** | Religious text access and search | SK-PHIL-004, SK-PHIL-008 |
| **Dialogue Facilitation MCP** | Socratic dialogue structuring and tracking | SK-PHIL-014 |

### Recommended MCP Implementations

```yaml
# Example MCP configuration for philosophy research
mcp_servers:
  - name: logic-assistant
    type: computation
    description: Formal logic analysis and proof verification
    features:
      - propositional_logic
      - predicate_logic
      - modal_logic
      - proof_construction
      - validity_checking
      - fallacy_detection
    engines:
      - z3_solver
      - lean_prover

  - name: argument-analyzer
    type: nlp
    description: Argument reconstruction and mapping
    features:
      - premise_extraction
      - conclusion_identification
      - implicit_assumption_detection
      - argument_visualization
      - fallacy_classification
    formats:
      - toulmin_model
      - standard_form
      - argdown

  - name: philosophy-corpus
    type: api
    description: Philosophical literature access
    sources:
      - stanford_encyclopedia
      - philpapers
      - jstor
      - project_muse
    features:
      - full_text_search
      - citation_tracking
      - concept_mapping
```

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [American Philosophical Association (APA)](https://www.apaonline.org/) | Ethics statements, career resources, publications | All philosophical skills, AG-PHIL-006 |
| [Society for Exact Philosophy](https://exactphilosophy.net/) | Formal methods in philosophy | SK-PHIL-001 |
| [American Academy of Religion (AAR)](https://www.aarweb.org/) | Religious studies, theology resources | SK-PHIL-008, SK-PHIL-009 |
| [Society for Christian Philosophers](https://societyofchristianphilosophers.com/) | Philosophy of religion | SK-PHIL-008 |
| [Association for Informal Logic & Critical Thinking](https://ailact.org/) | Argumentation theory | SK-PHIL-002, SK-PHIL-011 |
| [Society for Applied Philosophy](https://www.appliedphil.org/) | Applied ethics, practical philosophy | SK-PHIL-003, SK-PHIL-012 |
| [American Society for Bioethics and Humanities](https://asbh.org/) | Bioethics, clinical ethics | SK-PHIL-012 |
| [International Association for the Study of Religion](https://iasr.org/) | Comparative religion methodology | SK-PHIL-009 |

### Academic Resources and Encyclopedias

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [Stanford Encyclopedia of Philosophy (SEP)](https://plato.stanford.edu/) | Peer-reviewed philosophy encyclopedia | SK-PHIL-013, all conceptual skills |
| [Internet Encyclopedia of Philosophy (IEP)](https://iep.utm.edu/) | Open-access philosophy reference | SK-PHIL-013 |
| [PhilPapers](https://philpapers.org/) | Comprehensive philosophy bibliography | SK-PHIL-013 |
| [Philosophy Compass](https://compassphilosophy.com/) | Survey articles and bibliographies | SK-PHIL-013 |
| [JSTOR Philosophy Collection](https://www.jstor.org/) | Historical and current journals | SK-PHIL-013 |

### Logic Resources

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [Open Logic Project](https://openlogicproject.org/) | Open-source logic textbook | SK-PHIL-001, SK-PHIL-011 |
| [forallx](https://www.fecundity.com/logic/) | Free logic textbook | SK-PHIL-001 |
| [LogiCola](https://www.umsu.de/trees/) | Logic exercises and tools | SK-PHIL-001 |
| [Carnap.io](https://carnap.io/) | Online logic instruction platform | SK-PHIL-001 |
| [ProofTools](https://prooftools.github.io/) | Interactive proof checkers | SK-PHIL-001 |

### Ethics Resources

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [Ethics Updates](https://ethicsupdates.net/) | Applied ethics resources | SK-PHIL-003 |
| [The Markkula Center for Applied Ethics](https://www.scu.edu/ethics/) | Ethics case studies, frameworks | SK-PHIL-003, SK-PHIL-012 |
| [Kennedy Institute of Ethics](https://kennedyinstitute.georgetown.edu/) | Bioethics resources | SK-PHIL-012 |
| [National Reference Center for Bioethics Literature](https://bioethics.georgetown.edu/) | Bioethics bibliography | SK-PHIL-012 |
| [Practical Ethics (Oxford)](https://practicalethics.ox.ac.uk/) | Applied ethics blog and resources | SK-PHIL-003 |

### Religious Studies and Theology

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [ATLA Religion Database](https://www.atla.com/) | Religious studies index | SK-PHIL-008, SK-PHIL-009 |
| [Theopedia](https://www.theopedia.com/) | Encyclopedia of Christianity | SK-PHIL-008 |
| [Internet Sacred Text Archive](https://www.sacred-texts.com/) | Religious text collection | SK-PHIL-004, SK-PHIL-009 |
| [Bible Hub](https://biblehub.com/) | Biblical texts and commentaries | SK-PHIL-004, SK-PHIL-008 |
| [Pew Research Religion](https://www.pewresearch.org/religion/) | Religious demographics and trends | SK-PHIL-009 |

### Forums and Communities

| Community | Focus | URL |
|-----------|-------|-----|
| Philosophy Stack Exchange | Philosophy Q&A | [philosophy.stackexchange.com](https://philosophy.stackexchange.com/) |
| PhilPapers Discussions | Academic philosophy | [philpapers.org/discussions](https://philpapers.org/) |
| r/philosophy | General philosophy | [reddit.com/r/philosophy](https://reddit.com/r/philosophy) |
| r/askphilosophy | Philosophy questions | [reddit.com/r/askphilosophy](https://reddit.com/r/askphilosophy) |
| Leiter Reports | Philosophy profession | [leiterreports.typepad.com](https://leiterreports.typepad.com/) |

---

## API Documentation

### Philosophy and Academic APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [PhilPapers API](https://philpapers.org/help/api) | Philosophy bibliography access | SK-PHIL-013 |
| [Stanford Encyclopedia API](https://plato.stanford.edu/info.html) | SEP content access | SK-PHIL-013 |
| [CrossRef API](https://api.crossref.org/) | Academic citation metadata | SK-PHIL-010 |
| [Semantic Scholar API](https://www.semanticscholar.org/product/api) | Academic paper search | SK-PHIL-013 |
| [ORCID API](https://orcid.org/developer-tools) | Researcher identification | SK-PHIL-010 |

### Logic and Reasoning Tools

| Tool/API | Description | Use Cases |
|----------|-------------|-----------|
| [Z3 Solver API](https://z3prover.github.io/api/html/) | SMT solver for logic problems | SK-PHIL-001 |
| [Lean 4 API](https://leanprover.github.io/lean4/doc/) | Theorem proving | SK-PHIL-001 |
| [Argdown Language Server](https://argdown.org/guide/language-server.html) | Argument mapping | SK-PHIL-002 |
| [Natural Logic API](https://nlp.stanford.edu/software/natlog.html) | Natural language inference | SK-PHIL-002 |

### Religious and Text APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Bible API](https://scripture.api.bible/) | Multiple Bible translations | SK-PHIL-004, SK-PHIL-008 |
| [Quran API](https://quran.api-docs.io/) | Quranic text access | SK-PHIL-009 |
| [Perseus Digital Library](https://www.perseus.tufts.edu/hopper/api) | Classical texts | SK-PHIL-004 |
| [ATLA Religion Database API](https://www.atla.com/) | Religious studies literature | SK-PHIL-008 |

### NLP and Text Analysis APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [spaCy API](https://spacy.io/api) | NLP processing | SK-PHIL-002, SK-PHIL-013 |
| [GPT-4 API](https://platform.openai.com/docs/api-reference) | Language understanding | SK-PHIL-002, SK-PHIL-005 |
| [Claude API](https://docs.anthropic.com/claude/reference) | Philosophical reasoning assistance | All skills |

---

## Applicable Skills from Other Specializations

### From Technology Specializations

| Source Specialization | Skill/Process | Application to Philosophy |
|----------------------|---------------|---------------------------|
| **Software Development** | Database Design | Research data organization |
| **Software Development** | Web Development | Philosophy resource publishing |
| **Data Science** | NLP Processing | Text analysis for hermeneutics |
| **Data Science** | Network Analysis | Citation and influence mapping |
| **Data Science** | Statistical Methods | Experimental philosophy |
| **AI/ML** | Formal Verification | Logic system validation |
| **AI/ML** | Knowledge Representation | Ontology development |

### From Business Specializations

| Source Specialization | Skill/Process | Application to Philosophy |
|----------------------|---------------|---------------------------|
| **Legal** | Contract Analysis | Applied ethics in agreements |
| **Legal** | Compliance Assessment | Ethical compliance review |
| **Human Resources** | Ethics Training | Organizational ethics programs |
| **Human Resources** | Conflict Resolution | Ethical dispute mediation |
| **Marketing** | Communication Strategy | Philosophy public engagement |
| **Operations** | Decision Analysis | Ethical decision frameworks |

### From Other Social Sciences & Humanities

| Source Specialization | Skill/Process | Application to Philosophy |
|----------------------|---------------|---------------------------|
| **Humanities** | Textual Analysis | SK-PHIL-004 hermeneutical interpretation |
| **Humanities** | Primary Source Evaluation | Historical philosophy research |
| **Humanities** | Scholarly Writing | SK-PHIL-010 philosophical writing |
| **Humanities** | TEI Encoding | Digital philosophy editions |
| **Social Sciences** | Survey Research | Experimental philosophy |
| **Social Sciences** | Qualitative Analysis | Phenomenological research |
| **Social Sciences** | Research Ethics | SK-PHIL-003 ethical frameworks |
| **Education** | Curriculum Development | Philosophy pedagogy |
| **Education** | Assessment Design | Critical thinking evaluation |
| **Education** | Learning Objectives | Philosophy course design |
| **Healthcare** | Clinical Ethics | SK-PHIL-012 bioethics deliberation |
| **Healthcare** | IRB Processes | Research ethics review |

### Cross-Functional Agent Collaborations

| Philosophy Agent | Collaborating Agent | Collaboration Purpose |
|-----------------|--------------------|-----------------------|
| AG-PHIL-001 (Logic Analyst) | Data Science: Formal Methods Specialist | Computational logic |
| AG-PHIL-002 (Ethics Consultant) | Healthcare: Clinical Ethics Agent | Medical ethics cases |
| AG-PHIL-002 (Ethics Consultant) | Legal: Compliance Officer | Regulatory ethics |
| AG-PHIL-003 (Hermeneutics Specialist) | Humanities: Literary Critic | Textual interpretation |
| AG-PHIL-004 (Metaphysics Agent) | AI/ML: Knowledge Engineer | Ontology development |
| AG-PHIL-005 (Philosophical Theologian) | Humanities: Religious Studies Scholar | Comparative religion |
| AG-PHIL-006 (Academic Writer) | Humanities: Scholarly Writing Agent | Publication strategy |
| AG-PHIL-007 (Critical Thinking Educator) | Education: Curriculum Developer | Pedagogy design |
| AG-PHIL-008 (Comparative Religion Scholar) | Humanities: Cultural Anthropologist | Religious practice research |

---

## Implementation Recommendations

### Priority Integration Order

1. **Logic Tools** (SK-PHIL-001) - Integrate proof assistants and verification tools
2. **Argument Mapping** (SK-PHIL-002) - Deploy Argdown or similar mapping tools
3. **Literature Access** (SK-PHIL-013) - Connect to PhilPapers and SEP
4. **Text Analysis** (SK-PHIL-004) - NLP pipeline for hermeneutics
5. **Ethics Frameworks** (SK-PHIL-003) - Case database and framework templates

### Technology Stack Recommendations

```yaml
recommended_stack:
  logic_tools:
    proof_assistants:
      - Lean 4 (primary)
      - Coq (formal verification)
      - Z3 (SMT solving)
    logic_exercises:
      - Carnap.io
      - forallx materials

  argument_analysis:
    mapping:
      - Argdown
      - MindMup
      - iLogos
    visualization:
      - Rationale
      - bCisive

  text_analysis:
    nlp:
      - spaCy
      - NLTK
    editions:
      - TEI Publisher
      - Perseus tools

  literature_management:
    bibliography:
      - Zotero (primary)
      - BibTeX
    search:
      - PhilPapers integration
      - CrossRef API

  ethics_resources:
    case_databases:
      - Markkula Center
      - Kennedy Institute
    frameworks:
      - Custom decision matrices
      - Ethical checklist templates
```

### Logic Notation Standards

```yaml
notation_standards:
  propositional:
    conjunction: "^, &, AND"
    disjunction: "v, |, OR"
    negation: "~, NOT"
    conditional: "->,"
    biconditional: "<->"

  predicate:
    universal: "forall, for all"
    existential: "exists, there exists"
    identity: "="

  modal:
    necessity: "box, necessarily"
    possibility: "diamond, possibly"

  output_formats:
    - LaTeX
    - Unicode
    - ASCII
```

### Ethical Framework Templates

```yaml
ethical_frameworks:
  consequentialist:
    - Utilitarian calculus
    - Rule consequentialism
    - Preference satisfaction

  deontological:
    - Categorical imperative tests
    - Rights-based analysis
    - Prima facie duties

  virtue_ethics:
    - Virtue identification
    - Practical wisdom analysis
    - Character evaluation

  care_ethics:
    - Relationship mapping
    - Vulnerability assessment
    - Care responsibilities

  bioethics:
    - Principlism (4 principles)
    - Case-based reasoning
    - Reflective equilibrium
```

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Specialization**: Philosophy and Theology (`philosophy`)
**Phase**: 5 - Skills and Agents References
