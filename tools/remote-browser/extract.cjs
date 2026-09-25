// Extract chrome-headless-shell from persist/*.br (auto-downloads from npm if missing)
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const os = require('node:os');

const PERSIST = path.join(__dirname, '..', 'persist');
const DEST = '/tmp/chrome149';
const FILES = ['chromium.br', 'fonts.tar.br', 'swiftshader.tar.br', 'al2023.tar.br'];

function ensurePersist() {
  const missing = FILES.filter(f => !fs.existsSync(path.join(PERSIST, f)));
  if (!missing.length) return;
  console.log('[extract] persist missing', missing.join(','), '— downloading from npm…');
  fs.mkdirSync(PERSIST, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chromedl-'));
  execSync('npm pack @sparticuz/chromium@149.0.0 --silent', { cwd: tmp });
  execSync('tar -xzf sparticuz-chromium-149.0.0.tgz', { cwd: tmp });
  for (const f of FILES) fs.copyFileSync(path.join(tmp, 'package', 'bin', f), path.join(PERSIST, f));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('[extract] persist restored from npm');
}

function setupFonts() {
  try {
    fs.mkdirSync('/tmp/fonts', { recursive: true });
    fs.mkdirSync('/tmp/fonts-cache', { recursive: true });
    fs.copyFileSync(path.join(DEST, 'fonts.conf'), '/tmp/fonts/fonts.conf');
    fs.cpSync(path.join(DEST, 'fonts'), '/tmp/fonts/fonts', { recursive: true });
    fs.cpSync(path.join(DEST, 'fonts'), '/tmp/fonts/.fonts', { recursive: true });
  } catch (e) { console.log('[extract] font setup warning:', e.message); }
}

function extract() {
  ensurePersist();
  if (fs.existsSync(path.join(DEST, 'chrome-headless-shell'))) {
    setupFonts();
    return DEST;
  }
  console.log('[extract] extracting chrome...');
  fs.mkdirSync(DEST, { recursive: true });
  fs.writeFileSync(
    path.join(DEST, 'chrome-headless-shell'),
    zlib.brotliDecompressSync(fs.readFileSync(path.join(PERSIST, 'chromium.br')))
  );
  fs.chmodSync(path.join(DEST, 'chrome-headless-shell'), 0o755);
  for (const t of ['fonts.tar', 'swiftshader.tar', 'al2023.tar']) {
    const tarPath = path.join(DEST, t);
    fs.writeFileSync(tarPath, zlib.brotliDecompressSync(fs.readFileSync(path.join(PERSIST, t + '.br'))));
    execSync(`tar -xf ${tarPath} -C ${DEST}`);
    fs.unlinkSync(tarPath);
  }
  setupFonts();
  console.log('[extract] done');
  return DEST;
}

if (require.main === module) console.log(extract());
module.exports = { extract, DEST };
