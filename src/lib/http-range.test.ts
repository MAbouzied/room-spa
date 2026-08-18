import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  applyByteRange,
  getAssetsFetcher,
  isVideoAssetPath,
  maybeServeVideoAsset,
  serveRangedAsset,
  serveVideoAssetFromEnv,
} from './http-range.ts';

function videoResponse(body: string, extra: HeadersInit = {}) {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(body.length), ...extra },
  });
}

describe('isVideoAssetPath', () => {
  it('matches /videos and nested video files', () => {
    assert.equal(isVideoAssetPath('/videos/room-spa-hero.mp4'), true);
    assert.equal(isVideoAssetPath('/videos/room-spa-hero.webm'), true);
    assert.equal(isVideoAssetPath('/videos/'), true);
    assert.equal(isVideoAssetPath('/videos'), true);
  });

  it('ignores other public assets', () => {
    assert.equal(isVideoAssetPath('/images/hero-poster.webp'), false);
    assert.equal(isVideoAssetPath('/'), false);
    assert.equal(isVideoAssetPath('/video/room-spa-hero.mp4'), false);
    assert.equal(isVideoAssetPath('/videos/../.env'), false);
    assert.equal(isVideoAssetPath('/videos/%2e%2e/.env'), false);
  });
});

describe('applyByteRange', () => {
  it('adds Accept-Ranges on a full 200 when no Range header is present', async () => {
    const body = 'abcdefghij';
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4'),
      videoResponse(body),
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(response.headers.get('Content-Length'), String(body.length));
    assert.equal(response.headers.get('Content-Type'), 'video/mp4');
    assert.equal(await response.text(), body);
  });

  it('returns 206 with a sliced body for Range bytes=0-1', async () => {
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4', {
        headers: { Range: 'bytes=0-1' },
      }),
      videoResponse('abcdefghij'),
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(response.headers.get('Content-Length'), '2');
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/10');
    assert.equal(response.headers.get('Content-Type'), 'video/mp4');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('CDN-Cache-Control'), 'no-store');
    assert.match(response.headers.get('Vary') ?? '', /Range/);
    assert.equal(await response.text(), 'ab');
  });

  it('serves an open-ended range to the end of the file', async () => {
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/clip.mp4', {
        headers: { Range: 'bytes=8-' },
      }),
      videoResponse('abcdefghij'),
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 8-9/10');
    assert.equal(await response.text(), 'ij');
  });

  it('serves a suffix range', async () => {
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/clip.mp4', {
        headers: { Range: 'bytes=-3' },
      }),
      videoResponse('abcdefghij'),
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 7-9/10');
    assert.equal(await response.text(), 'hij');
  });

  it('returns 416 when the range cannot be satisfied', async () => {
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/clip.mp4', {
        headers: { Range: 'bytes=50-60' },
      }),
      videoResponse('abcdefghij'),
    );

    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), 'bytes */10');
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(await response.text(), '');
  });

  it('passes through non-200 asset responses without slicing', async () => {
    const missing = new Response('missing', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/missing.mp4', {
        headers: { Range: 'bytes=0-1' },
      }),
      missing,
    );

    assert.equal(response.status, 404);
    assert.equal(await response.text(), 'missing');
  });

  it('slices the real hero MP4 for a Safari Range probe', async () => {
    const file = await readFile(new URL('../../public/videos/room-spa-hero.mp4', import.meta.url));
    const response = await applyByteRange(
      new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4', {
        headers: { Range: 'bytes=0-1' },
      }),
      new Response(file, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': String(file.byteLength),
          'Cache-Control': 'public, max-age=604800',
        },
      }),
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), `bytes 0-1/${file.byteLength}`);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal((await response.arrayBuffer()).byteLength, 2);
  });
});

describe('serveRangedAsset', () => {
  it('loads the full asset then applies the client Range header', async () => {
    const asset = videoResponse('abcdefghij');
    const response = await serveRangedAsset(
      new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4', {
        headers: { Range: 'bytes=0-1' },
      }),
      async () => asset,
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/10');
    assert.equal(await response.text(), 'ab');
  });
});

describe('maybeServeVideoAsset', () => {
  it('returns null when the path is not a video asset or ASSETS is missing', async () => {
    const request = new Request('https://roomspa-sa.com/images/hero-poster.webp');
    assert.equal(await maybeServeVideoAsset('/images/hero-poster.webp', request, {}), null);
    assert.equal(
      await maybeServeVideoAsset(
        '/videos/room-spa-hero.mp4',
        new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4'),
        {},
      ),
      null,
    );
    assert.equal(getAssetsFetcher({}), null);
  });

  it('serves a 206 from the Cloudflare ASSETS binding', async () => {
    const locals = {
      runtime: {
        env: {
          ASSETS: {
            fetch: async () => videoResponse('abcdefghij'),
          },
        },
      },
    };

    const response = await maybeServeVideoAsset(
      '/videos/room-spa-hero.mp4',
      new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4', {
        headers: { Range: 'bytes=0-1' },
      }),
      locals,
    );

    assert.ok(response);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/10');
    assert.equal(await response.text(), 'ab');
  });
});

describe('serveVideoAssetFromEnv', () => {
  it('returns null when ASSETS is missing', async () => {
    const request = new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4', {
      headers: { Range: 'bytes=0-1' },
    });
    assert.equal(await serveVideoAssetFromEnv(request, {}), null);
  });

  it('applies Range before the Astro static-asset shortcut', async () => {
    const response = await serveVideoAssetFromEnv(
      new Request('https://roomspa-sa.com/videos/room-spa-hero.mp4', {
        headers: { Range: 'bytes=0-1' },
      }),
      { ASSETS: { fetch: async () => videoResponse('abcdefghij') } },
    );

    assert.ok(response);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/10');
    assert.equal(await response.text(), 'ab');
  });
});
