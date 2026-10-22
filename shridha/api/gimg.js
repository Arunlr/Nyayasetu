const MAP = {
  'home-0': ['home', 0],
  'home-6': ['home', 6],
  'home-7': ['home', 7],
  'home-8': ['home', 8],
  'home-9': ['home', 9],
  'services-6': ['services', 6],
  'services-7': ['services', 7],
  'services-8': ['services', 8],
  'services-9': ['services', 9],
  'services-10': ['services', 10],
  'services-11': ['services', 11],
  'services-12': ['services', 12],
  'services-13': ['services', 13],
  'services-14': ['services', 14],
  'gallery-6': ['gallery', 6],
  'gallery-7': ['gallery', 7],
  'gallery-8': ['gallery', 8]
};

function fallbackRedirect(res, k) {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.writeHead(302, { Location: `/assets/gs-${k}.jpg` });
  res.end();
}

module.exports = async (req, res) => {
  const k = String(req.query.k || 'home-7');
  const w = Math.min(1600, Math.max(240, parseInt(req.query.w || '1200', 10) || 1200));
  const entry = MAP[k];
  if (!entry) {
    res.status(404).end('Unknown image key');
    return;
  }
  const [slug, idx] = entry;
  try {
    const pageResp = await fetch(`https://sites.google.com/view/shridhadental/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!pageResp.ok) return fallbackRedirect(res, k);

    const html = await pageResp.text();
    const re = /https:\/\/LH3\.googleusercontent\.com\/sitesv\/[A-Za-z0-9_-]+=w\d+/gi;
    const seen = [];
    let m;
    while ((m = re.exec(html)) !== null) {
      const base = m[0].replace(/=w\d+$/i, '');
      if (!seen.includes(base)) seen.push(base);
    }
    const target = seen[idx];
    if (!target) return fallbackRedirect(res, k);

    const imgResp = await fetch(`${target}=w${w}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const ct = imgResp.headers.get('content-type') || '';
    if (!imgResp.ok || !ct.startsWith('image/')) {
      return fallbackRedirect(res, k);
    }

    const buf = Buffer.from(await imgResp.arrayBuffer());
    if (buf.length < 512) return fallbackRedirect(res, k);

    res.setHeader('Content-Type', ct);
    res.setHeader(
      'Cache-Control',
      'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400'
    );
    res.status(200).send(buf);
  } catch (_err) {
    return fallbackRedirect(res, k);
  }
};
