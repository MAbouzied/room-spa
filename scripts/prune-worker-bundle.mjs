/**
 * Drop Worker files that the SSR entry cannot reach.
 *
 * Astro still writes build-only `.prerender` chunks next to the Worker.
 * Wrangler uploads every `.mjs` under dist/server when `no_bundle` is true,
 * which blows the free 3MB gzip cap. Public HTML stays in dist/client.
 *
 * Usage:
 *   node scripts/prune-worker-bundle.mjs
 */

import { readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SPECIFIER_RE =
  /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]|new URL\(\s*['"](\.[^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g;

export function findRelativeSpecifiers(source) {
  const specs = [];
  for (const match of source.matchAll(SPECIFIER_RE)) {
    specs.push(match[1] ?? match[2]);
  }
  return specs;
}

function candidatePaths(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  if (path.extname(base)) return [base];
  return [base, `${base}.mjs`, `${base}.js`, path.join(base, 'index.mjs'), path.join(base, 'index.js')];
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(full)));
    else files.push(full);
  }
  return files;
}

export async function pruneWorkerBundle(serverDir) {
  const wranglerPath = path.join(serverDir, 'wrangler.json');
  const wrangler = JSON.parse(await readFile(wranglerPath, 'utf8'));
  const entry = path.resolve(serverDir, wrangler.main);

  const reachable = new Set([wranglerPath]);
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop();
    if (reachable.has(file)) continue;

    try {
      await stat(file);
    } catch {
      continue;
    }

    reachable.add(file);
    if (!/\.(mjs|js|cjs)$/i.test(file)) continue;

    const source = await readFile(file, 'utf8');
    for (const spec of findRelativeSpecifiers(source)) {
      for (const candidate of candidatePaths(file, spec)) {
        queue.push(candidate);
      }
    }
  }

  const removed = [];
  for (const file of await collectFiles(serverDir)) {
    if (reachable.has(file)) continue;
    const before = await stat(file);
    await rm(file, { force: true });
    removed.push({ file, bytes: before.size });
  }

  return { kept: [...reachable], removed };
}

const thisFile = fileURLToPath(import.meta.url);
const invokedDirectly =
  Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(thisFile).href;

if (invokedDirectly) {
  const root = path.resolve(path.dirname(thisFile), '..');
  const serverDir = path.join(root, 'dist', 'server');
  const { removed } = await pruneWorkerBundle(serverDir);
  const bytes = removed.reduce((sum, item) => sum + item.bytes, 0);
  console.log(
    `Pruned ${removed.length} unused Worker files (${Math.round(bytes / 1024)} KiB), including ${
      removed.filter((item) => item.file.includes(`${path.sep}.prerender${path.sep}`) || item.file.includes(`${path.sep}.prerender`))
        .length
    } prerender artifacts`,
  );
}
