// Stateless chrome provisioner: fetches chrome-headless-shell v149 from npm on demand,
// extracts to /tmp. Nothing persists in the workspace — npm is always reachable here.
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const os = require('node:os');

const DEST = '/tmp/chrome149';
const FILES = ['chromium.br', 'fonts.tar.br', 'swiftshader.tar.br', 'al2023.tar.br'];

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
  if (fs.existsSync(path.join(DEST, 'chrome-headless-shell'))) {
    setupFonts();
    return DEST;
  }
  console.log('[extract] fetching chrome from npm...');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chromedl-'));
  execSync('npm pack @sparticuz/chromium@149.0.0 --silent', { cwd: tmp });
  execSync('tar -xzf sparticuz-chromium-149.0.0.tgz', { cwd: tmp });
  const bin = path.join(tmp, 'package', 'bin');
  fs.mkdirSync(DEST, { recursive: true });
  fs.writeFileSync(path.join(DEST, 'chrome-headless-shell'), zlib.brotliDecompressSync(fs.readFileSync(path.join(bin, 'chromium.br'))));
  fs.chmodSync(path.join(DEST, 'chrome-headless-shell'), 0o755);
  for (const t of ['fonts.tar', 'swiftshader.tar', 'al2023.tar']) {
    const tarPath = path.join(DEST, t);
    fs.writeFileSync(tarPath, zlib.brotliDecompressSync(fs.readFileSync(path.join(bin, t + '.br'))));
    execSync(`tar -xf ${tarPath} -C ${DEST}`);
    fs.unlinkSync(tarPath);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  setupFonts();
  console.log('[extract] done');
  return DEST;
}

if (require.main === module) console.log(extract());
module.exports = { extract, DEST };
