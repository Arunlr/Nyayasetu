/* ==========================================================================
   KERALA SRI GURU ASTROLOGER — Animation & interaction engine
   Client #6 · Jayanagar 4th Block, Bengaluru
   Sections: intro loader · reveal system · ticker · services rail ·
             gallery strip · prashna path · vastu compass · form · menu
   ========================================================================== */

(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const WA_NUMBER = '919844450099';
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ────────────────────────────────────────────────────────────────────────
     1 · OPENING LOADER — mandala + progress + curtain reveal
     ──────────────────────────────────────────────────────────────────────── */
  const intro = $('#intro');
  const introBar = $('#introBar');
  const introPct = $('#introPct');
  const imTicks = $('#imTicks');

  if (imTicks) {
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = 104;
      const r2 = i % 5 === 0 ? 96 : 100;
      const x1 = 120 + Math.cos(a) * r1;
      const y1 = 120 + Math.sin(a) * r1;
      const x2 = 120 + Math.cos(a) * r2;
      const y2 = 120 + Math.sin(a) * r2;
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
    }
    imTicks.innerHTML = ticks;
  }

  let introDone = false;
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-loaded');
    intro?.classList.add('is-out');
    window.setTimeout(() => intro?.remove(), 1000);
    $$('.hero .mask-lines').forEach((el) => el.classList.add('is-in'));
  }

  if (intro && !reduceMotion) {
    document.body.classList.add('is-intro');
    let pct = 0;
    const tick = window.setInterval(() => {
      pct = Math.min(100, pct + Math.random() * 13 + 5);
      if (introBar) introBar.style.width = pct + '%';
      if (introPct) introPct.textContent = Math.round(pct);
      if (pct >= 100) {
        window.clearInterval(tick);
        window.setTimeout(finishIntro, 380);
      }
    }, 170);
    window.setTimeout(finishIntro, 4200); // hard safety net
  } else if (intro) {
    intro.remove();
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-loaded');
    introDone = true;
    $$('.hero .mask-lines').forEach((el) => el.classList.add('is-in'));
  } else {
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-loaded');
  }

  /* ────────────────────────────────────────────────────────────────────────
     2 · LIVE IST CLOCK + YEAR
     ──────────────────────────────────────────────────────────────────────── */
  const istClock = $('#istClock');
  const deskStatus = $('#deskStatus');

  function istParts() {
    const now = new Date();
    const s = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return s.replace(/\s?am/i, ' AM').replace(/\s?pm/i, ' PM');
  }

  function paintClock() {
    const t = istParts();
    if (istClock) istClock.textContent = `IST ${t}`;
    if (deskStatus) deskStatus.textContent = `IST ${t}`;
  }
  paintClock();
  window.setInterval(paintClock, 30000);

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ────────────────────────────────────────────────────────────────────────
     3 · SCROLL PROGRESS · STICKY HEADER · BACK TO TOP · HERO PARALLAX
     ──────────────────────────────────────────────────────────────────────── */
  const progress = $('#scrollProgress');
  const header = $('#siteHeader');
  const toTop = $('#toTop');
  const heroImg = $('#heroImg');
  let scrollQueued = false;

  function onScrollFrame() {
    const y = window.scrollY || window.pageYOffset;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    header?.classList.toggle('is-stuck', y > 20);
    toTop?.classList.toggle('is-on', y > 620);
    if (heroImg && !reduceMotion && y < window.innerHeight * 1.2) {
      heroImg.style.setProperty('--heroY', (y * 0.16).toFixed(1) + 'px');
    }
    sweepVisible();
    scrollQueued = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!scrollQueued) {
        scrollQueued = true;
        window.requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', () => window.requestAnimationFrame(onScrollFrame));
  window.addEventListener('load', () => window.requestAnimationFrame(onScrollFrame));

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ────────────────────────────────────────────────────────────────────────
     4 · REVEAL SYSTEM — IntersectionObserver + sweep fallback
     ──────────────────────────────────────────────────────────────────────── */
  const revealTargets = new Set($$('.reveal, .reveal-group, .mask-lines:not(.hero h1), .img-wipe'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );

  revealTargets.forEach((el) => io.observe(el));

  function sweepVisible() {
    const vh = window.innerHeight;
    revealTargets.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('is-in');
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
     5 · HERO TICKER — seamless duplication
     ──────────────────────────────────────────────────────────────────────── */
  const tickerTrack = $('#tickerTrack');
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

  /* ────────────────────────────────────────────────────────────────────────
     6 · SERVICE DATA + INFINITE RAIL
     ──────────────────────────────────────────────────────────────────────── */
  const SERVICES = [
    {
      id: 'love',
      title: 'Love Problem Solution',
      mal: 'പ്രണയ പ്രശ്ന പരിഹാരം',
      cat: 'love',
      tag: 'Relationships',
      desc: 'Misunderstanding, distance or a relationship that keeps stalling — read through the chart before anything is decided.',
      img: 'assets/love-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a love / relationship problem.',
    },
    {
      id: 'marriage',
      title: 'Marriage Solution',
      mal: 'വിവാഹ പ്രശ്നം',
      cat: 'love',
      tag: 'Vivaha',
      desc: 'Delay, repeated broken alliances or disagreement at home about the match — including kundali matching (porutham).',
      img: 'assets/marriage-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about marriage / kundali matching.',
    },
    {
      id: 'loveback',
      title: 'Get Your Love Back',
      mal: 'പ്രണയം തിരികെ',
      cat: 'love',
      tag: 'Reunion',
      desc: 'When a separation feels unfinished, the reading looks at timing and both charts — with honest expectations.',
      img: 'assets/loveback-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about getting my relationship back.',
    },
    {
      id: 'couple',
      title: 'Husband & Wife Solution',
      mal: 'ദാമ്പത്യ ഐക്യം',
      cat: 'family',
      tag: 'Dampatya',
      desc: 'Daily friction, jealousy or silence at home — read for both partners, with remedies that do not need anyone to lose face.',
      img: 'assets/couple-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a husband-wife problem.',
    },
    {
      id: 'relationship',
      title: 'Relationship Solution',
      mal: 'ബന്ധ പരിഹാരം',
      cat: 'love',
      tag: 'Bonds',
      desc: 'Family, in-law or friendship bonds that have soured over years, and the planetary patterns that keep repeating.',
      img: 'assets/relationship-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a relationship problem.',
    },
    {
      id: 'family',
      title: 'Family Solution',
      mal: 'കുടുംബ ശാന്തി',
      cat: 'family',
      tag: 'Kutumba',
      desc: 'Property disputes, division in the family or a house that never feels settled — read alongside the vastu of the home.',
      img: 'assets/family-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a family problem.',
    },
    {
      id: 'divorce',
      title: 'Divorce Solution',
      mal: 'വിവാഹ മോചനം',
      cat: 'family',
      tag: 'Separation',
      desc: 'Whether the question is repair or release, the reading maps timing, children and the fairest way through.',
      img: 'assets/divorce-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a divorce / separation matter.',
    },
    {
      id: 'business',
      title: 'Business Solution',
      mal: 'വ്യാപാര പ്രശ്നം',
      cat: 'wealth',
      tag: 'Vyapara',
      desc: 'Stalled growth, partnership friction or a shop that never fills — chart, timing and the direction of the premises.',
      img: 'assets/business-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a business problem.',
    },
    {
      id: 'career',
      title: 'Career Solution',
      mal: 'ജോലി പ്രശ്നം',
      cat: 'wealth',
      tag: 'Vritti',
      desc: 'Interviews that almost happen, a promotion that keeps slipping, or the wrong field entirely.',
      img: 'assets/career-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a career problem.',
    },
    {
      id: 'money',
      title: 'Money Solution',
      mal: 'ധന പ്രശ്നം',
      cat: 'wealth',
      tag: 'Dhana',
      desc: 'Debt that will not close, income that leaks, or savings that vanish — read with the second and eleventh houses.',
      img: 'assets/money-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about a money / debt problem.',
    },
    {
      id: 'health',
      title: 'Health & Wellbeing',
      mal: 'ആരോഗ്യ പരിഹാരം',
      cat: 'health',
      tag: 'Arogya',
      desc: 'Long-running complaints and recovery periods are read for supportive remedies only — never in place of medical care.',
      img: 'assets/health-ksg.jpg',
      msg: 'Namaskara, I would like a consultation about health and wellbeing.',
    },
    {
      id: 'kundali',
      title: 'Kundali & Future Reading',
      mal: 'ജാതക വിശകലനം',
      cat: 'health',
      tag: 'Jyotisha',
      desc: 'A full janma kundali reading — dashā, transits and the questions you have not found words for yet.',
      img: 'assets/horoscope-ksg.jpg',
      msg: 'Namaskara, I would like a full kundali / horoscope reading.',
    },
  ];

  const railTrack = $('#railTrack');
  const rail = $('#rail');
  const railPrev = $('#railPrev');
  const railNext = $('#railNext');
  const filterBar = $('#serviceFilters');

  let railItems = SERVICES.slice();
  let railOffset = 0;
  let railHover = false;
  let railDragging = false;
  let railInView = true;
  let railHalf = 0;

  function cardMarkup(s) {
    return `
      <article class="srv" data-id="${s.id}">
        <div class="srv__media">
          <img src="${s.img}" alt="${s.title}" loading="lazy" draggable="false" />
          <span class="srv__tag">${s.tag}</span>
        </div>
        <div class="srv__body">
          <p class="srv__mal">${s.mal}</p>
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
          <a class="srv__link" href="${waLink(s.msg)}" target="_blank" rel="noopener">
            Ask about this <svg width="14" height="14" aria-hidden="true"><use href="#i-arrow-ur" /></svg>
          </a>
        </div>
      </article>`;
  }

  function buildRail() {
    if (!railTrack) return;
    let base = railItems.slice();
    if (!base.length) base = SERVICES.slice(0, 3);
    while (base.length < 6) base = base.concat(railItems.slice() || []);
    if (base.length < 6) base = SERVICES.slice(0, 6);
    const doubled = base.concat(base);
    railTrack.innerHTML = doubled.map(cardMarkup).join('');
    railOffset = 0;
    railTrack.style.transform = 'translate3d(0,0,0)';
    measureRail();
  }

  function measureRail() {
    if (!railTrack) return;
    const total = railTrack.scrollWidth;
    railHalf = total / 2 || 1;
    if (railOffset <= -railHalf) railOffset += railHalf;
  }

  function railFrame(last) {
    const now = performance.now();
    const dt = Math.min(48, now - last) / 16.667;
    if (!railDragging && railInView && railHalf > 0) {
      const speed = railHover ? 0.16 : 0.55;
      railOffset -= speed * dt;
      if (railOffset <= -railHalf) railOffset += railHalf;
      railTrack.style.transform = `translate3d(${railOffset.toFixed(2)}px,0,0)`;
    }
    requestAnimationFrame(railFrame);
  }

  if (railTrack) {
    buildRail();
    window.addEventListener('load', measureRail);
    window.addEventListener('resize', measureRail);
    if (!reduceMotion) requestAnimationFrame(railFrame);

    rail?.addEventListener('pointerenter', () => (railHover = true));
    rail?.addEventListener('pointerleave', () => (railHover = false));

    const step = (dir) => {
      const card = railTrack.querySelector('.srv');
      const w = card ? card.getBoundingClientRect().width + 18 : 300;
      railOffset -= dir * w;
      if (railHalf > 0 && railOffset <= -railHalf) railOffset += railHalf;
      if (railHalf > 0 && railOffset > 0) railOffset -= railHalf;
      railTrack.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
      railTrack.style.transform = `translate3d(${railOffset.toFixed(2)}px,0,0)`;
      window.setTimeout(() => (railTrack.style.transition = ''), 620);
    };

    railPrev?.addEventListener('click', () => step(-1));
    railNext?.addEventListener('click', () => step(1));

    // Drag / swipe
    let startX = 0;
    let startOffset = 0;
    let moved = 0;
    railTrack.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      railDragging = true;
      moved = 0;
      startX = e.clientX;
      startOffset = railOffset;
      railTrack.classList.add('is-dragging');
      railTrack.style.transition = '';
      try {
        railTrack.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    railTrack.addEventListener('pointermove', (e) => {
      if (!railDragging) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      railOffset = startOffset + dx;
      if (railHalf > 0) {
        if (railOffset <= -railHalf) railOffset += railHalf;
        if (railOffset > 0) railOffset -= railHalf;
      }
      railTrack.style.transform = `translate3d(${railOffset.toFixed(2)}px,0,0)`;
    });
    const endDrag = (e) => {
      if (!railDragging) return;
      railDragging = false;
      railTrack.classList.remove('is-dragging');
      if (moved > 8) {
        const block = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        railTrack.addEventListener('click', block, { capture: true, once: true });
        window.setTimeout(() => railTrack.removeEventListener('click', block, { capture: true }), 60);
      }
      if (e && e.pointerId != null) {
        try {
          railTrack.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    };
    railTrack.addEventListener('pointerup', endDrag);
    railTrack.addEventListener('pointercancel', endDrag);
    railTrack.addEventListener('pointerleave', (e) => railDragging && endDrag(e));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => entries.forEach((en) => (railInView = en.isIntersecting)),
        { threshold: 0.05 }
      ).observe(rail);
    }
  }

  function applyFilter(filter) {
    railItems = filter === 'all' ? SERVICES.slice() : SERVICES.filter((s) => s.cat === filter);
    buildRail();
    $$('#serviceFilters .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === filter));
  }

  filterBar?.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    applyFilter(btn.dataset.filter || 'all');
  });

  /* ────────────────────────────────────────────────────────────────────────
     7 · CONCERN FINDER
     ──────────────────────────────────────────────────────────────────────── */
  const concernChips = $('#concernChips');
  const concernPick = $('#concernPick');
  const concernCta = $('#concernCta');

  const CONCERN_COPY = {
    love: { label: 'Love &amp; marriage', filter: 'love', msg: 'Namaskara, I would like a consultation about love and marriage.' },
    family: { label: 'Family &amp; home', filter: 'family', msg: 'Namaskara, I would like a consultation about a family matter.' },
    wealth: { label: 'Career, business &amp; money', filter: 'wealth', msg: 'Namaskara, I would like a consultation about career, business or money.' },
    health: { label: 'Health &amp; wellbeing', filter: 'health', msg: 'Namaskara, I would like a consultation about health and wellbeing.' },
    guidance: { label: 'Kundali &amp; future reading', filter: 'health', msg: 'Namaskara, I would like a full kundali and future reading.' },
    vastu: { label: 'Home or office vastu', filter: null, msg: 'Namaskara, I would like a vastu consultation.' },
  };

  concernChips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip', concernChips).forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const key = chip.dataset.concern;
    const info = CONCERN_COPY[key];
    if (!info) return;

    if (concernPick) concernPick.innerHTML = `Most often read through <b>${info.label}</b> guidance.`;

    if (concernCta) {
      if (key === 'vastu') {
        concernCta.href = '#vastu';
        concernCta.querySelector('span').textContent = 'Open the vastu compass';
      } else {
        concernCta.href = '#services';
        concernCta.querySelector('span').textContent = `See ${info.label.split(' ')[0]} readings`;
        if (info.filter) applyFilter(info.filter);
      }
    }
  });

  /* ────────────────────────────────────────────────────────────────────────
     8 · SERVICE FOOT CHIPS (deep links)
     ──────────────────────────────────────────────────────────────────────── */
  $$('[data-jump]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.jump;
      const target = { vastu: '#vastu', health: '#services', booking: '#booking' }[key];
      if (key === 'health') applyFilter('health');
      if (key === 'booking') {
        $('#booking')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        window.setTimeout(() => $('#fMsg')?.focus({ preventScroll: true }), 700);
        return;
      }
      if (key === 'vastu') {
        $('#vastu')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      const shot = document.querySelector(`.polaroid[data-full="assets/${key}-ksg.jpg"]`);
      if (shot) openLightbox(shot);
      else if (target) $(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ────────────────────────────────────────────────────────────────────────
     9 · GALLERY STRIP — drift + drag + arrows + lightbox
     ──────────────────────────────────────────────────────────────────────── */
  const strip = $('#strip');
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCap = $('#lightboxCap');
  const lightboxClose = $('#lightboxClose');

  function openLightbox(fig) {
    if (!lightbox || !lightboxImg) return;
    const full = fig.dataset.full || fig.querySelector('img')?.src;
    const cap = fig.dataset.cap || fig.querySelector('figcaption')?.textContent || '';
    lightboxImg.src = full;
    lightboxImg.alt = cap;
    if (lightboxCap) lightboxCap.textContent = cap;
    lightbox.classList.add('is-open');
    document.body.classList.add('is-locked');
    lightboxClose?.focus();
  }

  function closeLightbox() {
    lightbox?.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  $$('.polaroid').forEach((fig) => {
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.addEventListener('click', () => openLightbox(fig));
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(fig);
      }
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeMenu();
    }
  });

  let stripOffset = 0;
  let stripHalf = 0;
  let stripHover = false;
  let stripDragging = false;

  function measureStrip() {
    if (!strip) return;
    stripHalf = strip.scrollWidth / 2 || 1;
  }

  function stripFrame(last) {
    const now = performance.now();
    const dt = Math.min(48, now - last) / 16.667;
    if (!stripDragging && stripHalf > 0) {
      stripOffset -= (stripHover ? 0.08 : 0.22) * dt;
      if (stripOffset <= -stripHalf) stripOffset += stripHalf;
      strip.style.transform = `translate3d(${stripOffset.toFixed(2)}px,0,0)`;
    }
    requestAnimationFrame(stripFrame);
  }

  if (strip) {
    window.addEventListener('load', measureStrip);
    window.addEventListener('resize', measureStrip);
    if (!reduceMotion) requestAnimationFrame(stripFrame);

    strip.addEventListener('pointerenter', () => (stripHover = true));
    strip.addEventListener('pointerleave', () => (stripHover = false));

    let sx = 0;
    let so = 0;
    let moved = 0;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stripDragging = true;
      moved = 0;
      sx = e.clientX;
      so = stripOffset;
      strip.classList.add('is-dragging');
      try {
        strip.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    strip.addEventListener('pointermove', (e) => {
      if (!stripDragging) return;
      const dx = e.clientX - sx;
      moved = Math.abs(dx);
      stripOffset = so + dx;
      if (stripHalf > 0) {
        if (stripOffset <= -stripHalf) stripOffset += stripHalf;
        if (stripOffset > 0) stripOffset -= stripHalf;
      }
      strip.style.transform = `translate3d(${stripOffset.toFixed(2)}px,0,0)`;
    });
    const stripEnd = () => {
      if (!stripDragging) return;
      stripDragging = false;
      strip.classList.remove('is-dragging');
      if (moved > 8) {
        const block = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        strip.addEventListener('click', block, { capture: true, once: true });
        window.setTimeout(() => strip.removeEventListener('click', block, { capture: true }), 60);
      }
    };
    strip.addEventListener('pointerup', stripEnd);
    strip.addEventListener('pointercancel', stripEnd);

    const stripStep = (dir) => {
      const w = (strip.querySelector('.polaroid')?.getBoundingClientRect().width || 220) + 16;
      stripOffset -= dir * w * 1.5;
      if (stripHalf > 0 && stripOffset <= -stripHalf) stripOffset += stripHalf;
      if (stripHalf > 0 && stripOffset > 0) stripOffset -= stripHalf;
      strip.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
      strip.style.transform = `translate3d(${stripOffset.toFixed(2)}px,0,0)`;
      window.setTimeout(() => (strip.style.transition = ''), 620);
    };
    $('#stripPrev')?.addEventListener('click', () => stripStep(-1));
    $('#stripNext')?.addEventListener('click', () => stripStep(1));
  }

  /* ────────────────────────────────────────────────────────────────────────
     10 · PRASHNA PATH — sticky step tracking
     ──────────────────────────────────────────────────────────────────────── */
  const steps = $$('#pathSteps .step');
  const frames = $$('#pathFrames .path__frame');
  const pathBar = $('#pathBar');
  const pathCapKicker = $('#pathCapKicker');
  const pathCapTitle = $('#pathCapTitle');

  const STEP_META = {
    0: { kicker: 'Step 01 · Listening', title: 'The question, in your own words' },
    1: { kicker: 'Step 02 · The chart', title: 'Janma kundali & prashna lagna' },
    2: { kicker: 'Step 03 · The reading', title: 'What is actually being asked of you' },
    3: { kicker: 'Step 04 · The remedy', title: 'A parihara you can actually keep' },
  };

  function setStep(i) {
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    frames.forEach((f, idx) => f.classList.toggle('is-active', idx === i));
    if (pathBar) pathBar.style.width = ((i + 1) / Math.max(1, steps.length)) * 100 + '%';
    if (pathCapKicker && STEP_META[i]) pathCapKicker.textContent = STEP_META[i].kicker;
    if (pathCapTitle && STEP_META[i]) pathCapTitle.textContent = STEP_META[i].title;
  }

  if (steps.length) {
    const onStepScroll = () => {
      const mid = window.innerHeight * 0.45;
      let best = 0;
      steps.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        if (r.top < mid) best = i;
      });
      setStep(best);
    };
    window.addEventListener('scroll', onStepScroll, { passive: true });
    onStepScroll();
  }

  /* ────────────────────────────────────────────────────────────────────────
     11 · VASTU COMPASS
     ──────────────────────────────────────────────────────────────────────── */
  const VASTU = {
    N: {
      angle: 0,
      name: 'North',
      title: 'Kubera · water · career',
      desc: 'Traditionally associated with Kubera and the water element. The north is read for income, opportunity and the flow of money through the household — entrances, water sources and mirrors in this quarter get a careful look.',
      meta: ['Element · Water', 'Ruling · Kubera', 'Read for · Career & income'],
    },
    NE: {
      angle: 45,
      name: 'North-East',
      title: 'Ishanya · clarity & prayer',
      desc: 'The north-east is the quarter of prayer and clear thinking. Traditionally kept light and uncluttered, it is where a household altar is placed and where morning light is allowed to enter.',
      meta: ['Element · Water', 'Ruling · Ishana', 'Read for · Clarity & devotion'],
    },
    E: {
      angle: 90,
      name: 'East',
      title: 'Indra · health & beginnings',
      desc: 'Associated with Indra and the rising sun, the east is read for health, vitality and fresh starts. Doors and windows here are valued for morning light and open air.',
      meta: ['Element · Air', 'Ruling · Indra', 'Read for · Health & growth'],
    },
    SE: {
      angle: 135,
      name: 'South-East',
      title: 'Agni · fire & the kitchen',
      desc: 'The south-east carries Agni. It is the customary quarter for the kitchen and for anything to do with fire — cooking, heating and the household’s daily nourishment.',
      meta: ['Element · Fire', 'Ruling · Agni', 'Read for · Kitchen & energy'],
    },
    S: {
      angle: 180,
      name: 'South',
      title: 'Yama · rest & reputation',
      desc: 'The south is read for rest, endurance and standing in the world. Heavy storage is traditionally kept here rather than in the north-east, so that the lighter quarters stay light.',
      meta: ['Element · Earth', 'Ruling · Yama', 'Read for · Rest & reputation'],
    },
    SW: {
      angle: 225,
      name: 'South-West',
      title: 'Nairutya · stability & the head of the house',
      desc: 'The south-west is the quarter of stability and is traditionally the heaviest part of a plot. The main bedroom and the head of the household’s room are often placed here.',
      meta: ['Element · Earth', 'Ruling · Nairutya', 'Read for · Stability & family'],
    },
    W: {
      angle: 270,
      name: 'West',
      title: 'Varuna · gains & completion',
      desc: 'Varuna governs the west, read for gains, savings and the completion of long efforts. Dining and children’s study areas are commonly kept in this direction.',
      meta: ['Element · Water', 'Ruling · Varuna', 'Read for · Gains & completion'],
    },
    NW: {
      angle: 315,
      name: 'North-West',
      title: 'Vayu · movement & support',
      desc: 'The north-west carries Vayu, the wind — read for movement, guests and support from outside the family. Store rooms and guest rooms sit comfortably here.',
      meta: ['Element · Air', 'Ruling · Vayu', 'Read for · Movement & support'],
    },
  };

  const compass = $('#compass');
  const needle = $('#compassNeedle');
  const compassCenter = $('#compassCenter');
  const vKicker = $('#vastuKicker');
  const vTitle = $('#vastuTitleOut');
  const vDesc = $('#vastuDesc');
  const vMeta = $('#vastuMeta');
  const vReadout = $('#vastuReadout');

  function buildCompass() {
    if (!compass) return;
    Object.entries(VASTU).forEach(([key, d]) => {
      const rad = (d.angle * Math.PI) / 180;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dir';
      btn.dataset.dir = key;
      btn.textContent = key;
      btn.setAttribute('aria-label', `${d.name} — ${d.title}`);
      btn.style.left = 50 + Math.sin(rad) * 37 + '%';
      btn.style.top = 50 - Math.cos(rad) * 37 + '%';
      compass.appendChild(btn);
    });
    compass.addEventListener('click', (e) => {
      const btn = e.target.closest('.dir');
      if (btn) selectDir(btn.dataset.dir);
    });
    selectDir('N', true);
  }

  function selectDir(key, silent) {
    const d = VASTU[key];
    if (!d) return;
    $$('.dir', compass).forEach((b) => b.classList.toggle('is-active', b.dataset.dir === key));
    if (needle) needle.style.setProperty('--needle', d.angle + 'deg');
    if (compassCenter) compassCenter.textContent = d.name;
    if (vKicker) vKicker.textContent = `Direction · ${d.name}`;
    if (vMeta) vMeta.innerHTML = d.meta.map((m) => `<span>${m}</span>`).join('');

    if (silent) {
      if (vTitle) vTitle.textContent = d.title;
      if (vDesc) vDesc.textContent = d.desc;
      return;
    }
    vReadout?.classList.add('is-swap');
    window.setTimeout(() => {
      if (vTitle) vTitle.textContent = d.title;
      if (vDesc) vDesc.textContent = d.desc;
      vReadout?.classList.remove('is-swap');
    }, 220);
  }

  buildCompass();

  /* ────────────────────────────────────────────────────────────────────────
     12 · FAQ ACCORDION
     ──────────────────────────────────────────────────────────────────────── */
  $$('#faqList .acc').forEach((acc) => {
    const btn = acc.querySelector('.acc__btn');
    btn?.addEventListener('click', () => {
      const isOpen = acc.classList.contains('is-open');
      $$('#faqList .acc').forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.acc__btn')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        acc.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ────────────────────────────────────────────────────────────────────────
     13 · BOOKING FORM → WhatsApp
     ──────────────────────────────────────────────────────────────────────── */
  const form = $('#bookingForm');
  const formOk = $('#formOk');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fName');
    const phone = $('#fPhone');
    let valid = true;

    const setErr = (input, bad) => {
      input.closest('.field')?.classList.toggle('is-error', bad);
      if (bad) valid = false;
    };

    setErr(name, !name.value.trim());
    const digits = phone.value.replace(/\D/g, '');
    setErr(phone, digits.length < 10);

    if (!valid) {
      (name.closest('.field')?.classList.contains('is-error') ? name : phone).focus();
      return;
    }

    const mode = form.querySelector('input[name="mode"]:checked')?.value || 'WhatsApp';
    const lines = [
      'Namaskara Panditji,',
      'I would like to request a consultation.',
      '',
      `Name: ${name.value.trim()}`,
      `Phone: ${phone.value.trim()}`,
      `Concern: ${$('#fConcern').value}`,
      `Preferred mode: ${mode}`,
    ];
    if ($('#fDob').value) lines.push(`Date of birth: ${$('#fDob').value}`);
    if ($('#fTob').value) lines.push(`Time of birth: ${$('#fTob').value}`);
    if ($('#fPob').value.trim()) lines.push(`Place of birth: ${$('#fPob').value.trim()}`);
    if ($('#fMsg').value.trim()) lines.push('', `Question: ${$('#fMsg').value.trim()}`);

    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    formOk?.classList.add('is-on');
  });

  $$('#bookingForm input, #bookingForm select, #bookingForm textarea').forEach((el) => {
    el.addEventListener('input', () => el.closest('.field')?.classList.remove('is-error'));
  });

  /* ────────────────────────────────────────────────────────────────────────
     14 · MOBILE MENU
     ──────────────────────────────────────────────────────────────────────── */
  const burger = $('#burger');
  const menu = $('#menu');

  function openMenu() {
    menu?.classList.add('is-open');
    burger?.classList.add('is-open');
    burger?.setAttribute('aria-expanded', 'true');
    menu?.setAttribute('aria-hidden', 'false');
    burger?.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('is-locked');
    $$('.menu__link', menu).forEach((l, i) => (l.style.transitionDelay = 0.12 + i * 0.06 + 's'));
  }

  function closeMenu() {
    menu?.classList.remove('is-open');
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-hidden', 'true');
    burger?.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
  }

  burger?.addEventListener('click', () => {
    if (menu?.classList.contains('is-open')) closeMenu();
    else openMenu();
  });
  $$('.menu__link').forEach((l) => l.addEventListener('click', closeMenu));

  /* ────────────────────────────────────────────────────────────────────────
     15 · CURSOR AURA + HERO CARD TILT (pointer-fine only)
     ──────────────────────────────────────────────────────────────────────── */
  const aura = $('#cursorAura');
  if (aura && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    window.addEventListener(
      'pointermove',
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        aura.classList.add('is-on');
      },
      { passive: true }
    );
    (function auraLoop() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      aura.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      requestAnimationFrame(auraLoop);
    })();

    const card = $('.hero__card');
    if (card && !reduceMotion) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${(px * 5).toFixed(2)}deg) rotateX(${(-py * 5).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => (card.style.transform = ''));
    }
  }


  /* ────────────────────────────────────────────────────────────────────────
     15b · LEDGER COUNTERS
     ──────────────────────────────────────────────────────────────────────── */
  const ledger = $('#ledgerGrid');
  if (ledger) {
    const nums = $$('[data-count]', ledger);
    let counted = false;

    const runCounters = () => {
      if (counted) return;
      counted = true;
      nums.forEach((el, i) => {
        const target = parseFloat(el.dataset.count || '0');
        const dec = parseInt(el.dataset.decimals || '0', 10);
        const suffix = el.dataset.suffix || '';
        const dur = 1500 + i * 120;
        const show = (v, done) =>
          (el.textContent =
            (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + (done ? suffix : ''));
        let t0 = null;
        let raf = 0;
        let fin = false;
        const finish = () => {
          if (fin) return;
          fin = true;
          if (raf) cancelAnimationFrame(raf);
          show(target, true);
        };
        const tick = () => {
          if (fin) return;
          t0 = t0 === null ? performance.now() : t0;
          const p = Math.max(0, Math.min(1, (performance.now() - t0) / dur));
          if (p >= 1) return finish();
          show(target * (1 - Math.pow(1 - p, 3)), false);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        // safety net: rAF stalls in background tabs and static renderers
        window.setTimeout(finish, dur + 600);
      });
    };

    if (reduceMotion) {
      nums.forEach((el) => {
        const dec = parseInt(el.dataset.decimals || '0', 10);
        const v = parseFloat(el.dataset.count || '0');
        el.textContent = (dec > 0 ? v.toFixed(dec) : v.toLocaleString('en-IN')) + (el.dataset.suffix || '');
      });
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => entries.forEach((en) => en.isIntersecting && runCounters()),
        { threshold: 0.25 }
      ).observe(ledger);
      window.setTimeout(runCounters, 6000);
    } else {
      runCounters();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     16 · FIRST PAINT SWEEP
     ──────────────────────────────────────────────────────────────────────── */
  window.requestAnimationFrame(() => {
    sweepVisible();
    measureRail();
    measureStrip();
  });
})();
