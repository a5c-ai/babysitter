import { registerToolCallRenderer } from './registry.js';
import { bashRenderer } from './renderers/bash.js';
import { editRenderer } from './renderers/edit.js';
import { genericToolRenderer } from './renderers/generic.js';
import { globRenderer } from './renderers/glob.js';
import { grepRenderer } from './renderers/grep.js';
import { readRenderer } from './renderers/read.js';
import { webFetchRenderer } from './renderers/web-fetch.js';
import { webSearchRenderer } from './renderers/web-search.js';
import { writeRenderer } from './renderers/write.js';

let builtInsRegistered = false;

export function registerBuiltInToolCallRenderers(): void {
  if (builtInsRegistered) {
    return;
  }

  builtInsRegistered = true;
  for (const renderer of [
    bashRenderer,
    webFetchRenderer,
    webSearchRenderer,
    editRenderer,
    writeRenderer,
    grepRenderer,
    globRenderer,
    readRenderer,
    genericToolRenderer,
  ]) {
    registerToolCallRenderer(renderer);
  }
}
