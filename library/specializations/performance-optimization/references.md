# Performance Optimization and Profiling - References

Comprehensive reference materials for Performance Optimization, Profiling, Benchmarking, Memory Management, CPU Optimization, and I/O Optimization.

## Profiling and Performance Analysis

### CPU Profiling Tools

#### Linux Performance Tools
- **perf**: Linux profiling with performance counters - https://perf.wiki.kernel.org/
- **eBPF/BPF**: Extended Berkeley Packet Filter for tracing - https://ebpf.io/
- **bcc**: BPF Compiler Collection - https://github.com/iovisor/bcc
- **bpftrace**: High-level tracing language - https://bpftrace.org/

#### Language-Specific Profilers
- **async-profiler**: Low-overhead Java/JVM profiler - https://github.com/jvm-profiling-tools/async-profiler
- **py-spy**: Sampling profiler for Python - https://github.com/benfred/py-spy
- **pprof (Go)**: Go profiling toolkit - https://pkg.go.dev/runtime/pprof
- **rbspy**: Ruby sampling profiler - https://rbspy.github.io/
- **perf-tools for Node.js**: Node.js profiling - https://nodejs.org/en/learn/diagnostics/profiling

#### Commercial Profilers
- **Intel VTune Profiler**: Advanced CPU/threading analysis - https://www.intel.com/content/www/us/en/developer/tools/oneapi/vtune-profiler.html
- **AMD uProf**: AMD processor profiling - https://developer.amd.com/amd-uprof/
- **JProfiler**: Java profiler - https://www.ej-technologies.com/products/jprofiler/overview.html
- **YourKit**: Java and .NET profiler - https://www.yourkit.com/

### Memory Profiling Tools

#### Memory Analysis
- **Valgrind**: Memory debugging and profiling suite - https://valgrind.org/
- **Valgrind Massif**: Heap profiler - https://valgrind.org/docs/manual/ms-manual.html
- **Valgrind Memcheck**: Memory error detector - https://valgrind.org/docs/manual/mc-manual.html
- **heaptrack**: Heap memory profiler - https://github.com/KDE/heaptrack
- **AddressSanitizer**: Fast memory error detector - https://github.com/google/sanitizers

#### GC Analysis
- **GCViewer**: Java GC log analyzer - https://github.com/chewiebug/GCViewer
- **gceasy**: Online GC log analyzer - https://gceasy.io/
- **Eclipse Memory Analyzer (MAT)**: Java heap dump analyzer - https://www.eclipse.org/mat/

#### Platform-Specific Tools
- **dotMemory**: .NET memory profiler - https://www.jetbrains.com/dotmemory/
- **Chrome DevTools Memory**: JavaScript memory profiling - https://developer.chrome.com/docs/devtools/memory-problems/
- **Instruments (macOS)**: Apple's profiling suite - https://developer.apple.com/instruments/

### I/O Profiling Tools

#### Disk I/O
- **iostat**: I/O statistics - https://man7.org/linux/man-pages/man1/iostat.1.html
- **iotop**: I/O monitoring per process - https://man7.org/linux/man-pages/man8/iotop.8.html
- **blktrace**: Block layer I/O tracing - https://man7.org/linux/man-pages/man8/blktrace.8.html
- **fio**: Flexible I/O tester - https://fio.readthedocs.io/

#### Network I/O
- **tcpdump**: Network packet analyzer - https://www.tcpdump.org/
- **Wireshark**: Network protocol analyzer - https://www.wireshark.org/
- **tshark**: Command-line Wireshark - https://www.wireshark.org/docs/man-pages/tshark.html
- **netstat/ss**: Network statistics - https://man7.org/linux/man-pages/man8/ss.8.html

### System Tracing
- **strace**: System call tracer - https://strace.io/
- **ltrace**: Library call tracer - https://man7.org/linux/man-pages/man1/ltrace.1.html
- **DTrace**: Dynamic tracing framework - https://dtrace.org/
- **SystemTap**: System-wide scripted tracing - https://sourceware.org/systemtap/

## Load Testing and Benchmarking

### Load Testing Tools

#### HTTP Load Testing
- **Apache JMeter**: Comprehensive load testing - https://jmeter.apache.org/
- **Gatling**: Scala-based load testing - https://gatling.io/
- **k6**: JavaScript load testing - https://k6.io/
- **Locust**: Python load testing - https://locust.io/
- **wrk**: HTTP benchmarking tool - https://github.com/wg/wrk
- **wrk2**: Rate-accurate wrk - https://github.com/giltene/wrk2
- **hey**: HTTP load generator - https://github.com/rakyll/hey
- **vegeta**: HTTP load testing and attack - https://github.com/tsenart/vegeta
- **Artillery**: Load testing toolkit - https://www.artillery.io/

#### Database Load Testing
- **pgbench**: PostgreSQL benchmarking - https://www.postgresql.org/docs/current/pgbench.html
- **sysbench**: Multi-purpose benchmark - https://github.com/akopytov/sysbench
- **HammerDB**: Database benchmarking - https://www.hammerdb.com/
- **YCSB**: Yahoo! Cloud Serving Benchmark - https://github.com/brianfrankcooper/YCSB

#### Microbenchmarking
- **JMH**: Java Microbenchmark Harness - https://github.com/openjdk/jmh
- **BenchmarkDotNet**: .NET benchmarking - https://benchmarkdotnet.org/
- **pytest-benchmark**: Python benchmarking - https://pytest-benchmark.readthedocs.io/
- **Google Benchmark**: C++ benchmarking - https://github.com/google/benchmark
- **Criterion.rs**: Rust benchmarking - https://bheisler.github.io/criterion.rs/

### Performance Testing Frameworks
- **Hyperfoil**: Distributed benchmarking - https://hyperfoil.io/
- **Taurus**: Test automation framework - https://gettaurus.org/
- **Neoload**: Enterprise load testing - https://www.tricentis.com/products/performance-testing-neoload
- **LoadRunner**: HP/Micro Focus load testing - https://www.microfocus.com/en-us/products/loadrunner-professional/overview

## APM and Monitoring

### Application Performance Monitoring

#### Commercial APM
- **New Relic**: Full-stack observability - https://newrelic.com/
- **Datadog**: Monitoring and analytics - https://www.datadoghq.com/
- **Dynatrace**: Software intelligence - https://www.dynatrace.com/
- **AppDynamics**: Application performance - https://www.appdynamics.com/
- **Splunk APM**: Application monitoring - https://www.splunk.com/en_us/products/apm.html

#### Open Source APM
- **OpenTelemetry**: Observability framework - https://opentelemetry.io/
- **Jaeger**: Distributed tracing - https://www.jaegertracing.io/
- **Zipkin**: Distributed tracing - https://zipkin.io/
- **Elastic APM**: Elasticsearch-based APM - https://www.elastic.co/observability/application-performance-monitoring
- **SigNoz**: Open source APM - https://signoz.io/
- **Grafana Tempo**: Distributed tracing - https://grafana.com/oss/tempo/

### Metrics and Monitoring

#### Metrics Collection
- **Prometheus**: Metrics collection and alerting - https://prometheus.io/
- **InfluxDB**: Time series database - https://www.influxdata.com/
- **Telegraf**: Metrics agent - https://www.influxdata.com/time-series-platform/telegraf/
- **StatsD**: Metrics aggregation - https://github.com/statsd/statsd
- **collectd**: System statistics daemon - https://collectd.org/

#### Visualization
- **Grafana**: Metrics visualization - https://grafana.com/
- **Kibana**: Elasticsearch visualization - https://www.elastic.co/kibana
- **Chronograf**: InfluxDB visualization - https://www.influxdata.com/time-series-platform/chronograf/

### Real User Monitoring
- **Google Analytics**: Web analytics - https://analytics.google.com/
- **Sentry Performance**: Error and performance monitoring - https://sentry.io/for/performance/
- **SpeedCurve**: Web performance - https://www.speedcurve.com/
- **Web Vitals**: Core Web Vitals library - https://web.dev/vitals/

## Memory Management

### Garbage Collection

#### GC Algorithms and Concepts
- **GC Handbook**: "The Garbage Collection Handbook" by Richard Jones - https://gchandbook.org/
- **Oracle GC Tuning Guide**: Java GC documentation - https://docs.oracle.com/en/java/javase/17/gctuning/
- **.NET GC Documentation**: .NET garbage collection - https://docs.microsoft.com/en-us/dotnet/standard/garbage-collection/

#### Java GC Resources
- **G1 GC Documentation**: G1 garbage collector - https://docs.oracle.com/en/java/javase/17/gctuning/garbage-first-g1-garbage-collector1.html
- **ZGC Documentation**: Z Garbage Collector - https://wiki.openjdk.org/display/zgc
- **Shenandoah GC**: Low-pause-time GC - https://wiki.openjdk.org/display/shenandoah

### Memory Leak Detection

#### Techniques and Tools
- **LeakCanary**: Android memory leak detection - https://square.github.io/leakcanary/
- **Memlab**: JavaScript memory leak detection - https://facebook.github.io/memlab/
- **Memory profiling best practices**: Chrome DevTools - https://developer.chrome.com/docs/devtools/memory-problems/

### Memory Allocators
- **jemalloc**: General-purpose allocator - http://jemalloc.net/
- **tcmalloc**: Google's malloc replacement - https://github.com/google/tcmalloc
- **mimalloc**: Microsoft's allocator - https://github.com/microsoft/mimalloc

## Database Performance

### Query Optimization

#### PostgreSQL
- **PostgreSQL Performance**: Official documentation - https://www.postgresql.org/docs/current/performance-tips.html
- **EXPLAIN Documentation**: Query plan analysis - https://www.postgresql.org/docs/current/sql-explain.html
- **pg_stat_statements**: Query statistics - https://www.postgresql.org/docs/current/pgstatstatements.html
- **pgBadger**: Log analyzer - https://pgbadger.darold.net/

#### MySQL
- **MySQL Optimization**: Official guide - https://dev.mysql.com/doc/refman/8.0/en/optimization.html
- **EXPLAIN Documentation**: Query analysis - https://dev.mysql.com/doc/refman/8.0/en/explain.html
- **Performance Schema**: Performance monitoring - https://dev.mysql.com/doc/refman/8.0/en/performance-schema.html
- **Percona Toolkit**: MySQL utilities - https://www.percona.com/software/database-tools/percona-toolkit

#### General Database Performance
- **Use The Index, Luke**: SQL indexing tutorial - https://use-the-index-luke.com/
- **Database Internals Book**: Database fundamentals - https://www.databass.dev/

### Caching Solutions

#### In-Memory Caches
- **Redis**: In-memory data store - https://redis.io/
- **Memcached**: Distributed memory caching - https://memcached.org/
- **Hazelcast**: In-memory computing - https://hazelcast.com/

#### Application-Level Caching
- **Caffeine**: Java caching library - https://github.com/ben-manes/caffeine
- **Guava Cache**: Google's caching library - https://github.com/google/guava/wiki/CachesExplained
- **Ehcache**: Java cache - https://www.ehcache.org/

#### CDN and Edge Caching
- **Cloudflare**: Edge caching and CDN - https://www.cloudflare.com/
- **Fastly**: Edge cloud platform - https://www.fastly.com/
- **Varnish**: HTTP accelerator - https://varnish-cache.org/

## Books and Learning Resources

### Essential Books

#### Performance Engineering
- **"Systems Performance" by Brendan Gregg** - https://www.brendangregg.com/systems-performance-2nd-edition-book.html
- **"BPF Performance Tools" by Brendan Gregg** - https://www.brendangregg.com/bpf-performance-tools-book.html
- **"High Performance Browser Networking" by Ilya Grigorik** - https://hpbn.co/
- **"Every Computer Performance Book" by Bob Wescott** - https://www.amazon.com/Every-Computer-Performance-Book-Wescott/dp/1482657759

#### Language-Specific Performance
- **"Java Performance" by Scott Oaks** - https://www.oreilly.com/library/view/java-performance-2nd/9781492056102/
- **"Optimizing Java" by Ben Evans et al.** - https://www.oreilly.com/library/view/optimizing-java/9781492025795/
- **"Pro .NET Performance" by Sasha Goldshtein** - https://www.apress.com/gp/book/9781430244585
- **"High Performance Python" by Micha Gorelick** - https://www.oreilly.com/library/view/high-performance-python/9781492055013/

#### Database Performance
- **"High Performance MySQL" by Baron Schwartz** - https://www.oreilly.com/library/view/high-performance-mysql/9781492080503/
- **"PostgreSQL High Performance" by Ibrar Ahmed et al.** - https://www.packtpub.com/product/postgresql-14-administration-cookbook/9781803248974

### Online Resources

#### Blogs and Articles
- **Brendan Gregg's Blog**: Performance analysis - https://www.brendangregg.com/blog/
- **Julia Evans' Blog**: Systems programming - https://jvns.ca/
- **Dan Luu's Blog**: Performance and systems - https://danluu.com/
- **Mechanical Sympathy**: Hardware/software interaction - https://mechanical-sympathy.blogspot.com/

#### Tutorials and Guides
- **Flame Graphs**: Visualization technique - https://www.brendangregg.com/flamegraphs.html
- **Netflix Tech Blog**: Performance insights - https://netflixtechblog.com/tagged/performance
- **LinkedIn Engineering Blog**: Performance articles - https://engineering.linkedin.com/blog/topic/performance

### Video Resources
- **Performance Engineering Talks**: InfoQ - https://www.infoq.com/performance/
- **Strange Loop Conference**: Systems talks - https://www.thestrangeloop.com/
- **USENIX Performance Talks**: Academic presentations - https://www.usenix.org/conferences/byname/142

## Standards and Specifications

### Web Performance
- **Web Vitals**: Core Web Vitals - https://web.dev/vitals/
- **Performance API**: Browser performance APIs - https://developer.mozilla.org/en-US/docs/Web/API/Performance_API
- **Resource Timing**: Resource loading performance - https://w3c.github.io/resource-timing/
- **Navigation Timing**: Page load performance - https://w3c.github.io/navigation-timing/

### Benchmarking Standards
- **SPEC**: Standard Performance Evaluation Corporation - https://www.spec.org/
- **TPC**: Transaction Processing Council - https://www.tpc.org/
- **MLPerf**: Machine learning benchmarks - https://mlcommons.org/en/

## Cloud Provider Performance

### AWS Performance
- **AWS Performance Insights**: RDS performance - https://aws.amazon.com/rds/performance-insights/
- **AWS X-Ray**: Distributed tracing - https://aws.amazon.com/xray/
- **CloudWatch**: Monitoring and observability - https://aws.amazon.com/cloudwatch/
- **AWS Compute Optimizer**: Resource recommendations - https://aws.amazon.com/compute-optimizer/

### Azure Performance
- **Azure Monitor**: Application insights - https://azure.microsoft.com/en-us/products/monitor/
- **Azure Performance Diagnostics**: VM diagnostics - https://docs.microsoft.com/en-us/azure/virtual-machines/troubleshooting/performance-diagnostics
- **Azure Advisor**: Optimization recommendations - https://azure.microsoft.com/en-us/products/advisor/

### GCP Performance
- **Cloud Profiler**: Continuous profiling - https://cloud.google.com/profiler
- **Cloud Trace**: Distributed tracing - https://cloud.google.com/trace
- **Cloud Monitoring**: Metrics and alerting - https://cloud.google.com/monitoring

## Community and Forums

### Communities
- **r/programming**: General programming - https://www.reddit.com/r/programming/
- **r/devops**: DevOps discussions - https://www.reddit.com/r/devops/
- **Hacker News**: Tech discussions - https://news.ycombinator.com/
- **Stack Overflow Performance Tags**: Q&A - https://stackoverflow.com/questions/tagged/performance

### Conferences
- **OSDI**: Operating Systems Design - https://www.usenix.org/conference/osdi
- **NSDI**: Networked Systems Design - https://www.usenix.org/conference/nsdi
- **SOSP**: Operating Systems Principles - https://sosp.org/
- **Performance Summit**: Performance engineering - https://www.performancesummit.com/

### Certifications
- **AWS Solutions Architect**: Performance optimization focus - https://aws.amazon.com/certification/certified-solutions-architect-professional/
- **Google Professional Cloud Architect**: GCP optimization - https://cloud.google.com/certification/cloud-architect
- **ISTQB Performance Testing**: Testing certification - https://www.istqb.org/

---

**Last Updated**: 2026-01-24
**Version**: 1.0.0
