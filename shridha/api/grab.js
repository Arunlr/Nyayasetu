export default async function handler(req, res) {
  try {
    const mode = req.query.mode || 'meta';
    const w = req.query.w || '1080';
    const pages = ['home', 'services', 'gallery'];

    async function fetchPageUrls(p) {
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
      const seen = new Set();
      const urls = [];
      for (const u of raw) {
        const base = u.split('=')[0];
        if (!seen.has(base)) {
          seen.add(base);
          urls.push(base + `=w${w}`);
        }
      }
      return { cookies, urls };
    }

    if (mode === 'meta') {
      const out = {};
      for (const p of pages) {
        const { cookies, urls } = await fetchPageUrls(p);
        out[p] = [];
        for (let i = 0; i < urls.length; i++) {
          const ir = await fetch(urls[i], {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              ...(cookies ? { Cookie: cookies } : {}),
              Referer: `https://sites.google.com/view/shridhadental/${p}`
            }
          });
          const buf = Buffer.from(await ir.arrayBuffer());
          out[p].push({
            idx: i,
            status: ir.status,
            type: ir.headers.get('content-type'),
            bytes: buf.length
          });
        }
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(JSON.stringify(out, null, 2));
    }

    if (mode === 'b64') {
      const p = req.query.page || 'home';
      const idx = parseInt(req.query.idx || '0', 10);
      const { cookies, urls } = await fetchPageUrls(p);
      if (!urls[idx]) return res.status(404).send('NOT_FOUND');
      const ir = await fetch(urls[idx], {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          ...(cookies ? { Cookie: cookies } : {}),
          Referer: `https://sites.google.com/view/shridhadental/${p}`
        }
      });
      const buf = Buffer.from(await ir.arrayBuffer());
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(`TYPE:${ir.headers.get('content-type')}|BYTES:${buf.length}|DATA:${buf.toString('base64')}`);
    }

    if (mode === 'jd') {
      const u = req.query.u;
      const ir = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await ir.arrayBuffer());
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(`TYPE:${ir.headers.get('content-type')}|BYTES:${buf.length}|DATA:${buf.toString('base64')}`);
    }

    res.status(400).send('bad mode');
  } catch (err) {
    res.status(500).send('ERR:' + err.message);
  }
}
