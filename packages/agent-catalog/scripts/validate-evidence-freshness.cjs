const fs = require("fs");
const path = require("path");
const { parse } = require("yaml");

function readYaml(filePath) {
  return parse(fs.readFileSync(filePath, "utf8"));
}

function listYamlFilesRecursively(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return targetPath.endsWith(".yaml") ? [targetPath] : [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => listYamlFilesRecursively(path.join(targetPath, entry.name)))
    .sort((left, right) => left.localeCompare(right));
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an array.`);
  }
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseIsoDate(value, label) {
  const parsed = Date.parse(value);
  if (typeof value !== "string" || Number.isNaN(parsed)) {
    throw new Error(`Expected ${label} to be an ISO-8601 timestamp.`);
  }
  return parsed;
}

function getVendorPolicy(graphDocument) {
  const policy = graphDocument.evidencePolicy;
  if (!policy || typeof policy !== "object") {
    throw new Error("GraphDocument.evidencePolicy must be an object.");
  }
  const vendorPolicy = policy.vendorBackedEvidence;
  if (!vendorPolicy || typeof vendorPolicy !== "object") {
    throw new Error("GraphDocument.evidencePolicy.vendorBackedEvidence must be defined.");
  }
  const selector = vendorPolicy.selector;
  if (!selector || typeof selector !== "object") {
    throw new Error("vendorBackedEvidence.selector must be defined.");
  }
  return {
    requiredAttributes: ensureArray(vendorPolicy.requiredAttributes, "vendorBackedEvidence.requiredAttributes"),
    kindLabels: ensureArray(selector.kindLabels, "vendorBackedEvidence.selector.kindLabels"),
    trustLevels: ensureArray(selector.trustLevels, "vendorBackedEvidence.selector.trustLevels"),
    maxFreshnessWindowDays: vendorPolicy.maxFreshnessWindowDays,
    reviewOwnerPattern: vendorPolicy.reviewOwnerPattern,
    reachability: vendorPolicy.reachability || {},
  };
}

function loadGraphData(_rootDir) {
  const atlasPath = path.resolve(__dirname, "..", "..", "atlas");
  const { atlas } = require(path.join(atlasPath, "dist", "index.js"));

  const nodes = atlas
    .getAllRecords()
    .map((r) => ({ ...r, kind: r._kind }));

  const graphDocument = {
    generatedAt: new Date().toISOString(),
    graphId: "graph:agent-catalog",
    schemaVersion: "2026.04.agent-catalog-v2",
    evidencePolicy: {
      kindLabels: ["web", "docs", "repo"],
      trustLevels: ["vendor-official", "vendor-adjacent"],
      maxAgeDays: 90,
    },
  };

  return { graphDocument, nodes };
}

function isVendorBackedEvidence(node, policy) {
  return (
    node.kind === "EvidenceSource" &&
    policy.kindLabels.includes(node.kindLabel) &&
    policy.trustLevels.includes(node.trustLevel)
  );
}

function collectVendorEvidence(rootDir) {
  const { graphDocument, nodes } = loadGraphData(rootDir);
  const policy = getVendorPolicy(graphDocument);
  const evidenceSources = nodes.filter((node) => isVendorBackedEvidence(node, policy));
  return { graphDocument, policy, evidenceSources };
}

function validateMetadata(evidenceSources, policy, now) {
  const reviewOwnerMatcher = new RegExp(policy.reviewOwnerPattern);
  const staleEvidence = [];

  for (const node of evidenceSources) {
    for (const field of policy.requiredAttributes) {
      if (!(field in node)) {
        throw new Error(`Vendor evidence ${node.id} is missing required field "${field}".`);
      }
    }

    if (typeof node.reviewOwner !== "string" || !reviewOwnerMatcher.test(node.reviewOwner)) {
      throw new Error(`Vendor evidence ${node.id} must declare a reviewOwner matching ${policy.reviewOwnerPattern}.`);
    }

    if (!Number.isInteger(node.freshnessWindowDays) || node.freshnessWindowDays <= 0) {
      throw new Error(`Vendor evidence ${node.id} must declare a positive integer freshnessWindowDays.`);
    }

    if (node.freshnessWindowDays > policy.maxFreshnessWindowDays) {
      throw new Error(
        `Vendor evidence ${node.id} freshnessWindowDays ${node.freshnessWindowDays} exceeds policy max ${policy.maxFreshnessWindowDays}.`,
      );
    }

    const capturedAt = parseIsoDate(node.capturedAt, `${node.id}.capturedAt`);
    const reviewedAt = parseIsoDate(node.reviewedAt, `${node.id}.reviewedAt`);

    if (reviewedAt < capturedAt) {
      throw new Error(`Vendor evidence ${node.id} reviewedAt must be on or after capturedAt.`);
    }

    const ageDays = Math.floor((now - reviewedAt) / 86400000);
    if (ageDays > node.freshnessWindowDays) {
      staleEvidence.push({
        evidenceId: node.evidenceId,
        reviewedAt: node.reviewedAt,
        freshnessWindowDays: node.freshnessWindowDays,
        ageDays,
      });
    }
  }

  return staleEvidence;
}

async function fetchReachability(url, policy) {
  const timeoutMs =
    Number.isInteger(policy.reachability.timeoutMs) && policy.reachability.timeoutMs > 0
      ? policy.reachability.timeoutMs
      : 15000;
  const retries =
    Number.isInteger(policy.reachability.retries) && policy.reachability.retries >= 0
      ? policy.reachability.retries
      : 2;
  const acceptedStatusCodes = new Set(
    Array.isArray(policy.reachability.acceptedStatusCodes) ? policy.reachability.acceptedStatusCodes : [200],
  );

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });

      if (response.status === 405 || response.status === 501) {
        response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
      }

      if (!response.ok && !acceptedStatusCodes.has(response.status)) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        url,
        status: response.status,
        finalUrl: response.url,
      };
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`${url} -> ${error.message}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`${url} -> unreachable`);
}

async function runReachabilityChecks(evidenceSources, policy) {
  const concurrency = 8;
  const pending = evidenceSources.slice();
  const results = [];
  const failures = [];

  async function worker() {
    while (pending.length > 0) {
      const node = pending.shift();
      if (!node) {
        return;
      }

      try {
        results.push(
          await fetchReachability(node.sourcePathOrUrl, policy).then((reachability) => ({
            evidenceId: node.evidenceId,
            ...reachability,
          })),
        );
      } catch (error) {
        failures.push({
          evidenceId: node.evidenceId,
          sourcePathOrUrl: node.sourcePathOrUrl,
          error: error.message,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, evidenceSources.length) }, () => worker()));

  return { results, failures };
}

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const { graphDocument, policy, evidenceSources } = collectVendorEvidence(rootDir);
  const staleEvidence = validateMetadata(evidenceSources, policy, Date.now());

  if (staleEvidence.length > 0) {
    fail(
      [
        "Vendor evidence is stale:",
        ...staleEvidence.map(
          (entry) =>
            `- ${entry.evidenceId}: reviewedAt=${entry.reviewedAt}, ageDays=${entry.ageDays}, freshnessWindowDays=${entry.freshnessWindowDays}`,
        ),
      ].join("\n"),
    );
  }

  let reachability = {
    results: [],
    failures: [],
  };

  if (process.env.AGENT_CATALOG_SKIP_VENDOR_WEB_CHECK !== "1") {
    reachability = await runReachabilityChecks(evidenceSources, policy);
    if (reachability.failures.length > 0) {
      fail(
        [
          "Vendor evidence reachability failed:",
          ...reachability.failures.map(
            (entry) => `- ${entry.evidenceId}: ${entry.sourcePathOrUrl} (${entry.error})`,
          ),
        ].join("\n"),
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        graphId: graphDocument.graphId,
        checkedEvidenceSources: evidenceSources.length,
        staleEvidenceCount: staleEvidence.length,
        reachabilityChecked: process.env.AGENT_CATALOG_SKIP_VENDOR_WEB_CHECK === "1" ? 0 : reachability.results.length,
        reachabilitySkipped: process.env.AGENT_CATALOG_SKIP_VENDOR_WEB_CHECK === "1",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => fail(error.message));
