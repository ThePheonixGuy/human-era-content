#!/usr/bin/env node
// Validates content/**/*.md and content/scenes against the content rules. Zero dependencies.
// Usage: node tools/validate-content.mjs   (run from anywhere; it checks the repo it lives in)
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadContent, validate } from './lib/content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = validate(loadContent(root), root);
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} content error(s)`);
  process.exit(1);
}
console.log('content ok');
