"use strict";

const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const distRoot = path.join(packageRoot, "dist");
const discoveryModulePath = path.join(distRoot, "discovery.js");
const snapshotPath = path.join(distRoot, "discovery-snapshot.json");

if (!fs.existsSync(discoveryModulePath)) {
  throw new Error(`Build artifact not found: ${discoveryModulePath}`);
}

const discovery = require(discoveryModulePath);

if (typeof discovery.clearCatalogDiscoveryCache === "function") {
  discovery.clearCatalogDiscoveryCache();
}

if (typeof discovery.getCatalogDiscoverySnapshot !== "function") {
  throw new Error(`Expected getCatalogDiscoverySnapshot export in ${discoveryModulePath}`);
}

const snapshot = discovery.getCatalogDiscoverySnapshot();
fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(packageRoot, snapshotPath)}`);
