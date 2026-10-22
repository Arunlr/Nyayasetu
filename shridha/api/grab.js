function wrap100(b64) {
  return b64.replace(/.{1,100}/g, '$&\n');
}

export default async function handler(req, res) {
  try {
    const w = req.query.w || '1080';
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
          items.push({ key: `${p}-${localIdx}`, page: p, url: `${base}=w${w}`, cookies });
        }
        localIdx++;
      }
    }

    const idx = parseInt(req.query.i || '0', 10);
    if (req.query.mode === 'list') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(items.map((x, k) => `${k}: ${x.key}`).join('\n'));
    }

    const group = items.slice(idx, idx + 3);
    const out = [];
    for (const it of group) {
      const ir = await fetch(it.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          ...(it.cookies ? { Cookie: it.cookies } : {}),
          Referer: `https://sites.google.com/view/shridhadental/${it.page}`
        }
      });
      const buf = Buffer.from(await ir.arrayBuffer());
      out.push(`===START:${it.key}===\n${wrap100(buf.toString('base64'))}\n===END:${it.key}===`);
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(out.join('\n'));
  } catch (err) {
    res.status(500).send('ERR:' + err.message);
  }
}
