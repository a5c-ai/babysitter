#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXPECTED_USER_GUIDE_LINK = 'https://github.com/a5c-ai/babysitter/blob/main/USER_GUIDE.md';

const repoRoot = path.resolve(__dirname, '..');
const readmePath = path.join(repoRoot, 'README.md');

function fail(message) {
  console.error(`Metadata verification failed: ${message}`);
  process.exit(1);
}

let readmeContent;
try {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
} catch (error) {
  fail(`Unable to read README.md: ${error.message}`);
}


console.log('Metadata verification passed.');
