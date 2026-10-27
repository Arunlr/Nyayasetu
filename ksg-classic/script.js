/* ==========================================================================
   KERALA SRI GURU ASTROLOGER — CLASSIC EDITION · interaction engine
   Loader · marquee · sticky header · reveals · parallax · counters ·
   service / homa / consultation grids · testimonial slider · enquiry form
   ========================================================================== */

(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '919844450099';
  const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;

  /* ── 1 · LOADER ─────────────────────────────────────────────────────── */
  const intro = $('#intro');
  const bar = $('#introBar');
  const pctEl = $('#introPct');
  const ticks = $('#imTicks');

  if (ticks) {
    let out = '';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = 104;
      const r2 = i % 5 === 0 ? 95 : 100;
      out += `<line x1="${(120 + Math.cos(a) * r1).toFixed(1)}" y1="${(120 + Math.sin(a) * r1).toFixed(1)}" x2="${(120 + Math.cos(a) * r2).toFixed(1)}" y2="${(120 + Math.sin(a) * r2).toFixed(1)}" />`;
    }
    ticks.innerHTML = out;
  }

  let done = false;
  function closeIntro() {
    if (done) return;
    done = true;
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-ready');
    intro?.classList.add('is-out');
    window.setTimeout(() => intro?.remove(), 950);
    $$('.hero .mask').forEach((el) => el.classList.add('is-in'));
  }

  if (intro && !reduce) {
    let p = 0;
    const t = window.setInterval(() => {
      p = Math.min(100, p + Math.random() * 14 + 6);
      if (bar) bar.style.width = p + '%';
      if (pctEl) pctEl.textContent = Math.round(p);
      if (p >= 100) {
        window.clearInterval(t);
        window.setTimeout(closeIntro, 320);
      }
    }, 150);
    window.setTimeout(closeIntro, 4000);
  } else if (intro) {
    intro.remove();
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-ready');
    done = true;
    $$('.hero .mask').forEach((el) => el.classList.add('is-in'));
  } else {
    document.body.classList.remove('is-intro');
  }

  /* ── 2 · MARQUEE · YEAR ─────────────────────────────────────────────── */
  const track = $('#topTrack');
  if (track) track.innerHTML += track.innerHTML;
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── 3 · SCROLL: progress · sticky header · parallax · top button ───── */
  const prog = $('#scrollProgress');
  const hdr = $('#hdr');
  const toTop = $('#toTop');
  const heroImg = $('#heroImg');
  const bands = $$('[data-parallax]');
  let ticking = false;

  function frame() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (prog) prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    hdr?.classList.toggle('is-stuck', y > 12);
    toTop?.classList.toggle('is-on', y > 600);

    if (!reduce) {
      if (heroImg && y < window.innerHeight * 1.3) {
        heroImg.style.setProperty('--py', (y * 0.18).toFixed(1) + 'px');
      }
      bands.forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          const rel = (r.top - window.innerHeight / 2) / window.innerHeight;
          b.style.setProperty('--py', (rel * -46).toFixed(1) + 'px');
        }
      });
    }
    sweep();
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', () => requestAnimationFrame(frame));
  window.addEventListener('load', () => requestAnimationFrame(frame));
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ── 4 · REVEALS ────────────────────────────────────────────────────── */
  const targets = new Set($$('.rv, .rv-group, .mask:not(.hero h1), .wipe'));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
  );
  targets.forEach((el) => io.observe(el));

  function sweep() {
    const vh = window.innerHeight;
    targets.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add('is-in');
    });
  }

  /* ── 5 · NAV DROPDOWNS ──────────────────────────────────────────────── */
  $$('.nav__item[data-drop]').forEach((item) => {
    const btn = item.querySelector('.nav__link');
    const open = () => {
      $$('.nav__item[data-drop]').forEach((o) => {
        o.classList.remove('is-open');
        o.querySelector('.nav__link')?.setAttribute('aria-expanded', 'false');
      });
      item.classList.add('is-open');
      btn?.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      item.classList.remove('is-open');
      btn?.setAttribute('aria-expanded', 'false');
    };
    item.addEventListener('pointerenter', () => window.matchMedia('(hover:hover)').matches && open());
    item.addEventListener('pointerleave', () => window.matchMedia('(hover:hover)').matches && close());
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      item.classList.contains('is-open') ? close() : open();
    });
    $$('.nav__drop a', item).forEach((a) => a.addEventListener('click', close));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__item[data-drop]')) {
      $$('.nav__item[data-drop]').forEach((o) => {
        o.classList.remove('is-open');
        o.querySelector('.nav__link')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ── 6 · MOBILE DRAWER ──────────────────────────────────────────────── */
  const burger = $('#burger');
  const mnav = $('#mnav');
  function closeDrawer() {
    mnav?.classList.remove('is-open');
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    mnav?.setAttribute('aria-hidden', 'true');
    burger?.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
  }
  burger?.addEventListener('click', () => {
    const isOpen = mnav?.classList.contains('is-open');
    if (isOpen) return closeDrawer();
    mnav?.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    mnav?.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('is-locked');
  });
  $$('#mnav a').forEach((a) => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());

  /* ── 7 · SERVICES (16 cards) ────────────────────────────────────────── */
  const SERVICES = [
    { t: 'Love Problem Solution', k: 'ಪ್ರೀತಿ ಸಮಸ್ಯೆ', img: 'assets/love-ksg.jpg', d: 'Misunderstanding, distance or a relationship that keeps stalling — read through the chart before anything is decided.' },
    { t: 'Marriage Problem Solution', k: 'ಮದುವೆ ವಿಳಂಬ', img: 'assets/marriage-ksg.jpg', d: 'Delay, broken alliances or family disagreement about the match — including kundali matching and porutham.' },
    { t: 'Family Problem Solution', k: 'ಕೌಟುಂಬಿಕ ಸಮಸ್ಯೆ', img: 'assets/family-ksg.jpg', d: 'Property disputes, division at home or a house that never feels settled, read alongside its vastu.' },
    { t: 'Husband & Wife Dispute', k: 'ದಾಂಪತ್ಯ ಕಲಹ', img: 'assets/couple-ksg.jpg', d: 'Daily friction, suspicion or silence — read for both partners, with remedies that let nobody lose face.' },
    { t: 'Relationship Solution', k: 'ಸಂಬಂಧ ಸಮಸ್ಯೆ', img: 'assets/relationship-ksg.jpg', d: 'In-law, family or friendship bonds soured over years, and the planetary patterns that keep repeating.' },
    { t: 'Get Your Love Back', k: 'ಪ್ರೀತಿ ಮರಳಿ', img: 'assets/loveback-ksg.jpg', d: 'When a separation feels unfinished, the reading looks at timing and both charts — with honest expectations.' },
    { t: 'Business Improvement', k: 'ವ್ಯಾಪಾರ ಅಭಿವೃದ್ಧಿ', img: 'assets/business-ksg.jpg', d: 'Stalled growth, partnership friction or a shop that never fills — chart, timing and the direction of the premises.' },
    { t: 'Career & Job Solution', k: 'ಉದ್ಯೋಗ ಸಮಸ್ಯೆ', img: 'assets/career-ksg.jpg', d: 'Interviews that almost happen, a promotion that keeps slipping, or the wrong field entirely.' },

    { t: 'Money & Debt Relief', k: 'ಧನ ಸಮಸ್ಯೆ', img: 'assets/money-ksg.jpg', d: 'Debt that will not close, income that leaks, savings that vanish — read with the second and eleventh houses.' },
    { t: 'Separation & Divorce Support', k: 'ವಿವಾಹ ಮೋಚನೆ', img: 'assets/divorce-ksg.jpg', d: 'Whether the question is repair or release, the reading maps timing, children and the fairest way through.' },
    { t: 'Santana (Childless) Solution', k: 'ಸಂತಾನ ಭಾಗ್ಯ', img: 'assets/muhurtham-ksg.jpg', d: 'Read for supportive parihara alongside medical care — never in place of it.' },
    { t: 'Drishti & Black Magic Removal', k: 'ಮಾಟ ಮಂತ್ರ', img: 'assets/protection-ksg.jpg', d: 'For families who feel a heaviness they cannot explain — cleansing rituals and protective observances.' },
    { t: 'Health & Wellbeing', k: 'ಆರೋಗ್ಯ', img: 'assets/health-ksg.jpg', d: 'Long-running complaints and recovery periods, read for supportive remedies only.' },
    { t: 'Vastu for Home & Shop', k: 'ವಾಸ್ತು ಪ್ಲಾನಿಂಗ್', img: 'assets/vastu-ksg.jpg', d: 'A floor plan read by direction, element and the rooms where life actually happens.' },
    { t: 'Kundali Analysis', k: 'ಜಾತಕ ವಿಶ್ಲೇಷಣೆ', img: 'assets/kundli-ksg.jpg', d: 'A full janma kundali reading — dashā, transits and the questions you have not found words for yet.' },
    { t: 'Horoscope & Future Reading', k: 'ಭವಿಷ್ಯ ಫಲ', img: 'assets/horoscope-ksg.jpg', d: 'Where the year is likely to press and where it opens, with the timing windows that matter.' },
  ];

  function cardHTML(s) {
    return `<article class="card">
      <div class="card__media">
        <img src="${s.img}" alt="${s.t}" loading="lazy" />
        <span class="card__tag">Parihara</span>
      </div>
      <div class="card__body">
        <h3>${s.t}</h3>
        <span class="card__kan">${s.k}</span>
        <p class="card__p">${s.d}</p>
        <a class="card__call" href="${wa('Namaskara, I would like a consultation about: ' + s.t + '.')}" target="_blank" rel="noopener">
          <svg width="14" height="14"><use href="#i-phone" /></svg> +91 98444 50099
        </a>
      </div>
    </article>`;
  }

  const row1 = $('#servicesRow1');
  const row2 = $('#servicesRow2');
  if (row1) row1.innerHTML = SERVICES.slice(0, 8).map(cardHTML).join('');
  if (row2) row2.innerHTML = SERVICES.slice(8).map(cardHTML).join('');

  /* ── 8 · HOMA CARDS ─────────────────────────────────────────────────── */
  const HOMA = [
    { t: 'Maha Kali Homam', k: 'ಮಹಾ ಕಾಳಿ ಹೋಮ', img: 'assets/homa-ksg.jpg' },
    { t: 'Maha Rudra Homam', k: 'ಮಹಾ ರುದ್ರ ಹೋಮ', img: 'assets/hero-ksg.jpg' },
    { t: 'Pratyangira Homam', k: 'ಪ್ರತ್ಯಂಗಿರಾ ಹೋಮ', img: 'assets/protection-ksg.jpg' },
    { t: 'Navagraha Homam', k: 'ನವಗ್ರಹ ಹೋಮ', img: 'assets/horoscope-ksg.jpg' },
    { t: 'Mrityunjaya Homam', k: 'ಮೃತ್ಯುಂಜಯ ಹೋಮ', img: 'assets/health-ksg.jpg' },
  ];
  const homaGrid = $('#homaGrid');
  if (homaGrid) {
    homaGrid.innerHTML = HOMA.map(
      (h) => `<a class="homa__card" href="${wa('Namaskara, I would like to know about arranging a ' + h.t + '.')}" target="_blank" rel="noopener">
        <img src="${h.img}" alt="${h.t}" loading="lazy" />
        <div class="homa__body">
          <h3>${h.t}</h3>
          <span>${h.k}</span>
          <i>Ask on WhatsApp <svg width="12" height="12"><use href="#i-arrow-ur" /></svg></i>
        </div>
      </a>`
    ).join('');
  }

  /* ── 9 · CONSULTATION CARDS ─────────────────────────────────────────── */
  const CONSULT = [
    { t: 'Horoscope Reading', k: 'ಜಾತಕ ವಿಶ್ಲೇಷಣೆ', ico: '#i-scroll', d: 'Janma kundali, dashā periods and current transits read together.' },
    { t: 'Palm Reading', k: 'ಹಸ್ತ ರೇಖೆ', ico: '#i-palm', d: 'The hand read alongside the chart — never on its own.' },
    { t: 'Prashna & Muhurtham', k: 'ಪ್ರಶ್ನೆ · ಮುಹೂರ್ತ', ico: '#i-compass', d: 'The moment you ask becomes the chart; auspicious dates for ceremonies.' },
    { t: 'Vastu Planning', k: 'ವಾಸ್ತು ಪ್ಲಾನಿಂಗ್', ico: '#i-home', d: 'Homes, shops and small offices, ranked by what is easy to change.' },
    { t: 'Kundali Match Making', k: 'ಜಾತಕ ಹೊಂದಾಣಿಕೆ', ico: '#i-ring', d: 'Porutham between two charts, with the doshas explained honestly.' },
  ];
  const cGrid = $('#consultGrid');
  if (cGrid) {
    cGrid.innerHTML = CONSULT.map(
      (c) => `<article class="icon-card">
        <span class="icon-card__ico"><svg width="34" height="34"><use href="${c.ico}" /></svg></span>
        <h3>${c.t}</h3>
        <span>${c.k}</span>
        <p>${c.d}</p>
        <a href="${wa('Namaskara, I would like a ' + c.t + '.')}" target="_blank" rel="noopener">Ask about this <svg width="12" height="12"><use href="#i-arrow-ur" /></svg></a>
      </article>`
    ).join('');
  }

  /* ── 10 · COUNTERS ──────────────────────────────────────────────────── */
  const counters = $('#counters');
  if (counters) {
    const nums = $$('[data-count]', counters);
    let ran = false;
    const paint = (el, final) => {
      const target = parseFloat(el.dataset.count || '0');
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const sfx = el.dataset.suffix || '';
      if (final) {
        el.textContent = (dec > 0 ? target.toFixed(dec) : target.toLocaleString('en-IN')) + sfx;
        return;
      }
      const t0 = performance.now();
      const dur = 1500;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        const v = target * e;
        el.textContent = (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + (p === 1 ? sfx : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const run = () => {
      if (ran) return;
      ran = true;
      nums.forEach((el) => paint(el, reduce));
    };
    if (reduce) nums.forEach((el) => paint(el, true));
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && run()), { threshold: 0.3 }).observe(counters);
      window.setTimeout(run, 6000);
    } else run();
  }

  /* ── 11 · TESTIMONIAL SLIDER ────────────────────────────────────────── */
  const SLIDES = [
    {
      q: 'Visitors describe long, unhurried conversations — the reading is explained in the language they think in, without jargon.',
      n: 'Recurring theme',
      s: 'Justdial reviews · summarised',
    },
    {
      q: 'Reviews mention coming back years later for a second opinion on a marriage, a property or a business decision.',
      n: 'Recurring theme',
      s: 'Justdial reviews · summarised',
    },
    {
      q: 'The desk is described as private: one visitor at a time, and nothing said in the room repeated outside it.',
      n: 'Recurring theme',
      s: 'Justdial reviews · summarised',
    },
    {
      q: 'Rated 5.0 from 608 ratings on Justdial, and listed under both Astrologers and Vastu Shastra Consultants. Please read the originals rather than this summary.',
      n: 'Listing snapshot',
      s: 'Justdial · as published',
    },
  ];

  const tTrack = $('#testiTrack');
  const tDots = $('#testiDots');
  let ti = 0;
  let timer = null;

  if (tTrack) {
    tTrack.innerHTML = SLIDES.map(
      (s) => `<div class="testi__slide">
        <div class="testi__card">
          <div class="testi__quote" aria-hidden="true"><svg width="34" height="34" style="display:inline-block"><use href="#i-quote" /></svg></div>
          <p class="testi__text">${s.q}</p>
          <div class="testi__stars" aria-label="Five stars">★★★★★</div>
          <div class="testi__who">
            <span class="testi__ava" aria-hidden="true">✶</span>
            <span class="testi__name"><b>${s.n}</b><small>${s.s}</small></span>
          </div>
        </div>
      </div>`
    ).join('');

    if (tDots) {
      tDots.innerHTML = SLIDES.map((_, i) => `<button class="testi__dot${i === 0 ? ' is-active' : ''}" type="button" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
    }
  }

  function goSlide(i) {
    if (!tTrack) return;
    ti = (i + SLIDES.length) % SLIDES.length;
    tTrack.style.transform = `translate3d(${-ti * 100}%,0,0)`;
    $$('.testi__dot').forEach((d, idx) => d.classList.toggle('is-active', idx === ti));
  }

  function startAuto() {
    if (reduce) return;
    stopAuto();
    timer = window.setInterval(() => goSlide(ti + 1), 6200);
  }
  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  $('#testiNext')?.addEventListener('click', () => { goSlide(ti + 1); startAuto(); });
  $('#testiPrev')?.addEventListener('click', () => { goSlide(ti - 1); startAuto(); });
  tDots?.addEventListener('click', (e) => {
    const b = e.target.closest('.testi__dot');
    if (b) { goSlide(+b.dataset.i); startAuto(); }
  });
  const vp = $('#testiViewport');
  vp?.addEventListener('pointerenter', stopAuto);
  vp?.addEventListener('pointerleave', startAuto);

  if (vp) {
    let sx = 0;
    let dx = 0;
    let down = false;
    vp.addEventListener('pointerdown', (e) => { down = true; sx = e.clientX; dx = 0; stopAuto(); });
    vp.addEventListener('pointermove', (e) => { if (down) dx = e.clientX - sx; });
    vp.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (Math.abs(dx) > 42) goSlide(ti + (dx < 0 ? 1 : -1));
      startAuto();
    });
    vp.addEventListener('pointercancel', () => { down = false; startAuto(); });
    startAuto();
  }

  /* ── 12 · ENQUIRY FORM → WHATSAPP ───────────────────────────────────── */
  const form = $('#enquiryForm');
  const ok = $('#formOk');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fName');
    const phone = $('#fPhone');
    let bad = false;
    const flag = (el, isBad) => {
      el.closest('.field')?.classList.toggle('is-error', isBad);
      if (isBad) bad = true;
    };
    flag(name, !name.value.trim());
    flag(phone, phone.value.replace(/\D/g, '').length < 10);
    if (bad) {
      (name.closest('.field')?.classList.contains('is-error') ? name : phone).focus();
      return;
    }
    const lines = [
      'Namaskara Panditji,',
      'I would like to ask a question.',
      '',
      `Name: ${name.value.trim()}`,
      `Mobile: ${phone.value.trim()}`,
      `Topic: ${$('#fTopic').value}`,
    ];
    const email = $('#fEmail').value.trim();
    if (email) lines.push(`Email: ${email}`);
    if ($('#fDob').value) lines.push(`Date of birth: ${$('#fDob').value}`);
    if ($('#fTob').value) lines.push(`Time of birth: ${$('#fTob').value}`);
    if ($('#fPob').value.trim()) lines.push(`Place of birth: ${$('#fPob').value.trim()}`);
    if ($('#fMsg').value.trim()) lines.push('', `Question: ${$('#fMsg').value.trim()}`);

    window.open(wa(lines.join('\n')), '_blank', 'noopener');
    ok?.classList.add('is-on');
  });
  $$('#enquiryForm input, #enquiryForm select, #enquiryForm textarea').forEach((el) =>
    el.addEventListener('input', () => el.closest('.field')?.classList.remove('is-error'))
  );

  /* ── 13 · HERO SPARKS + CARD TILT ───────────────────────────────────── */
  const hero = $('.hero');
  if (hero && !reduce) {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.left = 8 + Math.random() * 84 + '%';
      s.style.top = 48 + Math.random() * 42 + '%';
      s.style.animationDelay = (Math.random() * 9).toFixed(1) + 's';
      s.style.animationDuration = (7 + Math.random() * 5).toFixed(1) + 's';
      hero.appendChild(s);
    }
  }

  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1000px) rotateY(${(px * 4).toFixed(2)}deg) rotateX(${(-py * 4).toFixed(2)}deg)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ── 14 · SMOOTH ANCHORS ────────────────────────────────────────────── */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const offset = (hdr?.offsetHeight || 70) + 10;
      const top = t.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ── 15 · FIRST PAINT ───────────────────────────────────────────────── */
  requestAnimationFrame(() => {
    sweep();
    frame();
  });
})();
