import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { findRelativeSpecifiers, pruneWorkerBundle, VIDEO_RANGE_ENTRY, VIDEO_RANGE_WORKER_FIRST } from '../../scripts/prune-worker-bundle.mjs';

const projectRoot = new URL('../../', import.meta.url);

describe('prune Worker bundle', () => {
  it('finds relative ESM imports and import.meta.url assets', () => {
    const specs = findRelativeSpecifiers(`
      import { x } from './keep.mjs';
      export { y } from '../shared.js';
      import('./lazy.mjs');
      const wasm = new URL('./mod.wasm', import.meta.url);
    `);
    assert.deepEqual(specs, ['./keep.mjs', '../shared.js', './lazy.mjs', './mod.wasm']);
  });

  it('deletes unreachable prerender chunks and keeps the SSR graph', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'prune-worker-'));
    try {
      await mkdir(path.join(dir, 'chunks'), { recursive: true });
      await mkdir(path.join(dir, '.prerender', 'chunks'), { recursive: true });
      await writeFile(path.join(dir, 'entry.mjs'), `import './chunks/keep.mjs';\n`);
      await writeFile(path.join(dir, 'chunks', 'keep.mjs'), `export const ok = true;\n`);
      await writeFile(
        path.join(dir, '.prerender', 'chunks', 'BaseLayout.mjs'),
        `export const unused = true;\n`.repeat(50),
      );
      await writeFile(path.join(dir, 'wrangler.json'), JSON.stringify({ main: 'entry.mjs' }));

      const result = await pruneWorkerBundle(dir);

      assert.equal(result.removed.length, 1);
      assert.match(result.removed[0].file, /BaseLayout\.mjs$/);
      const wrangler = JSON.parse(await readFile(path.join(dir, 'wrangler.json'), 'utf8'));
      assert.equal(wrangler.main, VIDEO_RANGE_ENTRY);
      assert.deepEqual(wrangler.assets.run_worker_first, VIDEO_RANGE_WORKER_FIRST);
      await readFile(path.join(dir, VIDEO_RANGE_ENTRY));
      await readFile(path.join(dir, 'http-range.mjs'));
      await readFile(path.join(dir, 'entry.mjs'));
      await readFile(path.join(dir, 'chunks', 'keep.mjs'));
      await assert.rejects(readFile(path.join(dir, '.prerender', 'chunks', 'BaseLayout.mjs')));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('keeps a prerender file when the Worker entry imports it', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'prune-worker-keep-'));
    try {
      await mkdir(path.join(dir, '.prerender'), { recursive: true });
      await writeFile(path.join(dir, 'entry.mjs'), `import './.prerender/needed.mjs';\n`);
      await writeFile(path.join(dir, '.prerender', 'needed.mjs'), `export const needed = true;\n`);
      await writeFile(path.join(dir, 'wrangler.json'), JSON.stringify({ main: 'entry.mjs' }));

      const result = await pruneWorkerBundle(dir);

      assert.equal(result.removed.length, 0);
      await readFile(path.join(dir, '.prerender', 'needed.mjs'));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('astro-icon allowlist', () => {
  it('includes every icon name used in source', async () => {
    const config = await readFile(new URL('astro.config.mjs', projectRoot), 'utf8');
    const used = [
      'account-tie',
      'calendar-check',
      'card-account-details-outline',
      'check-circle',
      'chevron-left',
      'chevron-right',
      'clock-outline',
      'close',
      'crown-outline',
      'email-fast-outline',
      'flower-outline',
      'format-quote-open',
      'gift',
      'gift-outline',
      'hand-heart',
      'heart-outline',
      'instagram',
      'map-marker',
      'map-marker-outline',
      'map-outline',
      'menu',
      'message-outline',
      'message-text-outline',
      'phone',
      'phone-outline',
      'shield-check-outline',
      'shower',
      'spa-outline',
      'star',
      'star-four-points-outline',
      'whatsapp',
      'hand',
    ];

    assert.match(config, /include:\s*\{/);
    for (const name of used) {
      assert.match(config, new RegExp(`['"]${name}['"]`));
    }
  });
});
