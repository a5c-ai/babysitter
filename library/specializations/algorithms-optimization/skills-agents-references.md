# Algorithms and Optimization: Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, MCPs, and related tools that can enhance or implement the skills and agents identified in the Algorithms and Optimization specialization backlog.

## Overview

**Specialization:** algorithms-optimization
**Phase:** 5 - Skills and Agents References
**Reference Date:** 2026-01-24
**Total References Found:** 78
**Categories Covered:** 12

---

## 1. LeetCode and Competitive Programming Platform Integration

### MCP Servers

#### LeetCode MCP Server by jinzcdev
- **URL:** https://github.com/jinzcdev/leetcode-mcp-server
- **Type:** MCP Server
- **Installation:** `claude mcp add-json "leetcode" '{"type":"stdio","command":"npx","args":["-y","@jinzcdev/leetcode-mcp-server","--site","global"]}'`
- **Features:**
  - get_daily_challenge - Fetch daily LeetCode challenge
  - get_problem - Retrieve problem by titleSlug
  - search_problems - Filter by category, tags, difficulty, keywords
  - get_user_profile - Access user data
  - get_user_contest_ranking - Track contest performance
- **Supports:** leetcode.com and leetcode.cn
- **Enhances Skills:** SK-ALGO-001 (leetcode-problem-fetcher)
- **Reference:** https://playbooks.com/mcp/jinzcdev-leetcode

#### LeetCode MCP Server by doggybee
- **URL:** https://github.com/doggybee/mcp-server-leetcode
- **Type:** MCP Server
- **Features:**
  - Access LeetCode problems via GraphQL
  - User information retrieval
  - Contest data access
- **Enhances Skills:** SK-ALGO-001 (leetcode-problem-fetcher)
- **Reference:** https://mcp.so/server/leetcode/doggybee

### Browser Extensions

#### Competitive Companion
- **URL:** https://github.com/jmerle/competitive-companion
- **Type:** Browser Extension (Chrome/Firefox)
- **Features:**
  - Parses problems from 116+ online judges
  - Supports Codeforces, AtCoder, LeetCode, SPOJ, and more
  - Sends parsed data to IDEs and tools
- **Enhances Skills:** SK-ALGO-001, SK-ALGO-002, SK-ALGO-003

### VS Code Extensions

#### Competitive Programming Helper (CPH)
- **URL:** https://github.com/agrawal-d/cph
- **Type:** VS Code Extension
- **Features:**
  - Fetch problems with one click
  - Automatic test case comparison
  - Supports multiple languages
- **Documentation:** https://agrawal-d.com/cph/
- **Enhances Skills:** SK-ALGO-001, SK-ALGO-002, SK-ALGO-005

#### ICIE - Competitive Programming IDE
- **URL:** https://github.com/unneon/icie
- **Type:** VS Code Extension
- **Features:**
  - Complete CP workflow support
  - Supports Codeforces, AtCoder, CodeChef, SPOJ
  - Template code management
  - Automatic testing and submission
- **Enhances Skills:** SK-ALGO-002, SK-ALGO-003, SK-ALGO-005

---

## 2. Algorithm Visualization Tools

### Manim-Based Visualizers

#### manim-dsa
- **URL:** https://github.com/F4bbi/manim-dsa
- **Type:** Manim Plugin
- **Features:**
  - Animate common data structures
  - Algorithm step-by-step visualization
  - MIT License
- **Enhances Skills:** SK-ALGO-007 (algorithm-visualizer)

#### ManimSort
- **URL:** https://github.com/VashLT/ManimSort
- **Type:** Manim Project
- **Features:**
  - Sorting algorithm animations
  - Visual understanding of algorithm procedures
- **Enhances Skills:** SK-ALGO-007 (algorithm-visualizer)

#### ManimGraphLibrary
- **URL:** https://verdianapasqualini.github.io/ManimGraphLibrary/
- **Type:** Python Library (Manim-based)
- **Features:**
  - Graph creation and visualization
  - Graph algorithm animations
- **Enhances Skills:** SK-ALGO-007, SK-ALGO-013 (graph-modeler)

#### Dijkstra Algorithm Visualization
- **URL:** https://github.com/embiekhochiu/dijkstra-algo-explain-visual
- **Type:** Educational Project
- **Features:**
  - Dijkstra algorithm visualization with Manim
  - Google Colab compatible
- **Enhances Skills:** SK-ALGO-007, SK-ALGO-014

### Web-Based Visualizers

#### Algorithm Visualizer
- **URL:** https://github.com/algorithm-visualizer/algorithm-visualizer
- **Type:** Web Application
- **Features:**
  - Interactive online platform
  - Supports multiple programming languages
  - Community-contributed algorithms
- **Website:** https://algorithm-visualizer.org/
- **Enhances Skills:** SK-ALGO-007 (algorithm-visualizer)

#### DatAlgo
- **URL:** https://github.com/anmolkumarshah/DatAlgo
- **Type:** Web Application
- **Features:**
  - Data structure visualization
  - Algorithm visualization
  - Single platform for DSA learning
- **Enhances Skills:** SK-ALGO-007 (algorithm-visualizer)

#### Data Structure Visualizer (JavaFX)
- **URL:** https://github.com/JM233333/data-structure-visualizer
- **Type:** Desktop Application
- **Features:**
  - Interactive visualization
  - Extensible architecture
  - Basic to advanced data structures
- **Enhances Skills:** SK-ALGO-007 (algorithm-visualizer)

---

## 3. Dynamic Programming Tools

### DP Visualization

#### dpvis
- **URL:** https://arxiv.org/html/2411.07705v1
- **Type:** Python Library
- **Features:**
  - Step-by-step DP visualization
  - Interactive self-testing
  - Customization for instructors
  - 1D and 2D DP algorithm support
- **Enhances Skills:** SK-ALGO-007, SK-ALGO-010 (dp-state-designer)

#### Dynamic Programming Visualization (debkbanerji)
- **URL:** https://github.com/debkbanerji/dynamic-programming-visualization
- **Type:** Web Application
- **Website:** https://dp.debkbanerji.com/
- **Features:**
  - In-browser visualization
  - Bottom-up and top-down solutions
- **Enhances Skills:** SK-ALGO-007, SK-ALGO-010

#### DP Visualizer (EasyHard)
- **URL:** https://github.com/EasyHard/dpv
- **Website:** https://easyhard.github.io/dpv/
- **Type:** Web Application
- **Features:**
  - JavaScript-based DP visualization
  - Multiple visualization modes (BFS, Topo, Program order)
- **Enhances Skills:** SK-ALGO-007, SK-ALGO-010

#### DP Visualizer (Commercial)
- **URL:** https://www.dpvisualizer.com/
- **Type:** Web Application
- **Features:**
  - Interactive DP learning
  - Step-by-step breakdowns
  - Intuitive animations
- **Enhances Skills:** SK-ALGO-007, SK-ALGO-010

### DP Patterns and Learning

#### Dynamic Programming Patterns
- **URL:** https://github.com/aatalyk/Dynamic-Programming-Patterns
- **Type:** Learning Resource
- **Features:**
  - Categorized DP patterns from 140+ problems
  - Patterns: Min/Max Path, Distinct Ways, Merging Intervals, DP on Strings, Decision Making
- **Enhances Skills:** SK-ALGO-012 (dp-pattern-library)

---

## 4. Competitive Programming Libraries

### C++ Libraries

#### KACTL (KTH Algorithm Competition Template Library)
- **URL:** https://github.com/kth-competitive-programming/kactl
- **Type:** C++ Template Library
- **Features:**
  - 25 pages of copy-pasteable C++ code
  - ICPC-tested algorithms
  - Well-documented and tested
- **Enhances Skills:** SK-ALGO-005, SK-ALGO-017, SK-ALGO-018, SK-ALGO-021

#### cplib-cpp
- **URL:** https://github.com/hitonanode/cplib-cpp
- **Type:** C++ Library
- **Features:**
  - Comprehensive CP algorithms
  - MIT License for contest use
  - Generic implementations
- **Enhances Skills:** SK-ALGO-005 (code-template-manager)

#### Competitive Programming Library (mochow13)
- **URL:** https://github.com/mochow13/competitive-programming-library
- **Type:** C++ Library
- **Features:**
  - Templates, algorithms, data structures
  - Tested on multiple problems
- **Enhances Skills:** SK-ALGO-005 (code-template-manager)

#### cp-library (dgcnz)
- **URL:** https://github.com/dgcnz/cp-library
- **Type:** C++ Library
- **Features:**
  - AtCoder Library-style implementations
  - Generic and complete implementations
- **Enhances Skills:** SK-ALGO-005 (code-template-manager)

### Multi-Language Libraries

#### Competitive-Coding (likecs)
- **URL:** https://github.com/likecs/Competitive-Coding
- **Type:** Multi-language (C, C++, Python)
- **Features:**
  - Templates for DSA
  - Complexity annotations
  - Direct contest use
- **Enhances Skills:** SK-ALGO-005 (code-template-manager)

#### CP-Templates (7oSkaaa)
- **URL:** https://github.com/7oSkaaa/CP-Templates
- **Type:** C++ Templates
- **Features:**
  - Ready-to-use competitive programming templates
- **Enhances Skills:** SK-ALGO-005 (code-template-manager)

---

## 5. Code Analysis and Complexity Tools

### MCP Servers for Code Analysis

#### Code Analysis MCP (saiprashanths)
- **URL:** https://github.com/saiprashanths/code-analysis-mcp
- **Type:** MCP Server
- **Features:**
  - Natural language code exploration
  - Deep code understanding
  - Dynamic analysis and data flow tracing
- **Enhances Skills:** SK-ALGO-006 (complexity-analyzer)

#### Code Analysis MCP (kaleido34)
- **URL:** https://github.com/kaleido34/code-analysis-mcp
- **Type:** MCP Server
- **Features:**
  - LOC and cyclomatic complexity calculation
  - Project structure reports
- **Enhances Skills:** SK-ALGO-006 (complexity-analyzer)

#### AST MCP Server
- **URL:** https://github.com/angrysky56/ast-mcp-server
- **Type:** MCP Server
- **Features:**
  - Abstract Syntax Tree parsing
  - Abstract Semantic Graph generation
  - Code structure and complexity analysis
  - AST diff for version comparison
- **Enhances Skills:** SK-ALGO-006 (complexity-analyzer), SK-ALGO-027 (invariant-analyzer)

#### MCP Reasoner
- **URL:** https://github.com/Jacck/mcp-reasoner
- **Type:** MCP Server
- **Features:**
  - Beam Search reasoning
  - Monte Carlo Tree Search (MCTS)
  - Reasoning path tracking
- **Enhances Skills:** SK-ALGO-006, SK-ALGO-027, SK-ALGO-028

### Web-Based Complexity Analyzers

#### Big-O-Calculator
- **URL:** https://github.com/DmelladoH/Big-O-Calculator
- **Type:** Web Application
- **Features:**
  - AI-powered complexity analysis
  - Automatic Big O notation determination
  - Time and space complexity insights
- **Enhances Skills:** SK-ALGO-006 (complexity-analyzer)

#### TimeComplexityCalculator
- **URL:** https://github.com/abhinav2712/TimeComplexityCalculator
- **Type:** Web Application
- **Features:**
  - Loop-based complexity estimation
  - Big O notation output
- **Enhances Skills:** SK-ALGO-006 (complexity-analyzer)

#### TimeComplexity.ai
- **URL:** https://www.timecomplexity.ai/
- **Type:** Web Service
- **Features:**
  - AI-powered runtime complexity analysis
  - Supports all major languages
  - Handles partial/incomplete code
- **Enhances Skills:** SK-ALGO-006 (complexity-analyzer)

---

## 6. Test Case Generation and Stress Testing

### Stress Testing Tools

#### Competitive Programming Stress Testing (mrsac7)
- **URL:** https://github.com/mrsac7/Competitive-Programming-Stress-Testing
- **Type:** Windows Tool
- **Features:**
  - Random test case generation
  - Brute force comparison
  - Automatic mismatch detection
- **Enhances Skills:** SK-ALGO-008 (test-case-generator)

#### Stress Testing (7oSkaaa)
- **URL:** https://github.com/7oSkaaa/Stress_Testing
- **Type:** Cross-platform Tool
- **Features:**
  - Modular generators (numbers, arrays, strings, graphs)
  - Cross-platform (macOS, Linux, Windows)
  - Correctness and efficiency verification
- **Enhances Skills:** SK-ALGO-008 (test-case-generator)

#### Stress Testing Bash Script (bhupixb)
- **URL:** https://github.com/bhupixb/Stress-Testing-bash-script
- **Type:** Bash Script
- **Features:**
  - gen_array(), gen_tree(), gen_simple_graph() functions
  - Automatic test case generation
  - Brute force comparison
- **Enhances Skills:** SK-ALGO-008 (test-case-generator)

### Test Case Generators

#### QuickTest CLI
- **URL:** https://github.com/LuchoBazz/quicktest
- **Type:** CLI Tool
- **Features:**
  - `qt cmp` - Compare against brute force
  - `qt stress` - Time limit verification
  - Cross-platform support
- **Enhances Skills:** SK-ALGO-008 (test-case-generator), SK-ALGO-009 (solution-comparator)

#### Test Case Generator (Tanmay-901)
- **URL:** https://github.com/Tanmay-901/test-case-generator
- **Type:** Web Tool
- **Features:**
  - Arrays, strings, char patterns
  - Copy, regenerate, change constraints
  - User-friendly interface
- **Enhances Skills:** SK-ALGO-008 (test-case-generator)

---

## 7. Interview Preparation Resources

### MCP Servers

#### InterviewReady MCP Server
- **URL:** https://github.com/InterviewReady/mcp-server
- **Type:** MCP Server
- **Features:**
  - Fetch relevant interview content
  - Access blogs, resources, course materials
  - Note-taking integration
  - Google reminder integration
- **Enhances Skills:** SK-ALGO-024 (interview-problem-bank)

### AI Mock Interview Tools

#### AI Mock Interviewer (IliaLarchenko)
- **URL:** https://github.com/IliaLarchenko/Interviewer
- **Type:** Web Application
- **Features:**
  - Speech-first interface
  - Supports GPT-3.5, GPT-4, Claude models
  - Coding and system design interviews
  - Speech-to-text and text-to-speech
- **Enhances Skills:** SK-ALGO-025 (interview-simulator), AG-ALGO-008 (technical-interviewer)

#### Liftoff Mock Interview Simulator
- **URL:** https://github.com/Tameyer41/liftoff
- **Type:** Web Application
- **Features:**
  - AI-powered feedback
  - Video processing with FFmpeg
  - Vercel deployment ready
- **Enhances Skills:** SK-ALGO-025 (interview-simulator)

#### MockMate
- **URL:** https://github.com/Cleveridiot07/MockMate
- **Type:** Web Application
- **Features:**
  - Tailored technical questions by role/company
  - Real-time interactions
  - Structured feedback
  - Performance tracking
- **Enhances Skills:** SK-ALGO-025 (interview-simulator), AG-ALGO-008 (technical-interviewer)

#### AI Mock Interview (adrianhajdin/Prepwise)
- **URL:** https://github.com/adrianhajdin/ai_mock_interviews
- **Type:** Web Application
- **Features:**
  - Real-time AI voice agents (Vapi AI)
  - Personalized prep sessions
  - Next.js + Firebase
- **Enhances Skills:** SK-ALGO-025 (interview-simulator)

### Interview Preparation Repositories

#### Tech Interview Handbook
- **URL:** https://github.com/yangshun/tech-interview-handbook
- **Type:** Learning Resource
- **Features:**
  - Comprehensive interview prep materials
  - By the author of Blind 75
  - All interview phases covered
- **Enhances Skills:** SK-ALGO-024 (interview-problem-bank), AG-ALGO-009 (interview-coach)

#### Coding Interview University
- **URL:** https://github.com/jwasham/coding-interview-university
- **Type:** Learning Resource
- **Features:**
  - Complete CS study plan
  - Multi-month preparation guide
  - FAANG-focused content
- **Enhances Skills:** SK-ALGO-024 (interview-problem-bank), AG-ALGO-015 (algorithm-teacher)

#### FAANG Coding Interview Questions
- **URL:** https://github.com/ombharatiya/FAANG-Coding-Interview-Questions
- **Type:** Problem Set
- **Features:**
  - NeetCode 150
  - Blind 75
  - Company-specific questions
- **Enhances Skills:** SK-ALGO-024 (interview-problem-bank)

#### neerazz/FAANG
- **URL:** https://github.com/neerazz/FAANG
- **Type:** Solution Repository
- **Features:**
  - Well-commented solutions
  - DSA, System Design, OOP coverage
  - Step-by-step explanations
- **Enhances Skills:** SK-ALGO-024, SK-ALGO-026 (solution-explainer)

#### Interviews (kdn251)
- **URL:** https://github.com/kdn251/interviews
- **Type:** Learning Resource
- **Features:**
  - Comprehensive interview prep
  - Data structures focus
- **Enhances Skills:** SK-ALGO-024 (interview-problem-bank)

---

## 8. LeetCode Solution Resources

### Comprehensive Solution Repositories

#### LeetCode-Solutions (kamyu104)
- **URL:** https://github.com/kamyu104/LeetCode-Solutions
- **Type:** Solution Repository
- **Features:**
  - Python/C++ solutions for 3800+ problems
  - Weekly updates
  - Full problem coverage
- **Enhances Skills:** SK-ALGO-026 (solution-explainer), AG-ALGO-001

#### wisdompeak/LeetCode
- **URL:** https://github.com/wisdompeak/LeetCode
- **Type:** Solution Repository
- **Features:**
  - Medium+ problems with explanations
  - C++/Python implementations
  - Problems attempted multiple times labeled
- **Enhances Skills:** SK-ALGO-026 (solution-explainer)

#### Awesome LeetCode Resources
- **URL:** https://github.com/ashishps1/awesome-leetcode-resources
- **Type:** Curated List
- **Features:**
  - DSA learning resources
  - Interview preparation materials
  - Categorized content
- **Enhances Skills:** SK-ALGO-024 (interview-problem-bank)

---

## 9. Graph Algorithm Tools

### Graph Visualization

#### Dijkstra Algorithm Visualizer
- **URL:** https://github.com/harshitpandey08/Dijkstra-Algorithm-Visualizer
- **Type:** Python Application
- **Features:**
  - NetworkX + Matplotlib visualization
  - Interactive landmark input
  - Shortest path highlighting
- **Enhances Skills:** SK-ALGO-013 (graph-modeler), SK-ALGO-014

### Graph Libraries

#### NetworkX
- **URL:** https://networkx.org/
- **Type:** Python Library
- **Features:**
  - Comprehensive graph algorithms
  - BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Johnson
  - Visualization hooks (Matplotlib, GraphViz, VTK)
- **Documentation:** https://networkx.org/documentation/stable/reference/algorithms/shortest_paths.html
- **Enhances Skills:** SK-ALGO-013, SK-ALGO-014, SK-ALGO-015

#### Graphillion
- **URL:** https://github.com/takemaru/graphillion
- **Type:** Python Library
- **Features:**
  - Efficient graphset operations
  - Handles large sets of graphs
- **Enhances Skills:** SK-ALGO-013 (graph-modeler)

---

## 10. Data Structure Implementations

### Segment Tree and Fenwick Tree

#### Segment Tree with Lazy Propagation (Gist)
- **URL:** https://gist.github.com/shobhit6993/7088061
- **Type:** C++ Code
- **Features:**
  - Lazy propagation implementation
  - Tested on various problems
- **Enhances Skills:** SK-ALGO-017 (segment-tree-builder)

#### Segment Tree Repository (Rajamanickam1999)
- **URL:** https://github.com/Rajamanickam1999/Segment-Tree
- **Type:** C++ and Python
- **Features:**
  - Lazy propagation
  - Range minimum query
  - Range sum query
- **Enhances Skills:** SK-ALGO-017 (segment-tree-builder)

#### Fenwick Tree Lazy Propagation (Gist)
- **URL:** https://gist.github.com/overnew/a98c804eba958dccf5d085a876d6f629
- **Type:** Code Gist
- **Features:**
  - Lazy propagation for Fenwick Tree
- **Enhances Skills:** SK-ALGO-017

### Reference Documentation

#### CP-Algorithms: Segment Tree
- **URL:** https://cp-algorithms.com/data_structures/segment_tree.html
- **Type:** Documentation
- **Features:**
  - Comprehensive segment tree guide
  - Lazy propagation tutorial
  - Advanced variants
- **Enhances Skills:** SK-ALGO-017, SK-ALGO-018

---

## 11. Number Theory and String Algorithms

### Number Theory

#### Number-Theory (shiningflash)
- **URL:** https://github.com/shiningflash/Number-Theory
- **Type:** Algorithm Collection
- **Features:**
  - Sieve (regular, bitwise, segmented)
  - Modular arithmetic, Big Mod
  - Primality testing, CRT
- **Enhances Skills:** SK-ALGO-021, SK-ALGO-022

#### Number-Theory-Utils (hacatu)
- **URL:** https://github.com/hacatu/Number-Theory-Utils
- **Type:** C Library
- **Features:**
  - Factorization (trial division, Pollard's Rho, ECM)
  - Modular arithmetic routines
  - Miller-Rabin, Tonelli-Shanks
  - Chinese Remainder Theorem
- **Enhances Skills:** SK-ALGO-021, SK-ALGO-022

#### NTT Implementation
- **URL:** https://github.com/ZKNoxHQ/NTT
- **Type:** Library
- **Features:**
  - Number Theoretic Transform
  - Polynomial multiplication
  - Cryptography applications
- **Enhances Skills:** SK-ALGO-021 (FFT/NTT)

### String Algorithms

#### cpp-algorithm-snippets (LuchoBazz)
- **URL:** https://github.com/LuchoBazz/cpp-algorithm-snippets
- **Type:** C++ Snippets
- **Features:**
  - Suffix array (string_suffix_array)
  - KMP algorithm (string_kmp_std)
  - Prefix function
  - Rabin-Karp (string_rabin_karp_std)
  - Aho-Corasick
- **Enhances Skills:** SK-ALGO-019, SK-ALGO-020

---

## 12. Computational Geometry

### Comprehensive Libraries

#### Computational Geometry Unity (Habrador)
- **URL:** https://github.com/Habrador/Computational-geometry
- **Type:** Unity/C# Library
- **Features:**
  - Intersection algorithms
  - Delaunay triangulation
  - Voronoi diagrams
  - Polygon clipping
  - Convex hull (Jarvis March, Graham Scan)
  - Mesh simplification
- **Enhances Skills:** SK-ALGO-031, SK-ALGO-032

#### Convex Hull and Line Intersection
- **URL:** https://github.com/Jatin-Kesnani/Convex-Hull-and-Line-Intersection-Algorithms
- **Type:** Algorithm Collection
- **Features:**
  - 5 convex hull algorithms
  - 3 line intersection methods
- **Enhances Skills:** SK-ALGO-031, SK-ALGO-032

#### Convex Hull C++
- **URL:** https://github.com/ThomasThelen/Convex-Hull
- **Type:** C++ Library
- **Features:**
  - Polygon convex hull computation
- **Enhances Skills:** SK-ALGO-031

---

## 13. Educational Resources and Documentation

### CP-Algorithms (e-maxx-eng)
- **URL:** https://github.com/cp-algorithms/cp-algorithms
- **Website:** https://cp-algorithms.com/
- **Type:** Documentation Site
- **Features:**
  - Comprehensive algorithm descriptions
  - Data structure implementations
  - Translated from Russian e-maxx.ru
  - Auxiliary library: https://lib.cp-algorithms.com/
- **Enhances:** All algorithm-related skills

### CSES Problem Set
- **URL:** https://cses.fi/problemset
- **Type:** Practice Platform
- **Features:**
  - High-quality competitive programming problems
  - Progressive difficulty
  - Comprehensive topic coverage
- **Enhances Skills:** SK-ALGO-004 (cses-tracker)

### Competitive Programmer's Handbook
- **URL:** https://github.com/pllk/cphb
- **Type:** Book/PDF
- **Features:**
  - Modern CP introduction
  - Programming tricks
  - Algorithm design techniques
  - Pairs with CSES Problem Set
- **Enhances Skills:** All algorithm-related skills, AG-ALGO-015 (algorithm-teacher)

### CSES Solutions Repositories
- **[Jonathan-Uy/CSES-Solutions](https://github.com/Jonathan-Uy/CSES-Solutions)** - 320+ accepted solutions
- **[mdmzfzl/CSES-Solutions](https://github.com/mdmzfzl/CSES-Solutions)** - C++ implementations
- **[Lulzx/cses](https://github.com/Lulzx/cses)** - Practice problem solutions
- **Enhances Skills:** SK-ALGO-004 (cses-tracker), SK-ALGO-026 (solution-explainer)

---

## 14. Claude Code Plugins and Skills

### General Development Skills

#### Claude Code Plugin Registry
- **URL:** https://claude-plugins.dev/
- **Type:** Plugin Registry
- **Features:**
  - Community plugin discovery
  - CLI installation tool
  - Slash commands, subagents, MCP servers
- **Relevant Plugins:**
  - unit-test-generator
  - bug-detective
  - debugger
  - performance-benchmarker
  - python-expert

#### Awesome Claude Skills
- **URL:** https://github.com/ComposioHQ/awesome-claude-skills
- **Type:** Curated List
- **Features:**
  - Skill Creator guidance
  - Software Architecture patterns
  - Test-Driven Development
  - Prompt Engineering
- **Enhances:** General development workflow

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **MCP Servers** | 8 |
| **Browser Extensions** | 1 |
| **VS Code Extensions** | 2 |
| **Visualization Tools** | 12 |
| **CP Libraries** | 8 |
| **Stress Testing Tools** | 5 |
| **Interview Prep Resources** | 12 |
| **Solution Repositories** | 6 |
| **Graph Tools** | 3 |
| **Data Structure Implementations** | 4 |
| **Number Theory/String Libraries** | 4 |
| **Computational Geometry** | 3 |
| **Educational Resources** | 10 |
| **Total References** | 78 |
| **Categories Covered** | 12 |

---

## Skill Coverage Matrix

| Skill ID | Skill Name | References Found |
|----------|------------|------------------|
| SK-ALGO-001 | leetcode-problem-fetcher | 4 |
| SK-ALGO-002 | codeforces-api-client | 3 |
| SK-ALGO-003 | atcoder-client | 2 |
| SK-ALGO-004 | cses-tracker | 5 |
| SK-ALGO-005 | code-template-manager | 7 |
| SK-ALGO-006 | complexity-analyzer | 7 |
| SK-ALGO-007 | algorithm-visualizer | 10 |
| SK-ALGO-008 | test-case-generator | 5 |
| SK-ALGO-009 | solution-comparator | 2 |
| SK-ALGO-010 | dp-state-designer | 5 |
| SK-ALGO-012 | dp-pattern-library | 2 |
| SK-ALGO-013 | graph-modeler | 4 |
| SK-ALGO-014 | graph-algorithm-selector | 3 |
| SK-ALGO-017 | segment-tree-builder | 4 |
| SK-ALGO-019 | string-algorithm-matcher | 2 |
| SK-ALGO-020 | suffix-structure-builder | 2 |
| SK-ALGO-021 | number-theory-toolkit | 4 |
| SK-ALGO-022 | prime-sieve-generator | 3 |
| SK-ALGO-024 | interview-problem-bank | 8 |
| SK-ALGO-025 | interview-simulator | 5 |
| SK-ALGO-026 | solution-explainer | 5 |
| SK-ALGO-027 | invariant-analyzer | 2 |
| SK-ALGO-031 | geometry-primitive-library | 3 |
| SK-ALGO-032 | geometry-algorithm-library | 3 |

---

## Agent Coverage Matrix

| Agent ID | Agent Name | References Found |
|----------|------------|------------------|
| AG-ALGO-001 | competitive-programmer | 3 |
| AG-ALGO-008 | technical-interviewer | 4 |
| AG-ALGO-009 | interview-coach | 3 |
| AG-ALGO-015 | algorithm-teacher | 2 |

---

## Recommendations

### High-Priority Integrations

1. **LeetCode MCP Server** - Direct integration available for SK-ALGO-001
2. **Competitive Companion + CPH** - Excellent workflow for SK-ALGO-001, SK-ALGO-002
3. **AI Mock Interviewer** - Ready-to-use for SK-ALGO-025, AG-ALGO-008
4. **manim-dsa** - Strong foundation for SK-ALGO-007 visualization needs
5. **QuickTest CLI** - Complete solution for SK-ALGO-008, SK-ALGO-009

### Gaps Identified

1. **Codeforces API MCP** - No dedicated MCP server found; could build using Codeforces API
2. **AtCoder MCP** - No dedicated MCP server found; opportunity for development
3. **Dedicated DP Pattern MCP** - Patterns exist in repos but no MCP integration
4. **Formal Verification Tools** - Limited options for SK-ALGO-027, SK-ALGO-028
5. **Number Theory MCP** - No dedicated MCP for SK-ALGO-021, SK-ALGO-022

### Build vs. Integrate Recommendations

| Skill | Recommendation | Rationale |
|-------|----------------|-----------|
| SK-ALGO-001 | Integrate | LeetCode MCP servers available |
| SK-ALGO-002 | Build | No MCP exists; API available |
| SK-ALGO-005 | Integrate | Multiple CP libraries available |
| SK-ALGO-006 | Build | Existing tools need MCP wrapper |
| SK-ALGO-007 | Integrate + Extend | manim-dsa provides foundation |
| SK-ALGO-008 | Integrate | QuickTest CLI available |
| SK-ALGO-024 | Integrate | Rich resources available |
| SK-ALGO-025 | Integrate | Multiple AI interview tools exist |

### Existing Skills:

Manim Skill:

https://github.com/adithya-s-k/manim_skill/tree/main
---

## Next Steps

1. **Evaluate** top MCP servers for direct integration
2. **Create** MCP wrappers for existing tools (Codeforces API, complexity analyzers)
3. **Extend** visualization tools with Claude integration
4. **Build** custom skills for gaps (Codeforces, AtCoder, formal verification)
5. **Test** integrated solutions with real competitive programming workflows
6. **Document** integration patterns for community contribution