import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lexicalJsonToHtml, lexicalJsonToPlainText, normalizeLexicalJson } from './blog-content.ts';

describe('Lexical blog content', () => {
  it('normalizes supported formatting and serializes safe HTML', () => {
    const json = JSON.stringify({ root: { type: 'root', children: [
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'العنوان', format: 1 }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'نص مهم', format: 2 }] },
      { type: 'blog-image', src: 'https://cdn.sanity.io/image.jpg', alt: 'صورة', caption: 'تعليق' },
    ] } });
    const normalized = normalizeLexicalJson(json);
    const html = lexicalJsonToHtml(normalized);
    assert.match(html, /<h2><strong>العنوان<\/strong><\/h2>/);
    assert.match(html, /<em>نص مهم<\/em>/);
    assert.match(html, /<img[^>]+alt="صورة"/);
    assert.equal(lexicalJsonToPlainText(normalized), 'العنوان نص مهم تعليق');
  });

  it('drops unsafe links and temporary image URLs', () => {
    const json = JSON.stringify({ root: { type: 'root', children: [
      { type: 'paragraph', children: [{ type: 'link', url: 'javascript:alert(1)', children: [{ type: 'text', text: 'خطر' }] }] },
      { type: 'blog-image', src: 'blob:temporary', alt: 'مؤقت' },
    ] } });
    const html = lexicalJsonToHtml(json);
    assert.doesNotMatch(html, /javascript|blob:/);
    assert.match(html, /خطر/);
  });

  it('preserves text when an invalid link URL is removed', () => {
    const json = JSON.stringify({ root: { type: 'root', children: [
      { type: 'paragraph', children: [{ type: 'link', url: 'not-a-url', children: [{ type: 'text', text: 'يبقى النص' }] }] },
    ] } });
    const html = lexicalJsonToHtml(normalizeLexicalJson(json));
    assert.equal(html, '<p>يبقى النص</p>');
  });

  it('keeps supported inline image alignment and width controls', () => {
    const json = JSON.stringify({ root: { type: 'root', children: [
      { type: 'blog-image', src: 'https://cdn.sanity.io/image.jpg', alt: 'صورة', align: 'left', width: 50 },
    ] } });
    const normalized = normalizeLexicalJson(json);
    assert.match(normalized, /"align":"left"/);
    assert.match(normalized, /"width":50/);
    assert.match(lexicalJsonToHtml(normalized), /style="width:50%;margin-inline:auto 0"/);
  });

  it('keeps supported video alignment and width controls', () => {
    const json = JSON.stringify({ root: { type: 'root', children: [
      { type: 'blog-video', src: 'https://www.youtube-nocookie.com/embed/demo', align: 'right', width: 75 },
    ] } });
    const normalized = normalizeLexicalJson(json);
    assert.match(normalized, /"align":"right"/);
    assert.match(normalized, /"width":75/);
    assert.match(lexicalJsonToHtml(normalized), /<figure class="blog-body__embed" style="width:75%;margin-inline:0 auto"/);
  });
});
