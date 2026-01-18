#!/usr/bin/env node
"use strict";

// Alias to @a5c-ai/babysitter-sdk CLI
// This metapackage re-exports the babysitter CLI from the SDK package
const { createBabysitterCli } = require("@a5c-ai/babysitter-sdk/dist/cli/main.js");

void createBabysitterCli().run();
