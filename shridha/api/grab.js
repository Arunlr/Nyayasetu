export default async function handler(req, res) {
  try {
    const pages = ['home', 'services', 'gallery'];
    const seen = new Set();
    const items = [];
    for (const p of pages) {
      const r = await fetch(`https://sites.google.com/view/shridhadental/${p}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : [])
        .map(c => c.split(';')[0]).join('; ');
      const html = await r.text();
      const raw = [...html.matchAll(/https:\/\/(?:sites\.google\.com\/sitesv-images-rt|lh[0-9]*\.googleusercontent\.com)\/[A-Za-z0-9_=-]+/g)]
        .map(m => m[0]);
      let li = 0;
      for (const u of raw) {
        const base = u.split('=')[0];
        if (!seen.has(base)) {
          seen.add(base);
          items.push({ key: `${p}-${li}`, page: p, base, cookies });
        }
        li++;
      }
    }
    const w = req.query.w || '140';
    const sel = req.query.n !== undefined
      ? [items[parseInt(req.query.n, 10)]].filter(Boolean)
      : items;
    const out = await Promise.all(sel.map(async (it) => {
      const ir = await fetch(`${it.base}=w${w}-rj`, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          ...(it.cookies ? { Cookie: it.cookies } : {}),
          Referer: `https://sites.google.com/view/shridhadental/${it.page}`
        }
      });
      const b64 = Buffer.from(await ir.arrayBuffer()).toString('base64');
      const wrapped = (b64.match(/.{1,120}/g) || []).join('\n');
      return `@@${it.key}@@\n${wrapped}\n@@END@@`;
    }));
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(out.join('\n'));
  } catch (e) {
    res.status(500).send('ERR:' + e.message);
  }
}
