# Algorithms and Optimization - References

## Algorithm Categories

### Sorting Algorithms

**Comparison-Based Sorting**:
- **QuickSort**: O(n log n) average, O(n²) worst case
  - Divide-and-conquer, in-place, not stable
  - Fastest in practice due to cache efficiency
  - Variants: Randomized quicksort, 3-way partition

- **MergeSort**: O(n log n) guaranteed, O(n) space
  - Divide-and-conquer, stable, out-of-place
  - Predictable performance, good for linked lists
  - Variants: Bottom-up merge sort, natural merge sort

- **HeapSort**: O(n log n) guaranteed, O(1) space
  - In-place, not stable, uses binary heap
  - Slower than quicksort in practice

- **Insertion Sort**: O(n²) worst case, O(n) best case
  - Simple, adaptive, stable, in-place
  - Excellent for small arrays (n < 50) and nearly sorted data

- **Selection Sort**: O(n²) always
  - In-place, not stable, simple
  - Minimizes number of swaps

- **Bubble Sort**: O(n²) worst case, O(n) best case
  - Simple, stable, in-place
  - Rarely used in practice

**Non-Comparison Sorting**:
- **Counting Sort**: O(n + k) where k is range
  - Requires knowing range, O(k) space
  - Stable, used as subroutine in radix sort

- **Radix Sort**: O(d(n + k)) where d is digits
  - Sort digit by digit using stable sort
  - Linear time for fixed-size integers

- **Bucket Sort**: O(n + k) average
  - Divide elements into buckets, sort individually
  - Good for uniformly distributed data

**References**:
- Sedgewick & Wayne - "Algorithms, 4th Edition" (Addison-Wesley, 2011)
- CLRS - "Introduction to Algorithms" (MIT Press, 2009) - Chapter 6-9
- Wikipedia - Sorting algorithm (comprehensive comparison table)

### Graph Algorithms

**Traversal Algorithms**:
- **Depth-First Search (DFS)**: O(V + E)
  - Recursive or stack-based implementation
  - Applications: Cycle detection, topological sort, SCC, pathfinding
  - Variants: Iterative DFS, randomized DFS

- **Breadth-First Search (BFS)**: O(V + E)
  - Queue-based implementation
  - Applications: Shortest path (unweighted), level-order traversal
  - Variants: Bidirectional BFS, 0-1 BFS

**Shortest Path Algorithms**:
- **Dijkstra's Algorithm**: O((V + E) log V) with binary heap
  - Single-source shortest path, non-negative weights
  - Priority queue-based, greedy approach
  - Variants: Bidirectional Dijkstra, A* with heuristic

- **Bellman-Ford Algorithm**: O(VE)
  - Single-source shortest path, handles negative weights
  - Detects negative cycles
  - Applications: Currency arbitrage, network routing

- **Floyd-Warshall Algorithm**: O(V³)
  - All-pairs shortest paths
  - Dynamic programming approach
  - Simple implementation, dense graphs

- **A* Algorithm**: O((V + E) log V) with good heuristic
  - Heuristic-based pathfinding
  - Applications: Game AI, robotics, GPS navigation
  - Requires admissible heuristic function

**Minimum Spanning Tree**:
- **Kruskal's Algorithm**: O(E log E)
  - Edge-based, uses union-find
  - Sort edges by weight, add if no cycle
  - Good for sparse graphs

- **Prim's Algorithm**: O((V + E) log V) with binary heap
  - Vertex-based, uses priority queue
  - Grow tree from single vertex
  - Good for dense graphs

**Advanced Graph Algorithms**:
- **Tarjan's Algorithm**: O(V + E)
  - Strongly connected components (SCC)
  - Low-link values and DFS

- **Kosaraju's Algorithm**: O(V + E)
  - SCC using two DFS passes
  - Simpler than Tarjan's

- **Topological Sort**: O(V + E)
  - Kahn's algorithm (BFS-based)
  - DFS-based approach
  - Applications: Task scheduling, dependency resolution

- **Edmonds-Karp Algorithm**: O(VE²)
  - Maximum flow using BFS
  - Ford-Fulkerson with BFS path finding

- **Dinic's Algorithm**: O(V²E)
  - Faster maximum flow algorithm
  - Level graphs and blocking flows

- **Hopcroft-Karp Algorithm**: O(E√V)
  - Maximum bipartite matching
  - Applications: Job assignment, resource allocation

**References**:
- Cormen et al. - "Introduction to Algorithms" (MIT Press, 2009) - Chapters 22-26
- Sedgewick & Wayne - "Algorithms, 4th Edition" (Addison-Wesley, 2011) - Part 4
- CP-Algorithms - Graph Algorithms (https://cp-algorithms.com/graph/)
- GeeksforGeeks - Graph Data Structure (https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/)

### Dynamic Programming

**Classic DP Problems**:

**1D DP**:
- **Fibonacci Numbers**: O(n) time, O(1) space with optimization
- **Climbing Stairs**: Count ways to reach top
- **House Robber**: Maximum sum with no adjacent elements
- **Maximum Subarray** (Kadane's Algorithm): O(n) time
- **Longest Increasing Subsequence**: O(n log n) with binary search

**2D DP**:
- **Longest Common Subsequence (LCS)**: O(nm) time and space
- **Edit Distance** (Levenshtein): O(nm) time and space
- **0/1 Knapsack**: O(nW) time and space
- **Coin Change**: O(n × amount) time and space
- **Unique Paths**: Grid navigation problems
- **Matrix Chain Multiplication**: O(n³) time

**Advanced DP**:
- **Palindrome Partitioning**: Minimum cuts for palindromes
- **Longest Palindromic Subsequence**: O(n²)
- **Regular Expression Matching**: Pattern matching DP
- **Wildcard Matching**: Similar to regex matching
- **Interleaving String**: Three-string DP problem

**DP Patterns**:
- **Linear DP**: Process array/string linearly
- **Grid DP**: 2D grid traversal problems
- **Interval DP**: Process intervals of different sizes
- **Tree DP**: DP on tree structures
- **Digit DP**: Count numbers with properties
- **Bitmask DP**: Use bitmask to represent state
- **DP on DAG**: Longest path in directed acyclic graph

**DP Optimization Techniques**:
- **Space Optimization**: Reduce from O(n²) to O(n) using rolling array
- **State Compression**: Use bitmask for compact state
- **Memoization**: Top-down with caching
- **Tabulation**: Bottom-up with table
- **Divide and Conquer Optimization**: O(n²) to O(n log n)
- **Convex Hull Trick**: Optimize certain DP transitions
- **Knuth's Optimization**: For specific interval DP problems

**References**:
- "Dynamic Programming for Coding Interviews" by Meenakshi & Kamal Rawat
- TopCoder - "Dynamic Programming: From Novice to Advanced" (https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced)
- USACO Guide - Dynamic Programming (https://usaco.guide/gold/intro-dp)
- Codeforces Blog - DP Tutorial (https://codeforces.com/blog/entry/43256)

### Greedy Algorithms

**Classic Greedy Problems**:
- **Activity Selection**: Maximum non-overlapping intervals
  - Sort by end time, O(n log n)
  - Proof: Greedy choice property

- **Fractional Knapsack**: Take fractions of items
  - Sort by value/weight ratio
  - O(n log n) time

- **Huffman Coding**: Optimal prefix codes
  - Build tree using min-heap
  - O(n log n) time

- **Job Sequencing with Deadlines**: Maximize profit
  - Sort by profit, assign to latest available slot
  - O(n²) naive, O(n log n) with union-find

- **Minimum Spanning Tree**: Kruskal's and Prim's
- **Dijkstra's Algorithm**: Shortest path (greedy choice)

**Greedy Patterns**:
- **Interval Scheduling**: Non-overlapping intervals
- **Task Scheduling**: Minimize completion time
- **Two-Pointer Approach**: Often uses greedy choice
- **Sorting + Greedy**: Most greedy algorithms start with sorting

**Proving Greedy Correctness**:
1. **Greedy Choice Property**: Locally optimal choice leads to global optimum
2. **Optimal Substructure**: Optimal solution contains optimal solutions to subproblems
3. **Exchange Argument**: Show greedy is at least as good as any other solution

**References**:
- CLRS - "Introduction to Algorithms" (MIT Press, 2009) - Chapter 16
- Algorithm Design by Kleinberg & Tardos (Pearson, 2005) - Chapter 4
- GeeksforGeeks - Greedy Algorithms (https://www.geeksforgeeks.org/greedy-algorithms/)

### String Algorithms

**Pattern Matching**:
- **Naive String Search**: O(nm) brute force
- **Knuth-Morris-Pratt (KMP)**: O(n + m)
  - Preprocesses pattern to avoid re-comparison
  - Failure function / prefix function
  - Applications: Text search, substring matching

- **Rabin-Karp Algorithm**: O(n + m) average
  - Rolling hash for efficient comparison
  - Good for multiple pattern matching
  - Applications: Plagiarism detection

- **Boyer-Moore Algorithm**: O(n/m) best case
  - Bad character rule and good suffix rule
  - Very fast in practice

- **Aho-Corasick Algorithm**: O(n + m + z)
  - Multiple pattern matching
  - Builds trie + failure links
  - Applications: Dictionary matching, virus scanning

**String Processing**:
- **Trie (Prefix Tree)**: O(m) insertion/search
  - Efficient prefix matching
  - Applications: Autocomplete, IP routing

- **Suffix Array**: O(n log n) construction
  - Sorted array of all suffixes
  - O(m log n) pattern matching
  - Applications: BWT compression, longest common substring

- **Suffix Tree**: O(n) construction (Ukkonen's)
  - Tree of all suffixes
  - Powerful but complex
  - Applications: Longest repeated substring, pattern matching

- **Z-Algorithm**: O(n) linear time
  - Compute Z-array for pattern matching
  - Simpler alternative to KMP

- **Manacher's Algorithm**: O(n)
  - Longest palindromic substring
  - Clever use of palindrome properties

**Advanced String Structures**:
- **Palindrome Tree (Eertree)**: O(n) construction
  - All unique palindromic substrings
- **Suffix Automaton**: O(n) construction
  - Deterministic finite automaton
  - Fast substring queries

**References**:
- "String Algorithms" by Bill Smyth (Addison-Wesley, 2003)
- CP-Algorithms - String Processing (https://cp-algorithms.com/string/)
- GeeksforGeeks - Pattern Searching (https://www.geeksforgeeks.org/fundamentals-of-algorithms/#PatternSearching)

### Number Theory Algorithms

**Basic Algorithms**:
- **Euclidean Algorithm**: O(log n) GCD computation
  - gcd(a, b) = gcd(b, a mod b)
  - Extended Euclidean: Find x, y where ax + by = gcd(a, b)

- **Sieve of Eratosthenes**: O(n log log n)
  - Generate all primes up to n
  - Linear sieve variant: O(n)

- **Primality Testing**:
  - Trial Division: O(√n)
  - Miller-Rabin: O(k log³ n) probabilistic
  - AKS: O(log⁶ n) deterministic

- **Prime Factorization**:
  - Trial division: O(√n)
  - Pollard's Rho: O(n^(1/4)) expected

- **Fast Exponentiation**: O(log n)
  - Compute a^b mod m efficiently
  - Binary exponentiation

**Advanced Number Theory**:
- **Chinese Remainder Theorem**: Solve system of congruences
- **Modular Multiplicative Inverse**: Extended Euclidean
- **Euler's Totient Function**: φ(n) = count of coprimes
- **Fermat's Little Theorem**: a^(p-1) ≡ 1 (mod p)
- **Euler's Theorem**: a^φ(n) ≡ 1 (mod n)

**Combinatorics**:
- **Factorial and Modular Inverse**: Precompute for combinations
- **Binomial Coefficients**: C(n, k) = n! / (k!(n-k)!)
- **Pascal's Triangle**: Dynamic computation of combinations
- **Catalan Numbers**: C_n = (2n)! / ((n+1)!n!)
- **Inclusion-Exclusion Principle**: Count with overlapping sets

**Matrix Exponentiation**:
- **Fast Computation**: O(k³ log n) for k×k matrix
- **Applications**: Fibonacci, recurrence relations, graph paths

**References**:
- "Elementary Number Theory" by David Burton (McGraw-Hill, 2010)
- CP-Algorithms - Algebra (https://cp-algorithms.com/algebra/)
- Project Euler - Mathematical problems (https://projecteuler.net/)
- Brilliant.org - Number Theory (https://brilliant.org/courses/number-theory/)

## Data Structures

### Basic Data Structures

**Arrays and Strings**:
- **Static Array**: O(1) access, O(n) search/insert/delete
- **Dynamic Array** (Vector): Amortized O(1) append, O(n) insert
- **Circular Buffer**: Ring buffer for queues
- **Sparse Array**: Efficient storage for sparse data

**Linked Lists**:
- **Singly Linked List**: O(1) insert at head, O(n) search
- **Doubly Linked List**: O(1) insert/delete with pointer
- **Skip List**: O(log n) probabilistic search
- **XOR Linked List**: Space-efficient doubly linked

**Stacks and Queues**:
- **Stack (LIFO)**: Array or linked list-based, O(1) operations
- **Queue (FIFO)**: Circular buffer or linked list, O(1) operations
- **Deque**: Double-ended queue, O(1) at both ends
- **Monotonic Stack/Queue**: Maintain monotonic property

**References**:
- "Data Structures and Algorithm Analysis" by Mark Allen Weiss (Pearson, 2011)
- GeeksforGeeks - Data Structures (https://www.geeksforgeeks.org/data-structures/)

### Tree Data Structures

**Binary Trees**:
- **Binary Search Tree (BST)**: O(log n) average, O(n) worst
  - In-order traversal gives sorted order
  - Applications: Symbol tables, priority queues

- **AVL Tree**: O(log n) guaranteed operations
  - Self-balancing, height-balanced
  - Rotation operations for balance
  - Stricter balancing than red-black

- **Red-Black Tree**: O(log n) guaranteed operations
  - Self-balancing with color properties
  - Less strict than AVL, fewer rotations
  - Used in std::map, TreeMap

- **Splay Tree**: O(log n) amortized operations
  - Self-adjusting, recently accessed near root
  - No balance information needed

**Heaps**:
- **Binary Heap**: O(log n) insert/delete, O(1) find-min/max
  - Complete binary tree, heap property
  - Array-based implementation
  - Applications: Priority queue, heap sort

- **Fibonacci Heap**: O(1) amortized insert/decrease-key, O(log n) delete
  - Collection of heap-ordered trees
  - Used in Dijkstra, Prim optimizations

- **Binomial Heap**: O(log n) operations
  - Collection of binomial trees
  - Efficient merge operation

**Segment Trees and Fenwick Trees**:
- **Segment Tree**: O(log n) range query/update
  - Build: O(n), Query/Update: O(log n)
  - Range sum, min, max, GCD queries
  - Lazy propagation for range updates

- **Fenwick Tree (BIT)**: O(log n) prefix sum query/update
  - Simpler than segment tree
  - Only works for prefix operations
  - Inversion counting, range sum

**Tries and Suffix Structures**:
- **Trie (Prefix Tree)**: O(m) insert/search where m is key length
  - Efficient prefix matching
  - Space: O(ALPHABET_SIZE × N × M)

- **Suffix Array**: O(n log² n) construction, O(n log n) with improvements
  - All suffixes sorted
  - LCP array for additional queries

- **Suffix Tree**: O(n) construction (Ukkonen's algorithm)
  - Compressed trie of all suffixes
  - Powerful but complex

**Advanced Trees**:
- **B-Tree**: O(log n) operations
  - Self-balancing, multiple keys per node
  - Used in databases and filesystems

- **B+ Tree**: Variant with data only in leaves
  - Better for range queries
  - Used in database indexing

- **Treap**: Randomized BST using heap property
  - Simple implementation, good average case

- **Cartesian Tree**: Binary tree from sequence
  - Heap property + in-order gives original sequence

**References**:
- CLRS - "Introduction to Algorithms" (MIT Press, 2009) - Chapters 12-15, 18
- Skiena - "The Algorithm Design Manual" (Springer, 2020) - Chapter 3-4
- CP-Algorithms - Data Structures (https://cp-algorithms.com/data_structures/)

### Hash-Based Data Structures

**Hash Tables**:
- **Hash Map**: O(1) average insert/delete/search
  - Collision handling: chaining, open addressing
  - Load factor, rehashing
  - Hash functions: division, multiplication, universal hashing

- **Hash Set**: O(1) average membership testing
  - No duplicate elements
  - Applications: Deduplication, caching

**Collision Resolution**:
- **Chaining**: Linked list at each slot
- **Open Addressing**: Linear probing, quadratic probing, double hashing
- **Cuckoo Hashing**: Multiple hash functions, guaranteed O(1) lookup

**Advanced Hashing**:
- **Bloom Filter**: Probabilistic set membership, space-efficient
  - False positives possible, no false negatives
  - Applications: Spell checking, cache filtering

- **Count-Min Sketch**: Approximate frequency counting
  - Space-efficient, probabilistic
  - Applications: Heavy hitters, streaming data

- **Rolling Hash**: Efficient string hashing
  - Rabin-Karp algorithm uses rolling hash
  - O(1) hash update when sliding window

**References**:
- CLRS - "Introduction to Algorithms" (MIT Press, 2009) - Chapter 11
- "Probabilistic Data Structures and Algorithms" by Andrii Gakhov (2019)

### Advanced Data Structures

**Union-Find (Disjoint Set Union)**:
- **Operations**: Union, Find
- **Optimizations**: Union by rank, path compression
- **Complexity**: O(α(n)) amortized where α is inverse Ackermann
- **Applications**: Kruskal's MST, cycle detection, connected components

**Sparse Table**:
- **Preprocessing**: O(n log n)
- **Query**: O(1) for idempotent operations (min, max, GCD)
- **Applications**: Range minimum query (RMQ), lowest common ancestor (LCA)

**Heavy-Light Decomposition**:
- **Preprocessing**: O(n)
- **Query**: O(log² n) path queries on trees
- **Applications**: Path queries, subtree updates on trees

**Persistent Data Structures**:
- **Persistent Segment Tree**: Maintain version history
- **Persistent Trie**: Version control for tries
- **Applications**: Time-travel queries, version control

**References**:
- "Purely Functional Data Structures" by Chris Okasaki (Cambridge, 1999)
- CP-Algorithms - Advanced Data Structures (https://cp-algorithms.com/data_structures/)
- Codeforces Blogs - Advanced Data Structures

## Complexity Analysis

### Time Complexity Classes

**Common Time Complexities**:
- **O(1)** - Constant: Array access, hash table operations
- **O(log n)** - Logarithmic: Binary search, balanced tree operations
- **O(√n)** - Square root: Prime factorization check
- **O(n)** - Linear: Array traversal, linear search
- **O(n log n)** - Linearithmic: Efficient sorting, merge operations
- **O(n²)** - Quadratic: Nested loops, bubble sort, simple DP
- **O(n³)** - Cubic: Floyd-Warshall, matrix multiplication
- **O(2^n)** - Exponential: Subsets, brute force combinations
- **O(n!)** - Factorial: Permutations, TSP brute force

**Growth Rates** (from slowest to fastest):
O(1) < O(log log n) < O(log n) < O(√n) < O(n) < O(n log n) < O(n²) < O(n³) < O(2^n) < O(n!) < O(n^n)

**Master Theorem**:
For recurrence T(n) = aT(n/b) + f(n):
- Case 1: f(n) = O(n^(log_b(a) - ε)), then T(n) = Θ(n^log_b(a))
- Case 2: f(n) = Θ(n^log_b(a)), then T(n) = Θ(n^log_b(a) log n)
- Case 3: f(n) = Ω(n^(log_b(a) + ε)), then T(n) = Θ(f(n))

**Amortized Analysis**:
- **Aggregate Method**: Total cost / number of operations
- **Accounting Method**: Assign different charges to operations
- **Potential Method**: Define potential function for data structure
- Example: Dynamic array append is O(1) amortized despite occasional O(n) resize

**References**:
- CLRS - "Introduction to Algorithms" (MIT Press, 2009) - Chapter 3-4
- "Concrete Mathematics" by Graham, Knuth, Patashnik (Addison-Wesley, 1994)
- MIT OpenCourseWare - 6.006 Introduction to Algorithms

### Space Complexity

**Space Complexity Considerations**:
- **Auxiliary Space**: Extra space used by algorithm
- **Total Space**: Input space + auxiliary space
- **In-place**: O(1) auxiliary space

**Common Space Patterns**:
- Recursion: O(depth) call stack space
- Dynamic Programming: Often O(n) or O(n²) for memoization
- Space-time trade-off: Caching vs. recomputation

**Space Optimization Techniques**:
- Rolling array in DP: Reduce O(n²) to O(n)
- In-place algorithms: Modify input instead of allocating new space
- Iterative vs. recursive: Eliminate call stack space

**References**:
- "Algorithm Design" by Kleinberg & Tardos (Pearson, 2005)

## Books and Learning Resources

### Essential Books

**Algorithm Textbooks**:
1. **"Introduction to Algorithms" (CLRS)** - Cormen, Leiserson, Rivest, Stein (MIT Press, 2009)
   - Comprehensive reference, rigorous proofs
   - Coverage: All fundamental algorithms and data structures
   - Best for: Deep understanding, academic study

2. **"The Algorithm Design Manual"** - Steven Skiena (Springer, 2020)
   - Practical approach, problem-solving focus
   - War stories from real applications
   - Best for: Practical applications, interview prep

3. **"Algorithms"** - Sedgewick & Wayne (Addison-Wesley, 2011)
   - Java implementations, visual explanations
   - Excellent visualizations and examples
   - Best for: Implementation-focused learning

**Competitive Programming**:
1. **"Competitive Programming 4"** - Steven & Felix Halim (2020)
   - Comprehensive CP handbook
   - Problem-solving techniques, contest strategy
   - Best for: Competitive programmers

2. **"Competitive Programmer's Handbook"** - Antti Laaksonen (2017)
   - Free online, concise coverage
   - Modern C++ code examples
   - Available: https://cses.fi/book/book.pdf

3. **"Guide to Competitive Programming"** - Antti Laaksonen (Springer, 2020)
   - Based on CPH, published version
   - More detailed explanations

**Interview Preparation**:
1. **"Cracking the Coding Interview"** - Gayle Laakmann McDowell (CareerCup, 2015)
   - 189 programming questions and solutions
   - Interview process insights
   - Best for: FAANG interview prep

2. **"Elements of Programming Interviews"** - Aziz, Lee, Prakash (2015)
   - Available in Python, Java, C++
   - 300+ problems with detailed solutions
   - More challenging than CTCI

**Algorithm Design**:
1. **"Algorithm Design"** - Kleinberg & Tardos (Pearson, 2005)
   - Algorithm design techniques
   - Proof techniques, problem-solving
   - Best for: Understanding algorithm design principles

2. **"Algorithms Illuminated"** - Tim Roughgarden (Soundlikeyourself, 2017-2020)
   - 4-part series, accessible writing
   - Based on Stanford courses
   - Best for: Self-study, clear explanations

**Specialized Topics**:
1. **"Algorithms on Strings, Trees, and Sequences"** - Dan Gusfield (Cambridge, 1997)
   - Comprehensive string algorithms
   - Bioinformatics applications

2. **"Computational Geometry: Algorithms and Applications"** - de Berg et al. (Springer, 2008)
   - Comprehensive geometry algorithms

3. **"The Art of Computer Programming"** - Donald Knuth (Volumes 1-4A)
   - Encyclopedic, highly detailed
   - Fundamental algorithms and analysis

**References**:
- MIT OpenCourseWare - Algorithm courses
- Stanford Online - Algorithm specialization
- Princeton - Algorithms course (Coursera)

### Online Platforms

**Competitive Programming**:
- **Codeforces** (https://codeforces.com/)
  - Russian platform, 2-3 contests per week
  - Rating: 0-3500+, color-coded
  - Strong community, editorials

- **AtCoder** (https://atcoder.jp/)
  - Japanese platform, weekly contests
  - Beginner-friendly, gradual difficulty
  - High-quality problems

- **LeetCode** (https://leetcode.com/)
  - Interview preparation focus
  - 2500+ problems, company-specific
  - Weekly contests, premium content

- **TopCoder** (https://www.topcoder.com/)
  - Oldest platform, SRM contests
  - Algorithm tutorials

- **CodeChef** (https://www.codechef.com/)
  - Monthly long contests
  - Beginner, intermediate, advanced divisions

- **HackerRank** (https://www.hackerrank.com/)
  - Interview prep, certifications
  - Company challenges

- **CSES Problem Set** (https://cses.fi/problemset/)
  - 300 problems covering all topics
  - Systematic learning path
  - Free, no registration required

**Practice Platforms**:
- **Project Euler** (https://projecteuler.net/)
  - Mathematical/algorithmic problems
  - 800+ problems, difficulty progression

- **SPOJ** (https://www.spoj.com/)
  - Sphere Online Judge
  - Large problem archive

- **UVa Online Judge** (https://onlinejudge.org/)
  - Classic problems, large archive

- **Kattis** (https://open.kattis.com/)
  - ICPC-style problems
  - University competitions

**Interview Preparation**:
- **LeetCode** - Most popular for FAANG prep
- **HackerRank** - Technical assessments
- **Pramp** (https://www.pramp.com/) - Peer mock interviews
- **Interviewing.io** (https://interviewing.io/) - Anonymous interviews

### Online Courses

**MOOCs**:
- **Algorithms Specialization** - Stanford (Coursera)
  - Tim Roughgarden, 4-course series
  - Divide-and-conquer, graph search, greedy, DP, NP-complete

- **Data Structures and Algorithms Specialization** - UC San Diego (Coursera)
  - 6-course series, toolbox approach
  - Theory and practice

- **MIT 6.006** - Introduction to Algorithms
  - Free on MIT OCW
  - Video lectures by Erik Demaine

- **Princeton Algorithms** - Coursera
  - Robert Sedgewick and Kevin Wayne
  - Part I and II

**Paid Platforms**:
- **AlgoExpert** (https://www.algoexpert.io/)
  - 160+ questions, video explanations
  - Interview-focused

- **Educative.io** - Interactive courses
  - Grokking the Coding Interview
  - Grokking Dynamic Programming

- **InterviewCake** (https://www.interviewcake.com/)
  - Step-by-step breakdowns
  - Interview strategy

### Visualization and Tools

**Algorithm Visualization**:
- **VisuAlgo** (https://visualgo.net/)
  - Interactive algorithm animations
  - Sorting, graph, DP, geometry

- **Algorithm Visualizer** (https://algorithm-visualizer.org/)
  - Code + visualization
  - Community contributions

- **Python Tutor** (https://pythontutor.com/)
  - Step-through code execution
  - Multiple languages

**Graph Visualization**:
- **Graphviz** (https://graphviz.org/)
  - Graph description language
  - Command-line tool

- **Graph Editor** (https://csacademy.com/app/graph_editor/)
  - Interactive graph creation
  - Algorithm testing

**Development Tools**:
- **C++ STL Reference** (https://en.cppreference.com/)
- **Python Documentation** (https://docs.python.org/)
- **Big-O Cheat Sheet** (https://www.bigocheatsheet.com/)

### Community and Resources

**Blogs and Websites**:
- **CP-Algorithms** (https://cp-algorithms.com/)
  - Comprehensive algorithm implementations
  - C++ code examples

- **GeeksforGeeks** (https://www.geeksforgeeks.org/)
  - Tutorials, articles, problems
  - Interview experiences

- **Codeforces Blogs**
  - Community tutorials
  - Contest editorials

- **TopCoder Tutorials** (https://www.topcoder.com/thrive/tracks?track=Competitive%20Programming)
  - Classic tutorials
  - Advanced topics

**YouTube Channels**:
- **Abdul Bari** - Algorithm explanations
- **William Fiset** - Data structure implementations
- **Errichto** - Competitive programming
- **Back To Back SWE** - LeetCode solutions
- **NeetCode** - Interview prep

**Communities**:
- **r/algorithms** (Reddit)
- **r/learnprogramming** (Reddit)
- **Codeforces Community**
- **LeetCode Discuss**
- **Stack Overflow**

## Tools and Environment

### Programming Languages

**C++**:
- **Advantages**: Fast execution, STL library, memory control
- **Disadvantages**: Verbose, manual memory management
- **Best for**: Competitive programming, performance-critical applications
- **Key Libraries**: STL (vector, set, map, algorithm)
- **Compiler Flags**: `-O2`, `-std=c++17`, `-Wall`

**Python**:
- **Advantages**: Concise syntax, rapid development, extensive libraries
- **Disadvantages**: Slower execution, GIL for threading
- **Best for**: Scripting, prototyping, data science algorithms
- **Key Libraries**: collections, heapq, bisect, itertools
- **Performance**: PyPy for faster execution

**Java**:
- **Advantages**: Object-oriented, good libraries, widespread use
- **Disadvantages**: Verbose, slower than C++
- **Best for**: Enterprise applications, Android development
- **Key Libraries**: Collections Framework, PriorityQueue, TreeMap

**Other Languages**:
- **Go**: Simple, concurrent, fast compilation
- **Rust**: Memory safety, performance, growing ecosystem
- **JavaScript**: Web development, Node.js for backend

### Development Environment

**IDEs**:
- **Visual Studio Code**: Lightweight, extensible
  - Extensions: C++, Python, Code Runner
- **CLion**: JetBrains IDE for C++
- **PyCharm**: JetBrains IDE for Python
- **IntelliJ IDEA**: JetBrains IDE for Java
- **Sublime Text**: Fast, minimal
- **Vim/Neovim**: Terminal-based, efficient for experienced users

**Online IDEs**:
- **Compiler Explorer** (https://godbolt.org/) - See assembly output
- **Repl.it** (https://replit.com/) - Online coding environment
- **Ideone** (https://ideone.com/) - Quick code testing
- **Custom Invocation** (Codeforces) - Test during contests

**Debugging Tools**:
- **GDB**: GNU Debugger for C++
- **Valgrind**: Memory debugging, leak detection
- **AddressSanitizer**: Detect memory errors
- **Print Debugging**: Strategic output statements
- **Assertions**: Runtime checks for invariants

### Competitive Programming Setup

**Template Setup**:
```cpp
#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define vi vector<int>
#define vll vector<long long>
#define all(x) (x).begin(), (x).end()

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    // Solution code here

    return 0;
}
```

**Useful Macros**:
- Fast I/O: `ios_base::sync_with_stdio(false); cin.tie(nullptr);`
- Loop: `#define FOR(i,a,b) for(int i=a; i<b; i++)`
- All elements: `#define all(x) (x).begin(), (x).end()`

**Build and Run**:
```bash
# Compile with optimizations
g++ -O2 -std=c++17 -Wall solution.cpp -o solution

# Run with input/output redirection
./solution < input.txt > output.txt

# Time execution
time ./solution < input.txt
```

**Testing Tools**:
- **Stress Testing**: Generate random inputs, compare outputs
- **Diff Tools**: Compare expected vs. actual output
- **Testlib**: Library for problem setting and validation

## Advanced Topics

### Computational Complexity Theory

**Complexity Classes**:
- **P**: Problems solvable in polynomial time
- **NP**: Problems verifiable in polynomial time
- **NP-Complete**: Hardest problems in NP
- **NP-Hard**: At least as hard as NP-complete
- **P vs NP**: Unsolved problem, P = NP?

**NP-Complete Problems**:
- Traveling Salesman Problem (TSP)
- Knapsack Problem (decision version)
- Graph Coloring
- Hamiltonian Path
- Boolean Satisfiability (SAT)
- Subset Sum

**Dealing with NP-Hard Problems**:
- **Approximation Algorithms**: Guaranteed performance ratio
- **Heuristics**: Good solutions without guarantees
- **Exact Algorithms**: Exponential time, small inputs
- **Parameterized Complexity**: Fixed-parameter tractable

**References**:
- "Computers and Intractability" by Garey & Johnson (Freeman, 1979)
- "The Nature of Computation" by Moore & Mertens (Oxford, 2011)

### Advanced Algorithm Techniques

**Randomized Algorithms**:
- **Monte Carlo**: Probabilistic correctness
- **Las Vegas**: Probabilistic runtime, correct result
- **Randomized QuickSort**: Expected O(n log n)
- **Skip List**: Probabilistic balanced structure
- **Bloom Filter**: Probabilistic set membership

**Parallel Algorithms**:
- **Parallel Sorting**: Parallel merge sort, parallel quicksort
- **Parallel Prefix Sum**: Efficient parallel computation
- **MapReduce**: Distributed data processing paradigm
- **GPU Algorithms**: CUDA programming for massive parallelism

**Online Algorithms**:
- **Ski Rental Problem**: Competitive analysis
- **Paging**: Cache replacement strategies
- **Load Balancing**: Distributing tasks dynamically
- **Competitive Ratio**: Compare to optimal offline algorithm

**Approximation Algorithms**:
- **Vertex Cover**: 2-approximation
- **Set Cover**: Greedy log-approximation
- **TSP**: Various approximation algorithms
- **Linear Programming Relaxation**: Rounding techniques

**References**:
- "Randomized Algorithms" by Motwani & Raghavan (Cambridge, 1995)
- "The Design of Approximation Algorithms" by Williamson & Shmoys (Cambridge, 2011)

### Specialized Algorithm Domains

**Computational Geometry**:
- **Convex Hull**: Graham scan O(n log n), Jarvis march O(nh)
- **Line Segment Intersection**: Sweep line O((n + k) log n)
- **Closest Pair of Points**: Divide and conquer O(n log n)
- **Voronoi Diagrams**: Space partitioning
- **Delaunay Triangulation**: Dual of Voronoi

**Game Theory and Algorithms**:
- **Minimax Algorithm**: Zero-sum games
- **Alpha-Beta Pruning**: Optimization of minimax
- **Nim Game**: XOR-based strategy
- **Sprague-Grundy Theorem**: Impartial games
- **Monte Carlo Tree Search (MCTS)**: AlphaGo algorithm

**Bioinformatics Algorithms**:
- **Sequence Alignment**: Smith-Waterman, Needleman-Wunsch
- **Phylogenetic Trees**: Evolutionary relationships
- **Genome Assembly**: De Bruijn graphs
- **Protein Folding**: Computational prediction

**Machine Learning Algorithms**:
- **Gradient Descent**: Optimization algorithm
- **Backpropagation**: Neural network training
- **Decision Trees**: Classification and regression
- **Clustering**: K-means, hierarchical
- **Dimensionality Reduction**: PCA, t-SNE

**References**:
- "Computational Geometry" by de Berg et al. (Springer, 2008)
- "Bioinformatics Algorithms" by Compeau & Pevzner (Active Learning, 2018)

## Total Reference Count: 150+

This document provides 150+ references including:
- 50+ algorithms across all major categories
- 30+ data structures from basic to advanced
- 20+ books covering theory and practice
- 20+ online platforms and communities
- 15+ courses and learning resources
- 10+ visualization and development tools
- Advanced topics in complexity theory, randomized algorithms, and specialized domains

**Key Resources Summary**:
- **Textbooks**: CLRS, Skiena, Sedgewick & Wayne
- **CP Books**: Competitive Programming 4, CP Handbook
- **Interview**: Cracking the Coding Interview, Elements of Programming Interviews
- **Platforms**: Codeforces, LeetCode, AtCoder, CSES
- **Visualization**: VisuAlgo, Algorithm Visualizer
- **Community**: CP-Algorithms, GeeksforGeeks, Codeforces Blogs
