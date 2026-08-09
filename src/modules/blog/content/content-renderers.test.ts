import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  collectPortableTextTableOfContents,
  shouldShowTableOfContents,
  tableOfContentsForBody,
} from './content-renderers.ts';

describe('portable text table of contents', () => {
  it('extracts H2 headings from portable text', () => {
    const toc = collectPortableTextTableOfContents([
      {
        _type: 'block',
        style: 'h2',
        _key: 'one',
        children: [{ _type: 'span', text: 'أول عنوان' }],
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'فقرة' }],
      },
      {
        _type: 'block',
        style: 'h2',
        _key: 'two',
        children: [{ _type: 'span', text: 'ثاني عنوان' }],
      },
    ]);

    assert.deepEqual(toc, [
      { id: 'one', text: 'أول عنوان' },
      { id: 'two', text: 'ثاني عنوان' },
    ]);
  });

  it('shows TOC only when there are at least four H2 items', () => {
    const body = {
      format: 'portableText' as const,
      value: Array.from({ length: 4 }, (_, index) => ({
        _type: 'block',
        style: 'h2',
        _key: `h-${index}`,
        children: [{ _type: 'span', text: `عنوان ${index + 1}` }],
      })),
    };
    const toc = tableOfContentsForBody(body);
    assert.equal(toc.length, 4);
    assert.equal(shouldShowTableOfContents(toc), true);
    assert.equal(shouldShowTableOfContents(toc.slice(0, 3)), false);
  });
});
