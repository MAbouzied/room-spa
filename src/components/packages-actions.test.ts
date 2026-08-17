import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

describe('package card booking actions', () => {
  it('stacks book and gift as full-width accent buttons on their own rows', async () => {
    const packagesAstro = await readFile(new URL('src/components/Packages.astro', projectRoot), 'utf8');

    assert.match(packagesAstro, /class="packages__actions"/);
    assert.match(
      packagesAstro,
      /\.packages__actions\s*\{[^}]*flex-direction:\s*column/,
      'book and gift must stack in a column so each sits on its own row',
    );
    assert.doesNotMatch(
      packagesAstro,
      /class="packages__gift-link"/,
      'gift must not be a text link that can disappear beside the book button',
    );

    const bookModeActions = packagesAstro.slice(
      packagesAstro.indexOf('{isGift ? ('),
      packagesAstro.indexOf('</div>', packagesAstro.indexOf('class="packages__actions"')),
    );

    assert.match(bookModeActions, /احجز هذه الباقة/);
    assert.match(bookModeActions, /href="\/gift"/);
    assert.match(bookModeActions, /أهدِ الآن/);
    assert.match(bookModeActions, /variant="accent"/);
    assert.match(bookModeActions, /shape="xl"/);
    assert.match(bookModeActions, /\bfull\b/);
  });
});
