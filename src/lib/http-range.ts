const ACCEPT_RANGES = 'bytes';

type ByteRange = {
  start: number;
  end: number;
};

type ParsedRange = ByteRange | 'unsatisfiable' | 'ignore';

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

export function isVideoAssetPath(pathname: string): boolean {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const normalized = decoded.replaceAll('\\', '/');
  if (normalized.includes('..')) return false;

  const cleaned = normalized.replace(/\/+$/, '') || '/';
  return cleaned === '/videos' || cleaned.startsWith('/videos/');
}

export function getAssetsFetcher(locals: unknown): AssetFetcher | null {
  if (!locals || typeof locals !== 'object' || !('runtime' in locals)) return null;
  const runtime = locals.runtime;
  if (!runtime || typeof runtime !== 'object' || !('env' in runtime)) return null;
  const env = runtime.env;
  if (!env || typeof env !== 'object' || !('ASSETS' in env)) return null;
  const assets = env.ASSETS;
  if (!assets || typeof assets !== 'object' || !('fetch' in assets)) return null;
  if (typeof assets.fetch !== 'function') return null;
  return assets as AssetFetcher;
}

function copyAssetHeaders(source: Headers): Headers {
  const headers = new Headers(source);
  headers.delete('Content-Length');
  headers.set('Accept-Ranges', ACCEPT_RANGES);
  headers.append('Vary', 'Range');
  return headers;
}

function parseByteRange(header: string | null, size: number): ParsedRange {
  if (!header) return 'ignore';

  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return 'ignore';

  const startRaw = match[1];
  const endRaw = match[2];
  if (startRaw === '' && endRaw === '') return 'unsatisfiable';

  if (startRaw === '') {
    const suffix = Number(endRaw);
    if (!Number.isInteger(suffix) || suffix <= 0 || size === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }

  const start = Number(startRaw);
  if (!Number.isInteger(start) || start < 0 || start >= size) return 'unsatisfiable';
  if (endRaw === '') return { start, end: size - 1 };

  const end = Number(endRaw);
  if (!Number.isInteger(end) || end < start) return 'unsatisfiable';
  return { start, end: Math.min(end, size - 1) };
}

export async function applyByteRange(request: Request, response: Response): Promise<Response> {
  if (response.status !== 200) return response;

  const headers = copyAssetHeaders(response.headers);
  const payload = new Uint8Array(await response.arrayBuffer());
  const parsed = parseByteRange(request.headers.get('Range'), payload.byteLength);

  if (parsed === 'ignore') {
    headers.set('Content-Length', String(payload.byteLength));
    return new Response(payload, { status: 200, statusText: response.statusText, headers });
  }

  if (parsed === 'unsatisfiable') {
    headers.set('Content-Range', `bytes */${payload.byteLength}`);
    headers.set('Content-Length', '0');
    headers.set('Cache-Control', 'private, no-store');
    headers.set('CDN-Cache-Control', 'no-store');
    return new Response(null, { status: 416, headers });
  }

  const slice = payload.subarray(parsed.start, parsed.end + 1);
  headers.set('Content-Range', `bytes ${parsed.start}-${parsed.end}/${payload.byteLength}`);
  headers.set('Content-Length', String(slice.byteLength));
  headers.set('Cache-Control', 'private, no-store');
  headers.set('CDN-Cache-Control', 'no-store');
  return new Response(slice, { status: 206, headers });
}

export async function serveRangedAsset(
  request: Request,
  fetchAsset: (request: Request) => Promise<Response>,
): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete('Range');
  const assetRequest = new Request(request.url, { method: 'GET', headers });
  const assetResponse = await fetchAsset(assetRequest);
  return applyByteRange(request, assetResponse);
}

export async function maybeServeVideoAsset(
  pathname: string,
  request: Request,
  locals: unknown,
): Promise<Response | null> {
  if (!isVideoAssetPath(pathname)) return null;
  const assets = getAssetsFetcher(locals);
  if (!assets) return null;
  return serveRangedAsset(request, (assetRequest) => assets.fetch(assetRequest));
}

type AssetsEnv = {
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
};

export async function serveVideoAssetFromEnv(
  request: Request,
  env: AssetsEnv | null | undefined,
): Promise<Response | null> {
  const pathname = new URL(request.url).pathname;
  if (!isVideoAssetPath(pathname)) return null;
  const assets = env?.ASSETS;
  if (!assets || typeof assets.fetch !== 'function') return null;
  return serveRangedAsset(request, (assetRequest) => assets.fetch(assetRequest));
}
