#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXPECTED_REPOSITORY_URL = 'https://github.com/a5c-ai/babysitter.git';
const EXPECTED_USER_GUIDE_LINK = 'https://github.com/a5c-ai/babysitter/blob/main/USER_GUIDE.md';

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const readmePath = path.join(repoRoot, 'README.md');

function fail(message) {
  console.error(`Metadata verification failed: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Unable to parse ${path.basename(filePath)}: ${error.message}`);
  }
}

const packageJson = readJson(packageJsonPath);
const repositoryUrl = packageJson?.repository?.url;

if (repositoryUrl !== EXPECTED_REPOSITORY_URL) {
  fail(
    `Expected repository.url to be "${EXPECTED_REPOSITORY_URL}" but found "${
      repositoryUrl ?? 'undefined'
    }".`
  );
}

let readmeContent;
try {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
} catch (error) {
  fail(`Unable to read README.md: ${error.message}`);
}

if (!readmeContent.includes(EXPECTED_USER_GUIDE_LINK)) {
  fail(`README.md must link to ${EXPECTED_USER_GUIDE_LINK}.`);
}

console.log('Metadata verification passed.');
