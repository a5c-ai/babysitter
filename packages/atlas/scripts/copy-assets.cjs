const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const distDir = path.join(packageRoot, "dist");

fs.mkdirSync(distDir, { recursive: true });
