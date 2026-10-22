const VALID_PAGES = new Set(['home', 'services', 'gallery']);
const PAGE_CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const IMG_RE =
  /https:\/\/(?:sites\.google\.com\/sitesv-images-rt|lh[0-9]*\.googleusercontent\.com)\/[A-Za-z0-9_=-]+/g;

async function getPageManifest(page) {
  const now = Date.now();
  const hit = PAGE_CACHE.get(page);
  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return hit.promise;
  }
  const promise = (async () => {
    const r = await fetch(`https://sites.google.com/view/shridhadental/${page}`, {
      headers: { 'User-Agent': UA }
    });
    if (!r.ok) throw new Error(`Upstream page ${page} HTTP ${r.status}`);
    const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : [])
      .map((c) => c.split(';')[0])
      .join('; ');
    const html = await r.text();
    const raw = [...html.matchAll(IMG_RE)].map((m) => m[0]);
    return { raw, cookies };
  })();

  PAGE_CACHE.set(page, { ts: now, promise });
  try {
    return await promise;
  } catch (err) {
    PAGE_CACHE.delete(page);
    throw err;
  }
}

async function fetchSingleKey(k, w) {
  const dash = k.indexOf('-');
  if (dash < 1) return null;
  const page = k.slice(0, dash);
  const idx = parseInt(k.slice(dash + 1), 10);
  if (!VALID_PAGES.has(page) || Number.isNaN(idx) || idx < 0) return null;

  const { raw, cookies } = await getPageManifest(page);
  const targetRaw = raw[idx];
  if (!targetRaw) return null;

  const base = targetRaw.split('=')[0];
  const ir = await fetch(`${base}=w${w}`, {
    headers: {
      'User-Agent': UA,
      ...(cookies ? { Cookie: cookies } : {}),
      Referer: `https://sites.google.com/view/shridhadental/${page}`
    }
  });
  const ct = ir.headers.get('content-type') || '';
  if (!ir.ok || !ct.startsWith('image/')) return null;

  const buf = Buffer.from(await ir.arrayBuffer());
  if (buf.length < 400) return null;
  return { buf, ct };
}

function fallbackRedirect(res, k) {
  const safeKey = String(k || 'home-7').replace(/[^a-z0-9-]/gi, '');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.writeHead(302, { Location: `/assets/gs-${safeKey}.jpg` });
  res.end();
}

export default async function handler(req, res) {
  if (req.query.audit === '1') {
    const keys = [
      'home-0', 'home-6', 'home-7', 'home-8', 'home-9',
      'services-6', 'services-7', 'services-8', 'services-9',
      'services-10', 'services-11', 'services-12', 'services-13', 'services-14',
      'gallery-6', 'gallery-7', 'gallery-8'
    ];
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const out = await fetchSingleKey(key, 900);
          return out
            ? { key, ok: true, ct: out.ct, bytes: out.buf.length }
            : { key, ok: false };
        } catch (e) {
          return { key, ok: false, err: e.message };
        }
      })
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(JSON.stringify({ count: results.length, results }, null, 2));
  }

  const k = String(req.query.k || 'home-7');
  const w = Math.min(1600, Math.max(240, parseInt(req.query.w || '1200', 10) || 1200));

  try {
    const out = await fetchSingleKey(k, w);
    if (!out) return fallbackRedirect(res, k);

    res.setHeader('Content-Type', out.ct);
    res.setHeader(
      'Cache-Control',
      'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400'
    );
    return res.status(200).send(out.buf);
  } catch (_err) {
    return fallbackRedirect(res, k);
  }
}
