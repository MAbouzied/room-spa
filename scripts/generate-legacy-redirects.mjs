/**
 * Write public/_redirects from the TypeScript source of truth.
 *
 * Usage:
 *   npm run generate:redirects
 *   node --experimental-strip-types scripts/generate-legacy-redirects.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRedirectsFile } from '../src/lib/legacy-redirects.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'public', '_redirects');

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, buildRedirectsFile(), 'utf8');
console.log(`Wrote ${path.relative(root, outPath)}`);
