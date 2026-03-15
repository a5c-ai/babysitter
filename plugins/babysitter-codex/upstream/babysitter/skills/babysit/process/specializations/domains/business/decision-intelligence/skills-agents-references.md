# Decision Intelligence - Skills and Agents References (Phase 5)

## Overview

This document provides curated references to GitHub repositories, MCP servers, npm packages, Python libraries, and community resources that can be leveraged to implement the skills and agents defined in the Decision Intelligence specialization backlog.

---

## Table of Contents

1. [Quantitative Analysis Skills References](#quantitative-analysis-skills-references)
2. [Simulation Skills References](#simulation-skills-references)
3. [Visualization and Reporting Skills References](#visualization-and-reporting-skills-references)
4. [Forecasting and Prediction Skills References](#forecasting-and-prediction-skills-references)
5. [Risk and Uncertainty Skills References](#risk-and-uncertainty-skills-references)
6. [Optimization Skills References](#optimization-skills-references)
7. [Knowledge Management Skills References](#knowledge-management-skills-references)
8. [Collaboration and Process Skills References](#collaboration-and-process-skills-references)
9. [Agent Framework References](#agent-framework-references)
10. [MCP Server References](#mcp-server-references)
11. [Community Resources](#community-resources)

---

## Quantitative Analysis Skills References

### decision-tree-builder

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn) | Machine learning library with DecisionTreeClassifier and DecisionTreeRegressor | 60k+ | Python |
| [anytree](https://github.com/c0fec0de/anytree) | Powerful and lightweight tree data structure library | 900+ | Python |
| [treelib](https://github.com/caesar0301/treelib) | Efficient tree implementation in Python | 800+ | Python |
| [dmangame/decision-tree](https://github.com/dmangame/decision-tree) | Decision tree for game AI and decision making | - | Python |
| [decision-tree-id3](https://github.com/darrylforbes/decision-tree-id3) | ID3 algorithm implementation for decision trees | - | Python |

#### Python Packages
```bash
pip install scikit-learn anytree treelib graphviz networkx
```

#### npm Packages
```bash
npm install decision-tree ml-cart d3-hierarchy
```

#### Key Resources
- [Scikit-learn Decision Trees Documentation](https://scikit-learn.org/stable/modules/tree.html)
- [Decision Analysis: A Practical Guide](https://www.decisionanalysis.org/)

---

### bayesian-network-analyzer

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pgmpy/pgmpy](https://github.com/pgmpy/pgmpy) | Python library for Probabilistic Graphical Models | 2.7k+ | Python |
| [pomegranate](https://github.com/jmschrei/pomegranate) | Probabilistic models in Python | 3.3k+ | Python |
| [bnlearn](https://github.com/erdogant/bnlearn) | Bayesian Network learning and inference | 500+ | Python |
| [pyAgrum](https://gitlab.com/agrumery/aGrUM) | Scientific library for Bayesian Networks | - | Python/C++ |
| [BayesianNetwork](https://github.com/thiagopbueno/bn) | Bayesian Network library | - | Python |
| [CausalNex](https://github.com/quantumblacklabs/causalnex) | Causal AI with Bayesian Networks | 2.1k+ | Python |

#### Python Packages
```bash
pip install pgmpy pomegranate bnlearn pyagrum causalnex
```

#### Key Resources
- [Probabilistic Graphical Models (Coursera)](https://www.coursera.org/specializations/probabilistic-graphical-models)
- [pgmpy Documentation](https://pgmpy.org/)

---

### ahp-calculator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [PhilipGrworked/ahpy](https://github.com/PhilipGrworked/ahpy) | Analytic Hierarchy Process implementation | 150+ | Python |
| [pyDecision](https://github.com/Valdecy/pyDecision) | Multi-criteria decision making methods | 300+ | Python |
| [AHP.js](https://github.com/nicholasmiller/ahp) | AHP implementation in JavaScript | 50+ | JavaScript |
| [ahp-calculator](https://github.com/dmuir/ahp-calculator) | Web-based AHP calculator | - | JavaScript |

#### Python Packages
```bash
pip install ahpy pyDecision scipy
```

#### npm Packages
```bash
npm install ahp-lite
```

#### Key Resources
- [AHP Wikipedia](https://en.wikipedia.org/wiki/Analytic_hierarchy_process)
- [AHP Online Calculator](https://bpmsg.com/ahp/)

---

### topsis-ranker

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pyDecision](https://github.com/Valdecy/pyDecision) | Comprehensive MCDM library including TOPSIS | 300+ | Python |
| [scikit-mcda](https://github.com/scikit-mcda/scikit-mcda) | MCDA methods for scikit-learn ecosystem | - | Python |
| [pymcdm](https://github.com/kotlarmiern/pymcdm) | Python MCDM library | 100+ | Python |
| [topsis-python](https://github.com/marcodamico/topsis-python) | Simple TOPSIS implementation | - | Python |

#### Python Packages
```bash
pip install pyDecision pymcdm numpy pandas
```

#### Key Resources
- [TOPSIS Method Explained](https://www.sciencedirect.com/topics/computer-science/topsis)
- [MCDM Methods Comparison](https://www.mdpi.com/journal/mathematics/special_issues/MCDM)

---

### promethee-evaluator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pyDecision](https://github.com/Valdecy/pyDecision) | PROMETHEE I, II, III, IV, V implementations | 300+ | Python |
| [pymcdm](https://github.com/kotlarmiern/pymcdm) | PROMETHEE and other MCDM methods | 100+ | Python |
| [visual-promethee](https://github.com/promethee/visual-promethee) | Visual PROMETHEE software | - | Multiple |

#### Python Packages
```bash
pip install pyDecision pymcdm
```

#### Key Resources
- [PROMETHEE Methods](http://www.promethee-gaia.net/)
- [Visual PROMETHEE Software](http://www.promethee-gaia.net/software.html)

---

### electre-comparator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pyDecision](https://github.com/Valdecy/pyDecision) | ELECTRE I, II, III, IV, TRI implementations | 300+ | Python |
| [pymcdm](https://github.com/kotlarmiern/pymcdm) | ELECTRE methods | 100+ | Python |
| [electre-py](https://github.com/drkostas/electre-py) | ELECTRE TRI implementation | - | Python |

#### Python Packages
```bash
pip install pyDecision pymcdm
```

#### Key Resources
- [ELECTRE Methods Guide](https://www.sciencedirect.com/topics/engineering/electre-method)

---

## Simulation Skills References

### monte-carlo-engine

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pymc-devs/pymc](https://github.com/pymc-devs/pymc) | Probabilistic programming in Python | 8.3k+ | Python |
| [SALib](https://github.com/SALib/SALib) | Sensitivity Analysis Library | 800+ | Python |
| [chaospy](https://github.com/jonathf/chaospy) | Numerical tool for polynomial chaos expansions | 450+ | Python |
| [OpenTURNS](https://github.com/openturns/openturns) | Uncertainty treatment in simulation | 300+ | Python/C++ |
| [UQLab](https://github.com/uqlab) | Uncertainty Quantification framework | - | MATLAB/Python |
| [mcerp](https://github.com/tisimst/mcerp) | Monte Carlo Error Propagation | 200+ | Python |

#### Python Packages
```bash
pip install pymc scipy numpy chaospy SALib openturns mcerp
```

#### npm Packages
```bash
npm install monte-carlo random-js probability-distributions
```

#### Key Resources
- [Monte Carlo Methods in Financial Engineering](https://www.springer.com/gp/book/9780387004518)
- [PyMC Documentation](https://www.pymc.io/welcome.html)

---

### risk-distribution-fitter

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [fitter](https://github.com/cokelaer/fitter) | Fit data to probability distributions | 600+ | Python |
| [distfit](https://github.com/erdogant/distfit) | Distribution fitting for univariate data | 400+ | Python |
| [pomegranate](https://github.com/jmschrei/pomegranate) | Distribution fitting and mixture models | 3.3k+ | Python |
| [reliability](https://github.com/MatthewReid854/reliability) | Reliability engineering library | 500+ | Python |

#### Python Packages
```bash
pip install fitter distfit scipy pomegranate reliability
```

#### Key Resources
- [Distribution Fitting Guide](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm)

---

### sensitivity-analyzer

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [SALib](https://github.com/SALib/SALib) | Sensitivity Analysis Library (Sobol, Morris, etc.) | 800+ | Python |
| [OpenTURNS](https://github.com/openturns/openturns) | Comprehensive sensitivity analysis | 300+ | Python/C++ |
| [sensitivity](https://github.com/alsauve/sensitivity) | Simple sensitivity analysis package | - | Python |
| [PAWN](https://github.com/SAFEtoolbox/SAFE-python) | SAFE Toolbox for sensitivity analysis | - | Python |

#### Python Packages
```bash
pip install SALib openturns
```

#### Key Resources
- [Global Sensitivity Analysis: The Primer](https://www.wiley.com/en-us/Global+Sensitivity+Analysis%3A+The+Primer-p-9780470059975)
- [SALib Documentation](https://salib.readthedocs.io/)

---

### system-dynamics-modeler

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [SDXorg/pysd](https://github.com/SDXorg/pysd) | System Dynamics models in Python | 350+ | Python |
| [BPTK-Py](https://github.com/transentis/bptk_py) | Business Prototyping Toolkit for System Dynamics | 100+ | Python |
| [simdynamics](https://github.com/simdynamics/simdynamics) | System dynamics simulation | - | Python |
| [Vensim](https://vensim.com/) | Commercial SD software (free PLE version) | - | Proprietary |
| [AnyLogic](https://www.anylogic.com/) | Multi-method simulation | - | Java |

#### Python Packages
```bash
pip install pysd BPTK-Py
```

#### Key Resources
- [System Dynamics Society](https://systemdynamics.org/)
- [MIT System Dynamics Course](https://ocw.mit.edu/courses/sloan-school-of-management/15-871-introduction-to-system-dynamics-fall-2013/)

---

### agent-based-simulator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [projectmesa/mesa](https://github.com/projectmesa/mesa) | Agent-based modeling framework | 2.4k+ | Python |
| [agentpy](https://github.com/JoelForamitti/agentpy) | Agent-based modeling in Python | 500+ | Python |
| [FLAMEGPU/FLAMEGPU2](https://github.com/FLAMEGPU/FLAMEGPU2) | GPU-accelerated ABM | 200+ | C++/Python |
| [pyNetLogo](https://github.com/quaquel/pyNetLogo) | NetLogo control from Python | 100+ | Python |
| [simpy](https://github.com/teamcode/simpy) | Discrete-event simulation | 700+ | Python |

#### Python Packages
```bash
pip install mesa agentpy pyNetLogo simpy
```

#### Key Resources
- [Mesa Documentation](https://mesa.readthedocs.io/)
- [Introduction to Agent-Based Modeling](https://mitpress.mit.edu/9780262731898/introduction-to-agent-based-modeling/)
- [NetLogo](https://ccl.northwestern.edu/netlogo/)

---

## Visualization and Reporting Skills References

### decision-visualization

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [plotly/plotly.py](https://github.com/plotly/plotly.py) | Interactive graphing library | 15k+ | Python |
| [bokeh/bokeh](https://github.com/bokeh/bokeh) | Interactive visualization library | 19k+ | Python |
| [matplotlib/matplotlib](https://github.com/matplotlib/matplotlib) | Comprehensive plotting library | 20k+ | Python |
| [altair-viz/altair](https://github.com/altair-viz/altair) | Declarative statistical visualization | 9k+ | Python |
| [holoviz/holoviews](https://github.com/holoviz/holoviews) | Multi-dimensional data visualization | 2.6k+ | Python |
| [streamlit/streamlit](https://github.com/streamlit/streamlit) | Data app framework | 33k+ | Python |

#### Python Packages
```bash
pip install plotly bokeh matplotlib altair holoviews streamlit dash
```

#### npm Packages
```bash
npm install d3 chart.js plotly.js echarts highcharts
```

#### Key Resources
- [Plotly Documentation](https://plotly.com/python/)
- [D3.js Gallery](https://observablehq.com/@d3/gallery)

---

### kpi-tracker

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pandas-dev/pandas](https://github.com/pandas-dev/pandas) | Data analysis library | 43k+ | Python |
| [pola-rs/polars](https://github.com/pola-rs/polars) | Fast DataFrame library | 29k+ | Rust/Python |
| [great-expectations](https://github.com/great-expectations/great_expectations) | Data quality and profiling | 9.7k+ | Python |
| [pandera](https://github.com/unionai-oss/pandera) | Statistical data validation | 3.2k+ | Python |
| [Superset](https://github.com/apache/superset) | Business intelligence platform | 61k+ | Python/JS |
| [Metabase](https://github.com/metabase/metabase) | BI and analytics | 38k+ | Clojure/JS |

#### Python Packages
```bash
pip install pandas polars great_expectations pandera dbt-core
```

#### npm Packages
```bash
npm install cube-js knex typeorm
```

#### Key Resources
- [KPI Examples Library](https://www.klipfolio.com/resources/kpi-examples)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)

---

### data-storytelling

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [narrativ/narrativ](https://github.com/narrative-science/narrativ) | Automated narrative generation | - | Python |
| [quarto-dev/quarto-cli](https://github.com/quarto-dev/quarto-cli) | Scientific and technical publishing | 3.7k+ | TypeScript |
| [jupyter/nbconvert](https://github.com/jupyter/nbconvert) | Notebook conversion and reporting | 1.7k+ | Python |
| [Arria NLG](https://www.arria.com/) | Natural Language Generation platform | - | Commercial |

#### Python Packages
```bash
pip install jinja2 markdown quarto nbconvert openai anthropic
```

#### Key Resources
- [Storytelling with Data](https://www.storytellingwithdata.com/)
- [Quarto Documentation](https://quarto.org/)

---

## Forecasting and Prediction Skills References

### time-series-forecaster

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [facebook/prophet](https://github.com/facebook/prophet) | Time series forecasting | 18k+ | Python/R |
| [Nixtla/statsforecast](https://github.com/Nixtla/statsforecast) | Lightning-fast statistical forecasting | 3.8k+ | Python |
| [unit8co/darts](https://github.com/unit8co/darts) | Time series forecasting library | 7.8k+ | Python |
| [sktime/sktime](https://github.com/sktime/sktime) | Time series ML toolkit | 7.7k+ | Python |
| [Nixtla/neuralforecast](https://github.com/Nixtla/neuralforecast) | Neural forecasting | 2.9k+ | Python |
| [awslabs/gluonts](https://github.com/awslabs/gluonts) | Probabilistic time series | 4.5k+ | Python |
| [timesfm](https://github.com/google-research/timesfm) | Google's Time Series Foundation Model | 3.2k+ | Python |

#### Python Packages
```bash
pip install prophet statsforecast darts sktime neuralforecast gluonts arch
```

#### npm Packages
```bash
npm install ml-timeseries-js forecast
```

#### Key Resources
- [Forecasting: Principles and Practice](https://otexts.com/fpp3/)
- [Prophet Documentation](https://facebook.github.io/prophet/)

---

### causal-inference-engine

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [py-why/EconML](https://github.com/py-why/EconML) | ML for causal inference | 3.7k+ | Python |
| [py-why/dowhy](https://github.com/py-why/dowhy) | Causal inference library | 7k+ | Python |
| [uber/causalml](https://github.com/uber/causalml) | Uplift modeling and causal inference | 5k+ | Python |
| [CausalImpact](https://github.com/google/CausalImpact) | Causal inference in time series | 1.6k+ | R |
| [causallib](https://github.com/IBM/causallib) | IBM's causal inference library | 700+ | Python |

#### Python Packages
```bash
pip install econml dowhy causalml causal-learn
```

#### Key Resources
- [Causal Inference: The Mixtape](https://mixtape.scunning.com/)
- [The Book of Why (Judea Pearl)](https://www.basicbooks.com/titles/judea-pearl/the-book-of-why/9780465097616/)
- [DoWhy Documentation](https://www.pywhy.org/dowhy/)

---

### reference-class-forecaster

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [scipy/scipy](https://github.com/scipy/scipy) | Scientific computing (distribution fitting) | 13k+ | Python |
| [pandas-dev/pandas](https://github.com/pandas-dev/pandas) | Data manipulation for reference class analysis | 43k+ | Python |
| [foresight](https://github.com/gjtorikian/foresight) | Forecasting toolkit | - | Python |

#### Python Packages
```bash
pip install scipy pandas numpy
```

#### Key Resources
- [Reference Class Forecasting (Flyvbjerg)](https://arxiv.org/abs/2103.09498)
- [Planning Fallacy Research](https://www.sciencedirect.com/topics/psychology/planning-fallacy)

---

## Risk and Uncertainty Skills References

### risk-register-manager

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [OWASP/risk-rating](https://github.com/OWASP/www-community) | Risk rating methodology | - | Multiple |
| [risk-management-framework](https://github.com/cisagov/rva-reporting) | CISA risk assessment | - | Python |
| [GRCfy](https://github.com/grcfy) | GRC platform | - | Multiple |

#### Python Packages
```bash
pip install pandas numpy jinja2 openpyxl
```

#### Key Resources
- [ISO 31000 Risk Management](https://www.iso.org/iso-31000-risk-management.html)
- [NIST Risk Management Framework](https://csrc.nist.gov/projects/risk-management)

---

### value-at-risk-calculator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [riskfolio-lib](https://github.com/dcajasn/Riskfolio-Lib) | Portfolio optimization and risk | 2.9k+ | Python |
| [arch](https://github.com/bashtage/arch) | ARCH/GARCH models for volatility | 1.3k+ | Python |
| [pyfolio](https://github.com/quantopian/pyfolio) | Portfolio and risk analytics | 5.5k+ | Python |
| [empyrical](https://github.com/quantopian/empyrical) | Common financial risk metrics | 1.2k+ | Python |
| [finmarketpy](https://github.com/cuemacro/finmarketpy) | Financial market analysis | 3.4k+ | Python |

#### Python Packages
```bash
pip install riskfolio-lib arch pyfolio empyrical numpy scipy
```

#### Key Resources
- [Value at Risk (Wikipedia)](https://en.wikipedia.org/wiki/Value_at_risk)
- [Risk Management and Financial Institutions (Hull)](https://www.wiley.com/en-us/Risk+Management+and+Financial+Institutions%2C+6th+Edition-p-9781119932482)

---

### real-options-analyzer

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [vollib](https://github.com/vollib/vollib) | Option pricing library | 600+ | Python |
| [QuantLib-Python](https://github.com/lballabio/QuantLib-SWIG) | Quantitative finance library | 900+ | Python/C++ |
| [py_vollib](https://github.com/vollib/py_vollib) | Pure Python options library | 200+ | Python |
| [optionlab](https://github.com/rgaveiga/optionlab) | Options strategy analysis | 200+ | Python |

#### Python Packages
```bash
pip install vollib QuantLib-Python numpy scipy
```

#### Key Resources
- [Real Options: A Practitioner's Guide](https://www.amazon.com/Real-Options-Practitioners-Tom-Copeland/dp/1587991861)
- [Real Options Analysis (Mun)](https://www.wiley.com/en-us/Real+Options+Analysis%3A+Tools+and+Techniques+for+Valuing+Strategic+Investments+and+Decisions%2C+2nd+Edition-p-9780471747482)

---

## Optimization Skills References

### linear-programming-solver

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [google/or-tools](https://github.com/google/or-tools) | Operations Research tools | 11k+ | C++/Python |
| [coin-or/pulp](https://github.com/coin-or/pulp) | LP modeling in Python | 2k+ | Python |
| [Pyomo/pyomo](https://github.com/Pyomo/pyomo) | Python optimization modeling | 2k+ | Python |
| [cvxpy/cvxpy](https://github.com/cvxpy/cvxpy) | Convex optimization | 5.4k+ | Python |
| [JuMP.jl](https://github.com/jump-dev/JuMP.jl) | Mathematical optimization (Julia) | 2.2k+ | Julia |
| [SCIP](https://github.com/scipopt/scip) | Solving Constraint Integer Programs | 1k+ | C |

#### Python Packages
```bash
pip install ortools pulp pyomo cvxpy scipy
```

#### npm Packages
```bash
npm install javascript-lp-solver glpk.js
```

#### Key Resources
- [OR-Tools Documentation](https://developers.google.com/optimization)
- [Linear Programming (Chvatal)](https://www.cs.rutgers.edu/~chvatal/linear.html)

---

### constraint-satisfaction-solver

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [google/or-tools](https://github.com/google/or-tools) | CP-SAT solver | 11k+ | C++/Python |
| [python-constraint](https://github.com/python-constraint/python-constraint) | Constraint satisfaction solver | 700+ | Python |
| [MiniZinc/libminizinc](https://github.com/MiniZinc/libminizinc) | Constraint modeling language | 500+ | C++ |
| [optaplanner](https://github.com/kiegroup/optaplanner) | Constraint solver (Java) | 3.4k+ | Java |
| [timefold-solver](https://github.com/TimefoldAI/timefold-solver) | Planning optimization | 1k+ | Java |

#### Python Packages
```bash
pip install ortools python-constraint minizinc
```

#### Key Resources
- [Constraint Programming (Handbook)](https://www.elsevier.com/books/handbook-of-constraint-programming/rossi/978-0-444-52726-4)
- [MiniZinc Documentation](https://www.minizinc.org/)

---

### genetic-algorithm-optimizer

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [DEAP/deap](https://github.com/DEAP/deap) | Distributed Evolutionary Algorithms | 5.7k+ | Python |
| [pymoo-dev/pymoo](https://github.com/anyoptimization/pymoo) | Multi-objective optimization | 2.2k+ | Python |
| [geneticalgorithm2](https://github.com/PasaOpaworasa/geneticalgorithm2) | Simple genetic algorithm | 200+ | Python |
| [PlatEMO](https://github.com/BIMK/PlatEMO) | Evolutionary multi-objective platform | 1.5k+ | MATLAB |
| [pagmo2](https://github.com/esa/pagmo2) | Parallel global multiobjective optimizer | 300+ | C++/Python |

#### Python Packages
```bash
pip install deap pymoo geneticalgorithm2 pygmo
```

#### Key Resources
- [DEAP Documentation](https://deap.readthedocs.io/)
- [pymoo Documentation](https://pymoo.org/)
- [Evolutionary Computation (De Jong)](https://mitpress.mit.edu/9780262041942/evolutionary-computation/)

---

## Knowledge Management Skills References

### decision-journal

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [obsidianmd](https://github.com/obsidianmd/obsidian-releases) | Knowledge management tool | 8k+ | Multiple |
| [logseq/logseq](https://github.com/logseq/logseq) | Knowledge management | 32k+ | Clojure |
| [notion-sdk-py](https://github.com/ramnes/notion-sdk-py) | Notion API client | 500+ | Python |
| [joplin/joplin](https://github.com/laurent22/joplin) | Note taking and to-do | 45k+ | TypeScript |

#### Python Packages
```bash
pip install markdown sqlite3 pandas jinja2 notion-client
```

#### Key Resources
- [Decision Journal Template (Farnam Street)](https://fs.blog/decision-journal/)
- [The Great Mental Models](https://fs.blog/tgmm/)

---

### competitive-intelligence-tracker

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [scrapy/scrapy](https://github.com/scrapy/scrapy) | Web scraping framework | 52k+ | Python |
| [beautiful-soup](https://github.com/waylan/beautifulsoup) | HTML/XML parsing | - | Python |
| [feedparser](https://github.com/kurtmckee/feedparser) | RSS/Atom feed parser | 1.9k+ | Python |
| [newspaper3k](https://github.com/codelucas/newspaper) | News article extraction | 14k+ | Python |
| [Playwright](https://github.com/microsoft/playwright-python) | Browser automation | 12k+ | Python |

#### Python Packages
```bash
pip install scrapy beautifulsoup4 feedparser newspaper3k playwright requests
```

#### Key Resources
- [SCIP: Competitive Intelligence](https://www.scip.org/)
- [Competitive Intelligence (Fleisher & Bensoussan)](https://www.pearson.com/en-us/subject-catalog/p/strategic-and-competitive-analysis-methods-and-techniques-for-analyzing-business-competition/P200000005867)

---

### market-research-aggregator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [pandas-dev/pandas](https://github.com/pandas-dev/pandas) | Data manipulation | 43k+ | Python |
| [requests/requests](https://github.com/psf/requests) | HTTP library | 52k+ | Python |
| [yahoo-finance](https://github.com/ranaroussi/yfinance) | Market data | 13k+ | Python |
| [FRED-api](https://github.com/mortada/fredapi) | Federal Reserve economic data | 700+ | Python |
| [world-bank-data](https://github.com/mwouts/world_bank_data) | World Bank indicators | 100+ | Python |

#### Python Packages
```bash
pip install pandas requests yfinance fredapi wbgapi
```

#### Key Resources
- [Statista](https://www.statista.com/)
- [FRED Economic Data](https://fred.stlouisfed.org/)
- [World Bank Open Data](https://data.worldbank.org/)

---

## Collaboration and Process Skills References

### stakeholder-preference-elicitor

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [surveyjs/survey-library](https://github.com/surveyjs/survey-library) | Survey/form library | 4.1k+ | TypeScript |
| [formik/formik](https://github.com/jaredpalmer/formik) | Form handling React | 34k+ | TypeScript |
| [react-hook-form](https://github.com/react-hook-form/react-hook-form) | Form validation | 41k+ | TypeScript |
| [Typeform SDK](https://github.com/Typeform) | Form and survey | - | Multiple |

#### Python Packages
```bash
pip install pandas scipy wtforms flask-wtf
```

#### npm Packages
```bash
npm install survey-core survey-react formik
```

#### Key Resources
- [Value-Focused Thinking (Keeney)](https://www.hup.harvard.edu/catalog.php?isbn=9780674931985)

---

### pre-mortem-facilitator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [Miro SDK](https://github.com/miroapp/miro-api-clients) | Collaboration board API | 100+ | TypeScript |
| [MURAL API](https://github.com/MURAL) | Visual collaboration | - | Multiple |

#### Python Packages
```bash
pip install markdown jinja2 pandas
```

#### Key Resources
- [Pre-Mortem Technique (Gary Klein)](https://hbr.org/2007/09/performing-a-project-premortem)
- [Thinking, Fast and Slow (Kahneman)](https://www.amazon.com/Thinking-Fast-Slow-Daniel-Kahneman/dp/0374533555)

---

### scenario-narrative-generator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [openai/openai-python](https://github.com/openai/openai-python) | OpenAI API client | 22k+ | Python |
| [anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python) | Anthropic API client | 1.5k+ | Python |
| [langchain](https://github.com/langchain-ai/langchain) | LLM application framework | 92k+ | Python |
| [llama-index](https://github.com/run-llama/llama_index) | Data framework for LLMs | 35k+ | Python |

#### Python Packages
```bash
pip install openai anthropic langchain llama-index jinja2 markdown
```

#### Key Resources
- [The Art of the Long View (Schwartz)](https://www.amazon.com/Art-Long-View-Planning-Uncertain/dp/0385267320)
- [Scenario Planning (Ringland)](https://www.wiley.com/en-us/Scenario+Planning%3A+Managing+for+the+Future%2C+2nd+Edition-p-9780470018071)

---

### calibration-trainer

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [PredictionBook](https://github.com/tricycle/predictionbook) | Prediction tracking | 200+ | Ruby |
| [Metaculus](https://github.com/Metaculus) | Forecasting platform | - | Multiple |
| [calibration](https://github.com/oughtinc/calibration) | Calibration utilities | - | Python |

#### Python Packages
```bash
pip install numpy matplotlib scikit-learn
```

#### Key Resources
- [Superforecasting (Tetlock)](https://www.amazon.com/Superforecasting-Science-Prediction-Philip-Tetlock/dp/0804136718)
- [Good Judgment Open](https://www.gjopen.com/)

---

### hypothesis-tracker

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [hypothesis-python](https://github.com/HypothesisWorks/hypothesis) | Property-based testing | 7.5k+ | Python |
| [sqlite3](https://www.sqlite.org/) | Lightweight database | - | C |
| [Notion SDK](https://github.com/ramnes/notion-sdk-py) | Knowledge management API | 500+ | Python |

#### Python Packages
```bash
pip install pandas sqlite3 markdown jinja2
```

#### Key Resources
- [The Lean Startup (Ries)](https://www.amazon.com/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898)
- [Hypothesis-Driven Development](https://barryoreilly.com/explore/blog/how-to-implement-hypothesis-driven-development/)

---

### war-game-orchestrator

#### GitHub Repositories
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [Miro SDK](https://github.com/miroapp/miro-api-clients) | Collaboration board API | 100+ | TypeScript |
| [discord.py](https://github.com/Rapptz/discord.py) | Discord API wrapper | 14k+ | Python |
| [slack-sdk](https://github.com/slackapi/python-slack-sdk) | Slack API | 2.7k+ | Python |

#### Python Packages
```bash
pip install slack-sdk discord.py markdown jinja2
```

#### Key Resources
- [Business War Games (Oriesek & Schwarz)](https://www.mheducation.com/highered/product/business-war-games-oriesek-schwarz/M9780071475211.html)
- [Red Team (Zenko)](https://www.amazon.com/Red-Team-Succeed-Thinking-Enemy/dp/0465048943)

---

## Agent Framework References

### Multi-Agent Frameworks

| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | LLM application framework | 92k+ | Python |
| [microsoft/autogen](https://github.com/microsoft/autogen) | Multi-agent conversation framework | 31k+ | Python |
| [crewai](https://github.com/joaomdmoura/crewAI) | Framework for orchestrating agents | 20k+ | Python |
| [llama-index](https://github.com/run-llama/llama_index) | Data framework for LLM apps | 35k+ | Python |
| [griptape-ai/griptape](https://github.com/griptape-ai/griptape) | Enterprise AI framework | 2k+ | Python |
| [Semantic Kernel](https://github.com/microsoft/semantic-kernel) | Microsoft's AI orchestration | 21k+ | C#/Python |
| [haystack](https://github.com/deepset-ai/haystack) | LLM orchestration framework | 17k+ | Python |
| [DSPy](https://github.com/stanfordnlp/dspy) | Programming with foundation models | 17k+ | Python |

### Agent Development Packages
```bash
pip install langchain autogen crewai llama-index griptape semantic-kernel haystack-ai dspy-ai
```

### Key Resources
- [AutoGen Documentation](https://microsoft.github.io/autogen/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [LangChain Agents](https://python.langchain.com/docs/modules/agents/)

---

## MCP Server References

### Model Context Protocol (MCP) Servers

MCP servers provide standardized interfaces for AI agents to interact with external tools and data sources.

#### Official MCP Resources
| Resource | Description | URL |
|----------|-------------|-----|
| MCP Specification | Protocol specification | https://spec.modelcontextprotocol.io |
| MCP TypeScript SDK | Official TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk |
| MCP Python SDK | Official Python SDK | https://github.com/modelcontextprotocol/python-sdk |
| MCP Servers | Official MCP server implementations | https://github.com/modelcontextprotocol/servers |

#### Relevant MCP Servers for Decision Intelligence

| MCP Server | Description | Use Case |
|------------|-------------|----------|
| **filesystem** | File system operations | Decision journal storage, report generation |
| **postgres** | PostgreSQL database | KPI tracking, decision logging |
| **sqlite** | SQLite database | Local decision archives |
| **fetch** | Web content fetching | Competitive intelligence gathering |
| **puppeteer** | Browser automation | Market data scraping |
| **sequential-thinking** | Step-by-step reasoning | Complex decision analysis |
| **memory** | Persistent memory | Cross-session decision context |
| **time** | Time operations | Scheduling, deadline tracking |
| **brave-search** | Web search | Market research, competitor monitoring |
| **google-drive** | Google Drive integration | Document management |
| **slack** | Slack integration | Team collaboration |
| **github** | GitHub integration | Decision documentation versioning |
| **linear** | Linear integration | Decision task tracking |

#### Custom MCP Servers for Decision Intelligence

Consider building custom MCP servers for:

1. **mcp-decision-tree** - Decision tree construction and evaluation
2. **mcp-monte-carlo** - Monte Carlo simulation execution
3. **mcp-mcda** - Multi-criteria decision analysis methods
4. **mcp-forecasting** - Time series forecasting
5. **mcp-optimization** - Mathematical optimization solver interface
6. **mcp-risk-analysis** - Risk quantification and VaR calculation
7. **mcp-competitive-intel** - Competitive intelligence aggregation
8. **mcp-kpi-dashboard** - KPI tracking and alerting

#### MCP Server Development Resources
```bash
npm install @modelcontextprotocol/sdk
pip install mcp
```

---

## Community Resources

### Academic and Research

| Resource | Description | URL |
|----------|-------------|-----|
| Decision Analysis Society | INFORMS community | https://connect.informs.org/das/home |
| MCDM Society | Multi-criteria decision making | https://www.mcdmsociety.org/ |
| Society for Judgment and Decision Making | Research society | https://sjdm.org/ |
| Behavioral Economics Guide | Annual publication | https://www.behavioraleconomics.com/be-guide/ |
| SSRN Decision Science | Research papers | https://www.ssrn.com/index.cfm/en/decision-science/ |

### Professional Communities

| Community | Description | URL |
|-----------|-------------|-----|
| Analytics Vidhya | Data science community | https://www.analyticsvidhya.com/ |
| Towards Data Science | Medium publication | https://towardsdatascience.com/ |
| KDnuggets | Data science and ML news | https://www.kdnuggets.com/ |
| Data Science Central | Community platform | https://www.datasciencecentral.com/ |
| Reddit r/datascience | Discussion forum | https://www.reddit.com/r/datascience/ |
| Reddit r/analytics | Analytics discussion | https://www.reddit.com/r/analytics/ |
| Stack Overflow | Q&A for developers | https://stackoverflow.com/ |

### Training and Courses

| Course | Provider | Topic |
|--------|----------|-------|
| Decision Quality | SDG | Decision analysis |
| Data Science Specialization | Coursera/JHU | Analytics foundation |
| Machine Learning | Coursera/Stanford | Predictive analytics |
| Causal Inference | Coursera/Columbia | Causal analysis |
| Operations Research | edX/MIT | Optimization |
| Business Analytics | edX/Columbia | BI fundamentals |
| Strategic Decision-Making | Coursera/IESE | Business strategy |

### Books and Publications

| Title | Author | Topic |
|-------|--------|-------|
| Smart Choices | Hammond, Keeney, Raiffa | Decision making |
| Thinking, Fast and Slow | Kahneman | Cognitive biases |
| Superforecasting | Tetlock, Gardner | Forecasting |
| The Signal and the Noise | Silver | Prediction |
| Competing on Analytics | Davenport, Harris | Business analytics |
| Good Strategy Bad Strategy | Rumelt | Strategic thinking |
| How to Measure Anything | Hubbard | Quantification |
| Decision Quality | Spetzler, Winter, Meyer | Decision analysis |

### Industry Reports and Standards

| Resource | Description |
|----------|-------------|
| Gartner Analytics | Industry research and magic quadrants |
| Forrester Analytics | Wave reports and research |
| IDC Analytics | Market research |
| ISO 31000 | Risk management standard |
| COSO ERM | Enterprise risk management framework |
| PMBOK Guide | Project decision-making |
| BABOK Guide | Business analysis body of knowledge |

### Open Data Sources

| Source | Description | URL |
|--------|-------------|-----|
| Kaggle Datasets | Competition and practice data | https://www.kaggle.com/datasets |
| UCI ML Repository | Classic ML datasets | https://archive.ics.uci.edu/ml/ |
| Google Dataset Search | Dataset discovery | https://datasetsearch.research.google.com/ |
| data.gov | US government data | https://data.gov/ |
| World Bank Open Data | Global development data | https://data.worldbank.org/ |
| FRED | Federal Reserve economic data | https://fred.stlouisfed.org/ |
| Eurostat | European statistics | https://ec.europa.eu/eurostat |
| Our World in Data | Global statistics | https://ourworldindata.org/ |

---

## Integration Guidelines

### Recommended Technology Stack

#### Core Python Stack
```bash
# Data Processing
pip install pandas polars numpy scipy

# Visualization
pip install plotly bokeh matplotlib altair streamlit

# Machine Learning
pip install scikit-learn xgboost lightgbm

# Time Series
pip install prophet statsforecast darts sktime

# Optimization
pip install ortools pulp pyomo cvxpy

# MCDM
pip install pyDecision pymcdm ahpy

# Simulation
pip install pymc SALib mesa

# Causal Inference
pip install econml dowhy causalml

# LLM Integration
pip install langchain openai anthropic
```

#### Core Node.js Stack
```bash
npm install d3 chart.js plotly.js
npm install @modelcontextprotocol/sdk
npm install survey-core
npm install javascript-lp-solver
```

### Architecture Recommendations

1. **Modular Design**: Each skill should be a standalone module with clear interfaces
2. **Async Support**: All skills should support asynchronous execution
3. **Caching**: Implement caching for expensive computations
4. **Logging**: Comprehensive logging for auditability
5. **Error Handling**: Robust error handling with meaningful messages
6. **Testing**: Unit tests and integration tests for all skills
7. **Documentation**: OpenAPI/JSON Schema for skill interfaces
8. **Versioning**: Semantic versioning for all components

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01 | 1.0.0 | Initial release - Phase 5 completion |

---

*Last updated: January 2026*

*Note: This reference document should be updated regularly as new tools, libraries, and resources become available. Links should be verified periodically for accuracy.*
