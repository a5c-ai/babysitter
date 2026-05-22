const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const libraryRoot = path.join(repoRoot, "library");
const docsRoot = path.join(repoRoot, "docs");
const generatedDocsRoot = path.join(docsRoot, "user-guide", "generated");
const docsSiteGeneratedRoot = path.join(repoRoot, "docs-site", "src", "generated");
const refreshedAt = new Date().toISOString().slice(0, 10);
const numberFormatter = new Intl.NumberFormat("en-US");

function normalizeSlashes(value) {
  return value.split(path.sep).join("/");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listImmediateDirs(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function walkFiles(dirPath, visitor, options = {}) {
  const { skipDirs = new Set([".git", "node_modules", "__tests__"]) } = options;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        continue;
      }
      walkFiles(fullPath, visitor, options);
      continue;
    }
    visitor(fullPath);
  }
}

function countMatchingFiles(dirPath, predicate) {
  let count = 0;
  walkFiles(dirPath, (filePath) => {
    if (predicate(filePath)) {
      count += 1;
    }
  });
  return count;
}

function countJsFiles(dirPath) {
  return countMatchingFiles(dirPath, (filePath) => filePath.endsWith(".js"));
}

function buildDirectCategoryEntries(dirPath, repoRelativeBase) {
  return listImmediateDirs(dirPath)
    .map((slug) => {
      const absoluteDir = path.join(dirPath, slug);
      const relativeDir = normalizeSlashes(path.join(repoRelativeBase, slug));
      return {
        slug,
        count: countJsFiles(absoluteDir),
        repoPath: relativeDir,
        docLink: `../../../${relativeDir}/`,
      };
    })
    .filter((entry) => entry.count > 0)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.slug.localeCompare(right.slug);
    });
}

function buildInventory() {
  const methodologiesRoot = path.join(libraryRoot, "methodologies");
  const sharedProcessesRoot = path.join(libraryRoot, "processes", "shared");
  const specializationsRoot = path.join(libraryRoot, "specializations");
  const domainsRoot = path.join(specializationsRoot, "domains");
  const businessRoot = path.join(domainsRoot, "business");
  const scienceRoot = path.join(domainsRoot, "science");
  const socialRoot = path.join(domainsRoot, "social-sciences-humanities");

  const methodologyFamilies = buildDirectCategoryEntries(
    methodologiesRoot,
    "library/methodologies"
  ).filter((entry) => entry.slug !== "shared");

  const sharedProcessGroups = buildDirectCategoryEntries(
    sharedProcessesRoot,
    "library/processes/shared"
  );

  const technicalSpecializations = buildDirectCategoryEntries(
    specializationsRoot,
    "library/specializations"
  ).filter((entry) => entry.slug !== "domains");

  const businessDomains = buildDirectCategoryEntries(
    businessRoot,
    "library/specializations/domains/business"
  );
  const scienceDomains = buildDirectCategoryEntries(
    scienceRoot,
    "library/specializations/domains/science"
  );
  const socialDomains = buildDirectCategoryEntries(
    socialRoot,
    "library/specializations/domains/social-sciences-humanities"
  );

  const allCategories = [
    ...technicalSpecializations,
    ...businessDomains,
    ...scienceDomains,
    ...socialDomains,
  ]
    .slice()
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.slug.localeCompare(right.slug);
    });

  return {
    refreshedAt,
    paths: {
      libraryRoot: "library",
      methodologiesRoot: "library/methodologies",
      sharedProcessesRoot: "library/processes/shared",
      specializationsRoot: "library/specializations",
      businessRoot: "library/specializations/domains/business",
      scienceRoot: "library/specializations/domains/science",
      socialRoot: "library/specializations/domains/social-sciences-humanities",
    },
    counts: {
      docsMarkdownFiles: countMatchingFiles(docsRoot, (filePath) => /\.mdx?$/.test(filePath)),
      allLibraryProcessFiles: countJsFiles(libraryRoot),
      methodologyDirectories: methodologyFamilies.length,
      methodologyProcessFiles: countJsFiles(methodologiesRoot),
      sharedProcessFiles: countJsFiles(sharedProcessesRoot),
      specializationProcessFiles: countJsFiles(specializationsRoot),
      topLevelSpecializationDirectories: listImmediateDirs(specializationsRoot).length,
      technicalSpecializationProcesses: technicalSpecializations.reduce((sum, entry) => sum + entry.count, 0),
      businessDomainProcesses: businessDomains.reduce((sum, entry) => sum + entry.count, 0),
      scienceDomainProcesses: scienceDomains.reduce((sum, entry) => sum + entry.count, 0),
      socialDomainProcesses: socialDomains.reduce((sum, entry) => sum + entry.count, 0),
      skillFiles: countMatchingFiles(libraryRoot, (filePath) => path.basename(filePath) === "SKILL.md"),
      agentFiles: countMatchingFiles(libraryRoot, (filePath) => path.basename(filePath) === "AGENT.md"),
      readmeFiles: countMatchingFiles(libraryRoot, (filePath) => path.basename(filePath) === "README.md"),
    },
    methodologyFamilies,
    sharedProcessGroups,
    technicalSpecializations,
    businessDomains,
    scienceDomains,
    socialDomains,
    largestCategories: allCategories.slice(0, 12),
  };
}

function formatNumber(value) {
  return numberFormatter.format(value);
}

function renderCategoryTable(entries, labelText = "Category") {
  const lines = [
    `| ${labelText} | Processes | Browse |`,
    `|----------|-----------|--------|`,
  ];
  for (const entry of entries) {
    lines.push(
      `| \`${entry.slug}\` | ${formatNumber(entry.count)} | [Browse →](${entry.docLink}) |`
    );
  }
  return lines.join("\n");
}

function renderProcessLibraryCatalog(inventory) {
  const { counts } = inventory;
  return [
    `Snapshot refreshed from the live \`library/\` tree on ${inventory.refreshedAt}.`,
    ``,
    `- [Current snapshot counts](#current-snapshot-counts)`,
    `- [Methodology families](#methodology-families)`,
    `- [Shared process groups](#shared-process-groups)`,
    `- [Development and technical specializations](#development-and-technical-specializations)`,
    `- [Business domains](#business-domains)`,
    `- [Science domains](#science-domains)`,
    `- [Social sciences and humanities domains](#social-sciences-and-humanities-domains)`,
    `- [Largest specialization categories](#largest-specialization-categories)`,
    ``,
    `## Current Snapshot Counts`,
    ``,
    `| Area | Current Count | Source |`,
    `|------|---------------|--------|`,
    `| **All library \`.js\` process files** | ${formatNumber(counts.allLibraryProcessFiles)} | [\`library/\`](../../../library/) |`,
    `| **Methodology directories** | ${formatNumber(counts.methodologyDirectories)} | [\`library/methodologies/\`](../../../library/methodologies/) |`,
    `| **Methodology \`.js\` process files** | ${formatNumber(counts.methodologyProcessFiles)} | [\`library/methodologies/\`](../../../library/methodologies/) |`,
    `| **Shared \`.js\` process files** | ${formatNumber(counts.sharedProcessFiles)} | [\`library/processes/shared/\`](../../../library/processes/shared/) |`,
    `| **Specialization \`.js\` process files** | ${formatNumber(counts.specializationProcessFiles)} | [\`library/specializations/\`](../../../library/specializations/) |`,
    `| **Top-level specialization directories** | ${formatNumber(counts.topLevelSpecializationDirectories)} | [\`library/specializations/\`](../../../library/specializations/) |`,
    `| **Development and technical specialization processes** | ${formatNumber(counts.technicalSpecializationProcesses)} | [\`library/specializations/\`](../../../library/specializations/) |`,
    `| **Business-domain specialization processes** | ${formatNumber(counts.businessDomainProcesses)} | [\`library/specializations/domains/business/\`](../../../library/specializations/domains/business/) |`,
    `| **Science-domain specialization processes** | ${formatNumber(counts.scienceDomainProcesses)} | [\`library/specializations/domains/science/\`](../../../library/specializations/domains/science/) |`,
    `| **Social-sciences-and-humanities specialization processes** | ${formatNumber(counts.socialDomainProcesses)} | [\`library/specializations/domains/social-sciences-humanities/\`](../../../library/specializations/domains/social-sciences-humanities/) |`,
    `| **Skill definition files** | ${formatNumber(counts.skillFiles)} | [\`library/\`](../../../library/) |`,
    `| **Agent definition files** | ${formatNumber(counts.agentFiles)} | [\`library/\`](../../../library/) |`,
    `| **README files under library** | ${formatNumber(counts.readmeFiles)} | [\`library/\`](../../../library/) |`,
    ``,
    `## Methodology Families`,
    ``,
    renderCategoryTable(inventory.methodologyFamilies, "Methodology"),
    ``,
    `## Shared Process Groups`,
    ``,
    renderCategoryTable(inventory.sharedProcessGroups, "Group"),
    ``,
    `## Development and Technical Specializations`,
    ``,
    renderCategoryTable(inventory.technicalSpecializations),
    ``,
    `## Business Domains`,
    ``,
    renderCategoryTable(inventory.businessDomains),
    ``,
    `## Science Domains`,
    ``,
    renderCategoryTable(inventory.scienceDomains),
    ``,
    `## Social Sciences and Humanities Domains`,
    ``,
    renderCategoryTable(inventory.socialDomains),
    ``,
    `## Largest Specialization Categories`,
    ``,
    renderCategoryTable(inventory.largestCategories),
  ].join("\n");
}

function renderProcessLibraryLead(inventory) {
  const { counts } = inventory;
  return `The Babysitter Process Library is the SDK-managed library under [\`library/\`](../../../library/README.md). The current generated snapshot counts **${formatNumber(counts.allLibraryProcessFiles)} JavaScript process files**, including **${formatNumber(counts.methodologyProcessFiles)} methodology files**, **${formatNumber(counts.specializationProcessFiles)} specialization files**, and **${formatNumber(counts.sharedProcessFiles)} shared process files**, plus support assets such as **${formatNumber(counts.skillFiles)} skills** and **${formatNumber(counts.agentFiles)} agents** discovered in the live tree.`;
}

function renderPlainEnglishLine(inventory) {
  return `> **Think of the Process Library like a cookbook with ${formatNumber(inventory.counts.allLibraryProcessFiles)} recipes in the live repository tree.**`;
}

function renderDomainSummaryTable(inventory, browsePrefix) {
  return [
    `| Domain | Processes | Browse |`,
    `|--------|-----------|--------|`,
    `| **Development and technical specializations** | ${formatNumber(inventory.counts.technicalSpecializationProcesses)} | [Browse →](${browsePrefix}library/specializations/) |`,
    `| **Business domains** | ${formatNumber(inventory.counts.businessDomainProcesses)} | [Browse →](${browsePrefix}library/specializations/domains/business/) |`,
    `| **Science & engineering domains** | ${formatNumber(inventory.counts.scienceDomainProcesses)} | [Browse →](${browsePrefix}library/specializations/domains/science/) |`,
    `| **Social sciences & humanities** | ${formatNumber(inventory.counts.socialDomainProcesses)} | [Browse →](${browsePrefix}library/specializations/domains/social-sciences-humanities/) |`,
  ].join("\n");
}

function renderGlossaryBlock(inventory) {
  return [
    `**Babysitter currently exposes ${formatNumber(inventory.counts.allLibraryProcessFiles)} JavaScript process files in the live repository tree** organized across methodologies, shared processes, and specializations.`,
    ``,
    renderDomainSummaryTable(inventory, "../../../"),
  ].join("\n");
}

function renderProcessDefinitionsLead(inventory) {
  return `**You don't need to write processes to use Babysitter.** The [Process Library](./process-library.md) is the SDK-managed library under \`library/\`, and the current generated snapshot counts ${formatNumber(inventory.counts.allLibraryProcessFiles)} JavaScript process files in the live repository tree.`;
}

function renderUserGuideIndexRow(inventory) {
  return `| [**Process Library**](./features/process-library.md) | **${formatNumber(inventory.counts.allLibraryProcessFiles)} JavaScript process files in the live generated snapshot**, plus methodology, shared-process, skill, and agent layers discovered under \`library/\` |`;
}

function renderUserGuideFeaturesTable(inventory) {
  return [
    `| Feature | Description |`,
    `|---------|-------------|`,
    renderUserGuideIndexRow(inventory),
    `| [**Two-Loops Architecture**](./features/two-loops-architecture.md) | **Hybrid agentic systems** - symbolic orchestration + agentic harness, guardrails, and evidence-driven completion |`,
    `| [**Quality Convergence**](./features/quality-convergence.md) | **Five quality gate types** (tests, code quality, static analysis, security, performance) with 90-score patterns |`,
    `| [**Best Practices**](./features/best-practices.md) | **Four guardrail layers**, multi-gate validation, workflow design, and team collaboration patterns |`,
    `| [Breakpoints](./features/breakpoints.md) | Human-in-the-loop approval system for critical decisions |`,
    `| [Process Definitions](./features/process-definitions.md) | Customizable workflow templates and task orchestration |`,
    `| [Journal System](./features/journal-system.md) | Event-sourced audit trail and state reconstruction |`,
    `| [Run Resumption](./features/run-resumption.md) | Continue interrupted workflows from any point |`,
    `| [Parallel Execution](./features/parallel-execution.md) | Concurrent task execution for faster results |`,
  ].join("\n");
}

function renderUserGuideHighlight(inventory) {
  return `> **Highlight:** The Process Library snapshot currently tracks ${formatNumber(inventory.counts.allLibraryProcessFiles)} process files across ${formatNumber(inventory.counts.methodologyDirectories)} methodology families and the full specialization tree. [Explore the library →](./features/process-library.md)`;
}

function renderSlashCommandsLink(inventory) {
  return `- [Process Library](../features/process-library.md) — ${formatNumber(inventory.counts.allLibraryProcessFiles)} generated pre-built process files`;
}

function renderQualityConvergenceDomains(inventory) {
  return [
    `| Domain | Processes | Examples |`,
    `|--------|-----------|----------|`,
    `| **Development and technical specializations** | ${formatNumber(inventory.counts.technicalSpecializationProcesses)} | Web APIs, mobile apps, DevOps pipelines, AI, security, and related technical workflows |`,
    `| **Business domains** | ${formatNumber(inventory.counts.businessDomainProcesses)} | Legal contracts, HR workflows, marketing campaigns, finance, logistics, and related domains |`,
    `| **Science & engineering domains** | ${formatNumber(inventory.counts.scienceDomainProcesses)} | Quantum algorithms, aerospace systems, biomedical devices, mathematics, and related domains |`,
    `| **Social sciences & humanities** | ${formatNumber(inventory.counts.socialDomainProcesses)} | Education, healthcare, arts, philosophy, and social-science research |`,
  ].join("\n");
}

function renderStatsModule(inventory) {
  return `export const processLibraryStats = ${JSON.stringify(
    {
      refreshedAt: inventory.refreshedAt,
      docsMarkdownFiles: inventory.counts.docsMarkdownFiles,
      libraryProcessFiles: inventory.counts.allLibraryProcessFiles,
      methodologyDirectories: inventory.counts.methodologyDirectories,
      specializationProcessFiles: inventory.counts.specializationProcessFiles,
    },
    null,
    2
  )};\n\nexport const homepageStats = [\n  { label: 'Docs files', value: '${formatNumber(
    inventory.counts.docsMarkdownFiles
  )}' },\n  { label: 'Library process files', value: '${formatNumber(
    inventory.counts.allLibraryProcessFiles
  )}' },\n  { label: 'Core modes', value: 'Call, Yolo, Plan, Forever' }\n];\n`;
}

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceRegion(filePath, marker, content) {
  const startMarker = `<!-- ${marker}:start -->`;
  const endMarker = `<!-- ${marker}:end -->`;
  const source = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(
    `${escapeForRegex(startMarker)}[\\s\\S]*?${escapeForRegex(endMarker)}`,
    "m"
  );
  if (!pattern.test(source)) {
    throw new Error(`Missing marker ${marker} in ${normalizeSlashes(path.relative(repoRoot, filePath))}`);
  }
  fs.writeFileSync(
    filePath,
    source.replace(pattern, `${startMarker}\n${content}\n${endMarker}`)
  );
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  ensureDir(generatedDocsRoot);
  ensureDir(docsSiteGeneratedRoot);

  const inventory = buildInventory();

  writeJson(
    path.join(generatedDocsRoot, "process-library-inventory.json"),
    inventory
  );

  fs.writeFileSync(
    path.join(docsSiteGeneratedRoot, "processLibraryStats.js"),
    renderStatsModule(inventory)
  );

  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "process-library.md"),
    "process-library:lead",
    renderProcessLibraryLead(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "process-library.md"),
    "process-library:plain-english",
    renderPlainEnglishLine(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "process-library.md"),
    "process-library:catalog",
    renderProcessLibraryCatalog(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "process-definitions.md"),
    "process-definitions:lead",
    renderProcessDefinitionsLead(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "process-definitions.md"),
    "process-definitions:domains",
    renderDomainSummaryTable(inventory, "../../../")
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "index.md"),
    "user-guide-index:features-table",
    renderUserGuideFeaturesTable(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "index.md"),
    "user-guide-index:process-library-highlight",
    renderUserGuideHighlight(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "reference", "glossary.md"),
    "glossary:process-library",
    renderGlossaryBlock(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "best-practices.md"),
    "best-practices:domains",
    renderDomainSummaryTable(inventory, "../../../")
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "reference", "slash-commands.md"),
    "slash-commands:process-library-link",
    renderSlashCommandsLink(inventory)
  );
  replaceRegion(
    path.join(docsRoot, "user-guide", "features", "quality-convergence.md"),
    "quality-convergence:domains",
    renderQualityConvergenceDomains(inventory)
  );
}

main();
