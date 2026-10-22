export default async function handler(req, res) {
  try {
    const pages = ['home', 'services', 'gallery'];
    const seen = new Set();
    const items = [];

    for (const p of pages) {
      const r = await fetch(`https://sites.google.com/view/shridhadental/${p}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
      const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : [])
        .map(c => c.split(';')[0])
        .join('; ');
      const html = await r.text();
      const raw = [...html.matchAll(/https:\/\/(?:sites\.google\.com\/sitesv-images-rt|lh[0-9]*\.googleusercontent\.com)\/[A-Za-z0-9_=-]+/g)]
        .map(m => m[0]);
      let localIdx = 0;
      for (const u of raw) {
        const base = u.split('=')[0];
        if (!seen.has(base)) {
          seen.add(base);
          items.push({ key: `${p}-${localIdx}`, page: p, base, cookies });
        }
        localIdx++;
      }
    }

    const k = req.query.k;
    const w = req.query.w || '1600';
    const found = items.find(x => x.key === k) || items[parseInt(req.query.n || '0', 10)];
    if (!found) return res.status(404).send('Not found');

    const ir = await fetch(`${found.base}=w${w}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        ...(found.cookies ? { Cookie: found.cookies } : {}),
        Referer: `https://sites.google.com/view/shridhadental/${found.page}`
      }
    });
    const buf = Buffer.from(await ir.arrayBuffer());
    res.setHeader('Content-Type', ir.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=31536000');
    return res.status(200).send(buf);
  } catch (err) {
    res.status(500).send('ERR:' + err.message);
  }
}
