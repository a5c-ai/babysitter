const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const distDir = path.join(packageRoot, "dist");

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(path.join(packageRoot, "src", "index.json"), path.join(distDir, "index.json"));
